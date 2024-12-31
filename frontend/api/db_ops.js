
// Note: I should be able to add tasks and all that stuff, but
// once I log in, it saves my authorization token to local storage and auto signs in if there exists
// an auth token, otherwise show no habits and than allow me to sign in again

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, setPersistence, getReactNativePersistence, initializeAuth, deleteUser } from 'firebase/auth';
import { addDoc, getDocs, getFirestore, query, where } from 'firebase/firestore'
import { collection, setDoc, doc, getDoc, deleteDoc } from "firebase/firestore";
import Habit from "./habit";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from "react-native";
import Task from "./task";
import { isAnonymous } from "@/constants/constants";
import { HabitGoal } from "./habit";
import { filterOptions } from "./types_and_utils";


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

export const registerAccount = async (email, password) => {
    try {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        const user = credentials.user;

        // Add dummy data to firestore
        await setDoc(doc(db, 'users', user.email), {
            habitList: [],
        })

        return { status: 200, message: "User Successfully Registered", email: user.email }

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
        const docRef = doc(db, "users", email);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            return userData;
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
 * @param {string} habitName
 * @param {string | undefined} habitUnit
 * @param {HabitGoal | null} habitGoal
 */
export const addHabit = async (email, habitName, habitUnit, habitGoal) => {
    try {
        const docRef = doc(db, "users", email);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const habitList = Array.isArray(data["habitList"]) ? data["habitList"] : JSON.parse(data["habitList"]);
            const habitExists = Habit.habitExistsInList(habitName, habitList);

            if (!habitExists) {
                const newHabit = new Habit(habitName, habitUnit, undefined, undefined, new Date());
                if (habitGoal) {
                    newHabit.setGoal(habitGoal);
                }
                habitList.push(newHabit.getJSON());
                await setDoc(docRef, {
                    "habitList": habitList
                }, { merge: true })

                return { success: true, message: "Habit Successfully Updated" }
            } else {
                return { error: `Habit already exists: ${habitName} ` }
            }
        } else {
            return { error: `Data not found for ${email}` }
        }

    } catch (err) {
        return { error: err.code, message: err.message }
    }


}

export const updateHabit = (email, habitItem, newHabitObject) => {

}


// Email: String, habitList: Array<any>
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

export const removeHabit = (username, habitItem) => {

}

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

        const taskDocRef = await addDoc(collection(db, "tasks"), task.getJSON());


        const taskID = taskDocRef.id;
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
export const updateTask = async (email, task, taskID) => {
    const docRef = doc(db, "tasks", taskID)

    try {
        const res = await setDoc(docRef, task.getJSON(), { merge: true })

        return { ok: true }

    } catch (error) {
        return { error: error.code, message: error.message }
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
        const userTaskIDs = collection(db, "users", email, "tasks")
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
        const taskCollection = collection(db, "tasks");
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
            completed: completedStatus
        }, { merge: true })

        return { ok: true }

    } catch (err) {
        return { error: err.code, message: err.message }
    }
}

// Currently: any user that a task is shared with can permanently delete a task
// FUTURE IMPLEMENTATION: DELETE DOCUMENT FOR ALL SHARED USERS
export const deleteTask = async (email, taskID) => {
    try {
        // delete task from user's task collection
        const userTaskCollection = collection(db, "users", email, "tasks");
        const docInUserTasks = doc(userTaskCollection, taskID);

        // also delete task from tasks collection
        const taskCollection = collection(db, "tasks");
        const docInTasks = doc(taskCollection, taskID);

        const delFromUser = await deleteDoc(docInUserTasks);
        const delFromTasks = await deleteDoc(docInTasks);

        return { error: false }

    } catch (err) {
        return { error: err.code, message: err.message }
    }
}