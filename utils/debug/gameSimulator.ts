import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTeamStore } from "@/store/teamStore";
import { useSetStore } from "@/store/setStore";
import { Stat } from "@/types/stats";
import { Team, PeriodType } from "@/types/game";
import { Result } from "@/types/player";

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

interface PossessionConfig {
  gameId: string;
  teamId: string;
  period: number;
  starterIds: string[];
  benchIds: string[];
  activeSetIds: string[];
  isOurTeam: boolean;
  shootingPercentages: {
    twoPoint: number;
    threePoint: number;
    freeThrow: number;
  };
  realism: "low" | "medium" | "high";
}

/**
 * Selects a player with weighted probability (starters 70%, bench 30%)
 */
function selectWeightedPlayer(starterIds: string[], benchIds: string[]): string {
  // If no bench players, always use starters
  if (benchIds.length === 0) {
    return starterIds[Math.floor(Math.random() * starterIds.length)];
  }

  // 70% chance for starters, 30% for bench
  const useStarter = Math.random() < 0.7;
  const pool = useStarter ? starterIds : benchIds;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Simulates a single possession - returns points scored
 */
function simulatePossession(config: PossessionConfig): number {
  const {
    gameId,
    teamId,
    period,
    starterIds,
    benchIds,
    activeSetIds,
    isOurTeam,
    shootingPercentages,
    realism,
  } = config;

  const gameStore = useGameStore.getState();
  const playerStore = usePlayerStore.getState();
  const teamStore = useTeamStore.getState();
  const setStore = useSetStore.getState();

  // All active players for certain operations
  const allActivePlayerIds = [...starterIds, ...benchIds];

  // Select weighted player (or "Opponent" for opponent team)
  const playerId = isOurTeam ? selectWeightedPlayer(starterIds, benchIds) : "Opponent";

  // Select random set (for our team only)
  const setId = activeSetIds.length > 0
    ? activeSetIds[Math.floor(Math.random() * activeSetIds.length)]
    : "";

  const team = isOurTeam ? Team.Us : Team.Opponent;

  // Determine shot type (weighted towards 2-pointers)
  const shotTypeRoll = Math.random();
  let shotType: "2pt" | "3pt" | "ft";
  if (shotTypeRoll < 0.65) {
    shotType = "2pt";
  } else if (shotTypeRoll < 0.95) {
    shotType = "3pt";
  } else {
    shotType = "ft"; // Free throws less common
  }

  // Determine if shot is made
  const successRate =
    shotType === "2pt"
      ? shootingPercentages.twoPoint
      : shotType === "3pt"
        ? shootingPercentages.threePoint
        : shootingPercentages.freeThrow;

  const varianceMultiplier = realism === "low" ? 0.05 : realism === "medium" ? 0.1 : 0.15;
  const adjustedSuccessRate = successRate + (Math.random() - 0.5) * varianceMultiplier * 2;
  const isMake = Math.random() < adjustedSuccessRate;

  let points = 0;

  if (shotType === "2pt") {
    if (isMake) {
      // 2-point make
      gameStore.updateBoxScore(gameId, playerId, Stat.TwoPointMakes, 1);
      gameStore.updateBoxScore(gameId, playerId, Stat.TwoPointAttempts, 1);
      gameStore.updateBoxScore(gameId, playerId, Stat.Points, 2);
      gameStore.updateTotals(gameId, Stat.TwoPointMakes, 1, team);
      gameStore.updateTotals(gameId, Stat.TwoPointAttempts, 1, team);
      gameStore.updateTotals(gameId, Stat.Points, 2, team);
      gameStore.updatePeriods(gameId, playerId, Stat.TwoPointMakes, period, team);

      if (isOurTeam) {
        playerStore.updateStats(playerId, Stat.TwoPointMakes, 1);
        playerStore.updateStats(playerId, Stat.TwoPointAttempts, 1);
        playerStore.updateStats(playerId, Stat.Points, 2);
        teamStore.updateStats(teamId, Stat.TwoPointMakes, 1, team);
        teamStore.updateStats(teamId, Stat.TwoPointAttempts, 1, team);
        teamStore.updateStats(teamId, Stat.Points, 2, team);

        if (setId) {
          setStore.updateStats(setId, Stat.TwoPointMakes, 1);
          setStore.updateStats(setId, Stat.TwoPointAttempts, 1);
          setStore.updateStats(setId, Stat.Points, 2);
          gameStore.updateSetStats(gameId, setId, Stat.TwoPointMakes, 1);
          gameStore.updateSetStats(gameId, setId, Stat.TwoPointAttempts, 1);
          gameStore.updateSetStats(gameId, setId, Stat.Points, 2);
        }
      }

      points = 2;

      // 30% chance of assist (weighted towards starters)
      if (Math.random() < 0.3 && isOurTeam) {
        const assistPlayerId = selectWeightedPlayer(starterIds, benchIds);
        if (assistPlayerId !== playerId) {
          gameStore.updateBoxScore(gameId, assistPlayerId, Stat.Assists, 1);
          gameStore.updateTotals(gameId, Stat.Assists, 1, team);
          playerStore.updateStats(assistPlayerId, Stat.Assists, 1);
          teamStore.updateStats(teamId, Stat.Assists, 1, team);
          if (setId) {
            setStore.updateStats(setId, Stat.Assists, 1);
            gameStore.updateSetStats(gameId, setId, Stat.Assists, 1);
          }
        }
      }
    } else {
      // 2-point miss
      gameStore.updateBoxScore(gameId, playerId, Stat.TwoPointAttempts, 1);
      gameStore.updateTotals(gameId, Stat.TwoPointAttempts, 1, team);
      gameStore.updatePeriods(gameId, playerId, Stat.TwoPointAttempts, period, team);

      if (isOurTeam) {
        playerStore.updateStats(playerId, Stat.TwoPointAttempts, 1);
        teamStore.updateStats(teamId, Stat.TwoPointAttempts, 1, team);
        if (setId) {
          setStore.updateStats(setId, Stat.TwoPointAttempts, 1);
          gameStore.updateSetStats(gameId, setId, Stat.TwoPointAttempts, 1);
        }
      }

      // Someone gets the rebound (70% defensive, 30% offensive)
      const isDefensiveRebound = Math.random() < 0.7;
      const reboundStat = isDefensiveRebound ? Stat.DefensiveRebounds : Stat.OffensiveRebounds;

      if (isOurTeam) {
        const rebounderTeam = isDefensiveRebound ? Team.Opponent : Team.Us;
        if (rebounderTeam === Team.Us) {
          const rebounderId = allActivePlayerIds[Math.floor(Math.random() * allActivePlayerIds.length)];
          gameStore.updateBoxScore(gameId, rebounderId, reboundStat, 1);
          gameStore.updateTotals(gameId, reboundStat, 1, Team.Us);
          playerStore.updateStats(rebounderId, reboundStat, 1);
          teamStore.updateStats(teamId, reboundStat, 1, Team.Us);
          if (setId) {
            setStore.updateStats(setId, reboundStat, 1);
            gameStore.updateSetStats(gameId, setId, reboundStat, 1);
          }
        }
      }
    }
  } else if (shotType === "3pt") {
    if (isMake) {
      // 3-point make
      gameStore.updateBoxScore(gameId, playerId, Stat.ThreePointMakes, 1);
      gameStore.updateBoxScore(gameId, playerId, Stat.ThreePointAttempts, 1);
      gameStore.updateBoxScore(gameId, playerId, Stat.Points, 3);
      gameStore.updateTotals(gameId, Stat.ThreePointMakes, 1, team);
      gameStore.updateTotals(gameId, Stat.ThreePointAttempts, 1, team);
      gameStore.updateTotals(gameId, Stat.Points, 3, team);
      gameStore.updatePeriods(gameId, playerId, Stat.ThreePointMakes, period, team);

      if (isOurTeam) {
        playerStore.updateStats(playerId, Stat.ThreePointMakes, 1);
        playerStore.updateStats(playerId, Stat.ThreePointAttempts, 1);
        playerStore.updateStats(playerId, Stat.Points, 3);
        teamStore.updateStats(teamId, Stat.ThreePointMakes, 1, team);
        teamStore.updateStats(teamId, Stat.ThreePointAttempts, 1, team);
        teamStore.updateStats(teamId, Stat.Points, 3, team);

        if (setId) {
          setStore.updateStats(setId, Stat.ThreePointMakes, 1);
          setStore.updateStats(setId, Stat.ThreePointAttempts, 1);
          setStore.updateStats(setId, Stat.Points, 3);
          gameStore.updateSetStats(gameId, setId, Stat.ThreePointMakes, 1);
          gameStore.updateSetStats(gameId, setId, Stat.ThreePointAttempts, 1);
          gameStore.updateSetStats(gameId, setId, Stat.Points, 3);
        }
      }

      points = 3;

      // 20% chance of assist on 3-pointer (weighted towards starters)
      if (Math.random() < 0.2 && isOurTeam) {
        const assistPlayerId = selectWeightedPlayer(starterIds, benchIds);
        if (assistPlayerId !== playerId) {
          gameStore.updateBoxScore(gameId, assistPlayerId, Stat.Assists, 1);
          gameStore.updateTotals(gameId, Stat.Assists, 1, team);
          playerStore.updateStats(assistPlayerId, Stat.Assists, 1);
          teamStore.updateStats(teamId, Stat.Assists, 1, team);
          if (setId) {
            setStore.updateStats(setId, Stat.Assists, 1);
            gameStore.updateSetStats(gameId, setId, Stat.Assists, 1);
          }
        }
      }
    } else {
      // 3-point miss
      gameStore.updateBoxScore(gameId, playerId, Stat.ThreePointAttempts, 1);
      gameStore.updateTotals(gameId, Stat.ThreePointAttempts, 1, team);
      gameStore.updatePeriods(gameId, playerId, Stat.ThreePointAttempts, period, team);

      if (isOurTeam) {
        playerStore.updateStats(playerId, Stat.ThreePointAttempts, 1);
        teamStore.updateStats(teamId, Stat.ThreePointAttempts, 1, team);
        if (setId) {
          setStore.updateStats(setId, Stat.ThreePointAttempts, 1);
          gameStore.updateSetStats(gameId, setId, Stat.ThreePointAttempts, 1);
        }
      }

      // Rebound logic (same as 2pt)
      const isDefensiveRebound = Math.random() < 0.7;
      const reboundStat = isDefensiveRebound ? Stat.DefensiveRebounds : Stat.OffensiveRebounds;

      if (isOurTeam) {
        const rebounderTeam = isDefensiveRebound ? Team.Opponent : Team.Us;
        if (rebounderTeam === Team.Us) {
          const rebounderId = allActivePlayerIds[Math.floor(Math.random() * allActivePlayerIds.length)];
          gameStore.updateBoxScore(gameId, rebounderId, reboundStat, 1);
          gameStore.updateTotals(gameId, reboundStat, 1, Team.Us);
          playerStore.updateStats(rebounderId, reboundStat, 1);
          teamStore.updateStats(teamId, reboundStat, 1, Team.Us);
          if (setId) {
            setStore.updateStats(setId, reboundStat, 1);
            gameStore.updateSetStats(gameId, setId, reboundStat, 1);
          }
        }
      }
    }
  } else {
    // Free throw (always give 2 attempts for simplicity)
    const freeThrows = 2;
    let madeCount = 0;

    for (let i = 0; i < freeThrows; i++) {
      const isMake = Math.random() < shootingPercentages.freeThrow;
      if (isMake) {
        madeCount++;
        gameStore.updateBoxScore(gameId, playerId, Stat.FreeThrowsMade, 1);
        gameStore.updateBoxScore(gameId, playerId, Stat.Points, 1);
        gameStore.updateTotals(gameId, Stat.FreeThrowsMade, 1, team);
        gameStore.updateTotals(gameId, Stat.Points, 1, team);
        gameStore.updatePeriods(gameId, playerId, Stat.FreeThrowsMade, period, team);

        if (isOurTeam) {
          playerStore.updateStats(playerId, Stat.FreeThrowsMade, 1);
          playerStore.updateStats(playerId, Stat.Points, 1);
          teamStore.updateStats(teamId, Stat.FreeThrowsMade, 1, team);
          teamStore.updateStats(teamId, Stat.Points, 1, team);

          if (setId) {
            setStore.updateStats(setId, Stat.FreeThrowsMade, 1);
            setStore.updateStats(setId, Stat.Points, 1);
            gameStore.updateSetStats(gameId, setId, Stat.FreeThrowsMade, 1);
            gameStore.updateSetStats(gameId, setId, Stat.Points, 1);
          }
        }
      }

      gameStore.updateBoxScore(gameId, playerId, Stat.FreeThrowsAttempted, 1);
      gameStore.updateTotals(gameId, Stat.FreeThrowsAttempted, 1, team);

      if (isOurTeam) {
        playerStore.updateStats(playerId, Stat.FreeThrowsAttempted, 1);
        teamStore.updateStats(teamId, Stat.FreeThrowsAttempted, 1, team);

        if (setId) {
          setStore.updateStats(setId, Stat.FreeThrowsAttempted, 1);
          gameStore.updateSetStats(gameId, setId, Stat.FreeThrowsAttempted, 1);
        }
      }
    }

    points = madeCount;
  }

  // Occasionally add other stats (steals, blocks, turnovers)
  if (Math.random() < 0.15 && isOurTeam) {
    // Random defensive play or turnover (can be any active player)
    const statRoll = Math.random();
    let bonusStat: Stat;

    if (statRoll < 0.4) {
      bonusStat = Stat.Steals;
    } else if (statRoll < 0.6) {
      bonusStat = Stat.Blocks;
    } else {
      bonusStat = Stat.Turnovers;
    }

    const bonusPlayerId = allActivePlayerIds[Math.floor(Math.random() * allActivePlayerIds.length)];
    gameStore.updateBoxScore(gameId, bonusPlayerId, bonusStat, 1);
    gameStore.updateTotals(gameId, bonusStat, 1, Team.Us);
    playerStore.updateStats(bonusPlayerId, bonusStat, 1);
    teamStore.updateStats(teamId, bonusStat, 1, Team.Us);

    if (setId) {
      setStore.updateStats(setId, bonusStat, 1);
      gameStore.updateSetStats(gameId, setId, bonusStat, 1);
    }
  }

  return points;
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
