import { StyleSheet, View } from "react-native";
import React from "react";
import { Text, IconButton } from "react-native-paper";
import constants from "@/constants/constants";
import { CustomSurface as Surface } from "./CustomSurface";

type propTypes = {
  taskID: number;
  taskName: string;
  displayedDeadline: string;
  userImportance: Number | null;
};

const TaskItem = ({
  taskID,
  taskName = "NULL",
  displayedDeadline,
  userImportance,
}: propTypes) => {
  displayedDeadline = constants.NO_TASK_DEADLINE ? "N/A" : displayedDeadline;

  const handleCompleteTask = async () => {
    

  };

  const handleEditTask = async () => {};

  return (
    <Surface style={styles.taskItemContainer}>
      <View style={styles.leftItems}>
        <IconButton icon="circle-outline" onPress={handleCompleteTask} />
        <Text>{taskName}</Text>
      </View>
      <View style={styles.rightItems}>
        <View>
          <Text variant="bodySmall">Deadline: {displayedDeadline}</Text>
          <Text>Importance: {userImportance?.toString()}</Text>
        </View>
        <IconButton icon="dots-horizontal" onPress={handleEditTask} />
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
  },

  rightItems: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
