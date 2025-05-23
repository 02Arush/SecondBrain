import {
  roundToTwoDecimals,
   timeFrameConverter, winrateToColor
} from "@/api/types_and_utils";
import React, { useContext, useState } from "react";
import { StyleSheet, View } from "react-native";
import { DataTable, Text, useTheme } from "react-native-paper";
import { timeFrame } from "@/api/models/dateTypes";

import Select from "@/components/Select";
import { HabitContext } from "@/contexts/habitContext";

const averages = () => {
  // const [habit, setHabit] = useState<Habit>(
  //   new Habit("NULL_NAME", "NULL_UNIT")
  // );
  const theme = useTheme();
  // const { habit } = useContext(HabitContext);
  const habit = useContext(HabitContext);
  const [selectOpen, setSelectOpen] = useState(false);
  const timeFrames: timeFrame[] = ["day", "week", "month", "year"];
  const [timeFrame, setTimeFrame] = useState<timeFrame>(timeFrames[0]);

  const handleChangeTimeFrame = (newTimeFrame: string) => {
    const tf = newTimeFrame as timeFrame;
    if (timeFrames.includes(tf)) {
      setTimeFrame(tf);
    }
  };

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
          average = habit.getAveragePerTimeFrameOverTimeFrame(
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
            habit.getCountPastXDays(90)
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

      average = average !== "N/A" ? roundToTwoDecimals(average) : "N/A"

      const ret = {
        total,
        average,
        color: col,
      }

      return ret;
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
      return { value: (value), color: col };
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
            <DataTable.Title
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View>
                <Text>Avg/</Text>
              </View>
              <View>
                <Select
                  mode="text"
                  visible={selectOpen}
                  setVisible={setSelectOpen}
                  items={timeFrames}
                  selectedItem={timeFrame}
                  setSelectedItem={handleChangeTimeFrame}
                />
              </View>
            </DataTable.Title>
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
