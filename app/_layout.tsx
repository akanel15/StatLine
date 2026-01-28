import { Link, Stack } from "expo-router";
import { Pressable } from "react-native";
import { theme } from "@/theme";
import AntDesign from "@expo/vector-icons/AntDesign";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Layout() {
  return (
    <ErrorBoundary>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Select Team",
            headerLeft: () => (
              <Link href="/settings" asChild>
                <Pressable hitSlop={20}>
                  <AntDesign name="setting" size={24} color={theme.colorOrangePeel} />
                </Pressable>
              </Link>
            ),
            headerRight: () => (
              <Link href="/newTeam" asChild>
                <Pressable hitSlop={20}>
                  <AntDesign name="plus-circle" size={24} color={theme.colorOrangePeel} />
                </Pressable>
              </Link>
            ),
          }}
        ></Stack.Screen>
        <Stack.Screen name="newTeam" options={{ title: "New team" }}></Stack.Screen>
        <Stack.Screen name="settings" options={{ title: "Settings" }}></Stack.Screen>
        <Stack.Screen name="privacy" options={{ title: "Privacy Policy" }}></Stack.Screen>
        <Stack.Screen name="faq" options={{ title: "FAQs" }}></Stack.Screen>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }}></Stack.Screen>
        {/* Debug route - only in development */}
        {__DEV__ && (
          <Stack.Screen
            name="debug"
            options={{ title: "Debug: Game Count Management" }}
          ></Stack.Screen>
        )}
      </Stack>
    </ErrorBoundary>
  );
}
