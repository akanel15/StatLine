import { StatLineButton } from "@/components/StatLineButton";
import { useGameStore } from "@/store/gameStore";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { GameType, Team } from "@/types/game";
import { usePlayerStore } from "@/store/playerStore";
import { initialBaseStats, Stat, StatsType } from "@/types/stats";
import PeriodScoreTile from "./PeriodScoreTile";
import { theme } from "@/theme";
import { getPlayerDisplayName } from "@/utils/displayHelpers";

type BoxScoreProps = {
  gameId: string;
  onClose: () => void;
  hideCloseButton?: boolean; // New optional prop
};

export default function BoxScoreOverlay({
  gameId,
  onClose,
  hideCloseButton = false,
}: BoxScoreProps) {
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

  const game: GameType = useGameStore(state => state.games[gameId]);
  const players = usePlayerStore.getState().players;

  if (!game) return null;

  const formatStats = (stats: StatsType): string[] => {
    const safeDivide = (num: number, den: number) =>
      den === 0 ? "-" : Math.round((num / den) * 100).toString() + "%"; // Multiply by 100 and round

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
      ), // FG%
      stats[Stat.TwoPointMakes].toString(),
      stats[Stat.TwoPointAttempts].toString(),
      safeDivide(stats[Stat.TwoPointMakes], stats[Stat.TwoPointAttempts]), // 2P%
      stats[Stat.ThreePointMakes].toString(),
      stats[Stat.ThreePointAttempts].toString(),
      safeDivide(stats[Stat.ThreePointMakes], stats[Stat.ThreePointAttempts]), // 3P%
      stats[Stat.FreeThrowsMade].toString(),
      stats[Stat.FreeThrowsAttempted].toString(),
      safeDivide(stats[Stat.FreeThrowsMade], stats[Stat.FreeThrowsAttempted]), // FT%
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

  // Build box score list including players who may no longer exist
  const allPlayerIds = [...game.gamePlayedList];
  const playerBoxScoreEntries = allPlayerIds.map(playerId => {
    const player = players[playerId];
    return {
      id: playerId,
      name: player ? player.name : getPlayerDisplayName(playerId),
      stats: formatStats(game.boxScore[playerId] ?? { ...initialBaseStats }),
    };
  });

  const boxScoreList = [
    ...playerBoxScoreEntries,
    { id: "Us", name: "Total", stats: formatStats(game.statTotals[Team.Us]) },
    {
      id: "Opponent",
      name: game.opposingTeamName,
      stats: formatStats(game.statTotals[Team.Opponent]),
    },
  ];

  // handleShare function removed as it's not currently used in the UI

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Score Summary */}
        <View style={styles.largeSection}>
          <PeriodScoreTile game={game} />
        </View>

        {/* Box Score Table */}
        <View style={styles.tableContainer}>
          {/* Sticky Player Names Column */}
          <View style={styles.stickyColumn}>
            <View style={styles.headerRow}>
              <Text style={[styles.playerBox, styles.headerText]}>Player</Text>
            </View>
            {boxScoreList.map(item => (
              <Text
                key={item.id}
                style={[
                  styles.playerName,
                  item.id === "Us" || item.id === "Opponent" ? styles.totals : null,
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            ))}
          </View>

          {/* Scrollable Stats */}
          <ScrollView horizontal>
            <View>
              <View>
                {/* Header Row */}
                <View style={styles.headerRow}>
                  {headings.map((stat, index) => (
                    <Text key={index} style={[styles.statCell, styles.headerText]}>
                      {stat}
                    </Text>
                  ))}
                </View>

                {/* Player Stats Rows */}
                {boxScoreList.map(item => (
                  <View key={item.id} style={styles.row}>
                    {item.stats.map((stat, index) => (
                      <Text
                        key={index}
                        style={[
                          styles.statCell,
                          item.id === "Us" || item.id === "Opponent" ? styles.statTotal : null,
                        ]}
                      >
                        {stat}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Close Button */}
      {!hideCloseButton && (
        <View style={styles.closeButtonContainer}>
          <StatLineButton onPress={onClose} title="Close" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "white", flex: 1 },
  largeSection: { marginBottom: 20 },
  closeButtonContainer: { marginBottom: 4 },
  scrollContainer: { flex: 1, marginBottom: 20 },
  tableContainer: { flexDirection: "row", flex: 1, alignItems: "stretch" },
  stickyColumn: {
    backgroundColor: theme.colorWhite,
  },
  // Table Row Styles
  row: {
    flexDirection: "row",
    alignItems: "center", // Ensures vertical alignment
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBlockColor: theme.colorLightGrey,
    minHeight: 30, // Ensure height consistency
  },
  headerRow: {
    flexDirection: "row",
    paddingVertical: 6,
    backgroundColor: theme.colorLightGrey,
    borderBottomWidth: 2,
  },

  // Column Styles
  playerName: {
    width: 140,
    fontSize: 14,
    paddingVertical: 6,
    fontWeight: "500",
    borderRightWidth: 1,
    backgroundColor: theme.colorWhite,
    borderTopWidth: 1,
    borderBlockColor: theme.colorLightGrey,
    textAlignVertical: "center",
    minHeight: 30,
  },
  statCell: { width: 50, textAlign: "center", padding: 2, fontSize: 14 },
  headerText: { fontWeight: "bold", textTransform: "uppercase" },
  totals: {
    fontWeight: "bold",
  },
  playerBox: {
    width: 140,
    fontSize: 14,
    fontWeight: "500",
    padding: 2,
  },
  statTotal: {
    fontWeight: "bold",
    width: 50,
    textAlign: "center",
    fontSize: 14,
  },
});
