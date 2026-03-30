import { StyleSheet, Text } from "react-native";
import { GameType, Team } from "@/types/game";
import { initialBaseStats, Stat, StatsType } from "@/types/stats";
import { theme } from "@/theme";
import { moderateScale } from "@/utils/responsive";
import { BaseStatsTable, BaseTableHeader, BaseTableRow } from "./BaseStatsTable";
import { formatMinutes } from "@/logic/minutesCalculation";

type BoxScoreTableProps = {
  game: GameType;
  players: Record<string, any>;
  stickyColumnHeader?: string;
  scrollable?: boolean;
  getPlayerDisplayName: (playerId: string) => string;
  minutesData?: Record<string, number>;
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

const formatStats = (stats: StatsType): string[] => {
  const safeDivide = (num: number, den: number) =>
    den === 0 ? "-" : num === 0 ? "0%" : Math.round((num / den) * 100).toString() + "%";

  return [
    stats[Stat.Points].toString(),
    (stats[Stat.DefensiveRebounds] + stats[Stat.OffensiveRebounds]).toString(),
    stats[Stat.Assists].toString(),
    stats[Stat.Steals].toString(),
    stats[Stat.Blocks].toString(),
    (stats[Stat.TwoPointMakes] + stats[Stat.ThreePointMakes]).toString(),
    (stats[Stat.TwoPointAttempts] + stats[Stat.ThreePointAttempts]).toString(),
    safeDivide(
      stats[Stat.TwoPointMakes] + stats[Stat.ThreePointMakes],
      stats[Stat.TwoPointAttempts] + stats[Stat.ThreePointAttempts],
    ),
    stats[Stat.TwoPointMakes].toString(),
    stats[Stat.TwoPointAttempts].toString(),
    safeDivide(stats[Stat.TwoPointMakes], stats[Stat.TwoPointAttempts]),
    stats[Stat.ThreePointMakes].toString(),
    stats[Stat.ThreePointAttempts].toString(),
    safeDivide(stats[Stat.ThreePointMakes], stats[Stat.ThreePointAttempts]),
    stats[Stat.FreeThrowsMade].toString(),
    stats[Stat.FreeThrowsAttempted].toString(),
    safeDivide(stats[Stat.FreeThrowsMade], stats[Stat.FreeThrowsAttempted]),
    stats[Stat.OffensiveRebounds].toString(),
    stats[Stat.DefensiveRebounds].toString(),
    stats[Stat.Turnovers].toString(),
    stats[Stat.FoulsCommitted].toString(),
    stats[Stat.FoulsDrawn].toString(),
    stats[Stat.Deflections].toString(),
    (
      stats[Stat.Points] +
      stats[Stat.Assists] +
      stats[Stat.OffensiveRebounds] +
      stats[Stat.DefensiveRebounds] +
      stats[Stat.Steals] +
      stats[Stat.Blocks] +
      stats[Stat.TwoPointMakes] +
      stats[Stat.ThreePointMakes] -
      (stats[Stat.TwoPointAttempts] + stats[Stat.ThreePointAttempts] + stats[Stat.Turnovers])
    ).toString(),
    stats[Stat.PlusMinus].toString(),
  ];
};

export function BoxScoreTable({
  game,
  players,
  stickyColumnHeader = "Player",
  scrollable = true,
  getPlayerDisplayName,
  minutesData,
}: BoxScoreTableProps) {
  const hasMinutes = minutesData !== undefined;
  const activeHeadings = hasMinutes ? ["MIN", ...HEADINGS] : HEADINGS;
  const headers: BaseTableHeader[] = activeHeadings.map(h => ({ label: h }));

  // Build box score data
  const allPlayerIds = [...game.gamePlayedList];
  const playerEntries = allPlayerIds.map(playerId => {
    const player = players[playerId];
    const playerName = player ? player.name : getPlayerDisplayName(playerId);
    const playerNumber = player?.number;
    const displayName =
      playerNumber !== undefined && playerNumber !== null && playerNumber !== ""
        ? `#${playerNumber} ${playerName}`
        : playerName;

    const stats = formatStats(game.boxScore[playerId] ?? { ...initialBaseStats });
    const playerSeconds = hasMinutes ? (minutesData[playerId] ?? 0) : 0;

    return {
      id: playerId,
      name: displayName,
      stats: hasMinutes ? [formatMinutes(playerSeconds), ...stats] : stats,
      isTotal: false,
      isTeam: false,
    };
  });

  const teamStats = game.boxScore["Team"];
  const hasTeamStats =
    teamStats && Object.values(teamStats).some(val => typeof val === "number" && val !== 0);
  const teamFormatted = hasTeamStats ? formatStats(teamStats) : null;
  const teamEntry = teamFormatted
    ? {
        id: "Team",
        name: "Team",
        stats: hasMinutes ? ["", ...teamFormatted] : teamFormatted,
        isTotal: false,
        isTeam: true,
      }
    : null;

  const usFormatted = formatStats(game.statTotals[Team.Us]);
  const oppFormatted = formatStats(game.statTotals[Team.Opponent]);

  const boxScoreData = [
    ...playerEntries,
    ...(teamEntry ? [teamEntry] : []),
    {
      id: "Us",
      name: "Total",
      stats: hasMinutes ? ["", ...usFormatted] : usFormatted,
      isTotal: true,
      isTeam: false,
    },
    {
      id: "Opponent",
      name: game.opposingTeamName,
      stats: hasMinutes ? ["", ...oppFormatted] : oppFormatted,
      isTotal: true,
      isTeam: false,
    },
  ];

  const tableRows: BaseTableRow[] = boxScoreData.map(entry => ({
    key: entry.id,
    leftColumnContent: (
      <Text
        style={[
          styles.playerNameText,
          entry.isTotal && styles.totalText,
          entry.isTeam && styles.teamText,
        ]}
        numberOfLines={1}
        allowFontScaling={true}
        maxFontSizeMultiplier={1.5}
      >
        {entry.name}
      </Text>
    ),
    statValues: entry.stats,
    statStyle: entry.isTotal ? ("total" as const) : entry.isTeam ? ("team" as const) : undefined,
  }));

  return (
    <BaseStatsTable
      stickyColumnHeader={stickyColumnHeader}
      headers={headers}
      rows={tableRows}
      scrollable={scrollable}
    />
  );
}

const styles = StyleSheet.create({
  playerNameText: {
    fontSize: moderateScale(12),
    fontWeight: "500",
    color: theme.colorOnyx,
  },
  totalText: {
    fontWeight: "700",
  },
  teamText: {
    color: theme.colorGrey,
  },
});
