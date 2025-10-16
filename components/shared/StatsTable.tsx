import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stat, StatsType } from "@/types/stats";
import { theme } from "@/theme";

export type StatsRow = {
  label: string;
  stats: StatsType;
  divisor: number;
};

type StatsTableProps = {
  rows: StatsRow[];
};

const HEADINGS = [
  "PTS",
  "REB",
  "AST",
  "STL",
  "BLK",
  "FGM",
  "FGA",
  "FG%",
  "2PM",
  "2PA",
  "2P%",
  "3PM",
  "3PA",
  "3P%",
  "FTM",
  "FTA",
  "FT%",
  "OREB",
  "DREB",
  "TOV",
  "PF",
  "FD",
  "DEF",
  "EFF",
  "+/-",
];

const formatStats = (stats: StatsType, divisor: number): string[] => {
  const safeDivisor = divisor || 1;
  const safeDivide = (num: number, den: number) =>
    den === 0 ? "-" : Math.round((num / den) * 100).toString() + "%";

  const fgm = stats[Stat.TwoPointMakes] + stats[Stat.ThreePointMakes];
  const fga = stats[Stat.TwoPointAttempts] + stats[Stat.ThreePointAttempts];
  const efficiency =
    stats[Stat.Points] +
    stats[Stat.Assists] +
    stats[Stat.OffensiveRebounds] +
    stats[Stat.DefensiveRebounds] +
    stats[Stat.Steals] +
    stats[Stat.Blocks] +
    fgm -
    (fga + stats[Stat.Turnovers]);

  return [
    (stats[Stat.Points] / safeDivisor).toFixed(1),
    ((stats[Stat.DefensiveRebounds] + stats[Stat.OffensiveRebounds]) / safeDivisor).toFixed(1),
    (stats[Stat.Assists] / safeDivisor).toFixed(1),
    (stats[Stat.Steals] / safeDivisor).toFixed(1),
    (stats[Stat.Blocks] / safeDivisor).toFixed(1),
    (fgm / safeDivisor).toFixed(1),
    (fga / safeDivisor).toFixed(1),
    safeDivide(fgm, fga),
    (stats[Stat.TwoPointMakes] / safeDivisor).toFixed(1),
    (stats[Stat.TwoPointAttempts] / safeDivisor).toFixed(1),
    safeDivide(stats[Stat.TwoPointMakes], stats[Stat.TwoPointAttempts]),
    (stats[Stat.ThreePointMakes] / safeDivisor).toFixed(1),
    (stats[Stat.ThreePointAttempts] / safeDivisor).toFixed(1),
    safeDivide(stats[Stat.ThreePointMakes], stats[Stat.ThreePointAttempts]),
    (stats[Stat.FreeThrowsMade] / safeDivisor).toFixed(1),
    (stats[Stat.FreeThrowsAttempted] / safeDivisor).toFixed(1),
    safeDivide(stats[Stat.FreeThrowsMade], stats[Stat.FreeThrowsAttempted]),
    (stats[Stat.OffensiveRebounds] / safeDivisor).toFixed(1),
    (stats[Stat.DefensiveRebounds] / safeDivisor).toFixed(1),
    (stats[Stat.Turnovers] / safeDivisor).toFixed(1),
    (stats[Stat.FoulsCommitted] / safeDivisor).toFixed(1),
    (stats[Stat.FoulsDrawn] / safeDivisor).toFixed(1),
    (stats[Stat.Deflections] / safeDivisor).toFixed(1),
    (efficiency / safeDivisor).toFixed(1),
    (stats[Stat.PlusMinus] / safeDivisor).toFixed(1),
  ];
};

export function StatsTable({ rows }: StatsTableProps) {
  return (
    <View style={styles.container}>
      {/* Sticky Left Column */}
      <View style={styles.stickyColumn}>
        {/* Header */}
        <View style={styles.stickyHeader}>
          <Text style={styles.stickyHeaderText}>TYPE</Text>
        </View>

        {/* Data Row Labels */}
        {rows.map((row, index) => (
          <View key={index} style={styles.labelCell}>
            <Text style={styles.labelText}>{row.label}</Text>
          </View>
        ))}
      </View>

      {/* Stats Section - Horizontally Scrollable */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View>
          {/* Stats Header Row */}
          <View style={styles.statsHeaderRow}>
            {HEADINGS.map((heading, index) => (
              <Text key={index} style={styles.statHeaderCell}>
                {heading}
              </Text>
            ))}
          </View>

          {/* Data Rows */}
          {rows.map((row, rowIndex) => {
            const formattedStats = formatStats(row.stats, row.divisor);
            return (
              <View key={rowIndex} style={styles.statsDataRow}>
                {formattedStats.map((stat, statIndex) => (
                  <Text key={statIndex} style={styles.statCell}>
                    {stat}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
    borderRadius: 12,
    overflow: "hidden",
  },
  // Sticky left column
  stickyColumn: {
    backgroundColor: theme.colorWhite,
  },
  stickyHeader: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: theme.colorLightGrey,
    borderBottomWidth: 2,
    borderBottomColor: theme.colorOnyx,
    width: 90,
    height: 30,
    justifyContent: "center",
  },
  stickyHeaderText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: theme.colorOnyx,
    textAlign: "center",
  },
  labelCell: {
    width: 90,
    borderRightWidth: 1,
    borderRightColor: theme.colorLightGrey,
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
    backgroundColor: theme.colorWhite,
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 50,
  },
  labelText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colorOnyx,
    textAlign: "center",
  },
  // Scrollable stats section
  scrollView: {
    flex: 1,
  },
  statsHeaderRow: {
    flexDirection: "row",
    paddingVertical: 8,
    backgroundColor: theme.colorLightGrey,
    borderBottomWidth: 2,
    borderBottomColor: theme.colorOnyx,
    height: 30,
    alignItems: "center",
  },
  statsDataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
    minHeight: 50,
  },
  statHeaderCell: {
    width: 50,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: theme.colorOnyx,
    padding: 2,
  },
  statCell: {
    width: 50,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
    color: theme.colorOnyx,
    padding: 2,
  },
});
