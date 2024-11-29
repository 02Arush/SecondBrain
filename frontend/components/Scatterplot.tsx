import React from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";

import { useTheme, Text, Surface } from "react-native-paper";

// Type definition for data points
interface DataPoint {
  id: string;
  x: number;
  y: number;
}

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
  ): number => PADDING + ((value - min) / (max - min)) * (size - 2 * PADDING);

  // Group IDs by shared coordinates
  const groupedPoints = data.reduce<Record<string, string[]>>((acc, point) => {
    const key = `${point.x},${point.y}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(point.id);
    return acc;
  }, {});

  // Handle point press
  const handlePointPress = (ids: string[]) => {
    alert(`Points Clicked:\n ${ids.join(", \n")}`);
  };

  return (
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
            PADDING + ((PLOT_HEIGHT - 2 * PADDING) * index) / NUM_Y_GRID_LINES;
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

        {/* Rest of the previous component remains the same */}
        {/* X-Axis Min Value Label */}
        <Text
          style={[
            styles.axisValue,
            {
              left: PADDING+12,
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
              top: PADDING + 12 ,
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
          const x = normalize(xCoord, xMin, xMax, PLOT_WIDTH);
          const y = PLOT_HEIGHT - normalize(yCoord, yMin, yMax, PLOT_HEIGHT); // Invert y-axis

          return (
            <Pressable
              key={index}
              style={[
                styles.point,
                {
                  left: x - 5,
                  top: y - 5,
                  backgroundColor: theme.colors.primary,
                }, // Adjust for circle radius
              ]}
              onPress={() => handlePointPress(ids)}
            />
          );
        })}
      </Surface>
    </View>
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
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 16, // Makes it a circle
  },
  axisLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  axisValue: {
    position: "absolute",
    fontSize: 12,
  },
});

export default Scatterplot;
