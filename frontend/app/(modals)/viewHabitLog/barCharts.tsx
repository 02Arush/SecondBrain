import { getFlooredDate } from "@/api/types_and_utils";
import React, { useContext, useState } from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { useTheme } from "react-native-paper";

import { DateRange } from "@/api/models/dateTypes";
import { getElapsedDays } from "@/api/types_and_utils";
import DateRangePicker from "@/components/DateRangePicker";
import SegmentedButtons from "@/components/SegmentedButtons";
import { HabitContext } from "@/contexts/habitContext";

const barCharts = () => {
  const scheme = useColorScheme();
  const theme = useTheme();

  const today = new Date();
  const startDate = getFlooredDate(new Date(today)); // Create a copy of today's date
  startDate.setDate(today.getDate() - 7); // Past 7 wdays including day

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: startDate,
    endDate: today,
  });

  const habit = useContext(HabitContext);

  const handleSelectTimeRangeButton = (value: string) => {
    const elapsedDays = Number(value);
    const startDate = new Date();
    startDate.setDate(today.getDate() - elapsedDays);
    const newDateRange: DateRange = {
      startDate: startDate,
      endDate: new Date(today),
    };

    setDateRange(newDateRange);
  };

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

  const barColor: string = theme.colors.primary;
  const chartConfig = {
    backgroundGradientFrom: "#FFF",
    backgroundGradientFromOpacity: 0.0,
    backgroundGradientTo: "#FFF",
    backgroundGradientToOpacity: 0.0,
    color: (opacity = 1) => barColor,
    strokeWidth: 3, // optional, default 3
    barPercentage: 0.25,
    propsForLabels: {
      fontSize: 12,
    },

    useShadowColorFromDataset: false, // optional
  };

  const handleSetDateRange = (dateRange: DateRange) => {
    setDateRange(dateRange);
  };

  return (
    <View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <SegmentedButtons
          width={100}
            segments={[
              { value: "7", label: "1 Week" },
              { value: "14", label: "2 Weeks" },
              { value: "30", label: "1 Month" },
              { value: "90", label: "3 Months" },
              { value: "182", label: "6 Months" },
              { value: "365", label: "1 Year" },
            ]}
            selectedSegment={getElapsedDays(
              dateRange.startDate,
              dateRange.endDate
            ).toString()}
            setSelectedSegment={handleSelectTimeRangeButton}
          />
        </View>
      </View>
      <DateRangePicker
        dateRange={dateRange}
        setDateRange={handleSetDateRange}
      />
      <BarChart
        data={data}
        width={350}
        height={350}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={chartConfig}
        verticalLabelRotation={60}
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
    marginVertical: 8,
  },
});
