import { StyleSheet, View, KeyboardAvoidingView, Platform } from "react-native";
import React from "react";
import { CustomSurface as Surface } from "@/components/CustomSurface";
import { useTheme, Portal } from "react-native-paper";

const OutlineModal = ({ children, showing = true }) => {
  const theme = useTheme();
  return (
    <Portal>
      {showing && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          style={{
            ...styles.container,
            backgroundColor: theme.colors.backdrop,
          }}
        >
          <Surface style={styles.innerContainer}>{children}</Surface>
        </KeyboardAvoidingView>
      )}
    </Portal>
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
  },

  innerContainer: {
    width: 350,
    backgroundColor: "red",
  },
});
