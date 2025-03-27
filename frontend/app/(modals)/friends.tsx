import React, { useCallback, useContext, useState, Suspense } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

import { createFriendship, getFriendsOfUser } from "@/api/cloud_ops/friends";
import { getInvitesForUser, getUserData, getUserDataFromEmail } from "@/api/db_ops";
import { friend, friendReference, friendsList } from "@/api/models/userTypes";
import { AuthContext } from "@/contexts/authContext";
import { useFocusEffect } from "expo-router";
import { DataTable, Button } from "react-native-paper";
import FriendsTable from "@/components/profile/friendsTable";
const friends = () => {
  const [friendsList, setFriendsList] = useState<friendsList>({});
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

  const handleAddFriend = async () => {
    // For testing purposes
    const res = await createFriendship("test2@jp.com", "test1@jp.com");
  };


  return (
    <SafeAreaView style={styles.contentContainer}>
      <View style={styles.pageContainer}>
       
        
        <FriendsTable friendsList = {friendsList} />
        <Button onPress={handleAddFriend}>Add Friend</Button>
        <Text>
          Pending Friend Requests Button (should also show in invites)
        </Text>
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
