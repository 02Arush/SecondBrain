import { DateRange, SimpleDate } from "@/api/models/dateTypes";
import {
  getDateFromSimpleDate,
  getSimpleDateFromDate,
} from "@/api/types_and_utils";
import React from "react";
import { StyleSheet, View } from "react-native";
import DatePicker from "./DatePicker";
type propTypes = {
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
};

const DateRangePicker = ({ dateRange, setDateRange }: propTypes) => {
  const handleSetEndDate = (date: SimpleDate) => {
    const origStartDate = dateRange.startDate;
    const newEndDate = getDateFromSimpleDate(date) || new Date();
    const newDateRange: DateRange = {
      startDate: origStartDate,
      endDate: newEndDate,
    };

    setDateRange(newDateRange);
  };

  const handleSetStartDate = (date: SimpleDate) => {
    const origEndDate = dateRange.endDate;
    const newStartDate = getDateFromSimpleDate(date) || new Date();
    const newDateRange: DateRange = {
      startDate: newStartDate,
      endDate: origEndDate,
    };

    setDateRange(newDateRange);
  };

  return (
    <View style={styles.row}>
      <DatePicker
        date={getSimpleDateFromDate(dateRange.startDate)}
        setDate={handleSetStartDate}
      />
      <DatePicker
        date={getSimpleDateFromDate(dateRange.endDate)}
        setDate={handleSetEndDate}
      />
    </View>
  );
};

export default DateRangePicker;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    maxWidth: "100%",
  },
});
