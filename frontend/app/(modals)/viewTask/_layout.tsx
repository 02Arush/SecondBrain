import { StyleSheet, View } from "react-native";
import React, { useState, useCallback, useContext } from "react";
import { router, Slot, useLocalSearchParams } from "expo-router";
import { Text, IconButton } from "react-native-paper";
import { useFocusEffect } from "expo-router";
import { useTheme } from "react-native-paper";
import { AuthContext } from "@/contexts/authContext";
import Task from "@/api/task";
import { getTask } from "@/api/taskStorage";
import { updateTask, deleteTask } from "@/api/taskStorage";
import constants from "@/constants/constants";
import {
  getSimpleDateFromDate,
  SimpleDate,
  getDateFromSimpleDate,
} from "@/api/types_and_utils";
import { TaskContext, TaskProvider } from "@/contexts/taskContext";

const _layout = () => {
  const theme = useTheme();
  const { email } = useContext(AuthContext);
  const { taskID } = useLocalSearchParams<{ taskID: string }>();
  //   const [task, setTask] = useState<Task>();

  //   useFocusEffect(
  //     useCallback(() => {
  //       // get the task details
  //       (async () => {
  //         // alert(taskID);

  //         if (taskID && typeof taskID === "string") {
  //           const res = await getTask(email, taskID);

  //           const currTask = res.data;
  //           // populate the fields with intiial values
  //           if (currTask instanceof Task) {
  //             setTask(currTask);
  //           } else {
  //             alert(res.message);
  //           }
  //         }
  //       })();
  //     }, [taskID, email])
  //   );

  return (
    <TaskProvider taskID={taskID}>
      <View style={styles.pageContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.headerTabs}>
            <IconButton icon="pencil" />
            <IconButton icon="account-group-outline" />
          </View>
          <Slot />
        </View>
      </View>
    </TaskProvider>
  );
};

export default _layout;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  contentContainer: {
    width: 350,
  },

  headerTabs: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
});
