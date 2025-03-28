import React, { useCallback, useContext, useState, Suspense } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

import { createFriendship, getFriendsOfUser, sendFriendRequest } from "@/api/cloud_ops/friends";
import {
  getInvitesForUser,
  getUserData,
  getUserDataFromEmail,
} from "@/api/db_ops";
import { friend, friendReference, friendsList } from "@/api/models/userTypes";
import { AuthContext } from "@/contexts/authContext";
import { useFocusEffect } from "expo-router";
import { DataTable, IconButton, TextInput, Button } from "react-native-paper";
import FriendsTable from "@/components/profile/friendsTable";
import { isValidEmail } from "@/api/types_and_utils";

const friends = () => {
  const [friendsList, setFriendsList] = useState<friendsList>({});

  const [showingAddFriendUI, setShowingAddFriendUI] = useState(false);
  const [emailToInviteTxt, setEmailToInviteTxt] = useState("");
  const { email } = useContext(AuthContext);

  const friendsListArray = Object.keys(friendsList);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const invitesRes = await getInvitesForUser(email);
        const friendsRes = await getFriendsOfUser(email);
        const friendsList = friendsRes.data;
        if (friendsList) setFriendsList(friendsList);
      })();
    }, [email])
  );

  const handleDeleteFriend = () => {
    alert("Not Implemented");
  };

  const handleShowAddFriendUI = async () => {
    setShowingAddFriendUI(true);
  };

  const handleSendFriendRequest = async () => {

    if (isValidEmail(emailToInviteTxt)) {
      const res = await sendFriendRequest(email, emailToInviteTxt)
      if (res.ok) {
        alert("Friend request sent to: " + emailToInviteTxt)
        handleCloseAddFriend();

        
      } else {
        alert("Error sending friend request")
      }

      setEmailToInviteTxt("");
    } else {
      alert("Invalid Email Address: " + emailToInviteTxt)
    }
      
  };

  const handleCloseAddFriend = async () => {
    setShowingAddFriendUI(false);
  };

  return (
    <SafeAreaView style={styles.contentContainer}>
      <View style={styles.pageContainer}>
        <FriendsTable friendsList={friendsList} />
        {!showingAddFriendUI && (
          <Button onPress={handleShowAddFriendUI}>Add Friend</Button>
        )}
        {showingAddFriendUI && (
          <View
            style={{
              flexDirection: "row",
            }}
          >
            <View style={{ flex: 3 }}>
              <TextInput value={emailToInviteTxt} onChangeText={setEmailToInviteTxt}/>
            </View>
            <View style={{ flex: 1, flexDirection: "row" }}>
              <IconButton icon="close" onPress={handleCloseAddFriend} />
              <IconButton icon="check" onPress={handleSendFriendRequest} />
            </View>
            {/* Left: Text Input */}
            {/* Right: Actions */}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default friends;

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  pageContainer: {
    minWidth: 350,
  },
});
