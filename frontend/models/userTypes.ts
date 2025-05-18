import { DocumentReference } from "firebase/firestore"
import { inviteType } from "./miscTypes";

export type friend = {
    nickname: string,
    email: string
}

export type email = string;

export type friendRequest = {   
    sender: email,
    recipient: email,
    date: Date,
}

export const isFriendRequest = (object: inviteType | friendRequest): object is friendRequest  => {
    return object.hasOwnProperty("sender") && object.hasOwnProperty("recipient") && object.hasOwnProperty("date");
}

export type friendReference = {
    email: email,
    reference: DocumentReference,
}

export type displayedFriendItem = {
    email: email,
    nickname: string
}

export type friendsList = Record<string, friendReference>

export type sharedUser = {
    email: string,
    role: string,
    joinDate: Date,
}
