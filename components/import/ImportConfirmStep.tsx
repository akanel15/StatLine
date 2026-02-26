import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";
import { TeamDecision, PlayerDecision, SetDecision, GameDecision } from "@/types/statlineExport";
import Feather from "@expo/vector-icons/Feather";

type ImportConfirmStepProps = {
  teamDecision: TeamDecision;
  playerDecisions: PlayerDecision[];
  setDecisions: SetDecision[];
  gameDecisions: GameDecision[];
  onConfirm: () => Promise<void>;
  onBack: () => void;
};

export function ImportConfirmStep({
  teamDecision,
  playerDecisions,
  setDecisions,
  gameDecisions,
  onConfirm,
  onBack,
}: ImportConfirmStepProps) {
  const [isImporting, setIsImporting] = useState(false);

  const gamesIncluded = gameDecisions.filter(g => g.include).length;
  const newPlayers = playerDecisions.filter(p => p.type === "create").length;
  const matchedPlayers = playerDecisions.filter(p => p.type === "match").length;
  const newSets = setDecisions.filter(s => s.type === "create").length;
  const matchedSets = setDecisions.filter(s => s.type === "match").length;

  const handleImport = async () => {
    setIsImporting(true);
    try {
      await onConfirm();
    } catch {
      setIsImporting(false);
    }
  };

  if (isImporting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colorOrangePeel} />
        <Text style={styles.loadingText}>Importing games...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Confirm Import</Text>
        <Text style={styles.subtitle}>Review your choices before importing</Text>

        <View style={styles.summaryCard}>
          {/* Team */}
          <View style={styles.summaryRow}>
            <Feather name="users" size={20} color={theme.colorOnyx} />
            <Text style={styles.summaryText}>
              {teamDecision.type === "create" ? (
                <>
                  Create team: <Text style={styles.bold}>{teamDecision.name}</Text>
                </>
              ) : (
                <>Add to existing team</>
              )}
            </Text>
          </View>

          {/* Players */}
          <View style={styles.summaryRow}>
            <Feather name="user" size={20} color={theme.colorOnyx} />
            <Text style={styles.summaryText}>
              {newPlayers > 0 && <Text style={styles.bold}>{newPlayers} new</Text>}
              {newPlayers > 0 && matchedPlayers > 0 && ", "}
              {matchedPlayers > 0 && <Text>{matchedPlayers} matched</Text>}
              {newPlayers === 0 && matchedPlayers === 0 && "No players"}{" "}
              {playerDecisions.length === 1 ? "player" : "players"}
            </Text>
          </View>

          {/* Sets */}
          {setDecisions.length > 0 && (
            <View style={styles.summaryRow}>
              <Feather name="layers" size={20} color={theme.colorOnyx} />
              <Text style={styles.summaryText}>
                {newSets > 0 && <Text style={styles.bold}>{newSets} new</Text>}
                {newSets > 0 && matchedSets > 0 && ", "}
                {matchedSets > 0 && <Text>{matchedSets} matched</Text>}
                {newSets === 0 && matchedSets === 0 && "No"}{" "}
                {setDecisions.length === 1 ? "set" : "sets"}
              </Text>
            </View>
          )}

          {/* Games */}
          <View style={styles.summaryRow}>
            <Feather name="activity" size={20} color={theme.colorOnyx} />
            <Text style={styles.summaryText}>
              <Text style={styles.bold}>{gamesIncluded}</Text>{" "}
              {gamesIncluded === 1 ? "game" : "games"} to import
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.importButton} onPress={handleImport}>
          <Feather name="download" size={20} color={theme.colorWhite} />
          <Text style={styles.importButtonText}>Import</Text>
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
    justifyContent: "space-between",
    padding: scale(24),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: scale(12),
  },
  loadingText: {
    fontSize: moderateScale(16),
    color: theme.colorGrey,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: scale(8),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: "700",
    color: theme.colorOnyx,
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: theme.colorGrey,
    marginBottom: scale(24),
  },
  summaryCard: {
    backgroundColor: theme.colorLightGrey,
    borderRadius: scale(12),
    padding: scale(20),
    gap: scale(16),
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  summaryText: {
    fontSize: moderateScale(15),
    color: theme.colorOnyx,
    flex: 1,
  },
  bold: {
    fontWeight: "700",
  },
  buttonContainer: {
    gap: scale(12),
  },
  importButton: {
    backgroundColor: theme.colorOrangePeel,
    borderRadius: scale(12),
    padding: scale(16),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: scale(8),
  },
  importButtonText: {
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
