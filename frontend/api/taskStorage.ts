import Task from "./models/task";
import { storeData, retrieveData } from "./storage";
import { isAnonymous, constants } from "@/constants/constants";
import { getTasksForUser, setCompleted, deleteTask as deleteTaskFromCloud, getTaskItem, updateTask as updateTaskCloud, createTask as createTaskCloud } from "./cloud_ops/tasks";
import { filterOptions } from "./types_and_utils";

export const updateTask = async (email: string, task: Task, isNewTask: boolean = false): Promise<{ ok: boolean, message: string }> => {

    const offline = isAnonymous(email);
    if (offline) {
        const res = await updateLocalTaskList(task);
        return res;
    } else {
        // NOW: ALL TASKS HAVE AN ID, RIGHT? SO 
        const taskID = task.getID();
        const res =
            isNewTask && typeof taskID === "string" ?
                await createTaskCloud(email, task)
                : await updateTaskCloud(email, task, taskID)

        const ok = !res.error
        const message = ok ? "Task Update Successfully In Cloud" : `${task.getID()} ERROR: ${res.error}, MSG: ${res.message}`
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
        if (!res.ok) {
            return { ok: false, message: `${res.message}` }
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

    const taskToUpdateID = task.getID()
    const taskToUpdateIDX = tasks.findIndex(task => {
        const parsedTask = Task.fromObject(task, task.taskID);
        return parsedTask instanceof Task && parsedTask.getID() === taskToUpdateID
    })


    // Update In Place, or Push the task in the array
    if (taskToUpdateIDX >= 0) {
        tasks[taskToUpdateIDX] = newTaskJSON;
    } else {
        // Push new element to the local storage task list
        tasks.push(newTaskJSON);
    }


    const res = await storeData(constants.TASK_LIST, JSON.stringify(tasks))
    if (!res.ok) {
        return { ok: false, message: `${res.message}` }
    } else {
        return { ok: true, message: "Task Updated Successfully" }
    }

}


export const retrieveTasks = async (email: string, completed: boolean = false, filterOption = filterOptions.DATE_EARLIEST) => {

    let final_ret;

    if (isAnonymous(email)) {
        const res = await retrieveLocalStorageTasks(completed, filterOption)
        final_ret = res;

    } else {
        const res = await getTasksForUser(email, completed, filterOption);
        const ok = !(res.error);
        const message = `
            message: ${res.error}
            error: ${res.error}
        `
        const data = res.taskList || []
        final_ret = {
            ok,
            message,
            data
        }
        // return {
        //     ok: ok,
        //     message: message,
        //     data: data,
        // };
    }

    const lst = final_ret.data;
    const expiredTasks: Task[] = lst.filter((task: Task) => task.isExpired())
    const unexpiredTasks: Task[] = lst.filter((task) => !task.isExpired());

    const deleteExpiredRes = await Promise.all(expiredTasks.map(async (task) => {
        return await deleteTask(email, task.getID())
    }))

    const msg = deleteExpiredRes.reduce((acc, res) => {
        const msg = res.ok ? "" : res.message + "\n"
        return acc + msg;
    }, "")

    if (msg.length > 0) {
        return {
            ok: false,
            message: msg,
            data: lst
        }
    } else {
        return {
            ok: true,
            message: "Retrieved Tasks Successfully",
            data: unexpiredTasks
        }
    }
}

export const retrieveLocalStorageTasks = async (completed: boolean | undefined = undefined, filterOption: string = filterOptions.DATE_EARLIEST): Promise<{ ok: boolean, data: Array<Task>, message: string }> => {
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

        storeData(constants.TASK_LIST, JSON.stringify([]))
        return { ok: true, data: [], message: "Task List Initialized" }
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
        await storeData(constants.TASK_LIST, JSON.stringify([]));
        return { ok: true, message: "Task Not Found, Task List is Not an Array", data: null };
    }

    const foundTask = taskList.find((task: Task) => {
        return task.getID() == taskID;
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
            const ok = res.ok;
            const message = ok ? "Task Deleted Successfully" : res.message
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


// Upon registering an account, sync the tasks on local storage to the cloud
export const uploadLocalTasks = async (email: string) => {


    if (isAnonymous(email)) {
        return {
            ok: false,
            error: "Development Error: Anonymous User Can't Upload Habits"
        }
    }

    // retrieve the local task list
    const res = await retrieveLocalStorageTasks();
    const taskList = await res.data;

    if (!res.ok) {
        return { ok: false, message: res.message }
    }

    if (!Array.isArray(taskList)) {
        return { ok: false, message: "Error Uploading Local Tasks: taskList is not an array" }
    }

    const uploads = taskList.map(async (task: Task) => {

        task.clearSharedUsers();
        task.addSharedUser(
            { email: email, role: constants.ROLE.OWNER, joinDate: new Date() }
        )
        const res = await updateTask(email, task, true)
        return res;
    })

    const allTaskUploads = await Promise.all(uploads)

    let msg = '';
    const reduceFctn = (accumulator: string, curr: { ok: boolean, message: string }) => {
        const hasError = !curr.ok
        if (hasError) {
            return accumulator + curr.message + "\n"
        } else {
            return accumulator
        }
    }

    allTaskUploads.reduce(reduceFctn, msg);
    const ok = msg.length == 0;
    if (ok) {
        return { ok: true, message: "All Tasks Uploaded Successfully" }
    } else {
        return { ok: false, message: msg }
    }


    // For each item in the local task list, upload it to the cloud using the function: createTask, given the userID

}