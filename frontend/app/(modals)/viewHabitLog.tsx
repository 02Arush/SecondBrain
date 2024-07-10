import { StyleSheet, View, ScrollView } from "react-native";
import React, { useContext } from "react";
import { useRouteInfo } from "expo-router/build/hooks";
import { useState, useEffect } from "react";
import Habit from "@/api/habit";
import { retrieveHabitObject } from "@/api/storage";
import { Surface, DataTable, Text, useTheme } from "react-native-paper";
import { AuthContext } from "@/contexts/authContext";
import { isAnonymous } from "@/constants/AuthConstants";
import { getUserDataFromEmail } from "@/api/db_ops";
const viewHabitLog = () => {
  const route = useRouteInfo();
  const habitName = route.params.habitName.toString().toUpperCase();
  const theme = useTheme();
  const [habit, setThisHabit] = useState(new Habit("NULL_HABIT", "NULL_UNIT"));
  const { email } = useContext(AuthContext);

  useEffect(() => {
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
  }, []);

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
            <DataTable.Title>Total {habit.getUnit()}</DataTable.Title>
            <DataTable.Title>{habit.getUnit()}/day</DataTable.Title>
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
              {roundToTwoDecimals(habit.getCountPast7Days("total"))}
            </DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPast7Days("average"))}
            </DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Past 30 Days</DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPast30Days("total"))}
            </DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPast30Days("average"))}
            </DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Past 6 Months</DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPast6Months("total"))}
            </DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPast6Months("average"))}
            </DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Past Year</DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPastYear("total"))}
            </DataTable.Cell>
            <DataTable.Cell>
              {roundToTwoDecimals(habit.getCountPastYear("average"))}
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
        <ScrollView>
          {habit
            .getSortedActivityLog()
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
});
