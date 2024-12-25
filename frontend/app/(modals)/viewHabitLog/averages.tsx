import { StyleSheet, View } from "react-native";
import React, { useState, useCallback, useContext } from "react";
import { Text } from "react-native-paper";
import { useFocusEffect } from "expo-router";
import { AuthContext } from "@/contexts/authContext";
import { getUserDataFromEmail } from "@/api/db_ops";
import Habit from "@/api/habit";
import { useRouteInfo } from "expo-router/build/hooks";
import { retrieveHabitObject } from "@/api/storage";

const averages = () => {
  const { email } = useContext(AuthContext);
  const [habit, setHabit] = useState<Habit>();
  const routeInfo = useRouteInfo();
  const habitName = routeInfo.params.habitName;
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      (async () => {
        // Get user data on page focus
        const data = await getUserDataFromEmail(email);
        const habitList = data["habitList"];
        const habit = await retrieveHabitObject(habitName, habitList);

        if (habit instanceof Habit) {
          setHabit(habit);
        } else {
          alert(`ERROR: ${habit.error}`);
        }
      })();

      setLoading(false);
    }, [])
  );

  const createHabitActivityText = (logObject: any, key: number) => {
    return (
      <View key={key} style={{ flexDirection: "row" }}>
        {loading && <Text>LOADING...</Text>}
        <Text>Date: {logObject.date}</Text>

        <Text>&nbsp;Count: {logObject.count}</Text>
      </View>
    );
  };

  return (
    <View>
      <Text>averages</Text>
      {habit?.getSortedActivityLog().map(createHabitActivityText)}
    </View>
  );
};

export default averages;

const styles = StyleSheet.create({});
