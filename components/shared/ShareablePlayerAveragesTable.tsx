import { StyleSheet, Text, View } from "react-native";
import { PlayerType } from "@/types/player";
import { Stat } from "@/types/stats";
import { theme } from "@/theme";
import { calculatePlayerAverages } from "@/logic/playerAverages";

type ShareablePlayerAveragesTableProps = {
  players: PlayerType[];
  teamName: string;
};

export function ShareablePlayerAveragesTable({
  players,
  teamName,
}: ShareablePlayerAveragesTableProps) {
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

  const formatAverages = (averages: ReturnType<typeof calculatePlayerAverages>): string[] => {
    const safeDivide = (num: number, den: number) => (den === 0 ? 0 : (num / den) * 100);

    const raw = [
      averages[Stat.Points],
      averages[Stat.DefensiveRebounds] + averages[Stat.OffensiveRebounds],
      averages[Stat.Assists],
      averages[Stat.Steals],
      averages[Stat.Blocks],
      averages[Stat.TwoPointMakes] + averages[Stat.ThreePointMakes],
      averages[Stat.TwoPointAttempts] + averages[Stat.ThreePointAttempts],
      safeDivide(
        averages[Stat.TwoPointMakes] + averages[Stat.ThreePointMakes],
        averages[Stat.TwoPointAttempts] + averages[Stat.ThreePointAttempts],
      ),
      averages[Stat.TwoPointMakes],
      averages[Stat.TwoPointAttempts],
      safeDivide(averages[Stat.TwoPointMakes], averages[Stat.TwoPointAttempts]),
      averages[Stat.ThreePointMakes],
      averages[Stat.ThreePointAttempts],
      safeDivide(averages[Stat.ThreePointMakes], averages[Stat.ThreePointAttempts]),
      averages[Stat.FreeThrowsMade],
      averages[Stat.FreeThrowsAttempted],
      safeDivide(averages[Stat.FreeThrowsMade], averages[Stat.FreeThrowsAttempted]),
      averages[Stat.OffensiveRebounds],
      averages[Stat.DefensiveRebounds],
      averages[Stat.Turnovers],
      averages[Stat.FoulsCommitted],
      averages[Stat.FoulsDrawn],
      averages[Stat.Deflections],
      averages[Stat.Points] +
        averages[Stat.Assists] +
        averages[Stat.OffensiveRebounds] +
        averages[Stat.DefensiveRebounds] +
        averages[Stat.Steals] +
        averages[Stat.Blocks] +
        averages[Stat.TwoPointMakes] +
        averages[Stat.ThreePointMakes] -
        (averages[Stat.TwoPointAttempts] +
          averages[Stat.ThreePointAttempts] +
          averages[Stat.Turnovers]),
      averages[Stat.PlusMinus],
    ];

    return raw.map((value, index) => {
      // Format percentages (indices 7, 10, 13, 16 are FG%, 2P%, 3P%, FT%)
      if ([7, 10, 13, 16].includes(index)) {
        return value === 0 ? "-" : Math.round(value).toString() + "%";
      }
      // Format other stats to 1 decimal place
      return value.toFixed(1);
    });
  };

  // Filter and build player entries
  const playersWithGames = players.filter(player => player.gameNumbers.gamesPlayed > 0);

  const playerEntries = playersWithGames.map(player => {
    const averages = calculatePlayerAverages(player.stats, player.gameNumbers.gamesPlayed);
    const formatted = formatAverages(averages);
    const displayName = player.number ? `#${player.number} ${player.name}` : player.name;

    return {
      id: player.id,
      name: displayName,
      stats: formatted,
    };
  });

  return (
    <View style={styles.container}>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{teamName} - Player Averages</Text>
      </View>

      {/* Table */}
      <View style={styles.tableContainer}>
        {/* Sticky Player Names Column */}
        <View style={styles.stickyColumn}>
          {/* Header */}
          <View style={styles.stickyHeader}>
            <Text style={styles.stickyHeaderText}>PLAYER</Text>
          </View>

          {/* Player rows */}
          {playerEntries.map(entry => (
            <View key={entry.id} style={styles.playerNameCell}>
              <Text style={styles.playerNameText} numberOfLines={1}>
                {entry.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Stats Columns */}
        <View>
          {/* Header Row */}
          <View style={styles.statsHeaderRow}>
            {headings.map((heading, index) => (
              <Text key={index} style={styles.statHeaderCell}>
                {heading}
              </Text>
            ))}
          </View>

          {/* Stats Rows */}
          {playerEntries.map(entry => (
            <View key={entry.id} style={styles.statsDataRow}>
              {entry.stats.map((stat, index) => (
                <Text key={index} style={styles.statCell}>
                  {stat}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Generated with StatLine</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colorWhite,
    padding: 20,
    minWidth: 1300,
  },
  titleSection: {
    marginBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colorOnyx,
    textAlign: "center",
  },
  tableContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
    borderRadius: 8,
    overflow: "hidden",
  },
  // Sticky column
  stickyColumn: {
    backgroundColor: theme.colorWhite,
  },
  stickyHeader: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: theme.colorLightGrey,
    borderBottomWidth: 2,
    borderBottomColor: theme.colorOnyx,
    width: 140,
    height: 30,
    justifyContent: "center",
  },
  stickyHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: theme.colorOnyx,
    textAlign: "center",
  },
  playerNameCell: {
    width: 140,
    borderRightWidth: 1,
    borderRightColor: theme.colorLightGrey,
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 50,
  },
  playerNameText: {
    fontSize: 11,
    fontWeight: "500",
    color: theme.colorOnyx,
  },
  // Stats section
  statsHeaderRow: {
    flexDirection: "row",
    backgroundColor: theme.colorLightGrey,
    borderBottomWidth: 2,
    borderBottomColor: theme.colorOnyx,
    paddingVertical: 8,
    height: 30,
    alignItems: "center",
  },
  statsDataRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
    paddingVertical: 8,
    minHeight: 50,
  },
  statHeaderCell: {
    width: 45,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: theme.colorOnyx,
  },
  statCell: {
    width: 45,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: theme.colorOnyx,
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
