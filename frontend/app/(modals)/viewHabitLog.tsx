import { StyleSheet, View, ScrollView } from "react-native";
import React, { useContext, useCallback, useState, useEffect } from "react";
import { useRouteInfo } from "expo-router/build/hooks";
import Habit from "@/api/habit";
import { retrieveHabitObject } from "@/api/storage";
import { DataTable, Text, useTheme, IconButton } from "react-native-paper";
import { AuthContext } from "@/contexts/authContext";
import { isAnonymous } from "@/constants/constants";
import { getUserDataFromEmail } from "@/api/db_ops";
import { useFocusEffect, router } from "expo-router";
import { useColorScheme } from "react-native";
import {
  limitStringLength,
  stringToTimeFrame,
  timeFrame,
  timeFrameConverter,
  winrateToColor,
} from "@/api/types_and_utils";
import Select from "@/components/Select";
import { CustomSurface as Surface } from "@/components/CustomSurface";
import { Timestamp } from "firebase/firestore";
import { BarChart } from "react-native-chart-kit";

const viewHabitLog = () => {
  const route = useRouteInfo();
  const habitName = route.params.habitName.toString().toUpperCase();
  const theme = useTheme();
  const [habit, setHabit] = useState(new Habit("NULL_HABIT", "NULL_UNIT"));
  const { email } = useContext(AuthContext);
  const [timeFrameMenuOpen, setTimeFrameMenuOpen] = useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>("Day");
  const [timeFrame, setTimeFrame] = useState<timeFrame>("day");
  const [showingHistory, setShowingHistory] = useState(false);
  const scheme = useColorScheme();

  useEffect(() => {
    setTimeFrame(stringToTimeFrame(selectedTimeFrame) || "day");
  }, [selectedTimeFrame]);

  useFocusEffect(
    useCallback(() => {
      async function getHabitData() {
        let habitList = null;
        if (!isAnonymous(email)) {
          const userData = await getUserDataFromEmail(email);
          habitList = Array.isArray(userData["habitList"])
            ? userData["habitList"]
            : JSON.parse(userData["habitList"]);
        }

        const currHabit = await retrieveHabitObject(habitName, habitList);
        if (currHabit instanceof Habit) {
          setHabit(currHabit);
        } else {
          alert(currHabit.error);
        }
      }
      getHabitData();
    }, [email])
  );

  function handleEditHabit() {
    router.replace({
      pathname: "/editHabit",
      params: { habitName: habitName },
    });
  }

  const roundToTwoDecimals = (num: number): number => {
    return Math.round(num * 100) / 100;
  };

  const handleSelectTimeFrame = (item: string) => {
    setSelectedTimeFrame(item);
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
          total = roundToTwoDecimals(
            habit.getCountOverTimeFrame(1, "week", "total")
          );
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

  const getCreationDate = (): string => {
    const date = habit.getCreationDate();
    try {
      if (typeof date === "string") {
        const parsedDate = new Date(date);
        return parsedDate.toDateString();
      } else if (date instanceof Timestamp) {
        return date.toDate().toDateString();
      }

      return date.toDateString();
    } catch (err) {
      console.log(date);
      console.log(date instanceof Timestamp);
      return "DATE ERROR";
    }
  };

  // the following function is used for getting habit data from start and end date to format for graphs
  const today = new Date();
  const startDate = new Date(today); // Create a copy of today's date
  startDate.setDate(today.getDate() - 9); // Past 7 days including day

  const activities = habit.getActivityOfDateRange(startDate, today);
  const dates = activities.map((activity) => {
    const date = new Date(activity.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date
      .getFullYear()
      .toString()
      .slice(-2)}`;
  });
  const values = activities.map((activity) => activity.count);

  const data = {
    labels: dates,
    datasets: [
      {
        data: values,
      },
    ],
  };

  const barColor: string = scheme == "dark" ? theme.colors.primary : "black";
  const chartConfig = {
    backgroundGradientFrom: "#FFF",
    backgroundGradientFromOpacity: 0.0,
    backgroundGradientTo: "#FFF",
    backgroundGradientToOpacity: 0.0,
    color: (opacity = 1) => barColor,
    strokeWidth: 5, // optional, default 3
    barPercentage: 0.25,

    useShadowColorFromDataset: false, // optional
  };

  return (
    <View
      style={{
        ...styles.pageContainer,
        backgroundColor: theme.colors.background,
      }}
    >
      <Surface style={styles.innerContainer}>
        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 2 }}>
            <Text>
              Habit: {habit.getName()}{" "}
              <Text style={{ color: "grey" }}>({habit.getUnit()})</Text>
            </Text>
            <Text>Created: {getCreationDate()}</Text>
            <Text>
              <Text style={{ fontWeight: "bold" }}>Habit Goal: </Text>
              <Text>
                {habit.getGoal() ? habit.getGoal()?.toString() : "N/A"}.
              </Text>
            </Text>
          </View>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View
              style={{
                flexDirection: "row",
                flex: 1,
                justifyContent: "space-evenly",
              }}
            >
              <IconButton
                icon={"pencil-outline"}
                size={20}
                style={{ margin: 0, padding: 0 }}
                onPress={handleEditHabit}
                iconColor={theme.colors.primary}
              />
              <IconButton
                icon={showingHistory ? "clipboard-outline" : "clipboard"}
                size={20}
                style={{ margin: 0, padding: 0 }}
                iconColor={theme.colors.primary}
                onPress={() => {
                  setShowingHistory(false);
                }}
              />
              <IconButton
                icon={showingHistory ? "chart-box" : "chart-box-outline"}
                size={20}
                style={{ margin: 0, padding: 0 }}
                iconColor={theme.colors.primary}
                onPress={() => setShowingHistory(true)}
              />
            </View>
          </View>
        </View>

        <DataTable style={{ display: showingHistory ? "none" : "flex" }}>
          <DataTable.Header>
            <DataTable.Title>Time Interval</DataTable.Title>
            <DataTable.Title>
              Total {limitStringLength(habit.getUnit())}
            </DataTable.Title>
            <DataTable.Title
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {limitStringLength(habit.getUnit())}/
              <View>
                <Select
                  visible={timeFrameMenuOpen}
                  setVisible={setTimeFrameMenuOpen}
                  items={["Day", "Week", "Month", "Year"]}
                  selectedItem={selectedTimeFrame}
                  setSelectedItem={handleSelectTimeFrame}
                  mode="text"
                />
              </View>
            </DataTable.Title>
          </DataTable.Header>
          <TableRows />
        </DataTable>

        <View
          style={{
            display: showingHistory ? "flex" : "none",
            flex: 1,
            marginTop: 8,
            // borderWidth: 1,
            overflow: "hidden",
          }}
        >
          <View style={styles.chartContainer}>
            <BarChart
              style={{ position: "relative", left: -12 }}
              data={data}
              width={350}
              height={300}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              verticalLabelRotation={67.5}
              fromZero
            />
          </View>

          <ScrollView
            style={{
              ...styles.habitLog,
            }}
          >
            <Text style={{ marginBottom: 8 }}>Habit Log:</Text>
            {habit
              .getSortedActivityLog("descending")
              .map((activity: { date: string; count: number }) => {
                return (
                  <Text key={activity.date} style={{ marginVertical: 1 }}>
                    {activity.date}: {roundToTwoDecimals(activity.count)}
                  </Text>
                );
              })}
          </ScrollView>
        </View>
      </Surface>
    </View>
  );
};

export default viewHabitLog;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },

  innerContainer: {
    width: 350,
    padding: 12,
    minHeight: "60%",
    height: "auto",
    maxHeight: "100%",
  },

  chartContainer: {
    height: "auto",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    // borderWidth: 1,
  },

  habitLog: {
    marginTop: 8,
  },
});
