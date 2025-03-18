import { email } from "./userTypes";


export type habitModificationType = "log" | "modify"

export type sharedItemType = "habit" | "task"

export type userSelectMap = Map<email, boolean>;

export type habitGoal = {
    "goalNumber": number,
    "unit": string,
    "timeFrameCount": number,
    "timeFrameLabel": string

}

export interface DataPoint {
    id: string;
    x: number;
    y: number;
    data?: Record<string, any>;
}

