import { TeamCard } from "@/components/TeamCard";
import { theme } from "@/theme";
import { router } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { StatLineButton } from "@/components/StatLineButton";
import { useTeamStore } from "@/store/teamStore";
import { useEffect } from "react";
import { runAppLoadHealthCheck } from "@/utils/appHealthCheck";

export default function App() {
  const teams = useTeamStore(state => state.teams);
  const teamList = Object.values(teams);

  // Run health check on app load to ensure data integrity
  useEffect(() => {
    runAppLoadHealthCheck().then(report => {
      if (__DEV__) {
        console.log("Health check report:", report);
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.listContainer}
        contentContainerStyle={styles.contentContainer}
        data={teamList}
        renderItem={({ item }) => <TeamCard team={item} />}
        ListEmptyComponent={
          <StatLineButton title="Add your first team" onPress={() => router.navigate("/newTeam")} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  listContainer: {
    flex: 1,
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
