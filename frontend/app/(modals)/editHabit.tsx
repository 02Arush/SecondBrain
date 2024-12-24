import { StyleSheet, View, TouchableOpacity } from "react-native";
import React, { useState, useContext, useCallback, useEffect } from "react";
import { useRouteInfo } from "expo-router/build/hooks";
import Habit, { HabitJSON } from "@/api/habit";
import {
  Text,
  IconButton,
  TextInput,
  Button,
  useTheme,
} from "react-native-paper";
import {
  retrieveHabitObject,
  updateHabitObject,
  deleteHabitObject,
} from "@/api/storage";
import { router, useFocusEffect } from "expo-router";
import { isAnonymous } from "@/constants/constants";
import { AuthContext } from "@/contexts/authContext";
import { getUserDataFromEmail } from "@/api/db_ops";
import { CustomSurface as Surface } from "@/components/CustomSurface";
import {
  filterTextToDecimal,
  filterTextToInteger,
  getDateFromSimpleDate,
  getSimpleDateFromDate,
} from "@/api/types_and_utils";
import DatePicker from "@/components/DatePicker";
import { SimpleDate } from "@/api/types_and_utils";
import OptionalGoal from "@/components/OptionalGoal";
import { HabitGoal } from "@/api/habit";
import OutlineModal from "@/components/OutlineModal";
// import { SegmentedButtons } from "react-native-paper";
import SegmentedButtons from "@/components/SegmentedButtons";

const editHabit = () => {
  const route = useRouteInfo();
  const theme = useTheme();
  const habitName: string = route.params.habitName
    .toString()
    .toLocaleUpperCase();
  const [thisHabit, setThisHabit] = useState(
    new Habit("NULL_HABIT", "NULL_UNIT")
  );
  const [changeQty, setChangeQty] = useState("1");
  const [changeType, setChangeType] = useState<"increment" | "decrement">(
    "increment"
  );
  const { email, setEmail } = useContext(AuthContext);
  const todayDate = new Date();
  const [dateToUpdate, setDateToUpdate] = useState<SimpleDate>(
    getSimpleDateFromDate(new Date())
  );
  const [incrementSelected, setIncrementSelected] = useState(true);
  const [showingEditModal, setShowingEditModal] = useState(false);

  const [newHabitName, setNewHabitName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [goal, setGoal] = useState<HabitGoal | null>(thisHabit.getGoal());
  const [newGoal, setNewGoal] = useState<HabitGoal | null>(thisHabit.getGoal());

  useFocusEffect(
    useCallback(() => {
      async function getHabitData() {
        // if anon, use local storage, otherwise:
        // otherwise, use signed in user's data
        if (!isAnonymous(email)) {
          // get the habit unit
          const userData = await getUserDataFromEmail(email);
          const habitList = Array.isArray(userData["habitList"])
            ? userData["habitList"]
            : JSON.parse(userData["habitList"]);

          const habitObject = await retrieveHabitObject(habitName, habitList);
          if (habitObject instanceof Habit) {
            setThisHabit(habitObject);
            setGoal(habitObject.getGoal());
          }
        } else {
          const currHabit = await retrieveHabitObject(habitName);
          if (currHabit instanceof Habit) {
            setThisHabit(currHabit);
            setGoal(currHabit.getGoal());
          } else {
            alert(currHabit.error);
          }
        }
      }
      getHabitData();
    }, [email])
  );

  // useEffect(() => {}, [thisHabit, goal]);

  const handleViewHabitLog = () => {
    router.replace({
      pathname: "/(modals)/viewHabitLog",
      params: {
        habitName: thisHabit.getName(),
      },
    });
  };

  const handleSubmitIncrement = async () => {
    try {
      const changeAmount =
        changeType === "increment" ? Number(changeQty) : -1 * Number(changeQty);

      // First: Check if simple date is valid date
      // console.log("Date to Update: " + JSON.stringify(dateToUpdate));
      const updatedDate = getDateFromSimpleDate(dateToUpdate);
      if (updatedDate) {
        thisHabit.logItem(updatedDate, changeAmount);
      } else {
        alert("Error: Invalid Date. Enter Date in Format: MM/DD/YYYY");
      }

      const response = await updateHabitObject(thisHabit.getJSON(), email);
      if (response.error) {
        alert("Submission response error: " + response.error);
      } else {
        router.back();
      }
    } catch (e) {
      alert("Submission Error " + e);
    }
  };

  const handleDelete = async () => {
    const response = await deleteHabitObject(thisHabit.getJSON(), email);
    if (response.error) {
      alert(response.error);
    } else {
      router.replace("/");
    }
  };

  const handleEditHabitDetails = () => {
    setShowingEditModal(true);
  };

  const handleEditChangeQty = (text: string) => {
    const filteredText = filterTextToInteger(text);
    setChangeQty(filteredText.toString());
  };

  const handleSetIncrement = (increment: boolean) => {
    setIncrementSelected(increment);
  };

  const handleCancel = () => {
    setShowingEditModal(false);
  };

  const handleSubmitChanges = async () => {
    thisHabit.setUnit(newUnit.length > 0 ? newUnit : thisHabit.getUnit());
    thisHabit.setGoal(newGoal);
    const response = await updateHabitObject(thisHabit.getJSON(), email);
    if (response.error) {
      alert(response.error);
    } else {
      // The following setters assist in refreshing the page
      setGoal(newGoal);
      setThisHabit(thisHabit);
      setShowingEditModal(false);
    }
  };

  const handleChangeIncrmentType = (type: string) => {
    if (type === "increment" || type === "decrement") {
      setChangeType(type);
    }
  };

  return (
    <View
      style={{
        ...styles.pageContainer,
        backgroundColor: theme.colors.background,
      }}
    >
      <Surface style={styles.contentContainer}>
        <View
          style={{
            ...styles.row,
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <View>
            <Text variant="bodyLarge">{thisHabit.getName()}</Text>
            <Text>
              <Text style={{ fontWeight: "bold" }}>Goal: </Text>
              {`${goal ? goal : "N/A"}`}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-end",
            }}
          >
            {/* <IconButton icon="pencil" onPress={handleEditHabitDetails} /> */}
            <Button
              style={{ width: 120, borderRadius: 4 }}
              contentStyle={{ height: 30 }}
              mode="outlined"
              icon={"pencil"}
              onPress={handleEditHabitDetails}
            >
              Details
            </Button>
            <Button
              style={{ width: 120, borderRadius: 4 }}
              contentStyle={{ height: 30 }}
              mode="outlined"
              onPress={handleViewHabitLog}
              icon={"chart-box"}
            >
              Stats
            </Button>
          </View>
        </View>
        <View style={styles.row}>
          {/* <IconButton
            icon={
              incrementSelected ? "plus-circle-outline" : "minus-circle-outline"
            }
            onPress={() => handleSetIncrement(!incrementSelected)}
            style={{ margin: 0 }}
          /> */}

          <SegmentedButtons
            segments={[
              { value: "increment", icon: "plus" },
              { value: "decrement", icon: "minus" },
            ]}
            selectedSegment={changeType}
            setSelectedSegment={handleChangeIncrmentType}
          />
          <Text style={{ marginLeft: 12 }}>By </Text>
          <TextInput
            inputMode="numeric"
            returnKeyType="done"
            style={styles.denseInput}
            value={changeQty}
            onChangeText={handleEditChangeQty}
          />
          <Text>{thisHabit.getUnit()}</Text>
        </View>
        <View style={styles.row}>
          <DatePicker date={dateToUpdate} setDate={setDateToUpdate} />
        </View>
        <View style={{ ...styles.row, justifyContent: "flex-end" }}>
          <Button onPress={handleSubmitIncrement}>Submit</Button>
        </View>
      </Surface>

      {/* EDIT HABIT DETAILS MODAL */}
      <OutlineModal showing={showingEditModal}>
        <View style={{ padding: 28 }}>
          <TextInput
            disabled
            placeholder={habitName}
            label={"New Habit Name"}
            value={newHabitName}
            onChangeText={setNewHabitName}
          />
          <TextInput
            placeholder={thisHabit.getUnit()}
            label={"New Habit Unit"}
            value={newUnit}
            onChangeText={setNewUnit}
          />
          <OptionalGoal
            goal={newGoal}
            setGoal={setNewGoal}
            unit={newUnit.length !== 0 ? newUnit : thisHabit.getUnit()}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              mode="text"
              textColor={theme.colors.error}
              onPress={handleDelete}
            >
              Delete
            </Button>
            <View style={{ flexDirection: "row" }}>
              <Button onPress={handleCancel}>Cancel</Button>
              <Button
                style={{ zIndex: 0, position: "relative" }}
                onPress={handleSubmitChanges}
              >
                Submit Changes
              </Button>
            </View>
          </View>
        </View>
      </OutlineModal>
    </View>
  );
};

export default editHabit;
const styles = StyleSheet.create({
  pageContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },

  contentContainer: {
    width: 350,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "column",
  },

  buttonAndLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 200,
  },

  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginVertical: 4,
  },

  select: {
    // borderWidth: 1,
    borderColor: "grey",
    padding: 5,
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
  },

  rowBtnStyle: {
    marginVertical: 4,
    width: "75%",
  },

  denseInput: {
    marginHorizontal: 8,
    textAlign: "center",
    width: "25%",
    height: 24,
    marginVertical: 4,
    padding: 0,
    margin: 0,
  },
});
