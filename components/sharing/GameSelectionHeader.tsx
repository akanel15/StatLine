import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "@/theme";
import { moderateScale } from "@/utils/responsive";

type GameSelectionHeaderProps = {
  selectedCount: number;
  onCancel: () => void;
  onShare: () => void;
};

export function GameSelectionHeader({
  selectedCount,
  onCancel,
  onShare,
}: GameSelectionHeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onCancel} hitSlop={10}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Select Games</Text>
      <TouchableOpacity onPress={onShare} hitSlop={10} disabled={selectedCount === 0}>
        <Text style={[styles.shareText, selectedCount === 0 && styles.shareTextDisabled]}>
          Share ({selectedCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: moderateScale(16),
    color: theme.colorOnyx,
    fontWeight: "500",
  },
  title: {
    fontSize: moderateScale(17),
    fontWeight: "600",
    color: theme.colorOnyx,
  },
  shareText: {
    fontSize: moderateScale(16),
    color: theme.colorOrangePeel,
    fontWeight: "600",
  },
  shareTextDisabled: {
    opacity: 0.4,
  },
});
