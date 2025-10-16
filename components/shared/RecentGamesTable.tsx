import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GameType, Team } from "@/types/game";
import { initialBaseStats, Stat, StatsType } from "@/types/stats";
import { theme } from "@/theme";
import { Result } from "@/types/player";
import { router } from "expo-router";

type RecentGamesTableProps = {
  games: GameType[];
  context: "team" | "player";
  playerId?: string; // Required for player context
};

export function RecentGamesTable({ games, context, playerId }: RecentGamesTableProps) {
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
      stats[Stat.Points].toString(),
      (stats[Stat.DefensiveRebounds] + stats[Stat.OffensiveRebounds]).toString(),
      stats[Stat.Assists].toString(),
      stats[Stat.Steals].toString(),
      stats[Stat.Blocks].toString(),
      fgm.toString(),
      fga.toString(),
      safeDivide(fgm, fga),
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
      efficiency.toString(),
      stats[Stat.PlusMinus].toString(),
    ];
  };

  // Process all games
  const gameData = games.map(game => {
    const ourScore = game.statTotals[Team.Us][Stat.Points] || 0;
    const theirScore = game.statTotals[Team.Opponent][Stat.Points] || 0;
    const result: Result =
      ourScore > theirScore ? Result.Win : ourScore < theirScore ? Result.Loss : Result.Draw;

    // Get stats based on context
    let statsToShow: string[];
    if (context === "team") {
      statsToShow = formatStats(game.statTotals[Team.Us]);
    } else if (context === "player" && playerId) {
      const playerStats = game.boxScore[playerId] ?? { ...initialBaseStats };
      statsToShow = formatStats(playerStats);
    } else {
      statsToShow = formatStats({ ...initialBaseStats });
    }

    // Get result styles
    const getResultStyles = () => {
      switch (result) {
        case Result.Win:
          return { bgColor: theme.colorLightGreen, textColor: theme.colorGreen };
        case Result.Loss:
          return { bgColor: theme.colorLightRed, textColor: theme.colorRed };
        default:
          return { bgColor: theme.colorLightGrey, textColor: theme.colorGrey };
      }
    };

    const { bgColor, textColor } = getResultStyles();

    return {
      game,
      result,
      ourScore,
      theirScore,
      statsToShow,
      bgColor,
      textColor,
    };
  });

  const handleGamePress = (gameId: string) => {
    router.push(`/(tabs)/games/${gameId}`);
  };

  return (
    <View style={styles.container}>
      {/* Sticky Left Column - All Game Info */}
      <View style={styles.stickyColumn}>
        {/* Header */}
        <View style={styles.stickyHeader}>
          <Text style={styles.stickyHeaderText}>GAME</Text>
        </View>

        {/* All Game Info Rows */}
        {gameData.map(({ game, result, ourScore, theirScore, bgColor, textColor }) => (
          <TouchableOpacity
            key={game.id}
            style={styles.gameInfoCell}
            onPress={() => handleGamePress(game.id)}
            activeOpacity={0.7}
          >
            <View style={styles.gameInfoContent}>
              {/* Result Badge */}
              <View style={[styles.resultBadge, { backgroundColor: bgColor }]}>
                <Text style={[styles.resultText, { color: textColor }]}>
                  {result === Result.Win ? "W" : result === Result.Loss ? "L" : "D"}
                </Text>
              </View>

              {/* Opponent and Score */}
              <View style={styles.gameDetails}>
                <Text style={styles.opponent} numberOfLines={1} ellipsizeMode="tail">
                  vs {game.opposingTeamName}
                </Text>
                <Text style={styles.score}>
                  {ourScore}-{theirScore}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Single ScrollView for All Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
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
          {gameData.map(({ game, statsToShow }) => (
            <View key={game.id} style={styles.statsDataRow}>
              {statsToShow.map((stat, index) => (
                <Text key={index} style={styles.statCell}>
                  {stat}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
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
  gameInfoCell: {
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
  gameInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resultText: {
    fontSize: 10,
    fontWeight: "700",
  },
  gameDetails: {
    flex: 1,
  },
  opponent: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colorOnyx,
    marginBottom: 1,
  },
  score: {
    fontSize: 11,
    fontWeight: "500",
    color: theme.colorGrey,
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
