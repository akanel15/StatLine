import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTeamStore } from "@/store/teamStore";
import { useSetStore } from "@/store/setStore";
import { Stat } from "@/types/stats";
import { Team, PeriodType } from "@/types/game";
import { Result } from "@/types/player";
import { simulatePossession as simulatePossessionLogic } from "@/logic/possessionSimulation";
import type { PossessionConfig } from "@/logic/possessionSimulation";
import { StatUpdateStoreActions } from "@/logic/statUpdates";

export interface GameSimulatorConfig {
  teamId: string;
  opponentName: string;
  targetScore: { min: number; max: number };
  opponentScore: { min: number; max: number };
  periodType: PeriodType;
  shootingPercentages?: {
    twoPoint: number; // 0-1, default 0.45
    threePoint: number; // 0-1, default 0.35
    freeThrow: number; // 0-1, default 0.75
  };
  realism?: "low" | "medium" | "high"; // low = predictable, high = more variance
}

/**
 * Simulates a complete basketball game using real game store functions
 */
export async function simulateGame(config: GameSimulatorConfig): Promise<string> {
  const {
    teamId,
    opponentName,
    targetScore,
    opponentScore,
    periodType,
    shootingPercentages = {
      twoPoint: 0.45,
      threePoint: 0.35,
      freeThrow: 0.75,
    },
    realism = "medium",
  } = config;

  // Get team players
  const playerStore = usePlayerStore.getState();
  const allPlayers = Object.values(playerStore.players);
  const teamPlayers = allPlayers.filter((p) => p.teamId === teamId);

  if (teamPlayers.length === 0) {
    throw new Error("No players found for this team");
  }

  // Create the game
  const gameId = useGameStore.getState().addGame(teamId, opponentName, periodType);

  // Use up to 10 players (or all if less)
  const activePlayers = teamPlayers.slice(0, Math.min(10, teamPlayers.length));
  const activePlayerIds = activePlayers.map((p) => p.id);

  // Separate starters (first 5) and bench (rest)
  const starterIds = activePlayerIds.slice(0, 5);
  const benchIds = activePlayerIds.slice(5);

  useGameStore.getState().setActivePlayers(gameId, activePlayerIds);
  useGameStore.getState().addPlayersToGamePlayedList(gameId, activePlayerIds);

  // Set active sets (first 5 if available)
  const teamSets = Object.values(useSetStore.getState().sets).filter((s) => s.teamId === teamId);
  if (teamSets.length > 0) {
    const activeSetIds = teamSets.slice(0, 5).map((s) => s.id);
    useGameStore.getState().setActiveSets(gameId, activeSetIds);
  }

  // Calculate target scores with randomness
  const varianceMultiplier = realism === "low" ? 0.05 : realism === "medium" ? 0.1 : 0.2;
  const ourFinalScore =
    Math.floor(Math.random() * (targetScore.max - targetScore.min + 1)) + targetScore.min;
  const theirFinalScore =
    Math.floor(Math.random() * (opponentScore.max - opponentScore.min + 1)) + opponentScore.min;

  const numPeriods = periodType === PeriodType.Quarters ? 4 : 2;

  // Simulate each period
  for (let period = 0; period < numPeriods; period++) {
    await simulatePeriod({
      gameId,
      teamId,
      period,
      starterIds,
      benchIds,
      activeSetIds: teamSets.slice(0, 5).map((s) => s.id),
      ourTargetScore: Math.floor(ourFinalScore / numPeriods) + getVariance(5, varianceMultiplier),
      opponentTargetScore:
        Math.floor(theirFinalScore / numPeriods) + getVariance(5, varianceMultiplier),
      shootingPercentages,
      realism,
    });
  }

  // Get fresh state to access the completed game
  const freshGameState = useGameStore.getState();
  const finalGame = freshGameState.games[gameId];

  if (!finalGame) {
    throw new Error(`Game ${gameId} not found after simulation`);
  }

  // Mark game as finished
  useGameStore.getState().markGameAsFinished(gameId);

  // Calculate result and update team/player records
  const ourPoints = finalGame.statTotals[Team.Us][Stat.Points] || 0;
  const theirPoints = finalGame.statTotals[Team.Opponent][Stat.Points] || 0;
  const result =
    ourPoints > theirPoints ? Result.Win : ourPoints < theirPoints ? Result.Loss : Result.Draw;

  useTeamStore.getState().updateGamesPlayed(teamId, result);
  activePlayerIds.forEach((playerId) => {
    usePlayerStore.getState().updateGamesPlayed(playerId, result);
  });

  return gameId;
}

interface PeriodSimConfig {
  gameId: string;
  teamId: string;
  period: number;
  starterIds: string[];
  benchIds: string[];
  activeSetIds: string[];
  ourTargetScore: number;
  opponentTargetScore: number;
  shootingPercentages: {
    twoPoint: number;
    threePoint: number;
    freeThrow: number;
  };
  realism: "low" | "medium" | "high";
}

/**
 * Simulates a single period of a game
 */
async function simulatePeriod(config: PeriodSimConfig): Promise<void> {
  const {
    gameId,
    teamId,
    period,
    starterIds,
    benchIds,
    activeSetIds,
    ourTargetScore,
    opponentTargetScore,
    shootingPercentages,
    realism,
  } = config;

  let ourScore = 0;
  let opponentScore = 0;

  // Alternate possessions until we reach target scores
  let possession = Math.random() > 0.5 ? Team.Us : Team.Opponent;

  while (ourScore < ourTargetScore || opponentScore < opponentTargetScore) {
    if (possession === Team.Us && ourScore < ourTargetScore) {
      const points = simulatePossession({
        gameId,
        teamId,
        period,
        starterIds,
        benchIds,
        activeSetIds,
        isOurTeam: true,
        shootingPercentages,
        realism,
      });
      ourScore += points;
      possession = Team.Opponent;
    } else if (possession === Team.Opponent && opponentScore < opponentTargetScore) {
      const points = simulatePossession({
        gameId,
        teamId,
        period,
        starterIds,
        benchIds,
        activeSetIds,
        isOurTeam: false,
        shootingPercentages,
        realism,
      });
      opponentScore += points;
      possession = Team.Us;
    } else {
      // Switch possession if one team has reached target
      possession = possession === Team.Us ? Team.Opponent : Team.Us;
    }

    // Safety check to prevent infinite loops
    if (ourScore > ourTargetScore + 20 || opponentScore > opponentTargetScore + 20) {
      break;
    }
  }
}

/**
 * Simulates a single possession using the extracted logic
 * This now uses the same stat update functions as manual games
 */
function simulatePossession(config: PossessionConfig): number {
  // Create store actions for dependency injection
  const stores: StatUpdateStoreActions = {
    updateBoxScore: useGameStore.getState().updateBoxScore,
    updateTotals: useGameStore.getState().updateTotals,
    updatePeriods: useGameStore.getState().updatePeriods,
    updateGameSetStats: useGameStore.getState().updateSetStats,
    incrementSetRunCount: useGameStore.getState().incrementSetRunCount,
    updateTeamStats: useTeamStore.getState().updateStats,
    updatePlayerStats: usePlayerStore.getState().updateStats,
    updateSetStats: useSetStore.getState().updateStats,
    incrementGlobalSetRunCount: useSetStore.getState().incrementRunCount,
  };

  // Use the extracted possession simulation logic
  return simulatePossessionLogic(stores, config);
}

/**
 * Generates a random variance value
 */
function getVariance(baseVariance: number, multiplier: number): number {
  return Math.floor((Math.random() - 0.5) * 2 * baseVariance * multiplier);
}

/**
 * Gets display name for realism levels
 */
export function getRealismDisplayName(realism: "low" | "medium" | "high"): string {
  switch (realism) {
    case "low":
      return "Low (Predictable)";
    case "medium":
      return "Medium (Balanced)";
    case "high":
      return "High (Variable)";
  }
}
