import { Link, Stack } from "expo-router";
import { Pressable } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { theme } from "@/theme";
import { BackToTeamButton } from "@/components/BackToTeamButton";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Games",
          headerLeft: () => <BackToTeamButton />,
          headerRight: () => (
            <Link href="/games/newGame" asChild>
              <Pressable hitSlop={20}>
                <AntDesign name="plus-circle" size={24} color={theme.colorOrangePeel} />
              </Pressable>
            </Link>
          ),
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
