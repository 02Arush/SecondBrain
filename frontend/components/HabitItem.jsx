import { StyleSheet, TouchableOpacity, View } from "react-native";
import React from "react";
import { Button, Icon, IconButton, Text } from "react-native-paper";
import { router, useRouter } from "expo-router";
import { CustomSurface as Surface } from "@/components/CustomSurface";
import constants from "@/constants/constants";
import { isDailyCheckin } from "@/api/types_and_utils";
import Habit from "@/api/habit";
/**
 *
 *
 */
const HabitItem = ({ habit }) => {
  if (!habit instanceof Habit) {
    return <></>;
  }

  const habitID = habit.getID();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  // const sevenDayCount = habit.getCountFromDateRange(
  //   new Date().setDate(new Date().getDate() - 6),
  //   new Date(),
  //   true
  // );

  const sevenDayCount = habit.getCountPastXDays(7)

  const todayCount = habit.getTodayCount();

  function handleEditHabit() {
    router.push({
      pathname: "/(modals)/viewHabitLog/editHabit",
      params: {
        habitID: habitID,
      },
    });
  }

  async function handleViewGraph() {
    router.push({
      pathname: "/(modals)/viewHabitLog/averages",
      params: {
        habitID: habitID,
      },
    });
  }

  return (
    <Surface style={styles.container}>
      <View style={styles.nameSection}>
        <Text>{habit.getName()}</Text>
      </View>
      <View style={styles.actionSection}>
        <Text>Today: {todayCount} </Text>
        <Text>Week: {sevenDayCount}</Text>
        {!isDailyCheckin(habit) && (
          <IconButton
            icon="clipboard-edit-outline"
            size={16}
            onPress={handleEditHabit}
          />
        )}
        <IconButton icon="chart-box" size={16} onPress={handleViewGraph} />
      </View>
    </Surface>
  );
};

export default HabitItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    marginVertical: 4,
  },

  nameSection: {
    flex: 2,
    paddingLeft: 4,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-start",
  },

  actionSection: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    flex: 4,
  },
});
