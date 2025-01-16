import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  processColor,
} from "react-native";
import React, { useCallback, useContext, useState, useEffect } from "react";
import { Text, useTheme } from "react-native-paper";
import { useFocusEffect } from "expo-router";
import { DataPoint, getEarliestAndLatestDeadline } from "@/api/types_and_utils";
import { isAnonymous } from "@/constants/constants";
import { AuthContext } from "@/contexts/authContext";
import { retrieveTasks } from "@/api/taskStorage";
import Task from "@/api/task";
import ScatterPlot from "@/components/Scatterplot";
const tasksScatterplot = () => {
  const { email, setEmail } = useContext(AuthContext);

  const [taskList, setTaskList] = useState<Task[]>([]);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

  useFocusEffect(
    useCallback(() => {

      (async () => {
        const res = await retrieveTasks(email, false);
        const taskList = res.data;

        if (taskList) {
          const tasks = taskList;
          setTaskList(tasks);

          const {earliest, latest} = getEarliestAndLatestDeadline(tasks);


          const newDataPoints: DataPoint[] = tasks.map((task: Task) => {
            const importance = task.getImportance(); // Always between 0 and 10
            const deadline = task.getDeadline(); // Assume task.getDeadline() returns a string or Date
            const currDate = new Date();

            // MORE urgent is CLOSER to ZERO (Because we want it on the LEFT side)
            let urgency: number = 9; // Default urgency if no deadline is provided (Furthest Right)
            if (deadline) {
              const deadlineDate = new Date(deadline); // Ensure the deadline is a Date object
              const daysUntilDeadline: number =
                (deadlineDate.getTime() - currDate.getTime()) /
                (1000 * 60 * 60 * 24); // Calculate days difference

              // Normalize to a 0-10 scale
              urgency = Math.max(0, daysUntilDeadline); // If past deadline, move urgency to zero
              urgency = Math.min(urgency, 8); // If >= 8 days til deadline, move urgency to 8

              // 10 days or more gives it further right on urgency
            }

            // Question: Given a deadline, how do I convert it to "Urgency" on a 1-10 scale?
            // Note: MORE Urgent should be CLOSER to Zero

            const point: DataPoint = {
              id: task.getName(),
              y: 10 - importance,
              x: urgency,
              data: {
                deadline: deadline,
                importance: importance,
              },
            };

            return point;
          });

          setDataPoints(newDataPoints);
        } else {
        }
      })();
    }, [email])
  );

  const theme = useTheme();

  const data: DataPoint[] = [
    { id: "P1", x: 1, y: 3 },
    { id: "P2", x: 2, y: 5 },
    { id: "P3", x: 3, y: 2 },
    { id: "P4", x: 4, y: 6 },
    { id: "P5", x: 5, y: 4 },
  ];

  return (
    <SafeAreaView
      style={{
        backgroundColor: theme.colors.background,
        ...styles.pageContainer,
      }}
    >
      <View style={styles.contentContainer}>
        <View style={styles.scatterContainer}>
          <ScatterPlot
            data={dataPoints}
            size={300}
            xAxisLabel="Urgency"
            yAxisLabel="Importance"
          />
        </View>
        <ScrollView style={styles.legendContainer}>
          <Text>Legend</Text>
          {taskList.map((task, idx) => {
            return (
              <View key={idx}>
                <Text>{task.getName()}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default tasksScatterplot;

const styles = StyleSheet.create({
  pageContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flex: 1,
  },

  contentContainer: {
    width: 350,
    borderWidth: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  },

  scatterContainer: {
    borderWidth: 1,
    flex: 3,
    width: "100%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  legendContainer: {
    borderWidth: 1,
    flex: 1,
    width: "100%",
  },

  chart: {
    flex: 1,
  },
});
