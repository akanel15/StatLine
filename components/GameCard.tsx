import { StyleSheet, View, Pressable } from "react-native";
import { theme } from "@/theme";
import { Link } from "expo-router";
import { GameType } from "@/types/game";
import MatchUpDisplay from "./MatchUpDisplay";
import { scale } from "@/utils/responsive";
//<PlayerImage game={game} size={80}></PlayerImage>

export function GameCard({ game }: { game: GameType }) {
  return (
    <View style={styles.gameCard}>
      <Link href={`/games/${game.id}`} asChild>
        <Pressable style={styles.cardContent}>
          <View style={styles.details}>
            <MatchUpDisplay game={game}></MatchUpDisplay>
          </View>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  gameCard: {
    flexDirection: "row",
    shadowColor: theme.colorOnyx,
    backgroundColor: theme.colorWhite,
    borderRadius: scale(6),
    padding: scale(12),
    marginBottom: scale(12),
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    alignItems: "center",
  },
  cardContent: {
    flexDirection: "row",
    flex: 1,
  },
  details: {
    padding: scale(8),
    justifyContent: "space-between",
    flex: 1,
  },
});
