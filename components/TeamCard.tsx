import { StyleSheet, View, Text, Pressable } from "react-native";
import { theme } from "@/theme";
import { useTeamStore } from "@/store/teamStore";
import { StatLineImage } from "./StatLineImage";
import { Link } from "expo-router";
import { TeamType } from "@/types/team";
import { calculateTeamPPG, formatRecord, formatStatForCard } from "@/logic/cardStats";
import { scale, moderateScale } from "@/utils/responsive";

export function TeamCard({ team }: { team: TeamType }) {
  const updateTeamId = useTeamStore(state => state.setCurrentTeamId);

  const handlePress = () => {
    updateTeamId(team.id);
  };

  const gamesPlayed = team.gameNumbers.gamesPlayed;
  const record = formatRecord(team.gameNumbers);
  const teamPPG = calculateTeamPPG(team);

  // Create accessibility label with team info
  const accessibilityLabel =
    gamesPlayed > 0
      ? `${team.name}, ${record} record, ${formatStatForCard(teamPPG)} points per game`
      : `${team.name}, no games played yet`;

  return (
    <Link href={`/${team.id}`} asChild>
      <Pressable
        style={styles.teamCard}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Double tap to view team details"
      >
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
  },
  details: {
    padding: scale(14),
    justifyContent: "center",
  },
  teamName: {
    fontSize: moderateScale(18),
    marginBottom: scale(4),
  },
  subtitle: {
    color: theme.colorGrey,
    fontSize: moderateScale(14),
  },
  record: {
    color: theme.colorOnyx,
    fontSize: moderateScale(14),
    marginBottom: scale(2),
  },
  ppg: {
    color: theme.colorGrey,
    fontSize: moderateScale(12),
  },
});
