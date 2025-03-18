import { StyleSheet, View } from "react-native";
import React, {useContext, useState} from "react";
import { Text, Button, TextInput } from "react-native-paper";
import { useTheme } from "react-native-paper";
import { router } from "expo-router";
import { attemptLogin } from "@/api/db_ops";
import { AuthContext } from "@/contexts/authContext";

const Register = () => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const theme = useTheme();
  

  const {email, setEmail} = useContext(AuthContext)
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



  const handleRegister = () => {
    router.push("/(modals)/register");
  };

  const handleForgotPassword = () => {
    alert("NOT YET IMPLEMENTED");
  };

 
  return (
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
        <Button
          buttonColor={theme.colors.primary}
          compact
          mode="text"
          onPress={handleForgotPassword}
        >
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
  );
};

export default Register;

const styles = StyleSheet.create({
  textInput: {
    marginVertical: 4,
    width: "100%",
  },
});
