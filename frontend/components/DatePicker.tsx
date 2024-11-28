import { StyleSheet, View } from "react-native";
import React, { useState, useEffect } from "react";
import { TextInput, Text } from "react-native-paper";
import { filterTextToInteger } from "@/api/types_and_utils";
import { SimpleDate, months, monthsAndDays } from "@/api/types_and_utils";
import Select from "./Select";

type propTypes = {
  date: SimpleDate;
  setDate: React.Dispatch<React.SetStateAction<SimpleDate>>;
};

const DatePicker = ({ date, setDate }: propTypes) => {
  const MMDDWidth = 65;
  const [monthSelectVisible, setMonthSelectVisible] = useState(false);
  const [daySelectVisible, setDaySelectVisible] = useState(false);
  const [yearSelectVisible, setYearSelectVisible] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(months[date.month - 1]);
  const [selectedDay, setSelectedDay] = useState(date.day.toString());
  const [selectedYear, setSelectedYear] = useState(date.year.toString());

  // This is here because state changes on updates are Async, you want to wait until the date picker items are updated, than update the "SimpleDate" item
  useEffect(() => {
    updateSimpleDate();
  }, [selectedDay, selectedMonth, selectedYear]);

  const setMonth = (item: string) => {
    setSelectedMonth(item);
    setDay("1");
  };

  const setDay = (item: string) => {
    setSelectedDay(item);
  };

  const setYear = (item: string) => {
    setSelectedYear(item);
  };

  const updateSimpleDate = () => {
    const day = Number(selectedDay);
    const month = months.findIndex((item) => item === selectedMonth) + 1;
    const year = Number(selectedYear);
    const newSimpleDate: SimpleDate = {
      day: day,
      month: month,
      year: year,
    };
    setDate(newSimpleDate);
  };

  const daysArray = [...Array(monthsAndDays[selectedMonth] + 1).keys()]
    .slice(1)
    .map((day) => day.toString());

  const generateSurroundingStrings = (num: number) => {
    // Create an array with 5 strings before and 5 strings after the given number
    const result = [];
    for (let i = -5; i <= 5; i++) {
      result.push(String(num + i));
    }
    return result;
  };

  const yearsArray = generateSurroundingStrings(date.year);

  return (
    <View style={styles.container}>
      <Select
        mode="button-box"
        visible={monthSelectVisible}
        setVisible={setMonthSelectVisible}
        items={months}
        selectedItem={selectedMonth}
        setSelectedItem={setMonth}
      />
      <Text>/</Text>

      <Select
        mode="button-box"
        visible={daySelectVisible}
        setVisible={setDaySelectVisible}
        items={daysArray}
        selectedItem={selectedDay}
        setSelectedItem={setDay}
      />

      <Text>/</Text>

      <Select
        mode="button-box"
        visible={yearSelectVisible}
        setVisible={setYearSelectVisible}
        items={yearsArray}
        selectedItem={selectedYear}
        setSelectedItem={setYear}
      />
    </View>
  );
};

export default DatePicker;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white",
  },
  denseInput: {
    marginHorizontal: 2,
    textAlign: "center",
    height: 24,
  },
});
