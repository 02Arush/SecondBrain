import {
  StyleSheet,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState, useContext, useEffect } from "react";
import {
  getSimpleDateFromDate,
  getDateFromSimpleDate,
  SimpleDate,
} from "@/api/types_and_utils";
import constants from "@/constants/constants";
import { deleteTask, updateTask } from "@/api/taskStorage";
import { router } from "expo-router";
import Task from "@/api/task";
import { AuthContext } from "@/contexts/authContext";
import { TaskContext } from "@/contexts/taskContext";
import { Button } from "react-native-paper";
import OutlineModal from "@/components/OutlineModal";
import {
  useTheme,
  Text,
  IconButton,
  TextInput,
  HelperText,
} from "react-native-paper";
import { Slider } from "@react-native-assets/slider";
import DatePicker from "@/components/DatePicker";

import { CustomSurface as Surface } from "@/components/CustomSurface";

const createTask = () => {
  const task: Task | null = useContext(TaskContext) as Task | null;
  const theme = useTheme();

  useEffect(() => {
    setTaskName(task?.getName() || "");
    setTaskDescription(task?.getDescription() || "");
    setDisplayedDeadline(
      task?.getDeadline()?.toDateString() || constants.NO_TASK_DEADLINE
    );
    setImportance(task?.getImportance() || 5)
  }, [task]);

  const taskID = (task as Task) instanceof Task ? task?.getTaskID() : undefined;
  const { email } = useContext(AuthContext);

  const [taskName, setTaskName] = useState<string>(task?.getName() || "");
  const [taskDescription, setTaskDescription] = useState<string>(
    task?.getDescription() || ""
  );
  const todayDate = new Date();
  const todaySimpleDate: SimpleDate = getSimpleDateFromDate(todayDate);
  const [deadline, setDeadline] = useState<SimpleDate>(todaySimpleDate);
  const [displayedDeadline, setDisplayedDeadline] = useState<string>(
    task?.getDeadline()?.toDateString() || constants.NO_TASK_DEADLINE
  );

  const [showingDeadlineModal, setShowingDeadlineModal] = useState(false);
  const [importance, setImportance] = useState<number>(
    task?.getImportance() || 5
  );

  const handleEditDeadline = () => {
    setShowingDeadlineModal(true);
  };

  const handleClearDeadline = () => {
    setDisplayedDeadline(constants.NO_TASK_DEADLINE);
    setShowingDeadlineModal(false);
  };

  const handleConfirmDeadline = () => {
    const deadlineDate = getDateFromSimpleDate(deadline);
    if (deadlineDate) {
      const dateString = deadlineDate.toDateString();
      setDisplayedDeadline("Deadline: " + dateString);
      setShowingDeadlineModal(false);
    }
  };

  const handleDeleteTask = async () => {
    if (taskID) {
      const res = await deleteTask(email, taskID);
      if (res.ok) {
        router.replace("/tasks");
      } else {
        alert("Deletion Error. Message: " + res.message);
      }
    } else {
      alert("Invalid Task ID.");
    }
  };

  const handleCreateTask = async () => {
    // validate task data and information like date etc.
    // API call to create a task

    const taskDeadline: Date | null =
      displayedDeadline.localeCompare(constants.NO_TASK_DEADLINE) === 0
        ? null
        : getDateFromSimpleDate(deadline);

    const newTask = new Task(
      taskID || undefined,
      taskName,
      taskDescription,
      taskDeadline,
      importance
    );

    if (typeof email === "string") {
      newTask.addSharedUser({
        email: email,
        role: constants.ROLE.OWNER,
        joinDate: new Date(),
      });
    } else {
      alert("Error: email is not a string");
    }

    const isNewTask = taskID == undefined;
    const res = await updateTask(email, newTask, isNewTask);

    // const res = updateExistingTask
    if (res.ok) {
      alert("Task Built Successfully");
      router.replace("/tasks");
    } else {
      alert(`ERROR: ${res.message}`);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 20}
      style={{
        ...styles.pageContainer,
        backgroundColor: theme.colors.background,
      }}
    >
      <SafeAreaView>
        <View style={styles.contentContainer}>
          <TextInput
            label={"name"}
            value={taskName}
            onChangeText={(text) => {
              setTaskName(text);
            }}
            style={{ marginVertical: 4 }}
          />
          <TextInput
            label={"description"}
            value={taskDescription}
            onChangeText={(text) => {
              setTaskDescription(text);
            }}
            style={{ marginVertical: 4 }}
          />

          <Button
            onPress={handleEditDeadline}
            mode="text"
            style={{ marginVertical: 4 }}
          >
            {displayedDeadline}
          </Button>
          <View>
            <Text>Importance: {importance}</Text>
            <Slider
              value={importance}
              onValueChange={(value) => {
                setImportance(value);
              }}
              minimumValue={1}
              maximumValue={10}
              step={1}
              thumbTintColor={theme.colors.primary}
            />
            <View
              style={{ justifyContent: "space-between", flexDirection: "row" }}
            >
              <HelperText type="info">1 (low)</HelperText>
              <HelperText type="info">10 (high)</HelperText>
            </View>
          </View>
          <Button
            mode="contained"
            style={{ marginTop: 8 }}
            onPress={handleCreateTask}
          >
            {!taskID ? "Create Task" : "Update Task"}
          </Button>
          {taskID && <Button onPress={handleDeleteTask}>Delete Task</Button>}

          <OutlineModal showing={showingDeadlineModal}>
            <Surface
              style={{
                width: 350,
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                }}
              >
                <Text style={{ marginLeft: 20 }} variant="bodyLarge">
                  Select a deadline date
                </Text>
                <IconButton
                  icon="close"
                  onPress={() => {
                    setShowingDeadlineModal(false);
                  }}
                />
              </View>
              <View style={{ marginVertical: 20 }}>
                <DatePicker date={deadline} setDate={setDeadline} />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  width: "100%",
                }}
              >
                <Button style={{ margin: 4 }} onPress={handleClearDeadline}>
                  Clear Deadline
                </Button>
                <Button
                  style={{ margin: 4 }}
                  mode="contained"
                  onPress={handleConfirmDeadline}
                >
                  Confirm Deadline
                </Button>
              </View>
            </Surface>
          </OutlineModal>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default createTask;

const styles = StyleSheet.create({
  pageContainer: {
    flexDirection: "column",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  contentContainer: {
    width: 350,
  },
});
