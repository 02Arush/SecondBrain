import { StyleSheet, TouchableOpacity, View } from "react-native";
import React from "react";
import { Button, Icon, IconButton, Text } from "react-native-paper";
import { router, useRouter } from "expo-router";
import { CustomSurface as Surface } from "@/components/CustomSurface";
const HabitItem = ({ name, dailyCount, totalCount: sevenDayCount }) => {
  const router = useRouter();

  function handleEditHabit() {
    alert(name);
    router.push({
      pathname: "/(modals)/viewHabitLog/editHabit",
      params: {
        habitName: name,
      },
    });
  }

  async function handleViewGraph() {
    alert(name);
    router.push({
      pathname: "/(modals)/viewHabitLog/averages",
      params: {
        habitName: name,
      },
    });
  }

  return (
    <Surface style={styles.container}>
      <View style={styles.nameSection}>
        <Text>{name}</Text>
      </View>
      <View style={styles.actionSection}>
        <Text>Today: {dailyCount} </Text>
        <Text>Week: {sevenDayCount}</Text>
        <IconButton
          icon="clipboard-edit-outline"
          size={16}
          onPress={handleEditHabit}
        />
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
