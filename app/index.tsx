import { TeamCard } from "@/components/TeamCard";
import { theme } from "@/theme";
import { router } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatLineButton } from "@/components/StatLineButton";
import { useTeamStore } from "@/store/teamStore";
import { Link } from "expo-router";
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

      {/* Footer with Privacy Policy link */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.navigate("/privacy")} hitSlop={10}>
          <Text style={styles.privacyLink}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      {/* Debug Section - Development only */}
      {__DEV__ && (
        <View style={styles.debugSection}>
          <Link href="/debug/home" asChild>
            <StatLineButton
              title="🔧 Debug & Development Tools"
              color={theme.colorGrey}
              onPress={() => {}}
            />
          </Link>
        </View>
      )}
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
  debugSection: {
    padding: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
    backgroundColor: theme.colorWhite,
  },
  footer: {
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
    backgroundColor: theme.colorWhite,
  },
  privacyLink: {
    color: theme.colorGrey,
    fontSize: 14,
  },
});
