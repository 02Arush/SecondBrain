import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  FlatList,
} from "react-native";
import React, { useState, useEffect } from "react";
import { TextInput, Text, IconButton, useTheme } from "react-native-paper";
import { filterTextToInteger } from "@/api/types_and_utils";
import { Button } from "react-native-paper";
import {
  SimpleDate,
  months,
  monthsAndDays,
  range,
  weekDays,
} from "@/api/types_and_utils";
import Select from "./Select";
import { getDateFromSimpleDate } from "@/api/types_and_utils";
import OutlineModal from "./OutlineModal";

type propTypes = {
  date: SimpleDate;
  setDate: React.Dispatch<React.SetStateAction<SimpleDate>>;
};

const DatePicker = ({ date, setDate }: propTypes) => {
  const MMDDWidth = 65;

  const [selectedMonth, setSelectedMonth] = useState(months[date.month - 1]);
  const [selectedDay, setSelectedDay] = useState(date.day.toString());
  const [selectedYear, setSelectedYear] = useState(date.year.toString());
  const [showingCalendar, setShowingCalendar] = useState(false);

  // TODO: MAKE THIS INITIALIZE AS FALSE
  const [showingMonthYear, setShowingMonthYear] = useState(false);

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

  const daysArray: string[] = range(1, monthsAndDays[selectedMonth] + 1).map(
    (day) => day.toString()
  );

  const todayDate = new Date();

  // Pad plus or minus three years into the past or future for now for the year
  const yearsArray: string[] = range(
    todayDate.getFullYear() - 3,
    todayDate.getFullYear() + 4
  ).map((year) => year.toString());

  const handleSaveDate = () => {
    alert("Saving Date...");
    setShowingCalendar(false);
  };

  const toggleShowingCalendar = () => {
    setShowingCalendar(!showingCalendar);
  };

  const toggleShowingMonthYear = () => {
    setShowingMonthYear(!showingMonthYear);
  };

  return (
    <>
      <Pressable
        style={styles.container}
        onPress={() => setShowingCalendar(true)}
      >
        <Text variant="labelMedium">
          {getDateFromSimpleDate(date)
            ? getDateFromSimpleDate(date)?.toDateString()
            : new Date().toDateString()}
        </Text>
      </Pressable>

      <OutlineModal showing={showingCalendar}>
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeading}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <Text>
                {selectedMonth}, {selectedDay}, {selectedYear}
              </Text>
              <IconButton
                icon={showingMonthYear ? "chevron-down" : "chevron-right"}
                onPress={toggleShowingMonthYear}
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <IconButton icon={"chevron-left"} />
              <IconButton icon={"chevron-right"} />
            </View>
          </View>

          <View style={styles.calendarContent}>
            <View
              style={{
                ...styles.monthYearSelections,
                display: showingMonthYear ? "flex" : "none",
              }}
            >
              {/* TODO: Change TEXT item to MENU ITEM */}
              <FlatList
                contentContainerStyle={styles.monthYearScrollView}
                data={months}
                renderItem={(monthItem) => (
                  <MenuItem
                    value={monthItem.item}
                    isSelected={selectedMonth == monthItem.item}
                    setIsSelected={setMonth}
                  />
                )}
                keyExtractor={(month) => month}
              />
              {/* </ScrollView> */}
              <FlatList
                contentContainerStyle={styles.monthYearScrollView}
                data={yearsArray}
                renderItem={(yearItem) => (
                  <MenuItem
                    value={yearItem.item}
                    isSelected={selectedYear == yearItem.item}
                    setIsSelected={setYear}
                  />
                )}
                keyExtractor={(year) => year}
              />

              {/* <Text>Content 2</Text> */}
            </View>
            <View style={{ display: showingMonthYear ? "none" : "flex" }}>
              <Calendar date={date} setDate={setDate} />
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Button
              mode="text"
              onPress={() => {
                setShowingCalendar(false);
              }}
            >
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSaveDate}>
              Save
            </Button>
          </View>
        </View>
      </OutlineModal>
    </>
  );
};

type menuItemPropTypes = {
  isSelected: boolean;
  value?: string;
  displayValue?: string;
  setIsSelected: (value: string) => void;
};
const MenuItem = ({
  isSelected = false,
  setIsSelected,
  value = "test",
  displayValue,
}: menuItemPropTypes) => {
  const theme = useTheme();

  return (
    <Pressable
      style={{
        paddingVertical: 4,
        backgroundColor: isSelected ? theme.colors.primary : "transparent",
        width: "100%",
      }}
      onPress={() => setIsSelected(value)}
    >
      <Text
        style={{
          textAlign: "center",
          width: "100%",
          color: isSelected
            ? theme.colors.onPrimary
            : theme.colors.onBackground,
        }}
      >
        {displayValue ? displayValue : value}
      </Text>
    </Pressable>
  );
};

type CalendarProps = {
  date: SimpleDate;
  setDate: (newDate: SimpleDate) => void;
};
const Calendar = ({ date, setDate }: CalendarProps) => {
  const MONTH = date.month;
  const YEAR = date.year;

  const getCalendarBoxValue = (i: number, j: number): string => {
    // Weekday labels for the first row

    // Handle the first row: weekday labels
    if (i === 0) {
      return weekDays[j];
    }

    // Get the first day of the month and total days in the month
    const firstDayOfMonthSimple: SimpleDate = {
      day: 1,
      month: MONTH,
      year: YEAR,
    };

    const firstDayOfMonth = getDateFromSimpleDate(firstDayOfMonthSimple);
    const firstDay = firstDayOfMonth?.getDay() || 0; // Get the weekday index (0 = Sun, 6 = Sat)

    const month = firstDayOfMonth.getMonth(); // 0-based month index
    const year = firstDayOfMonth.getFullYear();
    const totalDays = new Date(year, month + 1, 0).getDate(); // Last day of the month

    // Calculate the day corresponding to the (i, j) coordinate
    i = i - 1;
    const day = i * 7 + j - firstDay + 1;

    // Display the day if valid, otherwise return an empty string
    if (day > 0 && day <= totalDays) {
      return day.toString();
    } else {
      return ""; // Empty for invalid cells
    }
  };

  return (
    // OUTER CALENDAR
    <View style={{ flex: 1, borderWidth: 1, borderColor: "red", margin: 4 }}>
      {/* ROWS */}

      {[...new Array(6)].map((_, i) => {
        return (
          <View
            key={i}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "red",
              flexDirection: "row",
              // MIGHT NEED TO DELETE, TO ENSURE PROPER CALENDAR WIDTHS
              justifyContent: "center",
            }}
          >
            {/* COLS */}
            {[...new Array(7)].map((_, j) => {
              const dayOfMonth = getCalendarBoxValue(i, j);

              return (
                <View
                  key={j}
                  style={{
                    width: 40,
                    height: 40,
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ textAlign: "center", alignItems: "center" }}>
                    {dayOfMonth}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

type CalendarDayProps = {
  day: number;
  setDay: (value: number) => void;
  size?: number;
};
const CalendarDay = ({ day, setDay, size }: CalendarDayProps) => {
  const SIZE = size ? size : "100%";
  return (
    <Pressable
      style={{ width: SIZE, height: SIZE }}
      onPress={() => setDay(day)}
    >
      <Text>{day.toString()}</Text>
    </Pressable>
  );
};

export default DatePicker;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  },
  denseInput: {
    // marginHorizontal: 2,
    // textAlign: "center",
    // height: 24,
  },

  // For some reason, flex: 1 breaks it here
  calendarContainer: {
    minWidth: 350,

    // flexDirection: "row",
  },

  calendarHeading: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 50,
  },

  calendarContent: {},

  monthYearSelections: {
    flexDirection: "row",
  },

  daySelection: {},

  monthYearScrollView: {
    flexDirection: "column",
    justifyContent: "flex-start",
    height: 100,
    width: "100%",
  },
});
