import { Stack } from "expo-router";
import { BackToTeamButton } from "@/components/BackToTeamButton";
import { HeaderIconButton } from "@/components/HeaderIconButton";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Games",
          headerLeft: () => <BackToTeamButton />,
          headerRight: () => <HeaderIconButton href="/games/newGame" iconName="plus-circle" />,
        }}
      ></Stack.Screen>
      <Stack.Screen name="newGame" options={{ title: "New Game" }}></Stack.Screen>
      <Stack.Screen
        name="[gameId]"
        options={{
          title: "Game Info",
        }}
      ></Stack.Screen>
    </Stack>
  );
}
