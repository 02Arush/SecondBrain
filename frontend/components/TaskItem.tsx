import { StyleSheet, View } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { Text, IconButton, useTheme } from "react-native-paper";
import constants from "@/constants/constants";
import { CustomSurface as Surface } from "./CustomSurface";
import { router } from "expo-router";
import { AuthContext } from "@/contexts/authContext";

type propTypes = {
  taskID: string;
  taskName: string;
  deadline: Date | null;
  userImportance: Number | null;
  onComplete: Function;
  completed?: boolean;
};

const TaskItem = ({
  taskID,
  taskName = "NULL",
  deadline,
  userImportance,
  onComplete,
  completed = false,
}: propTypes) => {
  const customDateFormat = (date: Date): string => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const day = days[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1; // Because months are 0 indexed
    const year = date.getFullYear() % 100; // Last 2 digits of year
    return `${day} ${month}/${dayOfMonth}/${year}`;
  };

  const displayedDeadline =
    deadline == null ? "N/A" : customDateFormat(deadline);

  const handleCompleteTask = async () => {
    if (!completed) {
      onComplete(true);
    } else {
      onComplete(false);
    }
  };

  const handleShowTaskDetails = async () => {
    router.push({
      pathname: "/(modals)/createTask",
      params: {
        taskID: taskID,
      },
    });
  };

  const theme = useTheme();
  const [iconColor, setIconColor] = useState(
    completed ? theme.colors.tertiary : theme.colors.onBackground
  );
  useEffect(() => {
    setIconColor(completed ? theme.colors.tertiary : theme.colors.onBackground);
  }, [completed]);

  return (
    <Surface style={styles.taskItemContainer}>
      <View style={styles.leftItems}>
        <IconButton
          iconColor={iconColor}
          icon={completed ? "check-circle-outline" : "circle-outline"}
          onPress={handleCompleteTask}
          size={20}
          style={{ padding: 0, margin: 0, marginRight: -2 }}
        />
        <Text>{taskName}</Text>
      </View>
      <View style={styles.rightItems}>
        <View>
          <Text variant="bodySmall">Due: {displayedDeadline}</Text>
          <Text>Importance: {userImportance?.toString()}</Text>
        </View>
        <IconButton icon="dots-horizontal" onPress={handleShowTaskDetails} />
      </View>
    </Surface>
  );
};

export default TaskItem;

const styles = StyleSheet.create({
  taskItemContainer: {
    margin: 4,
    padding: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  leftItems: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    flex: 1,
    marginRight: 2,
  },

  rightItems: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 2,
    flex: 1,
  },
});
