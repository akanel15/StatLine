import { Pressable } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { theme } from "@/theme";
import { router } from "expo-router";

interface BackToTeamsButtonProps {
  hitSlop?: number;
}

export function BackToTeamsButton({ hitSlop = 20 }: BackToTeamsButtonProps) {
  const handlePress = () => {
    // Use router.back() for proper back animation (left-to-right slide)
    router.back();
  };

  return (
    <Pressable hitSlop={hitSlop} onPress={handlePress}>
      <AntDesign name="left" size={24} color={theme.colorOrangePeel} />
    </Pressable>
  );
}
