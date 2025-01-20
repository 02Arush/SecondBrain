
// Note: I should be able to add tasks and all that stuff, but
// once I log in, it saves my authorization token to local storage and auto signs in if there exists
// an auth token, otherwise show no habits and than allow me to sign in again

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
    getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
    signInWithEmailAndPassword, signOut, setPersistence, getReactNativePersistence, initializeAuth, deleteUser
} from 'firebase/auth';
import { addDoc, getDocs, getFirestore, query, updateDoc, where, deleteDocs } from 'firebase/firestore'
import { collection, setDoc, doc, getDoc, deleteDoc } from "firebase/firestore";
import Habit from "./habit";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from "react-native";
import Task from "./task";
import { ROLE_POWERS, isAnonymous } from "@/constants/constants";
import { filterOptions, getNicknameFromEmail, habitModificationType, isValidEmail } from "./types_and_utils";
import { sharedItemType } from "./types_and_utils";
import constants from "@/constants/constants";
import { email } from "./types_and_utils";
import { sharedUser } from "./types_and_utils";
import { SharableItem } from "./SharableItem";


const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);


// This is here because on web, the local persistent storage of signed in userrs is handled automatically
// But on mobile devices, ReactNativePersistence using asyncstorage is required
let auth;
if (Platform.OS !== 'web') {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
} else {
    auth = getAuth(app)
}


const db = getFirestore(app);
const collections = {
    habits: collection(db, "habits"),
    tasks: collection(db, "tasks"),
    users: collection(db, "users"),
    invites: collection(db, "invites"),
}


export const attemptLogin = async (email, password) => {
    try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        const user = res.user;
        const userEmail = user.email;
        return { email: userEmail };
    } catch (error) {
        if (error.code === 'auth/invalid-credential') {
            return { error: "Invalid Email and/or Password" }
        } else {
            return { error: error.message }
        }
    }
}



/**
 * 
 * @param {string} email 
 * @param {any} password 
 * @returns 
 */
export const registerAccount = async (email, password) => {
    try {

        // TODO: GET "NICKNAME" AS EMAIL FOLLOWED BY TIMEMILLIS
        const nickname = getNicknameFromEmail(email);

        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        const user = credentials.user;
        const registeredEmail = user.email;


        const docRef = doc(collections.users, email)
        await setDoc(docRef, {
            nickname: nickname,
            createDate: new Date(),

        })

        return { status: 200, message: "User Successfully Registered", email: registeredEmail }

    } catch (err) {
        let errorMessage = "Error";
        switch (err.code) {
            case 'auth/invalid-email': errorMessage = "Please enter a valid email"; break;
            case 'auth/email-already-exists': errorMessage = "This email address is already registered"; break;
            default: errorMessage = err.message; break;
        }
        return { error: err.code, message: errorMessage }
    }
}


export const getSignedInUser = async () => {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userData = await getUserDataFromEmail(user.email);
                    const ret = { email: user.email, ...userData };
                    resolve(ret);
                } catch (err) {
                    reject({ error: err.message });
                }
            } else {
                resolve({ error: "No signed in user" });
            }
        });
    });
};

export const logOut = async () => {
    try {
        signOut(auth).then(() => {
            // Sign-out successful.
            return { message: "Successfully Signed Out" }
        }).catch((error) => {
            // An error happened.
            return { error: error.message }
        });
    } catch (err) {
        return { error: err.message }
    }
}

export const getUserDataFromEmail = async (email) => {
    try {
        const docRef = doc(collections.users, email);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            // ASSURE THAT ALL THE FIELDS I WANT ARE FILLED IN:
            let nickname = userData["nickname"];
            if (!nickname) {
                nickname = getNicknameFromEmail(email);
                const res = await updateUserDoc(docRef, { nickname: nickname });
                if (!res.ok) {
                    return { ok: false, message: "Error getting user data from Email\n" + res.message }
                }
            }

            return { ...userData, nickname: nickname };
        } else {
            return { error: "Error: Habit Data not found for " + email }
        }
    } catch (err) {
        return { error: err.message }
    }
}


/**
 * 
 * @param {string} email 
 * @param {object} updates 
 */
export const updateUserDoc = async (email, updates) => {
    if (isAnonymous(email)) {
        return { ok: false, message: "Anonymous or offline users can not update data in the cloud." }
    }

    try {
        const docRef = doc(collections.users, email);
        await setDoc(docRef, updates, { merge: true })

        return { ok: true, message: `Updated User Document Successfully for email: ${email}` }


    } catch (err) {
        return {
            ok: false,
            message: `Error updating user doc for email: ${email}\nMessage: ${err.message}`
        }
    }

}


export const updateUserHabitCollection = (email, newHabit) => {
    const userHabitCollection = getUserHabitsCollection(email)
}


/**
 * 
 * @param {string} email 
 * @param {string} habitID 
 */
export const getHabitForUser = async (email, habitID) => {
    const docRef = doc(collections.users, "habits", habitID)
    const userHabitDoc = await getDoc(docRef);

    if (!userHabitDoc.exists()) {
        return {
            ok: false, message: `Habit with ID: ${habitID} Not Found For User ${email}`
        }
    }

    const data = userHabitDoc.data();
    const activityLog = data["activityLog"]

    const habit = await getHabitFromID

}

/**
 * 
 * @param {string} email 
 * @param {Habit} habit 
 * @param {habitModificationType } type
 * 
 * EITHER:
 * 1) LOG NEW DATA FOR A USER ON A HABIT
 * 2) MODIFY THE DOCUMENT OF A HABIT, IN ITS OWN COLLECTION
 */
export const updateHabit = async (email, habit, type) => {
    if (type == "log") {
        const res = await logHabitActivity(email, habit);
        return res;

    } else if (type == "modify") {
        const ID = habit.getID();
        const habitDocRef = doc(collections.habits, ID);
        const newHabitJSON = habit.getJSON();

        await setDoc(habitDocRef, newHabitJSON, { merge: true })


        return {
            ok: true,
            message: "Modification Complete"
        }

    } else {
        return {
            ok: false,
            message: `Invalid Habit update type: ${type}`
        }

    }
}

/**
 * 
 * @param {string} email 
 * @param {Habit} habit 
 */
const logHabitActivity = async (email, habit) => {
    try {

        const habitID = habit.getID();
        const userHabitCollection = getUserHabitsCollection(email);
        const userHabitDoc = doc(userHabitCollection, habitID);
        const newActivityLog = habit.getActivityLog();

        await setDoc(userHabitDoc, {
            activityLog: newActivityLog,
        }, { merge: true })

        return { ok: true, message: "Activity log updated." }


    } catch (err) {
        return { ok: false, message: `Error logging habit activity: ${err.message}` }
    }
}

export const changeUserRole = async (email, habit, emailToChange, newRole) => {

}

export const kickUser = async (email, habit, emailToKick) => {

}

export const updateUserHabitList = async (email, habitList) => {
    if (!Array.isArray(habitList)) {
        return { error: `habitList must be of type: Array. Current type: ${typeof habitList}` }
    }

    try {
        const docRef = doc(db, "users", email);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {

            await setDoc(docRef, {
                "habitList": habitList
            }, { merge: true })

            return { ok: true }
        } else {
            return { error: "updateUserHabitList: Document not found" }
        }

    } catch (err) {
        return { error: err.code, message: err.message }
    }
}

export const deleteAccount = async (email, password) => {
    // Ensure recent sign-in to delete properly
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        return { error: err.code, message: err.message };
    }

    const user = auth.currentUser;

    // Ensure the React state auth context email matches the Firebase signed-in email
    if (user.email !== email) {
        return {
            error: `Auth state email doesn't match Firebase email:\nFirebase email: ${user.email}\nAuth-state email: ${email}`
        };
    }
    try {
        // Remove from Firebase Auth
        await deleteUser(user);
        // Remove from Firestore
        const docRef = doc(db, "users", email);
        // TODO: DELETE USER'S TASK COLLECTIN AS WELL
        await deleteDoc(docRef);
        return { ok: true, message: `User deleted: ${email}` };
    } catch (err) {
        return { error: err.code, message: err.message };
    }
};

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
        const docRef = doc(db, "users", email, "tasks", taskID);
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
    const docRef = doc(db, "tasks", taskID)

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
        const taskDocRef = doc(db, "tasks", taskID);
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
 * @param {Habit} habit 
 * POTENTIAL ERROR: ACTIVITY LOGS MIGHT BE SHARED IN THE FUTURE
 */
const createHabitInUserCollection = async (email, habit) => {
    try {
        const habitID = habit.getID()
        // create in users collection
        const usersCollection = getUserHabitsCollection(email);
        const docRef = doc(usersCollection, habitID);
        const dataForUser = {
            userGoal: habit.getGoal()?.JSON() || null,
            activityLog: habit.getActivityLog()
        }
        await setDoc(docRef, dataForUser, { merge: true })
        return {
            ok: true, message: "Added habit to user's collection."
        }

    } catch (err) {
        const message = "Error Creating Habit In User Collection\n" + err.message
        return { ok: false, message }
    }
}

/**
 * 
 * @param {email} email 
 * @param {Task} task 
 */
const createTaskInUserCollection = async (email, task) => {
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
 * @param {string} email
 * @param {Habit} habit 
 * @return {Promise<{ok: boolean, message: string}>}
 */
export const createHabit = async (email, habit) => {
    if (isAnonymous(email)) {
        return { ok: false, message: "Anonymous User Can't Create New Habits In the Cloud" }
    }

    try {

        const userData = await getUserDataFromEmail(email);
        let nickname = userData["nickname"]
        if (!nickname || nickname.length == 0) {
            nickname = getNicknameFromEmail(email);
        }
        const habitID = habit.getID();

        const res = await createHabitInUserCollection(email, habit);
        if (!res.ok) {
            return {
                ok: false,
                message: "Couldn't Create Habit\n" + res.message
            }
        }

        // create in habits collection
        const docRefHabit = doc(collections.habits, habitID);

        const sharedUsers = {
            [email]: { email: email, role: constants.ROLE.OWNER, joinDate: new Date() }
        }

        const docDataHabit = {
            habitName: habit.getName(),
            unit: habit.getUnit(),
            creationDate: habit.getCreationDate(),
            goal: habit.getGoal()?.JSON() || null,
            habitID: habit.getID(),
            sharedUsers: sharedUsers,
        }

        await setDoc(docRefHabit, docDataHabit, { merge: true })
        return {
            ok: true,
            message: `Habit ${habit.getName()
                } created with ID: ${habitID} `
        }

    } catch (err) {
        return {
            ok: false,
            message: `Create Habit: Code: ${err.code}, Message: ${err.message} `
        }
    }

}

/**
 * 
 * @param {string} email 
 */
export const retrieveHabitList = async (email) => {
    if (isAnonymous(email)) {
        return { ok: false, message: "Error retrieving Habit List from Cloud: User is Signed Out" }

    }

    try {
        const userHabitsCollection = getUserHabitsCollection(email);
        const querySnap = await getDocs(userHabitsCollection);
        const ids = querySnap.docs.map(doc => doc.id);
        const getHabits = ids.map(async (id) => {
            const res = await getHabitFromID(email, id);
            if (res.data) {
                return { ok: true, data: res.data, message: "Success" };
            } else {
                return { ok: false, data: null, message: "Error Retrieving Habit List In Cloud\n" + res.message };
            }
        })

        const responses = await Promise.all(getHabits)
        const habits = responses.filter(response => {
            return (response.ok == true && response.data != null);
        }).map(response => {
            return response.data;
        })

        let msg = responses.reduce((acc, response) => {
            if (!response.ok) {
                return acc + `${response.message} \n`;
            } else {
                return acc;
            }
        }, "");

        if (msg.length > 0) {
            return { ok: false, message: msg }
        }

        return { ok: true, message: "Retrieved Docs", data: habits }


    } catch (err) {
        return { ok: false, message: `ERROR: ${err.message} `, data: null }

    }
}

/**
 * 
 * @param {string} email 
 * @param {string} habitID 
 * 
 */
export const retrieveActivityLogForUser = async (email, habitID) => {

    if (isAnonymous(email)) {
        return {
            ok: false,
            message: "Can not retrieve activity log for user, since user is either offline or not signed in.",
            data: new Map(),
        }
    }


    try {
        const habitCollection = getUserHabitsCollection(email);
        const docRef = doc(habitCollection, habitID);
        const habitDoc = await getDoc(docRef);
        const data = habitDoc.data();
        const activityLog = data["activityLog"];

        return { ok: true, data: activityLog, message: "Successfully retrieved user activities" }
    } catch (err) {
        return { ok: false, message: `ERROR Retrieving Activity Log: ${err.message} `, data: new Map() }
    }
}



/**
 * @param {string} email
 * @param {string} habitID
 */
export const getHabitFromID = async (email, id) => {
    try {

        const habitCollection = collections.habits;
        const docRef = doc(habitCollection, id);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();



        const getActLog = await retrieveActivityLogForUser(email, id);
        const activityLog = getActLog.data
        // ERROR SOMEWHERE HERE: CAN NOT CONVERT UNDEFINED OR NULL TO OBJECT
        const habitJSON = { ...data, activityLog }
        const habit = Habit.parseHabit(habitJSON)
        habit.ensureOwnerExists();

        return { ok: true, message: "Retrieved Successfully", data: habit }

    } catch (err) {
        return { ok: false, message: `${err.message} ` }

    }
}
/**
 * 
 * @param {string} email 
 * @param {Habit} habit 
 */
export const deleteHabit = async (email, habit) => {
    if (isAnonymous(email)) {
        return { ok: false, message: "Error Deleting Habit from Cloud: User Not Signed In." }
    }

    try {
        const id = habit.getID();

        // First, delete it from the user's habit Array
        const habitCollectionForUser = getUserHabitsCollection(email)
        const docToDelete = doc(habitCollectionForUser, id);
        await deleteDoc(docToDelete);

        // Now, remove the user from the sharedUsers array in habit


        habit.removeSharedUser(email);
        if (Object.keys(habit.getSharedUsers()).length <= 0) {
            const habitDocToDel = doc(collections.habits, id);
            await deleteDoc(habitDocToDel);
        } else {

            const sharedUsers = habit.getSharedUsers();
            const docRef = doc(collections.habits, id);
            await updateDoc(docRef, { sharedUsers: sharedUsers })

        }

        return { ok: true, message: `Successfully Deleted Habit: ${habit.getName()} ` }

    } catch (err) {
        return {
            ok: false,
            message: `Error Deleting Habit: ${habit} for Email: ${email}. ERROR MESSAGE: ${err.message} `
        }
    }
}

const getUserHabitsCollection = (email) => {
    return collection(collections.users, email, 'habits')
}

const getUserTasksCollection = (email) => {
    return collection(collections.users, email, "tasks");
}



/**
 * @param {Task | Habit} item
 */
export const getSharedUsersForItem = async (item) => {
    if (!item) {
        return {
            ok: false,
            message: "Item is undefiend",
            data: {}
        }
    }

    const itemType = item instanceof Habit ? "habit" : "task";
    const ID = item instanceof Habit ? item.getID() : item.getID();

    const collectionToQuery = itemType == "habit" ? collections.habits : collections.tasks;
    const itemDocRef = doc(collectionToQuery, ID);

    const docSnap = await getDoc(itemDocRef);

    if (!docSnap.exists()) {
        return { ok: false, message: `Error Getting Shared Users.Doc with ${itemType} ID: ${ID} does not exist.` }
    }

    const itemData = docSnap.data();
    const sharedUsers = itemData["sharedUsers"];

    if (Array.isArray(sharedUsers)) {
        const sharedMap = {};
        sharedUsers.forEach((sharedUser) => {
            const { email } = sharedUser;
            sharedMap[email] = sharedUser;
        })

        await setDoc(itemDocRef, {
            sharedUsers: sharedMap
        }, { merge: true })

        return getSharedUsersForItem(ID);

    }

    if (sharedUsers) {

        return { ok: true, message: `Retrieved Shared Users for ${itemType}: ${ID} `, data: sharedUsers }
    } else {
        return { ok: false, message: `Shared Users does not exist for ${itemType}: ${ID} ` }
    }
}

/**
 * 
 * @param {string} habitID 
 */
export const getSharedUsersForHabit = async (habitID) => {
    const habitDocRef = doc(collections.habits, habitID);
    const docSnap = await getDoc(habitDocRef);

    if (!docSnap.exists()) {
        return { ok: false, message: `Error Getting Shared Users.Doc with habit ID: ${habitID} does not exist.` }
    }

    const habitData = docSnap.data();
    const sharedUsers = habitData["sharedUsers"];

    if (Array.isArray(sharedUsers)) {
        const sharedMap = {};
        sharedUsers.forEach((sharedUser) => {
            const { email } = sharedUser;
            sharedMap[email] = sharedUser;
        })

        await setDoc(habitDocRef, {
            sharedUsers: sharedMap
        }, { merge: true })

        return getSharedUsersForHabit(habitID);

    }

    if (sharedUsers) {

        return { ok: true, message: `Retrieved Shared Users for habit: ${habitID} `, data: sharedUsers }
    } else {
        return { ok: false, message: `Shared Users does not exist for habit: ${habitID} ` }
    }
}

/**
 * 
 * @param {string} taskID 
 */
export const getSharedUsersForTask = async (taskID) => {
    const taskDocRef = doc(collections.tasks, taskID);
    const docSnap = await getDoc(taskDocRef);
    if (!docSnap.exists()) {
        return { ok: false, message: `Error Getting Shared Users.Doc with Task ID: ${taskID} does not exist.` }
    }



}

/**
 * 
 * @param {string} sender
 * @param {string} recipient
 * @param {SharableItem} sharedItem 
 * @param {string?} role
 */

export const createInvite = async (sender, recipient, sharedItem, role = constants.ROLE.MEMBER) => {
    try {

        let emailErrMsg = "";
        if (!isValidEmail(sender)) {
            emailErrMsg += "Invalid Email: " + sender + "\n";
        }

        if (!isValidEmail(recipient)) {
            emailErrMsg += "Invalid Email: " + recipient + "\n";
        }

        if (emailErrMsg.length > 0) {
            return {
                ok: false,
                error: emailErrMsg,
            }
        }

        let ID;
        let name;
        if (sharedItem instanceof Habit) {
            const habit = sharedItem;
            ID = habit.getID();
            name = habit.getName();

        } else {
            const task = sharedItem;
            ID = task.getID();
            name = task.getName();
        }


        const invitesCollection = getUserInvitesCollection(recipient);
        const itemType = sharedItem instanceof Habit ? "habit" : "task"

        const docRef = doc(invitesCollection, ID);

        const inviteInfo = {
            sender: sender,
            recipient: recipient,
            itemType: itemType,
            itemName: name,
            itemID: ID,
            role: role,
        }


        await setDoc(docRef, inviteInfo);

        // Add the invite to the OVERALL invites collection using the ID
        addDoc(collections.invites, inviteInfo);

        return {
            ok: true,
            message: "Successfully Invited User"
        }

    } catch (err) {
        return {
            ok: false,
            message: `Failed to create Invite\n` + err.message
        }
    }
}

/**
 * @param {email} recipient
 * @param {string} inviteID
 * @param {"accept" | "reject"} actionType
 */
export const invitationAction = async (recipient, inviteID, actionType) => {
    const invitesCollection = getUserInvitesCollection(recipient);
    const inviteDoc = doc(invitesCollection, inviteID)
    const inviteDocSnap = await getDoc(inviteDoc);

    if (!inviteDocSnap.exists()) {
        return {
            ok: false,
            message: "Action rejected: invite ID not found."
        }
    }

    const itemData = inviteDocSnap.data();
    const { itemType, itemID, role } = itemData;

    if (actionType == "accept") {
        if (itemType == "habit") {
            const habitID = itemID;

            const habitRes = await getHabitFromID(recipient, habitID);
            if (!habitRes.ok || !habitRes.data) {
                return {
                    ok: false,
                    message: "Habit not found with ID " + habitID
                }
            }

            const habit = habitRes.data;
            habit.addSharedUser({
                email: recipient,
                joinDate: new Date(),
                role: role
            })

            /*This is here because we changed the sharedUsers field to the habit, so we must ensure the modification
             Takes place in the database
             */
            let message = "Error Accepting Invite For Habit\n";
            const updateRes = await updateHabit(recipient, habit, "modify")
            message += updateRes.message + "\n";

            // Add the Habit to the recipient's habit collection
            const userCollectionRes = await createHabitInUserCollection(recipient, habit);
            message += userCollectionRes.message + "\n";

            if (!updateRes.ok || !userCollectionRes.ok) {
                return {
                    ok: false, message: message
                }
            }


        } else if (itemType == "task") {
            const taskID = itemID;
            const taskRes = await getTaskItem(recipient, taskID);

            if (!taskRes instanceof Task) {
                return {
                    ok: false,
                    error: "Error Accepting Invite\n" + taskRes.error
                }
            }
            const task = taskRes;
            task.addSharedUser({
                email: recipient,
                role: constants.ROLE.MEMBER,
                joinDate: new Date(),
            })

            let message = "Error Accepting Invite For Habit\n";
            const taskUpdateRes = await updateTask(recipient, task, task.getID());
            message += taskUpdateRes.message + "\n";

            // Add the Task to the recipient's task collection
            const taskCollectionRes = await createTaskInUserCollection(recipient, task);
            message += taskCollectionRes.message + "\n";

            if (!taskCollectionRes.ok || !taskCollectionRes.ok) {
                return {
                    ok: false, message: message
                }
            }


        } else {
            return {
                ok: false,
                message: "itemType must be 'habit' or 'task'"
            }

        }
        // update shared user for habit or task, and remove the invite from the invites collection
    }

    const delRes = await deleteInvite(recipient, inviteID);
    if (!delRes.ok) {
        return {
            ok: false,

            message: "Invite Action Error\n" + delRes.message
        }
    }

    return {
        ok: true,
        message: "Invite status: " + actionType + " Success"
    }

}

/**
 * @param {string} recipient 
 */
export const getUserInvitesCollection = (recipient) => {
    return collection(collections.users, recipient, "invites");
}

/**
 * @param {string} recipient 
 * @param {string} inviteID 
 */
export const deleteInvite = async (recipient, inviteID) => {
    try {
        if (!recipient || !inviteID) {
            throw new Error("Invalid recipient or inviteID provided.");
        }

        // Get the specific invite document for the user and delete it
        const invitesCollection = getUserInvitesCollection(recipient);
        const docRef = doc(invitesCollection, inviteID);
        await deleteDoc(docRef);

        // Query and delete related invites from the global collection
        const q = query(
            collections.invites,
            where("recipient", "==", recipient),
            where("itemID", "==", inviteID)
        );

        // Fetch the matching documents and delete them
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(docSnapshot.ref));
        await Promise.all(deletePromises);

        return { ok: true, message: "Invite deleted successfully." };
    } catch (err) {
        return {
            ok: false,
            message: `Error deleting invite: ${err.message}`,
        };
    }
};


/**
 * 
 * @param {string} email 
 */
export const getInvitesForUser = async (email) => {
    let data = [];
    if (isAnonymous(email)) {
        return {
            ok: false,
            data,
            message: "Anonymous users have no invites"
        }
    }

    const invitesCollection = getUserInvitesCollection(email);
    const inviteDocs = await getDocs(invitesCollection);
    const invites = inviteDocs.docs.map(doc => doc.data())
    data = invites;

    return {
        ok: true,
        data: data,
        message: "Retrieved Invitations"
    }

}

/**
 *  * @param {email} signedInUser
 * @param {email} modifiedUser
 * @param {string} newRole
 * @param {SharableItem} item
 */

export const changeRoleOfUser = async (signedInUser, modifiedUser, newRole, item) => {

    // This is here to ensure that the user has proper permissions
    const signedInUserRole = item.getRoleOfUser(signedInUser).data;
    const modifiedUserRole = item.getRoleOfUser(modifiedUser).data;

    if (ROLE_POWERS[newRole] > ROLE_POWERS[signedInUserRole]) {
        return {
            ok: false,
            message: `As a ${signedInUserRole}, you can not change a user to the role ${newRole} because that role is of higher rank than your own. `
        }
    }

    const userRoleHighEnough = ROLE_POWERS[signedInUserRole] > ROLE_POWERS[modifiedUserRole]
    const userIsOwner = signedInUserRole == constants.ROLE.OWNER

    if (!(userRoleHighEnough || userIsOwner)) {
        return {
            ok: false,
            message: `You do not have the power to complete this operation.\n
            Your role: ${signedInUserRole.toUpperCase()}, ${modifiedUser} 's role: ${modifiedUserRole.toUpperCase()}`
        }
    }

    // At this point, we've established that the user is of high enough position to complete the operation
    if (item instanceof Habit) {
        const res = await changeUserHabitRole(signedInUser, modifiedUser, newRole, item);
        return res;
    } else {
        const res = await changeUserTaskRole(signedInUser, modifiedUser, newRole, item);
        return res;
    }

}

/**
 * @param {email} signedInUser
 * @param {email} modifiedUser
 * @param {string} newRole
 * @param {Habit} habit
 * 
 * TODO: change HABIT to HABIT || TASK
 */
export const changeUserHabitRole = async (signedInUser, modifiedUser, newRole, habit) => {


    if (newRole == constants.ROLE.NONE) {
        const res = await deleteHabit(modifiedUser, habit)
        if (!res.ok) {
            return { ok: false, message: "Unable to remove from habit:\n" + res.message }
        } else {

            return { ok: true, message: "Successfully removed user from habit" }
        }
    }

    const roleChanged = habit.changeRoleOfUser(modifiedUser, newRole)
    const newRoleOfUserRes = habit.getRoleOfUser(modifiedUser);
    const newRoleOfUser = newRoleOfUserRes.data;


    if (!roleChanged) {
        if (newRoleOfUser.localeCompare(constants.ROLE.OWNER) == 0) {
            return { ok: true, message: "Could not update role of user. Habit needs at least one OWNER." }
        } else {
            return { ok: true, message: "User role stayed the same." }
        }
    }

    const res = await updateHabit(signedInUser, habit, "modify");
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
 * @param {SharableItem} item 
 */
export const getInvitesForItem = async (item) => {
    try {
        const ID = item.getID();

        const q = query(
            collections.invites,
            where("itemID", "==", ID)
        )

        const res = await getDocs(q);
        const docs = res.docs.map(doc => {
            const inviteID = doc.id;
            const inviteData = { ...doc.data() }
            return {
                inviteID,
                ...inviteData
            }

        })

        return {
            ok: true,
            message: "Successfully Retrieved Invites",
            data: docs,
        }

    } catch (err) {
        return {
            ok: false,
            message: `Error Getting Invites For Item with ID: ${item.getID()}]\n${err.message}`,
            data: [],
        }
    }

}