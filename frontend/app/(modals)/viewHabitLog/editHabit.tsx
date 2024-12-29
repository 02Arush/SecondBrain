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
  isEqualSimpleDate,
  shiftSimpleDate,
} from "@/api/types_and_utils";
import DatePicker from "@/components/DatePicker";
import { SimpleDate } from "@/api/types_and_utils";
import OptionalGoal from "@/components/OptionalGoal";
import { HabitGoal } from "@/api/habit";
import OutlineModal from "@/components/OutlineModal";
// import { SegmentedButtons } from "react-native-paper";
import SegmentedButtons from "@/components/SegmentedButtons";
import { HabitContext } from "@/contexts/habitContext";

const editHabit = () => {
  const todayDate = new Date();
  const route = useRouteInfo();
  const theme = useTheme();
  const habitName: string = route.params.habitName
    .toString()
    .toLocaleUpperCase();

  //   const habit = useContext(HabitContext);

  const habit = useContext(HabitContext);

  const { email } = useContext(AuthContext);
  const [changeQty, setChangeQty] = useState("1");
  const [hasUnsavedSetChanges, setHasUnsavedSetChanges] = useState(false);
  const [hasUnsavedIncChanges, setHasUnsavedIncChanges] = useState(false);

  const [dateToUpdate, setDateToUpdate] = useState<SimpleDate>(
    getSimpleDateFromDate(new Date())
  );
  const [changeType, setChangeType] = useState<"increment" | "decrement">(
    "increment"
  );
  const [qtyToSet, setQtyToSet] = useState(
    habit.getCountOfDate(dateToUpdate).toString()
  );

  useEffect(() => {
    const isDifferent = habit.getCountOfDate(dateToUpdate) !== Number(qtyToSet);

    setHasUnsavedSetChanges(isDifferent);
  }, [dateToUpdate, qtyToSet]);

  const handleChangeIncrmentType = (type: string) => {
    if (type === "increment" || type === "decrement") {
      setChangeType(type);
    }
  };

  const handleSetDateToUpdate = (newDate: SimpleDate | null) => {
    if (newDate) {
      setDateToUpdate(newDate);
      setQtyToSet(habit.getCountOfDate(newDate).toString());
    }
  };

  const handleSubmitSet = async () => {
    const newAmount = Number(qtyToSet);
    const currDate = getDateFromSimpleDate(dateToUpdate);

    if (currDate) {
      habit.updateCountOnDate(currDate.toDateString(), newAmount);
    } else {
      alert("Error updating: Invalid date to increment");
    }

    await handleUpdateHabit();
  };

  const handleEditChangeQty = (text: string) => {
    const filteredText = filterTextToInteger(text);
    setChangeQty(filteredText.toString());
  };

  const handleEditSetQty = (text: string) => {
    setQtyToSet(text);
    setHasUnsavedIncChanges(true);
  };

  const handleSubmitIncrement = async () => {
    try {
      const changeAmount =
        changeType === "increment" ? Number(changeQty) : -1 * Number(changeQty);

      // First: Check if simple date is valid date
      // console.log("Date to Update: " + JSON.stringify(dateToUpdate));
      const updatedDate = getDateFromSimpleDate(dateToUpdate);
      if (updatedDate) {
        habit.logItem(updatedDate, changeAmount);
      } else {
        alert("Error: Invalid Date. Enter Date in Format: MM/DD/YYYY");
      }

      await handleUpdateHabit();
    } catch (e) {
      alert("Submission Error " + e);
    }
  };

  const handleUpdateHabit = async () => {
    const response = await updateHabitObject(habit.getJSON(), email);
    if (response.error) {
      alert("Submission response error: " + response.error);
    } else {
      alert("Updated Successfully");

      const newQty = habit.getCountOfDate(dateToUpdate);
      setQtyToSet(newQty.toString());

      handleSetDateToUpdate(getSimpleDateFromDate(new Date()));
    }
  };

  const dateIsToday = () => {
    const today = getSimpleDateFromDate(todayDate);
    return isEqualSimpleDate(today, dateToUpdate);
  };

  const shiftDate = (days: number) => {
    const newDate = shiftSimpleDate(dateToUpdate, days);
    handleSetDateToUpdate(newDate);
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          width: "100%",
          minHeight: 80,

          justifyContent: "flex-start",
          alignItems: "center",
          //   borderBottomWidth: 1,
          //   borderBottomColor: "grey",
          //   marginBottom: 2,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          {/* <Button
          compact
          style={{ flex: 1 }}
          onPress={() => {
            shiftDate(-1);
          }}
        >
          Prev
        </Button> */}
          <IconButton
            icon="chevron-left"
            onPress={() => {
              shiftDate(-1);
            }}
          />

          <DatePicker date={dateToUpdate} setDate={setDateToUpdate} />

          <IconButton
            icon="chevron-right"
            onPress={() => {
              shiftDate(1);
            }}
          />
        </View>
        <View style={{ ...styles.row, justifyContent: "center" }}>
          <Button
            style={{
              display: dateIsToday() ? "none" : "flex",
              padding: 0,
              margin: 0,
            }}
            compact
            labelStyle={{
              fontSize: 12,
              paddingVertical: 4,
              paddingHorizontal: 8,
              margin: 0,
              textDecorationLine: "underline",
            }}
            mode="text"
            onPress={() => {
              const today = getSimpleDateFromDate(new Date());
              handleSetDateToUpdate(today);
            }}
          >
            Reset To Today
          </Button>
        </View>
      </View>
      {/* <Text variant="headlineSmall">Log Data</Text> */}

      <View style={styles.row}>
        <Text>Set to: </Text>
        <TextInput
          style={styles.denseInput}
          value={qtyToSet}
          onChangeText={handleEditSetQty}
          inputMode="numeric"
          returnKeyType="done"
        />
        <Text>{habit.getUnit()}</Text>
        <Button
          style={{ display: hasUnsavedSetChanges ? "flex" : "none" }}
          onPress={handleSubmitSet}
        >
          Set New Value
        </Button>
      </View>
      <View style={styles.row}>
        <Text>OR</Text>
      </View>
      <View style={{ ...styles.row, marginTop: 6 }}>
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
        <Text>{habit.getUnit()}</Text>
        <Button onPress={handleSubmitIncrement}>Submit Increment</Button>
      </View>
    </View>
  );
};

export default editHabit;

const styles = StyleSheet.create({
  container: {
    // borderWidth: 1,
    // borderColor: "red",
    flexDirection: "column",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },

  col: {
    flexDirection: "column",
  },

  denseInput: {
    marginHorizontal: 8,
    textAlign: "center",
    width: "25%",
    height: 24,
    marginVertical: 0,
    padding: 0,
    margin: 0,
  },
});
