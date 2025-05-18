import { changeRoleOfUser, deleteInvite, getInvitesForItem, getSharedUsersForItem } from "@/api/db_ops";
import Habit from "@/api/models/habit";
import Task from "@/api/models/task";
import { ensureJSDate, getNicknameFromEmail } from "@/api/types_and_utils";
import constants, { isAnonymous } from "@/constants/constants";
import { AuthContext } from "@/contexts/authContext";
import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { DataTable, IconButton, Text } from "react-native-paper";
import Select, { selectItem } from "./Select";

import { userSelectMap } from "@/api/models/miscTypes";
import { email, sharedUser } from "@/api/models/userTypes";
import { useFetchInvitedUsers } from "@/hooks/useFetchInvitedUsers";

type propTypes = {
  item: Habit | Task;
};
const RolesTable = ({ item }: propTypes) => {
  const [sharedUsers, setSharedUsers] = useState<{
    [key: string]: sharedUser;
  }>(item.getSharedUsers());
  const [selectVisibilities, setSelectVisibilities] = useState(new Map());
  const { email } = useContext(AuthContext);

  const fetchSharedUserData = async () => {
    const res = await getSharedUsersForItem(item);
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

  const handleChangeRoleOfUser = async (
    modifiedUser: email,
    newRole: string
  ) => {
    const signedInUser = email;
    const res = await changeRoleOfUser(
      signedInUser,
      modifiedUser,
      newRole,
      item
    );

    alert(res.message);
    fetchSharedUserData();
  };

  const {invites: invitedUsers, handleRefresh: handleRefreshInvitedUsers} = useFetchInvitedUsers(item);
  const handleDeleteInvite = async (invite: any) => {
    const { recipient, itemID } = invite;

    const res = await deleteInvite(recipient, itemID);
    alert(res.message);
    handleRefreshInvitedUsers()
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
    <DataTable>
      <DataTable.Header>
        <DataTable.Cell style={styles.nickCell}>User</DataTable.Cell>
        <DataTable.Cell style={styles.roleCell}>Role</DataTable.Cell>
        <DataTable.Cell style={styles.actionsCell}>Actions</DataTable.Cell>
        {/* TODO: In Future, role should be dropdown that lets you change the user's role */}
      </DataTable.Header>
      {sharedUsers &&
        Object.values(sharedUsers).map((sharedUser: sharedUser) => {
          const email = sharedUser.email;
          const visible = selectVisibilities?.get(email) || false;
          const setVisible = (visible: boolean) => {
            setSelectVisibilities((prev: userSelectMap | undefined) => {
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

      {invitedUsers.map((invite, idx) => {
        return (
          <DataTable.Row key={idx}>
            <DataTable.Cell style={styles.nickCell}>
              {invite.recipient}
            </DataTable.Cell>
            <DataTable.Cell style={styles.roleCell}>
              <Text
                style={{ textAlign: "center", width: "100%", color: "grey" }}
              >
                Invited
              </Text>
            </DataTable.Cell>
            <DataTable.Cell>
              <View style={styles.actionsCell}>
                <IconButton
                  icon={"delete"}
                  onPress={() => {
                    handleDeleteInvite(invite);
                  }}
                />
              </View>
            </DataTable.Cell>
          </DataTable.Row>
        );
      })}
    </DataTable>
  );
};

export default RolesTable;

const styles = StyleSheet.create({
  nickCell: { flex: 2 },

  roleCell: { flex: 1 },

  actionsCell: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "center",
  },
});
