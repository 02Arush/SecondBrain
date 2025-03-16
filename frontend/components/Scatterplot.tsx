import React, { useState } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import { ensureJSDate } from "@/api/types_and_utils";

import { useTheme, Text, Surface, Button } from "react-native-paper";
import { DataPoint } from "@/api/types_and_utils";
import OutlineModal from "./OutlineModal";
import constants from "@/constants/constants";
// Type definition for data points

interface ScatterplotProps {
  data: DataPoint[];
  size: number; // Optional custom height
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const Scatterplot: React.FC<ScatterplotProps> = ({
  data,
  size,

  xAxisLabel = "X-Axis",
  yAxisLabel = "Y-Axis",
}) => {
  const theme = useTheme();

  const [showingModal, setShowingModal] = useState(false);
  const [modalText, setModalText] = useState<String>();
  const [modalContent, setModalContent] = useState<React.ReactElement>(<></>);

  // Create grid lines
  const NUM_GRID_LINES = 5;

  const handlePointPress = (points: string[]) => {
    let newModalText = "";

    points.forEach((point) => {
      const pointObj = JSON.parse(point);
      const id = pointObj.id;
      const importance = pointObj.data.importance;
      const objDeadline = pointObj.data.deadline != null ? ensureJSDate(pointObj.data.deadline) : null;
      const displayedDeadline = objDeadline ? objDeadline.toDateString() : constants.NO_TASK_DEADLINE
      newModalText += `Name: ${id}\nImportance: ${importance}\nDeadline: ${displayedDeadline}\n---\n`;
    });

    setModalText(newModalText);
    setShowingModal(true);
  };

  // Group IDs by shared coordinates
  const groupedPoints = data.reduce<Record<string, string[]>>((acc, point) => {
    const key = `${point.x},${point.y}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(JSON.stringify(point));
    return acc;
  }, {});

  const percentPerLine = 100 / NUM_GRID_LINES;

  return (
    <>
      <View style={{ ...styles.container, maxHeight: size, minHeight: size, maxWidth: size, minWidth: size }}>
        <View style={styles.xAxisLabelContainer}>
          <Text>High</Text>
          <Text style={styles.xAxisLabel}>{xAxisLabel}</Text>
          <Text>Low</Text>
        </View>
        <View style={styles.yAxisLabelContainer}>
          <Text>0</Text>
          <Text style={styles.yAxisLabel}>{yAxisLabel}</Text>
          <Text>10</Text>
        </View>
        <View style={styles.plotContainer}>
          {/* <View style={styles.verticalLine}></View> */}
          {Array.from({ length: NUM_GRID_LINES }).map((_, idx) => {
            // space
            return (
              <View
                key={idx}
                style={{
                  ...styles.verticalLine,
                  // the 1.43 is a hard coded value
                  left: `${idx * 25}%`,
                }}
              ></View>
            );
          })}
          {Array.from({ length: NUM_GRID_LINES }).map((_, idx) => {
            // space
            return (
              <View
                key={idx}
                style={{
                  ...styles.horizontalLine,
                  top: `${idx * 25}%`,
                }}
              ></View>
            );
          })}

          {Object.entries(groupedPoints).map(([coords, ids], idx: number) => {
            const [x, y] = coords.split(",");

            return (
              <Pressable
                onPress={() => {
                  handlePointPress(ids);
                }}
                style={{
                  ...styles.point,
                  left: `${Number(x) * 10}%`,
                  top: `${Number(y) * 10}%`,
                  backgroundColor: theme.colors.primary,
                }}
                key={idx}
              >
                <Text style={{ color: theme.colors.onPrimary }}>
                  {ids.length}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <OutlineModal showing={showingModal}>
        <View style={styles.modal}>
          <Text>{modalText}</Text>
          <Button
            onPress={() => {
              setShowingModal(false);
            }}
          >
            Close
          </Button>
        </View>
      </OutlineModal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    // borderWidth: 1,
    // borderColor: "yellow",
  },

  plotContainer: {
    // borderWidth: 1,
    // borderColor: "orange",
    width: "80%",
    height: "80%",
  },

  modal: {
    padding: 4,
  },

  verticalLine: {
    position: "absolute",
    height: "100%",
    borderWidth: 1,
    borderColor: "grey",
    width: 1,
    // left: "20%",
  },

  horizontalLine: {
    position: "absolute",
    height: 1,
    borderWidth: 1,
    borderColor: "grey",
    width: "100%",
  },

  point: {
    position: "absolute",
    width: 25,
    height: 25,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  xAxisLabelContainer: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },

  yAxisLabelContainer: {
    position: "absolute",
    left: -130,
    transform: [{ rotate: "-90deg" }],
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },

  xAxisLabel: {
    fontWeight: "bold",
  },

  yAxisLabel: {
    fontWeight: "bold",
  },
});

export default Scatterplot;
