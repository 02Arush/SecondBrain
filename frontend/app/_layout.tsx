import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme, StyleSheet } from "react-native";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { createNavStyle } from "@/components/createNavigationStyle";
import { AuthProvider } from "@/contexts/authContext";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

const customLightTheme = {
  ...MD3LightTheme,

  colors: {
    ...MD3LightTheme.colors,
    tertiary: "#2b8a3e",
  },
};

const customDarkTheme = {
  ...MD3DarkTheme,

  colors: {
    ...MD3DarkTheme.colors,
    background: "#000000",
    surface: "rgb(28, 28, 30)",
    tertiary: "#2f9e44",
  },
};

function RootLayoutNav() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? customDarkTheme : customLightTheme;
  const style = createNavStyle(theme);

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <Stack
          screenOptions={{
            contentStyle: style.bgColor,
            headerStyle: style.bgColor,
            headerTitleStyle: style.onBgColor,
            headerTintColor: theme.colors.onBackground,
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(modals)/addHabit"
            options={{
              title: "Create Habit",
              headerBackTitle: "Home",
            }}
          />
          <Stack.Screen
            name="(modals)/editHabit"
            options={{ title: "Update Habit", headerBackTitle: "Home" }}
          />
          <Stack.Screen
            name="(modals)/viewHabitLog"
            options={{ title: "Habit Log", headerBackTitle: "Home" }}
          />
          <Stack.Screen
            name="(modals)/deleteAll"
            options={{
              title: "Clear All?",
              headerBackTitle: "Home",
            }}
          />

          <Stack.Screen
            name="(modals)/register"
            options={{
              title: "Create Account",
              headerBackTitle: "Home",
            }}
          />

          <Stack.Screen
            name="(modals)/createTask"
            options={{
              title: "Task Builder",
              headerBackTitle: "Home",
            }}
          />
        </Stack>
      </AuthProvider>
    </PaperProvider>
  );
}
