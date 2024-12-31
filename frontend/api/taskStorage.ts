import Task from "./task";
import { storeData, retrieveData } from "./storage";
import { isAnonymous, constants } from "@/constants/constants";
import { getTasksForUser } from "./db_ops";
import { filterOptions } from "./types_and_utils";

export const updateTask = async (task: Task, email: String): Promise<{ ok: boolean, message: string }> => {

    const offline = isAnonymous(email);

    if (offline) {
        const res = await updateLocalTaskList(task);
        return res;
    } else {
        // Online: Create the task if it doesn't exist, OR update task?


    }

    return { ok: false, message: "NOT YET IMPLEMENTED" }
    // This function is meant to first: if online, update it in the cloud. If TASK NOT FOUND, INSERT IT. OTHERWISE, MODIFY IT TO NEW TASK
    // If offline: IF NOT FOUND, INSERT IT. IF IT IS FOUND, THAN UPDATE IT.

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
        const res = await retrieveLocalStorageTasks()


        return res;

    } else {
        const res = await getTasksForUser(email, completed, filterOption);
        const ok = !(res.error);
        const message = `
            message: ${res.error}
            error: ${res.error}
        `
        const data = res.taskList


        return {
            ok: ok,
            message: message,
            data: data,
        };
    }

}

export const retrieveLocalStorageTasks = async (completed: boolean = false, filterOption: string = filterOptions.DATE_EARLIEST): Promise<{ ok: boolean, data: any, message: string }> => {

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
                return task !== null;
            }
        )



        return {
            ok: true,
            data: filteredTasks,
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