import { Stack } from "expo-router";
import { BackToTeamButton } from "@/components/BackToTeamButton";
import { HeaderIconButton } from "@/components/HeaderIconButton";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Players",
          headerLeft: () => <BackToTeamButton />,
          headerRight: () => <HeaderIconButton href="/players/newPlayer" iconName="plus-circle" />,
        }}
      ></Stack.Screen>
      <Stack.Screen name="newPlayer" options={{ title: "New Player" }}></Stack.Screen>
      <Stack.Screen
        name="[playerId]"
        options={{
          title: "My Player",
        }}
      ></Stack.Screen>
    </Stack>
  );
}
