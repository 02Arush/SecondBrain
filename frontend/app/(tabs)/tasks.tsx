import { StyleSheet, SafeAreaView, View, ScrollView } from "react-native";
import React, { useState, useCallback, useContext } from "react";
import {
  useTheme,
  Text,
  Button,
  IconButton,
  Icon,
  ActivityIndicator,
} from "react-native-paper";
import TaskItem from "@/components/TaskItem";
import { router, useFocusEffect } from "expo-router";
import { AuthContext } from "@/contexts/authContext";
import { filterOptions as filters } from "@/api/types_and_utils";
import Task from "@/api/models/task";
import Select from "@/components/Select";
import { retrieveTasks } from "@/api/taskStorage";
import { removeData } from "@/api/storage";
import constants from "@/constants/constants";
import { setCompletedStatus } from "@/api/taskStorage";

const tasks = () => {
  const theme = useTheme();
  const { email } = useContext(AuthContext);
  const [taskList, setTaskList] = useState<Array<Task>>([]);
  const [viewingCompletedTasks, setViewingCompletedTasks] = useState(false);
  const [viewingFilter, setViewingFilter] = useState(false);
  const [selectedFilterOption, setSelectedFilterOption] = useState<string>(
    filters.DATE_EARLIEST
  );
  const filterOptions = Object.values(filters);
  const [loading, setLoading] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      handleLoadTasks();
    }, [email])
  );

  const handleLoadTasks = async (
    completed: boolean = false,
    filterOption: string = filters.DATE_EARLIEST
  ) => {
    // TODO: Change to retrieving from taskStorage file
    // await removeData(constants.TASK_LIST)

    // const res = await getTasksForUser(email, completed, filterOption);

    setLoading(true);
    const res = await retrieveTasks(email, completed, filterOption);

    if (res.data) {
      setTaskList(res.data);
      setViewingCompletedTasks(completed);
    } else if (!res.ok) {
      alert(res.message);
    } else {
      alert("TASKS: RESPONSE ERROR");
    }

    setLoading(false);
  };

  const handleCreateTask = () => {
    router.navigate("/(modals)/viewTask/createTask");
  };

  const handleCompleteTask = async (taskID: string, completedStatus = true) => {
    const res = await setCompletedStatus(email, taskID, completedStatus);
    if (!res.ok) {
      alert(res.message);
    } else {
      // Remove task from current displayed list of tasks
      const newTaskList = taskList.filter((task: Task) => {
        return task.getID() !== taskID;
      });
      setTaskList(newTaskList);
    }
  };

  const handleSelectFilterItem = (filterItem: string) => {
    setSelectedFilterOption(filterItem);
    handleLoadTasks(viewingCompletedTasks, filterItem);
  };

  const toggleShowingFilter = () => {
    const filterShowing = viewingFilter;
    setViewingFilter(!filterShowing);
  };

  const toggleShowingCompletedTasks = () => {
    handleLoadTasks(!viewingCompletedTasks, selectedFilterOption);
  };

  const handleChart = () => {
    router.push({
      pathname: "/(modals)/tasksScatterplot",
      params: {},
    });
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
          {/* TODO: LATER MOVE INVITES TO ACCOUNT PAGE */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <IconButton
              icon="filter-variant"
              onPress={toggleShowingFilter}
              iconColor={theme.colors.primary}
            />
            <Select
              visible={viewingFilter}
              setVisible={setViewingFilter}
              selectedItem={selectedFilterOption}
              setSelectedItem={handleSelectFilterItem}
              items={filterOptions}
            />
          </View>

          <View style={styles.topRightActivities}>
            <IconButton
              icon="check-circle-outline"
              iconColor={
                viewingCompletedTasks
                  ? theme.colors.tertiary
                  : theme.colors.onBackground
              }
              onPress={toggleShowingCompletedTasks}
            />
            <IconButton icon="chart-scatter-plot" onPress={handleChart} />
          </View>
        </View>
        <ScrollView style={styles.taskList}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            taskList.map((task: Task, index) => {
              return (
                <TaskItem
                  taskID={task.getID()}
                  key={index}
                  taskName={task.getName()}
                  userImportance={task.getImportance()}
                  deadline={task.getDeadline()}
                  onComplete={(completedStatus = true) => {
                    handleCompleteTask(task.getID(), completedStatus);
                  }}
                  completed={task.getCompleted()}
                />
              );
            })
          )}
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
