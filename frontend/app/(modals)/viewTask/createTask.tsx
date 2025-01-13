import { StyleSheet, Text, View } from "react-native";
import React, { useState, useContext } from "react";
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

type propTypes = {
  task: Task;
};
const createTask = ({ task }: propTypes) => {
  const taskID = task.getTaskID();
  const { email } = useContext(AuthContext);

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
    <View>
      <Text>createTask</Text>
    </View>
  );
};

export default createTask;

const styles = StyleSheet.create({});
