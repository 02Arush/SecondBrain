import { StyleSheet, View } from "react-native";
import React, { useContext, useEffect } from "react";
import { TaskContext } from "@/contexts/taskContext";
import { Text } from "react-native-paper";
import RolesTable from "@/components/RolesTable";
import { router } from "expo-router";
import Task from "@/api/task";
import { Button } from "react-native-paper";
import InviteUserUI from "@/components/InviteUserUI";

const viewSharedUsers = () => {
  const task: Task | null = useContext(TaskContext);

  // useEffect(() => {
  //   if (!task || task == null || task == undefined) {
  //   }
  // }, [task]);

  if (!task) {
    // Render nothing while navigating to avoid the "setState during render" warning
    return null;
  }

  return (
    <View>
      <RolesTable item={task} />
      <View style={styles.inviteSection}>
        <Button>Invite Users</Button>
        <View style={styles.inputSection}>
          <InviteUserUI item={task} />
        </View>
      </View>
    </View>
  );
};

export default viewSharedUsers;

const styles = StyleSheet.create({
  inviteSection: {
    flexDirection: "column",
  },

  inputSection: {
    flexDirection: "column",
  },
});
