import { theme } from "@/theme";
import { Text, TouchableOpacity, StyleSheet } from "react-native";

type ToggleProps = {
  title: string;
  selected: boolean;
  onPress: () => void;
};

export const StatLineToggle = ({ title, selected, onPress }: ToggleProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.radioButton,
        {
          backgroundColor: selected ? theme.colorOnyx : theme.colorWhite,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[styles.radioButtonText, { color: selected ? theme.colorWhite : theme.colorBlack }]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  radioButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: theme.colorOnyx,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
    maxWidth: 120,
    minHeight: 50,
    maxHeight: 50,
  },
  radioButtonText: {
    fontSize: 14,
  },
});
