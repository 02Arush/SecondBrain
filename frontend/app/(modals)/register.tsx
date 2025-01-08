import {
  StyleSheet,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useCallback, useContext, useState } from "react";
import { Text, useTheme, TextInput, Button } from "react-native-paper";
import { registerAccount } from "@/api/db_ops";
import { router, useFocusEffect } from "expo-router";
import { AuthContext } from "@/contexts/authContext";
import OutlineModal from "@/components/OutlineModal";
import { isAnonymous } from "@/constants/constants";
import { retrieveLocalHabitList } from "@/api/storage";
import Habit from "@/api/habit";
import { uploadLocalTasks } from "@/api/taskStorage";
import { useEffect } from "react";
import { uploadLocalStorageHabits } from "@/api/storage";
import { isValidEmail } from "@/api/types_and_utils";

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

  // This is here to ensure that the email when uploading tasks is most up to  date
  useEffect(() => {}, [email]);

  const handleRegister = async () => {
    const validEmail = isValidEmail(emailTxt);
    const validPassword =
      password.length > 0 && password.localeCompare(confirmPassword) === 0;

    if (validEmail && validPassword) {
      const res = await registerAccount(emailTxt, password);

      // REGISTERING ACCOUNT NOT SHOWING PROPER ERROR MESSAGES
      if (res.error) {
        alert(res.message);
      } else {
        setEmail(emailTxt);
        setShowingLocalStorageSyncModal(true);
      }
    } else {
      alert("Ensure the email is valid, and both passwords match.");
    }
  };

  const navigateHomeScreen = async (syncData: boolean) => {
    if (syncData) {
      const habitUploadRes = await uploadLocalStorageHabits(email);
      const taskUploadRes = await uploadLocalTasks(email);

      if (habitUploadRes.ok && taskUploadRes.ok) {
      } else {
        const message = `Task Upload Status : ${taskUploadRes.message}\nHabit Upload Status: ${habitUploadRes.message}`;
        alert(message);
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
