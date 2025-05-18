import { StyleSheet, View } from "react-native";
import React, { useContext, useEffect } from "react";
import { TaskContext } from "@/contexts/taskContext";
import { Text } from "react-native-paper";
import RolesTable from "@/components/RolesTable";
import { router } from "expo-router";
import Task from "@/api/models/task";
import { Button } from "react-native-paper";
import InviteUserUI from "@/components/InviteUserUI";
import { useState, useCallback } from "react";

const viewSharedUsers = () => {
  const task: Task | null = useContext(TaskContext);

  const [count, setCount] = useState(0);

  const handleRefresh = () => {
    setCount(count + 1);
  };

  if (!task) {
    // Render nothing while navigating to avoid the "setState during render" warning
    return null;
  }

  return (
    <View>
      <RolesTable key={count} item={task} />
      <View style={styles.inviteSection}>
        <View style={styles.inputSection}>
          <InviteUserUI item={task} handleRefresh={handleRefresh} />
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
