import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { Linking } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HeaderIconButton } from "@/components/HeaderIconButton";

function handleDeepLink(url: string) {
  if (url.endsWith(".statline") || url.includes(".statline")) {
    router.navigate({ pathname: "/import", params: { fileUri: url } });
  }
}

export default function Layout() {
  useEffect(() => {
    // Handle URL when app is already open
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    // Handle URL when app is cold-started via file open
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription.remove();
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
