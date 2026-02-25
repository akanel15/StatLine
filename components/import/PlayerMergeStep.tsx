import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";
import { usePlayerStore } from "@/store/playerStore";
import { autoMatchPlayers } from "@/logic/importValidation";
import { StatLineExportPlayer, PlayerDecision, TeamDecision } from "@/types/statlineExport";
import Feather from "@expo/vector-icons/Feather";

type PlayerMergeStepProps = {
  importPlayers: StatLineExportPlayer[];
  teamDecision: TeamDecision;
  onContinue: (decisions: PlayerDecision[]) => void;
  onBack: () => void;
};

export function PlayerMergeStep({
  importPlayers,
  teamDecision,
  onContinue,
  onBack,
}: PlayerMergeStepProps) {
  const allPlayers = usePlayerStore(state => state.players);

  // Get existing players for the target team
  const existingPlayers = useMemo(() => {
    if (teamDecision.type === "create") return [];
    return Object.values(allPlayers).filter(p => p.teamId === teamDecision.existingTeamId);
  }, [allPlayers, teamDecision]);

  // Auto-match players
  const autoMatches = useMemo(
    () => autoMatchPlayers(importPlayers, existingPlayers),
    [importPlayers, existingPlayers],
  );

  // State for user overrides (key: originalId, value: existingPlayerId or null for create)
  const [overrides, setOverrides] = useState<Map<string, string | null>>(
    () => new Map(autoMatches),
  );

  const handleTogglePlayer = (originalId: string, existingId: string | null) => {
    setOverrides(prev => {
      const next = new Map(prev);
      next.set(originalId, existingId);
      return next;
    });
  };

  const handleContinue = () => {
    const decisions: PlayerDecision[] = importPlayers.map(p => {
      const matchId = overrides.get(p.originalId);
      if (matchId) {
        return { type: "match", originalId: p.originalId, existingPlayerId: matchId };
      }
      return { type: "create", originalId: p.originalId, name: p.name, number: p.number };
    });
    onContinue(decisions);
  };

  const matched = importPlayers.filter(p => overrides.get(p.originalId));
  const unmatched = importPlayers.filter(p => !overrides.get(p.originalId));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Match Players</Text>
        <Text style={styles.subtitle}>
          {importPlayers.length} {importPlayers.length === 1 ? "player" : "players"} to import
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {/* Matched section */}
        {matched.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Matched</Text>
            {matched.map(p => {
              const matchedId = overrides.get(p.originalId)!;
              const matchedPlayer = allPlayers[matchedId];
              return (
                <View key={p.originalId} style={styles.playerRow}>
                  <View style={styles.playerInfo}>
                    <Feather name="check-circle" size={18} color={theme.colorSuccess} />
                    <Text style={styles.playerName}>
                      {p.name} #{p.number}
                    </Text>
                  </View>
                  <View style={styles.matchInfo}>
                    <Feather name="arrow-right" size={14} color={theme.colorGrey} />
                    <Text style={styles.matchText}>
                      {matchedPlayer?.name || "Unknown"} #{matchedPlayer?.number || ""}
                    </Text>
                  </View>
                  <TouchableOpacity
                    hitSlop={10}
                    onPress={() => handleTogglePlayer(p.originalId, null)}
                  >
                    <Feather name="x" size={18} color={theme.colorGrey} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {/* Unmatched section */}
        {unmatched.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>New Players</Text>
            {unmatched.map(p => (
              <View key={p.originalId} style={styles.playerRow}>
                <View style={styles.playerInfo}>
                  <Feather name="user-plus" size={18} color={theme.colorOrangePeel} />
                  <Text style={styles.playerName}>
                    {p.name} #{p.number}
                  </Text>
                </View>
                {existingPlayers.length > 0 && (
                  <View style={styles.matchOptions}>
                    {existingPlayers.map(ep => (
                      <TouchableOpacity
                        key={ep.id}
                        style={styles.matchChip}
                        onPress={() => handleTogglePlayer(p.originalId, ep.id)}
                      >
                        <Text style={styles.matchChipText} numberOfLines={1}>
                          {ep.name} #{ep.number}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {importPlayers.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No players in this export</Text>
          </View>
        )}
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
  list: {
    flex: 1,
  },
  listContent: {
    gap: scale(8),
    paddingBottom: scale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: theme.colorGrey,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: scale(8),
    marginBottom: scale(4),
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(12),
    borderRadius: scale(10),
    backgroundColor: theme.colorLightGrey,
    gap: scale(8),
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    flex: 1,
  },
  playerName: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: theme.colorOnyx,
  },
  matchInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  matchText: {
    fontSize: moderateScale(13),
    color: theme.colorGrey,
  },
  matchOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(6),
    maxWidth: "50%",
  },
  matchChip: {
    backgroundColor: theme.colorWhite,
    borderWidth: 1,
    borderColor: theme.colorOrangePeel,
    borderRadius: scale(6),
    paddingVertical: scale(4),
    paddingHorizontal: scale(8),
  },
  matchChipText: {
    fontSize: moderateScale(12),
    color: theme.colorOrangePeel,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: scale(24),
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: theme.colorGrey,
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
