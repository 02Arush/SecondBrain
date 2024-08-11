import { StyleSheet, SafeAreaView, View, ScrollView } from "react-native";
import React, { useState, useCallback, useContext } from "react";
import { useTheme, Text, Button, IconButton, Icon } from "react-native-paper";
import TaskItem from "@/components/TaskItem";
import { router, useFocusEffect } from "expo-router";
import { AuthContext } from "@/contexts/authContext";
import { getTasksForUser } from "@/api/db_ops";
import Task from "@/api/task";
import { completeTask } from "@/api/db_ops";

const tasks = () => {
  const theme = useTheme();
  const { email } = useContext(AuthContext);

  const [taskList, setTaskList] = useState<Array<Task>>([]);
  const [viewingCompletedTasks, setViewingCompletedTasks] = useState(false);

  // HERE: REMOVE THE SPECIFIED TASK WITH THE TASK ID FROM TASK_LIST
  const handleCompleteTask = async (taskID: string) => {
    const res = await completeTask(email, taskID);
    if (res.error) {
      alert(res.error);
    } else {
      const newTaskList = taskList.filter((task: Task) => {
        return task.getTaskID() !== taskID;
      });
      setTaskList(newTaskList);
    }
  };

  const handleLoadTasks = async (completed: boolean = false) => {
    const res = await getTasksForUser(email, completed);
    if (res.taskList) {
      setTaskList(res.taskList);
      setViewingCompletedTasks(completed);
    } else if (res.error) {
      alert(res.error);
    } else {
      alert("TASKS: RESPONSE ERROR");
    }
  };

  useFocusEffect(
    useCallback(() => {
      handleLoadTasks();
    }, [email])
  );

  const handleCreateTask = () => {
    router.navigate("/(modals)/createTask");
  };

  const handleFilter = () => {
    alert("Not Implemented Yet");
  };

  const handleChart = () => {
    alert("Not Implemented Yet");
  };

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
            <IconButton icon="filter-variant" onPress={handleFilter} />
          </View>
          <View style={styles.topRightActivities}>
            <IconButton
              icon="check-circle-outline"
              iconColor={
                viewingCompletedTasks
                  ? theme.colors.tertiary
                  : theme.colors.onBackground
              }
              onPress={() => {
                if (viewingCompletedTasks) {
                  handleLoadTasks(false);
                } else {
                  handleLoadTasks(true);
                }
              }}
            />
            <IconButton icon="chart-scatter-plot" onPress={handleChart} />
          </View>
        </View>
        <ScrollView style={styles.taskList}>
          {taskList.map((task: Task, index) => {
            return (
              <TaskItem
                taskID={task.getTaskID()}
                key={index}
                taskName={task.getName()}
                userImportance={task.getImportance()}
                deadline={task.getDeadline()}
                onComplete={() => {
                  handleCompleteTask(task.getTaskID());
                }}
                completed={task.getCompleted()}
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
  },

  topActivities: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  topRightActivities: {
    flexDirection: "row",
  },

  taskList: {},

  createTaskButton: {
    height: 75,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
});
