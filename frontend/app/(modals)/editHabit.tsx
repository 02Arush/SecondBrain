import { StyleSheet, View, TouchableOpacity } from "react-native";
import React, { useState, useContext, useCallback } from "react";
import { useRouteInfo } from "expo-router/build/hooks";
import Habit, { HabitJSON } from "@/api/habit";
import {
  Text,
  IconButton,
  TextInput,
  Surface,
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
import {
  filterTextToDecimal,
  filterTextToInteger,
  getDateFromSimpleDate,
} from "@/api/types_and_utils";
import DatePicker from "@/components/DatePicker";
import { SimpleDate } from "@/api/types_and_utils";

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
  const { email, setEmail } = useContext(AuthContext);
  const todayDate = new Date();
  const [dateToUpdate, setDateToUpdate] = useState<SimpleDate>({
    day: todayDate.getDate(),
    month: todayDate.getMonth() + 1, // The plus 1 is here because getMonth() is 0-indexed (i.e July will output 6, but we want it to be 7)
    year: todayDate.getFullYear(),
  });

  useFocusEffect(
    useCallback(() => {
      async function getHabitData() {
        // if anon, use local storage, otherwise:
        // otherwise, use signed in user's data
        if (!isAnonymous(email)) {
          // get the habit unit
          const userData = await getUserDataFromEmail(email);
          const habitList = JSON.parse(userData["habitList"]);
          const habitObject = await retrieveHabitObject(habitName, habitList);
          if (habitObject instanceof Habit) {
            setThisHabit(habitObject);
          }
        } else {
          const currHabit = await retrieveHabitObject(habitName);
          if (currHabit instanceof Habit) {
            setThisHabit(currHabit);
          } else {
            alert(currHabit.error);
          }
        }
      }
      getHabitData();
    }, [email])
  );

  interface ToggleButtonProps {
    name: string;
    isSelected: boolean;
    onPress: any;
  }
  const ToggleButton = ({ name, isSelected, onPress }: ToggleButtonProps) => {
    return (
      <TouchableOpacity onPress={onPress} style={{ ...styles.select }}>
        <Text
          style={{
            textDecorationLine: isSelected ? "underline" : "none",
          }}
        >
          {name}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleSubmit = async () => {
    try {
      const changeAmount = incrementSelected
        ? Number(changeQty)
        : -1 * Number(changeQty);

      // First: Check if simple date is valid date
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
        router.replace("/");
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

  const handleRenameHabit = () => {
    alert("Not yet enabled");
  };
  const [incrementSelected, setIncrementSelected] = useState(true);
  const handleSetIncrement = (increment: boolean) => {
    setIncrementSelected(increment);
  };

  return (
    <View
      style={{
        ...styles.pageContainer,
        backgroundColor: theme.colors.background,
      }}
    >
      <Surface style={styles.contentContainer}>
        <View style={styles.row}>
          <Text variant="titleLarge">{habitName}</Text>
          <IconButton icon="pencil" onPress={handleRenameHabit} />
        </View>
        <View style={styles.row}>
          <ToggleButton
            name="Increment"
            isSelected={incrementSelected}
            onPress={() => {
              handleSetIncrement(true);
            }}
          />
          <ToggleButton
            name="Decrement"
            isSelected={!incrementSelected}
            onPress={() => {
              handleSetIncrement(false);
            }}
          />
        </View>
        <View style={styles.row}>
          <Text>By </Text>
          <TextInput
            contentStyle={{ padding: 0 }}
            dense
            style={styles.denseInput}
            value={changeQty}
            onChangeText={(text) => {
              const filteredText = filterTextToDecimal(text);
              setChangeQty(String(filteredText));
            }}
          />
          <Text>{thisHabit.getUnit()}</Text>
        </View>
        <View style={styles.row}>
          <DatePicker date={dateToUpdate} setDate={setDateToUpdate} />
        </View>

        <View
          style={{
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button
            style={styles.rowBtnStyle}
            mode="contained"
            onPress={handleSubmit}
          >
            Submit
          </Button>
          <Button
            textColor={theme.colors.error}
            style={styles.rowBtnStyle}
            mode="outlined"
            onPress={handleDelete}
          >
            Delete Habit
          </Button>
        </View>
      </Surface>
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
    paddingVertical: 50,
    borderRadius: 8,
  },

  buttonAndLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 200,
  },

  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 5,
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
