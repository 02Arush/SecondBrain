import { StyleSheet, View } from "react-native";
import React from "react";
import { Slot, router } from "expo-router";
import { useRouteInfo } from "expo-router/build/hooks";
import { Text, IconButton, Icon } from "react-native-paper";

const ViewHabitLogLayout = () => {
  const route = useRouteInfo();
  const habitName = route.params.habitName;

  const handleNavigateToEditHabit = () => {
    router.replace({
      pathname: "/(modals)/editHabit",
      params: {
        habitName: habitName,
      },
    });
  };

  const handleNavigateToChart = () => {
    router.replace({
      pathname: "/(modals)/viewHabitLog/barCharts",
      params: {
        habitName: habitName,
      },
    });
  };

  const handleNavigateToAverages = () => {
    router.replace({
      pathname: "/(modals)/viewHabitLog/averages",
      params: {
        habitName: habitName,
      },
    });
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.contentContainer}>
        <View style={styles.heading}>
          <View style={styles.habitInfo}>
            <Text>{habitName}</Text>
            <Text>Habit Goal</Text>
          </View>
          <View style={styles.habitNavigation}>
            <IconButton icon="pencil" onPress={handleNavigateToEditHabit} />
            <IconButton
              icon="timetable"
              onPress={handleNavigateToAverages}
            ></IconButton>
            <IconButton icon="chart-bar" onPress={handleNavigateToChart} />
          </View>
        </View>
        <View>
          <Slot />
        </View>
      </View>
    </View>
  );
};

export default ViewHabitLogLayout;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "red",
    padding: 8,
  },
  contentContainer: {
    minWidth: 350,
    borderWidth: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    borderColor: "orange",

    // WORK IN PROGRESS: BOX SIZINGF
    // height: 75
  },

  heading: {
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",

    borderColor: "green",
    // maxHeight: 25,
    
  },

  habitInfo: {},

  habitNavigation: {
    flexDirection: "row",
  },
});