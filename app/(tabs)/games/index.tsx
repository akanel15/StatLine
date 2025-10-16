import { StatLineButton } from "@/components/StatLineButton";
import { GameCard } from "@/components/GameCard";
import { useGameStore } from "@/store/gameStore";
import { useTeamStore } from "@/store/teamStore";
import { theme } from "@/theme";
import { router } from "expo-router";
import { FlatList, StyleSheet } from "react-native";

export default function Games() {
  const games = useGameStore(state => state.games);
  const gameList = Object.values(games);
  const currentTeamId = useTeamStore(state => state.currentTeamId);
  const teamGames = gameList.filter(game => game.teamId === currentTeamId);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      data={teamGames}
      renderItem={({ item }) => <GameCard game={item}></GameCard>}
      ListEmptyComponent={
        <StatLineButton
          title="Add your first game"
          onPress={() => router.navigate("/games/newGame")}
        ></StatLineButton>
      }
    ></FlatList>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  contentContainer: {
    padding: 12,
    shadowColor: theme.colorBlack,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    elevation: 5,
  },
});
