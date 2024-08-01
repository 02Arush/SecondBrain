import { StyleSheet, SafeAreaView, View, ScrollView } from "react-native";
import React, { useState, useCallback, useContext } from "react";
import { useTheme, Text, Button, IconButton, Icon } from "react-native-paper";
import TaskItem from "@/components/TaskItem";
import { router, useFocusEffect } from "expo-router";
import { AuthContext } from "@/contexts/authContext";
import { getTasksForUser } from "@/api/db_ops";
import Task from "@/api/task";

const tasks = () => {
  const theme = useTheme();
  const { email } = useContext(AuthContext);

  const [taskList, setTaskList] = useState<Array<Task>>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const res = await getTasksForUser(email, false);
        if (res.taskList) {
          setTaskList(res.taskList);
        } else if (res.error) {
          alert(res.error);
        } else {
          alert("TASKS: RESPONSE ERROR");
        }
      })();
    }, [email])
  );

  const handleCreateTask = () => {
    router.navigate("/(modals)/createTask");
  };

  const handleFilter = () => {};

  const handleChart = () => {};

  return (
    <SafeAreaView
      style={{
        backgroundColor: theme.colors.background,
        ...styles.pageContainer,
      }}
    >
      <View style={styles.contentContainer}>
        <View style={styles.topActivities}>
          <View>
            {/* TODO: LATER MOVE INVITES TO ACCOUNT PAGE */}
            <IconButton icon="email-plus" />
          </View>
          <View style={styles.topRightActivities}>
            <IconButton icon="filter-variant" onPress={handleFilter} />
            <IconButton icon="chart-scatter-plot" onPress={handleChart} />
          </View>
        </View>
        <ScrollView style={styles.taskList}>
          {taskList.map((task: Task) => {
            return (
              <TaskItem
                taskID={task.getTaskID()}
                key={task.getTaskID()}
                taskName={task.getName()}
                userImportance={task.getImportance()}
                displayedDeadline={task.getDeadline()}
              />
            );
          })}
        </ScrollView>
        <View style={styles.createTaskButton}>
          <Button
            mode="contained"
            onPress={handleCreateTask}
            style={{ width: "75%" }}
          >
            Create Task
          </Button>
        </View>
        {/* <Text>Filter Task By Priority/Deadline + Visualize Option X-Axis: Days-Til-Deadline, Y-Axis: Priority</Text>
        <Text>View Tasks Based on their filters</Text>
        <Text>Create Task, which takes you to a task builder screen</Text>
        <Text>View Archived Tasks</Text>
        <Text>View Task Invites</Text> */}
      </View>
    </SafeAreaView>
  );
};

export default tasks;

const styles = StyleSheet.create({
  pageContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flex: 1,
  },

  contentContainer: {
    width: 350,
    borderWidth: 1,
  },

  topActivities: {
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  topRightActivities: {
    flexDirection: "row",
  },

  taskList: {
    borderWidth: 1,
  },

  createTaskButton: {
    height: 75,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
});
