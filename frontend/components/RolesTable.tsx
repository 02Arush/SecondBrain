import { StyleSheet, View } from "react-native";
import React, { useContext } from "react";
import { DataTable, IconButton } from "react-native-paper";
import { sharedUser } from "@/api/types_and_utils";
import Select from "./Select";
import { getNicknameFromEmail } from "@/api/types_and_utils";
import { selectItem } from "./Select";
import constants from "@/constants/constants";
import { ensureJSDate, userSelectMap } from "@/api/types_and_utils";
import { AuthContext } from "@/contexts/authContext";

type propTypes = {
  sharedUsers: sharedUser[];
  selectVisibilities: userSelectMap;
  setSelectVisibilities: any;
  handleChangeRoleOfUser: (
    modifiedUser: string,
    newRole: string
  ) => Promise<void>;
};
const RolesTable = ({
  sharedUsers,
  selectVisibilities,
  setSelectVisibilities,
  handleChangeRoleOfUser,
}: propTypes) => {
  const { email } = useContext(AuthContext);

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
    <DataTable>
      <DataTable.Header>
        <DataTable.Cell style={styles.nickCell}>Nickname</DataTable.Cell>
        <DataTable.Cell style={styles.roleCell}>Role</DataTable.Cell>
        <DataTable.Cell style={styles.actionsCell}>Actions</DataTable.Cell>
        {/* TODO: In Future, role should be dropdown that lets you change the user's role */}
      </DataTable.Header>
      {Object.values(sharedUsers).map((sharedUser) => {
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
