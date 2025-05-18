import { StyleSheet, View } from "react-native";
import React, { useState, useContext, useEffect } from "react";
import { createInvite } from "@/api/db_ops";
import {
  Button,
  TextInput,
  IconButton,
  Text,
  DataTable,
} from "react-native-paper";
import { SharableItem } from "@/api/models/SharableItem";
import { AuthContext } from "@/contexts/authContext";

import OutlineModal from "./OutlineModal";
import SegmentedButtons, { SegmentButton } from "./SegmentedButtons";
import FriendsTable from "./profile/friendsTable";
import { useFetchInvitedUsers } from "@/hooks/useFetchInvitedUsers";
import { useFriendsList } from "@/hooks/useFriendsList";

type propTypes = {
  item: SharableItem;
  onRefresh: () => void;
};

enum InviteModalTabs {
  FRIENDS_LIST = "friends_list",
  EMAIL = "email",
}

const InviteUserUI = ({ item, onRefresh: handleRefresh }: propTypes) => {
  const [showingAddEmail, setShowingAddEmail] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState<string>("");

  const { email } = useContext(AuthContext);
  const { friendsList } = useFriendsList();
  const { invites: invitedUsers } = useFetchInvitedUsers(item);

  const [showingInvited, setShowingInvited] = useState(false);
  const [selectedInviteTab, setSelectedInviteTab] = useState<InviteModalTabs>(
    InviteModalTabs.FRIENDS_LIST
  );

  const inviteTabSegments: Array<SegmentButton> = [
    { value: "friends_list", label: "Via Friends List" },
    { value: "email", label: "Via Email" },
  ];

  const handleOpenInviteEmail = () => {
    setShowingAddEmail(true);
  };

  const handleCloseShowingEmail = () => {
    setShowingAddEmail(false);
  };

  const handleSubmitInviteEmail = async (recipient: string) => {
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

  const FriendsListComponent = () => {
    const friendEmails = Object.keys(friendsList);

    return (
      <DataTable>
        <DataTable.Header>
          <DataTable.Cell>Email</DataTable.Cell>
          <DataTable.Cell style={{flexDirection: "row", justifyContent: "flex-end"}}>Send Invite</DataTable.Cell>
        </DataTable.Header>

        {friendEmails.map((friendEmail) => {
          let friendAlreadyInvited = false;
          invitedUsers.forEach((invite) => {
            if (typeof invite === "object") {
              friendAlreadyInvited =
                friendAlreadyInvited || invite["recipient"] == friendEmail;
            }
          });

          return (
            <DataTable.Row key={`invite__${friendEmail}`}>
              <DataTable.Cell>{friendEmail}</DataTable.Cell>
              <IconButton
                disabled={friendAlreadyInvited}
                icon={"send-outline"}
                onPress={() => handleSubmitInviteEmail(friendEmail)}
              />
            </DataTable.Row>
          );
        })}
      </DataTable>
    );
  };
  const InviteNewEmailComponent = ({
    emailRecipient,
    handleSetEmailRecipient,
    showingAddEmail,
  }: {
    emailRecipient: string;
    handleSetEmailRecipient: (s: string) => void;
    showingAddEmail: boolean;
  }) => {
    if (!showingAddEmail) return null;

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <TextInput
          value={emailRecipient}
          onChangeText={handleSetEmailRecipient}
          keyboardType="email-address"
          dense
          label={"Email"}
        />
        <IconButton
          icon={"send-outline"}
          onPress={() => handleSubmitInviteEmail(emailRecipient)}
        />
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
          <View style={{ padding: 16 }}>
            {selectedInviteTab === InviteModalTabs.FRIENDS_LIST && (
              <FriendsListComponent />
            )}

            {selectedInviteTab === InviteModalTabs.EMAIL && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <TextInput
                  value={emailRecipient}
                  onChangeText={(text) => setEmailRecipient(text)}
                  keyboardType="email-address"
                  dense
                  label={"Email"}
                />
                <IconButton
                  disabled={emailRecipient.trim().length === 0}
                  icon={"send-outline"}
                  onPress={() => handleSubmitInviteEmail(emailRecipient)}
                />
              </View>
            )}
          </View>
          <Button onPress={handleCloseShowingEmail}>Close</Button>
        </View>
      </OutlineModal>
    </>
  );
};

export default InviteUserUI;

const styles = StyleSheet.create({});
