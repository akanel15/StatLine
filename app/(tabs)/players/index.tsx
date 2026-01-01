import { PlayerCard } from "@/components/PlayerCard";
import { theme } from "@/theme";
import { router } from "expo-router";
import { FlatList, StyleSheet } from "react-native";
import { StatLineButton } from "@/components/StatLineButton";
import { usePlayerStore } from "@/store/playerStore";
import { useTeamStore } from "@/store/teamStore";

export default function App() {
  const teamId = useTeamStore(state => state.currentTeamId);

  const players = usePlayerStore(state => state.players);
  const playersList = Object.values(players);
  const teamPlayers = playersList
    .filter(player => player.teamId === teamId)
    .sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      data={teamPlayers}
      renderItem={({ item }) => <PlayerCard player={item}></PlayerCard>}
      ListEmptyComponent={
        <StatLineButton
          title="Add your first player"
          onPress={() => router.navigate("/players/newPlayer")}
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
