import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PlayerType } from "@/types/player";
import { Stat } from "@/types/stats";
import { theme } from "@/theme";
import { calculatePlayerAverages } from "@/logic/playerAverages";
import { router } from "expo-router";
import { scale, moderateScale } from "@/utils/responsive";
import { BaseStatsTable, BaseTableHeader, BaseTableRow } from "./BaseStatsTable";

type PlayerAveragesTableProps = {
  players: PlayerType[];
  stickyColumnHeader?: string;
};

type SortDirection = "asc" | "desc" | null;

type PlayerAverageEntry = {
  id: string;
  name: string;
  stats: string[];
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

export function PlayerAveragesTable({
  players,
  stickyColumnHeader = "Player",
}: PlayerAveragesTableProps) {
  const [sortColumnIndex, setSortColumnIndex] = useState<number>(0);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const formatAverages = (
    averages: ReturnType<typeof calculatePlayerAverages>,
  ): { formatted: string[]; raw: number[] } => {
    const safeDivide = (num: number, den: number) => (den === 0 ? -1 : (num / den) * 100);

    const raw = [
      averages[Stat.Points],
      averages[Stat.DefensiveRebounds] + averages[Stat.OffensiveRebounds],
      averages[Stat.Assists],
      averages[Stat.Steals],
      averages[Stat.Blocks],
      averages[Stat.TwoPointMakes] + averages[Stat.ThreePointMakes],
      averages[Stat.TwoPointAttempts] + averages[Stat.ThreePointAttempts],
      safeDivide(
        averages[Stat.TwoPointMakes] + averages[Stat.ThreePointMakes],
        averages[Stat.TwoPointAttempts] + averages[Stat.ThreePointAttempts],
      ),
      averages[Stat.TwoPointMakes],
      averages[Stat.TwoPointAttempts],
      safeDivide(averages[Stat.TwoPointMakes], averages[Stat.TwoPointAttempts]),
      averages[Stat.ThreePointMakes],
      averages[Stat.ThreePointAttempts],
      safeDivide(averages[Stat.ThreePointMakes], averages[Stat.ThreePointAttempts]),
      averages[Stat.FreeThrowsMade],
      averages[Stat.FreeThrowsAttempted],
      safeDivide(averages[Stat.FreeThrowsMade], averages[Stat.FreeThrowsAttempted]),
      averages[Stat.OffensiveRebounds],
      averages[Stat.DefensiveRebounds],
      averages[Stat.Turnovers],
      averages[Stat.FoulsCommitted],
      averages[Stat.FoulsDrawn],
      averages[Stat.Deflections],
      averages[Stat.Points] +
        averages[Stat.Assists] +
        averages[Stat.OffensiveRebounds] +
        averages[Stat.DefensiveRebounds] +
        averages[Stat.Steals] +
        averages[Stat.Blocks] +
        averages[Stat.TwoPointMakes] +
        averages[Stat.ThreePointMakes] -
        (averages[Stat.TwoPointAttempts] +
          averages[Stat.ThreePointAttempts] +
          averages[Stat.Turnovers]),
      averages[Stat.PlusMinus],
    ];

    const formatted = raw.map((value, index) => {
      if ([7, 10, 13, 16].includes(index)) {
        return value === -1 ? "-" : Math.round(value).toString() + "%";
      }
      return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
    });

    return { formatted, raw };
  };

  const playersWithGames = players.filter(player => player.gameNumbers.gamesPlayed > 0);

  if (playersWithGames.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText} allowFontScaling={true} maxFontSizeMultiplier={1.5}>
          No player data available yet.
        </Text>
        <Text style={styles.emptySubtext} allowFontScaling={true} maxFontSizeMultiplier={1.5}>
          Players will appear here after they play their first game.
        </Text>
      </View>
    );
  }

  const playerAverageEntries: PlayerAverageEntry[] = playersWithGames.map(player => {
    const averages = calculatePlayerAverages(player.stats, player.gameNumbers.gamesPlayed);
    const { formatted, raw } = formatAverages(averages);
    const displayName =
      player.number !== undefined && player.number !== null && player.number !== ""
        ? `#${player.number} ${player.name}`
        : player.name;

    return {
      id: player.id,
      name: displayName,
      stats: formatted,
      rawStats: raw,
    };
  });

  const sortedPlayers = [...playerAverageEntries].sort((a, b) => {
    if (sortDirection === null) return 0;
    const aValue = a.rawStats[sortColumnIndex];
    const bValue = b.rawStats[sortColumnIndex];
    return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
  });

  const handleHeaderPress = (index: number) => {
    if (sortColumnIndex === index) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
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

  const handlePlayerPress = (playerId: string) => {
    router.push(`/(tabs)/players/${playerId}`);
  };

  const headers: BaseTableHeader[] = HEADINGS.map((heading, index) => ({
    label: heading + getSortIndicator(index),
    onPress: () => handleHeaderPress(index),
    isActive: sortColumnIndex === index,
  }));

  const tableRows: BaseTableRow[] = sortedPlayers.map(entry => ({
    key: entry.id,
    leftColumnContent: (
      <TouchableOpacity onPress={() => handlePlayerPress(entry.id)} activeOpacity={0.7}>
        <Text
          style={styles.playerNameText}
          numberOfLines={1}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.5}
        >
          {entry.name}
        </Text>
      </TouchableOpacity>
    ),
    statValues: entry.stats,
  }));

  return (
    <BaseStatsTable stickyColumnHeader={stickyColumnHeader} headers={headers} rows={tableRows} />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    padding: scale(32),
    alignItems: "center",
    backgroundColor: theme.colorWhite,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
  },
  emptyText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: theme.colorGrey,
    marginBottom: scale(8),
  },
  emptySubtext: {
    fontSize: moderateScale(14),
    color: theme.colorGrey,
    textAlign: "center",
  },
  playerNameText: {
    fontSize: moderateScale(12),
    fontWeight: "500",
    color: theme.colorOnyx,
  },
});
