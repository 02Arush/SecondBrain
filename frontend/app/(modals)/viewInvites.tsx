import { StyleSheet, View } from "react-native";
import React, { useState, useCallback, useContext, useEffect } from "react";
import { Text, DataTable, IconButton } from "react-native-paper";
import { useFocusEffect } from "expo-router";
import { getInvitesForUser, invitationAction } from "@/api/db_ops";
import { AuthContext } from "@/contexts/authContext";
import { isAnonymous } from "@/constants/constants";
import { sharedItemType } from "@/api/types_and_utils";

const viewInvites = () => {
  const [invites, setInvites] = useState<Array<any>>([]);
  const { email } = useContext(AuthContext);

  useFocusEffect(
    useCallback(() => {
      fetchInviteData();
    }, [])
  );

  const fetchInviteData = async () => {
    const inviteRes = await getInvitesForUser(email);
    const invData = inviteRes.data;
    setInvites(invData);
  };

  const handleInviteAction = async (
    itemID: string,
    action: "accept" | "reject"
  ) => {
    const res = await invitationAction(email, itemID, action);
    fetchInviteData();
    alert(res.message);
  };

  const makeRow = (invite: any) => {
    const { sender, itemType, itemID, role, itemName } = invite;

    return (
      <DataTable.Row key={itemID}>
        <DataTable.Cell style={styles.senderCell}>{sender}</DataTable.Cell>
        <DataTable.Cell style={styles.nameCell}>
          <Text>{itemName || itemID}</Text>
        </DataTable.Cell>
        <DataTable.Cell style={styles.categoryCell}>
          {itemType.toUpperCase()}
        </DataTable.Cell>
        <DataTable.Cell style={styles.actionsCell}>
          <View style={styles.actionsCell}>
            <IconButton
              icon="delete"
              size={16}
              style={styles.actionIconStyles}
              onPress={() => handleInviteAction(itemID, "reject")}
            />
            <IconButton
              icon="check"
              size={16}
              style={styles.actionIconStyles}
              onPress={() => handleInviteAction(itemID, "accept")}
            />
          </View>
        </DataTable.Cell>
      </DataTable.Row>
    );
  };

  if (isAnonymous(email)) {
    return (
      <View style={styles.pageContainer}>
        <View
          style={{
            ...styles.contentContainer,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            variant="headlineSmall"
            style={{ textAlign: "center", width: "100%" }}
          >
            Anonymous/Offline users can not access invitations. Please connect
            to wifi and log in.
          </Text>
        </View>
      </View>
    );
  } else if (invites.length == 0) {
    return (
      <View style={styles.pageContainer}>
        <View
          style={{
            ...styles.contentContainer,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            variant="headlineSmall"
            style={{ textAlign: "center", width: "100%" }}
          >
            You have no pending invitations
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <View style={styles.contentContainer}>
        <DataTable style={{}}>
          <DataTable.Header>
            <DataTable.Title style={styles.senderCell}>Sender</DataTable.Title>
            <DataTable.Title style={styles.nameCell}>Name</DataTable.Title>
            <DataTable.Title style={styles.categoryCell}>Type</DataTable.Title>
            <DataTable.Title style={styles.actionsCell}>
              Actions
            </DataTable.Title>
          </DataTable.Header>
        </DataTable>
        {invites.map((invite) => makeRow(invite))}
      </View>
    </View>
  );
};

export default viewInvites;

const styles = StyleSheet.create({
  pageContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flex: 1,
  },

  contentContainer: {
    width: 350,
    borderWidth: 1,
  },

  senderCell: {
    flex: 10,
  },

  nameCell: {
    flex: 20,
    overflow: "hidden",
  },

  categoryCell: {
    flex: 10,
    justifyContent: "center",
  },

  actionsCell: {
    flexDirection: "row",
    justifyContent: "center",
    flex: 12,
  },

  actionIconStyles: {
    margin: 2,
  },
});
