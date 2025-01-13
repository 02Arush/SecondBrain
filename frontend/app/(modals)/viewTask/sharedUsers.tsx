import { StyleSheet, View } from "react-native";
import React, { useState, useContext, useEffect } from "react";
import { TaskContext } from "@/contexts/taskContext";
import { Text } from "react-native-paper";
import Task from "@/api/task";
const viewSharedUsers = () => {
  const task: any = useContext(TaskContext);

  const sharedUsers = task instanceof Task ? task.getSharedUsers() : [];

  // useEffect(() => {
  //   if (task instanceof Task) {
  //     console.log("YES");
  //     console.log(task.getJSON());
  //   } else {
  //     console.log("NO");
  //     console.log(task);
  //   }
  // });

  return (
    <View>
      <Text>{JSON.stringify(sharedUsers)}</Text>
    </View>
  );
};

export default viewSharedUsers;

const styles = StyleSheet.create({});
