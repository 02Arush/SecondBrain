
import { email } from "./../types_and_utils"
import { collections, getUserData, getUserDataFromEmail } from "./../db_ops"
import { addDoc, getDocs, getFirestore, query, updateDoc, where, deleteDocs, DocumentReference } from 'firebase/firestore'
import { collection, setDoc, doc, getDoc, deleteDoc } from "firebase/firestore";

import { createInvite } from "./../db_ops";

const sendFriendRequest = (sender, recipient) => {

}

const acceptFriendRequest = () => {

}

const deleteFriendRequest = () => {


}

const getFriendsForUser = (email) => {

}

const createFriendship = (emailA, emailB) => {
    const docRefA = doc(getUserFri)

}

const removeFriendship = (emailA, emailB) => {

}


/**
 * 
 * @param {string} email 
 * @returns 
 */
export const getFriendsOfUser = async (email) => {
    try {

        const dataRes = await getUserData(email);
        if (!dataRes.data) {
            return {
                ok: false,
                message: `Failed to get friends of ${email}\n${dataRes.message}`,
                data: []

            }
        }


        const docData = dataRes.data();
        const friends = (docData["friends"]);

        if (!friends || (friends && Object.keys(friends).length === 0)) {
            return {
                ok: true,
                message: `No friends found for: ${email}`,
                data: []
            }
        }

        const promises = await Promise.all(
            Object.entries(friends).map(async ([email, ref]) => {
                if (ref instanceof DocumentReference) {
                    const userDataDocSnap = await getDoc(ref);
                    if (userDataDocSnap.exists()) {
                        return { email: email, data: userDataDocSnap.data() };
                    } else {
                        // console.warn(`Document does not exist for email: ${email}`);
                        return { email: email, data: null };
                    }
                } else {
                    // console.warn(`Reference is not a DocumentReference for email: ${email}`);
                    return { email: email, data: null }
                }
            })
        );

        // Remove undefined or null entries (if needed)
        const validResults = promises.filter(item => item != null);

        return {
            ok: true,
            message: "Retrieved Friends for email: " + email,
            data: validResults
        }

    } catch (err) {
        return {
            ok: false,
            message: `Error Getting Friends for: ${email}\n` + err.message,
            data: []
        }


    }

}
