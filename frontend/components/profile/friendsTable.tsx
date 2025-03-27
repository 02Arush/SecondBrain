import { StyleSheet, View } from "react-native";
import React, { useState, useEffect, Suspense } from "react";
import { ActivityIndicator, DataTable, Icon } from "react-native-paper";
import { displayedFriendItem, friendsList } from "@/api/models/userTypes";
import { getUserData, getUserDataFromEmail } from "@/api/db_ops";

const FriendsTable = ({ friendsList }: { friendsList: friendsList }) => {
  const friendsListArray = Object.keys(friendsList);

  const [fullFriendsData, setFullFriendsData] = useState<displayedFriendItem[]>(
    []
  );

  useEffect(() => {
    (async () => {
      const newFullFriendsData = await Promise.all(
        friendsListArray.map(async (email) => {
          const res = await getUserData(email);
          const data = res.data;
          if (!data) return null;

          const nickname = data["nickname"];
          if (nickname && typeof nickname === "string") {
            const ret: displayedFriendItem = { email, nickname };
            return ret;
          }

          return null;
        })
      );

      const filtered: displayedFriendItem[] = newFullFriendsData.filter(
        (item): item is displayedFriendItem => item !== null
      );

      setFullFriendsData(filtered);
    })();
  }, [friendsList]);

  return (
    <DataTable>
      <DataTable.Header>
        <DataTable.Cell>Nickname</DataTable.Cell>
        <DataTable.Cell>More Information</DataTable.Cell>
        <DataTable.Cell>Actions</DataTable.Cell>
      </DataTable.Header>
      <Suspense fallback={<ActivityIndicator size={"small"} />}>
        {fullFriendsData.map((item) => {
          return (
            <DataTable.Row>
              <DataTable.Cell>{item.nickname}</DataTable.Cell>
              <DataTable.Cell>{item.email}</DataTable.Cell>
              <DataTable.Cell>
                <Icon source="close" size={20} />
              </DataTable.Cell>
            </DataTable.Row>
          );
        })}
      </Suspense>
    </DataTable>
  );
};

export default FriendsTable;

const styles = StyleSheet.create({});
