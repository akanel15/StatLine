import { theme } from "@/theme";
import { StyleSheet, Text, View } from "react-native";
import { scale, moderateScale } from "@/utils/responsive";

type RecordBadgeProps = {
  wins: number;
  losses: number;
  draws: number;
  label?: string;
};

export function RecordBadge({ wins, losses, draws, label = "Record" }: RecordBadgeProps) {
  return (
    <View style={styles.recordBadge}>
      <Text style={styles.recordText}>
        {wins}-{losses}-{draws} {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  recordBadge: {
    backgroundColor: theme.colorGrey,
    marginTop: scale(8),
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    borderRadius: scale(20),
  },
  recordText: {
    color: theme.colorWhite,
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
});
