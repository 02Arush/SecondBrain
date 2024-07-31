import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Surface } from "react-native-paper";
import { useTheme } from "react-native-paper";

const CustomSurface = ({ style, children }) => {
  const theme = useTheme();
  return (
    <Surface style={{ ...style, backgroundColor: theme.colors.surface }}>
      {children}
    </Surface>
  );
};

export { CustomSurface };

const styles = StyleSheet.create({});
