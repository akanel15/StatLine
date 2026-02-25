import { StatLineButton } from "@/components/StatLineButton";
import { useGameStore } from "@/store/gameStore";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { usePlayerStore } from "@/store/playerStore";
import PeriodScoreTile from "./PeriodScoreTile";
import { getPlayerDisplayName } from "@/utils/displayHelpers";
import { SortableBoxScoreTable } from "@/components/shared/SortableBoxScoreTable";
import { GameSetStatsTable } from "@/components/shared/GameSetStatsTable";
import { theme } from "@/theme";

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
  const game = useGameStore(state => state.games[gameId]);
  const players = usePlayerStore.getState().players;

  if (!game) return null;

  const hasSets = Object.values(game.sets).some(s => s.runCount > 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Score Summary */}
        <View style={styles.largeSection}>
          <PeriodScoreTile game={game} />
        </View>

        {/* Box Score Table */}
        <View style={styles.tableWrapper}>
          <SortableBoxScoreTable
            game={game}
            players={players}
            stickyColumnHeader="Player"
            scrollable={true}
            getPlayerDisplayName={getPlayerDisplayName}
          />
        </View>

        {/* Set Performance */}
        {hasSets && (
          <View style={styles.tableWrapper}>
            <Text style={styles.sectionHeader}>Set Performance</Text>
            <GameSetStatsTable sets={game.sets} scrollable={true} />
          </View>
        )}
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
  container: {
    backgroundColor: "white",
    flex: 1,
  },
  largeSection: {
    marginBottom: 20,
  },
  closeButtonContainer: {
    marginBottom: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  tableWrapper: {
    marginHorizontal: 4,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colorOnyx,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
});
