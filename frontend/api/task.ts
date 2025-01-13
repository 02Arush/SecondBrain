import constants from "@/constants/constants"
import { filterOptions, getElapsedDays, sharedUser } from "./types_and_utils"
type TaskUser = {
    email: string,
    permission: string,
}
import { ensureJSDate } from "./types_and_utils"
type taskProperty = "Name" | "Description" | "Importance" | "Deadline"


export default class Task {
    private taskID: string
    private name: string
    private description: string
    private deadline: Date | null
    private importance: number | null
    private sharedUsers: sharedUser[] = []
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

            const sharedUsers: sharedUser[] = taskObject.sharedUsers;
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
    constructor(taskID: string = "-1", name: string, description: string = "", deadline: Date | null = null, importance: number | null = null, completed: boolean = false, lastCompletionDate?: Date, sharedUsers?: sharedUser[],) {

        // IF A TASK ID IS NOT GIVEN, ASSIGN IT A TASK ID USING NAME AND LINUX EPOCH TIME
        this.taskID = taskID === "-1" ? `${name}${new Date().getTime()}` : taskID
        this.name = name.length === 0 ? "Unnamed Task" : name;
        this.description = description;
        this.deadline = deadline;
        this.importance = importance;
        this.completed = completed;
        this.lastCompletionDate = lastCompletionDate || null;
        if (sharedUsers)
            this.sharedUsers = sharedUsers;
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
        this.sharedUsers.push(user);
    }

    removeSharedUser(userToRm: TaskUser) {
        const newSharedUsers = this.sharedUsers.filter(user => user.email.localeCompare(userToRm.email) != 0)
        this.sharedUsers = newSharedUsers;
    }

    clearSharedUsers() {
        this.sharedUsers = [];
    }

    getTaskID(): string {
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
            taskID: this.getTaskID(),
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
    getRoleOfUser() {
        return {
            ok: false,
            message: "NOT IMPLEMENTED",
            data: constants.ROLE.OWNER,
        }
    }



}

