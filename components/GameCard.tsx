import { StyleSheet, View, Pressable } from "react-native";
import { theme } from "@/theme";
import { Link } from "expo-router";
import { GameType } from "@/types/game";
import MatchUpDisplay from "./MatchUpDisplay";
import { scale } from "@/utils/responsive";
import Feather from "@expo/vector-icons/Feather";

type GameCardProps = {
  game: GameType;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (gameId: string) => void;
};

export function GameCard({
  game,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: GameCardProps) {
  if (selectionMode) {
    return (
      <Pressable
        style={[styles.gameCard, selected && styles.gameCardSelected]}
        onPress={() => onToggleSelect?.(game.id)}
      >
        <View style={styles.checkbox}>
          <Feather
            name={selected ? "check-square" : "square"}
            size={22}
            color={selected ? theme.colorOrangePeel : theme.colorGrey}
          />
        </View>
        <View style={styles.details}>
          <MatchUpDisplay game={game} />
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.gameCard}>
      <Link href={`/games/${game.id}`} asChild>
        <Pressable style={styles.cardContent}>
          <View style={styles.details}>
            <MatchUpDisplay game={game} />
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
  gameCardSelected: {
    borderWidth: 1.5,
    borderColor: theme.colorOrangePeel,
  },
  cardContent: {
    flexDirection: "row",
    flex: 1,
  },
  checkbox: {
    justifyContent: "center",
    paddingRight: scale(8),
  },
  details: {
    padding: scale(8),
    justifyContent: "space-between",
    flex: 1,
  },
});
