import { StyleSheet, View } from "react-native";
import React, { useState, useCallback, useContext } from "react";
import { Text, useTheme } from "react-native-paper";
import { useFocusEffect } from "expo-router";
import { AuthContext } from "@/contexts/authContext";
import { getUserDataFromEmail } from "@/api/db_ops";
import Habit from "@/api/habit";
import { useRouteInfo } from "expo-router/build/hooks";
import { DataTable } from "react-native-paper";
import { timeFrameConverter } from "@/api/types_and_utils";
import {
  winrateToColor,
  roundToTwoDecimals,
  timeFrame,
} from "@/api/types_and_utils";

import { HabitContext } from "@/contexts/habitContext";

const averages = () => {
  const { email } = useContext(AuthContext);
  // const [habit, setHabit] = useState<Habit>(
  //   new Habit("NULL_NAME", "NULL_UNIT")
  // );
  const routeInfo = useRouteInfo();
  const habitName = routeInfo.params.habitName;
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const [timeFrame, setTimeFrame] = useState<timeFrame>("day");
  // const { habit } = useContext(HabitContext);
  const habit = useContext(HabitContext);

  // useFocusEffect(
  //   useCallback(() => {
  //     setLoading(true);

  //     (async () => {
  //       // Get user data on page focus
  //       const data = await getUserDataFromEmail(email);
  //       const habitList = data["habitList"];
  //       const habit = await retrieveHabitObject(habitName, habitList);

  //       if (habit instanceof Habit) {
  //         setHabit(habit);
  //       } else {
  //         alert(`ERROR: ${habit.error}`);
  //       }
  //     })();

  //     setLoading(false);
  //   }, [])
  // );

  const TableRows = () => {
    const tableTimeframes = [
      { label: "Today", lengthDays: 1 },
      { label: "7 Days", lengthDays: 7 },
      { label: "30 Days", lengthDays: 30 },
      { label: "90 Days", lengthDays: 90 },
      { label: "6 Months", lengthDays: 6 * timeFrameConverter["month"] },
      { label: "1 Year", lengthDays: 1 * timeFrameConverter["year"] },
      { label: "All Time", lengthDays: habit.getAge() },
    ];

    return (
      <>
        {tableTimeframes.map((timeframe) => {
          // if time frame < goal time frame, use theme color
          // else:
          const label = timeframe.label;

          if (timeframe.lengthDays > habit.getAge()) {
            return <View key={label}></View>;
          }

          let themeColor = theme.colors.onBackground;
          const totalMapping = timeFrameValueMapping(label, "total");
          const avgMapping = timeFrameValueMapping(label, "average");

          return (
            <DataTable.Row key={label}>
              <DataTable.Cell>
                <Text style={{ color: totalMapping.color }}>{label}</Text>
              </DataTable.Cell>
              <DataTable.Cell>
                <Text>{totalMapping.value}</Text>
              </DataTable.Cell>
              <DataTable.Cell>
                <Text>{avgMapping.value}</Text>
              </DataTable.Cell>
            </DataTable.Row>
          );
        })}
      </>
    );
  };

  const timeFrameValueMapping = (
    key: string,
    mode: "total" | "average" = "total"
  ) => {
    const getCellMapping = (
      key: string
    ): { total: number | "N/A"; average: number | "N/A"; color: string } => {
      let total: number | "N/A" = 0;
      let average: number | "N/A" = 0;
      let col: string = theme.colors.onBackground;
      const goal = habit.getGoal();

      const getColor = (totalCount: number | "N/A", windowSizeDays: number) => {
        if (goal && typeof totalCount == "number") {
          const winrate =
            totalCount / windowSizeDays / goal.getIdealCountPerDay();
          return winrateToColor(winrate, "dark");
        } else {
          return col;
        }
      };

      switch (key) {
        case "Today":
          total = roundToTwoDecimals(habit.getTodayCount());
          average = "N/A";
          col = getColor(total, 1);
          break;

        case "7 Days":
          total = roundToTwoDecimals(habit.getCountPastXDays(7, "total"));
          average =
            habit.getAveragePerTimeFrameOverTimeFrame(
              1,
              timeFrame,
              1,
              "week"
            ) || "N/A";
          col = getColor(total, 7);
          break;

        case "30 Days":
          total = roundToTwoDecimals(habit.getCountPastXDays(30, "total"));
          average =
            habit.getAveragePerTimeFrameOverTimeFrame(
              1,
              timeFrame,
              1,
              "month"
            ) || "N/A";
          col = getColor(total, 30);
          break;

        case "90 Days":
          total = roundToTwoDecimals(
            habit.getCountOverTimeFrame(90, "day", "total")
          );
          average =
            habit.getAveragePerTimeFrameOverTimeFrame(
              1,
              timeFrame,
              90,
              "day"
            ) || "N/A";
          col = getColor(total, 90);
          break;

        case "6 Months":
          total = roundToTwoDecimals(
            habit.getCountOverTimeFrame(6, "month", "total")
          );
          average =
            habit.getAveragePerTimeFrameOverTimeFrame(
              1,
              timeFrame,
              6,
              "month"
            ) || "N/A";
          col = getColor(total, 6 * timeFrameConverter["month"]);
          break;

        case "1 Year":
          total = roundToTwoDecimals(
            habit.getCountOverTimeFrame(1, "year", "total")
          );
          average =
            habit.getAveragePerTimeFrameOverTimeFrame(
              1,
              timeFrame,
              1,
              "year"
            ) || "N/A";
          col = getColor(total, 1 * timeFrameConverter["year"]);
          break;

        case "All Time":
          total = habit.getTotalCount("total");
          average = habit.getAveragePerTimeFrameAllTime(1, timeFrame) || "N/A";
          col = getColor(total, habit.getAge());

        default: {
          break;
        }
      }

      return {
        total: total,
        average: average,
        color: col,
      };
    };

    const mapping: Record<string, { total: any; average: any; color: string }> =
      {
        Today: getCellMapping("Today"),
        "7 Days": getCellMapping("7 Days"),
        "30 Days": getCellMapping("30 Days"),
        "90 Days": getCellMapping("90 Days"),
        "6 Months": getCellMapping("6 Months"),
        "1 Year": getCellMapping("1 Year"),
        "All Time": getCellMapping("All Time"),

        _: {
          total: "undefined",
          average: "undefiend",
          color: theme.colors.onBackground,
        },
      };

    const value = mapping[key][mode];
    const col: string = mapping[key]["color"];

    if (typeof value === "number") {
      return { value: roundToTwoDecimals(value), color: col };
    } else {
      return { value: "N/A", color: theme.colors.onBackground };
    }
  };

  return (
    <View style={styles.componentContainer}>
      <View style={styles.tableContainer}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Time Window</DataTable.Title>
            <DataTable.Title>Total</DataTable.Title>
            <DataTable.Title>Avg/TimeFrame</DataTable.Title>
          </DataTable.Header>
          <TableRows />
        </DataTable>
      </View>
    </View>
  );
};

export default averages;

const styles = StyleSheet.create({
  componentContainer: {
    width: "100%",
    flexDirection: "column",
    // borderWidth: 1,
    // borderColor: "red",
    flex: 1,
  },

  tableContainer: {
    flex: 1,
    width: "100%",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    // borderWidth: 1,
    // borderColor: "green",
  },
});
