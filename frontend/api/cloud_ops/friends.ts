
import { email } from "../types_and_utils"
import { collections, getUserData, getUserDataFromEmail, getUserInvitesCollection, updateUserDoc } from "../db_ops"
import { addDoc, getDocs, getFirestore, query, updateDoc, where, deleteDoc, DocumentReference, DocumentData } from 'firebase/firestore'
import { collection, setDoc, doc, getDoc } from "firebase/firestore";

import { createInvite } from "../db_ops";
import { updateCurrentUser } from "firebase/auth";

type friendRequest = {
    
    sender: email,
    recipient: email,
    date: Date,
}

type friendItem = {
    email: email,
    reference: DocumentReference,
    date: Date,
}


const genFriendItem = (email: email): friendItem => {
    return {
        email,
        reference: doc(collections.users, email),
        date: new Date(),
    }
}

const genFriendReqId = (sender: email) => {
    return "fr#" + sender;
}

export const sendFriendRequest = async (sender: email, recipient: email) => {
    const request: friendRequest = {
        sender,
        recipient,
        date: new Date(),
    }

    try {

        const userInvitesCollection = getUserInvitesCollection(recipient)
        const friendReqId = genFriendReqId(sender);

        const docRef = doc(userInvitesCollection, friendReqId);
        await setDoc(docRef, request);

        return { ok: true }

    } catch (err) {
        return { ok: false }
    }

}

export const createFriendship = async (sender: email, recipient: email) => {
    // add a user to each individual's friend object

    const senderDataRes = await getFriendsOfUser(sender);
    const recipientDataRes = await getFriendsOfUser(recipient);

    if (!senderDataRes.data || !recipientDataRes.data) {
        return {
            ok: false,
            message: "Unable to retrieve document fields"
        }
    } else {
        const senderFriends = senderDataRes.data
        const recipientFriends = senderDataRes.data

        const recipientFriendItem = genFriendItem(recipient);
        const senderFriendItem = genFriendItem(sender);

        senderFriends[recipient] = recipientFriendItem
        recipientFriends[sender] = senderFriendItem

        await updateUserDoc(sender, {
            "friends" : senderFriends
        })

        await updateUserDoc(recipient, {
            "friends" : recipientFriends
        })
    }

   

}

const deleteFriendRequest = () => {


}

const removeFriendship = (emailA: email, emailB: email) => {

}

export const getFriendsOfUser = async (email: email): Promise<{
    ok: boolean,
    message: string,
    data: Record<string, friendItem> | null
}> => {
    try {

        const userData = await getUserData(email);
        if (!userData.data) { 
            return {ok: false, message: "User data not found", data: null}
        }

        const data: Record<string, friendItem> = userData.data["friends"] || {}
        return {
            ok: true, 
            message: "Success",
            data,
        }

    } catch (err) {
        return {
            ok: false,
            message: "Error getting friends of user",
            data: null,
        }

    }
}
