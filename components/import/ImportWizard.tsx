import { useState } from "react";
import { Alert, SafeAreaView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { theme } from "@/theme";
import {
  StatLineExport,
  TeamDecision,
  PlayerDecision,
  GameDecision,
  ImportDecisions,
} from "@/types/statlineExport";
import { executeImport } from "@/logic/importData";
import { useGameStore } from "@/store/gameStore";
import { useTeamStore } from "@/store/teamStore";
import { usePlayerStore } from "@/store/playerStore";
import { ImportSummaryStep } from "./ImportSummaryStep";
import { TeamMatchStep } from "./TeamMatchStep";
import { PlayerMergeStep } from "./PlayerMergeStep";
import { GameMergeStep } from "./GameMergeStep";
import { ImportConfirmStep } from "./ImportConfirmStep";

type WizardStep = "summary" | "team" | "players" | "games" | "confirm";

type ImportWizardProps = {
  exportData: StatLineExport;
};

export function ImportWizard({ exportData }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>("summary");
  const [teamDecision, setTeamDecision] = useState<TeamDecision | null>(null);
  const [playerDecisions, setPlayerDecisions] = useState<PlayerDecision[]>([]);
  const [gameDecisions, setGameDecisions] = useState<GameDecision[]>([]);

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleTeamContinue = (decision: TeamDecision) => {
    setTeamDecision(decision);
    if (exportData.players.length > 0) {
      setStep("players");
    } else {
      // Skip player step if no players
      setPlayerDecisions([]);
      setStep("games");
    }
  };

  const handlePlayersContinue = (decisions: PlayerDecision[]) => {
    setPlayerDecisions(decisions);
    setStep("games");
  };

  const handleGamesContinue = (decisions: GameDecision[]) => {
    setGameDecisions(decisions);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!teamDecision) return;

    const decisions: ImportDecisions = {
      team: teamDecision,
      players: playerDecisions,
      games: gameDecisions,
    };

    try {
      const importGame = useGameStore.getState().importGame;
      const {
        addTeamSync,
        updateGamesPlayed: updateTeamGamesPlayed,
        batchUpdateStats: teamBatchUpdate,
      } = useTeamStore.getState();
      const {
        addPlayerSync,
        updateGamesPlayed: updatePlayerGamesPlayed,
        batchUpdateStats: playerBatchUpdate,
      } = usePlayerStore.getState();

      const teamId = executeImport(exportData, decisions, {
        gameStore: { importGame },
        teamStore: {
          addTeamSync,
          updateGamesPlayed: updateTeamGamesPlayed,
          batchUpdateStats: teamBatchUpdate,
        },
        playerStore: {
          addPlayerSync,
          updateGamesPlayed: updatePlayerGamesPlayed,
          batchUpdateStats: playerBatchUpdate,
        },
      });

      // Navigate to the imported team
      useTeamStore.getState().setCurrentTeamId(teamId);
      router.replace(`/(tabs)/${teamId}`);
    } catch (err) {
      console.error("Import failed:", err);
      Alert.alert(
        "Import Failed",
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
      throw err; // Re-throw so ImportConfirmStep keeps showing
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {step === "summary" && (
        <ImportSummaryStep
          exportData={exportData}
          onContinue={() => setStep("team")}
          onCancel={handleCancel}
        />
      )}
      {step === "team" && (
        <TeamMatchStep
          importTeamName={exportData.team.name}
          onContinue={handleTeamContinue}
          onBack={() => setStep("summary")}
        />
      )}
      {step === "players" && teamDecision && (
        <PlayerMergeStep
          importPlayers={exportData.players}
          teamDecision={teamDecision}
          onContinue={handlePlayersContinue}
          onBack={() => setStep("team")}
        />
      )}
      {step === "games" && teamDecision && (
        <GameMergeStep
          importGames={exportData.games}
          teamDecision={teamDecision}
          onContinue={handleGamesContinue}
          onBack={exportData.players.length > 0 ? () => setStep("players") : () => setStep("team")}
        />
      )}
      {step === "confirm" && teamDecision && (
        <ImportConfirmStep
          teamDecision={teamDecision}
          playerDecisions={playerDecisions}
          gameDecisions={gameDecisions}
          onConfirm={handleConfirm}
          onBack={() => setStep("games")}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
});
