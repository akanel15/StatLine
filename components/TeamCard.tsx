import { StyleSheet, View, Text, Pressable } from "react-native";
import { theme } from "@/theme";
import { useTeamStore } from "@/store/teamStore";
import { StatLineImage } from "./StatLineImage";
import { Link } from "expo-router";
import { TeamType } from "@/types/team";
import { calculateTeamPPG, formatRecord, formatStatForCard } from "@/logic/cardStats";

export function TeamCard({ team }: { team: TeamType }) {
  const updateTeamId = useTeamStore(state => state.setCurrentTeamId);

  const handlePress = () => {
    updateTeamId(team.id);
  };

  const gamesPlayed = team.gameNumbers.gamesPlayed;
  const record = formatRecord(team.gameNumbers);
  const teamPPG = calculateTeamPPG(team);

  return (
    <Link href={`/${team.id}`} asChild>
      <Pressable style={styles.teamCard} onPress={handlePress}>
        <StatLineImage size={80} imageUri={team.imageUri} />

        <View style={styles.details}>
          <Text numberOfLines={1} style={styles.teamName}>
            {team.name}
          </Text>
          {gamesPlayed > 0 ? (
            <>
              <Text style={styles.record}>{record} Record</Text>
              <Text style={styles.ppg}>{formatStatForCard(teamPPG)} PPG</Text>
            </>
          ) : (
            <Text style={styles.subtitle}>No games yet</Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  teamCard: {
    flexDirection: "row",
    shadowColor: theme.colorBlack,
    backgroundColor: theme.colorWhite,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,

    elevation: 3,
  },
  details: {
    padding: 14,
    justifyContent: "center",
  },
  teamName: {
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colorGrey,
  },
  record: {
    color: theme.colorOnyx,
    fontSize: 14,
    marginBottom: 2,
  },
  ppg: {
    color: theme.colorGrey,
    fontSize: 12,
  },
});
