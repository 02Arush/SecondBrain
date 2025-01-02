import Task from "./task";
import { storeData, retrieveData } from "./storage";
import { isAnonymous, constants } from "@/constants/constants";
import { getTasksForUser, setCompleted, deleteTask as deleteTaskFromCloud, getTaskItem, updateTask as updateTaskCloud, createTask as createTaskCloud } from "./db_ops";
import { filterOptions } from "./types_and_utils";

export const updateTask = async (email: string, task: Task, isNewTask: boolean = false): Promise<{ ok: boolean, message: string }> => {

    const offline = isAnonymous(email);
    if (offline) {
        const res = await updateLocalTaskList(task);
        return res;
    } else {
        // NOW: ALL TASKS HAVE AN ID, RIGHT? SO 
        const taskID = task.getTaskID();
        const res =
            isNewTask && typeof taskID === "string" ?
                await createTaskCloud(email, task)
                : await updateTaskCloud(email, task, taskID)

        const ok = !res.error
        const message = ok ? "Task Update Successfully In Cloud" : `ERROR: ${res.error}, MSG: ${res.message}`
        return { ok, message }


    }
}

// Updates local storage task list with new task. If task doesn't exist, it adds it. If it does exist, it inserts it.
export const updateLocalTaskList = async (task: Task): Promise<{ ok: boolean, message: string }> => {
    const currTasks = await retrieveData(constants.TASK_LIST);

    const newTaskJSON = task.getJSON()

    if (!currTasks || (typeof currTasks === "object" && currTasks.error)) {
        // If currTasks Array isn't created, it should be created.
        const tasks = JSON.stringify([]);
        const res = await storeData(constants.TASK_LIST, tasks);
        if (res.error) {
            return { ok: false, message: `${res.error}` }
        }
    }

    // SO CURR TASKS DOES EXIST?

    if (!(typeof currTasks === "string")) {
        const type = typeof currTasks
        const isArray = Array.isArray(currTasks);
        const object = typeof currTasks == "object" ? JSON.stringify(currTasks) : null;

        return { ok: false, message: `Task Retrieval from local storage error. Contact Support. Current type: ${type}, is Array: ${isArray}, Object Data: ${object} ` }
    }

    const tasks = JSON.parse(currTasks);
    // We now have an array of tasks

    if (!Array.isArray(tasks)) {
        return { ok: false, message: "Task Retrieval from local storage error. Tasks is Not an Array. Contact Support" }
    }

    const taskToUpdateID = task.getTaskID()
    const taskToUpdateIDX = tasks.findIndex(task => {
        const parsedTask = Task.fromObject(task, task.taskID);
        return parsedTask instanceof Task && parsedTask.getTaskID() === taskToUpdateID
    })


    // Update In Place, or Push the task in the array
    if (taskToUpdateIDX >= 0) {
        tasks[taskToUpdateIDX] = newTaskJSON;
    } else {
        // Push new element to the local storage task list
        tasks.push(newTaskJSON);
    }


    const res = await storeData(constants.TASK_LIST, JSON.stringify(tasks))
    if (res.error) {
        return { ok: false, message: `${res.error}` }
    } else {
        return { ok: true, message: "Task Updated Successfully" }
    }

}


export const retrieveTasks = async (email: string, completed: boolean = false, filterOption = filterOptions.DATE_EARLIEST) => {
    if (isAnonymous(email)) {
        const res = await retrieveLocalStorageTasks(completed, filterOption)
        return res;

    } else {
        const res = await getTasksForUser(email, completed, filterOption);
        const ok = !(res.error);
        const message = `
            message: ${res.error}
            error: ${res.error}
        `
        const data = res.taskList || []
        return {
            ok: ok,
            message: message,
            data: data,
        };
    }
}

export const retrieveLocalStorageTasks = async (completed: boolean | undefined = undefined, filterOption: string = filterOptions.DATE_EARLIEST): Promise<{ ok: boolean, data: any, message: string }> => {
    const taskJSONS = await retrieveData(constants.TASK_LIST);
    if (typeof taskJSONS === "string") {

        const taskObjArray = JSON.parse(taskJSONS);
        const tasks = taskObjArray.map(
            (task: any) => {
                return Task.fromObject(task, task.taskID)
            }
        )

        const filteredTasks: Task[] = tasks.filter(
            (task: any) => {
                const exists = task != null;
                const matchCompleted =
                    completed != undefined ?
                        task?.completed == completed : true

                return exists && matchCompleted;
            }
        )

        const sortedTaskList = Task.sortTaskList(filteredTasks, filterOption)

        return {
            ok: true,
            data: sortedTaskList,
            message: "Tasks Retrieved Successfully from Local Storage"
        }

    } else {

        const errMsg = `ERR: ${taskJSONS?.error} // Error Retrieving Local Tasks`
        return {
            ok: false,
            data: null,
            message: errMsg
        }
    }
}


export const getTask = async (email: string, taskID: string): Promise<{ ok: boolean, data: any, message: string }> => {

    if (isAnonymous(email)) {
        const res = await getTaskFromLocalStorage(taskID)
        return res;
    } else {
        const res = await getTaskItem(email, taskID)
        if (res instanceof Task) {
            return { ok: true, data: res, message: "Task Retrieved Successfully" }

        } else {
            return { ok: false, data: null, message: res.error }
        }
    }

}

export const getTaskFromLocalStorage = async (taskID: string): Promise<{ ok: boolean, message: string, data: any }> => {

    const res = await retrieveLocalStorageTasks();
    if (!res.ok) {
        return { ok: false, message: res.message, data: null }
    }

    const taskList = res.data;

    if (!Array.isArray(taskList)) {
        storeData(constants.TASK_LIST, JSON.stringify([]));
        return { ok: true, message: "Task Not Found, Task List is Not an Array", data: null };
    }

    const foundTask = taskList.find((task: Task) => {
        return task.getTaskID() == taskID;
    })


    if (foundTask) {
        return {
            ok: true,
            message: "Task Found Successfully",
            data: foundTask

        }
    } else {
        return {
            ok: false,
            message: "Task Not Parsed Properly",
            data: null,
        }
    }



}

export const deleteTask = async (email: string, taskID: string): Promise<{ ok: boolean, message: string }> => {

    if (isAnonymous(email)) {

        const taskList = await retrieveData(constants.TASK_LIST)
        if (!(typeof taskList == "string")) {
            return { ok: false, message: "No Task List Found In Local Storage" }
        }

        const parsedTaskList = JSON.parse(taskList);

        // Doing this because if parsedTaskList happens to not be an array, make it a new, empty array
        if (!Array.isArray(parsedTaskList)) {
            const res = await storeData(constants.TASK_LIST, JSON.stringify([]));
            return { ok: true, message: "Re-Initialized Task List" }
        }

        const idxToRm = parsedTaskList.findIndex((task: any) => {
            return task?.taskID == taskID;
        })

        if (idxToRm < 0) {
            return { ok: false, message: "Task Not Found with ID: " + taskID }
        } else {
            parsedTaskList.splice(idxToRm, 1);
            const res = await storeData(constants.TASK_LIST, JSON.stringify(parsedTaskList))
            const ok = !res.error
            const message = ok ? "Task Deleted Successfully" : res.error
            return {
                ok: ok,
                message: `${message}`
            }
        }

    } else {
        const res = await deleteTaskFromCloud(email, taskID)
        const ok = res.ok
        const message = typeof res.message == "string" ? res.message : "No Message"

        return {
            ok: ok,
            message: message
        }
    }
}

export const setCompletedStatus = async (email: string, taskID: string, completedStatus: boolean): Promise<{ ok: boolean, message: string }> => {
    if (isAnonymous(email)) {
        const res = await getTaskFromLocalStorage(taskID);
        const task = res.data

        if (task instanceof Task) {
            task.setCompleted(completedStatus);
            const res = await updateLocalTaskList(task);
            if (res.ok) {
                return {
                    ok: true,
                    message: "Task Set Completed Successfully"
                }
            } else {
                return {
                    ok: false,
                    message: res.message
                }
            }

        } else {
            return { ok: false, message: "Failed to set Completed Status. The task ID could not be found in local storage" }

        }

    } else {
        const res = await setCompleted(email, taskID, completedStatus);
        const ok = !res.error
        const message = `${res.message}, ${res.error}`
        return { ok, message }
    }

}