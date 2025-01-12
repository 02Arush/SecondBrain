import { StyleSheet, View } from "react-native";
import React, { useState, useCallback, useContext } from "react";
import { Slot, router } from "expo-router";
import { useLocalSearchParams, useRouteInfo } from "expo-router/build/hooks";
import { Text, IconButton, Icon, useTheme } from "react-native-paper";
import { useFocusEffect } from "expo-router";
import Habit from "@/api/habit";
import { AuthContext } from "@/contexts/authContext";
import { isAnonymous } from "@/constants/constants";
import { getUserDataFromEmail } from "@/api/db_ops";
import { getHabit } from "@/api/storage";
import { HabitProvider } from "@/contexts/habitContext";
import Select from "@/components/Select";
import { sharedUser } from "@/api/types_and_utils";
import { selectItem } from "@/components/Select";
import { email } from "@/api/types_and_utils";

const ViewHabitLogLayout = () => {
  const route = useRouteInfo();
  const { habitID } = useLocalSearchParams<{ habitID: string }>();
  const { email } = useContext(AuthContext);

  const [habit, setHabit] = useState(new Habit("NULL_HABIT", "NULL_UNIT"));
  const [sharedUserSelectOpen, setSharedUserSelectOpen] = useState(false);

  // const [sharedUsers, setSharedUsers] = useState<selectItem[]>([]);
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState(email);
  const [selectedActivityLog, setSelectedActivityLog] = useState({});

  const getEmails = (users: { [key: string]: sharedUser }) => {
    return Object.keys(users);
  };

  useFocusEffect(
    useCallback(() => {
      async function getHabitData() {
        const res = await getHabit(email, habitID);
        const currHabit = res.data;
        setSelectedUser(email);
        if (currHabit instanceof Habit) {
          setHabit(currHabit);
          setSharedUsers(getEmails(currHabit.getSharedUsers()));
        } else {
          router.navigate("/");
        }
      }
      getHabitData();
    }, [email])
  );

  const handleNavigateToEditHabit = async () => {
    const initialHabit = await getHabit(email, habit.getID());
    if (initialHabit.data) {
      setHabit(initialHabit.data);
    } else {
      alert(`Error Obtaining Habit for User: ${email}, try again.`);
      router.navigate("/");
    }

    router.replace({
      pathname: "/(modals)/viewHabitLog/editHabit",
      params: {
        habitID: habitID,
      },
    });
  };

  const matchHabitToSelectedUser = async () => {
    const selectedHabitRes = await getHabit(selectedUser, habit.getID());
    if (selectedHabitRes.data) setHabit(selectedHabitRes.data);
  };

  const handleNavigateToChart = async () => {
    matchHabitToSelectedUser();
    router.replace({
      pathname: "/(modals)/viewHabitLog/barCharts",
      params: {
        habitID: habitID,
      },
    });
  };

  const handleNavigateToAverages = () => {
    matchHabitToSelectedUser();

    router.replace({
      pathname: "/(modals)/viewHabitLog/averages",
      params: {
        habitID: habitID,
      },
    });
  };

  const handleNavigateToSharedUsers = () => {
    if (isAnonymous(email)) {
      alert(
        "Anonymous or offline users can not share their stats! Please log in."
      );
    } else {
      router.replace({
        pathname: "/(modals)/viewHabitLog/sharedUsers",
        params: {
          habitID: habitID,
        },
      });
    }
  };

  const isPath = (path: string) => {
    return route.pathname.localeCompare(`/viewHabitLog/${path}`) === 0;
  };

  const handleSelectUser = async (email: string) => {
    setSelectedUser(email);

    const relativeHabitRes = await getHabit(email, habit.getID());
    if (relativeHabitRes.ok && relativeHabitRes.data) {
      const habit = relativeHabitRes.data;
      const respectiveActivityLog = habit.getActivityLog();
      setSelectedActivityLog(respectiveActivityLog);
      setHabit(habit);
    }
  };

  const theme = useTheme();

  return (
    <HabitProvider initialHabit={habit}>
      <View style={styles.pageContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.heading}>
            <View style={styles.habitInfo}>
              <Text variant="bodyLarge">
                {habit.getName()}
                <Text style={{ color: "grey" }}> ({habit.getUnit()})</Text>
              </Text>
              <Text>Goal: {habit.getGoal()?.toString() || "Not set"}</Text>
            </View>
            <View
              style={{
                display:
                  isPath("averages") || isPath("barCharts") ? "flex" : "none",
                ...styles.selectEmailContainer,
              }}
            >
              {/* HERE: ENABLE USERS TO SELECT A USER TO VIEW */}
              {!isAnonymous(email) && (
                <Select
                  mode="button-box"
                  visible={sharedUserSelectOpen}
                  setVisible={setSharedUserSelectOpen}
                  items={sharedUsers}
                  selectedItem={selectedUser}
                  setSelectedItem={handleSelectUser}
                />
              )}
            </View>
            <View style={styles.habitNavigation}>
              <IconButton
                iconColor={isPath("editHabit") ? theme.colors.tertiary : "grey"}
                icon="clipboard-edit-outline"
                onPress={handleNavigateToEditHabit}
              />
              <IconButton
                icon="timetable"
                onPress={handleNavigateToAverages}
                iconColor={isPath("averages") ? theme.colors.tertiary : "grey"}
              ></IconButton>
              <IconButton
                icon="chart-bar"
                onPress={handleNavigateToChart}
                iconColor={isPath("barCharts") ? theme.colors.tertiary : "grey"}
              />
              <IconButton
                icon="account-group-outline"
                onPress={handleNavigateToSharedUsers}
                iconColor={
                  isPath("sharedUsers") ? theme.colors.tertiary : "grey"
                }
              />
            </View>
            <View style={styles.habitInfo}>
              {/* Left, habit info */}
              <View></View>
              {/* Select, Habit Info */}
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

    padding: 8,
    overflowX: "none",
    overflowY: "scroll",
  },
  contentContainer: {
    // FOR PROD
    width: 350,

    // borderWidth: 1,
    justifyContent: "flex-start",

    minHeight: "70%",
    maxHeight: "95%",
    // WORK IN PROGRESS: BOX SIZINGF
    // height: 75
  },

  heading: {
    width: "100%",
    flexDirection: "column",
    justifyContent: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "grey",
  },

  habitInfo: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 4,
  },

  habitNavigation: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },

  slotContainer: {
    width: "100%",
    flex: 1,
    // borderWidth: 1,
    // borderColor: "red",
  },

  selectEmailContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
});
