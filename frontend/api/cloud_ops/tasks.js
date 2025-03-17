

import { addDoc, getDocs, query, updateDoc, where, deleteDocs } from 'firebase/firestore'
import { collection, setDoc, doc, getDoc, deleteDoc } from "firebase/firestore";
import Task from '@/api/models/task'
import { ROLE_POWERS, isAnonymous } from "@/constants/constants";
import { filterOptions, getNicknameFromEmail, habitModificationType, isValidEmail, email, sharedItemType } from "@/api/types_and_utils";
import constants from "@/constants/constants";
import { collections } from '@/api/db_ops';


/**
 * 
 * @param {string} email 
 * @param {Task} task 
 */
export const createTask = async (email, task) => {
    if (isAnonymous(email)) {
        return { error: "Not signed in: Anonymous user cannot create tasks" };
    }

    if (!(task instanceof Task)) {
        return { error: "Task provided is not a Task object. Type: " + typeof task };
    }

    // First: Add the document to the tasks collection
    try {

        const taskID = task.getID()
        const res = await updateTask(email, task, taskID)

        if (!res.ok) {
            return {
                ok: false,
                message: `Err: ${res.error}, ${res.message}`
            }
        }

        // Add document to user-specific subcollection with the key = taskID
        const docRef = doc(collections.users, email, "tasks", taskID);
        await setDoc(docRef, {
            userPriority: task.getImportance(),
        });
        return { ok: true };

    } catch (err) {
        return { error: err.code, message: err.message };
    }
};

/**
 * @param {string} email
 * @param {Task} task
 * @param {string} taskID
 */

// PROBLEM HERE: UPDATE TASK CALLED UPDATES IT IN THE TASKS COLLECTION BUT NOT IN USERS TASK ARRAY
export const updateTask = async (email, task, taskID) => {
    const docRef = doc(collections.tasks, taskID)

    try {
        const res = await setDoc(docRef, task.getJSON(), { merge: true })

        return { ok: true, message: "Task Updated Successfully" }

    } catch (error) {
        return { ok: false, error: error.code, message: error.message }
    }
}

/**
 * @param {string} email - user's email
 * @param {boolean | undefined} completed - if completed is true, it gets all completed tasks. if completed is false, it gets task documents where completed=false || completed=null
 * @param {string} [sort] - This is the type of sort that will be done on the return value of the task list
 * 
 */

// WORK IN PROGRESS
// FUTURE IMPLEMENTATION: IF A TASK ID FROM USER'S TASK COLLECTION IS NOT FOUND IN THE MAIN TASK COLLECTION, REMOVE IT FROM USER'S TASK COLLECTION AND PROCEED
export const getTasksForUser = async (email, completed, sort) => {
    if (typeof email !== "string") return { error: "Email must be of type string: type " + typeof email }
    if (completed !== undefined && typeof completed !== "boolean") return { error: "completed field must be boolean or undefined. Type: " + typeof completed };
    if (sort) {
        const allFilterOptions = new Set(Object.values(filterOptions))
        if (!allFilterOptions.has(sort)) return { error: "invalid sort parameter. Must be in: " + JSON.stringify(allFilterOptions) }

    }
    try {

        let tasksQuery;
        const userTaskIDs = collection(collections.users, email, "tasks")
        tasksQuery = query(userTaskIDs);
        const querySnap = await getDocs(tasksQuery)
        let taskIDs = querySnap.docs.map(doc => doc.id);

        /**
         * This nested function is necessary because typescript has trouble respecting the "filter" in javascript files so I have to
         * explicitly put it into a function and use JSDoc to confirm the type
         * @param {Array} taskIDs -
         * @returns {Promise<Array<Task>>} - Array of tasks
         */



        const getTaskList = async () => {
            let taskList = await Promise.all(taskIDs.map(async (id) => {

                const task = await getTaskItem(email, id);
                if (task instanceof Task) {
                    const taskCompleted = task.getCompleted();
                    if (completed !== undefined && typeof completed == "boolean") {
                        if (completed === true && taskCompleted === true) return task
                        if (completed === false && taskCompleted === false || isNaN(taskCompleted)) return task;
                        return null;
                    } else {
                        return task
                    }
                } else {
                    return null;
                }
            }))

            taskList = taskList.filter(task => task !== null && task instanceof Task);
            // now we sort the task list by sort, and if sort exists, that it is valid
            if (sort) {
                taskList = Task.sortTaskList(taskList, sort);
            }



            return taskList;
        }
        return { taskList: await getTaskList() }
    } catch (err) {
        return { error: err.code, message: err.message }
    }
}


/**
 * @param {string} email 
 * @param {string} taskID 
 * @returns {Promise<Task | {error} >} 
 */
export const getTaskItem = async (email, taskID) => {
    try {
        const taskCollection = collections.tasks;
        const docRef = doc(taskCollection, taskID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const task = Task.fromObject(data, taskID);
            if (task) {
                return task;
            } else {
                return { error: "Task Object Could Not be Parsed " + JSON.stringify(data) }
            }
        } else {
            return { error: "Task ID Does Not Exist in Tasks Collection" }
        }

    } catch (err) {
        return { error: err.code }
    }
}


// FUTURE IMPLEMENTATION:
// IF USER IS ADMIN, SET TASK AS COMPLETED FOR ALL USERS
// IF USER IS STANDARD, USER ONLY SETS COMPLETED FOR SELF

// CURRENT IMPLEMENTATION: ANY USER CAN DECIDE TO CHECK A TASK AS COMPLETED
/**
 * 
 * @param {string} email 
 * @param {string} taskID 
 * @param {boolean} completedStatus 
 */
export const setCompleted = async (email, taskID, completedStatus = True) => {


    try {
        const taskDocRef = doc(collections.tasks, taskID);
        await setDoc(taskDocRef, {
            completed: completedStatus,
            lastCompletionDate: completedStatus == true ? new Date() : null,
        }, { merge: true })

        return { ok: true }

    } catch (err) {
        return { error: err.code, message: err.message }
    }
}

// Currently: any user that a task is shared with can permanently delete a task
// FUTURE IMPLEMENTATION: DELETE DOCUMENT FOR ALL SHARED USERS

/**
 * 
 * @param {string} email 
 * @param {taskID} string
 * @returns 
 */
export const deleteTask = async (email, taskID) => {

    try {
        // delete task from user's task collection
        const userTaskCollection = collection(collections.users, email, "tasks");
        const docInUserTasksRef = doc(userTaskCollection, taskID);
        const docInTasksRef = doc(collections.tasks, taskID);


        // also delete task from tasks collection

        const taskDocSnap = await getDoc(docInTasksRef);
        if (taskDocSnap.exists()) {
            const task = Task.fromObject(taskDocSnap.data(), taskID);
            const roleRes = task.getRoleOfUser(email);
            const roleFound = roleRes.ok;
            if (!roleRes.ok) {
                return {
                    ok: false,
                    message: "Email Not Found in Shared Users Task: " + email
                }
            }



            const role = roleRes.data;

            const isOwner = role.localeCompare(constants.ROLE.OWNER) == 0;
            if (isOwner) {
                const sharedUsers = task.getSharedUsers();
                const emails = Object.keys(sharedUsers)
                const deletionResponses = await Promise.all(emails.map(async (email) => {
                    const deleteRes = await deleteTaskDocForIndividual(email, taskID);
                    return deleteRes;
                }))

                const errMsg = deletionResponses.reduce((message, res) => {
                    if (!res.ok) {
                        return message + "\n" + res.message;
                    } else {
                        return message;
                    }
                }, "");

                await deleteDoc(doc(collections.tasks, taskID));

                const ok = errMsg.length === 0;
                // TODO: TASK DELETION AS EMAIL NOT WORKING
                const message = ok ? "Task Delete Success" : "Task Delete Error\n" + errMsg;
                return { ok, message }


            } else {

                const res = await deleteTaskDocForIndividual(email, taskID);
                const ok = res.ok;
                const message = res.ok ? "Successfully Deleted Task" : "Error Deleting Task\n" + res.message;
                return { ok, message }
            }
        }

        return { ok: true, message: "Successfully Deleted Task" }

    } catch (err) {
        return { ok: false, error: err.code, message: err.message }
    }
}

/**
 * 
 * @param {string} email 
 * @param {string} taskID 
 */
const deleteTaskDocForIndividual = async (email, taskID) => {
    try {

        const docRef = doc(collections.users, email, "tasks", taskID);
        await deleteDoc(docRef);
        const taskDocRef = doc(collections.tasks, taskID);
        const taskDocSnap = await getDoc(taskDocRef);
        if (taskDocSnap.exists()) {
            const sharedUsers = taskDocSnap.data()["sharedUsers"];
            delete sharedUsers[email];
            await updateDoc(taskDocRef, {
                sharedUsers
            }, { merge: false })

        } else {
            return { ok: false, message: "Task not found in tasks collection " + taskID };
        }


        return {
            ok: true, message: "Task Deleted"
        }

        // Remove shared users from task in the cloud

    } catch (err) {
        return { ok: false, message: err.message }
    }

}



/**
 * 
 * @param {email} email 
 * @param {Task} task 
 */
export const createTaskInUserCollection = async (email, task) => {
    try {
        const taskID = task.getID();
        const userTasks = getUserTasksCollection(email);
        const docRef = doc(userTasks, taskID);
        const dataForUser = {
            userPriority: task.getImportance(),
        }
        await setDoc(docRef, dataForUser, { merge: true })
        return {
            ok: true, message: "Added task to user's collection."
        }


    } catch (err) {
        const message = "Error Creating Task In User Collection\n" + err.message
        return { ok: false, message }
    }
}




/**
 * @param {email} signedInUser
 * @param {email} modifiedUser
 * @param {string} newRole
 * @param {Task} task
 */
export const changeUserTaskRole = async (signedInUser, modifiedUser, newRole, task) => {

    if (newRole == constants.ROLE.NONE) {
        const res = await deleteTaskDocForIndividual(modifiedUser, task.getID())
        if (!res.ok) {
            return { ok: false, message: "Unable to remove from Task:\n" + res.message }
        } else {

            return { ok: true, message: `Successfully removed user: ${modifiedUser} from Task: ${task.getName()}` }
        }
    }


    const roleChanged = task.changeRoleOfUser(modifiedUser, newRole)
    const newRoleOfUserRes = task.getRoleOfUser(modifiedUser);
    const newRoleOfUser = newRoleOfUserRes.data;


    if (!roleChanged) {
        if (newRoleOfUser.localeCompare(constants.ROLE.OWNER) == 0) {
            return { ok: true, message: "Could not update role of user. Habit needs at least one OWNER." }
        } else {
            return { ok: true, message: "User role stayed the same." }
        }
    }

    const res = await updateTask(modifiedUser, task, task.getID());
    if (res.ok) {
        return {
            ok: true,
            message: `Successfully Changed ${modifiedUser}'s role to ${newRole}`
        }

    } else {
        return {
            ok: false,
            message: "Failed to modify user role.\n" + res.message
        }
    }

}


/**
 * 
 * @param {email} email 
 * @returns 
 */
const getUserTasksCollection = (email) => {
    return collection(collections.users, email, "tasks")
}