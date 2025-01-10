import { getColor } from "@/constants/Colors";
import { constants } from "@/constants/constants"
import { Timestamp } from "firebase/firestore";

/**
 * STRINGS
 */

export const filterTextToInteger = (text: string): number => {
    return Number(text.replace(/[^0-9]/gi, ""));
};

export const filterTextToDecimal = (text: string): number => {
    return Number(text.replace(/[^0-9.]/gi, "").replace(/(\..*)\./g, "$1"));
};

export const limitStringLength = (text: string, length: number = 6): string => {
    const trimmedString = text.substring(0, length);
    return trimmedString;
}

export const getNicknameFromEmail = (email: string): string => {
    const emailTxt = email.split("@")[0];
    const maxNameLength = Math.min(emailTxt.length, 9);

    const nickname = emailTxt.substring(0, maxNameLength)
    return nickname;
}

export const isValidEmail = (email?: string): boolean => {
    if (!email) return false;

    return email.length > 0 && email.includes("@")
}

/**
 * DATES/TIME
 */


export const monthsAndDays: Record<string, number> = {
    "Jan": 31,
    "Feb": 28,
    "Mar": 31,
    "Apr": 30,
    "May": 31,
    "Jun": 30,
    "Jul": 31,
    "Aug": 31,
    "Sep": 30,
    "Oct": 31,
    "Nov": 30,
    "Dec": 31

}

export const months = Object.keys(monthsAndDays)

export const weekDays = [
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
]


export type timeFrame = "day" | "week" | "month" | "year"

export const timeFrameConverter: Record<string, number> = {
    "day": 1,
    "week": 7,
    "month": 30,
    "year": 365,
}

export type SimpleDate = {
    day: number;
    month: number;
    year: number;
};

export type DateRange = {
    startDate: Date,
    endDate: Date,
}

export const getDateFromSimpleDate = (simpleDate: { year: number, month: number, day: number }): Date | null => {
    const { year, month, day } = simpleDate;

    const date = new Date(year, month - 1, day);
    // This check is here because in javascript, if the month exceeds 12 or day exceeds 30, etc. than it rolls over instead of throwing an error
    // But we don't want to allow that
    if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    ) {
        return date;
    } else {
        return null;
    }
}

export const getElapsedDays = (startDate: Date, endDate: Date): number => {
    const elapsedMS = endDate.getTime() - startDate.getTime();
    const elapsedConverted = elapsedMS / (1000 * 60 * 60 * 24);
    const rounded = Math.round(elapsedConverted);
    return rounded;

}

export const getSimpleDateFromDate = (date: Date): SimpleDate => {
    return {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear()
    }
}

export const copySimpleDate = (date: SimpleDate): SimpleDate => {
    return {
        day: date.day,
        month: date.month,
        year: date.year
    }
}


export const shiftSimpleDate = (date: SimpleDate, days: number): SimpleDate => {
    const regDate = getDateFromSimpleDate(date);

    if (!regDate) {
        return date;
    }

    const newDate = new Date(regDate);
    newDate.setDate(regDate.getDate() + days);
    return getSimpleDateFromDate(newDate);

}

export const isEqualSimpleDate = (date1: SimpleDate, date2: SimpleDate): boolean => {

    return date1.day === date2.day && date1.month === date2.month && date1.year === date2.year
}

// MAKE THIS MORE EFFICIENT
export const stringToTimeFrame = (s: string): timeFrame | null => {
    s = s.trim().toLowerCase();

    switch (s) {
        case "day":
            return "day";
        case "week":
            return "week";
        case "month":
            return "month";
        case "year":
            return "year";
        default:
            return null;
    }
};

// WINRATES

export const winrateToColor = (winrate: number, theme: "light" | "dark"): string => {

    let color;
    if (winrate >= .90) color = getColor(theme, "green")
    else if (winrate >= .80) color = getColor(theme, "lime");
    else if (winrate >= .70) color = getColor(theme, "yellow")
    else if (winrate >= .50) color = getColor(theme, "orange")
    else if (winrate < .50) color = getColor(theme, "red")

    return color || "grey";
}

/*
 OBJECTS
*/

export type habitGoal = {
    "goalNumber": number,
    "unit": string,
    "timeFrameCount": number,
    "timeFrameLabel": string

}

export const filterOptions = {
    DATE_EARLIEST: "Date (Earliest)",
    DATE_FURTHEST: "Date (Furthest)",
    IMPORTANCE_HIGHEST: "Importance (Highest)",
    IMPORTANCE_LOWEST: "Importance (Lowest)",
};

/*
 MISC
*/

export const range = (startInclusive: number = 0, endExclusive: number): number[] => {
    const length = endExclusive - startInclusive;
    const arr = [...Array(length)].map((_, idx) => {
        return idx + startInclusive;
    })

    return arr;
}

export interface DataPoint {
    id: string;
    x: number;
    y: number;
    data?: Record<string, any>;
}

export const roundToTwoDecimals = (num: number): number => {
    return Math.round(num * 100) / 100;
};

export type habitModificationType = "log" | "modify"

export type sharedItemType = "habit" | "task"

export type sharedUser = {
    email: string,
    role: string,
    joinDate: Date,
}

export type email = string; 