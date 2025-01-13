import { Pressable, StyleSheet, View } from "react-native";
import {
  Text,
  DataTable,
  Button,
  Portal,
  IconButton,
  TextInput,
} from "react-native-paper";
import React, {
  useContext,
  useState,
  useCallback,
  SetStateAction,
} from "react";
import { HabitContext } from "@/contexts/habitContext";
import { AuthContext } from "@/contexts/authContext";
import constants, { isAnonymous } from "@/constants/constants";
import { router, useRouter, useFocusEffect } from "expo-router";
import { useRootNavigationState, Redirect } from "expo-router";
import {
  changeRoleOfUser,
  createInvite,
  getSharedUsersForHabit,
  getSharedUsersForItem,
} from "@/api/db_ops";
import {
  email,
  getNicknameFromEmail,
  isValidEmail,
  ensureJSDate,
  sharedUser,
} from "@/api/types_and_utils";
import Select, { selectItem } from "@/components/Select";
import { userSelectMap } from "@/api/types_and_utils";
import RolesTable from "@/components/RolesTable";

const sharedUsers = () => {
  const habit = useContext(HabitContext);
  const { email } = useContext(AuthContext);
  const router = useRouter();
  const [sharedUsers, setSharedUsers] = useState<{
    [key: string]: sharedUser;
  }>({});
  const habitID = habit.getID();
  const [showingAddEmail, setShowingAddEmail] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState<string>("");
  const [selectVisibilities, setSelectVisibilities] = useState<userSelectMap>();

  useFocusEffect(
    useCallback(() => {
      if (isAnonymous(email)) {
        router.back();
      } else {
        fetchSharedUserData();
      }
    }, [])
  );

  const fetchSharedUserData = async () => {
    const res = await getSharedUsersForItem(habit);
    if (res.ok) {
      const sharedUsersCloud = res.data || {};
      setSharedUsers(sharedUsersCloud);
      const keys = Object.keys(sharedUsersCloud);
      const values = Array(keys.length).fill(false);
      const newVisibilities = new Map(
        keys.map((key, index) => [key, values[index]])
      );
      setSelectVisibilities(newVisibilities);
    } else {
      alert("Error Retrieving Shared Users:\n" + res.message);
    }
  };

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

  // TODO: NOTIFY USER IF THEY TRY TO DEMOTE THEMSELVES AS OWNER BUT CAN'T
  const handleChangeRoleOfUser = async (
    modifiedUser: email,
    newRole: string
  ) => {
    const signedInUser = email;
    const res = await changeRoleOfUser(
      signedInUser,
      modifiedUser,
      newRole,
      habit
    );

    alert(res.message);
    fetchSharedUserData();
  };

  const TableRow = (
    sharedUser: sharedUser,
    visible: boolean,
    setVisible: (visible: boolean) => void,
    handleSelectRole: (role: string) => void
  ) => {
    const userEmail = sharedUser.email;
    const role = sharedUser.role;
    const nickname = getNicknameFromEmail(userEmail);
    const joinDate = ensureJSDate(sharedUser.joinDate);
    const roles: Array<selectItem> = [
      { label: "OWNER", value: constants.ROLE.OWNER },
      { label: "ADMIN", value: constants.ROLE.ADMIN },
      { label: "MEMBER", value: constants.ROLE.MEMBER },
    ];

    if (userEmail.localeCompare(email) != 0) {
      roles.push({ label: "REMOVE", value: constants.ROLE.NONE });
    }

    return (
      <DataTable.Row key={userEmail}>
        <DataTable.Cell style={styles.nickCell}>{nickname}</DataTable.Cell>
        <DataTable.Cell style={styles.roleCell}>
          {/* <Button onPress={() => handleChangeRoleOfUser(email)}>
            {role.toUpperCase()}
          </Button> */}
          <Select
            visible={visible}
            items={roles}
            setVisible={setVisible}
            selectedItem={sharedUser.role.toUpperCase()}
            setSelectedItem={handleSelectRole}
          />
        </DataTable.Cell>
        <DataTable.Cell>
          <View style={styles.actionsCell}>
            <IconButton
              size={18}
              icon={"eye"}
              onPress={() => {
                alert(`Nickname: ${nickname}\nEMAIL: ${userEmail}\nRole: ${role.toUpperCase()}\nJoin Date: ${joinDate.toDateString()}
              `);
              }}
            />
          </View>
        </DataTable.Cell>
      </DataTable.Row>
    );
  };

  return (
    <View style={styles.componentContainer}>
      {/* 
      <DataTable>
        <DataTable.Header>
          <DataTable.Cell style={styles.nickCell}>Nickname</DataTable.Cell>
          <DataTable.Cell style={styles.roleCell}>Role</DataTable.Cell>
          <DataTable.Cell style={styles.actionsCell}>Actions</DataTable.Cell>
        </DataTable.Header>
        {Object.values(sharedUsers).map((sharedUser) => {
          const email = sharedUser.email;
          const visible = selectVisibilities?.get(email) || false;
          const setVisible = (visible: boolean) => {
            setSelectVisibilities((prev) => {
              const newMap = new Map(prev || new Map());
              newMap.set(email, visible);
              return newMap;
            });
          };

          const handleSelectRole = async (role: string) => {
            const res = await handleChangeRoleOfUser(email, role);
            return res;
          };

          return TableRow(sharedUser, visible, setVisible, handleSelectRole);
        })}
      </DataTable>
 */}
      <RolesTable
        item={habit}
        // handleChangeRoleOfUser={handleChangeRoleOfUser}
        sharedUsers={sharedUsers}
        setSharedUsers={setSharedUsers}
        selectVisibilities={selectVisibilities}
        setSelectVisibilities={setSelectVisibilities}
      />
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
    flex: 1,
  },

  row: {},

  nickCell: { flex: 2 },

  roleCell: { flex: 1 },

  actionsCell: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "center",
  },

  emailCell: {},
});
