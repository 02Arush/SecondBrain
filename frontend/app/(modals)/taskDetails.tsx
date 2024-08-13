import { StyleSheet, View, Platform, KeyboardAvoidingView } from "react-native";
import React, { useState, useCallback, useContext } from "react";
import { Text, Button } from "react-native-paper";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { AuthContext } from "@/contexts/authContext";
import Task from "@/api/task";
import { getTaskItem, deleteTask } from "@/api/db_ops";
import { isAnonymous } from "@/constants/constants";

const taskDetails = () => {
  const { taskID } = useLocalSearchParams();
  const { email } = useContext(AuthContext);
  const [task, setTask] = useState<Task>();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (
          typeof taskID === "string" &&
          typeof email === "string" &&
          !isAnonymous(email)
        ) {
          const task = await getTaskItem(email, taskID);
          if (task instanceof Task) {
            setTask(task);
          }
        } else {
          alert(
            "Route Param Error: Task ID must be a string. Current:  " +
              typeof taskID
          );
        }
      })();
    }, [email])
  );

  const handleDeleteTask = async () => {
    const res = await deleteTask(email, taskID);
    if (!res.error) {
      router.replace("/tasks");
    } else {
      alert("Deletion Error " + res.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flexContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={styles.contentContainer}>
        {task && (
          <>
            <Text variant={"displayLarge"}>WORK IN PROGRESS</Text>
            <Text>{task.getName()}</Text>
            <Text>{task.getDescription()}</Text>
            <Button onPress={handleDeleteTask}>Delete Task Permanently</Button>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default taskDetails;

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    width: 350,
    borderWidth: 1,
    borderColor: "white",
  },
});
