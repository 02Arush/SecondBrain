
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
import { filterOptions, habitModificationType } from "./types_and_utils";
import { retrieveLocalHabitList } from "./storage";
import constants from "@/constants/constants";


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

        const symbol = "@";
        const emailTxt = email.split("@")[0];
        const maxNameLength = Math.min(emailTxt.length, 10);

        const nickname = emailTxt.substring(0, maxNameLength)


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


// /**
//  *
//  * @param {string} email
//  * @param {string} habitName
//  * @param {string | undefined} habitUnit
//  * @param {HabitGoal | null} habitGoal
//  */
// export const addHabit = async (email, habitName, habitUnit, habitGoal) => {
//     try {
//         const docRef = doc(db, "users", email);
//         const docSnap = await getDoc(docRef);

//         if (docSnap.exists()) {
//             const data = docSnap.data();
//             const habitList = Array.isArray(data["habitList"]) ? data["habitList"] : JSON.parse(data["habitList"]);
//             const habitExists = Habit.habitExistsInList(habitName, habitList);

//             if (!habitExists) {
//                 const newHabit = new Habit(habitName, habitUnit, undefined, undefined, new Date());
//                 if (habitGoal) {
//                     newHabit.setGoal(habitGoal);
//                 }
//                 habitList.push(newHabit.getJSON());
//                 await setDoc(docRef, {
//                     "habitList": habitList
//                 }, { merge: true })

//                 return { success: true, message: "Habit Successfully Updated" }
//             } else {
//                 return { error: `Habit already exists: ${habitName} ` }
//             }
//         } else {
//             return { error: `Data not found for ${email}` }
//         }

//     } catch (err) {
//         return { error: err.code, message: err.message }
//     }
// }

// Email: String, habitList: Array<any>



/**
 * 
 * @param {string} email 
 * @param {Habit} habit 
 * @param {habitModificationType } type
 */
export const updateHabit = async (email, habit, type) => {
    if (type == "log") {
        const res = await logHabitActivity(email, habit);
        return res;

    } else if (type == "modify") {
        return {
            ok: false,
            message: "Not Yet Implemented"
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

export const updateHabitDetails = async (email, habit) => {

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
 * @param {string} senderEmail 
 * @param {string} receiverEmail 
 */
export const inviteUserToHabit = async (senderEmail, receiverEmail) => {
    // create a colleciton in users/userID/inivtes/inviteID
    //                                                 // invite date, habitID, expirationDate,

}

// TEMP FCTN TO RESTRUCTURE CLOUD HABIT LISTS
/** 
    @param {string} email
*/
export const fixCloudHabitList = async (email) => {
    // if (email == "akarushkumar7@gmail.com") {
    //     return { ok: false, message: "Don't mess with this email" }
    // }

    try {
        const currUserData = await getUserDataFromEmail(email);
        const habitList = currUserData["habitList"]

        if (!Array.isArray(habitList)) {
            // try to parse the habit list as JSON
        } else {

            // create a collection users/userID/habits
            const uploadHabits = habitList.map(
                async (habit) => {
                    const parsedHabit = Habit.parseHabit(habit);
                    const res = await createHabit(email, parsedHabit);
                    return res;
                }
            )

            const res = await Promise.all(uploadHabits);
            const ok = res.every((response) => {
                const responseOk = response.ok == true;
                if (!responseOk) {
                    console.log(response.message);
                }

                return response.ok === true;
            })

            return { ok: ok, message: ok ? "SUCCESS" : "ERROR FIXING CLOUD HABITS" }

        }

    } catch (err) {
        return { ok: false, message: err + " " + err.message }
    }
}

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

        const taskID = task.getTaskID()
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
        const userTaskCollection = collection(collections.users, email, "tasks");
        const docInUserTasks = doc(userTaskCollection, taskID);

        // also delete task from tasks collection
        const taskCollection = collections.tasks
        const docInTasks = doc(taskCollection, taskID);

        const delFromUser = await deleteDoc(docInUserTasks);
        const delFromTasks = await deleteDoc(docInTasks);

        return { ok: true, message: "Successfully Deleted Task" }

    } catch (err) {
        return { ok: false, error: err.code, message: err.message }
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
        const habitID = habit.getID();
        // create in users collection
        const usersCollection = getUserHabitsCollection(email);
        const docRef = doc(usersCollection, habitID);
        const dataForUser = {
            userGoal: habit.getGoal()?.JSON() || null,
            activityLog: habit.getActivityLog()
        }
        setDoc(docRef, dataForUser, { merge: true })

        // create in habits collection
        const docRefHabit = doc(collections.habits, habitID);
        const sharedUsers = [
            { email: email, role: constants.ROLE.ADMIN, joinDate: new Date() }
        ]

        const docDataHabit = {
            habitName: habit.getName(),
            unit: habit.getUnit(),
            creationDate: habit.getCreationDate(),
            goal: habit.getGoal()?.JSON() || null,
            habitID: habit.getID(),
            sharedUsers: sharedUsers,
        }

        setDoc(docRefHabit, docDataHabit, { merge: true })
        return {
            ok: true,
            message: `Habit ${habit.getName()} created with ID: ${habitID}`
        }

    } catch (err) {
        return {
            ok: false,
            message: `Create Habit: Code: ${err.code}, Message: ${err.message}`
        }
    }

    // create in habits collection
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
                return { ok: false, data: null, message: res.message };
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
                return acc + `${response.message}\n`;
            } else {
                return acc;
            }
        }, "");

        if (msg.length > 0) {
            return { ok: false, message: msg }
        }

        return { ok: true, message: "Retrieved Docs", data: habits }


    } catch (err) {
        return { ok: false, message: `ERROR: ${err.message}`, data: null }

    }
}

/**
 * 
 * @param {string} email 
 * @param {string} habitID 
 */
export const retrieveActivityLogForUser = async (email, habitID) => {
    try {
        const habitCollection = getUserHabitsCollection(email);
        const docRef = doc(habitCollection, habitID);
        const habitDoc = await getDoc(docRef);
        const data = habitDoc.data();
        const activityLog = data["activityLog"];

        return { ok: true, data: activityLog, message: "Successfully retrieved user activities" }
    } catch (err) {
        return { ok: false, message: `ERROR Retrieving Activity Log: ${err.message}`, data: null }
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

        return { ok: true, message: "Retrieved Successfully", data: habit }

    } catch (err) {
        return { ok: false, message: `${err.message}` }

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
        const sharedUsersRes = await getSharedUsersForHabit(id);

        if (!sharedUsersRes.data || !Array.isArray(sharedUsersRes.data)) {
            return { ok: false, message: sharedUsersRes.message }
        }

        const sharedUsers = sharedUsersRes.data;

        const newSharedUsers = sharedUsers.filter((userItem) => {
            return userItem["email"] != email;
        })


        if (newSharedUsers.length <= 0) {
            const habitDocToDel = doc(collections.habits, id);
            await deleteDoc(habitDocToDel);
        } else {
            const newData = { sharedUsers: newSharedUsers }
            const habitDocToModify = doc(collections.habits, id);
            await setDoc(habitDocToModify, newData, { merge: true })
        }

        return { ok: true, message: `Successfully Deleted Habit: ${habit.getName()}` }

    } catch (err) {
        return {
            ok: false,
            message: `Error Deleting Habit: ${habit} for Email: ${email}. ERROR MESSAGE: ${err.message}`
        }
    }

}

const getUserHabitsCollection = (email) => {
    return collection(collections.users, email, 'habits')
}

/**
 * 
 * @param {string} habitID 
 */
const getSharedUsersForHabit = async (habitID) => {
    const habitDocRef = doc(collections.habits, habitID);
    const docSnap = await getDoc(habitDocRef);

    if (!docSnap.exists()) {
        return { ok: false, message: `Error Getting Shared Users. Doc with habit ID: ${habitID} does not exist.` }
    }

    const habitData = docSnap.data();
    const sharedUsers = habitData["sharedUsers"];

    if (sharedUsers && Array.isArray(sharedUsers)) {
        const addedDatesToSharedUsers = sharedUsers.map((user) => {
            if (!user.joinDate) {
                return { ...user, joinDate: new Date() }
            } else {
                return user;
            }
        })
        return { ok: true, message: `Retrieved Shared Users for habit: ${habitID}`, data: sharedUsers }
    } else {
        return { ok: false, message: `Shared Users does not exist, or is not an array for habit: ${habitID}` }
    }
}