
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
import { retrieveLocalHabitList } from "./storage";
import { Platform } from "react-native";
import Task from "./task";
import { isAnonymous } from "@/constants/constants";


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


export const addHabit = async (email, habitName, habitUnit) => {
    try {
        const docRef = doc(db, "users", email);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {

            const data = docSnap.data();


            const habitList = Array.isArray(data["habitList"]) ? data["habitList"] : JSON.parse(data["habitList"]);
            const habitExists = Habit.habitExistsInList(habitName, habitList);

            if (!habitExists) {
                habitList.push(new Habit(habitName, habitUnit).getJSON());
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
        await deleteDoc(docRef);
        return { ok: true, message: `User deleted: ${email}` };
    } catch (err) {
        return { error: err.code, message: err.message };
    }
};

export const removeHabit = (username, habitItem) => {

}

export const createTask = async (email, task) => {
    if (isAnonymous(email)) {
        return { error: "Not signed in: Anonymous user cannot create tasks" };
    }

    if (!(task instanceof Task)) {
        return { error: "Task provided is not a Task object. Type: " + typeof task };
    }

    try {

        const taskDocRef = await addDoc(collection(db, "tasks"), {
            taskName: task.getName(),
            description: task.getDescription(),
            importance: task.getImportance(),
            deadline: task.getDeadline(),
            completed: task.getCompleted(),
            sharedUsers: task.getSharedUsers()
        });


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
 * @param {string} email - user's email
 * @param {boolean | undefined} completed - if completed is true, it gets all completed tasks. if completed is false, it gets task documents where completed=false || completed=null
 * 
 */

// WORK IN PROGRESS
export const getTasksForUser = async (email, completed) => {
    if (typeof email !== "string") return { error: "Email must be of type string: type " + typeof email }
    if (isAnonymous(email)) return { error: "Anonymous email has no tasks" };
    if (completed !== undefined && typeof completed !== "boolean") return { error: "completed field must be boolean or undefined. Type: " + typeof completed };

    completed = true;
    try {

        let tasksQuery;
        let nullCompletedQuery = null;
        const tasksCollection = collection(db, "users", email, "tasks")
        // If we are looking for all tasks, ignore the completed field and look all tasks
        if (completed === undefined) {
            tasksQuery = query(tasksCollection);
        } else {

            // document either has "completed" field or does not have completed field. If document does not have completed field, we are supposed to assume it is incomplete.
            tasksQuery = query(tasksCollection, where("completed", "==", completed));
            if (!completed) {
                nullCompletedQuery = query(tasksCollection, where("completed", "==", null));
            }
        }
        const querySnap = await getDocs(tasksQuery);
        let remainingIncompleteDocsSnap = null
        if (nullCompletedQuery) {
            // nullCompletedQuery can only be true if completed parameter is defined and false
            // this exists in order to check for documents that do not have a completed field, and to assume they are INCOMPLETE
            remainingIncompleteDocsSnap = await getDocs(nullCompletedQuery);
        }

        let taskIDs = querySnap.docs.map(doc => doc.id);
        if (remainingIncompleteDocsSnap) {
            // get the ID of every single other incomplete doc and add it to taskIDs
            remainingIncompleteDocsSnap.docs.forEach(doc => taskIDs.push(doc.id))
        }

        let taskList = [];
        for (let id of taskIDs) {
            const taskDocRef = doc(db, "tasks", id);
            const taskSnap = await getDoc(taskDocRef);
            if (taskSnap.exists()) {
                const taskData = taskSnap.data();
                const task = Task.fromObject(taskData, id)
                taskList.push(task);
            }
        }

        // now: for each document in DOC ID, get the task object for it

        return { taskList: taskList }
    } catch (err) {
        return { error: err.code, message: err.message }
    }
}
