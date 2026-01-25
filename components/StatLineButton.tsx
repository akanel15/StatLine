import { memo } from "react";
import { theme } from "@/theme";
import { StyleSheet, Text, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { scale, moderateScale } from "@/utils/responsive";

type Props = {
  title: string;
  onPress: () => void;
  color?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
};

export const StatLineButton = memo(function StatLineButton({
  title,
  onPress,
  color,
  accessibilityLabel,
  accessibilityHint,
  disabled,
}: Props) {
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => {
        if (pressed) {
          return [styles.button, styles.buttonPressed];
        }
        return [styles.button, { backgroundColor: color ? color : theme.colorOrangePeel }];
      }}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  text: {
    color: theme.colorWhite,
    fontSize: moderateScale(18),
    fontWeight: "bold",
    textAlign: "center",
  },
  button: {
    paddingHorizontal: scale(2),
    paddingVertical: scale(12),
    borderRadius: scale(6),
    backgroundColor: theme.colorOrangePeel,
  },
  buttonPressed: {
    backgroundColor: theme.colorBlack,
  },
});
