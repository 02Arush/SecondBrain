import { StyleSheet, View } from "react-native";
import React from "react";
import { TextInput, Text } from "react-native-paper";
import { filterTextToInteger } from "@/api/types_and_utils";

import { SimpleDate } from "@/api/types_and_utils";

type propTypes = {
  date: SimpleDate;
  setDate: React.Dispatch<React.SetStateAction<SimpleDate>>;
};

const DatePicker = ({ date, setDate }: propTypes) => {
  // FORMAT: MONTH/DAY/YEAR

  // Debating: Day Month Year vs Month Day year
  return (
    <View style={styles.container}>
      <TextInput
        contentStyle={{ padding: 0 }}
        dense
        maxLength={2}
        style={{ ...styles.denseInput, width: "20%" }}
        value={String(date.month)}
        onChangeText={(text) => {
          // update month
          const month = filterTextToInteger(text);
          const newSimpleDate = { ...date, month: month };
          setDate(newSimpleDate);
        }}
      />
      <Text>/</Text>
      <TextInput
        contentStyle={{ padding: 0, textAlign: "center" }}
        dense
        maxLength={2}
        style={{ ...styles.denseInput, width: "20%" }}
        value={String(date.day)}
        onChangeText={(text) => {
          const day = filterTextToInteger(text);
          // update day
          const newSimpleDate: SimpleDate = { ...date, day: day };
          setDate(newSimpleDate);
        }}
      />
      <Text>/</Text>
      <TextInput
        value={String(date.year)}
        contentStyle={{ padding: 0, margin: 0, textAlign: "center" }}
        dense
        maxLength={4}
        style={styles.denseInput}
        onChangeText={(text) => {
          const year = filterTextToInteger(text);
          const newSimpleDate: SimpleDate = { ...date, year: year };
          setDate(newSimpleDate);
        }}
      />
    </View>
  );
};

export default DatePicker;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 310,
  },

  denseInput: {
    marginHorizontal: 4,
    textAlign: "center",
    width: "25%",
    height: 24,
    marginVertical: 4,
    padding: 0,
    margin: 0,
  },
});
