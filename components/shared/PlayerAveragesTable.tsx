import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PlayerType } from "@/types/player";
import { Stat } from "@/types/stats";
import { theme } from "@/theme";
import { calculatePlayerAverages } from "@/logic/playerAverages";
import { router } from "expo-router";

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

export function PlayerAveragesTable({
  players,
  stickyColumnHeader = "Player",
}: PlayerAveragesTableProps) {
  const [sortColumnIndex, setSortColumnIndex] = useState<number>(0); // Default sort by points
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const headings = [
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

  const formatAverages = (
    averages: ReturnType<typeof calculatePlayerAverages>,
  ): { formatted: string[]; raw: number[] } => {
    const safeDivide = (num: number, den: number) => (den === 0 ? 0 : (num / den) * 100);

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
      // Format percentages (indices 7, 10, 13, 16 are FG%, 2P%, 3P%, FT%)
      if ([7, 10, 13, 16].includes(index)) {
        return value === 0 ? "-" : Math.round(value).toString() + "%";
      }
      // Format other stats to 1 decimal place
      return value.toFixed(1);
    });

    return { formatted, raw };
  };

  // Filter and build player average entries
  const playersWithGames = players.filter(player => player.gameNumbers.gamesPlayed > 0);

  const playerAverageEntries: PlayerAverageEntry[] = playersWithGames.map(player => {
    const averages = calculatePlayerAverages(player.stats, player.gameNumbers.gamesPlayed);
    const { formatted, raw } = formatAverages(averages);
    const displayName = player.number ? `#${player.number} ${player.name}` : player.name;

    return {
      id: player.id,
      name: displayName,
      stats: formatted,
      rawStats: raw,
    };
  });

  // Sort player entries
  const sortedPlayers = [...playerAverageEntries].sort((a, b) => {
    if (sortDirection === null) return 0;

    const aValue = a.rawStats[sortColumnIndex];
    const bValue = b.rawStats[sortColumnIndex];

    if (sortDirection === "desc") {
      return bValue - aValue;
    } else {
      return aValue - bValue;
    }
  });

  const handleHeaderPress = (index: number) => {
    if (sortColumnIndex === index) {
      // Cycle: desc -> asc -> desc (always keep sorted)
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      // New column, start with descending
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
    router.navigate(`/players/${playerId}`);
  };

  if (playersWithGames.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No player data available yet.</Text>
        <Text style={styles.emptySubtext}>
          Players will appear here after they play their first game.
        </Text>
      </View>
    );
  }

  const statsContent = (
    <View>
      {/* Stats Header Row */}
      <View style={styles.statsHeaderRow}>
        {headings.map((heading, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleHeaderPress(index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.statHeaderCell,
                sortColumnIndex === index && styles.statHeaderCellActive,
              ]}
            >
              {heading}
              {getSortIndicator(index)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* All Player Stats Data Rows */}
      {sortedPlayers.map(({ id, stats }) => (
        <View key={id} style={styles.statsDataRow}>
          {stats.map((stat, index) => (
            <Text key={index} style={styles.statCell}>
              {stat}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sticky Left Column - All Player Names */}
      <View style={styles.stickyColumn}>
        {/* Header */}
        <View style={styles.stickyHeader}>
          <Text style={styles.stickyHeaderText}>{stickyColumnHeader}</Text>
        </View>

        {/* All Player Name Rows */}
        {sortedPlayers.map(({ id, name }) => (
          <TouchableOpacity
            key={id}
            style={styles.playerNameCell}
            onPress={() => handlePlayerPress(id)}
            activeOpacity={0.7}
          >
            <Text style={styles.playerNameText} numberOfLines={1}>
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Section - Horizontally Scrollable */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {statsContent}
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
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    backgroundColor: theme.colorWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorGrey,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colorGrey,
    textAlign: "center",
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
    width: 140,
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
  playerNameCell: {
    width: 140,
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
  playerNameText: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colorOnyx,
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
  statHeaderCellActive: {
    color: theme.colorOrangePeel,
    fontWeight: "900",
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
