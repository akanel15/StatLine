import { StyleSheet, Text, View } from "react-native";
import { GameType } from "@/types/game";
import PeriodScoreTile from "./PeriodScoreTile";
import { theme } from "@/theme";
import { getPlayerDisplayName } from "@/utils/displayHelpers";
import { useTeamStore } from "@/store/teamStore";
import { BoxScoreTable } from "@/components/shared/BoxScoreTable";

type ShareableBoxScoreProps = {
  game: GameType;
  players: Record<string, any>;
};

export default function ShareableBoxScore({ game, players }: ShareableBoxScoreProps) {
  const getTeamSafely = useTeamStore(state => state.getTeamSafely);
  const ourTeam = getTeamSafely(game.teamId);
  const ourTeamName = ourTeam?.name || "Our Team";

  return (
    <View style={styles.container}>
      {/* Game Title */}
      <View style={styles.titleSection}>
        <Text style={styles.gameTitle}>
          {ourTeamName} vs {game.opposingTeamName}
        </Text>
      </View>

      {/* Score Summary */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreContainer}>
          <PeriodScoreTile game={game} />
        </View>
      </View>

      {/* Full Box Score Table - No Scrolling */}
      <BoxScoreTable
        game={game}
        players={players}
        stickyColumnHeader="Player"
        scrollable={false}
        getPlayerDisplayName={getPlayerDisplayName}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Generated with StatLine</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 20,
    minWidth: 1600, // Ensure enough width for all 25 stat columns + sticky column + padding (prevents +/- cutoff)
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colorOnyx,
    textAlign: "center",
  },
  scoreSection: {
    marginBottom: 24,
  },
  scoreContainer: {
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
    borderRadius: 8,
    overflow: "visible",
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
