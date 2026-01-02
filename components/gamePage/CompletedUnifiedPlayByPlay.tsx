import { useGameStore } from "@/store/gameStore";
import { View, Text, StyleSheet, SectionList } from "react-native";
import CompletedPlayByPlayTile from "./CompletedPlayByPlayTile";
import DraggablePeriodDivider from "./DraggablePeriodDivider";
import { useMemo } from "react";
import { getPointsForPlay } from "@/utils/basketball";
import { theme } from "@/theme";
import { PlayByPlayType } from "@/types/game";

type CompletedUnifiedPlayByPlayProps = {
  gameId: string;
};

type PlayItem = {
  type: "play";
  data: PlayByPlayType;
  periodIndex: number;
  indexInPeriod: number;
};

type SectionData = {
  title: string;
  periodIndex: number;
  data: PlayItem[];
};

export default function CompletedUnifiedPlayByPlay({ gameId }: CompletedUnifiedPlayByPlayProps) {
  const game = useGameStore(state => state.games[gameId]);

  // Build sections from game periods
  const sections = useMemo<SectionData[]>(() => {
    if (!game?.periods) return [];

    return game.periods
      .map((period, periodIndex) => {
        if (!period || !period.playByPlay || !Array.isArray(period.playByPlay)) {
          return null;
        }

        // Reverse plays to show chronological order (oldest first, newest at bottom)
        const plays = period.playByPlay.slice().reverse();

        return {
          title: `Period ${periodIndex}`,
          periodIndex,
          data: plays.map((play, displayIndex) => ({
            type: "play" as const,
            data: play,
            periodIndex,
            // Map display index back to original database index for consistency
            indexInPeriod: period.playByPlay.length - 1 - displayIndex,
          })),
        };
      })
      .filter((section): section is SectionData => section !== null && section.data.length > 0); // Show periods in chronological order (Q1 → Q2 → Q3 → Q4)
  }, [game?.periods]);

  // Pre-compute cumulative scores
  const cumulativePeriodTotals = useMemo(() => {
    if (!game?.periods) return [];

    return game.periods.reduce(
      (acc, periodInfo, pIndex) => {
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
            : { team: 0, opponent: 0 };

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

  if (!game) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No game data available</Text>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No plays recorded in this game</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.periodIndex}-${index}`}
        stickySectionHeadersEnabled={true}
        renderSectionHeader={({ section }) => {
          const periodIndex = section.periodIndex;

          // Get period scores
          const periodScores = cumulativePeriodTotals[periodIndex] || { team: 0, opponent: 0 };

          return (
            <DraggablePeriodDivider
              periodIndex={periodIndex}
              periodType={game.periodType}
              teamScore={periodScores.team}
              opponentScore={periodScores.opponent}
              showPrevious={false}
              showNext={false}
              isDraggable={false}
            />
          );
        }}
        renderItem={({ item }) => {
          const { periodIndex, data: play } = item;

          // Calculate cumulative score up to this play
          const calculateCumulativeScore = () => {
            const baseTeamScore =
              periodIndex === 0 ? 0 : (cumulativePeriodTotals[periodIndex - 1]?.team ?? 0);
            const baseOpponentScore =
              periodIndex === 0 ? 0 : (cumulativePeriodTotals[periodIndex - 1]?.opponent ?? 0);

            // Get plays in this period from start to current play (chronological order)
            const section = sections.find(s => s.periodIndex === periodIndex);
            if (!section) return { teamScore: baseTeamScore, opponentScore: baseOpponentScore };

            // Since plays are now oldest-first, sum from beginning up to and including current play
            const currentDisplayIndex = section.data.findIndex(
              p => p.indexInPeriod === item.indexInPeriod,
            );
            if (currentDisplayIndex === -1)
              return { teamScore: baseTeamScore, opponentScore: baseOpponentScore };

            const playsUpToCurrent = section.data.slice(0, currentDisplayIndex + 1);

            const currentPeriodScores = playsUpToCurrent.reduce(
              (acc, playItem) => {
                const points = getPointsForPlay(playItem.data);
                if (playItem.data.playerId === "Opponent") {
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
          const isMadeShot = play.action.includes("made");

          return (
            <CompletedPlayByPlayTile
              play={play}
              teamScore={isMadeShot ? teamScore : undefined}
              opponentScore={isMadeShot ? opponentScore : undefined}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
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
    fontWeight: "600",
    color: theme.colorGrey,
    marginBottom: 8,
  },
});
