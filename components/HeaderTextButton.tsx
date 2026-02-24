import { Pressable, Text, StyleSheet } from "react-native";
import { theme } from "@/theme";

interface HeaderTextButtonProps {
  label: string;
  onPress: () => void;
  hitSlop?: number;
}

export function HeaderTextButton({ label, onPress, hitSlop = 20 }: HeaderTextButtonProps) {
  return (
    <Pressable hitSlop={hitSlop} onPress={onPress}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    color: theme.colorOrangePeel,
    fontSize: 16,
    fontWeight: "600",
  },
});
