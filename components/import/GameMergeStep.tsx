import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";
import { useGameStore } from "@/store/gameStore";
import { detectDuplicateGames } from "@/logic/importValidation";
import { Team } from "@/types/game";
import { Stat } from "@/types/stats";
import { StatLineExportGame, GameDecision, TeamDecision } from "@/types/statlineExport";
import Feather from "@expo/vector-icons/Feather";

type GameMergeStepProps = {
  importGames: StatLineExportGame[];
  teamDecision: TeamDecision;
  onContinue: (decisions: GameDecision[]) => void;
  onBack: () => void;
};

export function GameMergeStep({
  importGames,
  teamDecision,
  onContinue,
  onBack,
}: GameMergeStepProps) {
  const allGames = useGameStore(state => state.games);

  // Get existing games for the target team
  const existingTeamGames = useMemo(() => {
    if (teamDecision.type === "create") return [];
    return Object.values(allGames).filter(g => g.teamId === teamDecision.existingTeamId);
  }, [allGames, teamDecision]);

  // Detect duplicates
  const duplicateMap = useMemo(
    () => detectDuplicateGames(importGames, existingTeamGames),
    [importGames, existingTeamGames],
  );

  // Separate new games from potential duplicates
  const newGames = importGames.filter(g => !duplicateMap.get(g.originalId));
  const duplicateGames = importGames.filter(g => duplicateMap.get(g.originalId));

  // Selection state: new games pre-checked, duplicates pre-unchecked
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(newGames.map(g => g.originalId));
  });

  const toggleGame = (gameId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
  };

  const handleContinue = () => {
    const decisions: GameDecision[] = importGames.map(g => ({
      originalId: g.originalId,
      include: selectedIds.has(g.originalId),
    }));
    onContinue(decisions);
  };

  const formatScore = (game: StatLineExportGame) => {
    const us = game.statTotals[Team.Us][Stat.Points] || 0;
    const opp = game.statTotals[Team.Opponent][Stat.Points] || 0;
    return `${us} - ${opp}`;
  };

  const renderGameRow = (game: StatLineExportGame, isDuplicate: boolean) => {
    const isSelected = selectedIds.has(game.originalId);
    return (
      <TouchableOpacity
        key={game.originalId}
        style={[styles.gameRow, isSelected && styles.gameRowSelected]}
        onPress={() => toggleGame(game.originalId)}
      >
        <Feather
          name={isSelected ? "check-square" : "square"}
          size={22}
          color={isSelected ? theme.colorOrangePeel : theme.colorGrey}
        />
        <View style={styles.gameInfo}>
          <Text style={styles.gameName}>vs {game.opposingTeamName}</Text>
          <Text style={styles.gameScore}>
            {formatScore(game)}
            {game.isFinished ? "" : " (In Progress)"}
          </Text>
        </View>
        {isDuplicate && (
          <View style={styles.duplicateBadge}>
            <Feather name="alert-triangle" size={14} color={theme.colorWarning} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Games</Text>
        <Text style={styles.subtitle}>
          Choose which games to import ({selectedIds.size} selected)
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {newGames.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>New Games</Text>
            {newGames.map(g => renderGameRow(g, false))}
          </>
        )}

        {duplicateGames.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Possible Duplicates</Text>
            <Text style={styles.warningText}>These games may already exist on this device</Text>
            {duplicateGames.map(g => renderGameRow(g, true))}
          </>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.continueButton, selectedIds.size === 0 && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={selectedIds.size === 0}
        >
          <Text style={styles.continueButtonText}>
            Import {selectedIds.size} {selectedIds.size === 1 ? "game" : "games"}
          </Text>
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
  warningText: {
    fontSize: moderateScale(12),
    color: theme.colorWarning,
    marginBottom: scale(4),
  },
  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(14),
    borderRadius: scale(10),
    backgroundColor: theme.colorLightGrey,
    gap: scale(12),
  },
  gameRowSelected: {
    backgroundColor: theme.colorWhite,
    borderWidth: 1.5,
    borderColor: theme.colorOrangePeel,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: theme.colorOnyx,
  },
  gameScore: {
    fontSize: moderateScale(13),
    color: theme.colorGrey,
    marginTop: 2,
  },
  duplicateBadge: {
    padding: scale(4),
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
  continueButtonDisabled: {
    opacity: 0.5,
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
