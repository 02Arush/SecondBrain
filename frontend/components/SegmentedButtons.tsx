import { StyleSheet, View, Pressable } from "react-native";
import React from "react";
import { Button, IconButton, Text, useTheme } from "react-native-paper";

type SegmentButton = {
  value: string;
  icon?: string;
  label?: string;
};

type propTypes = {
  segments: SegmentButton[];
  selectedSegment: string;
  setSelectedSegment: (item: string) => void;
};

const SegmentedButtons = ({
  segments,
  selectedSegment,
  setSelectedSegment,
}: propTypes) => {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {segments.map((segment: SegmentButton) => {
        const isSelected = segment.value === selectedSegment;

        const segmentColors = {
          backgroundColor: isSelected ? theme.colors.primary : "transparent",
          borderColor: theme.colors.primary,
        };

        return (
          <Pressable
            key={segment.value}
            style={{ ...styles.segmentButton, ...segmentColors }}
            onPress={() => setSelectedSegment(segment.value)}
          >
            <Text
              style={{
                color: isSelected
                  ? theme.colors.onPrimary
                  : theme.colors.onBackground,
              }}
            >
              {segment.label ? segment.label : segment.value}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default SegmentedButtons;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    maxWidth: "100%",
    flexWrap: "wrap",
  },

  segmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
});
