import {
  StyleSheet,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useCallback, useContext, useState } from "react";
import { Text, useTheme, TextInput, Button } from "react-native-paper";
import {
  getUserDataFromEmail,
  registerAccount,
  updateUserHabitList,
} from "@/api/db_ops";
import { router, useFocusEffect } from "expo-router";
import { AuthContext } from "@/contexts/authContext";
import OutlineModal from "@/components/OutlineModal";
import { isAnonymous } from "@/constants/constants";
import { retrieveLocalHabitList } from "@/api/storage";
import Habit from "@/api/habit";

const register = () => {
  // This is here such that the "sync local storage to new account" modal never initially displays
  useFocusEffect(
    useCallback(() => {
      setShowingLocalStorageSyncModal(false);
    }, [])
  );

  const theme = useTheme();
  const [emailTxt, setEmailTxt] = useState("");
  const { email, setEmail } = useContext(AuthContext);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showingLocalStorageSyncModal, setShowingLocalStorageSyncModal] =
    useState(false);

  const handleRegister = async () => {
    const validEmail = emailTxt.length > 0;
    const validPassword =
      password.length > 0 && password.localeCompare(confirmPassword) === 0;

    if (validEmail && validPassword) {
      const res = await registerAccount(emailTxt, password);
      if (res.error) {
        alert(res.message);
      } else {
        setEmail(emailTxt);
        setShowingLocalStorageSyncModal(true);
      }
    }
  };

  const navigateHomeScreen = async (syncData: boolean) => {
    if (syncData) {
      const localHabitList = await retrieveLocalHabitList();
      const remoteUserData = await getUserDataFromEmail(email);
      const remoteHabitList = Array.isArray(remoteUserData["habitList"])
        ? remoteUserData["habitList"]
        : JSON.parse(remoteUserData["habitList"]);

      let response;
      if (Array.isArray(remoteHabitList)) {
        if (remoteHabitList.length > 0) {
          const mergedHabitList = Habit.mergeHabitLists(
            remoteHabitList,
            localHabitList
          );
          // set remote habit list to mergedHabitList
          response = await updateUserHabitList(email, mergedHabitList);
        } else {
          response = await updateUserHabitList(email, localHabitList);
        }
      } else {
        alert("Remote Habit List is not an array");
      }

      if (response && response.error) {
        alert("error " + response.error + "message " + response.message);
      } else {
        alert("Habit lists have been merged successfully");
      }
    }

    router.replace("/(tabs)");
  };

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
          <View>
            <Text variant="headlineSmall" style={styles.rowElt}>
              Create An Account
            </Text>
            <TextInput
              value={emailTxt}
              onChangeText={setEmailTxt}
              style={styles.rowElt}
              placeholder="email"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.rowElt}
              placeholder="password"
              secureTextEntry
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.rowElt}
              placeholder="confirm password"
              secureTextEntry
            />
            <Button
              style={styles.rowElt}
              mode="contained"
              onPress={handleRegister}
            >
              Create Account
            </Button>
          </View>
          <OutlineModal showing={showingLocalStorageSyncModal}>
            <View style={{ padding: 10, flexDirection: "column" }}>
              <Text>
                Email Successfully Registered:
                <Text style={{ fontWeight: "bold" }}>{email}</Text>
              </Text>
              <Text style={{ marginLeft: 4 }}>
                Would you like to sync the locally stored habits/tasks to the
                new account?
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "center" }}>
                <Button
                  onPress={() => {
                    navigateHomeScreen(true);
                  }}
                >
                  Yes
                </Button>
                <Button
                  onPress={() => {
                    navigateHomeScreen(false);
                  }}
                >
                  No
                </Button>
              </View>
            </View>
          </OutlineModal>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default register;

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

  rowElt: {
    marginVertical: 8,
  },
});
