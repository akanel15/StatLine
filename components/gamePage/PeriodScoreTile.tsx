import { GameType, PeriodType, Team } from "@/types/game";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { OpponentImage } from "../OpponentImage";
import { useTeamStore } from "@/store/teamStore";
import { StatLineImage } from "../StatLineImage";

type PeriodScoreTileProps = {
  game: GameType;
};

export default function PeriodScoreTile({ game }: PeriodScoreTileProps) {
  const teamInfo = useTeamStore(state => state.teams[game.teamId]);
  const totalPeriods = Math.max(game.periodType, game.periods.length); // Define total expected periods

  const getPeriodTotals = (team: Team): number[] => {
    const formattedPeriods = [];

    for (let i = 0; i < totalPeriods; i++) {
      const period = game.periods[i];
      formattedPeriods.push(period ? period[team] : 0); // Use 0 if period.us is undefined
    }
    return formattedPeriods;
  };

  const getPeriodHeadings = (): string[] => {
    const formattedHeadings = [];
    if (game.periodType === PeriodType.Quarters) {
      for (let i = 0; i < totalPeriods; i++) {
        if (i + 1 <= game.periodType) {
          formattedHeadings.push(`Q${i + 1}`);
        } else {
          formattedHeadings.push(`OT${i + 1 - game.periodType}`);
        }
      }
    } else {
      for (let i = 0; i < totalPeriods; i++) {
        if (i + 1 <= game.periodType) {
          formattedHeadings.push(`H${i + 1}`);
        } else {
          formattedHeadings.push(`OT${i + 1 - game.periodType}`);
        }
      }
    }
    return formattedHeadings;
  };

  if (!game) return null;
  return (
    <ScrollView horizontal>
      <View>
        <View style={styles.periodScores}>
          <View style={[styles.periodHeadingSpacing, { backgroundColor: "transparent" }]} />

          {getPeriodHeadings().map((period, index) => (
            <Text key={index} style={styles.score}>
              {period}
            </Text>
          ))}
          <Text style={styles.totalScore}>TOT</Text>
        </View>
        <View style={styles.periodScores}>
          <StatLineImage imageUri={teamInfo.imageUri} size={40} />
          {getPeriodTotals(Team.Us).map((period, index) => (
            <Text key={index} style={styles.score}>
              {period}
            </Text>
          ))}
          <Text style={styles.totalScore}>{game.statTotals[Team.Us].Points}</Text>
        </View>
        <View style={styles.periodScores}>
          <OpponentImage
            imageUri={game.opposingTeamImageUri}
            teamName={game.opposingTeamName}
            size={40}
          />
          {getPeriodTotals(Team.Opponent).map((period, index) => (
            <Text key={index} style={styles.score}>
              {period}
            </Text>
          ))}
          <Text style={styles.totalScore}>{game.statTotals[Team.Opponent].Points}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  periodScores: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  score: {
    width: 40,
    textAlign: "center",
  },
  totalScore: {
    fontWeight: "bold",
    width: 50,
    textAlign: "center",
  },
  periodHeadingSpacing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
});
