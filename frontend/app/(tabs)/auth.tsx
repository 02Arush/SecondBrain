import {
  StyleSheet,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput, useTheme, Surface, Button } from "react-native-paper";
import { useContext, useEffect, useState } from "react";
import { router } from "expo-router";
import {
  attemptLogin,
  deleteAccount,
  getSignedInUser,
  logOut,
} from "@/api/db_ops";
import { AuthContext } from "@/contexts/authContext";
import constants, { isAnonymous } from "@/constants/constants";
import ModalScreen from "../modal";
import OutlineModal from "@/components/OutlineModal";

export default function auth() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const { email, setEmail } = useContext(AuthContext);
  const [showingConfirmPasswordModal, setShowingConfirmPassModal] =
    useState(false);

  const handleLogin = async () => {
    // check if email or password are not null
    if (loginEmail.length === 0 || loginPassword.length === 0) {
      alert("Please ensure email and password input fields are completed");
      return;
    }

    const res = await attemptLogin(loginEmail, loginPassword);
    if (res.error) {
      alert(res.error);
    } else {
      setEmail(res.email);
      router.replace("/");
    }
  };

  const clearForm = () => {
    setLoginEmail("");
    setLoginPassword("");
  };

  const handleLogOut = async () => {
    const res = await logOut();
    if (res && res.error) {
      alert(res.error);
    } else {
      setEmail(constants.ANONYMOUS);
      clearForm();
    }
  };

  const handleRegister = () => {
    router.push("/(modals)/register");
  };

  const handleForgotPassword = () => {
    alert("NOT YET IMPLEMENTED");
  };

  const handleShowConfirmPasswordModal = () => {
    setLoginPassword("");
    setShowingConfirmPassModal(true);
  };

  const handleDeleteAccount = async () => {
    // Show a pop up to confirm the password:
    const res = await deleteAccount(email, loginPassword);
    if (res.error) {
      alert(res.error);
    } else {
      // Fix email context
      setShowingConfirmPassModal(false);
      setEmail(constants.ANONYMOUS);
      clearForm();
      router.replace("/");
    }
  };

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
          {isAnonymous(email) ? (
            <>
              <View
                style={{
                  width: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "column",
                }}
              >
                <View
                  style={{
                    width: "100%",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                  }}
                >
                  <Text variant="headlineLarge">Log In</Text>
                </View>
                <TextInput
                  placeholder="Email"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  style={styles.textInput}
                />
                <TextInput
                  placeholder="Password"
                  secureTextEntry
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  style={styles.textInput}
                />
                <View
                  style={{
                    width: "100%",
                    flexDirection: "row",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button compact mode="text" onPress={handleForgotPassword}>
                    Forgot Password
                  </Button>
                </View>

                <View style={{ marginTop: 20, width: "100%" }}>
                  <Button
                    compact
                    style={{ marginVertical: 4 }}
                    mode="contained"
                    onPress={handleLogin}
                  >
                    Log In
                  </Button>
                  <Button
                    onPress={handleRegister}
                    compact
                    style={{ marginVertical: 4 }}
                    mode="outlined"
                  >
                    Sign Up
                  </Button>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={{ width: "100%", alignItems: "center" }}>
                <Text>Signed in as: {email}</Text>
                <Button onPress={handleLogOut}>Sign Out</Button>
                <Button onPress={handleShowConfirmPasswordModal}>
                  Delete Account
                </Button>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
      {showingConfirmPasswordModal && (
        <>
          <OutlineModal>
            <View style={{ margin: 20 }}>
              <Text>
                Confirm Your Password for {email} to delete your account
              </Text>
              <TextInput
                style={{ marginVertical: 6 }}
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry
              />
              <View style={{ flexDirection: "column", alignItems: "center" }}>
                <Button
                  style={styles.delCancelButtons}
                  mode="contained"
                  onPress={() => {
                    setShowingConfirmPassModal(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  style={styles.delCancelButtons}
                  mode="text"
                  onPress={handleDeleteAccount}
                >
                  Submit
                </Button>
              </View>
            </View>
          </OutlineModal>
        </>
      )}
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

  textInput: {
    marginVertical: 4,
    width: "100%",
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

  delCancelButtons: {
    marginVertical: 6,
    width: "90%",
  },
});
