import { Link, Stack } from "expo-router";
import { Pressable } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { theme } from "@/theme";
import { BackToTeamsButton } from "@/components/BackToTeamsButton";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Sets",
          headerLeft: () => <BackToTeamsButton />,
          headerRight: () => (
            <Link href="/sets/newSet" asChild>
              <Pressable hitSlop={20}>
                <AntDesign name="plus-circle" size={24} color={theme.colorOrangePeel} />
              </Pressable>
            </Link>
          ),
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
