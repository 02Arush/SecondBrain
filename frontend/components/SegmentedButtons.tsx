import { StyleSheet, View } from "react-native";
import React from "react";
import { Button, IconButton, Text } from "react-native-paper";

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

const handleSetSegment = (item: string) => {};

const SegmentedButtons = ({
  segments,
  selectedSegment,
  setSelectedSegment,
}: propTypes) => {
  return (
    <View style={styles.container}>
      {segments.map((segment: SegmentButton, index) => {
        const isLeft = index === 0;
        const isRight = index === segments.length - 1;
        const isSelected = selectedSegment === segment.value;
        let borderRadiusLeft = 0;
        let borderRadiusRight = 0;
        if (isLeft) {
          borderRadiusLeft = 4;
        }

        if (isRight) {
          borderRadiusRight = 4;
        }

        const Parent = segment.icon ? IconButton : Button;

        return (
          <Parent
            style={{
              borderWidth: 1,
              borderRadius: 0,
              borderTopLeftRadius: borderRadiusLeft,
              borderBottomLeftRadius: borderRadiusLeft,
              borderTopRightRadius: borderRadiusRight,
              borderBottomRightRadius: borderRadiusRight,
              margin: 0,
              padding: 0,
            }}
            mode={isSelected ? "contained" : "outlined"}
            contentStyle={{ margin: 0, padding: 0 }}
            key={index}
            size={12}
            icon={segment.icon ? segment.icon : ""}
            onPress={() => {
              setSelectedSegment(segment.value);
            }}
          >
            {segment.label && !segment.icon ? segment.label : segment.value}
          </Parent>
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
});
