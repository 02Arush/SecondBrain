import { retrieveData } from "./storage";

export default class Habit {

    private habitName: string;
    private activityLog: Map<string, number>;
    private unit: string;

    constructor(name: string, unit: string, activityLog: Map<string, number> = new Map<string, number>()) {
        this.habitName = name;
        this.unit = unit;
        this.activityLog = activityLog;
    }

    static parseHabit(json: HabitJSON | string) {
        let habitName: string;
        let unit: string;
        let activityLogData: { [key: string]: number } | Map<string, number>;


        if (typeof json === "string") {
            const habitJSON = JSON.parse(json);
            habitName = habitJSON.habitName;
            unit = habitJSON.unit;
            activityLogData = habitJSON.activityLog;
        } else {
            habitName = json.habitName;
            unit = json.unit || "units";
            activityLogData = json.activityLog;
        }

        // Convert activityLogData to a Map if it is not already one
        let activityLog = activityLogData instanceof Map
            ? activityLogData
            : new Map<string, number>(Object.entries(activityLogData));

        return new Habit(habitName, unit, activityLog);
    }

    static habitExistsInList(habitName: string, habitList: Array<any>) {
        if (!Array.isArray(habitList)) {
            alert(typeof habitList)
            alert(JSON.stringify(habitList))
            throw new Error('Error: Habit List is not an Array.');
        }


        const habitExists = habitList.some(
            (habit: any) => habit.habitName.toLowerCase() === habitName.toLowerCase()
        );
        return habitExists;
    }

    static updateHabitInHabitList(habit: Habit, habitList: Array<any>) {
        const habitJSONObject = habit.getJSON();
        const idx = Habit.getIdxOfHabit(habit, habitList)

        if (idx >= 0) {
            habitList[idx] = habitJSONObject;
            return habitList;
        } else {
            console.log("ERROR in updateHabitInHabitList")
            return { error: "Habit not found in habitList" }
        }

    }

    static getIdxOfHabit(habit: Habit, habitList: Array<any>): number {
        const idx = habitList.findIndex((currHabit) => {
            return habit.getName().localeCompare(currHabit.habitName) === 0;
        })

        return idx
    }

    static deleteHabitFromHabitList(habit: Habit, habitList: Array<any>) {
        const idx = Habit.getIdxOfHabit(habit, habitList);
        if (idx !== -1) {
            habitList.splice(idx, 1);
            return habitList;
        } else {
            return { error: "habit.ts: habit not found in habitList" }
        }
    }



    static mergeHabits(newHabitName: string, newHabitUnit: string, habit1: Habit, habit2: Habit): Habit {
        const mergedHabit = new Habit(newHabitName, newHabitUnit);
        const h1Activities = habit1.getSortedActivityLog();
        const h2Activities = habit2.getSortedActivityLog();
        h1Activities.forEach((activity) => {
            mergedHabit.logItem(new Date(activity.date), activity.count);
        })
        h2Activities.forEach((activity) => {
            mergedHabit.logItem(new Date(activity.date), activity.count);
        })

        return mergedHabit;
    }

    // This function is here to help us merge habit lists from anonymous users to their registered or logged in accounts
    static mergeHabitLists(primaryList: Array<any>, secondaryList: Array<any>) {

        for (let habit in secondaryList) {
            primaryList.push(habit);
        }

        let listWithoutDuplicates: Array<Habit> = [];
        let foundHabits: Map<string, number> = new Map();
        let newListIdx = 0;

        for (let i = 0; i < primaryList.length; i++) {
            alert(JSON.stringify(primaryList[i]));
            let currHabit = Habit.parseHabit(primaryList[i]);
            let currName = currHabit.getName();
            let currUnit = currHabit.getUnit();

            const habitAlreadyFound = foundHabits.has(currName);;
            if (habitAlreadyFound) {
                let originalHabitIdx = foundHabits.get(currName);
                if (originalHabitIdx) {
                    let originalHabit = listWithoutDuplicates[originalHabitIdx];
                    listWithoutDuplicates[originalHabitIdx] = Habit.mergeHabits(currName, currUnit, originalHabit, currHabit);
                } else {
                    throw new Error("Habit Indexing Error: Habit.ts")
                }

            } else {
                listWithoutDuplicates.push(currHabit);
                foundHabits.set(currHabit.getName(), newListIdx);
                newListIdx += 1;
            }
        }

        return listWithoutDuplicates;
    }

    getTodayCount() {
        return this.activityLog.get(new Date().toDateString()) || 0;
    }

    getCountOfDate(date: string) {
        const dateString = new Date(date).toDateString();
        return this.activityLog.get(dateString) || 0; // Returns int or 0 if not found
    }

    getCountFromDateRange(startDate: string, endDate: string) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let sum = 0;

        for (let [date, count] of this.activityLog) {
            const current = new Date(date);
            if (current >= start && current <= end) {
                sum += count;
            }
        }

        return sum;
    }

    getTotalCount(mode: "total" | "average" = "total") {
        const vals = Array.from(this.activityLog.values());
        let sum = 0;
        vals.forEach(element => {
            sum += element;
        });

        if (mode === "total") {
            return sum;
        }

        const dates = this.getDates();

        if (dates.length === 0) {
            return 0;
        }

        const firstDate = new Date(dates[0]);
        const currDate = new Date();

        let elapsedDays = (currDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24);

        if (elapsedDays < 1) {
            elapsedDays = 1;
        }

        return mode == "average" ? this.calculateAverage(sum, elapsedDays) : sum;
    }

    getDates() {
        const dates = Array.from(this.activityLog.keys()).sort((date1, date2) => {
            return new Date(date1).getTime() - new Date(date2).getTime();
        });
        return dates;
    }

    getUnit() {
        return this.unit;
    }

    getName() {
        return this.habitName;
    }

    updateCountOnDate(date: string, count: number) {
        const dateString = new Date(date).toDateString();
        const currentCount = this.activityLog.get(dateString) || 0;
        this.activityLog.set(dateString, currentCount + count);
    }

    getJSON() {
        return {
            "habitName": this.habitName,
            "unit": this.unit,
            "activityLog": Object.fromEntries(this.activityLog)
        }
    }

    getJSONString() {
        return JSON.stringify(this.getJSON());
    }

    getSortedActivityLog(direction: "ascending" | "descending" = "ascending"): { date: string; count: number }[] {
        const dates = Array.from(this.activityLog.keys()).sort((date1, date2) => {
            return new Date(date1).getTime() - new Date(date2).getTime();
        });

        if (direction === "descending") {
            dates.reverse();
        }

        const sortedData = dates.map(date => ({
            date: date,
            count: this.activityLog.get(date) || 0
        }));

        return sortedData;
    }

    logItem(date: Date, quantity: number) {
        const dateKey = date.toDateString();
        const currCount: number = this.activityLog.get(dateKey) || 0;
        this.activityLog.set(dateKey, currCount + quantity);
    }

    private calculateAverage(sum: number, days: number) {
        return sum / days;
    }

    getCountPast7Days(mode: "total" | "average" = "total") {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        const total = this.getCountFromDateRange(startDate.toDateString(), endDate.toDateString());
        return mode === "average" ? this.calculateAverage(total, 7) : total;
    }

    getCountPast30Days(mode: "total" | "average" = "total") {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        const total = this.getCountFromDateRange(startDate.toDateString(), endDate.toDateString());
        return mode === "average" ? this.calculateAverage(total, 30) : total;
    }

    getCountPast6Months(mode: "total" | "average" = "total") {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 6);
        const total = this.getCountFromDateRange(startDate.toDateString(), endDate.toDateString());
        const days = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        return mode === "average" ? this.calculateAverage(total, days) : total;
    }

    getCountPastYear(mode: "total" | "average" = "total") {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        const total = this.getCountFromDateRange(startDate.toDateString(), endDate.toDateString());
        const days = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        return mode === "average" ? this.calculateAverage(total, days) : total;
    }

}

export interface HabitJSON {
    "habitName": string,
    "unit": string | null,
    "activityLog": { [key: string]: number }
}
