import { StyleSheet, View, ScrollView } from "react-native";
import React, { useContext, useCallback } from "react";
import { useRouteInfo } from "expo-router/build/hooks";
import { useState, useEffect } from "react";
import Habit from "@/api/habit";
import { retrieveHabitObject } from "@/api/storage";
import { Surface, DataTable, Text, useTheme } from "react-native-paper";
import { AuthContext } from "@/contexts/authContext";
import { isAnonymous } from "@/constants/constants";
import { getUserDataFromEmail } from "@/api/db_ops";
import { useFocusEffect } from "expo-router";
import { limitStringLength } from "@/api/types_and_utils";

const viewHabitLog = () => {
  const route = useRouteInfo();
  const habitName = route.params.habitName.toString().toUpperCase();
  const theme = useTheme();
  const [habit, setThisHabit] = useState(new Habit("NULL_HABIT", "NULL_UNIT"));
  const { email } = useContext(AuthContext);

  useFocusEffect(
    useCallback(() => {
      async function getHabitData() {
        let habitList = null;
        if (!isAnonymous(email)) {
          const userData = await getUserDataFromEmail(email);
          habitList = JSON.parse(userData["habitList"]);
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

  const roundToTwoDecimals = (num: number) => {
    return isNaN(num) ? "N/A" : Math.round(num * 100) / 100;
  };

  return (
    <View
      style={{
        ...styles.pageContainer,
        backgroundColor: theme.colors.background,
      }}
    >
      <Surface style={styles.innerContainer}>
        <Text>
          <b>Habit Name:</b> {habit.getName()}
        </Text>
        <Text>
          <b>Habit Unit:</b> {habit.getUnit()}
        </Text>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Time</DataTable.Title>
            <DataTable.Title>
              Total {limitStringLength(habit.getUnit())}
            </DataTable.Title>
            <DataTable.Title>
              {limitStringLength(habit.getUnit())}/day
            </DataTable.Title>
          </DataTable.Header>
          <DataTable.Row>
            <DataTable.Cell>Today</DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getTodayCount())}
            </DataTable.Cell>
            <DataTable.Cell>N/A</DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Past 7 Days</DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPastXDays(7, "total"))}
            </DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPastXDays(7, "average"))}
            </DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Past 30 Days</DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPastXDays(30, "total"))}
            </DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPastXDays(30, "average"))}
            </DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Past 6 Months</DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPastXDays((Math.floor(365/2)), "total"))}
            </DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPastXDays(Math.floor(365/2), "average"))}
            </DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Past Year</DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPastXDays(365, "total"))}
            </DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPastXDays(365, "average"))}
            </DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>All Time</DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getTotalCount("total"))}
            </DataTable.Cell>
            <DataTable.Cell>{habit.getTotalCount("average")}</DataTable.Cell>
          </DataTable.Row>
        </DataTable>

        <Text>
          <b>Habit Log:</b>
        </Text>
        <ScrollView style={styles.habitLog}>
          {habit
            .getSortedActivityLog("descending")
            .map((activity: { date: string; count: number }) => {
              return (
                <Text key={activity.date}>
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
  },

  habitLog: {
    maxHeight: 50,
    overflow: "scroll",
  },
});
