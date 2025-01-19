import { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import HabitItem from "@/components/HabitItem";
import { useState, useEffect, useContext } from "react";
import {
  Button,
  Text,
  useTheme,
  TextInput,
  IconButton,
} from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import Habit from "@/api/habit";
import { getSyncedDailyCheckin, retrieveLocalHabitList } from "@/api/storage";
import {
  getUserDataFromEmail,
  retrieveHabitList as retrieveHabitListCloud,
} from "@/api/db_ops";
import { AuthContext } from "@/contexts/authContext";
import { isAnonymous } from "@/constants/constants";

export default function TabOneScreen() {
  const theme = useTheme();
  const [habits, setHabits] = useState<any[]>([]);
  const { email, setEmail } = useContext(AuthContext);
  const [cloudUserData, setCloudUserData] = useState<any>({});
  const [dailyCheckinHabit, setDailyCheckinHabit] = useState<Habit>(
    new Habit("Daily Check-In")
  );

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (!isAnonymous(email)) {
          const userData = await getUserDataFromEmail(email);
          // const habitList = Array.isArray(userData["habitList"])
          //   ? userData["habitList"]
          //   : JSON.parse(userData["habitList"]);
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
        alert(ret.message);
      };
      fetchData();
     
    }, [email])
  );

  function handleAddHabit() {
    router.push("/(modals)/addHabit");
  }

  const handleNavigateViewInvites = () => {
    router.push("/(modals)/viewInvites");
  };

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
          <Text>
            Signed in As:&nbsp;
            {!isAnonymous(email) ? cloudUserData?.nickname || email : email}
          </Text>
        </View>
        <ScrollView style={styles.itemListContainer}>
          {habits.length === 0 && (
            <Text style={{ textAlign: "center", marginTop: 10, color: "grey" }}>
              No Habits Created
            </Text>
          )}
          <HabitItem habit={dailyCheckinHabit} />
          {habits.map((habitString: string, index: number) => {
            const habit = Habit.parseHabit(habitString);
            return <HabitItem key={index} habit={habit} />;
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
