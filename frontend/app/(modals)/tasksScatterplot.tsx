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
import { isAnonymous } from "@/constants/constants";
import { AuthContext } from "@/contexts/authContext";
import { getTasksForUser } from "@/api/db_ops";
import Task from "@/api/task";
import ScatterPlot from "@/components/Scatterplot";
const tasksScatterplot = () => {
  const { email, setEmail } = useContext(AuthContext);

  const [taskList, setTaskList] = useState<Task[]>([]);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!isAnonymous(email)) {
        (async () => {
          const res = await getTasksForUser(email, false);
          if (res.taskList) {
            const tasks = res.taskList;
            setTaskList(tasks);
            
            

            const newDataPoints: DataPoint[] = tasks.map((task: Task) => {
              const importance = task.getImportance();
              const deadline = task.getDeadline(); // Assume task.getDeadline() returns a string or Date
              const currDate = new Date();

              let urgency: number = 0; // Default urgency if no deadline is provided

              if (deadline) {
                const deadlineDate = new Date(deadline); // Ensure the deadline is a Date object
                const daysUntilDeadline: number =
                  (deadlineDate.getTime() - currDate.getTime()) /
                  (1000 * 60 * 60 * 24); // Calculate days difference

                // Normalize to a 0-10 scale
                urgency = Math.max(0, daysUntilDeadline);
              }

              const point: DataPoint = {
                id: task.getName(),
                y: importance,
                x: urgency,
              };

              return point;
            });

            setDataPoints(newDataPoints);
          } else {
          }
        })();
      }
    }, [email])
  );

  const theme = useTheme();

  interface DataPoint {
    id: string;
    x: number;
    y: number;
  }

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
            width={300}
            height={300}
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
    // borderColor: "red",
    flex: 3,
    width: "100%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  legendContainer: {
    borderWidth: 1,
    // borderColor: "orange",
    flex: 1,
    width: "100%",
  },

  chart: {
    flex: 1,
  },
});
