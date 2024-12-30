import { StyleSheet, View, TouchableOpacity } from "react-native";
import React, { useState, useContext, useCallback, useEffect } from "react";
import { useRouteInfo } from "expo-router/build/hooks";
import Habit, { HabitJSON } from "@/api/habit";
import {
  Text,
  IconButton,
  // TextInput,
  Button,
  useTheme,
  Divider,
  TextInput,
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

// Q:
// Why is it that when I navigate from within tabs of ViewHabitLog, the "set qty" is initialized properly,
// But when I navigate from the HabitItem, it is NOT set correctly?
const editHabit = () => {
  const todayDate = new Date();
  const route = useRouteInfo();
  const theme = useTheme();

  //   const habit = useContext(HabitContext);

  const habit = useContext(HabitContext);

  const { email } = useContext(AuthContext);
  const [changeQty, setChangeQty] = useState("1");
  const [hasUnsavedSetChanges, setHasUnsavedSetChanges] = useState(false);

  const [dateToUpdate, setDateToUpdate] = useState<SimpleDate>(
    getSimpleDateFromDate(todayDate)
  );

  const [qtyToSet, setQtyToSet] = useState(
    habit.getCountOfDate(dateToUpdate).toString()
  );

  useEffect(() => {
    // This is here to ensure that whenever I update the date, or update qtyToSet, I allow myself to save unsaved changes

    const isDifferent = habit.getCountOfDate(dateToUpdate) !== Number(qtyToSet);
    setHasUnsavedSetChanges(isDifferent);
  }, [dateToUpdate, qtyToSet]);

  const handleSetDateToUpdate = (newDate: SimpleDate | null) => {
    if (newDate) {
      setDateToUpdate(newDate);
      setQtyToSet(habit.getCountOfDate(newDate).toString());
    }
  };

  // This is here because sometimes a NULL_HABIT is initiially passed, but than it quickly updates, so we want to make sure the text fields update respectively
  useEffect(() => {
    handleEditSetQty(habit.getCountOfDate(dateToUpdate).toString());
  }, [habit]);

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
  };

  const handleResetSetQty = () => {
    const originalSetQty = habit.getCountOfDate(dateToUpdate);
    handleEditSetQty(originalSetQty.toString());
  };

  const handleShiftSetQty = (direction: "increase" | "decrease") => {
    const changeAmount =
      direction === "increase" ? Number(changeQty) : -1 * Number(changeQty);

    const currSetQty = Number(qtyToSet) || 0;
    const newSetQty = currSetQty + changeAmount;
    handleEditSetQty(newSetQty.toString());
  };

  const handleUpdateHabit = async () => {
    const response = await updateHabitObject(habit.getJSON(), email);
    if (response.error) {
      alert("Submission response error: " + response.error);
    } else {
      const newQty = habit.getCountOfDate(dateToUpdate);
      const dateUpdated =
        getDateFromSimpleDate(dateToUpdate)?.toDateString() ||
        "ERR: INVALID DATE";

      setQtyToSet(newQty.toString());
      alert(
        `Habit: ${habit.getName()}, Date: ${dateUpdated}, Quantity Set: ${newQty} ${habit.getUnit()}`
      );

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
        <View style={styles.row}>
          <IconButton
            icon="chevron-left"
            onPress={() => {
              shiftDate(-1);
            }}
          />

          <DatePicker
            date={dateToUpdate}
            setDate={(date: SimpleDate) => {
              setDateToUpdate(date);
            }}
          />

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
      <Divider style={{ marginBottom: 16 }} />
      <View
        style={{
          ...styles.row,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Set to: </Text>
        <TextInput
          // dense
          style={styles.denseInput}
          contentStyle={styles.denseInput}
          value={qtyToSet}
          onChangeText={handleEditSetQty}
          inputMode="numeric"
          returnKeyType="done"
        />
        <Text>&nbsp;{habit.getUnit()}</Text>
      </View>

      <View
        style={{
          ...styles.row,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconButton
          icon="minus"
          onPress={() => {
            handleShiftSetQty("decrease");
          }}
        />
        <TextInput
          inputMode="numeric"
          returnKeyType="done"
          style={styles.denseInput}
          contentStyle={styles.denseInput}
          // dense
          value={changeQty}
          onChangeText={handleEditChangeQty}
        />

        <IconButton
          icon="plus"
          onPress={() => {
            handleShiftSetQty("increase");
          }}
        />
      </View>
      <View style={styles.col}>
        <Button
          mode="contained"
          disabled={!hasUnsavedSetChanges}
          style={{ flex: 1 }}
          // style={{ display: hasUnsavedSetChanges ? "flex" : "none" }}
          onPress={handleSubmitSet}
        >
          Submit Changes
        </Button>
        <Button
          mode="text"
          labelStyle={{ textDecorationLine: "underline" }}
          onPress={handleResetSetQty}
          disabled={!hasUnsavedSetChanges}
        >
          Reset
        </Button>
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
    marginVertical: 4,
  },

  col: {
    flexDirection: "column",
  },

  denseInput: {
    maxHeight: 30,
    maxWidth: 90,
    textAlign: "center",
    margin: 0,
    padding: 0,
  },
});
