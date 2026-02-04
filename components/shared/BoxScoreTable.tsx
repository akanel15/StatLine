import { ScrollView, StyleSheet, Text, View } from "react-native";
import { GameType, Team } from "@/types/game";
import { initialBaseStats, Stat, StatsType } from "@/types/stats";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";

type BoxScoreTableProps = {
  game: GameType;
  players: Record<string, any>;
  stickyColumnHeader?: string;
  scrollable?: boolean;
  getPlayerDisplayName: (playerId: string) => string;
};

export function BoxScoreTable({
  game,
  players,
  stickyColumnHeader = "Player",
  scrollable = true,
  getPlayerDisplayName,
}: BoxScoreTableProps) {
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

  // Build box score data
  const allPlayerIds = [...game.gamePlayedList];
  const playerBoxScoreEntries = allPlayerIds.map(playerId => {
    const player = players[playerId];
    const playerName = player ? player.name : getPlayerDisplayName(playerId);
    const playerNumber = player?.number;
    const displayName =
      playerNumber !== undefined && playerNumber !== null && playerNumber !== ""
        ? `#${playerNumber} ${playerName}`
        : playerName;

    return {
      id: playerId,
      name: displayName,
      stats: formatStats(game.boxScore[playerId] ?? { ...initialBaseStats }),
      isTotal: false,
      isTeam: false,
    };
  });

  // Build team stats row if team stats exist
  const teamStats = game.boxScore["Team"];
  const hasTeamStats =
    teamStats && Object.values(teamStats).some(val => typeof val === "number" && val !== 0);
  const teamEntry = hasTeamStats
    ? {
        id: "Team",
        name: "Team",
        stats: formatStats(teamStats),
        isTotal: false,
        isTeam: true,
      }
    : null;

  const boxScoreData = [
    ...playerBoxScoreEntries,
    ...(teamEntry ? [teamEntry] : []),
    {
      id: "Us",
      name: "Total",
      stats: formatStats(game.statTotals[Team.Us]),
      isTotal: true,
      isTeam: false,
    },
    {
      id: "Opponent",
      name: game.opposingTeamName,
      stats: formatStats(game.statTotals[Team.Opponent]),
      isTotal: true,
      isTeam: false,
    },
  ];

  const statsContent = (
    <View>
      {/* Stats Header Row */}
      <View style={styles.statsHeaderRow}>
        {headings.map((heading, index) => (
          <Text key={index} style={styles.statHeaderCell}>
            {heading}
          </Text>
        ))}
      </View>

      {/* All Stats Data Rows */}
      {boxScoreData.map(({ id, stats, isTotal, isTeam }) => (
        <View key={id} style={styles.statsDataRow}>
          {stats.map((stat, index) => (
            <Text
              key={index}
              style={[styles.statCell, isTotal && styles.totalText, isTeam && styles.teamText]}
            >
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
        {boxScoreData.map(({ id, name, isTotal, isTeam }) => (
          <View key={id} style={styles.playerNameCell}>
            <Text
              style={[
                styles.playerNameText,
                isTotal && styles.totalText,
                isTeam && styles.teamText,
              ]}
              numberOfLines={1}
            >
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
    width: scale(130),
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
  playerNameCell: {
    width: scale(130),
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
  playerNameText: {
    fontSize: moderateScale(12),
    fontWeight: "500",
    color: theme.colorOnyx,
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
  totalText: {
    fontWeight: "700",
  },
  teamText: {
    color: theme.colorGrey,
  },
});
