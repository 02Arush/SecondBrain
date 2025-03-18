import {
  StyleSheet,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput, useTheme, Surface, Button } from "react-native-paper";
import { useContext, useEffect, useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  attemptLogin,
  deleteAccount,
  getSignedInUser,
  logOut,
} from "@/api/db_ops";
import { AuthContext } from "@/contexts/authContext";
import constants, { isAnonymous } from "@/constants/constants";
import OutlineModal from "@/components/OutlineModal";
import { getFriendsOfUser } from "@/api/cloud_ops/friends";
import Register from "../../components/profile/register";
import Settings from "../../components/profile/settings";

export default function auth() {
  const { email, setEmail } = useContext(AuthContext);
  const theme = useTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      style={{
        ...styles.pageContainer,
        backgroundColor: theme.colors.background,
      }}
    >
      <SafeAreaView>
        <View style={styles.contentContainer}>
          {isAnonymous(email) ? <Register /> : <Settings />}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flexDirection: "column",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  contentContainer: {
    width: 350,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
