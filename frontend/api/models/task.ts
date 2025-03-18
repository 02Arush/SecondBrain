import constants, { ROLE_POWERS } from "@/constants/constants"
import {  ensureJSDate, filterOptions, getElapsedDays } from "../types_and_utils"
import { SharableItem } from "./SharableItem"
type taskProperty = "Name" | "Description" | "Importance" | "Deadline"
import {email, sharedUser} from "./userTypes"


export default class Task implements SharableItem {
    private taskID: string
    private name: string
    private description: string
    private deadline: Date | null
    private importance: number | null
    private sharedUsers: { [key: email]: sharedUser };
    private completed: boolean = false;
    private lastCompletionDate: Date | null;

    static fromObject(taskObject: any, id: string): Task | null {

        try {

            if (taskObject == undefined || taskObject == null) {
                return null;
            }

            // FIX THIS: ENSURE TASK DEADLINE IS PROPER
            const taskObjDeadline = taskObject.deadline;
            const hasDeadline = taskObjDeadline != null || taskObjDeadline != undefined
            const taskDeadline = hasDeadline ? ensureJSDate(taskObjDeadline) : null;
            const lastCompletionDate = taskObject.lastCompletionDate ? ensureJSDate(taskObject.lastCompletionDate) : undefined

            const sharedUsers = taskObject.sharedUsers;
            const task = new Task(id, taskObject.taskName, taskObject.description, taskDeadline, taskObject.importance, taskObject.completed, lastCompletionDate, sharedUsers);

            return task;

        } catch (err) {
            return null;
        }

    }

    // typescript sorts least to greatest, so smaller numbers come closer to the front
    static sortTaskList(tasks: Array<Task>, sort: string): Array<Task> {
        switch (sort) {
            case filterOptions.DATE_EARLIEST:
                return tasks.sort((a, b) => {
                    const a_deadline = a.getDeadline()?.getTime() || Number.POSITIVE_INFINITY;
                    const b_deadline = b.getDeadline()?.getTime() || Number.POSITIVE_INFINITY;

                    return a_deadline - b_deadline;
                });
            case filterOptions.DATE_FURTHEST:
                return tasks.sort((a, b) => {
                    const a_deadline = a.getDeadline()?.getTime() || Number.POSITIVE_INFINITY;
                    const b_deadline = b.getDeadline()?.getTime() || Number.POSITIVE_INFINITY;

                    return b_deadline - a_deadline;
                });


            case filterOptions.IMPORTANCE_HIGHEST:
                return tasks.sort((a, b) => {
                    return b.getImportance() - a.getImportance()
                })
            case filterOptions.IMPORTANCE_LOWEST:
                return tasks.sort((a, b) => {
                    return a.getImportance() - b.getImportance()
                })
            default:
                return tasks
        }
    }

    // The reason why taskID is not an optional parameter yet, is because it was made "optional" later on in the procss, but would mess up the orderings of the rest of the 
    // parameters if I now made it optional wherever its used- ideally, it would be an optional parameter
    constructor(taskID: string = "-1", name: string, description: string = "", deadline: Date | null = null, importance: number | null = null, completed: boolean = false, lastCompletionDate?: Date, sharedUsers?: { [key: email]: sharedUser }) {

        // IF A TASK ID IS NOT GIVEN, ASSIGN IT A TASK ID USING NAME AND LINUX EPOCH TIME
        this.taskID = taskID === "-1" ? `${name}${new Date().getTime()}` : taskID
        this.name = name.length === 0 ? "Unnamed Task" : name;
        this.description = description;
        this.deadline = deadline;
        this.importance = importance;
        this.completed = completed;
        this.lastCompletionDate = lastCompletionDate || null;
        this.sharedUsers = sharedUsers || {};
    }

    setName(name: string) {
        this.name = name;
    }


    getName(): string {
        return this.name;
    }

    setDeadline(deadline: Date | null) {
        this.deadline = deadline;
    }

    setLastCompletionDate(date: Date) {
        this.lastCompletionDate = date;
    }


    getLastCompletionDate(): Date | null {
        return this.lastCompletionDate;
    }


    getDescription() {
        return this.description;
    }

    setDescription(description: string) {
        this.description = description;
    }

    // -1 importance means it hasn't been set
    getImportance() {
        if (this.importance) {
            return this.importance
        } else {
            return -1
        }
    }

    setImportance(importance: number | null) {
        this.importance = importance

    }

    getDeadline(): Date | null {
        return this.deadline
    }

    getSharedUsers() {
        return this.sharedUsers;
    }

    addSharedUser(user: sharedUser) {

        const email = user.email;
        this.sharedUsers[email] = user;
    }

    removeSharedUser(email: email) {
        delete this.sharedUsers[email]

        if (Object.keys(this.sharedUsers).length > 0)
            this.ensureOwnerExists();
    }

    ensureOwnerExists(): void {
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

        const values = Object.values(this.getSharedUsers()).sort(compareSharedUsers);
        const highestPriorityUser = values[0].email;
        this.sharedUsers[highestPriorityUser].role = constants.ROLE.OWNER

    }


    clearSharedUsers() {
        this.sharedUsers = {}
    }

    getID(): string {
        return this.taskID;
    }

    getCompleted(): boolean {
        return this.completed;
    }

    setCompleted(completed: boolean) {

        if (this.completed) {
            this.lastCompletionDate = new Date();
        } else {
            this.lastCompletionDate = null;
        }

        this.completed = completed;
    }

    getProperty(property: string): string | number | Date | null {
        switch (property) {
            case "Name": return this.getName();
            case "Description": return this.getDescription();
            case "Deadline": return this.getDeadline();
            case "Importance": return this.getImportance()
        }
        return null
    }

    setProperty(property: taskProperty, value: string | number | Date | null): boolean {

        switch (property) {
            case "Name": {
                if (typeof value === "string") {
                    this.setName(value);
                    return true;
                }
                return false;
            }
            case "Description": {
                if (typeof value === "string") {
                    this.setDescription(value);
                    return true;
                }
                return false;

            }
            case "Deadline": {
                if (value instanceof Date || value === null) {
                    this.setDeadline(value);
                    return true;
                } return false;
            }

            case "Importance": {
                if (typeof value === "number" || value === null) {
                    this.setImportance(value);
                    return true;
                } return false;
            }

            default: {
                return false;
            }
        }

    }


    /**
     * This function is here to ensure that we don't keep completed tasks for too long.
     * Thus, if a task is a) COMPLETED and b) 14 days past either it's deadline or LAST COMPLETION DATE, 
     * Then it should be pinged for deletion
     */
    isExpired(): boolean {
        if (this.lastCompletionDate) {
            return getElapsedDays(this.lastCompletionDate, new Date()) > 14
        }

        return false;

    }



    getJSON() {
        return {
            taskID: this.getID(),
            taskName: this.getName(),
            description: this.getDescription(),
            importance: this.getImportance(),
            deadline: this.getDeadline(),
            completed: this.getCompleted(),
            sharedUsers: this.getSharedUsers(),
            lastCompletionDate: this.getLastCompletionDate(),
        }
    }


    // TODO: IMPLEMENT THIS
    getRoleOfUser(email: email): { ok: boolean, data: string, message: string } {

        try {
            const sharedUser = this.sharedUsers[email];
            const role = sharedUser.role;
            return { ok: true, data: role, message: "Role found successfully" }
        } catch (e) {
            return {
                ok: false,
                data: constants.ROLE.MEMBER,
                message: `Role not found for user: ${email}, task: ${this.getName()}`
            }
        }
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



}

