import constants from "@/constants/constants"

type TaskUser = {
    email: string,
    permission: "admin" | "standard"
}

export default class Task {
    private taskID: number
    private name: string
    private description: string
    private deadline: Date | null
    private importance: number | null
    private sharedUsers: TaskUser[] = []
    private completed: boolean = false;

    static fromObject(taskObject: any, id: number) {
        const taskDeadline: Date | null = taskObject.deadline === constants.NO_TASK_DEADLINE ? null : new Date(taskObject.deadline);
        const sharedUsers: TaskUser[] = taskObject.sharedUsers;
        const task = new Task(id, taskObject.taskName, taskObject.description, taskDeadline, taskObject.importance, taskObject.completed, sharedUsers);
        return task;
    }

    constructor(taskID: number = -1, name: string, description: string = "", deadline: Date | null = null, importance: number | null = null, completed: boolean = false, sharedUsers?: TaskUser[],) {

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

    getDeadline() {
        if (!this.deadline) return "NO_DEADLINE"
        return this.deadline.toDateString()
    }


    getSharedUsers() {
        return this.sharedUsers;
    }

    addSharedUser(user: TaskUser) {
        this.sharedUsers.push(user);

    }

    getTaskID() {
        return this.taskID;
    }

    getCompleted() {
        return this.completed;
    }

    setCompleted(completed: boolean) {
        this.completed = completed;
    }





}

