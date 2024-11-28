import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs, router } from "expo-router";
import { Pressable } from "react-native";
import { createNavStyle } from "@/components/createNavigationStyle";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { Button, Icon, IconButton, useTheme } from "react-native-paper";
import { useColorScheme } from "react-native";

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
          headerRight: () => (
            <Pressable>
              {({ pressed }) => (
                <Button
                  icon="delete-forever"
                  textColor={theme.colors.error}
                  onPress={() => {
                    router.push("/(modals)/deleteAll");
                  }}
                >
                  Delete All
                </Button>
              )}
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
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
