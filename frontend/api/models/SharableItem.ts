


import {email, sharedUser} from "./userTypes"


// FUTURE: TURN THIS INTO AN ABSTRACT CLASS

export interface SharableItem {
    getID(): string
    getSharedUsers(): { [key: email]: sharedUser }
    addSharedUser(sharedHabitUser: sharedUser): void
    getRoleOfUser(email: email): { ok: boolean, data: string, message: string }
    removeSharedUser(email: email): void
    changeRoleOfUser(email: email, newRole: string): boolean
    ensureOwnerExists(): void
}
