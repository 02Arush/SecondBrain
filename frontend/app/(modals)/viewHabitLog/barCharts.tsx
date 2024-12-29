import { StyleSheet, View, useColorScheme } from "react-native";
import React, { useState, useEffect, useCallback, useContext } from "react";
import { Text, useTheme } from "react-native-paper";
import { BarChart } from "react-native-chart-kit";
import { useRouteInfo } from "expo-router/build/hooks";
import { AuthContext } from "@/contexts/authContext";
import Habit from "@/api/habit";
import { useFocusEffect } from "expo-router";
import { isAnonymous } from "@/constants/constants";
import { getUserDataFromEmail } from "@/api/db_ops";
import { retrieveHabitObject } from "@/api/storage";
import { HabitContext } from "@/contexts/habitContext";

const barCharts = () => {
  const scheme = useColorScheme();
  const theme = useTheme();
  const route = useRouteInfo();

  const habitName = route.params.habitName.toString().toUpperCase();
  const { email } = useContext(AuthContext);
  // const habit = useContext(HabitContext);
  // const [habit, setHabit] = useState<Habit>();

  // const { habit } = useContext(HabitContext);
  const habit = useContext(HabitContext);

  // useFocusEffect(
  //   useCallback(() => {
  //     async function getHabitData() {
  //       let habitList = null;
  //       if (!isAnonymous(email)) {
  //         const userData = await getUserDataFromEmail(email);
  //         habitList = Array.isArray(userData["habitList"])
  //           ? userData["habitList"]
  //           : JSON.parse(userData["habitList"]);
  //       }

  //       const currHabit = await retrieveHabitObject(habitName, habitList);
  //       if (currHabit instanceof Habit) {
  //         setHabit(currHabit);
  //       } else {
  //         alert(currHabit.error);
  //       }
  //     }
  //     getHabitData();
  //   }, [email])
  // );

  // the following function is used for getting habit data from start and end date to format for graphs
  const today = new Date();
  const startDate = new Date(today); // Create a copy of today's date
  startDate.setDate(today.getDate() - 9); // Past 10 days including day

  const activities = habit?.getActivityOfDateRange(startDate, today) || [];
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
    <View>
      <BarChart
        style={{ position: "relative" }}
        data={data}
        width={350}
        height={350}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={chartConfig}
        verticalLabelRotation={70}
        fromZero
      />
    </View>
  );
};

export default barCharts;

const styles = StyleSheet.create({});
