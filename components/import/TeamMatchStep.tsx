import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";
import { useTeamStore } from "@/store/teamStore";
import { TeamDecision } from "@/types/statlineExport";
import Feather from "@expo/vector-icons/Feather";

type TeamMatchStepProps = {
  importTeamName: string;
  onContinue: (decision: TeamDecision) => void;
  onBack: () => void;
};

export function TeamMatchStep({ importTeamName, onContinue, onBack }: TeamMatchStepProps) {
  const teams = useTeamStore(state => state.teams);
  const existingTeams = Object.values(teams);

  // Auto-select best name match
  const autoMatch = existingTeams.find(t => t.name.toLowerCase() === importTeamName.toLowerCase());

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(autoMatch?.id ?? null);

  const handleContinue = () => {
    if (selectedTeamId) {
      onContinue({ type: "match", existingTeamId: selectedTeamId });
    } else {
      onContinue({ type: "create", name: importTeamName });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Match Team</Text>
        <Text style={styles.subtitle}>
          Import data for: <Text style={styles.bold}>{importTeamName}</Text>
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {/* Create New option */}
        <TouchableOpacity
          style={[styles.option, selectedTeamId === null && styles.optionSelected]}
          onPress={() => setSelectedTeamId(null)}
        >
          <View style={styles.optionLeft}>
            <Feather
              name={selectedTeamId === null ? "check-circle" : "circle"}
              size={22}
              color={selectedTeamId === null ? theme.colorOrangePeel : theme.colorGrey}
            />
            <View>
              <Text style={styles.optionTitle}>Create New Team</Text>
              <Text style={styles.optionSubtitle}>"{importTeamName}"</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Existing teams */}
        {existingTeams.map(team => {
          const isSelected = selectedTeamId === team.id;
          const record = `${team.gameNumbers.wins}W - ${team.gameNumbers.losses}L`;
          return (
            <TouchableOpacity
              key={team.id}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => setSelectedTeamId(team.id)}
            >
              <View style={styles.optionLeft}>
                <Feather
                  name={isSelected ? "check-circle" : "circle"}
                  size={22}
                  color={isSelected ? theme.colorOrangePeel : theme.colorGrey}
                />
                <View>
                  <Text style={styles.optionTitle}>{team.name}</Text>
                  <Text style={styles.optionSubtitle}>{record}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: scale(24),
  },
  header: {
    marginBottom: scale(16),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: "700",
    color: theme.colorOnyx,
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: theme.colorGrey,
    marginTop: scale(4),
  },
  bold: {
    fontWeight: "700",
    color: theme.colorOnyx,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: scale(10),
    paddingBottom: scale(12),
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: scale(16),
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderColor: theme.colorLightGrey,
    backgroundColor: theme.colorWhite,
  },
  optionSelected: {
    borderColor: theme.colorOrangePeel,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  optionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: theme.colorOnyx,
  },
  optionSubtitle: {
    fontSize: moderateScale(12),
    color: theme.colorGrey,
    marginTop: 2,
  },
  buttonContainer: {
    gap: scale(12),
    marginTop: scale(12),
  },
  continueButton: {
    backgroundColor: theme.colorOrangePeel,
    borderRadius: scale(12),
    padding: scale(16),
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: theme.colorWhite,
  },
  backButton: {
    backgroundColor: theme.colorLightGrey,
    borderRadius: scale(12),
    padding: scale(16),
    alignItems: "center",
  },
  backButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: theme.colorOnyx,
  },
});
