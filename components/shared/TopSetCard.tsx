import { theme } from "@/theme";
import { SetType } from "@/types/set";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Text, View } from "react-native";
import { IconAvatar } from "./IconAvatar";

type TopSetCardProps = {
  set: SetType;
  primaryStat: { label: string; value: string };
  secondaryStat: { label: string; value: string };
  onPress?: () => void;
};

export function TopSetCard({ set, primaryStat, secondaryStat, onPress }: TopSetCardProps) {
  return (
    <TouchableOpacity
      style={styles.setItem}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.setInfo}>
        <View style={styles.setAvatar}>
          <IconAvatar size={40} icon={set.name.charAt(0).toUpperCase()} />
        </View>
        <View>
          <Text style={styles.setName}>{set.name}</Text>
        </View>
      </View>
      <View style={styles.setStats}>
        <Text style={styles.primaryStat}>
          {primaryStat.value} {primaryStat.label}
        </Text>
        <Text style={styles.secondaryStat}>
          {secondaryStat.value} {secondaryStat.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  setItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colorLightGrey,
  },
  setInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  setAvatar: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  setName: {
    fontWeight: "600",
    fontSize: 16,
    color: theme.colorOnyx,
    flexShrink: 1,
  },
  setStats: {
    alignItems: "flex-end",
  },
  primaryStat: {
    fontWeight: "700",
    fontSize: 16,
    color: theme.colorOrangePeel,
  },
  secondaryStat: {
    fontSize: 12,
    color: theme.colorGrey,
  },
});
