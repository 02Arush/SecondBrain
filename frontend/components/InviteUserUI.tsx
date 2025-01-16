import { StyleSheet, Text, View } from "react-native";
import React, { useState, useContext } from "react";
import { createInvite } from "@/api/db_ops";

import { Button, TextInput, IconButton } from "react-native-paper";
import { SharableItem } from "@/api/SharableItem";
import { AuthContext } from "@/contexts/authContext";

type propTypes = {
  item: SharableItem;
};

const InviteUserUI = ({ item }: propTypes) => {
  const [showingAddEmail, setShowingAddEmail] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState<string>("");
  const { email } = useContext(AuthContext);

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
    </>
  );
};

export default InviteUserUI;

const styles = StyleSheet.create({});
