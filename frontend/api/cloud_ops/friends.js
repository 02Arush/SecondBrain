
import { email } from "./../types_and_utils"
import { collections, getUserDataFromEmail } from "./../db_ops"
import { addDoc, getDocs, getFirestore, query, updateDoc, where, deleteDocs } from 'firebase/firestore'
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

const getFriendsOfUser = async (email) => {
    try {

        const userData = await getUserDataFromEmail(email);
        


    } catch (err) {
        return {
            ok: false,
            message: `Error Getting Friends for: ${email}\n` + err.message
        }


    }

}
