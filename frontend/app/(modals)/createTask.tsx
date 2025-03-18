import { SimpleDate } from "@/api/models/dateTypes";
import { getDateFromSimpleDate } from "@/api/types_and_utils";
import DatePicker from "@/components/DatePicker";
import OutlineModal from "@/components/OutlineModal";
import constants from "@/constants/constants";
import { Slider } from "@react-native-assets/slider";
import React, { useCallback, useContext, useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, View } from "react-native";
import {
  Button,
  HelperText,
  IconButton,
  Text,
  TextInput,
  useTheme
} from "react-native-paper";

import Task from "@/api/models/task";
import { deleteTask, getTask, updateTask } from "@/api/taskStorage";
import { getSimpleDateFromDate } from "@/api/types_and_utils";
import { CustomSurface as Surface } from "@/components/CustomSurface";
import { AuthContext } from "@/contexts/authContext";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

const createTask = () => {
  const theme = useTheme();
  const { email } = useContext(AuthContext);
  const local = useLocalSearchParams();
  const { taskID } = useLocalSearchParams<{ taskID: string }>();

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
            setTaskName(currTask.getName());
            setTaskDescription(currTask.getDescription());
            const deadline = currTask.getDeadline();

            if (deadline) {
              setDeadline(getSimpleDateFromDate(deadline));
              setDisplayedDeadline("Deadline: " + deadline.toDateString());
            }

            setImportance(currTask.getImportance());
          } else {
            alert(res.message);
          }
        }
      })();
    }, [taskID, email])
  );

  const [taskName, setTaskName] = useState<string>("");
  const [taskDescription, setTaskDescription] = useState<string>("");
  const todayDate = new Date();
  const todaySimpleDate: SimpleDate = getSimpleDateFromDate(todayDate);
  const [deadline, setDeadline] = useState<SimpleDate>(todaySimpleDate);
  const [displayedDeadline, setDisplayedDeadline] = useState<string>(
    constants.NO_TASK_DEADLINE
  );

  const [showingDeadlineModal, setShowingDeadlineModal] = useState(false);
  const [importance, setImportance] = useState<number>(5);

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
    const res = await deleteTask(email, taskID);
    if (res.ok) {
      router.replace("/tasks");
    } else {
      alert("Deletion Error. Message: " + res.message);
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
      taskID,
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
