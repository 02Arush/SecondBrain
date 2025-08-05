
// Note: I should be able to add tasks and all that stuff, but
// once I log in, it saves my authorization token to local storage and auto signs in if there exists
// an auth token, otherwise show no habits and than allow me to sign in again

// Import the functions you need from the SDKs you need
import constants, { ROLE_POWERS, isAnonymous } from "@/constants/constants";

import {
    createUserWithEmailAndPassword,
    deleteUser,
    onAuthStateChanged,
    signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';
import Habit from "../models/habit";
import Task from "../models/task";
import { email } from "../models/userTypes";
import { getNicknameFromEmail, isValidEmail } from "./types_and_utils";

import { changeUserHabitRole, createHabitInUserCollection, getHabitFromID, updateHabit } from "@/api/cloud_ops/habits";
import { changeUserTaskRole, createTaskInUserCollection, getTaskItem, updateTask } from "./cloud_ops/tasks";
import { SharableItem } from "../models/SharableItem";
import { app, auth } from "@/clients/firebase"

// This is here because on web, the local persistent storage of signed in userrs is handled automatically
// But on mobile devices, ReactNativePersistence using asyncstorage is required



const db = getFirestore(app);
export const collections = {
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

        email = email.toLowerCase()
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

// TODO: FIX THE RESPONSE FOR THIS
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
            return { ok: false, error: "Error: Habit Data not found for " + email }
        }
    } catch (err) {
        return { ok: false, error: err.message }
    }
}

/**
 * 
 * @param {email} email 
 */
export const getUserData = async (email) => {
    if (isAnonymous(email)) {
        return {
            ok: false,
            message: "Can not retrieve cloud data for anonymous email. Email: " + email,
            data: null,
        }
    }

    try {
        const docRef = doc(collections.users, email);


        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return { ok: false, message: `Document not found for user: ${email}`, data: null }
        }

        return {
            ok: true,
            data: docSnap.data(),
            message: `Successfully Retrieved User Data for user: ${email}`
        }


    } catch (err) {
        return {
            ok: false,
            message: "Error Retrieving User Data for " + email + "\n" + err.message,
            data: null,
        }

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
    const ID = item.getID();

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
