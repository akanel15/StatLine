import { Text, StyleSheet } from "react-native";
import { SetType } from "@/types/set";
import { Stat } from "@/types/stats";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";
import { BaseStatsTable, BaseTableHeader, BaseTableRow } from "./BaseStatsTable";

type GameSetStatsTableProps = {
  sets: Record<string, SetType>;
  scrollable?: boolean;
};

const HEADINGS = ["Runs", "PTS", "OREB", "AST", "TO", "FG%", "3P%", "FT%"];

const formatSetStats = (set: SetType): string[] => {
  const stats = set.stats;
  const safeDivide = (num: number, den: number) =>
    den === 0 ? "-" : num === 0 ? "0%" : Math.round((num / den) * 100).toString() + "%";

  const fgm = stats[Stat.TwoPointMakes] + stats[Stat.ThreePointMakes];
  const fga = stats[Stat.TwoPointAttempts] + stats[Stat.ThreePointAttempts];

  return [
    set.runCount.toString(),
    stats[Stat.Points].toString(),
    stats[Stat.OffensiveRebounds].toString(),
    stats[Stat.Assists].toString(),
    stats[Stat.Turnovers].toString(),
    safeDivide(fgm, fga),
    safeDivide(stats[Stat.ThreePointMakes], stats[Stat.ThreePointAttempts]),
    safeDivide(stats[Stat.FreeThrowsMade], stats[Stat.FreeThrowsAttempted]),
  ];
};

export function GameSetStatsTable({ sets, scrollable = true }: GameSetStatsTableProps) {
  const headers: BaseTableHeader[] = HEADINGS.map(h => ({ label: h }));

  const setsWithRuns = Object.values(sets).filter(s => s.runCount > 0);

  const tableRows: BaseTableRow[] = setsWithRuns.map(set => ({
    key: set.id,
    leftColumnContent: (
      <Text
        style={styles.labelText}
        numberOfLines={1}
        allowFontScaling={true}
        maxFontSizeMultiplier={1.5}
      >
        {set.name}
      </Text>
    ),
    statValues: formatSetStats(set),
  }));

  return (
    <BaseStatsTable
      stickyColumnHeader="Set"
      stickyColumnWidth={scale(90)}
      headers={headers}
      rows={tableRows}
      scrollable={scrollable}
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
