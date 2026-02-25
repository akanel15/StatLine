import { Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";
import Feather from "@expo/vector-icons/Feather";

type StickyShareButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function StickyShareButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: StickyShareButtonProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onPress}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colorOrangePeel} />
        ) : (
          <Feather name="upload" size={20} color={theme.colorOrangePeel} />
        )}
        <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
          {loading ? "Sharing..." : label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    backgroundColor: theme.colorWhite,
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colorWhite,
    borderWidth: 1,
    borderColor: theme.colorOrangePeel,
    borderRadius: scale(8),
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    gap: scale(8),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: theme.colorOrangePeel,
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  buttonTextDisabled: {
    opacity: 0.5,
  },
});
