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

  // Determine if we need scrolling (threshold: more than 5 periods means scrolling)
  const shouldScroll = totalPeriods > 5;

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

  // Render for games with many periods (scrollable with sticky TOT)
  if (shouldScroll) {
    return (
      <View style={styles.scrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Headers Row */}
            <View style={styles.periodScores}>
              <View style={[styles.periodHeadingSpacing, { backgroundColor: "transparent" }]} />
              {getPeriodHeadings().map((period, index) => (
                <Text key={index} style={styles.score}>
                  {period}
                </Text>
              ))}
              <View style={styles.stickyColumnPlaceholder} />
            </View>

            {/* Team Row */}
            <View style={styles.periodScores}>
              <StatLineImage imageUri={teamInfo?.imageUri} size={40} />
              {getPeriodTotals(Team.Us).map((period, index) => (
                <Text key={index} style={styles.score}>
                  {period}
                </Text>
              ))}
              <View style={styles.stickyColumnPlaceholder} />
            </View>

            {/* Opponent Row */}
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
              <View style={styles.stickyColumnPlaceholder} />
            </View>
          </View>
        </ScrollView>

        {/* Sticky TOT Column */}
        <View style={styles.stickyColumn}>
          <Text style={styles.totalScore}>TOT</Text>
          <Text style={styles.totalScore}>{game.statTotals[Team.Us].Points}</Text>
          <Text style={styles.totalScore}>{game.statTotals[Team.Opponent].Points}</Text>
        </View>
      </View>
    );
  }

  // Render for normal games (stretched layout, no scroll)
  return (
    <View style={styles.stretchContainer}>
      {/* Headers Row */}
      <View style={styles.stretchRow}>
        <View style={[styles.periodHeadingSpacing, { backgroundColor: "transparent" }]} />
        {getPeriodHeadings().map((period, index) => (
          <Text key={index} style={styles.stretchScore}>
            {period}
          </Text>
        ))}
        <Text style={styles.totalScore}>TOT</Text>
      </View>

      {/* Team Row */}
      <View style={styles.stretchRow}>
        <StatLineImage imageUri={teamInfo?.imageUri} size={40} />
        {getPeriodTotals(Team.Us).map((period, index) => (
          <Text key={index} style={styles.stretchScore}>
            {period}
          </Text>
        ))}
        <Text style={styles.totalScore}>{game.statTotals[Team.Us].Points}</Text>
      </View>

      {/* Opponent Row */}
      <View style={styles.stretchRow}>
        <OpponentImage
          imageUri={game.opposingTeamImageUri}
          teamName={game.opposingTeamName}
          size={40}
        />
        {getPeriodTotals(Team.Opponent).map((period, index) => (
          <Text key={index} style={styles.stretchScore}>
            {period}
          </Text>
        ))}
        <Text style={styles.totalScore}>{game.statTotals[Team.Opponent].Points}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Common styles
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

  // Scrollable layout styles (for games with many periods)
  scrollContainer: {
    position: "relative",
    paddingRight: 60, // Make room for sticky column
  },
  stickyColumnPlaceholder: {
    width: 60, // Matches stickyColumn width + padding
  },
  stickyColumn: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 5,
    backgroundColor: "white",
    borderLeftWidth: 1,
    borderLeftColor: "#e0e0e0",
    paddingHorizontal: 5,
  },

  // Stretch layout styles (for normal games)
  stretchContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },
  stretchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    width: "100%",
  },
  stretchScore: {
    flex: 1, // This makes columns stretch evenly
    textAlign: "center",
  },
});
