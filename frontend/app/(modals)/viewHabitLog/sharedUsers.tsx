import { Pressable, StyleSheet, View } from "react-native";
import React, {
  useContext,
  useState,
  useCallback,
  SetStateAction,
} from "react";
import { HabitContext } from "@/contexts/habitContext";
import { AuthContext } from "@/contexts/authContext";
import constants, { isAnonymous } from "@/constants/constants";
import { router, useRouter, useFocusEffect } from "expo-router";
import RolesTable from "@/components/RolesTable";
import InviteUserUI from "@/components/InviteUserUI";

const sharedUsers = () => {
  const habit = useContext(HabitContext);
  const { email } = useContext(AuthContext);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (isAnonymous(email)) {
        router.back();
      }
    }, [])
  );

  return (
    <View style={styles.componentContainer}>
      <RolesTable item={habit} />
      <InviteUserUI item={habit} />
    </View>
  );
};

export default sharedUsers;

const styles = StyleSheet.create({
  componentContainer: {
    width: "100%",
    flexDirection: "column",
    flex: 1,
  },
});
