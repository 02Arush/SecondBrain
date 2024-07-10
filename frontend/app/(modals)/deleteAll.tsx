import { StyleSheet, View } from "react-native";
import React from "react";
import { Text, Button, useTheme } from "react-native-paper";
import { router } from "expo-router";
import { removeData } from "@/api/storage";

const deleteAll = () => {
  const theme = useTheme();
  return (
    <View style={{...styles.pageContainer, backgroundColor: theme.colors.background}}>
      <View style={styles.innerContainer}>
        <Text variant="titleMedium" style={{ textAlign: "center" }}>
          Are you sure you want to delete all habits? They can not be recovered.
        </Text>
        <View style={styles.buttons}>
          <Button
            style={styles.button}
            mode="contained"
            onPressOut={() => {
              router.navigate("/");
            }}
          >
            Cancel
          </Button>
          <Button
            mode="outlined"
            textColor={theme.colors.error}
            style={styles.button}
            onPressOut={() => {
              removeData("habitList");
              router.replace("/");
            }}
          >
            Delete All
          </Button>
        </View>
      </View>
    </View>
  );
};

export default deleteAll;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  innerContainer: {
    width: 300,
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    flexDirection: "column",
  },

  buttons: {
    flexDirection: "row",
  },

  button: {
    margin: 10,
  },
});
