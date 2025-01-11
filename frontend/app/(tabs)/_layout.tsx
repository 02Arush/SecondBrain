import React, { useContext, useState, useEffect, useCallback } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs, router } from "expo-router";
import { Pressable } from "react-native";
import { createNavStyle } from "@/components/createNavigationStyle";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { Button, Icon, IconButton, useTheme, Badge } from "react-native-paper";
import { useColorScheme } from "react-native";
import { AuthContext } from "@/contexts/authContext";
import { getInvitesForUser } from "@/api/db_ops";
import { View } from "react-native";
import { useFocusEffect } from "expo-router";
// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const style = createNavStyle(theme);
  const { email } = useContext(AuthContext);
  const [numInvites, setNumInvites] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const invitesRes = await getInvitesForUser(email);
        setNumInvites(invitesRes.data.length);
      })();
    }, [email])
  );

  const invitesIcon = () => {
    return (
      <View>
        {numInvites > 0 && <Badge>{numInvites}</Badge>}
        <IconButton
          style={{ marginTop: -10 }}
          icon="email"
          onPress={() => {
            router.push("/(modals)/viewInvites");
          }}
          size={30}
        />
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.tertiary,
        headerStyle: style.bgColor,
        headerTitleStyle: style.onBgColor,
        tabBarStyle: style.bgColor,

        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Habits",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="calendar" color={color} />
          ),
          headerRight: invitesIcon,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          headerRight: invitesIcon,
        }}
      />
      <Tabs.Screen
        name="auth"
        options={{
          title: "Account",
          tabBarIcon: ({ color }) => <TabBarIcon name="gear" color={color} />,
        }}
      />
    </Tabs>
  );
}
