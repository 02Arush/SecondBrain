import { StyleSheet, View } from "react-native";
import React, { useState, useContext, useEffect } from "react";
import { createInvite } from "@/api/db_ops";

import { Button, TextInput, IconButton, Text } from "react-native-paper";
import { SharableItem } from "@/api/models/SharableItem";
import { AuthContext } from "@/contexts/authContext";

import OutlineModal from "./OutlineModal";
import SegmentedButtons, { SegmentButton } from "./SegmentedButtons";
import FriendsTable from "./profile/friendsTable";
import { useFriendsList } from "@/hooks/useFriendsList";

type propTypes = {
  item: SharableItem;
  handleRefresh: () => void;
};

enum InviteModalTabs {
  FRIENDS_LIST = "friends_list",
  EMAIL = "email",
}

const InviteUserUI = ({ item, handleRefresh }: propTypes) => {
  const [showingAddEmail, setShowingAddEmail] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState<string>("");

  const { email } = useContext(AuthContext);
  const { friendsList } = useFriendsList();

  const [showingInvited, setShowingInvited] = useState(false);
  const [selectedInviteTab, setSelectedInviteTab] = useState<InviteModalTabs>(
    InviteModalTabs.FRIENDS_LIST
  );

  const inviteTabSegments: Array<SegmentButton> = [
    { value: "friends_list", label: "Friends List" },
    { value: "email", label: "Email" },
  ];

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
    handleRefresh();
  };

  const handleOpenShowingInvited = async () => {
    setShowingInvited(!showingInvited);
  };

  const handleSetModalInviteTab = (s: string) => {
    setSelectedInviteTab(s as InviteModalTabs);
  };

  const InviteEmailField = () => {};

  const FriendsListComponent = () => {
    const emails = Object.keys(friendsList)
    return emails.map((email) => {
      return <Text>{email}</Text>
    })
    
  };

  const FriendItemRow = () => {

  }

  const InviteNewEmailComponent = () => {
    return (
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
    );
  };

  return (
    <>
      <Button onPress={handleOpenInviteEmail}>Invite New User</Button>
      <OutlineModal showing={showingAddEmail}>
        <View>
          <SegmentedButtons
            width={175}
            segments={inviteTabSegments}
            selectedSegment={selectedInviteTab}
            setSelectedSegment={handleSetModalInviteTab}
          />
          {selectedInviteTab === InviteModalTabs.FRIENDS_LIST && (
            <FriendsListComponent />
          )}

          {selectedInviteTab === InviteModalTabs.EMAIL && (
            <InviteNewEmailComponent />
          )}

          <Button onPress={handleCloseShowingEmail}>Close</Button>
        </View>
      </OutlineModal>
    </>
  );
};

export default InviteUserUI;

const styles = StyleSheet.create({});
