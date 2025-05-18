
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { collections, getUserData, getUserDataFromEmail, getUserInvitesCollection, updateUserDoc } from "../db_ops";
import { email, friendReference, friendsList } from "../../models/userTypes";
import { friendRequest } from "@/models/userTypes";


const genFriendItem = (email: email): friendReference => {
    return {
        email,
        reference: doc(collections.users, email),
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
        const recipientFriends = recipientDataRes.data

        const recipientFriendItem = genFriendItem(recipient);
        const senderFriendItem = genFriendItem(sender);

        senderFriends[recipient] = recipientFriendItem
        recipientFriends[sender] = senderFriendItem

        await updateUserDoc(sender, {
            "friends": senderFriends
        })

        await updateUserDoc(recipient, {
            "friends": recipientFriends
        })

        return {
            ok: true,
            message: `Friendship created between ${sender} and ${recipient}`
        }
    }



}

export const deleteFriendRequest = async (sender: string, recipient: string): Promise<{ ok: boolean, message: string }> => {
    try {
        const invitesCollection = getUserInvitesCollection(recipient);
        const reqId = genFriendReqId(sender);

        // delete doc with the above ID from the invitesCollection
        const docRef = doc(invitesCollection, reqId);
        await deleteDoc(docRef);
        return {
            ok: true,
            message: "Sucessfully deleted friend request from " + sender
        }

    } catch (err) {
        return { ok: false, message: "Error deleting friend request " + JSON.stringify(err) }

    }
}

const removeFriendship = (emailA: email, emailB: email) => {

}

export const getFriendsOfUser = async (email: email): Promise<{
    ok: boolean,
    message: string,
    data: friendsList | null
}> => {
    try {

        const userData = await getUserData(email);

        if (!userData.data) {
            return { ok: false, message: "User data not found", data: null }
        }

        const data: friendsList = userData.data["friends"] || {}

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

// const getFriendsWithNicknames = (friendsList: friendsList): Record<email, string> => {

//     const keys = Object.keys(friendsList)
//     return
   
// }

// Given: doc Ref
// displayableFriendData
