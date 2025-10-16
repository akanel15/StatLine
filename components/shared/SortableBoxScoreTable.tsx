import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GameType, Team } from "@/types/game";
import { initialBaseStats, Stat, StatsType } from "@/types/stats";
import { theme } from "@/theme";

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
  rawStats: number[]; // Store numeric values for sorting
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

  const formatStats = (stats: StatsType): { formatted: string[]; raw: number[] } => {
    const safeDivide = (num: number, den: number) => (den === 0 ? 0 : (num / den) * 100);

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
      // Format percentages (indices 7, 10, 13, 16 are FG%, 2P%, 3P%, FT%)
      if ([7, 10, 13, 16].includes(index)) {
        return value === 0 ? "-" : Math.round(value).toString() + "%";
      }
      return value.toString();
    });

    return { formatted, raw };
  };

  // Build box score data
  const allPlayerIds = [...game.gamePlayedList];
  const playerBoxScoreEntries: BoxScoreEntry[] = allPlayerIds.map(playerId => {
    const player = players[playerId];
    const playerName = player ? player.name : getPlayerDisplayName(playerId);
    const playerNumber = player?.number;
    const displayName = playerNumber ? `#${playerNumber} ${playerName}` : playerName;
    const { formatted, raw } = formatStats(game.boxScore[playerId] ?? { ...initialBaseStats });

    return {
      id: playerId,
      name: displayName,
      stats: formatted,
      isTotal: false,
      rawStats: raw,
    };
  });

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

  // Sort player entries if a column is selected
  let sortedPlayers = [...playerBoxScoreEntries];
  if (sortColumnIndex !== null && sortDirection !== null) {
    sortedPlayers.sort((a, b) => {
      const aValue = a.rawStats[sortColumnIndex];
      const bValue = b.rawStats[sortColumnIndex];

      if (sortDirection === "desc") {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
  }

  const boxScoreData = [...sortedPlayers, ...totalEntries];

  const handleHeaderPress = (index: number) => {
    if (sortColumnIndex === index) {
      // Cycle: desc -> asc -> null
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection(null);
        setSortColumnIndex(null);
      }
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

      {/* All Stats Data Rows */}
      {boxScoreData.map(({ id, stats, isTotal }) => (
        <View key={id} style={styles.statsDataRow}>
          {stats.map((stat, index) => (
            <Text key={index} style={[styles.statCell, isTotal && styles.totalText]}>
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
        {boxScoreData.map(({ id, name, isTotal }) => (
          <View key={id} style={styles.playerNameCell}>
            <Text style={[styles.playerNameText, isTotal && styles.totalText]} numberOfLines={1}>
              {name}
            </Text>
          </View>
        ))}
      </View>

      {/* Stats Section - Scrollable or Not */}
      {scrollable ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
          {statsContent}
        </ScrollView>
      ) : (
        <View style={styles.scrollView}>{statsContent}</View>
      )}
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
  totalText: {
    fontWeight: "700",
  },
});
