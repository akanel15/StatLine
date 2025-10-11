import { Pressable } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { theme } from "@/theme";

interface StandardBackButtonProps {
  onPress: () => void;
  hitSlop?: number;
}

export function StandardBackButton({ onPress, hitSlop = 20 }: StandardBackButtonProps) {
  return (
    <Pressable hitSlop={hitSlop} onPress={onPress}>
      <AntDesign name="left" size={24} color={theme.colorOrangePeel} />
    </Pressable>
  );
}
