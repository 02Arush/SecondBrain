import { StyleSheet, View, ScrollView } from "react-native";
import React, { useContext, useCallback } from "react";
import { useRouteInfo } from "expo-router/build/hooks";
import { useState, useEffect } from "react";
import Habit from "@/api/habit";
import { retrieveHabitObject } from "@/api/storage";
import { DataTable, Text, useTheme, IconButton } from "react-native-paper";
import { AuthContext } from "@/contexts/authContext";
import { isAnonymous } from "@/constants/constants";
import { getUserDataFromEmail } from "@/api/db_ops";
import { useFocusEffect } from "expo-router";
import {
  limitStringLength,
  stringToTimeFrame,
  timeFrame,
} from "@/api/types_and_utils";
import { router } from "expo-router";
import Select from "@/components/Select";
import { CustomSurface as Surface } from "@/components/CustomSurface";

const viewHabitLog = () => {
  const route = useRouteInfo();
  const habitName = route.params.habitName.toString().toUpperCase();
  const theme = useTheme();
  const [habit, setThisHabit] = useState(new Habit("NULL_HABIT", "NULL_UNIT"));
  const { email } = useContext(AuthContext);
  const [timeFrameMenuOpen, setTimeFrameMenuOpen] = useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>("Day");
  const [timeFrame, setTimeFrame] = useState<timeFrame>("day");
  const [showingHistory, setShowingHistory] = useState(false);

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
          setThisHabit(currHabit);
        } else {
          alert(currHabit.error);
        }
      }
      getHabitData();
    }, [email])
  );

  function handleEditHabit() {
    router.push({
      pathname: "/editHabit",
      params: { habitName: habitName },
    });
  }

  const roundToTwoDecimals = (num: number) => {
    return isNaN(num) ? "N/A" : Math.round(num * 100) / 100;
  };

  const handleSelectTimeFrame = (item: string) => {
    setSelectedTimeFrame(item);
  };

  const timeFrameValueMapping = (
    key: string,
    mode: "total" | "average" = "total"
  ) => {
    const mapping: any = {
      Today: {
        total: roundToTwoDecimals(habit.getTodayCount()),
        average: "N/A",
      },
      "7 Days": {
        total: roundToTwoDecimals(
          habit.getCountOverTimeFrame(1, "week", "total")
        ),
        average: habit.getAveragePerTimeFrameOverTimeFrame(
          1,
          timeFrame,
          1,
          "week"
        ),
      },
      "30 Days": {
        total: roundToTwoDecimals(habit.getCountPastXDays(30, "total")),
        average: habit.getAveragePerTimeFrameOverTimeFrame(
          1,
          timeFrame,
          1,
          "month"
        ),
      },
      "90 Days": {
        total: roundToTwoDecimals(
          habit.getCountOverTimeFrame(90, "day", "total")
        ),
        average: habit.getAveragePerTimeFrameOverTimeFrame(
          1,
          timeFrame,
          90,
          "day"
        ),
      },
      "6 Months": {
        total: roundToTwoDecimals(
          habit.getCountOverTimeFrame(6, "month", "total")
        ),
        average: habit.getAveragePerTimeFrameOverTimeFrame(
          1,
          timeFrame,
          6,
          "month"
        ),
      },
      "1 Year": {
        total: roundToTwoDecimals(
          habit.getCountOverTimeFrame(1, "year", "total")
        ),
        average: habit.getAveragePerTimeFrameOverTimeFrame(
          1,
          timeFrame,
          1,
          "year"
        ),
      },
      "All Time": {
        total: habit.getTotalCount("total"),
        average: habit.getAveragePerTimeFrameAllTime(1, timeFrame),
      },

      _: {
        total: "undefined",
        average: "undefiend",
      },
    };

    const value = mapping[key][mode];
    if (typeof value === "number") {
      return roundToTwoDecimals(value);
    } else {
      return "N/A";
    }
  };

  const TableRows = () => {
    const tableValues = [
      "Today",
      "7 Days",
      "30 Days",
      "90 Days",
      "6 Months",
      "1 Year",
      "All Time",
    ];

    return (
      <>
        {tableValues.map((value) => {
          return (
            <DataTable.Row key={value}>
              <DataTable.Cell>{value}</DataTable.Cell>
              <DataTable.Cell>
                {timeFrameValueMapping(value, "total")}
              </DataTable.Cell>
              <DataTable.Cell>
                {timeFrameValueMapping(value, "average")}
              </DataTable.Cell>
            </DataTable.Row>
          );
        })}
      </>
    );
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
          <View style={{ flex: 4 }}>
            <Text>Habit Name: {habit.getName()}</Text>
            <Text>Habit Unit: {habit.getUnit()}</Text>
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
                icon={showingHistory ? "clipboard-outline" : "clipboard"}
                size={20}
                style={{ margin: 0, padding: 0 }}
                iconColor={theme.colors.primary}
                onPress={() => {
                  setShowingHistory(false);
                }}
              />
              <IconButton
                icon={showingHistory ? "book-clock" : "book-clock-outline"}
                size={20}
                style={{ margin: 0, padding: 0 }}
                iconColor={theme.colors.primary}
                onPress={() => setShowingHistory(true)}
              />
            </View>
          </View>
        </View>
        {/* TAB 1: DATA TABLE */}
        {/* TAB 2: VIEW HABIT LOG */}

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

        <ScrollView
          style={{
            ...styles.habitLog,
            display: showingHistory ? "flex" : "none",
            marginTop: 8,
          }}
        >
          <Text style={{marginBottom: 8}}>Habit Log:</Text>
          {habit
            .getSortedActivityLog("descending")
            .map((activity: { date: string; count: number }) => {
              return (
                <Text key={activity.date} style={{marginVertical: 1}}>
                  {activity.date}: {roundToTwoDecimals(activity.count)}
                </Text>
              );
            })}
        </ScrollView>
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
  },

  innerContainer: {
    width: 350,
    padding: 12,
    minHeight: "50%",
  },

  habitLog: {},
});
