

import constants, { ROLE_POWERS } from "@/constants/constants";
import {
    ensureJSDate,
    getDateFromSimpleDate, getElapsedDays,
    stringToTimeFrame,
    timeFrameConverter
} from "../types_and_utils";
import { SharableItem } from "./SharableItem";
import { SimpleDate, timeFrame } from "./dateTypes";
import { habitGoal } from "./miscTypes";

import { getFlooredDate } from "../types_and_utils";
import { email, sharedUser } from "./userTypes";
// TODO: CREATE A COMMON TYPE FOR SHAREDUSER, BECAUSE STRING ARRAY MAY NOT BE ACCURATE

export interface HabitJSON {
    "habitName": string,
    "unit": string | null,
    "activityLog": { [key: string]: number },
    "goal"?: habitGoal | null,
    "creationDate"?: Date
    "sharedUsers"?: { [key: email]: sharedUser },
    "habitID": string
}

interface habitActivity {
    date: string,
    count: number
}

export default class Habit implements SharableItem {

    private habitName: string;
    private habitID: string;
    private activityLog: Map<string, number>;
    private unit: string;
    private goal: HabitGoal | null = null;
    private creationDate: Date;
    private age: number; // Age in days
    private sharedUsers: { [key: email]: sharedUser };
    private sortedActivityLog: Array<habitActivity>



    constructor(name: string, unit: string = "NULL_UNIT", activityLog: Map<string, number> = new Map<string, number>(), goal?: HabitGoal, creationDate?: Date, habitID?: string, sharedUsers?: { [key: email]: sharedUser }) {
        this.habitName = name;
        this.unit = unit;
        this.activityLog = activityLog;
        if (goal) this.goal = goal
        this.creationDate = creationDate || new Date();
        this.creationDate = ensureJSDate(this.creationDate);
        this.ensureProperCreationDate()

        this.habitID = habitID || this.habitName + Math.floor((new Date().getTime() / 1000));
        this.age = getElapsedDays(this.creationDate, new Date())
        this.sharedUsers = sharedUsers || {};
        this.sortedActivityLog = this.genSortedActivityLog()

    }

    setName(name: string) {
        this.habitName = name;
    }

    setID(habitID: string) {
        this.habitID = habitID;
    }

    setActivityLog(activityLog: Map<string, number>) {
        this.activityLog = activityLog || {}
    }

    getAge(): number {
        return this.age;
    }

    getFirstActivityDate(): Date {

        const dates = this.getDates()
        if (dates.length > 0) {
            return new Date(dates[0])
        }
        return new Date();
    }

    ensureProperCreationDate(): void {
        const currCreationDate: Date = this.getCreationDate()
        if (!(currCreationDate instanceof Date)) {
     
        }
        const firstActDate = this.getFirstActivityDate()

        this.creationDate = currCreationDate.getTime() < firstActDate.getTime() ? currCreationDate : firstActDate
        this.age = getElapsedDays(this.creationDate, new Date());
    }

    getSharedUsers(): { [key: email]: sharedUser } {
        return this.sharedUsers;
    }

    getCreationDate(): Date {
        return this.creationDate || new Date()
    }

    addSharedUser(sharedHabitUser: sharedUser) {
        const email = sharedHabitUser.email;
        this.sharedUsers[email] = sharedHabitUser;
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


        const { habitName, unit, activityLog: activityLogData, creationDate, goal, habitID, sharedUsers } = habitJSON;

        let activityLog;
        try {
            activityLog = activityLogData instanceof Map
                ? activityLogData
                : new Map<string, number>(Object.entries(activityLogData));

        } catch (e) {
            activityLog = new Map<string, number>();
        }
        // Convert activityLogData to a Map

        // Parse the goal if present
        const parsedHabitGoal = goal ? HabitGoal.parseJSON(goal) : undefined;
        const newHabit = new Habit(habitName, unit || undefined, activityLog, parsedHabitGoal, creationDate, habitID, sharedUsers);

        // Return new Habit instance
        return newHabit
    };

    static habitExistsInList(habit: Habit, habitList: Array<any>) {
        const habitID = habit.getID();
        if (!Array.isArray(habitList)) {
            throw new Error('Error: Habit List is not an Array. Type: ' + typeof habitList);
        }


        const habitExists = habitList.some(
            (habit: any) => habitID == habit.habitID
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



    static mergeHabits(newHabitName: string, newHabitUnit: string, habit1: Habit, habit2: Habit, overwrite = false): Habit {

        const creationDate = habit1.getCreationDate().getTime() < habit2.getCreationDate().getTime() ?
            habit1.getCreationDate() : habit2.getCreationDate()

        const mergedHabit = new Habit(newHabitName, newHabitUnit, undefined, undefined, creationDate);


        if (overwrite) {
            const h1Activities = (habit1.getActivityLog());
            const h2Activities = (habit2.getActivityLog());

            const mergedActivityLog = new Map(Object.entries({ ...h1Activities, ...h2Activities }));
            mergedHabit.setActivityLog(mergedActivityLog);
            return mergedHabit;

        }

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


        const flooredStartDate = getFlooredDate(startDate);

        const elapsedDays = getElapsedDays(startDate, endDate)
        const numBars = Math.min(maxNumberOfBars, elapsedDays)

        // Use ceil so that you don't exceed the max number of bars
        const daysPerStep = Math.ceil(elapsedDays / numBars)

        const dateGroups = Array<Date>()
        const countGroups = Array<{ date: string, count: number }>()

        dateGroups.push(startDate)

        // Print the dates evenly distributed across the startDate and endDate
        // console.log("DAYS PER STEP" + daysPerStep.toString())
        let i = flooredStartDate.getTime() // MS
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
        const vals: number[] = Array.from(this.activityLog.values());

        const sum = vals.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

        if (mode === "total") {
            return sum;
        }

        const dates = this.getDates();

        if (dates.length === 0) {
            return 0;
        }

        const firstDate = new Date(dates[0]);
        const currDate = new Date();

        const elapsedDays = getElapsedDays(firstDate, currDate) + 1

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

    getID(): string {
        return this.habitID;
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

    getActivityLog() {

        if (this.activityLog instanceof Map) {
            return Object.fromEntries(this.activityLog)
        } else {
            return this.activityLog;
        }
    }



    getJSON(): HabitJSON {

        const habitJSON: HabitJSON = {
            "habitName": this.habitName,
            "unit": this.unit,
            "activityLog": Object.fromEntries(this.activityLog),
            "creationDate": this.creationDate || this.getFirstActivityDate(),
            "habitID": this.getID(),
        }

        if (this.goal) {
            habitJSON["goal"] = this.goal.JSON()
        } else {
            habitJSON["goal"] = null;
        }

        if (this.sharedUsers) {
            habitJSON["sharedUsers"] = this.getSharedUsers();
        }

        return habitJSON
    }

    getJSONString() {
        return JSON.stringify(this.getJSON());
    }

    private genSortedActivityLog(direction: "ascending" | "descending" = "ascending"): habitActivity[] {
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

    getSortedActivityLog() {
        return this.sortedActivityLog
    }


    logItem(date: Date, quantity: number, overwrite = false) {
        const dateKey = date.toDateString();
        const currCount: number = this.activityLog.get(dateKey) || 0;

        if (overwrite) {
            this.activityLog.set(dateKey, quantity)
        } else {
            this.activityLog.set(dateKey, currCount + quantity);
        }
    }

    /**
     * @returns {number} - Either: total count of occurences of habit during span of numDays, or average count per day over span of numDays
     */
    getCountPastXDays(numDays: number, mode: "total" | "average" = "total"): number {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (numDays - 1));  // Today is included, and day
        const total = this.getCountFromDateRange(startDate, endDate, true);
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

    getAveragePerTimeFrameAllTime(windowTimeFrameCount: number, windowTimeFrameLabel: timeFrame): number {
        const windowSizeInDays = windowTimeFrameCount * timeFrameConverter[windowTimeFrameLabel];
        const averagePerDayAllTime = this.getTotalCount("average");
        return windowSizeInDays * averagePerDayAllTime;
    }

    private calculateAverage(sum: number, days: number) {
        return sum / days;
    }

    getRoleOfUser(email: email): { ok: boolean, data: string, message: string } {

        try {
            const sharedUser = this.sharedUsers[email];
            const role = sharedUser.role;
            return { ok: true, data: role, message: "Role found successfully" }
        } catch (e) {
            return {
                ok: false,
                data: constants.ROLE.MEMBER,
                message: `Role not found for user: ${email}, habit: ${this.getName()}`
            }
        }
    }


    removeSharedUser(email: email) {
        delete this.sharedUsers[email]

        if (Object.keys(this.sharedUsers).length > 0)
            this.ensureOwnerExists();
    }

    changeRoleOfUser(email: email, newRole: string) {

        const initialRole = this.sharedUsers[email].role;

        if (email in this.sharedUsers) {
            this.sharedUsers[email].role = newRole
        }
        this.ensureOwnerExists();

        const roleChanged = initialRole.localeCompare(this.sharedUsers[email].role) != 0
        return roleChanged
    }


    ensureOwnerExists(): void {

        try {
            const compareSharedUsers = (a: sharedUser, b: sharedUser) => {
                // If A's Power is higher than B, it should come earlier in the list
                const roleDiff = ROLE_POWERS[b.role] - ROLE_POWERS[a.role];

                // joinDate is either a date or a timestamp: force it to be a date object

                if (roleDiff == 0) {
                    const aJoinDate = ensureJSDate(a.joinDate).getTime();
                    const bJoinDate = ensureJSDate(b.joinDate).getTime();
                    // If A's Join Date < B's Join Date, it should come earleir in the list
                    return aJoinDate - bJoinDate;
                } else {
                    return roleDiff
                }
            }

            // ERROR HERE RETRIEVING HIGHEST PRIORITY USER
            const values = Object.values(this.getSharedUsers()).sort(compareSharedUsers);
            const highestPriorityUser = values[0].email;
            this.sharedUsers[highestPriorityUser].role = constants.ROLE.OWNER
        } catch (err) {
            // JUST TO KEEP ERROR HANDLING ROBUST
        }

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

    setUnit(unit: string) {
        this.unit = unit;
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


