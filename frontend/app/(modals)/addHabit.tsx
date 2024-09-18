import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import React, { useState, useCallback, useContext, useEffect} from "react";
import { Surface, TextInput, Text, Button, Checkbox } from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import { updateLocalStorageHabits } from "../../api/storage";
import Habit from "../../api/habit";
import { AuthContext } from "@/contexts/authContext";
import { retrieveLocalHabitList } from "../../api/storage";
import { addHabit as createHabit } from "@/api/db_ops";
import Select from "@/components/Select";
import { stringToTimeFrame, timeFrame } from "@/api/types_and_utils";
import { isAnonymous } from "@/constants/constants";
import { filterTextToInteger } from "@/api/types_and_utils";
import { HabitGoal } from "../../api/habit";
import OptionalGoal from "@/components/OptionalGoal";
const addHabit = () => {
  const [habitName, setHabitName] = useState("");
  const [unit, setUnit] = useState("");
  const { email, setEmail } = useContext(AuthContext);
  const [timeFrameSelectVisible, setTimeFrameSelectVisible] = useState(false);
  const [goalChecked, setGoalChecked] = useState<"checked" | "unchecked">(
    "checked"
  );

  const [goalNumber, setGoalNumber] = useState<number>(1);
  const [goalTimeFrameCount, setGoalTimeFrameCount] = useState<number>(1);
  const [goalTimeFrame, setGoalTimeFrame] = useState<string>("Day");
  const [goal, setGoal] = useState<HabitGoal | null>(
    new HabitGoal(1, unit, 1, "day")
  );

  // If signed in:
  // get signed in user's habit list from firebase
  // append new habit to that list

  const handleSubmitHabit = async () => {
    const trimmedHabitName = habitName.toUpperCase().trim();
    const trimmedUnit = unit.trim();

    if (trimmedHabitName === "" || trimmedUnit === "") {
      alert("Please ensure a valid unit and habit name");
      return;
    }



    if (!isAnonymous(email)) {
      const res = await createHabit(
        email,
        trimmedHabitName,
        trimmedUnit,
        goal
      );
      if (res.success) {
        router.replace("/");
      } else {
        alert("Error: " + res.error + " message: " + res.message);
      }
    } else {
      const res = await updateLocalStorageHabits(trimmedHabitName, trimmedUnit);
      if (res.error) {
        alert(res.error);
      }
    }
  };

  const toggleGoalChecked = () => {
    if (goalChecked === "checked") {
      setGoalChecked("unchecked");
    } else {
      setGoalChecked("checked");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.contentContainer}>
          <TextInput
            label="Habit Name"
            value={habitName}
            onChangeText={(text) => {
              const filteredText = text.replace(/[^a-zA-Z0-9 ]/gi, "");
              setHabitName(filteredText);
            }}
            style={styles.textInput}
            autoCapitalize="characters"
          />
          <TextInput
            label="Unit of Measurement"
            value={unit}
            onChangeText={(text) => {
              const filteredText = text.replace(/[^a-zA-Z0-9 ]/gi, "");
              setUnit(filteredText);
            }}
            style={styles.textInput}
          />
          <OptionalGoal goal={goal} setGoal={setGoal} unit={unit} />
          
          
          <Button
            mode="contained"
            onPress={handleSubmitHabit}
            style={{ marginTop: 8, width: "75%" }}
          >
            Submit
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

export default addHabit;

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    width: 350,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
  },
  textInput: {
    marginVertical: 4,
    width: "100%",
  },

  denseInput: {
    marginHorizontal: 2,
    textAlign: "center",
    height: 24,
  },
});
