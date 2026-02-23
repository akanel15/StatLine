import { Text, StyleSheet } from "react-native";
import { Stat, StatsType } from "@/types/stats";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";
import { BaseStatsTable, BaseTableHeader, BaseTableRow } from "./BaseStatsTable";

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
  const headers: BaseTableHeader[] = HEADINGS.map(h => ({ label: h }));

  const tableRows: BaseTableRow[] = rows.map((row, index) => ({
    key: index.toString(),
    leftColumnContent: (
      <Text style={styles.labelText} allowFontScaling={true} maxFontSizeMultiplier={1.5}>
        {row.label}
      </Text>
    ),
    statValues: formatStats(row.stats, row.divisor),
  }));

  return (
    <BaseStatsTable
      stickyColumnHeader="TYPE"
      stickyColumnWidth={scale(90)}
      headers={headers}
      rows={tableRows}
    />
  );
}

const styles = StyleSheet.create({
  labelText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: theme.colorOnyx,
    textAlign: "center",
  },
});
