import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { GameType, Team } from "@/types/game";
import { initialBaseStats, Stat, StatsType } from "@/types/stats";
import { theme } from "@/theme";
import { moderateScale } from "@/utils/responsive";
import { BaseStatsTable, BaseTableHeader, BaseTableRow } from "./BaseStatsTable";

type SortableBoxScoreTableProps = {
  game: GameType;
  players: Record<string, any>;
  stickyColumnHeader?: string;
  scrollable?: boolean;
  getPlayerDisplayName: (playerId: string) => string;
};

type SortDirection = "asc" | "desc" | null;

type BoxScoreEntry = {
  id: string;
  name: string;
  stats: string[];
  isTotal: boolean;
  isTeam?: boolean;
  rawStats: number[];
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

const formatStats = (stats: StatsType): { formatted: string[]; raw: number[] } => {
  const safeDivide = (num: number, den: number) => (den === 0 ? -1 : (num / den) * 100);

  const raw = [
    stats[Stat.Points],
    stats[Stat.DefensiveRebounds] + stats[Stat.OffensiveRebounds],
    stats[Stat.Assists],
    stats[Stat.Steals],
    stats[Stat.Blocks],
    stats[Stat.TwoPointMakes] + stats[Stat.ThreePointMakes],
    stats[Stat.TwoPointAttempts] + stats[Stat.ThreePointAttempts],
    safeDivide(
      stats[Stat.TwoPointMakes] + stats[Stat.ThreePointMakes],
      stats[Stat.TwoPointAttempts] + stats[Stat.ThreePointAttempts],
    ),
    stats[Stat.TwoPointMakes],
    stats[Stat.TwoPointAttempts],
    safeDivide(stats[Stat.TwoPointMakes], stats[Stat.TwoPointAttempts]),
    stats[Stat.ThreePointMakes],
    stats[Stat.ThreePointAttempts],
    safeDivide(stats[Stat.ThreePointMakes], stats[Stat.ThreePointAttempts]),
    stats[Stat.FreeThrowsMade],
    stats[Stat.FreeThrowsAttempted],
    safeDivide(stats[Stat.FreeThrowsMade], stats[Stat.FreeThrowsAttempted]),
    stats[Stat.OffensiveRebounds],
    stats[Stat.DefensiveRebounds],
    stats[Stat.Turnovers],
    stats[Stat.FoulsCommitted],
    stats[Stat.FoulsDrawn],
    stats[Stat.Deflections],
    stats[Stat.Points] +
      stats[Stat.Assists] +
      stats[Stat.OffensiveRebounds] +
      stats[Stat.DefensiveRebounds] +
      stats[Stat.Steals] +
      stats[Stat.Blocks] +
      stats[Stat.TwoPointMakes] +
      stats[Stat.ThreePointMakes] -
      (stats[Stat.TwoPointAttempts] + stats[Stat.ThreePointAttempts] + stats[Stat.Turnovers]),
    stats[Stat.PlusMinus],
  ];

  const formatted = raw.map((value, index) => {
    if ([7, 10, 13, 16].includes(index)) {
      return value === -1 ? "-" : Math.round(value).toString() + "%";
    }
    return value.toString();
  });

  return { formatted, raw };
};

export function SortableBoxScoreTable({
  game,
  players,
  stickyColumnHeader = "Player",
  scrollable = true,
  getPlayerDisplayName,
}: SortableBoxScoreTableProps) {
  const [sortColumnIndex, setSortColumnIndex] = useState<number | null>(0);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Build box score data
  const allPlayerIds = [...game.gamePlayedList];
  const playerBoxScoreEntries: BoxScoreEntry[] = allPlayerIds.map(playerId => {
    const player = players[playerId];
    const playerName = player ? player.name : getPlayerDisplayName(playerId);
    const playerNumber = player?.number;
    const displayName =
      playerNumber !== undefined && playerNumber !== null && playerNumber !== ""
        ? `#${playerNumber} ${playerName}`
        : playerName;
    const { formatted, raw } = formatStats(game.boxScore[playerId] ?? { ...initialBaseStats });

    return {
      id: playerId,
      name: displayName,
      stats: formatted,
      isTotal: false,
      rawStats: raw,
    };
  });

  const teamStats = game.boxScore["Team"];
  const hasTeamStats =
    teamStats && Object.values(teamStats).some(val => typeof val === "number" && val !== 0);
  const teamEntry: BoxScoreEntry | null = hasTeamStats
    ? {
        id: "Team",
        name: "Team",
        stats: formatStats(teamStats).formatted,
        rawStats: formatStats(teamStats).raw,
        isTotal: false,
        isTeam: true,
      }
    : null;

  const usStats = formatStats(game.statTotals[Team.Us]);
  const opponentStats = formatStats(game.statTotals[Team.Opponent]);

  const totalEntries: BoxScoreEntry[] = [
    {
      id: "Us",
      name: "Total",
      stats: usStats.formatted,
      rawStats: usStats.raw,
      isTotal: true,
    },
    {
      id: "Opponent",
      name: game.opposingTeamName,
      stats: opponentStats.formatted,
      rawStats: opponentStats.raw,
      isTotal: true,
    },
  ];

  // Sort player entries
  let sortedPlayers = [...playerBoxScoreEntries];
  if (sortColumnIndex !== null && sortDirection !== null) {
    sortedPlayers.sort((a, b) => {
      const aValue = a.rawStats[sortColumnIndex];
      const bValue = b.rawStats[sortColumnIndex];
      return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
    });
  }

  const boxScoreData = [...sortedPlayers, ...(teamEntry ? [teamEntry] : []), ...totalEntries];

  const handleHeaderPress = (index: number) => {
    if (sortColumnIndex === index) {
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection(null);
        setSortColumnIndex(null);
      }
    } else {
      setSortColumnIndex(index);
      setSortDirection("desc");
    }
  };

  const getSortIndicator = (index: number) => {
    if (sortColumnIndex === index) {
      return sortDirection === "desc" ? " ▼" : " ▲";
    }
    return "";
  };

  const headers: BaseTableHeader[] = HEADINGS.map((heading, index) => ({
    label: heading + getSortIndicator(index),
    onPress: () => handleHeaderPress(index),
    isActive: sortColumnIndex === index,
  }));

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
