import { StyleSheet, View, KeyboardAvoidingView, Platform } from "react-native";
import React from "react";
import { CustomSurface as Surface } from "@/components/CustomSurface";

const OutlineModal = ({ children, showing = true }) => {
  return (
    <>
      {showing && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          style={styles.container}
        >
          <Surface style={styles.innerContainer}>{children}</Surface>
        </KeyboardAvoidingView>
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
    backgroundColor: "red",
  },
});
