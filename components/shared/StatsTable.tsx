import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stat, StatsType } from "@/types/stats";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";

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
    den === 0 ? "-" : num === 0 ? "0%" : Math.round((num / den) * 100).toString() + "%";
  const formatStat = (value: number): string => {
    return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  };

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
    formatStat(stats[Stat.Points] / safeDivisor),
    formatStat((stats[Stat.DefensiveRebounds] + stats[Stat.OffensiveRebounds]) / safeDivisor),
    formatStat(stats[Stat.Assists] / safeDivisor),
    formatStat(stats[Stat.Steals] / safeDivisor),
    formatStat(stats[Stat.Blocks] / safeDivisor),
    formatStat(fgm / safeDivisor),
    formatStat(fga / safeDivisor),
    safeDivide(fgm, fga),
    formatStat(stats[Stat.TwoPointMakes] / safeDivisor),
    formatStat(stats[Stat.TwoPointAttempts] / safeDivisor),
    safeDivide(stats[Stat.TwoPointMakes], stats[Stat.TwoPointAttempts]),
    formatStat(stats[Stat.ThreePointMakes] / safeDivisor),
    formatStat(stats[Stat.ThreePointAttempts] / safeDivisor),
    safeDivide(stats[Stat.ThreePointMakes], stats[Stat.ThreePointAttempts]),
    formatStat(stats[Stat.FreeThrowsMade] / safeDivisor),
    formatStat(stats[Stat.FreeThrowsAttempted] / safeDivisor),
    safeDivide(stats[Stat.FreeThrowsMade], stats[Stat.FreeThrowsAttempted]),
    formatStat(stats[Stat.OffensiveRebounds] / safeDivisor),
    formatStat(stats[Stat.DefensiveRebounds] / safeDivisor),
    formatStat(stats[Stat.Turnovers] / safeDivisor),
    formatStat(stats[Stat.FoulsCommitted] / safeDivisor),
    formatStat(stats[Stat.FoulsDrawn] / safeDivisor),
    formatStat(stats[Stat.Deflections] / safeDivisor),
    formatStat(efficiency / safeDivisor),
    formatStat(stats[Stat.PlusMinus] / safeDivisor),
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
    borderRadius: scale(12),
    overflow: "hidden",
  },
  // Sticky left column
  stickyColumn: {
    backgroundColor: theme.colorWhite,
  },
  stickyHeader: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(8),
    backgroundColor: theme.colorLightGrey,
    borderBottomWidth: 2,
    borderBottomColor: theme.colorOnyx,
    width: scale(90),
    height: scale(30),
    justifyContent: "center",
  },
  stickyHeaderText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    textTransform: "uppercase",
    color: theme.colorOnyx,
    textAlign: "center",
  },
  labelCell: {
    width: scale(90),
    borderRightWidth: 1,
    borderRightColor: theme.colorLightGrey,
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
    backgroundColor: theme.colorWhite,
    justifyContent: "center",
    paddingVertical: scale(8),
    paddingHorizontal: scale(8),
    minHeight: scale(50),
  },
  labelText: {
    fontSize: moderateScale(13),
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
    paddingVertical: scale(8),
    backgroundColor: theme.colorLightGrey,
    borderBottomWidth: 2,
    borderBottomColor: theme.colorOnyx,
    height: scale(30),
    alignItems: "center",
  },
  statsDataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(8),
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
    minHeight: scale(50),
  },
  statHeaderCell: {
    width: scale(45),
    textAlign: "center",
    fontSize: moderateScale(10),
    fontWeight: "700",
    textTransform: "uppercase",
    color: theme.colorOnyx,
    padding: scale(2),
  },
  statCell: {
    width: scale(45),
    textAlign: "center",
    fontSize: moderateScale(13),
    fontWeight: "500",
    color: theme.colorOnyx,
    padding: scale(2),
  },
});
