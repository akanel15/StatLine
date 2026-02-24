import { Stack } from "expo-router";
import { BackToTeamButton } from "@/components/BackToTeamButton";
import { HeaderIconButton } from "@/components/HeaderIconButton";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Sets",
          headerLeft: () => <BackToTeamButton />,
          headerRight: () => <HeaderIconButton href="/sets/newSet" iconName="plus-circle" />,
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="newSet"
        options={{
          title: "New Set",
        }}
      ></Stack.Screen>
    </Stack>
  );
}
