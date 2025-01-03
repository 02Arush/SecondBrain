import AsyncStorage from '@react-native-async-storage/async-storage';
import Habit from './habit';
import { isAnonymous } from '@/constants/constants';
import { getUserDataFromEmail, updateUserHabitList, createHabit as createHabitCloud, retrieveHabitListCloud, deleteHabit as deleteHabitCloud, getHabitFromID } from './db_ops';


// Function to store data
export const storeData = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, value);
        return { error: false }
    } catch (e) {
        return { error: "AsyncStorage: Failed to save the data to the storage" + e }
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
            const habitList = Array.isArray(userData["habitList"]) ? userData["habitList"] : JSON.parse(userData["habitList"]);

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
    try {
        habitList = await retrieveLocalHabitList();
        if (habitList) {
            const newHabitList = Habit.updateHabitInHabitList(habit, habitList);
            const res = await storeData("habitList", JSON.stringify(newHabitList));
            if (res.error) {
                return { error: res.error };
            } else {
                return { error: false };
            }
        } else {
            return { error: "Habit Object Update Error" };
        }
    } catch (e) {
        return { error: `Local update failed: ${e.message}` };
    }
};



// Retrieve Habit Object from habitList if habitList exists, otherwise use local storage: type Habit
export const retrieveHabitObject = async (habitName, habitList) => {
    // If habitList is not explicityl defined, retrieve from local storage, otherwise retrieve the object from specified habit list
    if (!habitList) {
        habitList = await retrieveLocalHabitList();
    } else {
        if (!Array.isArray(habitList)) {
            return { error: `Retrieve Habit Object Error: habitList is not of type array. type: ${typeof habitList}` }
        }

        // habitList is properly defined as an array
    }

    // By this point, habit list must be an array
    const thisHabit = habitList.find((habit) => {
        return habit.habitName.localeCompare(habitName) === 0;
    })

    if (thisHabit) {
        try {
            return Habit.parseHabit(thisHabit)
        } catch (e) {
            return { error: "Failed Parsing Habit " + habitName }
        }
    } else {
        return { error: "Habit Not Found: " + habitName }
    }
}

// WORK IN PROGRESS
export const deleteHabitObject = async (habitJSONObject, email) => {
    let habit;
    try {
        habit = Habit.parseHabit(habitJSONObject);
    } catch (e) {
        return { error: "storage.js/deleteHabitObject: Failing parsing into habit " + habitJSONObject }
    }

    let habitList;
    // get the habit list
    if (!isAnonymous(email)) {
        try {

            const userData = await getUserDataFromEmail(email);
            habitList = Array.isArray(userData["habitList"]) ? userData["habitList"] : JSON.parse(userData["habitList"]);

            if (!Array.isArray(habitList)) {
                throw new Error("habitList is not an array. habitList: " + typeof habitList)
            }

        } catch (e) {
            return { error: "storage.js/deleteHabitObject: " + e }
        }
    } else {
        habitList = await retrieveLocalHabitList();
    }
    // remove the habit object from the habitList;
    const newHabitList = Habit.deleteHabitFromHabitList(habit, habitList)
    let response;
    // if signed in, store it back into the cloud. otherwise, store it back into local storage
    if (!isAnonymous(email)) {
        response = await updateUserHabitList(email, newHabitList);
    } else {
        response = await storeData("habitList", JSON.stringify(newHabitList));
    }
    if (response.error) {
        return { error: response.error }
    } else {
        return { error: false }
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
    const habitDataList = await retrieveLocalHabitList();
    const habitExists = Habit.habitExistsInList(habit, habitDataList);

    if (!habitExists) {
        habitDataList.push(habit.getJSON());
        const res = await storeData("habitList", JSON.stringify(habitDataList));
        if (res.error) {
            return { error: res.error }
        }
        return { error: false }
    } else {
        return { error: "Can Not Insert Habit into Local Storage: Habit Already Exists" }
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
    const habitList = await retrieveLocalHabitList();

    habitJSON = habitList.find(habit => {
        return habit.habitID = habitID;
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

        storeData("habitList", JSON.stringify(newLocalHabits));
        return {
            ok: true,
            message: `Deleted Habit ${habit.getName()}`
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