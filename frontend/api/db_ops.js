
// Note: I should be able to add tasks and all that stuff, but
// once I log in, it saves my authorization token to local storage and auto signs in if there exists
// an auth token, otherwise show no habits and than allow me to sign in again

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, setPersistence, getReactNativePersistence, initializeAuth, deleteUser } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { collection, setDoc, doc, getDoc, deleteDoc } from "firebase/firestore";
import { storeData, retrieveData } from "./storage";
import constants from "@/constants/AuthConstants";
import Habit from "./habit";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { retrieveLocalHabitList } from "./storage";
import { Platform } from "react-native";


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
            habitList: JSON.stringify([]),
            taskList: JSON.stringify([]) // TASK LIST NOT YET IMPLEMENTED
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
            let habitList = JSON.parse(data["habitList"]);

            const habitExists = Habit.habitExistsInList(habitName, habitList);

            if (!habitExists) {
                habitList.push(new Habit(habitName, habitUnit).getJSON());
                await setDoc(docRef, {
                    habitList: JSON.stringify(habitList)
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
            const data = docSnap.data();

            setDoc(docRef, {
                "habitList": JSON.stringify(habitList)
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

export const addTodo = (username, todoItem) => {

}

export const completeTodo = (username, todoItem) => {

}

export const deleteTodo = (username, todoItem) => {

}
