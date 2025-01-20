

import Habit from "./../habit"
import { collection, setDoc, doc, getDoc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { filterOptions, getNicknameFromEmail, habitModificationType, isValidEmail } from "./../types_and_utils"
import { collections } from "./../db_ops"
import { ROLE_POWERS, isAnonymous } from "@/constants/constants";
import constants from "@/constants/constants";

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




/**
 * @param {string} email
 * @param {Habit} habit 
 * @return {Promise<{ok: boolean, message: string}>}
 */
export const createHabit = async (email, habit) => {
    if (isAnonymous(email)) {
        return { ok: false, message: "Anonymous User Can't Create New Habits In the Cloud" }
    }

    try {

        const userData = await getUserDataFromEmail(email);
        let nickname = userData["nickname"]
        if (!nickname || nickname.length == 0) {
            nickname = getNicknameFromEmail(email);
        }
        const habitID = habit.getID();

        const res = await createHabitInUserCollection(email, habit);
        if (!res.ok) {
            return {
                ok: false,
                message: "Couldn't Create Habit\n" + res.message
            }
        }

        // create in habits collection
        const docRefHabit = doc(collections.habits, habitID);

        const sharedUsers = {
            [email]: { email: email, role: constants.ROLE.OWNER, joinDate: new Date() }
        }

        const docDataHabit = {
            habitName: habit.getName(),
            unit: habit.getUnit(),
            creationDate: habit.getCreationDate(),
            goal: habit.getGoal()?.JSON() || null,
            habitID: habit.getID(),
            sharedUsers: sharedUsers,
        }

        await setDoc(docRefHabit, docDataHabit, { merge: true })
        return {
            ok: true,
            message: `Habit ${habit.getName()
                } created with ID: ${habitID} `
        }

    } catch (err) {
        return {
            ok: false,
            message: `Create Habit: Code: ${err.code}, Message: ${err.message} `
        }
    }

}

/**
 * 
 * @param {string} email 
 */
export const retrieveHabitList = async (email) => {
    if (isAnonymous(email)) {
        return { ok: false, message: "Error retrieving Habit List from Cloud: User is Signed Out" }
    }

    try {
        const userHabitsCollection = getUserHabitsCollection(email);
        const querySnap = await getDocs(userHabitsCollection);
        const ids = querySnap.docs.map(doc => doc.id).filter(id => id != constants.DAILY_CHECK_IN);
        const getHabits = ids.map(async (id) => {
            const res = await getHabitFromID(email, id);
            if (res.data) {
                return { ok: true, data: res.data, message: "Success" };
            } else {
                return { ok: false, data: null, message: "Error Retrieving Habit List In Cloud\n" + res.message };
            }
        })

        const responses = await Promise.all(getHabits)
        const habits = responses.filter(response => {
            return (response.ok == true && response.data != null);
        }).map(response => {
            return response.data;
        })

        let msg = responses.reduce((acc, response) => {
            if (!response.ok) {
                return acc + `${response.message} \n`;
            } else {
                return acc;
            }
        }, "");

        if (msg.length > 0) {
            return { ok: false, message: msg }
        }

        return { ok: true, message: "Retrieved Docs", data: habits }


    } catch (err) {
        return { ok: false, message: `ERROR: ${err.message} `, data: null }

    }
}

/**
 * 
 * @param {string} email 
 * @param {string} habitID 
 * 
 */
export const retrieveActivityLogForUser = async (email, habitID) => {

    if (isAnonymous(email)) {
        return {
            ok: false,
            message: "Can not retrieve activity log for user, since user is either offline or not signed in.",
            data: new Map(),
        }
    }


    try {
        const habitCollection = getUserHabitsCollection(email);
        const docRef = doc(habitCollection, habitID);
        const habitDoc = await getDoc(docRef);
        const data = habitDoc.data();
        const activityLog = data["activityLog"];

        return { ok: true, data: activityLog, message: "Successfully retrieved user activities" }
    } catch (err) {
        return { ok: false, message: `ERROR Retrieving Activity Log: ${err.message} `, data: new Map() }
    }
}

/**
 * @param {string} email
 * @param {string} habitID
 */
export const getHabitFromID = async (email, id) => {
    try {

        const habitCollection = collections.habits;
        const docRef = doc(habitCollection, id);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();



        const getActLog = await retrieveActivityLogForUser(email, id);
        const activityLog = getActLog.data
        // ERROR SOMEWHERE HERE: CAN NOT CONVERT UNDEFINED OR NULL TO OBJECT
        const habitJSON = { ...data, activityLog }
        const habit = Habit.parseHabit(habitJSON)
        habit.ensureOwnerExists();

        return { ok: true, message: "Retrieved Successfully", data: habit }

    } catch (err) {
        return { ok: false, message: `${err.message} ` }

    }
}
/**
 * 
 * @param {string} email 
 * @param {Habit} habit 
 */
export const deleteHabit = async (email, habit) => {
    if (isAnonymous(email)) {
        return { ok: false, message: "Error Deleting Habit from Cloud: User Not Signed In." }
    }

    try {
        const id = habit.getID();

        // First, delete it from the user's habit Array
        const habitCollectionForUser = getUserHabitsCollection(email)
        const docToDelete = doc(habitCollectionForUser, id);
        await deleteDoc(docToDelete);

        // Now, remove the user from the sharedUsers array in habit
        habit.removeSharedUser(email);
        if (Object.keys(habit.getSharedUsers()).length <= 0) {
            const habitDocToDel = doc(collections.habits, id);
            await deleteDoc(habitDocToDel);
        } else {

            const sharedUsers = habit.getSharedUsers();
            const docRef = doc(collections.habits, id);
            await updateDoc(docRef, { sharedUsers: sharedUsers })

        }
        return { ok: true, message: `Successfully Deleted Habit: ${habit.getName()} ` }

    } catch (err) {
        return {
            ok: false,
            message: `Error Deleting Habit: ${habit} for Email: ${email}. ERROR MESSAGE: ${err.message} `
        }
    }
}
