import { deleteAccount, getUserData, logOut } from "@/api/db_ops";
import OutlineModal from "@/components/OutlineModal";
import { constants } from "@/constants/constants";
import { AuthContext } from "@/contexts/authContext";
import { router, useFocusEffect } from "expo-router";
import React, {
  ReactNode,
  useCallback,
  useContext,
  useState
} from "react";
import {
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

import { getNicknameFromEmail } from "@/api/types_and_utils";
import { IconButton } from "react-native-paper";
import { CustomSurface } from "../CustomSurface";

const Settings = () => {
  const { email, setEmail } = useContext(AuthContext);
  const [showingConfirmPasswordModal, setShowingConfirmPassModal] =
    useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUserInformation = async () => {
    setLoading(true);
    const res = await getUserData(email);
    if (res.data) {
      const retrievedNickname = res.data["nickname"]
        ? res.data["nickname"]
        : getNicknameFromEmail(email);
      setNickname(retrievedNickname);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserInformation();
    }, [])
  );

  const clearForm = () => {
    setLoginPassword("");
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

  const handleShowConfirmPasswordModal = () => {
    setLoginPassword("");
    setShowingConfirmPassModal(true);
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

  type RowPropTypes = {
    label: string;
    data?: string;
    IconButton?: ReactNode;
  };
  const Row = ({ label, data = "", IconButton }: RowPropTypes) => {
    const hasIcon: boolean = IconButton !== undefined; // && onPress;
    return (
      <CustomSurface
        style={{
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          height: 40,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ flex: 5, flexDirection: "row" }}>
          <Text>{label} </Text>
          <Text>{data}</Text>
        </View>
        {hasIcon && IconButton}
      </CustomSurface>
    );
  };

  const handleEditNickname = () => {
    alert("Not Implemented");
  };

  const handleSignOut = () => {
    setEmail(constants.ANONYMOUS);
    logOut();
  };

  const handleViewFriendsList = () => {
    router.push("/(modals)/friends")
  };

  const handleChangePassword = () => {
    alert("Not implemented");
  };

  const handleManageSubscription = () => {
    alert("Not Implemented");
  };

  const paymentHistory = () => {
    alert("Not Implemented");
  };

  return (
    <KeyboardAvoidingView>
      <SafeAreaView>
        <Row
          label="Nickname:"
          data={nickname}
          IconButton={<IconButton icon="pencil" onPress={handleEditNickname} />}
        />
        <Row
          label="Email:"
          data={email}
          IconButton={<IconButton icon="logout" onPress={handleSignOut} />}
        />
        <Row
          label="Change Password"
          IconButton={
            <IconButton icon={"pencil"} onPress={handleChangePassword} />
          }
        />
        <Row
          label="Friends"
          IconButton={<IconButton icon="eye" onPress={handleViewFriendsList} />}
        />
        <Row
          label="Delete Account"
          IconButton={<IconButton icon="delete" onPress={handleShowConfirmPasswordModal} />}
        />

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
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  pageContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  contentContainer: {
    minWidth: 350,
  },

  delCancelButtons: {
    marginVertical: 6,
    width: "90%",
  },

  row: {
    width: "100%",
  },
});
