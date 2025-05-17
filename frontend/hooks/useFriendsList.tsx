import React, { useState, useContext, useCallback } from "react";
import { AuthContext } from "@/contexts/authContext";
import { friendsList } from "@/api/models/userTypes";
import { useFocusEffect } from "expo-router";
import { getFriendsOfUser } from "@/api/cloud_ops/friends";

export function useFriendsList() {
  const { email } = useContext(AuthContext);
  const [friendsList, setFriendsList] = useState<friendsList>({});

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const friendsRes = await getFriendsOfUser(email);
        const friendsList = friendsRes.data;
        if (friendsList) setFriendsList(friendsList);
      })();
    }, [email])
  );

  return { friendsList };
}
