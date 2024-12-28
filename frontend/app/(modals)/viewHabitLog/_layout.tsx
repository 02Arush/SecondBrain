import { StyleSheet, View } from "react-native";
import React, { useState, useCallback, useContext } from "react";
import { Slot, router } from "expo-router";
import { useRouteInfo } from "expo-router/build/hooks";
import { Text, IconButton, Icon, useTheme } from "react-native-paper";
import { useFocusEffect } from "expo-router";
import Habit from "@/api/habit";
import { AuthContext } from "@/contexts/authContext";
import { isAnonymous } from "@/constants/constants";
import { getUserDataFromEmail } from "@/api/db_ops";
import { retrieveHabitObject } from "@/api/storage";
import { HabitProvider } from "@/contexts/habitContext";

const ViewHabitLogLayout = () => {
  const route = useRouteInfo();
  const habitName = route.params.habitName;
  const { email } = useContext(AuthContext);

  const [habit, setHabit] = useState(new Habit("NULL_HABIT", "NULL_UNIT"));

  useFocusEffect(
    useCallback(() => {
      async function getHabitData() {
        let habitList = null;
        if (!isAnonymous(email)) {
          const userData = await getUserDataFromEmail(email);
          habitList = Array.isArray(userData["habitList"])
            ? userData["habitList"]
            : JSON.parse(userData["habitList"]);
        }

        const currHabit = await retrieveHabitObject(habitName, habitList);
        if (currHabit instanceof Habit) {
          setHabit(currHabit);
        } else {
          alert(currHabit.error);
        }
      }
      getHabitData();
    }, [email])
  );

  const handleNavigateToEditHabit = () => {
    router.replace({
      pathname: "/(modals)/viewHabitLog/editHabit",
      params: {
        habitName: habitName,
      },
    });
  };

  const handleNavigateToChart = () => {
    router.replace({
      pathname: "/(modals)/viewHabitLog/barCharts",
      params: {
        habitName: habitName,
      },
    });
  };

  const handleNavigateToAverages = () => {
    router.replace({
      pathname: "/(modals)/viewHabitLog/averages",
      params: {
        habitName: habitName,
      },
    });
  };

  const theme = useTheme();

  return (
    <HabitProvider initialHabit={habit}>
      <View style={styles.pageContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.heading}>
            <View style={styles.habitInfo}>
              <Text>
                {habitName}
                <Text style={{ color: "grey" }}> ({habit.getUnit()})</Text>
              </Text>
              <Text>Goal: {habit.getGoal()?.toString() || "Not set"}</Text>
            </View>
            <View style={styles.habitNavigation}>
              <IconButton icon="pencil" onPress={handleNavigateToEditHabit} />
              <IconButton
                icon="timetable"
                onPress={handleNavigateToAverages}
                iconColor={
                  route.pathname.localeCompare("/viewHabitLog/averages") === 0
                    ? theme.colors.tertiary
                    : "grey"
                }
              ></IconButton>
              <IconButton
                icon="chart-bar"
                onPress={handleNavigateToChart}
                iconColor={
                  route.pathname.localeCompare("/viewHabitLog/barCharts") === 0
                    ? theme.colors.tertiary
                    : "grey"
                }
              />
            </View>
          </View>
          <View style={styles.slotContainer}>
            <Slot />
          </View>
        </View>
      </View>
    </HabitProvider>
  );
};

export default ViewHabitLogLayout;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    // borderWidth: 1,
    // borderColor: "red",
    padding: 8,
  },
  contentContainer: {
    // FOR PROD
    // minWidth: 350,
    // maxWidth: 700,
    // width: "100%",

    // FOR TESTING ON SMALL SCREENS ONLY
    width: 350,

    // borderWidth: 1,
    justifyContent: "flex-start",
    // alignItems: "center",
    // borderColor: "purple",
    // flex: 1,
    minHeight: "70%",

    // WORK IN PROGRESS: BOX SIZINGF
    // height: 75
  },

  heading: {
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    // borderWidth: 1,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "grey",

    // borderColor: "green",
  },

  habitInfo: {},

  habitNavigation: {
    flexDirection: "row",
  },

  slotContainer: {
    width: "100%",
    flex: 1,
    // borderWidth: 1,
    // borderColor: "red",
  },
});
