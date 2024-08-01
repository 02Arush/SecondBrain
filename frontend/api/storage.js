import AsyncStorage from '@react-native-async-storage/async-storage';
import Habit from './habit';
import { isAnonymous } from '@/constants/constants';
import { getUserDataFromEmail, updateUserHabitList } from './db_ops';

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
            console.log('No data found for key:', key);
            return null;
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


// Returns: Array<any>
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
