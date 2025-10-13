import { useGameStore } from "@/store/gameStore";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import CompletedPlayByPlayTile from "./CompletedPlayByPlayTile";
import { useState, useMemo } from "react";
import { getPointsForPlay } from "@/utils/basketball";
import { theme } from "@/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { PeriodType } from "@/types/game";

type CompletedGamePlayByPlayProps = {
  gameId: string;
};

export default function CompletedGamePlayByPlay({ gameId }: CompletedGamePlayByPlayProps) {
  const game = useGameStore(state => state.games[gameId]);

  // Start at the last period instead of the first
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    if (game?.periods && game.periods.length > 0) {
      return game.periods.length - 1;
    }
    return 0;
  });

  // Pre-compute cumulative scores from all periods up to (but not including) current period
  const cumulativePeriodTotals = useMemo(() => {
    if (!game?.periods) return [];

    return game.periods.reduce(
      (acc, periodInfo, pIndex) => {
        // Check if periodInfo exists and playByPlay exists and is an array before reducing
        const periodTotals =
          periodInfo && periodInfo.playByPlay && Array.isArray(periodInfo.playByPlay)
            ? periodInfo.playByPlay.reduce(
                (pAcc, play) => {
                  const points = getPointsForPlay(play);
                  if (play.playerId === "Opponent") {
                    pAcc.opponent += points;
                  } else {
                    pAcc.team += points;
                  }
                  return pAcc;
                },
                { team: 0, opponent: 0 },
              )
            : { team: 0, opponent: 0 }; // Fallback to 0 scores if periodInfo or playByPlay is null/undefined

        const lastTotal = acc[pIndex - 1] ?? { team: 0, opponent: 0 };
        acc[pIndex] = {
          team: lastTotal.team + periodTotals.team,
          opponent: lastTotal.opponent + periodTotals.opponent,
        };

        return acc;
      },
      [] as { team: number; opponent: number }[],
    );
  }, [game?.periods]);

  if (!game) return null;

  if (
    !game.periods ||
    !game.periods[selectedPeriod] ||
    !game.periods[selectedPeriod]?.playByPlay ||
    !Array.isArray(game.periods[selectedPeriod]?.playByPlay)
  ) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No plays recorded for this period</Text>
      </View>
    );
  }

  const currentPeriodPlays = game.periods[selectedPeriod].playByPlay;
  const maxPeriod = game.periods.length - 1;

  return (
    <View style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          onPress={() => setSelectedPeriod(prev => Math.max(0, prev - 1))}
          disabled={selectedPeriod === 0}
          hitSlop={20}
        >
          <Ionicons
            name="arrow-undo-circle"
            size={30}
            color={selectedPeriod === 0 ? theme.colorLightGrey : theme.colorOrangePeel}
          />
        </TouchableOpacity>

        <Text style={styles.periodText}>
          {selectedPeriod + 1 <= game.periodType
            ? game.periodType === PeriodType.Quarters
              ? `Q${selectedPeriod + 1}`
              : `Half ${selectedPeriod + 1}`
            : `OT${selectedPeriod + 1 - game.periodType}`}
        </Text>

        <TouchableOpacity
          onPress={() => setSelectedPeriod(prev => Math.min(maxPeriod, prev + 1))}
          disabled={selectedPeriod === maxPeriod}
          hitSlop={20}
        >
          <Ionicons
            name="arrow-redo-circle"
            size={30}
            color={selectedPeriod === maxPeriod ? theme.colorLightGrey : theme.colorOrangePeel}
          />
        </TouchableOpacity>
      </View>

      {/* Play-by-Play List */}
      {currentPeriodPlays.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No plays recorded for this period</Text>
        </View>
      ) : (
        <FlatList
          data={currentPeriodPlays}
          renderItem={({ item, index }) => {
            // Compute cumulative score up to the current play across all periods
            const calculateCumulativeScore = () => {
              // Get base scores from all completed periods before current period
              const baseTeamScore =
                selectedPeriod === 0 ? 0 : (cumulativePeriodTotals[selectedPeriod - 1]?.team ?? 0);
              const baseOpponentScore =
                selectedPeriod === 0
                  ? 0
                  : (cumulativePeriodTotals[selectedPeriod - 1]?.opponent ?? 0);

              // Calculate scores from plays in current period up to and including current play
              // Since playByPlay is stored in reverse chronological order (newest first),
              // we need to slice from index to end to get plays from current play to start of period
              const currentPeriodScores = (game.periods[selectedPeriod].playByPlay || [])
                .slice(index)
                .reduce(
                  (acc, play) => {
                    const points = getPointsForPlay(play);
                    if (play.playerId === "Opponent") {
                      acc.opponentScore += points;
                    } else {
                      acc.teamScore += points;
                    }
                    return acc;
                  },
                  { teamScore: 0, opponentScore: 0 },
                );

              return {
                teamScore: baseTeamScore + currentPeriodScores.teamScore,
                opponentScore: baseOpponentScore + currentPeriodScores.opponentScore,
              };
            };

            const { teamScore, opponentScore } = calculateCumulativeScore();
            const isMadeShot = item.action.includes("made");

            return (
              <CompletedPlayByPlayTile
                play={item}
                teamScore={isMadeShot ? teamScore : undefined}
                opponentScore={isMadeShot ? opponentScore : undefined}
              />
            );
          }}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          style={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 30,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colorLightGrey,
    backgroundColor: theme.colorWhite,
  },
  periodText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colorOnyx,
    minWidth: 60,
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colorGrey,
    fontStyle: "italic",
  },
});
