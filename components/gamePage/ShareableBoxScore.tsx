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
        <PeriodScoreTile game={game} />
      </View>

      {/* Full Box Score Table - No Scrolling */}
      <BoxScoreTable
        game={game}
        players={players}
        stickyColumnHeader="Player"
        scrollable={false}
        getPlayerDisplayName={getPlayerDisplayName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 16,
    minWidth: 1200, // Ensure enough width for all stats
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
});
