import { StyleSheet, Text, View } from "react-native";
import React, { useState, useContext, useEffect } from "react";
import { createInvite } from "@/api/db_ops";

import { Button, TextInput, IconButton, DataTable } from "react-native-paper";
import { SharableItem } from "@/api/SharableItem";
import { AuthContext } from "@/contexts/authContext";
import { getInvitesForItem } from "@/api/db_ops";
import { isAnonymous } from "@/constants/constants";

type propTypes = {
  item: SharableItem;
};

const InviteUserUI = ({ item }: propTypes) => {
  const [showingAddEmail, setShowingAddEmail] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState<string>("");
  const { email } = useContext(AuthContext);
  const [showingInvited, setShowingInvited] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<Array<any>>([]);

  useEffect(() => {
    (async () => {
      if (!isAnonymous(email)) {
        const res = await getInvitesForItem(item);
        setInvitedUsers(res.data);
      }
    })();
  }, [item]);

  const handleOpenInviteEmail = () => {
    setShowingAddEmail(true);
  };

  const handleCloseShowingEmail = () => {
    setShowingAddEmail(false);
  };

  const handleSubmitInviteEmail = async () => {
    const recipient = emailRecipient;

    const res = await createInvite(email, recipient, item);
    alert(res.message);

    setShowingAddEmail(false);
  };

  const handleOpenShowingInvited = async () => {
    setShowingInvited(!showingInvited);
  };

  return (
    <>
      <Button onPress={handleOpenInviteEmail}>Invite New User</Button>
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
      <Button onPress={handleOpenShowingInvited}>Pending Invites</Button>
      <DataTable style={{ display: showingInvited ? "flex" : "none" }}>
        <DataTable.Header>
          <DataTable.Title>Sender</DataTable.Title>
          <DataTable.Title>Recipient</DataTable.Title>
          <DataTable.Title>Actions</DataTable.Title>
        </DataTable.Header>
        {invitedUsers.map((invite, idx) => {
          return (
            <DataTable.Row key={idx}>
              <DataTable.Cell>{invite.sender}</DataTable.Cell>
              <DataTable.Cell>{invite.recipient}</DataTable.Cell>
              <DataTable.Cell>
                <IconButton icon={"close"} />
              </DataTable.Cell>
            </DataTable.Row>
          );
        })}
      </DataTable>
    </>
  );
};

export default InviteUserUI;

const styles = StyleSheet.create({});
