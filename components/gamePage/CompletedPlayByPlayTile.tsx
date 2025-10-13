import { PlayByPlayType } from "@/types/game";
import { Text, View, StyleSheet } from "react-native";
import { theme } from "@/theme";
import { getPlayerDisplayNameWithNumber } from "@/utils/displayHelpers";

interface CompletedPlayByPlayTileProps {
  play: PlayByPlayType;
  teamScore?: number;
  opponentScore?: number;
}

export default function CompletedPlayByPlayTile({
  play,
  teamScore,
  opponentScore,
}: CompletedPlayByPlayTileProps) {
  const isOpponent = play.playerId === "Opponent";

  return (
    <View
      style={[styles.container, isOpponent ? styles.opponentBackground : styles.playerBackground]}
    >
      <Text style={[styles.playerInfo, isOpponent && styles.opponentText]}>
        {isOpponent ? "Opponent" : getPlayerDisplayNameWithNumber(play.playerId)}
      </Text>

      <Text style={[styles.action, teamScore || opponentScore ? styles.boldText : null]}>
        {play.action}
      </Text>

      <Text style={styles.score}>
        {teamScore !== undefined && opponentScore !== undefined ? (
          <>
            <Text style={!isOpponent ? styles.boldText : null}>{teamScore}</Text>
            <Text>{` - `}</Text>
            <Text style={isOpponent ? styles.boldText : null}>{opponentScore}</Text>
          </>
        ) : (
          ""
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: theme.colorLightGrey,
    width: "100%",
  },
  playerInfo: {
    width: 150,
    fontSize: 14,
    fontWeight: "600",
  },
  opponentText: {
    color: theme.colorRedCrayola,
  },
  action: {
    flex: 1,
    fontSize: 14,
    width: 110,
  },
  boldText: {
    fontWeight: "bold",
  },
  score: {
    width: 72,
    fontSize: 16,
    textAlign: "right",
    color: theme.colorBlack,
    flexDirection: "row",
  },
  opponentBackground: {
    backgroundColor: theme.colorLightGrey,
  },
  playerBackground: {
    backgroundColor: theme.colorWhite,
  },
});
