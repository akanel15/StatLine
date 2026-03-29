import { Tabs } from "expo-router";
import { theme } from "@/theme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AntDesign from "@expo/vector-icons/AntDesign";
import Foundation from "@expo/vector-icons/Foundation";

export default function Layout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: theme.colorOrangePeel }}>
      <Tabs.Screen
        name="[teamId]"
        options={{
          title: "Team info",
          tabBarShowLabel: true,
          headerShown: false,
          tabBarIcon: ({ size, color }) => <FontAwesome name="group" size={size} color={color} />,
          tabBarTestID: "tab-team",
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: "Players",
          tabBarShowLabel: true,
          headerShown: false,
          tabBarIcon: ({ size, color }) => <AntDesign name="profile" size={size} color={color} />,
          tabBarTestID: "tab-players",
        }}
      />
      <Tabs.Screen
        name="sets"
        options={{
          title: "sets",
          tabBarShowLabel: true,
          headerShown: false,
          tabBarIcon: ({ size, color }) => (
            <Foundation name="clipboard-pencil" size={size} color={color} />
          ),
          tabBarTestID: "tab-sets",
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: "Games",
          tabBarShowLabel: true,
          headerShown: false,
          tabBarIcon: ({ size, color }) => (
            <FontAwesome6 name="basketball" size={size} color={color} />
          ),
          tabBarTestID: "tab-games",
        }}
      />
    </Tabs>
  );
}
