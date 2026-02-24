import { Stack } from "expo-router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HeaderIconButton } from "@/components/HeaderIconButton";

export default function Layout() {
  return (
    <ErrorBoundary>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Select Team",
            headerLeft: () => <HeaderIconButton href="/settings" iconName="setting" />,
            headerRight: () => <HeaderIconButton href="/newTeam" iconName="plus-circle" />,
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
