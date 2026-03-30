import { useEffect } from "react";
import { Stack } from "expo-router";
import * as Updates from "expo-updates";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HeaderIconButton } from "@/components/HeaderIconButton";

async function checkForOTAUpdate() {
  if (__DEV__) return;

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
    }
  } catch (error) {
    console.log("OTA update check failed:", error);
  }
}

export default function Layout() {
  useEffect(() => {
    checkForOTAUpdate();
  }, []);

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
        />
        <Stack.Screen name="newTeam" options={{ title: "New team" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="privacy" options={{ title: "Privacy Policy" }} />
        <Stack.Screen name="faq" options={{ title: "FAQs" }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="import"
          options={{
            presentation: "fullScreenModal",
            headerShown: false,
          }}
        />
        {/* Debug route - only in development */}
        {__DEV__ && (
          <Stack.Screen name="debug" options={{ title: "Debug: Game Count Management" }} />
        )}
      </Stack>
    </ErrorBoundary>
  );
}
