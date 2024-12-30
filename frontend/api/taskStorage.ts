import Task from "./task";
import { storeData, retrieveData } from "./storage";
import { isAnonymous } from "@/constants/constants";

export const updateTask = async (task: Task, email: String) => {

    const offline = isAnonymous(email);

    // This function is meant to first: if online, update it in the cloud. If TASK NOT FOUND, INSERT IT. OTHERWISE, MODIFY IT TO NEW TASK
    // If offline: IF NOT FOUND, INSERT IT. IF IT IS FOUND, THAN UPDATE IT.

}