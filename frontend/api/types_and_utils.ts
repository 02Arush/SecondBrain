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
 * DATES
 */

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
