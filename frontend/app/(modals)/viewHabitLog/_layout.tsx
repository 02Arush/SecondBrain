import Habit, { HabitGoal } from "@/api/models/habit";
import { sharedUser } from "@/api/models/userTypes";
import { getHabit, updateHabit } from "@/api/storage";
import { isDailyCheckin } from "@/api/types_and_utils";
import { CustomSurface as Surface } from "@/components/CustomSurface";
import OptionalGoal from "@/components/OptionalGoal";
import OutlineModal from "@/components/OutlineModal";
import Select from "@/components/Select";
import { isAnonymous } from "@/constants/constants";
import { AuthContext } from "@/contexts/authContext";
import { HabitProvider } from "@/contexts/habitContext";
import { Slot, router, useFocusEffect } from "expo-router";
import { useLocalSearchParams, useRouteInfo } from "expo-router/build/hooks";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  IconButton,
  Text,
  TextInput,
  useTheme
} from "react-native-paper";

const ViewHabitLogLayout = () => {
  const route = useRouteInfo();
  const { habitID } = useLocalSearchParams<{ habitID: string }>();
  const { email } = useContext(AuthContext);

  const [habit, setHabit] = useState(new Habit("NULL_HABIT", "NULL_UNIT"));
  const [sharedUserSelectOpen, setSharedUserSelectOpen] = useState(false);

  // const [sharedUsers, setSharedUsers] = useState<selectItem[]>([]);
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState(email);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [habitNameTxt, setHabitNameTxt] = useState(habit.getName());
  const [habitUnitTxt, setHabitUnitTxt] = useState(habit.getUnit());
  const [goal, setGoal] = useState(habit.getGoal());
  const [loading, setLoading] = useState(false);

  const getEmails = (users: { [key: string]: sharedUser }) => {
    return Object.keys(users);
  };

  useEffect(() => {
    setHabitNameTxt(habit.getName());
    setHabitUnitTxt(habit.getUnit());
    setSharedUsers(getEmails(habit.getSharedUsers()));
    setGoal(habit.getGoal());
  }, [habit]);

  // This is here to eliminate the glitch where I make updates to the unit, but they don't show up in the goal
  useEffect(() => {
    if (goal != null) {
      const oldGoal = goal;
      const newGoal = HabitGoal.parseJSON(oldGoal.JSON());
      newGoal.setUnit(habitUnitTxt);
      setGoal(newGoal);
    }
  }, [habitUnitTxt]);

  useFocusEffect(
    useCallback(() => {
      async function getHabitData() {
        setLoading(true);

        const res = await getHabit(email, habitID);
        const currHabit = res.data;
        setSelectedUser(email);
        if (currHabit instanceof Habit) {
          setHabit(currHabit);
        } else {
          router.navigate("/");
        }

        setLoading(false);
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
      setHabit(habit);
    }
  };

  const handleCloseEditsModal = async (save: boolean) => {
    if (save) {
      // Get the field data
      const newName = habitNameTxt;
      const newUnit = habitUnitTxt.length > 0 ? habitUnitTxt : "Count";
      const newGoal = goal;

      habit.setUnit(newUnit);
      habit.setGoal(newGoal);
      habit.setName(newName);

      const res = await updateHabit(email, habit, "modify");
      alert(res.message);
    }

    setEditModalOpen(false);
  };

  const theme = useTheme();

  if (loading) {
    return (
      <View style={styles.pageContainer}>
        <View style={styles.contentContainer}>
          <ActivityIndicator size={"large"} />
        </View>
      </View>
    );
  }

  return (
    <HabitProvider initialHabit={habit}>
      <View style={styles.pageContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.heading}>
            {/* Habit Info */}
            <View style={styles.habitInfo}>
              <View style={styles.habitInfoLeft}>
                <Text variant="bodyLarge">
                  {habit.getName()}
                  <Text style={{ color: "grey" }}> ({habit.getUnit()})</Text>
                </Text>
                <Text>Goal: {habit.getGoal()?.toString() || "Not set"}</Text>
                <Text>Age: {habit.getAge()} days</Text>
              </View>
              {!isDailyCheckin(habit) && (
                <View style={styles.habitInfoRight}>
                  <IconButton
                    icon="pencil"
                    onPress={() => setEditModalOpen(true)}
                  />
                </View>
              )}
            </View>
            <View
              style={{
                display:
                  isPath("averages") || isPath("barCharts") ? "flex" : "none",
                ...styles.selectEmailContainer,
              }}
            >
              {/* HERE: ENABLE USERS TO SELECT A USER TO VIEW */}
              {!isAnonymous(email) && !isDailyCheckin(habit) && (
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
              {!isDailyCheckin(habit) && (
                <IconButton
                  iconColor={
                    isPath("editHabit") ? theme.colors.primary : "grey"
                  }
                  icon="clipboard-edit-outline"
                  onPress={handleNavigateToEditHabit}
                />
              )}
              <IconButton
                icon="timetable"
                onPress={handleNavigateToAverages}
                iconColor={isPath("averages") ? theme.colors.primary : "grey"}
              ></IconButton>
              <IconButton
                icon="chart-bar"
                onPress={handleNavigateToChart}
                iconColor={isPath("barCharts") ? theme.colors.primary : "grey"}
              />
              {!isDailyCheckin(habit) && (
                <IconButton
                  icon="account-group-outline"
                  onPress={handleNavigateToSharedUsers}
                  iconColor={
                    isPath("sharedUsers") ? theme.colors.tertiary : "grey"
                  }
                />
              )}
            </View>
          </View>

          <View style={styles.slotContainer}>
            <Slot />
          </View>
        </View>
      </View>
      <OutlineModal showing={editModalOpen}>
        <Surface style={{ padding: 12 }}>
          <TextInput
            label={"Habit Name"}
            value={habitNameTxt}
            onChangeText={setHabitNameTxt}
          />
          <TextInput
            label={"Unit"}
            value={habitUnitTxt}
            onChangeText={setHabitUnitTxt}
          />
          <OptionalGoal goal={goal} setGoal={setGoal} unit={habitUnitTxt} />
          <View style={styles.editModalActions}>
            <Button onPress={() => handleCloseEditsModal(false)}>Cancel</Button>
            <Button
              onPress={() => handleCloseEditsModal(true)}
              mode="contained"
            >
              Save
            </Button>
          </View>
        </Surface>
      </OutlineModal>
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },

  habitInfoLeft: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  habitInfoRight: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
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

  editModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
