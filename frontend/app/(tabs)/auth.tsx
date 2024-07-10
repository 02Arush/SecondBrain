import { StyleSheet, View } from "react-native";
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
import constants, { isAnonymous } from "@/constants/AuthConstants";
import ModalScreen from "../modal";
import OutlineModal from "@/components/OutlineModal";

export default function auth() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const { email, setEmail } = useContext(AuthContext);
  const [showingConfirmPasswordModal, setShowingConfirmPassModal] =
    useState(false);

  const handleLogin = async () => {
    alert("Attempting login");
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
    <View
      style={{ backgroundColor: theme.colors.background, ...styles.container }}
    >
      {isAnonymous(email) ? (
        <>
          <View>
            <Text variant="headlineSmall">Log In</Text>
            <TextInput
              style={{ marginVertical: 4 }}
              placeholder="email"
              value={loginEmail}
              onChangeText={(text) => setLoginEmail(text)}
            />
            <TextInput
              style={{ marginVertical: 4 }}
              placeholder="password"
              value={loginPassword}
              onChangeText={(text) => setLoginPassword(text)}
              secureTextEntry
            />
            <Button mode="contained" onPress={handleLogin}>
              Log In
            </Button>
            <Button mode="text" onPress={handleRegister}>
              I don't have an account
            </Button>
          </View>
        </>
      ) : (
        <>
          <Text>Signed In as {email}</Text>
          <Button onPress={handleLogOut}>Log Out</Button>
          <Button
            onPress={() => {
              setShowingConfirmPassModal(true);
            }}
          >
            Delete Account
          </Button>
        </>
      )}
      {showingConfirmPasswordModal && (
        <>
          <OutlineModal>
            <View style={{ margin: 20 }}>
              <Text>
                Confirm Your Password for {email} to delete your account
              </Text>
              <TextInput
                style={{marginVertical: 6}}
                value={loginPassword}
                onChangeText={setLoginPassword}
              />
              <View style={{flexDirection: "column", alignItems: "center"}}>
                <Button
                  style={styles.delCancelButtons}
                  mode="contained"
                  onPress={() => {setShowingConfirmPassModal(false)}}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
