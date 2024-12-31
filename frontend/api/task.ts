import constants from "@/constants/constants"
import { filterOptions } from "./types_and_utils"
type TaskUser = {
    email: string,
    permission: "admin" | "standard"
}

type taskProperty = "Name" | "Description" | "Importance" | "Deadline"


export default class Task {
    private taskID: string
    private name: string
    private description: string
    private deadline: Date | null
    private importance: number | null
    private sharedUsers: TaskUser[] = []
    private completed: boolean = false;

    static fromObject(taskObject: any, id: string): Task | null {

        if (taskObject === undefined || taskObject === null) {
            return null;
        }

        // FIX THIS: ENSURE TASK DEADLINE IS PROPER
        const taskDeadline: Date | null = taskObject.deadline ? new Date(taskObject.deadline.toDate()) : null;
        const sharedUsers: TaskUser[] = taskObject.sharedUsers;
        const task = new Task(id, taskObject.taskName, taskObject.description, taskDeadline, taskObject.importance, taskObject.completed, sharedUsers);
        return task;
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
    constructor(taskID: string = "-1", name: string, description: string = "", deadline: Date | null = null, importance: number | null = null, completed: boolean = false, sharedUsers?: TaskUser[],) {

        // IF A TASK ID IS NOT GIVEN, ASSIGN IT A TASK ID USING NAME AND LINUX EPOCH TIME
        this.taskID = taskID === "-1" ? `${name}${new Date().getTime()}` : taskID
        this.name = name.length === 0 ? "Unnamed Task" : name;
        this.description = description;
        this.deadline = deadline;
        this.importance = importance;
        this.completed = completed;
        if (sharedUsers)
            this.sharedUsers = sharedUsers;
    }

    setName(name: string) {
        this.name = name;
    }

    setDeadline(deadline: Date | null) {
        this.deadline = deadline;
    }

    getName(): string {
        return this.name;
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

    addSharedUser(user: TaskUser) {
        this.sharedUsers.push(user);

    }

    getTaskID(): string {
        return this.taskID;
    }

    getCompleted(): boolean {
        return this.completed;
    }

    setCompleted(completed: boolean) {
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

    getJSON() {
        return {
            taskID: this.getTaskID(),
            taskName: this.getName(),
            description: this.getDescription(),
            importance: this.getImportance(),
            deadline: this.getDeadline(),
            completed: this.getCompleted(),
            sharedUsers: this.getSharedUsers()
        }
    }



}

