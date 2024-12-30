

import { stringToTimeFrame, timeFrame, habitGoal, timeFrameConverter, SimpleDate, getDateFromSimpleDate, getElapsedDays } from "./types_and_utils";



export interface HabitJSON {
    "habitName": string,
    "unit": string | null,
    "activityLog": { [key: string]: number },
    "goal"?: habitGoal
    "creationDate"?: Date
}

export default class Habit {

    private habitName: string;
    private activityLog: Map<string, number>;
    private unit: string;
    private goal: HabitGoal | null = null;
    private creationDate: Date;
    private age: number; // Age in days



    constructor(name: string, unit: string = "NULL_UNIT", activityLog: Map<string, number> = new Map<string, number>(), goal?: HabitGoal, creationDate?: Date) {
        this.habitName = name;
        this.unit = unit;
        this.activityLog = activityLog;
        if (goal) this.goal = goal
        if (!creationDate || !(creationDate instanceof Date)) {
            this.creationDate = this.getFirstActivityDate();
        } else {
            this.creationDate = creationDate;
        }

        this.age = Math.floor((new Date().getTime() - this.creationDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    getAge(): number {
        return this.age;
    }

    getFirstActivityDate(): Date {
        const activities = this.getSortedActivityLog("ascending")
        if (activities.length > 0) {
            const firstDate = new Date(activities[0].date)
            return firstDate;
        }
        return new Date();
    }

    getCreationDate(): Date {
        return this.creationDate
    }

    static parseHabit = (json: object | string): Habit => {
        let habitJSON: HabitJSON;

        // Parse JSON input
        switch (typeof json) {
            case "string":
                habitJSON = JSON.parse(json);
                break;
            case "object":
                habitJSON = json as HabitJSON;
                break;
            default:
                throw new Error("Unsupported type of json " + typeof json);
        }



        const { habitName, unit, activityLog: activityLogData, creationDate, goal } = habitJSON;

        // Convert activityLogData to a Map
        const activityLog = activityLogData instanceof Map
            ? activityLogData
            : new Map<string, number>(Object.entries(activityLogData));

        // Parse the goal if present
        const parsedHabitGoal = goal ? HabitGoal.parseJSON(goal) : undefined;

        // Return new Habit instance
        return new Habit(habitName, unit || undefined, activityLog, parsedHabitGoal, creationDate);
    };

    static habitExistsInList(habitName: string, habitList: Array<any>) {
        if (!Array.isArray(habitList)) {
            throw new Error('Error: Habit List is not an Array. Type: ' + typeof habitList);
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

        const creationDate = habit1.getCreationDate().getTime() < habit2.getCreationDate().getTime() ?
            habit1.getCreationDate() : habit2.getCreationDate()

        const mergedHabit = new Habit(newHabitName, newHabitUnit, undefined, undefined, creationDate);
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

    getCountOfDate(date: string | SimpleDate) {
        let dateString;

        if (typeof date === "string") {
            dateString = new Date(date).toDateString();
        } else {
            const dateToCheck = getDateFromSimpleDate(date)
            if (!dateToCheck) {
                return 0;
            }

            dateString = dateToCheck.toDateString()
        }
        return this.activityLog.get(dateString) || 0; // Returns int or 0 if not found
    }

    getCountFromDateRange(startDate: Date, endDate: Date, inclusiveEnd = true) {
        let curr = new Date(startDate);
        let totalCount = 0

        const isIncluded = (date: Date): boolean => {
            const condition = inclusiveEnd ? curr.getTime() <= endDate.getTime() : curr.getTime() < endDate.getTime();
            return condition
        }


        while (isIncluded(curr)) {
            const dateString = curr.toDateString();
            const count = this.getCountOfDate(dateString);
            totalCount += count

            curr.setDate(curr.getDate() + 1)
        }

        return totalCount;
    }

    /* Returns all values in date range including start and end date, in order */
    getActivityOfDateRange(startDate: Date, endDate: Date): { date: string, count: number }[] {
        let curr = new Date(startDate);
        const log: { date: string, count: number }[] = [];

        while (curr.getTime() <= endDate.getTime()) {
            const dateString = curr.toDateString();
            const count = this.getCountOfDate(dateString);
            log.push({ date: dateString, count: count });

            curr.setDate(curr.getDate() + 1)
        }
        return log
    }



    getLogForBarcharts(startDate: Date, endDate: Date, maxNumberOfBars: number = 8): { date: string, count: number }[] {

        const elapsedDays = getElapsedDays(startDate, endDate)

        const numBars = Math.min(maxNumberOfBars, elapsedDays)

        // Use ceil so that you don't exceed the max number of bars
        const daysPerStep = Math.ceil(elapsedDays / numBars)

        const dateGroups = Array<Date>()
        const countGroups = Array<{ date: string, count: number }>()

        dateGroups.push(startDate)

        // Print the dates evenly distributed across the startDate and endDate
        // console.log("DAYS PER STEP" + daysPerStep.toString())
        let i = startDate.getTime() // MS
        while (i <= endDate.getTime()) {
            const iAsDate = new Date(i)
            const nextDateMS = i + daysPerStep * (1000 * 60 * 60 * 24)
            const nextDate = new Date(nextDateMS)

            const countToAdd = this.getCountFromDateRange(iAsDate, nextDate, false);

            countGroups.push({
                date: iAsDate.toDateString(),
                count: countToAdd
            })

            i = nextDateMS;
        }
        return countGroups;
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

    getDates(): string[] {
        const dates = Array.from(this.activityLog.keys()).sort((date1, date2) => {
            return new Date(date1).getTime() - new Date(date2).getTime();
        });
        return dates;
    }

    getShortDates(): string[] {
        const log = this.getSortedActivityLog();
        const shortDates: string[] = log.map((logObject) => {
            const date = new Date(logObject.date);
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
            return formattedDate
        })
        return shortDates;
    }


    getValues(): number[] {
        const log = this.getSortedActivityLog();
        const values = log.map((logObject) => {
            return logObject.count;
        })

        return values;
    }






    getUnit() {
        return this.unit;
    }

    setUnit(unit: string) {
        this.unit = unit;
    }

    getName() {
        return this.habitName;
    }

    updateCountOnDate(date: string, count: number) {
        const dateString = new Date(date).toDateString();
        const currentCount = this.activityLog.get(dateString) || 0;
        this.activityLog.set(dateString, count);
    }

    getJSON(): HabitJSON {

        const habitJSON: HabitJSON = {
            "habitName": this.habitName,
            "unit": this.unit,
            "activityLog": Object.fromEntries(this.activityLog),
            "creationDate": this.creationDate || this.getFirstActivityDate(),
        }

        if (this.goal) {
            habitJSON["goal"] = this.goal.JSON()
        }

        return habitJSON
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

    /**
     * @returns {number} - Either: total count of occurences of habit during span of numDays, or average count per day over span of numDays
     */
    getCountPastXDays(numDays: number, mode: "total" | "average" = "total"): number {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - numDays);  // Today is included, and day
        const total = this.getCountFromDateRange(startDate, endDate);
        return mode === "average" ? this.calculateAverage(total, numDays) : total;
    }

    getCountOverTimeFrame(timeFrameCount: number, timeFrameLabel: timeFrame, mode: "total" | "average" = "total"): number {
        const elapsedDays = timeFrameCount * timeFrameConverter[timeFrameLabel];
        const count = this.getCountPastXDays(elapsedDays, mode);
        return count;
    }

    getCountForGoalTimeFrame(): null | number {
        if (!this.goal) return null;
        const timeframeDays: number = this.goal.getGoalDurationDays();
        const countForGoalTimeFrame = this.getCountPastXDays(timeframeDays)
        return countForGoalTimeFrame;
    }

    countToGoalRatio(): number | null {
        if (!this.goal) return null;
        const desiredGoalCount = this.goal.getGoalNumber();
        const countForGoalTimeFrame = this.getCountForGoalTimeFrame();
        if (!countForGoalTimeFrame) return null;
        return countForGoalTimeFrame / desiredGoalCount;
    }

    setGoal(goal: HabitGoal | null) {
        this.goal = goal
    }

    getGoal(): HabitGoal | null {
        return this.goal;
    }

    clearGoal() {
        this.goal = null;
    }

    getAveragePerTimeFrameOverTimeFrame(windowTimeFrameCount: number, windowTimeFrameLabel: timeFrame, totalTimeFrameCount: number, totalTimeFrameLabel: timeFrame): number | null {
        const elapsedDays = totalTimeFrameCount * timeFrameConverter[totalTimeFrameLabel];
        const windowSizeInDays = windowTimeFrameCount * timeFrameConverter[windowTimeFrameLabel];
        const averagePerDay = this.getCountPastXDays(elapsedDays, "average");

        if (windowSizeInDays > elapsedDays) {
            return null;
        }

        return windowSizeInDays * averagePerDay;
    }

    getAveragePerTimeFrameAllTime(windowTimeFrameCount: number, windowTimeFrameLabel: timeFrame): number | null {
        const windowSizeInDays = windowTimeFrameCount * timeFrameConverter[windowTimeFrameLabel];
        const averagePerDayAllTime = this.getTotalCount("average");
        return windowSizeInDays * averagePerDayAllTime;
    }

    private calculateAverage(sum: number, days: number) {
        return sum / days;
    }

}


export class HabitGoal {
    private goalNumber: number
    private unit: string
    private timeFrameCount: number
    private timeFrameLabel: timeFrame

    constructor(goalNumber: number, unit: string, timeFrameCount: number, timeFrameLabel: timeFrame) {
        this.goalNumber = goalNumber
        this.unit = unit;
        this.timeFrameCount = timeFrameCount;
        this.timeFrameLabel = timeFrameLabel;
    }



    JSON(): habitGoal {
        return {
            "goalNumber": this.goalNumber,
            "unit": this.unit,
            "timeFrameCount": this.timeFrameCount,
            "timeFrameLabel": this.timeFrameLabel
        }
    }

    static parseJSON(json: habitGoal): HabitGoal {

        const timeFrameLabel = stringToTimeFrame(json.timeFrameLabel);
        if (timeFrameLabel) {
            return new HabitGoal(json.goalNumber, json.unit, json.timeFrameCount, timeFrameLabel);
        } else {
            throw new Error("Invalid JSON " + JSON.stringify(json));
        }
    }

    getGoalNumber(): number {
        return this.goalNumber;
    }

    getGoalDurationDays(): number {
        return this.timeFrameCount * timeFrameConverter[this.timeFrameLabel];
    }

    toString(): string {
        return `${this.goalNumber} ${this.unit} per ${this.timeFrameCount} ${this.timeFrameLabel}`
    }

    getUnit(): string {
        return this.unit;
    }

    getTimeFrameLabel(): timeFrame {
        return this.timeFrameLabel;
    }

    getTimeFrameCount(): number {
        return this.timeFrameCount;
    }

    getIdealCountPerDay(): number {
        const days = this.getGoalDurationDays();
        const goalNumber = this.getGoalNumber();
        return goalNumber / days;
    }
}

