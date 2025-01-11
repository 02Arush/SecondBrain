import { StyleSheet, View } from "react-native";
import React, { useState, useEffect } from "react";
import { filterTextToInteger, stringToTimeFrame } from "@/api/types_and_utils";
import {
  TextInput,
  Text,
  Checkbox,
  useTheme,
  IconButton,
} from "react-native-paper";
import Select from "./Select";
import { HabitGoal } from "@/api/habit";

type props = {
  goal: HabitGoal | null;
  setGoal: React.Dispatch<React.SetStateAction<HabitGoal | null>>;
  unit?: string;
  viewStyle?: object;
};

const OptionalGoal = ({ goal, setGoal, unit = "unit", viewStyle }: props) => {
  const [timeFrameSelectVisible, setTimeFrameSelectVisible] = useState(false);
  const [goalChecked, setGoalChecked] = useState<"checked" | "unchecked">(
    "checked"
  );

  const respectedGoal = goal ? goal : new HabitGoal(1, "Units", 1, "day");

  const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>(
    respectedGoal.getTimeFrameLabel()
  );

  const displayedUnit = unit ? unit : respectedGoal.getUnit();

  const handleSelectItem = (item: string) => {
    setSelectedTimeFrame(item);
    setGoal(
      new HabitGoal(
        respectedGoal.getGoalNumber(),
        displayedUnit,
        respectedGoal.getTimeFrameCount(),
        stringToTimeFrame(item) || "day"
      )
    );
  };

  const toggleGoalChecked = () => {
    if (goalChecked === "checked") {
      setGoalChecked("unchecked");
      setGoal(null);
    } else {
      setGoalChecked("checked");
      setGoal(
        new HabitGoal(
          respectedGoal.getGoalNumber(),
          displayedUnit,
          respectedGoal.getTimeFrameCount(),
          respectedGoal.getTimeFrameLabel()
        )
      );
    }
  };

  const theme = useTheme();

  return (
    <>
      <View style={{ ...viewStyle }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <IconButton
            icon={
              goalChecked === "checked"
                ? "checkbox-marked-outline"
                : "checkbox-blank-outline"
            }
            iconColor={theme.colors.primary}
            onPress={toggleGoalChecked}
          />
          <Text variant="bodyLarge" style={{ fontWeight: "bold" }}>
            Set Goal?
          </Text>
        </View>
        {goalChecked.localeCompare("checked") === 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <TextInput
              inputMode="numeric"
              returnKeyType="done"
              value={
                respectedGoal.getGoalNumber()
                  ? respectedGoal.getGoalNumber().toString()
                  : ""
              }
              dense
              style={{ ...styles.denseInput, width: 75 }}
              onChangeText={(text) => {
                const filteredText = filterTextToInteger(text);
                setGoal(
                  new HabitGoal(
                    filteredText,
                    displayedUnit,
                    respectedGoal.getTimeFrameCount(),
                    stringToTimeFrame(selectedTimeFrame) || "day"
                  )
                );
              }}
            />
            <Text style={{ marginLeft: 4 }}>
              {displayedUnit.length === 0 ? "Units" : displayedUnit}
            </Text>
            <Text> per </Text>
            <TextInput
              inputMode="numeric"
              returnKeyType="done"
              dense
              style={{ ...styles.denseInput, width: 75 }}
              value={
                respectedGoal.getTimeFrameCount()
                  ? respectedGoal.getTimeFrameCount().toString()
                  : ""
              }
              onChangeText={(text) => {
                const filteredText = filterTextToInteger(text);
                setGoal(
                  new HabitGoal(
                    respectedGoal.getGoalNumber(),
                    displayedUnit,
                    filteredText,
                    stringToTimeFrame(selectedTimeFrame) || "day"
                  )
                );
              }}
            />
            &nbsp;
            <Select
              visible={timeFrameSelectVisible}
              setVisible={setTimeFrameSelectVisible}
              items={["Day", "Week", "Month", "Year"]}
              selectedItem={selectedTimeFrame.toUpperCase()}
              setSelectedItem={handleSelectItem}
              mode="text"
            />
          </View>
        )}
      </View>
    </>
  );
};

export default OptionalGoal;

const styles = StyleSheet.create({
  denseInput: {
    marginHorizontal: 2,
    textAlign: "center",
    height: 24,
  },
});
