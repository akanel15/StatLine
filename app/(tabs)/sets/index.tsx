import { StatLineButton } from "@/components/StatLineButton";
import { SetCard } from "@/components/SetCard";
import { useSetStore } from "@/store/setStore";
import { useTeamStore } from "@/store/teamStore";
import { theme } from "@/theme";
import { router } from "expo-router";
import { FlatList, StyleSheet } from "react-native";

export default function Sets() {
  const sets = useSetStore(state => state.sets);
  const setList = Object.values(sets);
  const currentTeamId = useTeamStore(state => state.currentTeamId);
  const teamSets = setList.filter(set => set.teamId === currentTeamId);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      data={teamSets}
      renderItem={({ item }) => <SetCard set={item} />}
      ListEmptyComponent={
        <StatLineButton
          title="Add your first Set"
          onPress={() => router.navigate("/sets/newSet")}
        />
      }
    />
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
