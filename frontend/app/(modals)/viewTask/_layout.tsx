import { StyleSheet, View } from "react-native";
import React, { useState, useCallback, useContext } from "react";
import { router, Slot, useLocalSearchParams } from "expo-router";
import { Text, IconButton } from "react-native-paper";
import { useFocusEffect } from "expo-router";
import { useTheme } from "react-native-paper";
import { AuthContext } from "@/contexts/authContext";
import Task from "@/api/models/task";
import { getTask } from "@/api/taskStorage";
import { updateTask, deleteTask } from "@/api/taskStorage";
import constants from "@/constants/constants";
import { useRouteInfo } from "expo-router/build/hooks";

import { TaskContext, TaskProvider } from "@/contexts/taskContext";

const _layout = () => {
  const theme = useTheme();
  const { email } = useContext(AuthContext);
  const { taskID } = useLocalSearchParams<{ taskID: string }>();
  const [task, setTask] = useState<Task>();
  const route = useRouteInfo();
  const isPath = (path: string) => {
    return route.pathname.localeCompare(`/viewTask/${path}`) === 0;
  };

  useFocusEffect(
    useCallback(() => {
      // get the task details
      (async () => {
        // alert(taskID);

        if (taskID && typeof taskID === "string") {
          const res = await getTask(email, taskID);

          const currTask = res.data;
          // populate the fields with intiial values
          if (currTask instanceof Task) {
            setTask(currTask);
          } else {
            alert(res.message);
          }
        }
      })();
    }, [taskID, email])
  );

  const handleNavigateSharedUsers = () => {
    router.replace("/(modals)/viewTask/sharedUsers");
  };

  const handleNavigateEditTask = () => {
    router.replace("/(modals)/viewTask/createTask");
  };

  return (
    <TaskProvider taskID={taskID}>
      <View style={styles.pageContainer}>
        <View style={styles.contentContainer}>
          <Text variant="bodyLarge">{task && task.getName()}</Text>
          <View style={styles.headerTabs}>
            <IconButton
              icon="pencil"
              onPress={handleNavigateEditTask}
              iconColor={isPath("createTask") ? theme.colors.primary : "grey"}
            />
            <IconButton
              disabled={!task}
              icon="account-group-outline"
              iconColor={isPath("sharedUsers") ? theme.colors.primary : "grey"}
              onPress={handleNavigateSharedUsers}
            />
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
    borderBottomWidth: 1,
    borderBottomColor: "grey",
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
});
