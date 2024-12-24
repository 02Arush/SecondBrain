import React, { useState } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";

import { useTheme, Text, Surface, Button } from "react-native-paper";
import { DataPoint } from "@/api/types_and_utils";
import OutlineModal from "./OutlineModal";
// Type definition for data points

interface ScatterplotProps {
  data: DataPoint[];
  width?: number; // Optional custom width
  height?: number; // Optional custom height
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const Scatterplot: React.FC<ScatterplotProps> = ({
  data,
  width,
  height,

  xAxisLabel = "X-Axis",
  yAxisLabel = "Y-Axis",
}) => {
  const theme = useTheme();
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const [showingModal, setShowingModal] = useState(false);
  const [modalText, setModalText] = useState<String>();
  const [modalContent, setModalContent] = useState<React.ReactElement>(<></>);

  // Default dimensions (fallback to screen size if not provided)
  const PLOT_WIDTH = width ?? screenWidth * 0.9; // 90% of screen width
  const PLOT_HEIGHT = height ?? screenHeight * 0.5; // 50% of screen height
  const PADDING = 40; // Increased padding to accommodate labels

  // Data boundaries for scaling
  const xMax = Math.max(...data.map((d) => d.x));
  const yMax = Math.max(...data.map((d) => d.y));
  const xMin = 0;
  const yMin = 0;

  // Create grid lines
  const NUM_X_GRID_LINES = 5;
  const NUM_Y_GRID_LINES = 5;

  // Helper function to normalize data points
  const normalize = (
    value: number,
    min: number,
    max: number,
    size: number
  ): number => {
    const normalizedValue =
      PADDING + ((value - min) / (max - min)) * (size - 2 * PADDING);
    console.log(
      `Normalizing value ${value}: min=${min}, max=${max}, size=${size}, result=${normalizedValue}`
    );
    return normalizedValue;
  };

  const handlePointPress = (points: string[]) => {
    let newModalText = "";

    points.forEach((point) => {
      const pointObj = JSON.parse(point);
      const pointData = pointObj.data;
      const id = pointObj.id;
      const importance = pointObj.data.importance;
      const deadline = new Date(pointObj.data.deadline).toLocaleDateString();
      newModalText += `Name: ${id}\nImportance: ${importance}\nDeadline: ${deadline}\n---\n`;

      // newModalText += `${}\n`;
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

  return (
    <>
      <View style={{ ...styles.container, backgroundColor: "None" }}>
        <Surface
          style={[
            styles.plot,
            {
              width: PLOT_WIDTH,
              height: PLOT_HEIGHT,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceVariant,
            },
          ]}
        >
          {/* Vertical Grid Lines */}
          {[...Array(NUM_X_GRID_LINES + 1)].map((_, index) => {
            const xPosition = normalize(
              xMin + (index * (xMax - xMin)) / NUM_X_GRID_LINES,
              xMin,
              xMax,
              PLOT_WIDTH
            );
            return (
              <View
                key={`v-grid-${index}`}
                style={[
                  styles.verticalGridLine,
                  {
                    left: xPosition,
                    height: PLOT_HEIGHT - 2 * PADDING,
                    top: PADDING,
                    backgroundColor: theme.colors.surfaceVariant,
                  },
                ]}
              />
            );
          })}

          {/* Horizontal Grid Lines */}
          {[...Array(NUM_Y_GRID_LINES + 1)].map((_, index) => {
            const yPosition =
              PADDING +
              ((PLOT_HEIGHT - 2 * PADDING) * index) / NUM_Y_GRID_LINES;
            return (
              <View
                key={`h-grid-${index}`}
                style={[
                  styles.horizontalGridLine,
                  {
                    top: yPosition,
                    width: PLOT_WIDTH - 2 * PADDING,
                    left: PADDING,
                    backgroundColor: theme.colors.surfaceVariant,
                  },
                ]}
              />
            );
          })}

          {/* X-Axis Min Value Label */}
          <Text
            style={[
              styles.axisValue,
              {
                left: PADDING + 12,
                top: 12,
                color: theme.colors.onSurface,
              },
            ]}
          >
            High
            {/* {xMin} */}
          </Text>

          {/* X-Axis Max Value Label */}
          <Text
            style={[
              styles.axisValue,
              {
                right: PADDING + 12,
                top: 12,
                color: theme.colors.onSurface,
              },
            ]}
          >
            Low{/* {xMax} */}
          </Text>

          {/* Y-Axis Min Value Label */}
          <Text
            style={[
              styles.axisValue,
              {
                left: 12,
                bottom: PADDING + 12,
                color: theme.colors.onSurface,
              },
            ]}
          >
            Low
            {/* {yMin} */}
          </Text>

          {/* Y-Axis Max Value Label */}
          <Text
            style={[
              styles.axisValue,
              {
                left: 8,
                top: PADDING + 12,
                color: theme.colors.onSurface,
              },
            ]}
          >
            High
            {/* {yMax} */}
          </Text>

          {/* X-Axis Label */}
          <Text
            style={[
              styles.axisLabel,
              {
                position: "absolute",
                top: 12,
                alignSelf: "center",
                color: theme.colors.onSurface,
              },
            ]}
          >
            {xAxisLabel}
          </Text>

          {/* Y-Axis Label */}
          <Text
            style={[
              styles.axisLabel,
              {
                position: "absolute",
                left: -12,
                top: PLOT_HEIGHT / 2,
                transform: [{ rotate: "-90deg" }],
                color: theme.colors.onSurface,
              },
            ]}
          >
            {yAxisLabel}
          </Text>

          {/* Render data points */}
          {Object.entries(groupedPoints).map(([key, ids], index) => {
            const [xCoord, yCoord] = key.split(",").map(Number);

            // Calculate x position relative to the plot area
            const x = normalize(xCoord, xMin, xMax, PLOT_WIDTH - PADDING); // Subtract PADDING to account for right margin
            const y = PLOT_HEIGHT - normalize(yCoord, yMin, yMax, PLOT_HEIGHT);
            const numIDS = ids.length;

            console.log(
              `Point ${index}: original x=${xCoord}, normalized x=${x}`
            );

            return (
              <Pressable
                key={index}
                style={[
                  styles.point,
                  {
                    position: "absolute",
                    top: y,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => handlePointPress(ids)}
              >
                <Text
                  style={{
                    textAlign: "center",
                    color: theme.colors.onPrimary,
                    textDecorationLine: "underline",
                  }}
                >
                  {numIDS}
                </Text>
              </Pressable>
            );
          })}
        </Surface>
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
  },
  plot: {
    position: "relative",
    borderWidth: 1,
    borderRadius: 5,
    overflow: "visible",
  },
  verticalGridLine: {
    position: "absolute",
    width: 1,
    backgroundColor: "#E0E0E0",
  },
  horizontalGridLine: {
    position: "absolute",
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  point: {
    display: "flex",
    justifyContent: "center",
    alignContent: "center",
    padding: 0,
    marginLeft: 45,
    width: 20,
    height: 20,
    borderRadius: 20, // Makes it a circle
  },
  axisLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  axisValue: {
    position: "absolute",
    fontSize: 12,
  },

  modal: {
    padding: 4,
  },
});

export default Scatterplot;
