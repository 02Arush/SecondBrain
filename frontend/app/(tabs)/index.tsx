import { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import HabitItem from "@/components/HabitItem";
import { useState, useEffect, useContext } from "react";
import { Button, Text, useTheme, ActivityIndicator } from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import Habit from "@/api/habit";
import { getSyncedDailyCheckin, retrieveLocalHabitList } from "@/api/storage";
import { getUserDataFromEmail } from "@/api/db_ops";
import { retrieveHabitList as retrieveHabitListCloud } from "@/api/cloud_ops/habits";
import { AuthContext } from "@/contexts/authContext";
import { isAnonymous } from "@/constants/constants";

export default function TabOneScreen() {
  const theme = useTheme();
  const [habits, setHabits] = useState<any[]>([]);
  const { email } = useContext(AuthContext);
  const [cloudUserData, setCloudUserData] = useState<any>({});
  const [dailyCheckinHabit, setDailyCheckinHabit] = useState<Habit>(
    new Habit("Daily Check-In")
  );
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {

        setLoading(true);

        if (!isAnonymous(email)) {


          const userData = await getUserDataFromEmail(email);
          const cloudHabitData = await retrieveHabitListCloud(email);
          const data = cloudHabitData.data || [];
          setCloudUserData(userData);
          setHabits(data);
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

        // Finally: Here, get the Daily-Checkin-Data
        const ret = await getSyncedDailyCheckin(email);
        const dailyCheckinHabit = ret.data;
        setDailyCheckinHabit(dailyCheckinHabit);

        setLoading(false);
      };
      fetchData();
    }, [email])
  );

  function handleAddHabit() {
    router.push("/(modals)/addHabit");
  }


  return (
    <View
      style={{
        ...styles.pageContainer,
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={styles.contentContainer}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {loading ? (
            <Text>Loading User Data...</Text>
          ) : (
            <Text>
              Signed in As:&nbsp;
              {!isAnonymous(email) ? cloudUserData?.nickname || email : email}
            </Text>
          )}
        </View>
        <ScrollView style={styles.itemListContainer}>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <>
              {habits.length === 0 && (
                <Text
                  style={{ textAlign: "center", marginTop: 10, color: "grey" }}
                >
                  No Habits Created
                </Text>
              )}
              <HabitItem habit={dailyCheckinHabit} />
              {habits.map((habitString: string, index: number) => {
                const habit = Habit.parseHabit(habitString);
                return <HabitItem key={index} habit={habit} />;
              })}
            </>
          )}
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
