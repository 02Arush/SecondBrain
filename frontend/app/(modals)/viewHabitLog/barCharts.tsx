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
import DateRangePicker from "@/components/DateRangePicker";
import { DateRange } from "@/api/types_and_utils";
import SegmentedButtons from "@/components/SegmentedButtons";

const barCharts = () => {
  const scheme = useColorScheme();
  const theme = useTheme();
  const route = useRouteInfo();
  const habitName = route.params.habitName.toString().toUpperCase();
  const today = new Date();
  const startDate = new Date(today); // Create a copy of today's date
  startDate.setDate(today.getDate() - 9); // Past 10 days including day

  const [selectedPrebuiltDateRange, setSelectedPrebuiltDateRange] =
    useState("7");
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: startDate,
    endDate: today,
  });
  const { email } = useContext(AuthContext);

  // const habit = useContext(HabitContext);
  // const [habit, setHabit] = useState<Habit>();

  // const { habit } = useContext(HabitContext);
  const habit = useContext(HabitContext);

  // useFocusEffect(
  //   useCallback(() => {

  //   }, [email])
  // );

  // the following function is used for getting habit data from start and end date to format for graphs

  // const activities = habit?.getActivityOfDateRange(startDate, today) || [];

  const activities =
    habit?.getLogForBarcharts(dateRange.startDate, dateRange.endDate) || [];
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

  const handleSetDateRange = (dateRange: DateRange) => {
    setDateRange(dateRange);
  };

  return (
    <View>
      <View style={styles.row}>
        <View style={{ flex: 2 }}>
          <Text>Showing Past:</Text>
        </View>
        <View style={{ flex: 5 }}>
          <SegmentedButtons
            segments={[
              { value: "7" },
              { value: "14" },
              { value: "30" },
              { value: "90" },
              { value: "365" },
            ]}
            selectedSegment={"7"}
            setSelectedSegment={(segment: string) => {
              alert(segment);
            }}
          />
        </View>
      </View>
      <DateRangePicker
        dateRange={dateRange}
        setDateRange={handleSetDateRange}
      />
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

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
