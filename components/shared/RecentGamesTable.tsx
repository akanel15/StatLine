import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GameType, Team } from "@/types/game";
import { initialBaseStats, Stat, StatsType } from "@/types/stats";
import { theme } from "@/theme";
import { Result } from "@/types/player";
import { router } from "expo-router";
import { scale, moderateScale } from "@/utils/responsive";
import { BaseStatsTable, BaseTableHeader, BaseTableRow } from "./BaseStatsTable";

type RecentGamesTableProps = {
  games: GameType[];
  context: "team" | "player" | "set";
  playerId?: string;
  setId?: string;
};

export function RecentGamesTable({ games, context, playerId, setId }: RecentGamesTableProps) {
  const baseHeadings = [
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

  const headings = context === "set" ? ["RUNS", ...baseHeadings] : baseHeadings;

  const formatStats = (stats: StatsType, runCount?: number): string[] => {
    const safeDivide = (num: number, den: number) =>
      den === 0 ? "-" : num === 0 ? "0%" : Math.round((num / den) * 100).toString() + "%";

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

    const baseStats = [
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

    return runCount !== undefined ? [runCount.toString(), ...baseStats] : baseStats;
  };

  const handleGamePress = (gameId: string) => {
    router.push(`/(tabs)/games/${gameId}`);
  };

  const headers: BaseTableHeader[] = headings.map(h => ({ label: h }));

  const tableRows: BaseTableRow[] = games.map(game => {
    const ourScore = game.statTotals[Team.Us][Stat.Points] || 0;
    const theirScore = game.statTotals[Team.Opponent][Stat.Points] || 0;
    const result: Result =
      ourScore > theirScore ? Result.Win : ourScore < theirScore ? Result.Loss : Result.Draw;

    let statsToShow: string[];
    if (context === "team") {
      statsToShow = formatStats(game.statTotals[Team.Us]);
    } else if (context === "player" && playerId) {
      const playerStats = game.boxScore[playerId] ?? { ...initialBaseStats };
      statsToShow = formatStats(playerStats);
    } else if (context === "set" && setId) {
      const setData = game.sets[setId];
      const setStats = setData?.stats ?? { ...initialBaseStats };
      const runCount = setData?.runCount ?? 0;
      statsToShow = formatStats(setStats, runCount);
    } else {
      statsToShow = formatStats({ ...initialBaseStats });
    }

    const getResultStyles = () => {
      switch (result) {
        case Result.Win:
          return { bgColor: theme.colorLightGreen, textColor: theme.colorGreen };
        case Result.Loss:
          return { bgColor: theme.colorLightRed, textColor: theme.colorRed };
        default:
          return { bgColor: theme.colorLightGrey, textColor: theme.colorGrey };
      }
    };

    const { bgColor, textColor } = getResultStyles();

    return {
      key: game.id,
      leftColumnContent: (
        <TouchableOpacity
          onPress={() => handleGamePress(game.id)}
          activeOpacity={0.7}
          style={styles.gameInfoContent}
        >
          <View style={[styles.resultBadge, { backgroundColor: bgColor }]}>
            <Text
              style={[styles.resultText, { color: textColor }]}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.5}
            >
              {result === Result.Win ? "W" : result === Result.Loss ? "L" : "D"}
            </Text>
          </View>
          <View style={styles.gameDetails}>
            <Text
              style={styles.opponent}
              numberOfLines={1}
              ellipsizeMode="tail"
              allowFontScaling={true}
              maxFontSizeMultiplier={1.5}
            >
              vs {game.opposingTeamName}
            </Text>
            <Text style={styles.score} allowFontScaling={true} maxFontSizeMultiplier={1.5}>
              {ourScore}-{theirScore}
            </Text>
          </View>
        </TouchableOpacity>
      ),
      statValues: statsToShow,
    };
  });

  return (
    <BaseStatsTable
      stickyColumnHeader="GAME"
      headers={headers}
      rows={tableRows}
      containerBorder={false}
    />
  );
}

const styles = StyleSheet.create({
  gameInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  resultBadge: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  resultText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  gameDetails: {
    flex: 1,
  },
  opponent: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: theme.colorOnyx,
    marginBottom: scale(1),
  },
  score: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    color: theme.colorGrey,
  },
});
