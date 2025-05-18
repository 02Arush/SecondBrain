import { StyleSheet, View } from "react-native";
import React, { useState, useEffect } from "react";
import { ActivityIndicator, DataTable, Icon, Divider } from "react-native-paper";
import { displayedFriendItem, friendsList } from "@/models/userTypes";
import { getUserData } from "@/api/db_ops";

const FriendsTable = ({ friendsList }: { friendsList: friendsList }) => {
  const friendsListArray = Object.keys(friendsList);

  const [fullFriendsData, setFullFriendsData] = useState<displayedFriendItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
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
      setLoading(false);
    })();
  }, [friendsList]);

  return (
    <DataTable>
      <DataTable.Header>
        <DataTable.Cell>Nickname</DataTable.Cell>
        <DataTable.Cell>Email</DataTable.Cell>
        <DataTable.Cell style={styles.endCell}>Actions</DataTable.Cell>
      </DataTable.Header>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
        </View>
      ) : (
        fullFriendsData.map((item, idx) => (
          <DataTable.Row key={idx}>
            <DataTable.Cell>{item.nickname}</DataTable.Cell>
            <DataTable.Cell>{item.email}</DataTable.Cell>
            <DataTable.Cell style={styles.endCell}>
              <Icon source="close" size={20} />
            </DataTable.Cell>
          </DataTable.Row>
        ))
      )}
    </DataTable>
  );
};

export default FriendsTable;

const styles = StyleSheet.create({
  endCell: { flexDirection: "row", justifyContent: "flex-end" },
  loadingContainer: { paddingVertical: 20, alignItems: "center" },
});
