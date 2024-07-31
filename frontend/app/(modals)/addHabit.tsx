import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import React, { useState, useCallback, useContext } from "react";
import { Surface, TextInput, Button } from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import { storeData, retrieveData } from "./../../api/storage";
import Habit from "./../../api/habit";
import { AuthContext } from "@/contexts/authContext";
import { retrieveLocalHabitList } from "./../../api/storage";
import { addHabit as createHabit } from "@/api/db_ops";

import { isAnonymous } from "@/constants/constants";

const addHabit = () => {
  const [habitName, setHabitName] = useState("");
  const [unit, setUnit] = useState("");
  const { email, setEmail } = useContext(AuthContext);

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
      const res = await createHabit(email, trimmedHabitName, trimmedUnit);
      if (res.success) {
        router.replace("/");
      } else {
        alert("Error: " + res.error);
      }
    } else {
      await updateLocalStorageHabits(trimmedHabitName, trimmedUnit);
    }
  };

  async function updateLocalStorageHabits(habitName: string, unit: string) {
    const habitDataList = await retrieveLocalHabitList();
    const habitExists = Habit.habitExistsInList(habitName, habitDataList);

    if (!habitExists) {
      habitDataList.push(new Habit(habitName, unit).getJSON());
      await storeData("habitList", JSON.stringify(habitDataList));
      router.replace("/");
    } else {
      alert("Habit Already Exists");
    }
  }

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
});
