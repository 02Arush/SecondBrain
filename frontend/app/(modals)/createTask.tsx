import { StyleSheet, View, SafeAreaView } from "react-native";
import React, { useState, useContext } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import {
  Checkbox,
  HelperText,
  Text,
  TextInput,
  Button,
  IconButton,
  useTheme,
} from "react-native-paper";
import { SimpleDate } from "@/api/types_and_utils";
import DatePicker from "@/components/DatePicker";
import OutlineModal from "@/components/OutlineModal";
import constants from "@/constants/constants";
import { getDateFromSimpleDate } from "@/api/types_and_utils";
import Slider from "@react-native-community/slider";
import { CustomSurface as Surface } from "@/components/CustomSurface";
type checkedState = "checked" | "unchecked" | "indeterminate";
import Task from "@/api/task";
import { createTask as createTaskDB } from "@/api/db_ops";
import { AuthContext } from "@/contexts/authContext";
import { router } from "expo-router";

const createTask = () => {
  const theme = useTheme();
  const { email } = useContext(AuthContext);
  const [taskName, setTaskName] = useState<string>("");
  const [taskDescription, setTaskDescription] = useState<string>("");
  const todayDate = new Date();
  const todaySimpleDate: SimpleDate = {
    day: todayDate.getDate(),
    month: todayDate.getMonth() + 1,
    year: todayDate.getFullYear(),
  };
  const [deadline, setDeadline] = useState<SimpleDate>(todaySimpleDate);
  const [deadlineEnabled, setDeadlineEnabled] =
    useState<checkedState>("checked");

  const [displayedDeadline, setDisplayedDeadline] = useState<string>(
    constants.NO_TASK_DEADLINE
  );

  const [showingDeadlineModal, setShowingDeadlineModal] = useState(false);
  const [importance, setimportance] = useState<number>(5);

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

  const handleCreateTask = async () => {
    // validate task data and information like date etc.
    // API call to create a task

    const taskDeadline: Date | null =
      displayedDeadline.localeCompare(constants.NO_TASK_DEADLINE) === 0
        ? null
        : getDateFromSimpleDate(deadline);

    const newTask = new Task(
      undefined,
      taskName,
      taskDescription,
      taskDeadline,
      importance
    );

    if (typeof email === "string") {
      newTask.addSharedUser({ email: email, permission: "admin" });
    } else {
      alert("Error: email is not a string");
    }

    const res = await createTaskDB(email, newTask);
    if (res.ok) {
      alert("Task Added Successfully");
      router.replace("/tasks")
    } else {
      alert(res.error);
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
            disabled={deadlineEnabled !== "checked"}
            onPress={handleEditDeadline}
            mode="text"
            style={{ marginVertical: 4 }}
          >
            {displayedDeadline}
          </Button>
          <View>
            <Text>Importance: {importance}</Text>
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={1}
              maximumValue={10}
              value={importance}
              onValueChange={(value) => {
                setimportance(value);
              }}
              step={1}
              minimumTrackTintColor={theme.colors.onBackground}
              maximumTrackTintColor={theme.colors.onBackground}
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
            Create Task
          </Button>

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
