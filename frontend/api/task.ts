import constants from "@/constants/constants"

type TaskUser = {
    email: string,
    permission: "admin" | "standard"
}

export default class Task {
    private taskID: string
    private name: string
    private description: string
    private deadline: Date | null
    private importance: number | null
    private sharedUsers: TaskUser[] = []
    private completed: boolean = false;

    static fromObject(taskObject: any, id: string) {

        if (taskObject === undefined || taskObject === null) {
            return null;
        }

        const taskDeadline: Date | null = taskObject.deadline ? new Date(taskObject.deadline.toDate()) : null;
        const sharedUsers: TaskUser[] = taskObject.sharedUsers;
        const task = new Task(id, taskObject.taskName, taskObject.description, taskDeadline, taskObject.importance, taskObject.completed, sharedUsers);
        return task;
    }

    constructor(taskID: string = "-1", name: string, description: string = "", deadline: Date | null = null, importance: number | null = null, completed: boolean = false, sharedUsers?: TaskUser[],) {

        this.taskID = taskID;
        this.name = name.length === 0 ? "Unnamed Task" : name;
        this.description = description;
        this.deadline = deadline;
        this.importance = importance;
        this.completed = completed;
        if (sharedUsers)
            this.sharedUsers = sharedUsers;
    }

    setName(name: string) {

    }

    setDeadline(deadline: Date) {

    }

    getName() {
        return this.name;
    }

    getDescription() {
        return this.description;
    }

    // -1 importance means it hasn't been set
    getImportance() {
        if (this.importance) {
            return this.importance
        } else {
            return -1
        }
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

}

