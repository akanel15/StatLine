import { StyleSheet, Text, View } from "react-native";
import { GameType, Team } from "@/types/game";
import { initialBaseStats, Stat, StatsType } from "@/types/stats";
import { theme } from "@/theme";
import { Result } from "@/types/player";

type ShareableRecentGamesTableProps = {
  games: GameType[];
  context: "team" | "player";
  playerId?: string; // Required for player context
  playerName?: string; // For player context title
  teamName?: string; // For team context title
};

export function ShareableRecentGamesTable({
  games,
  context,
  playerId,
  playerName,
  teamName,
}: ShareableRecentGamesTableProps) {
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

  // Build game rows with stats
  const gameRows = games.map(game => {
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

    return {
      id: game.id,
      opponent: `vs ${game.opposingTeamName}`,
      score: `${ourScore}-${theirScore}`,
      result,
      stats: statsToShow,
    };
  });

  const displayTitle =
    context === "team"
      ? `${teamName || "Team"} - Recent Games`
      : `${playerName || "Player"} - Recent Games`;

  return (
    <View style={styles.container}>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{displayTitle}</Text>
      </View>

      {/* Stats Table */}
      <View style={styles.tableContainer}>
        {/* Sticky Game Info Column */}
        <View style={styles.stickyColumn}>
          {/* Header */}
          <View style={styles.stickyHeader}>
            <Text style={styles.stickyHeaderText}>GAME</Text>
          </View>

          {/* Game rows */}
          {gameRows.map((gameRow, index) => {
            const getResultColor = () => {
              switch (gameRow.result) {
                case Result.Win:
                  return { bgColor: theme.colorLightGreen, textColor: theme.colorGreen };
                case Result.Loss:
                  return { bgColor: theme.colorLightRed, textColor: theme.colorRed };
                default:
                  return { bgColor: theme.colorLightGrey, textColor: theme.colorGrey };
              }
            };

            const { bgColor, textColor } = getResultColor();

            return (
              <View key={gameRow.id} style={styles.gameInfoCell}>
                <View style={styles.gameInfoContent}>
                  {/* Result Badge */}
                  <View style={[styles.resultBadge, { backgroundColor: bgColor }]}>
                    <Text style={[styles.resultText, { color: textColor }]}>
                      {gameRow.result === Result.Win
                        ? "W"
                        : gameRow.result === Result.Loss
                          ? "L"
                          : "D"}
                    </Text>
                  </View>

                  {/* Opponent and Score */}
                  <View style={styles.gameDetails}>
                    <Text style={styles.opponent} numberOfLines={1}>
                      {gameRow.opponent}
                    </Text>
                    <Text style={styles.score}>{gameRow.score}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Stats Columns */}
        <View>
          {/* Header Row */}
          <View style={styles.statsHeaderRow}>
            {headings.map((heading, index) => (
              <Text key={index} style={styles.statHeaderCell}>
                {heading}
              </Text>
            ))}
          </View>

          {/* Stats Rows */}
          {gameRows.map(gameRow => (
            <View key={gameRow.id} style={styles.statsDataRow}>
              {gameRow.stats.map((stat, index) => (
                <Text key={index} style={styles.statCell}>
                  {stat}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Generated with StatLine</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colorWhite,
    padding: 20,
    minWidth: 1200,
  },
  titleSection: {
    marginBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colorOnyx,
    textAlign: "center",
  },
  tableContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
    borderRadius: 8,
    overflow: "hidden",
  },
  // Sticky column
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
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: "600",
    color: theme.colorOnyx,
    marginBottom: 2,
  },
  score: {
    fontSize: 10,
    fontWeight: "500",
    color: theme.colorGrey,
  },
  // Stats section
  statsHeaderRow: {
    flexDirection: "row",
    backgroundColor: theme.colorLightGrey,
    borderBottomWidth: 2,
    borderBottomColor: theme.colorOnyx,
    paddingVertical: 8,
    height: 30,
    alignItems: "center",
  },
  statsDataRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
    paddingVertical: 8,
    minHeight: 50,
  },
  statHeaderCell: {
    width: 45,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: theme.colorOnyx,
  },
  statCell: {
    width: 45,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: theme.colorOnyx,
  },
  footer: {
    marginTop: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 10,
    color: theme.colorGrey,
    fontStyle: "italic",
  },
});
