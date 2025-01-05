import AsyncStorage from '@react-native-async-storage/async-storage';
import Habit from './habit';
import { isAnonymous } from '@/constants/constants';
import {
    getUserDataFromEmail, updateUserHabitList,
    createHabit as createHabitCloud, retrieveHabitListCloud, deleteHabit as deleteHabitCloud, getHabitFromID,
    updateHabit as updateHabitCloud
} from './db_ops';

import { habitModificationType } from './types_and_utils';
// Function to store data
export const storeData = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, value);
        return { ok: true, message: "Successfully stored to " + key }
    } catch (e) {
        return { ok: false, message: "AsyncStorage: Failed to save the data to the storage" + e }
    }
}


// Function to retrieve data
export const retrieveData = async (key) => {
    try {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
            return value;
        } else {
            return { error: "No Data Found For Key: " + key }
        }
    } catch (e) {
        return { error: 'Failed to fetch the data from storage' + e };
    }
}

// Function to remove data
export const removeData = async (key) => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (e) {
        console.error('Failed to remove the data from storage', e);
    }
}

// response: { error: message | false }, otherwise habitObject would be updated on the cloud if the user is signed in, otherwise in local storage
export const updateHabitObject = async (habitJSONObject, email) => {
    let habit;
    try {
        habit = Habit.parseHabit(habitJSONObject);
    } catch (e) {
        return { error: `Invalid habitJSONObject: storage.js/updateHabitObject \n${e}` };
    }

    let habitList;
    if (!isAnonymous(email)) {
        try {
            const userData = await getUserDataFromEmail(email);
            habitList = Array.isArray(userData["habitList"]) ? userData["habitList"] : JSON.parse(userData["habitList"]);

            const newHabitList = Habit.updateHabitInHabitList(habit, habitList);
            const response = await updateUserHabitList(email, newHabitList);
            if (response.error) {
                return { error: response.error };
            } else {
                return { error: false };
            }
        } catch (e) {
            return { error: `Cloud update failed: ${e.message}` };
        }
    }

    // Update habit object in local storage

};

/**
 * 
 * @returns {Promise<Array<any>>}
 * Returnss a JSON array of the habit list in local storage
 */
export const retrieveLocalHabitList = async () => {
    try {
        const habitListData = await retrieveData("habitList");
        if (!habitListData) {
            return [];
        } else {
            const habitList = JSON.parse(habitListData);
            if (!Array.isArray(habitList)) {
                return [];
            } else {
                return habitList;
            }

        }
    } catch (e) {
        return [];
    }
}

/**
 * 
 * @param {Habit} habit
 * If habit exists, replace it. Otherwise, isnert it
 */
export async function insertHabitLocalStorage(habit) {

    try {
        const habitDataList = await retrieveLocalHabitList();
        const habitExists = Habit.habitExistsInList(habit, habitDataList);

        if (!habitExists) {
            habitDataList.push(habit.getJSON());
            const res = await storeData("habitList", JSON.stringify(habitDataList));
            return res;
        } else {
            return { ok: false, message: "Can Not Insert Habit into Local Storage: Habit Already Exists" }
        }

    } catch (err) {
        return {
            ok: false,
            message: `Failed to insert into local storage. Error: ${err.message}`
        }

    }
}

/**
 * 
 * @param {string} email 
 */
const retrieveHabitList = async (email) => {
    if (isAnonymous(email)) {
        const localHabitList = retrieveLocalHabitList()
        return {
            ok: true,
            data: localHabitList,
            message: "Success"
        }
    } else {
        const res = await retrieveHabitListCloud(email);
        return res;
    }
}

/**\
 * @param {string} habitID
 */
const retrieveHabitFromLocalStorage = async (habitID) => {

    if (!habitID) {
        return {
            ok: false,
            error: "Habit ID is undefined"
        }
    }

    const habitList = await retrieveLocalHabitList();

    const habitJSON = habitList.find(habit => {
        return habit.habitID.localeCompare(habitID) == 0;
    })

    if (!habitJSON) {
        return { ok: false, message: "Could not find habit with ID " + habitID }
    }

    const habit = Habit.parseHabit(habitJSON);

    return {
        ok: true,
        message: "Retrieved habit from local storage successfully",
        data: habit
    }

}


/**
 * @param {string} email 
 * @param {Habit} habit
 */
export const createHabit = async (email, habit) => {
    if (isAnonymous(email)) {
        const res = await insertHabitLocalStorage(habit);
        const ok = !res.error;
        if (res.ok) {
            return {
                ok: true,
                message: `Added Habit Locally: ${habit.getName()}`
            }
        } else {
            return {
                ok: false,
                message: `Failed to Create Habit: ${res.error}`
            }
        }
        // Create offline habit
    } else {
        const res = await createHabitCloud(email, habit);
        return res;
    }

}

/**
 * @param {string} email
 * @param {Habit} habit
 */
export const deleteHabit = async (email, habit) => {
    const habitID = habit.getID();

    if (isAnonymous(email)) {
        const localHabits = await retrieveLocalHabitList();
        const newLocalHabits = localHabits.filter(habit => {
            return habit.habitID != habitID
        })

        const res = await storeData("habitList", JSON.stringify(newLocalHabits));
        if (res.ok) {
            return { ok: true, message: `Deleted Habit ${habit.getName()}` }
        } else {
            return { ok: false, message: `Error Deleting Habit: ${res.message}` }
        }

    } else {
        // delete habit from cloud
        const res = await deleteHabitCloud(email, habit)
        return res;
    }
}

/**
 * 
 * @param {string} email 
 * @param {string} habitID 
 */
export const getHabit = async (email, habitID) => {
    if (isAnonymous(email)) {
        const res = await retrieveHabitFromLocalStorage(habitID);
        return res;

    } else {
        const res = await getHabitFromID(email, habitID)
        return res;
    }
}

/**
 * 
 * @param {string} email 
 * @param {Habit} habit 
 * @param {habitModificationType} modificationType
 */
export const updateHabit = async (email, habit, modificationType) => {
    if (isAnonymous(email)) {
        try {
            const habitList = await retrieveLocalHabitList();
            if (habitList) {

                // TODO: UPDATE HABIT IN HABIT LIST, SHARED USERS?
                const newHabitList = Habit.updateHabitInHabitList(habit, habitList);
                const res = await storeData("habitList", JSON.stringify(newHabitList));
                if (res.error) {
                    return { ok: false, message: res.error };
                } else {
                    return { ok: true, message: "Success. Habit updated locally" };
                }
            } else {
                return { ok: false, message: "Error Retrieving Habits from Local Storage" };
            }
        } catch (e) {
            return { ok: false, message: `Local update habit list failed: ${e.message}` };
        }
    } else {
        // update habit in cloud
        const res = await updateHabitCloud(email, habit, modificationType);
        return res;

    }

}