import { getColor } from "@/constants/Colors";

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

export const getSimpleDateFromDate = (date: Date): SimpleDate => {
    return {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear()
    }
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

export const winrateToColor = (winrate: number, theme: "light" | "dark"): string => {

    let color;
    if (winrate >= .90) color = getColor(theme, "green")
    else if (winrate >= .80) color = getColor(theme, "lime");
    else if (winrate >= .70) color = getColor(theme, "yellow")
    else if (winrate >= .50) color = getColor(theme, "orange")
    else if (winrate < .50) color = getColor(theme, "red")

    console.log("WINRATE " + winrate + "COLOR " + color)
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