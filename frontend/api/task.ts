
type TaskUser = {
    email: string,
    permission: "admin" | "standard"
}

export default class Task {
    private taskID: number
    private name: string
    private description: string
    private deadline: Date | null
    private priority: number | null



    constructor(taskID: number, name: string, description: string = "", deadline: Date | null = null, priority: number | null = null) {
        this.taskID = taskID;
        this.name = name;
        this.description = description;
        this.deadline = deadline;
        this.priority = priority;
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

    // -1 priority means it hasn't been set
    getPriority() {
        if (this.priority) {
            return this.priority
        } else {
            return -1
        }
    }

    getDeadline() {
        if (!this.deadline) return "NO_DEADLINE"
        return this.deadline.toDateString()
    }


    getSharedUsers() {
        const temp: TaskUser = {email: "checkEmail", permission: "admin"}
        return [temp]
    }


}