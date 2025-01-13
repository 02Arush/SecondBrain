import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import React, { useState, useContext, useEffect } from "react";
import { TextInput, Button } from "react-native-paper";
import { router } from "expo-router";
import { createHabit, insertHabitLocalStorage } from "../../api/storage";
import { AuthContext } from "@/contexts/authContext";
import { isAnonymous } from "@/constants/constants";
import { HabitGoal, HabitJSON } from "../../api/habit";
import OptionalGoal from "@/components/OptionalGoal";
import Habit from "../../api/habit";
import { timeFrame } from "@/api/types_and_utils";
const addHabit = () => {
  const [habitName, setHabitName] = useState("");
  const [unit, setUnit] = useState("");
  const { email } = useContext(AuthContext);
  const [goal, setGoal] = useState<HabitGoal | null>(
    new HabitGoal(1, unit, 1, "day")
  );


  // This is here to address a specific bug, where if you leave it as "1 per day" and don't touch the goal checkbox, it skips the units
  useEffect(() => {
    const prevGoal = goal;
    if (prevGoal) {
      const goalJSON = prevGoal.JSON();
      const unitUpdatedGoal = new HabitGoal(
        goalJSON.goalNumber,
        unit,
        goalJSON.timeFrameCount,
        goalJSON.timeFrameLabel as timeFrame
      );

      setGoal(unitUpdatedGoal);
    }
  }, [unit]);

  const handleSubmitHabit = async () => {
    const trimmedHabitName = habitName.trim();
    const trimmedUnit = unit.trim();

    if (trimmedHabitName === "" || trimmedUnit === "") {
      alert("Please ensure a valid unit and habit name");
      return;
    }

    const habitJSON = {
      habitName: trimmedHabitName,
      unit: trimmedUnit,
      goal: goal,
    };

    const newHabit = Habit.parseHabit(habitJSON);
    const res = await createHabit(email, newHabit);
    if (res.ok) {
      router.back();
    } else {
      alert(res.message);
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
            inputMode="text"
            onChangeText={(text) => {
              const filteredText = text.replace(/[^a-zA-Z0-9 ]/gi, "");
              setHabitName(filteredText);
            }}
            style={styles.textInput}
            autoCapitalize="characters"
          />
          <TextInput
            label="Unit of Measurement"
            inputMode="text"
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
