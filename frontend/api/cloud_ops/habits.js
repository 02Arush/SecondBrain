

import Habit from "./../habit"
import { collection, setDoc, doc, getDoc, deleteDoc } from "firebase/firestore";
import { filterOptions, getNicknameFromEmail, habitModificationType, isValidEmail } from "./types_and_utils";
import {collections} from "./../db_ops"

/**
 * 
 * @param {string} email 
 * @param {Habit} habit 
 * @param {habitModificationType } type
 * 
 * EITHER:
 * 1) LOG NEW DATA FOR A USER ON A HABIT
 * 2) MODIFY THE DOCUMENT OF A HABIT, IN ITS OWN COLLECTION
 */
export const updateHabit = async (email, habit, type) => {
    if (type == "log") {
        const res = await logHabitActivity(email, habit);
        return res;

    } else if (type == "modify") {
        const ID = habit.getID();
        const habitDocRef = doc(collections.habits, ID);
        const newHabitJSON = habit.getJSON();

        await setDoc(habitDocRef, newHabitJSON, { merge: true })


        return {
            ok: true,
            message: "Modification Complete"
        }

    } else {
        return {
            ok: false,
            message: `Invalid Habit update type: ${type}`
        }

    }
}



/**
 * 
 * @param {string} email 
 * @param {Habit} habit 
 */
const logHabitActivity = async (email, habit) => {
    try {

        const habitID = habit.getID();
        const userHabitCollection = getUserHabitsCollection(email);
        const userHabitDoc = doc(userHabitCollection, habitID);
        const newActivityLog = habit.getActivityLog();

        await setDoc(userHabitDoc, {
            activityLog: newActivityLog,
        }, { merge: true })

        return { ok: true, message: "Activity log updated." }


    } catch (err) {
        return { ok: false, message: `Error logging habit activity: ${err.message}` }
    }
}

const getUserHabitsCollection = (email) => {
    return collection(collections.users, email, 'habits')
}


/**
 * 
 * @param {string} habitID 
 */
export const getSharedUsersForHabit = async (habitID) => {
    const habitDocRef = doc(collections.habits, habitID);
    const docSnap = await getDoc(habitDocRef);

    if (!docSnap.exists()) {
        return { ok: false, message: `Error Getting Shared Users.Doc with habit ID: ${habitID} does not exist.` }
    }

    const habitData = docSnap.data();
    const sharedUsers = habitData["sharedUsers"];

    if (Array.isArray(sharedUsers)) {
        const sharedMap = {};
        sharedUsers.forEach((sharedUser) => {
            const { email } = sharedUser;
            sharedMap[email] = sharedUser;
        })

        await setDoc(habitDocRef, {
            sharedUsers: sharedMap
        }, { merge: true })

        return getSharedUsersForHabit(habitID);

    }

    if (sharedUsers) {

        return { ok: true, message: `Retrieved Shared Users for habit: ${habitID} `, data: sharedUsers }
    } else {
        return { ok: false, message: `Shared Users does not exist for habit: ${habitID} ` }
    }
}


/**
 * @param {email} signedInUser
 * @param {email} modifiedUser
 * @param {string} newRole
 * @param {Habit} habit
 * 
 * TODO: change HABIT to HABIT || TASK
 */
export const changeUserHabitRole = async (signedInUser, modifiedUser, newRole, habit) => {


    if (newRole == constants.ROLE.NONE) {
        const res = await deleteHabit(modifiedUser, habit)
        if (!res.ok) {
            return { ok: false, message: "Unable to remove from habit:\n" + res.message }
        } else {

            return { ok: true, message: "Successfully removed user from habit" }
        }
    }

    const roleChanged = habit.changeRoleOfUser(modifiedUser, newRole)
    const newRoleOfUserRes = habit.getRoleOfUser(modifiedUser);
    const newRoleOfUser = newRoleOfUserRes.data;


    if (!roleChanged) {
        if (newRoleOfUser.localeCompare(constants.ROLE.OWNER) == 0) {
            return { ok: true, message: "Could not update role of user. Habit needs at least one OWNER." }
        } else {
            return { ok: true, message: "User role stayed the same." }
        }
    }

    const res = await updateHabit(signedInUser, habit, "modify");
    if (res.ok) {
        return {
            ok: true,
            message: `Successfully Changed ${modifiedUser}'s role to ${newRole}`
        }

    } else {
        return {
            ok: false,
            message: "Failed to modify user role.\n" + res.message
        }
    }

}
