import { DocumentReference } from "firebase/firestore"

export type friend = {
    nickname: string,
    email: string
}


export type friendRequest = {
    
    sender: email,
    recipient: email,
    date: Date,
}

export type friendReference = {
    email: email,
    reference: DocumentReference,
}

export type friendsList = Record<string, friendReference>


export type sharedUser = {
    email: string,
    role: string,
    joinDate: Date,
}

export type email = string;