import { StyleSheet, View, Text, Pressable } from "react-native";
import { theme } from "@/theme";
import { Link } from "expo-router";
import { Stat } from "@/types/stats";
import { SetType } from "@/types/set";
import { IconAvatar } from "./shared/IconAvatar";

// Helper functions for calculating statistics
const calculatePerRunStat = (statValue: number, runCount: number): number => {
  return runCount > 0 ? statValue / runCount : 0;
};

const formatPerRun = (value: number): string => {
  return value.toFixed(1);
};

export function SetCard({ set }: { set: SetType }) {
  // Calculate key statistics
  const pointsPerRun = calculatePerRunStat(set.stats[Stat.Points], set.runCount);
  const assistsPerRun = calculatePerRunStat(set.stats[Stat.Assists], set.runCount);

  return (
    <View style={styles.setCard}>
      <Link href={`/sets/${set.id}`} asChild>
        <Pressable style={styles.cardContent}>
          <IconAvatar size={60} icon="📋" />
          <View style={styles.details}>
            <Text numberOfLines={1} style={styles.setName}>
              {set.name}
            </Text>
            {set.runCount > 0 ? (
              <>
                <Text style={styles.runCount}>
                  {set.runCount} {set.runCount === 1 ? "run" : "runs"}
                </Text>
                <Text style={styles.stats}>
                  {formatPerRun(pointsPerRun)} pts/run • {formatPerRun(assistsPerRun)} ast/run
                </Text>
              </>
            ) : (
              <Text style={styles.subtitle}>No runs yet</Text>
            )}
          </View>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  setCard: {
    flexDirection: "row",
    shadowColor: theme.colorOnyx,
    backgroundColor: theme.colorWhite,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  details: {
    marginLeft: 16,
    flex: 1,
    justifyContent: "center",
  },
  setName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: theme.colorOnyx,
  },
  runCount: {
    fontSize: 14,
    color: theme.colorOnyx,
    marginBottom: 2,
  },
  stats: {
    fontSize: 12,
    color: theme.colorGrey,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colorGrey,
  },
});
