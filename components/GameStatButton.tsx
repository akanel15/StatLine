import { memo, useCallback } from "react";
import { theme } from "@/theme";
import { StyleSheet, Text, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";

type Props = {
  title: string;
  onPress: () => void;
  backgroundColor?: string;
  accessibilityLabel?: string;
};

// Wrapped with memo to prevent unnecessary re-renders during rapid stat entry
export const GameStatButton = memo(function GameStatButton({
  title,
  onPress,
  backgroundColor,
  accessibilityLabel,
}: Props) {
  const handlePress = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint="Double tap to add this stat"
      style={({ pressed }) => {
        if (pressed) {
          return [styles.button, styles.buttonPressed];
        }
        return [
          {
            backgroundColor: backgroundColor ? backgroundColor : theme.colorLightGrey,
          },
          styles.button,
        ];
      }}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 75,
    maxHeight: 75,
    minWidth: 120,
    maxWidth: 120,
  },
  buttonPressed: {
    backgroundColor: theme.colorOnyx,
  },
});
