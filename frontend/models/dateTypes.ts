

export type timeFrame = "day" | "week" | "month" | "year"

export type SimpleDate = {
    day: number;
    month: number;
    year: number;
};

export interface DateRange {
    startDate: Date,
    endDate: Date,
}
