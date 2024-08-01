import { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import HabitItem from "@/components/HabitItem";
import { useState, useEffect, useContext } from "react";
import { Button, Text, useTheme } from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import Habit from "@/api/habit";
import {
  removeData,
  retrieveData,
  retrieveLocalHabitList,
} from "@/api/storage";
import { getSignedInUser, getUserDataFromEmail } from "@/api/db_ops";
import { AuthContext } from "@/contexts/authContext";
import { isAnonymous } from "@/constants/constants";

export default function TabOneScreen() {
  const theme = useTheme();
  const [habits, setHabits] = useState<any[]>([]);
  const { email, setEmail } = useContext(AuthContext);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (!isAnonymous(email)) {
          const userData = await getUserDataFromEmail(email);
          const habitList = Array.isArray(userData["habitList"])
            ? userData["habitList"]
            : JSON.parse(userData["habitList"]);
          setHabits(habitList);
        } else {
          const habitData = await retrieveLocalHabitList();
          if (habitData !== null) {
            try {
              setHabits(habitData);
            } catch (err) {
              alert("Error parsing " + JSON.stringify(habitData));
            }
          }
        }
      };
      fetchData();
    }, [email])
  );

  function handleAddHabit() {
    router.push("/addHabit");
  }

  return (
    <View
      style={{
        ...styles.pageContainer,
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={styles.contentContainer}>
        <Text>Signed in as: {email}</Text>
        <ScrollView style={styles.itemListContainer}>
          {habits.length === 0 && (
            <Text style={{ textAlign: "center", marginTop: 10, color: "grey" }}>
              No Habits Created
            </Text>
          )}
          {habits.map((habit: string, index: number) => {
            const habitObject = Habit.parseHabit(habit);
            return (
              <HabitItem
                key={index}
                name={habitObject.getName()}
                dailyCount={habitObject.getTodayCount()}
                totalCount={habitObject.getCountPastXDays(7, "total")}
              />
            );
          })}
        </ScrollView>
        <View style={styles.addButton}>
          <Button
            mode="contained"
            onPress={handleAddHabit}
            style={{ width: "75%" }}
          >
            Create Habit
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flex: 1,
  },

  contentContainer: {
    width: 350,
  },

  itemListContainer: {
    flex: 1,
  },

  addButton: {
    height: 75,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
});
