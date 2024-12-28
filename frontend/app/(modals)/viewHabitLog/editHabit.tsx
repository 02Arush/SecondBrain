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

  const habit = useContext(HabitContext);
  const { email } = useContext(AuthContext);
  const [changeQty, setChangeQty] = useState("1");
  const [changeType, setChangeType] = useState<"increment" | "decrement">(
    "increment"
  );

  const handleChangeIncrmentType = (type: string) => {
    if (type === "increment" || type === "decrement") {
      setChangeType(type);
    }
  };

  const handleEditChangeQty = (text: string) => {
    const filteredText = filterTextToInteger(text);
    setChangeQty(filteredText.toString());
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

      const response = await updateHabitObject(habit.getJSON(), email);
      if (response.error) {
        alert("Submission response error: " + response.error);
      } else {
        router.back();
      }
    } catch (e) {
      alert("Submission Error " + e);
    }
  };

  const [dateToUpdate, setDateToUpdate] = useState<SimpleDate>(
    getSimpleDateFromDate(new Date())
  );

  const dateIsToday = () => {
    const today = getSimpleDateFromDate(todayDate);
    return isEqualSimpleDate(today, dateToUpdate);
  };

  const shiftDate = (days: number) => {
    const newDate = shiftSimpleDate(dateToUpdate, days);
    setDateToUpdate(newDate);
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
              setDateToUpdate(today);
            }}
          >
            Reset To Today
          </Button>
        </View>
      </View>
      {/* <Text variant="headlineSmall">Log Data</Text> */}

      <View style={styles.row}>
        <Text>Set To: </Text>
        <TextInput
          style={styles.denseInput}
          value={habit.getCountOfDate(dateToUpdate).toString()}
          inputMode="numeric"
          returnKeyType="done"
        />
        <Text>{habit.getUnit()}</Text>
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
      </View>
      <View
        style={{
          ...styles.row,
          justifyContent: "center",
          //   borderTopWidth: 1,
          //   borderTopColor: "grey",
          //   paddingTop: 4,
        }}
      >
        <Button
          style={{
            borderRadius: 6,
          }}
          mode="contained"
          onPress={handleSubmitIncrement}
        >
          Submit
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
