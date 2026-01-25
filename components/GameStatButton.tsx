import { memo, useCallback } from "react";
import { theme } from "@/theme";
import { StyleSheet, Text, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { scale, moderateScale, getStatButtonHeight, getButtonWidth } from "@/utils/responsive";

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
    fontSize: moderateScale(14),
    textAlign: "center",
  },
  button: {
    paddingVertical: scale(4),
    paddingHorizontal: scale(8),
    borderRadius: scale(6),
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: getButtonWidth(),
    height: getStatButtonHeight(75),
  },
  buttonPressed: {
    backgroundColor: theme.colorOnyx,
  },
});
