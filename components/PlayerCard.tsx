import { StyleSheet, View, Text, Pressable } from "react-native";
import { theme } from "@/theme";
import { Link } from "expo-router";
import { PlayerImage } from "./PlayerImage";
import { PlayerType } from "@/types/player";
import { calculatePlayerCardStats, formatStatForCard } from "@/logic/cardStats";
import { scale, moderateScale } from "@/utils/responsive";

export function PlayerCard({ player }: { player: PlayerType }) {
  const { ppg, rpg, apg, gamesPlayed } = calculatePlayerCardStats(player);

  // Create accessibility label with player info
  const accessibilityLabel =
    gamesPlayed > 0
      ? `${player.name}, ${formatStatForCard(ppg)} points, ${formatStatForCard(rpg)} rebounds, ${formatStatForCard(apg)} assists per game, ${gamesPlayed} games played`
      : `${player.name}, no stats yet`;

  return (
    <Link href={`/players/${player.id}`} asChild>
      <Pressable
        style={styles.playerCard}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Double tap to view player details"
      >
        <PlayerImage player={player} size={60}></PlayerImage>
        <View style={styles.details}>
          <Text numberOfLines={1} style={styles.playerName}>
            {player.name}
          </Text>
          {gamesPlayed > 0 ? (
            <>
              <Text style={styles.stats}>
                {formatStatForCard(ppg)} PPG • {formatStatForCard(rpg)} RPG •{" "}
                {formatStatForCard(apg)} APG
              </Text>
              <Text style={styles.gamesPlayed}>{gamesPlayed} Games</Text>
            </>
          ) : (
            <Text style={styles.subtitle}>No stats yet</Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  playerCard: {
    flexDirection: "row",
    shadowColor: theme.colorOnyx,
    backgroundColor: theme.colorWhite,
    borderRadius: scale(6),
    padding: scale(8),
    marginBottom: scale(8),
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  details: {
    padding: scale(4),
    justifyContent: "center",
  },
  playerName: {
    fontSize: moderateScale(18),
    marginBottom: scale(4),
    marginLeft: scale(16),
  },
  subtitle: {
    color: theme.colorGrey,
    marginLeft: scale(16),
    fontSize: moderateScale(14),
  },
  stats: {
    color: theme.colorOnyx,
    fontSize: moderateScale(14),
    marginLeft: scale(16),
    marginBottom: scale(2),
  },
  gamesPlayed: {
    color: theme.colorGrey,
    fontSize: moderateScale(12),
    marginLeft: scale(16),
  },
});
