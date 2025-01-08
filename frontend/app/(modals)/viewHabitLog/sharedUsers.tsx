import { StyleSheet, View } from "react-native";
import {
  Text,
  DataTable,
  Button,
  IconButton,
  TextInput,
} from "react-native-paper";
import React, { useContext, useState, useCallback } from "react";
import { HabitContext } from "@/contexts/habitContext";
import { AuthContext } from "@/contexts/authContext";
import { isAnonymous } from "@/constants/constants";
import { router, useRouter, useFocusEffect } from "expo-router";
import { useRootNavigationState, Redirect } from "expo-router";
import { createInvite, getSharedUsersForHabit } from "@/api/db_ops";
import { getNicknameFromEmail, isValidEmail } from "@/api/types_and_utils";

const sharedUsers = () => {
  const habit = useContext(HabitContext);
  const { email } = useContext(AuthContext);
  const router = useRouter();
  const [sharedUsers, setSharedUsers] = useState<Array<any>>([]);
  const habitID = habit.getID();
  const [showingAddEmail, setShowingAddEmail] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState<string>("");

  useFocusEffect(
    useCallback(() => {
      if (isAnonymous(email)) {
        router.back();
      }

      // Get Shared Users
      (async () => {
        const res = await getSharedUsersForHabit(habitID);
        if (res.ok) {
          const sharedUsersCloud = res.data || [];
          setSharedUsers(sharedUsersCloud);
        } else {
          alert("Error Retrieving Shared Users:\n" + res.message);
        }
      })();
    }, [])
  );

  const handleOpenInviteEmail = () => {
    setShowingAddEmail(true);
  };

  const handleCloseShowingEmail = () => {
    setShowingAddEmail(false);
  };

  const handleSubmitInviteEmail = async () => {
    const recipient = emailRecipient;

    const res = await createInvite(email, recipient, habit);
    alert(res.message);

    setShowingAddEmail(false);
  };

  const TableRow = (sharedUser: any) => {
    const email = sharedUser.email;
    const role = sharedUser.role;
    const nickname = sharedUser.nickname || getNicknameFromEmail(email);

    return (
      <DataTable.Row key={email}>
        <DataTable.Cell style={{ flex: 3 }}>{nickname}</DataTable.Cell>
        <DataTable.Cell style={{ flex: 1 }}>
          <Text>{role.toUpperCase()}</Text>
        </DataTable.Cell>
        <DataTable.Cell>
          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <IconButton size={18} icon={"eye"} />
            <IconButton size={18} icon={"pencil"} />
          </View>
        </DataTable.Cell>
      </DataTable.Row>
    );
  };

  return (
    <View style={styles.componentContainer}>
      <DataTable>
        <DataTable.Header>
          <DataTable.Cell style={{ flex: 3 }}>Nickname</DataTable.Cell>
          <DataTable.Cell style={{ flex: 1 }}>Role</DataTable.Cell>
          <DataTable.Cell style={{ flex: 1, justifyContent: "flex-end" }}>
            Actions
          </DataTable.Cell>
          {/* TODO: In Future, role should be dropdown that lets you change the user's role */}
        </DataTable.Header>
        {sharedUsers.map((sharedUser) => {
          return TableRow(sharedUser);
        })}
      </DataTable>
      <Button onPress={handleOpenInviteEmail}>Invite New User</Button>
      {/* This is here to add a text input where you can invite a user */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          display: showingAddEmail ? "flex" : "none",
        }}
      >
        <TextInput
          value={emailRecipient}
          onChangeText={(text) => setEmailRecipient(text)}
          keyboardType="email-address"
          dense
          label={"Email"}
        />
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <IconButton icon={"close"} onPress={handleCloseShowingEmail} />
          <IconButton icon={"check"} onPress={handleSubmitInviteEmail} />
        </View>
      </View>
    </View>
  );
};

export default sharedUsers;

const styles = StyleSheet.create({
  componentContainer: {
    width: "100%",
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "red",
    flex: 1,
  },

  row: {},

  nickCell: {},

  roleCell: {},

  emailCell: {},
});
