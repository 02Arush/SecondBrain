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

  const [dateToUpdate, setDateToUpdate] = useState<SimpleDate>(
    getSimpleDateFromDate(new Date())
  );

  const dateIsToday = () => {
    const today = getSimpleDateFromDate(todayDate);
    return isEqualSimpleDate(today, dateToUpdate);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Button style={{ flex: 1 }}>"Prev"</Button>
        <View style={{ ...styles.col, flex: 2 }}>
          <DatePicker date={dateToUpdate} setDate={setDateToUpdate} />
          {!dateIsToday() && (
            <Button
              compact
              mode="text"
              onPress={() => {
                const today = getSimpleDateFromDate(new Date());
                setDateToUpdate(today);
              }}
            >
              <Text
                style={{
                  color: theme.colors.primary,
                  textDecorationLine: "underline",
                }}
                variant="bodyMedium"
              >
                Reset to Today
              </Text>
            </Button>
          )}
        </View>
        <Button style={{ flex: 1 }}>"Next"</Button>
      </View>
      <Text>
        {getDateFromSimpleDate(dateToUpdate)?.toDateString()}
        {": "}
        {habit.getCountOfDate(dateToUpdate)}
      </Text>
      <View style={styles.row}>
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
    </View>
  );
};

export default editHabit;

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "red",
    flexDirection: "column",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },

  col: {
    flexDirection: "column",
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
