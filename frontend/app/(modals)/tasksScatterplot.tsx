import {
  StyleSheet,
  View,
  SafeAreaView,
} from "react-native";
import React, { useCallback, useContext, useState, useEffect } from "react";
import { Text, useTheme, DataTable } from "react-native-paper";
import { useFocusEffect } from "expo-router";
import {
  DataPoint,
  getEarliestAndLatestDeadline,
  getRelativeUrgencyOfDate,
} from "@/api/types_and_utils";
import { AuthContext } from "@/contexts/authContext";
import { retrieveTasks } from "@/api/taskStorage";
import Task from "@/api/models/task";
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

          const { earliest, latest } = getEarliestAndLatestDeadline(tasks);

          const newDataPoints: DataPoint[] = tasks.map((task: Task) => {
            const importance = task.getImportance(); // Always between 0 and 10
            const deadline = task.getDeadline(); // Assume task.getDeadline() returns a string or Date
            const relativeUrgency = getRelativeUrgencyOfDate(
              task.getDeadline(),
              earliest,
              latest
            );

            const point: DataPoint = {
              id: task.getName(),
              y: 10 - importance,
              x: relativeUrgency,
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
            xAxisLabel="Relative Urgency"
            yAxisLabel="Importance"
          />
        </View>
        <View style={styles.hintContainer}>
          <Text style={{textAlign: "center"}}>
            Press a&nbsp;<Text style={{color: theme.colors.primary}}>point</Text>&nbsp;on the chart to view the tasks at that point.
          </Text>
        </View>
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

  hintContainer: {
    borderWidth: 1,
    flex: 1,
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
  },

  chart: {
    flex: 1,
  },
});
