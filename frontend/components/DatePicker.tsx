import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  FlatList,
  useColorScheme,
} from "react-native";
import React, { useState, useEffect } from "react";
import {
  TextInput,
  Text,
  IconButton,
  useTheme,
  Button,
} from "react-native-paper";
import {
  isEqualSimpleDate,
  filterTextToInteger,
  getSimpleDateFromDate,
} from "@/api/types_and_utils";
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
import colorScheme, { getColor } from "@/constants/Colors";

type propTypes = {
  date: SimpleDate;
  setDate: (date: SimpleDate) => void;
  min?: SimpleDate;
  max?: SimpleDate;
};

const DatePicker = ({ date, setDate, min, max }: propTypes) => {
  const [selectedMonth, setSelectedMonth] = useState(months[date.month - 1]);
  const [selectedDay, setSelectedDay] = useState(date.day.toString());
  const [selectedYear, setSelectedYear] = useState(date.year.toString());
  const [showingCalendar, setShowingCalendar] = useState(false);
  const [showingMonthYear, setShowingMonthYear] = useState(false);

  useEffect(() => {
    setSelectedMonth(months[date.month - 1]);
    setSelectedDay(date.day.toString());
    setSelectedYear(date.year.toString());
  }, [date]);

  const todayDate = new Date();
  const yearsArray: string[] = range(
    todayDate.getFullYear() - 3,
    todayDate.getFullYear() + 4
  ).map((year) => year.toString());

  const setMonth = (item: string) => {
    const newMonth = item;
    setSelectedMonth(newMonth);
    const maxDays = monthsAndDays[newMonth];
    if (parseInt(selectedDay) > maxDays) {
      setSelectedDay("1");
    }
  };

  const setDay = (item: string) => {
    setSelectedDay(item);
  };

  const setYear = (item: string) => {
    setSelectedYear(item);
  };

  const handleSaveDate = () => {
    const day = Number(selectedDay);
    const month = months.findIndex((item) => item === selectedMonth) + 1;
    const year = Number(selectedYear);
    const newSimpleDate: SimpleDate = {
      day: day,
      month: month,
      year: year,
    };
    setDate(newSimpleDate);
    setShowingCalendar(false);
  };

  const handleCancel = () => {
    setSelectedMonth(months[date.month - 1]);
    setSelectedDay(date.day.toString());
    setSelectedYear(date.year.toString());
    setShowingCalendar(false);
  };

  const toggleShowingMonthYear = () => {
    setShowingMonthYear(!showingMonthYear);
  };

  const handleShiftMonth = (direction: "left" | "right") => {
    const currMonth = selectedMonth;
    let monthIDX = months.indexOf(currMonth);
    if (monthIDX <= 0 && direction.localeCompare("left") === 0) {
      const newYear = Number(selectedYear) - 1;
      setYear(newYear.toString());
      monthIDX = months.length - 1;
    } else if (
      monthIDX >= months.length - 1 &&
      direction.localeCompare("right") === 0
    ) {
      monthIDX = 0;
      const newYear = Number(selectedYear) + 1;
      setYear(newYear.toString());
    } else {
      monthIDX += direction.localeCompare("left") === 0 ? -1 : 1;
    }

    const newMonth = months[monthIDX];
    setMonth(newMonth);
    setDay("1");
  };

  const calendarDate: SimpleDate = {
    day: parseInt(selectedDay),
    month: months.findIndex((item) => item === selectedMonth) + 1,
    year: parseInt(selectedYear),
  };

  const theme = useTheme();
  const scheme = useColorScheme();

  return (
    <>
      <Button
        mode="outlined"
        style={{ ...styles.container }}
        onPress={() => setShowingCalendar(true)}
        icon={"pencil"}
      >
        {getDateFromSimpleDate(date)
          ? getDateFromSimpleDate(date)?.toDateString()
          : new Date().toDateString()}
      </Button>

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
                iconColor={getColor(scheme, "blue") || undefined}
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
              <IconButton
                iconColor={getColor(scheme, "blue") || undefined}
                icon={"chevron-left"}
                onPress={() => handleShiftMonth("left")}
              />
              <IconButton
                iconColor={getColor(scheme, "blue") || undefined}
                icon={"chevron-right"}
                onPress={() => handleShiftMonth("right")}
              />
            </View>
          </View>

          <View style={styles.calendarContent}>
            <View
              style={{
                ...styles.monthYearSelections,
                display: showingMonthYear ? "flex" : "none",
              }}
            >
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
            </View>
            <View style={{ display: showingMonthYear ? "none" : "flex" }}>
              <Calendar
                date={calendarDate}
                setDay={setDay}
                selectedDay={selectedDay}
              />
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
            <Button mode="text" onPress={handleCancel}>
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
  setDay: (day: string) => void;
  selectedDay: string;
};

const Calendar = ({ date, setDay, selectedDay }: CalendarProps) => {
  const MONTH = date.month;
  const YEAR = date.year;
  const todaySimpleDate = getSimpleDateFromDate(new Date());
  const theme = useTheme();

  const getCalendarBoxValue = (i: number, j: number): string | null => {
    if (i === 0) {
      return weekDays[j];
    }

    const firstDayOfMonthSimple: SimpleDate = {
      day: 1,
      month: MONTH,
      year: YEAR,
    };

    const firstDayOfMonth = getDateFromSimpleDate(firstDayOfMonthSimple);
    const firstDay = firstDayOfMonth?.getDay() || 0;

    const month = firstDayOfMonth?.getMonth();
    const year = firstDayOfMonth?.getFullYear();

    let totalDays = 30;
    if (year && month !== undefined) {
      totalDays = new Date(year, month + 1, 0).getDate();
    }

    i = i - 1;
    const day = i * 7 + j - firstDay + 1;

    if (day > 0 && day <= totalDays) {
      return day.toString();
    } else {
      return null;
    }
  };

  const isSelectedDay = (dayOfMonth: string): boolean => {
    return dayOfMonth === selectedDay;
  };

  const isToday = (dayOfMonth: string): boolean => {
    const dayAsNum = Number(dayOfMonth);

    if (isNaN(dayAsNum)) {
      return false;
    }

    const currAsSimpleDate: SimpleDate = {
      day: dayAsNum,
      month: MONTH,
      year: YEAR,
    };

    return isEqualSimpleDate(currAsSimpleDate, todaySimpleDate);
  };

  return (
    <View style={{ margin: 4 }}>
      {range(0, 6).map((_, i) => {
        return (
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            {range(0, 7).map((_, j) => {
              const dayOfMonth = getCalendarBoxValue(i, j);
              const selected = dayOfMonth ? isSelectedDay(dayOfMonth) : false;
              const today = dayOfMonth ? isToday(dayOfMonth) : false;

              return (
                <Pressable
                  key={j}
                  onPress={() => {
                    if (dayOfMonth && !isNaN(Number(dayOfMonth))) {
                      setDay(dayOfMonth);
                    }
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: selected
                        ? theme.colors.primary
                        : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        alignItems: "center",
                        color: selected
                          ? theme.colors.onPrimary
                          : theme.colors.onBackground,
                        textDecorationLine: today ? "underline" : "none",
                      }}
                    >
                      {dayOfMonth}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    // paddingVertical: 8,
    // paddingHorizontal: 16,
    borderRadius: 4,
  },
  calendarContainer: {
    minWidth: 350,
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
    height: 200,
  },
  daySelection: {},
  monthYearScrollView: {
    flexDirection: "column",
    justifyContent: "flex-start",
    height: "auto",
    width: "100%",
  },
});

export default DatePicker;
