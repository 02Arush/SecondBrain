import { StyleSheet, View } from "react-native";
import React from "react";
import { Text, IconButton } from "react-native-paper";
import constants from "@/constants/constants";
import { CustomSurface as Surface } from "./CustomSurface";
const TaskItem = ({
  taskName = "NULL",
  deadline = constants.NO_TASK_DEADLINE,
  userPriority = "NULL",
}) => {
  return (
    <Surface style={styles.taskItemContainer}>
      <View style={styles.leftItems}>
        <IconButton icon="circle-outline" />
        <Text>{taskName}</Text>
      </View>
      <View style={styles.rightItems}>
        <View>
          <Text variant="bodySmall">Deadline: {deadline}</Text>
          <Text>Priority: {userPriority}</Text>
        </View>
        <IconButton icon="dots-horizontal" />
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
