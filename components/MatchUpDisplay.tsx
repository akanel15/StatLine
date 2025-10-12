import { GameType, Team } from "@/types/game";
import { StyleSheet, Text, View } from "react-native";
import { useTeamStore } from "@/store/teamStore";
import { StatLineImage } from "./StatLineImage";
import { OpponentShield } from "./OpponentTeamImage";
import { theme } from "@/theme";

type MatchUpDisplayProps = {
  game: GameType;
};

export default function MatchUpDisplay({ game }: MatchUpDisplayProps) {
  const teamInfo = useTeamStore(state => state.teams[game.teamId]);
  const winning = game.statTotals[Team.Us].Points - game.statTotals[Team.Opponent].Points;

  if (!game) return null;
  return (
    <View style={styles.container}>
      {/* Left Team */}
      <View style={styles.teamContainer}>
        <StatLineImage imageUri={teamInfo.imageUri} size={50} />
        <Text numberOfLines={1} style={styles.subtitle}>
          {teamInfo.name}
        </Text>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreContainer}>
        <Text style={[styles.totalScore, { fontWeight: winning >= 0 ? "bold" : "normal" }]}>
          {game.statTotals[Team.Us].Points}
        </Text>
        <Text style={styles.totalScore}>-</Text>

        <Text style={[styles.totalScore, { fontWeight: winning <= 0 ? "bold" : "normal" }]}>
          {game.statTotals[Team.Opponent].Points}
        </Text>
      </View>

      {/* Right Team */}
      <View style={styles.teamContainer}>
        <OpponentShield teamName={game.opposingTeamName} size={50} />
        <Text numberOfLines={1} style={styles.subtitle}>
          {game.opposingTeamName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  teamContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    width: 100,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Centers scores
    flex: 1,
  },
  totalScore: {
    fontSize: 24,
    textAlign: "center",
    width: 50,
  },
  subtitle: {
    color: theme.colorGrey,
    textAlign: "center",
  },
});
