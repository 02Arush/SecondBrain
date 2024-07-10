import { StyleSheet, View } from "react-native";
import React from "react";
import { Surface } from "react-native-paper";

const OutlineModal = ({ children, showing = true }) => {
  return (
    <>
      {showing && (
        <View style={styles.container}>
          <Surface style={{maxWidth: 350}}>{children}</Surface>
        </View>
      )}
    </>
  );
};

export default OutlineModal;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    backgroundColor: "rgba(40, 40, 40, 0.75)",
  },

  innerContainer: {
    width: 350,
    padding: 10,
    backgroundColor: "white", // Ensure background color is set for Surface
  },
});
