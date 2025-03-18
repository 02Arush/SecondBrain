import AsyncStorage from '@react-native-async-storage/async-storage';
import Habit from './models/habit';
import { isAnonymous } from '@/constants/constants';

import {
    createHabit as createHabitCloud, updateHabit as updateHabitCloud,
    deleteHabit as deleteHabitCloud, retrieveActivityLogForUser,
    retrieveHabitList as retrieveHabitListCloud, getHabitFromID,

} from './cloud_ops/habits';

import constants from '@/constants/constants';
import { habitModificationType } from './models/miscTypes';

// Function to store data
export const storeData = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, value);
        return { ok: true, message: "Successfully stored to " + key }
    } catch (e) {
        return { ok: false, message: "AsyncStorage: Failed to save the data to the storage" + e }
    }
}

import { HabitGoal } from './models/habit';
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
            message: "Habit ID is undefined"
        }
    }

    const habitList = await retrieveLocalHabitList();

    const habitJSON = habitList.find(habit => {
        return habit.habitID && habit.habitID.localeCompare(habitID) == 0;
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

    if (habitID == constants.DAILY_CHECK_IN) {
        const res = await getSyncedDailyCheckin(email);
        return res;
    }


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



/**
 * 
 * @param {string} email 
 * @returns {Promise<{ok: boolean, message: string}}
 */
export const uploadLocalStorageHabits = async (email) => {

    const localHabitList = await retrieveLocalHabitList();

    const uploads = localHabitList.map(async (habitJSON) => {
        const habit = Habit.parseHabit(habitJSON);
        const res = await createHabitCloud(email, habit);
        return res;

    })
    const responses = await Promise.all(uploads);
    const ok = responses.every((res) => {
        return res.ok
    })
    let message = "Successfully Uploaded Habits To Cloud";
    if (!ok) {
        message = responses.reduce((acc, response) => {
            const msgToConcat = !(response.ok) ? `${response.message}\n` : "";
            return `${acc}${msgToConcat}`
        }, "")
    }
    return { ok, message }


}

/**
 * 
 * @param {string} email 
 */
export const getSyncedDailyCheckin = async (email) => {
    // Get the daily checkin from local storage

    const lclDailyCheckinRes = await retrieveHabitFromLocalStorage(constants.DAILY_CHECK_IN)
    const lclDailyCheckin = lclDailyCheckinRes.data || new Habit("Daily Check-In", "Times")
    lclDailyCheckin.setID(constants.DAILY_CHECK_IN)

    let tempCloudHabit;

    if (!isAnonymous(email)) {
        const cloudActivityLogRes = await retrieveActivityLogForUser(email, constants.DAILY_CHECK_IN)
        const cloudActivityLog = cloudActivityLogRes.data;
        tempCloudHabit = new Habit("Daily Check-In", "Times");

        tempCloudHabit.setActivityLog(cloudActivityLog)


    }

    const mergedHabit = tempCloudHabit instanceof Habit ? Habit.mergeHabits("Daily Check-In", "Times", tempCloudHabit, lclDailyCheckin, true) : lclDailyCheckin
    mergedHabit.setID(constants.DAILY_CHECK_IN);
    mergedHabit.logItem(new Date(), 1, true);
    mergedHabit.setUnit("Times")
    mergedHabit.setGoal(new HabitGoal(1, "Times", 1, "day"))
    mergedHabit.ensureProperCreationDate()
    

    const storeLocalRes = await storeData(constants.DAILY_CHECK_IN, mergedHabit.getJSONString())
    const storeCloudRes = !isAnonymous(email) ? await updateHabitCloud(email, mergedHabit, "log") : { ok: true, message: "Anonymous- Update Not Sent" }

    return {
        ok: storeLocalRes.ok && storeCloudRes.ok,
        message: "Local: " + storeLocalRes.message + "\nCloud: " + storeCloudRes.message,
        data: mergedHabit
    }
}