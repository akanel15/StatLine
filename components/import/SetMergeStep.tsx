import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";
import { useSetStore } from "@/store/setStore";
import { autoMatchSets } from "@/logic/importValidation";
import { StatLineExportSet, SetDecision, TeamDecision } from "@/types/statlineExport";
import Feather from "@expo/vector-icons/Feather";

type SetMergeStepProps = {
  importSets: StatLineExportSet[];
  teamDecision: TeamDecision;
  onContinue: (decisions: SetDecision[]) => void;
  onBack: () => void;
};

export function SetMergeStep({ importSets, teamDecision, onContinue, onBack }: SetMergeStepProps) {
  const allSets = useSetStore(state => state.sets);

  // Get existing sets for the target team
  const existingSets = useMemo(() => {
    if (teamDecision.type === "create") return [];
    return Object.values(allSets).filter(s => s.teamId === teamDecision.existingTeamId);
  }, [allSets, teamDecision]);

  // Auto-match sets
  const autoMatches = useMemo(
    () => autoMatchSets(importSets, existingSets),
    [importSets, existingSets],
  );

  // State for user overrides (key: originalId, value: existingSetId or null for create)
  const [overrides, setOverrides] = useState<Map<string, string | null>>(
    () => new Map(autoMatches),
  );

  const handleToggleSet = (originalId: string, existingId: string | null) => {
    setOverrides(prev => {
      const next = new Map(prev);
      next.set(originalId, existingId);
      return next;
    });
  };

  const handleContinue = () => {
    const decisions: SetDecision[] = importSets.map(s => {
      const matchId = overrides.get(s.originalId);
      if (matchId) {
        return { type: "match", originalId: s.originalId, existingSetId: matchId };
      }
      return { type: "create", originalId: s.originalId, name: s.name };
    });
    onContinue(decisions);
  };

  const matched = importSets.filter(s => overrides.get(s.originalId));
  const unmatched = importSets.filter(s => !overrides.get(s.originalId));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Match Sets</Text>
        <Text style={styles.subtitle}>
          {importSets.length} {importSets.length === 1 ? "set" : "sets"} to import
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {/* Matched section */}
        {matched.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Matched</Text>
            {matched.map(s => {
              const matchedId = overrides.get(s.originalId)!;
              const matchedSet = allSets[matchedId];
              return (
                <View key={s.originalId} style={styles.setRow}>
                  <View style={styles.setInfo}>
                    <Feather name="check-circle" size={18} color={theme.colorSuccess} />
                    <Text style={styles.setName}>{s.name}</Text>
                  </View>
                  <View style={styles.matchInfo}>
                    <Feather name="arrow-right" size={14} color={theme.colorGrey} />
                    <Text style={styles.matchText}>{matchedSet?.name || "Unknown"}</Text>
                  </View>
                  <TouchableOpacity
                    hitSlop={10}
                    onPress={() => handleToggleSet(s.originalId, null)}
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
            <Text style={styles.sectionTitle}>New Sets</Text>
            {unmatched.map(s => (
              <View key={s.originalId} style={styles.setRow}>
                <View style={styles.setInfo}>
                  <Feather name="plus-circle" size={18} color={theme.colorOrangePeel} />
                  <Text style={styles.setName}>{s.name}</Text>
                </View>
                {existingSets.length > 0 && (
                  <View style={styles.matchOptions}>
                    {existingSets.map(es => (
                      <TouchableOpacity
                        key={es.id}
                        style={styles.matchChip}
                        onPress={() => handleToggleSet(s.originalId, es.id)}
                      >
                        <Text style={styles.matchChipText} numberOfLines={1}>
                          {es.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {importSets.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No sets in this export</Text>
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
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(12),
    borderRadius: scale(10),
    backgroundColor: theme.colorLightGrey,
    gap: scale(8),
  },
  setInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    flex: 1,
  },
  setName: {
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
