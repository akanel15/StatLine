import { Stat } from "@/types/stats";
import { Team } from "@/types/game";
import { StatUpdateStoreActions, handleStatUpdate } from "./statUpdates";

/**
 * Configuration for possession simulation
 */
export interface PossessionConfig {
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
 * Result of a possession simulation
 */
export interface PossessionResult {
  points: number;
  shotType: "2pt" | "3pt" | "ft";
  isMake: boolean;
}

/**
 * Shot type options
 */
export type ShotType = "2pt" | "3pt" | "ft";

/**
 * Pure function: Selects a player with weighted probability (starters 70%, bench 30%)
 */
export function selectWeightedPlayer(starterIds: string[], benchIds: string[]): string {
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
 * Pure function: Determines shot type based on weighted probabilities
 * 65% two-pointers, 30% three-pointers, 5% free throws
 */
export function determineShotType(): ShotType {
  const roll = Math.random();
  if (roll < 0.65) {
    return "2pt";
  } else if (roll < 0.95) {
    return "3pt";
  } else {
    return "ft";
  }
}

/**
 * Pure function: Determines if a shot is successful based on shooting percentage and realism
 */
export function determineShotOutcome(
  shotType: ShotType,
  shootingPercentages: { twoPoint: number; threePoint: number; freeThrow: number },
  realism: "low" | "medium" | "high",
): boolean {
  const successRate =
    shotType === "2pt"
      ? shootingPercentages.twoPoint
      : shotType === "3pt"
        ? shootingPercentages.threePoint
        : shootingPercentages.freeThrow;

  const varianceMultiplier = realism === "low" ? 0.05 : realism === "medium" ? 0.1 : 0.15;
  const adjustedSuccessRate = successRate + (Math.random() - 0.5) * varianceMultiplier * 2;

  return Math.random() < adjustedSuccessRate;
}

/**
 * Pure function: Determines if an assist should be awarded
 * 30% for 2-pointers, 20% for 3-pointers
 */
export function shouldAwardAssist(shotType: ShotType): boolean {
  const assistProbability = shotType === "2pt" ? 0.3 : shotType === "3pt" ? 0.2 : 0;
  return Math.random() < assistProbability;
}

/**
 * Pure function: Determines rebound type (70% defensive, 30% offensive)
 */
export function determineReboundType(): "defensive" | "offensive" {
  return Math.random() < 0.7 ? "defensive" : "offensive";
}

/**
 * Pure function: Determines if a bonus stat should be awarded
 * 15% chance of awarding steals, blocks, or turnovers
 */
export function shouldAwardBonusStat(): boolean {
  return Math.random() < 0.15;
}

/**
 * Pure function: Randomly selects a bonus stat (steals, blocks, or turnovers)
 */
export function selectBonusStat(): Stat {
  const roll = Math.random();
  if (roll < 0.4) {
    return Stat.Steals;
  } else if (roll < 0.6) {
    return Stat.Blocks;
  } else {
    return Stat.Turnovers;
  }
}

/**
 * Simulates a two-point attempt
 */
function simulateTwoPointAttempt(
  stores: StatUpdateStoreActions,
  config: PossessionConfig,
  playerId: string,
  setId: string,
  isMake: boolean,
): number {
  const { gameId, teamId, period, starterIds, benchIds, isOurTeam } = config;
  const allActivePlayerIds = [...starterIds, ...benchIds];

  if (isMake) {
    // 2-point make
    const stats = [Stat.TwoPointMakes, Stat.TwoPointAttempts];
    handleStatUpdate(stores, {
      stats,
      gameId,
      teamId,
      playerId,
      setId,
      selectedPeriod: period,
      activePlayers: allActivePlayerIds,
    });

    // 30% chance of assist (only for our team)
    if (shouldAwardAssist("2pt") && isOurTeam) {
      const assistPlayerId = selectWeightedPlayer(starterIds, benchIds);
      if (assistPlayerId !== playerId) {
        handleStatUpdate(stores, {
          stats: [Stat.Assists],
          gameId,
          teamId,
          playerId: assistPlayerId,
          setId,
          selectedPeriod: period,
          activePlayers: allActivePlayerIds,
        });
      }
    }

    return 2;
  } else {
    // 2-point miss
    handleStatUpdate(stores, {
      stats: [Stat.TwoPointAttempts],
      gameId,
      teamId,
      playerId,
      setId,
      selectedPeriod: period,
      activePlayers: allActivePlayerIds,
    });

    // Handle rebound (only for our team)
    if (isOurTeam) {
      const reboundType = determineReboundType();
      const isDefensiveRebound = reboundType === "defensive";
      const reboundStat = isDefensiveRebound ? Stat.DefensiveRebounds : Stat.OffensiveRebounds;
      const rebounderTeam = isDefensiveRebound ? Team.Opponent : Team.Us;

      if (rebounderTeam === Team.Us) {
        const rebounderId =
          allActivePlayerIds[Math.floor(Math.random() * allActivePlayerIds.length)];
        handleStatUpdate(stores, {
          stats: [reboundStat],
          gameId,
          teamId,
          playerId: rebounderId,
          setId,
          selectedPeriod: period,
          activePlayers: allActivePlayerIds,
        });
      }
    }

    return 0;
  }
}

/**
 * Simulates a three-point attempt
 */
function simulateThreePointAttempt(
  stores: StatUpdateStoreActions,
  config: PossessionConfig,
  playerId: string,
  setId: string,
  isMake: boolean,
): number {
  const { gameId, teamId, period, starterIds, benchIds, isOurTeam } = config;
  const allActivePlayerIds = [...starterIds, ...benchIds];

  if (isMake) {
    // 3-point make
    const stats = [Stat.ThreePointMakes, Stat.ThreePointAttempts];
    handleStatUpdate(stores, {
      stats,
      gameId,
      teamId,
      playerId,
      setId,
      selectedPeriod: period,
      activePlayers: allActivePlayerIds,
    });

    // 20% chance of assist (only for our team)
    if (shouldAwardAssist("3pt") && isOurTeam) {
      const assistPlayerId = selectWeightedPlayer(starterIds, benchIds);
      if (assistPlayerId !== playerId) {
        handleStatUpdate(stores, {
          stats: [Stat.Assists],
          gameId,
          teamId,
          playerId: assistPlayerId,
          setId,
          selectedPeriod: period,
          activePlayers: allActivePlayerIds,
        });
      }
    }

    return 3;
  } else {
    // 3-point miss
    handleStatUpdate(stores, {
      stats: [Stat.ThreePointAttempts],
      gameId,
      teamId,
      playerId,
      setId,
      selectedPeriod: period,
      activePlayers: allActivePlayerIds,
    });

    // Handle rebound (only for our team)
    if (isOurTeam) {
      const reboundType = determineReboundType();
      const isDefensiveRebound = reboundType === "defensive";
      const reboundStat = isDefensiveRebound ? Stat.DefensiveRebounds : Stat.OffensiveRebounds;
      const rebounderTeam = isDefensiveRebound ? Team.Opponent : Team.Us;

      if (rebounderTeam === Team.Us) {
        const rebounderId =
          allActivePlayerIds[Math.floor(Math.random() * allActivePlayerIds.length)];
        handleStatUpdate(stores, {
          stats: [reboundStat],
          gameId,
          teamId,
          playerId: rebounderId,
          setId,
          selectedPeriod: period,
          activePlayers: allActivePlayerIds,
        });
      }
    }

    return 0;
  }
}

/**
 * Simulates free throw attempts (always 2 attempts for simplicity)
 */
function simulateFreeThrows(
  stores: StatUpdateStoreActions,
  config: PossessionConfig,
  playerId: string,
  setId: string,
): number {
  const { gameId, teamId, period, starterIds, benchIds, shootingPercentages } = config;
  const allActivePlayerIds = [...starterIds, ...benchIds];
  const freeThrows = 2;
  let madeCount = 0;

  for (let i = 0; i < freeThrows; i++) {
    const isMake = Math.random() < shootingPercentages.freeThrow;

    if (isMake) {
      madeCount++;
      handleStatUpdate(stores, {
        stats: [Stat.FreeThrowsMade, Stat.FreeThrowsAttempted],
        gameId,
        teamId,
        playerId,
        setId,
        selectedPeriod: period,
        activePlayers: allActivePlayerIds,
      });
    } else {
      handleStatUpdate(stores, {
        stats: [Stat.FreeThrowsAttempted],
        gameId,
        teamId,
        playerId,
        setId,
        selectedPeriod: period,
        activePlayers: allActivePlayerIds,
      });
    }
  }

  return madeCount;
}

/**
 * Possibly awards a bonus stat (steals, blocks, turnovers)
 * 15% chance for our team only
 */
function possiblyAwardBonusStat(
  stores: StatUpdateStoreActions,
  config: PossessionConfig,
  setId: string,
): void {
  const { gameId, teamId, period, starterIds, benchIds, isOurTeam } = config;

  if (!isOurTeam) return;
  if (!shouldAwardBonusStat()) return;

  const allActivePlayerIds = [...starterIds, ...benchIds];
  const bonusStat = selectBonusStat();
  const bonusPlayerId = allActivePlayerIds[Math.floor(Math.random() * allActivePlayerIds.length)];

  handleStatUpdate(stores, {
    stats: [bonusStat],
    gameId,
    teamId,
    playerId: bonusPlayerId,
    setId,
    selectedPeriod: period,
    activePlayers: allActivePlayerIds,
  });
}

/**
 * Simulates a single possession using actual game stat update functions
 * This is the main function that replaces the inline logic in gameSimulator.ts
 *
 * @param stores - Store action functions (dependency injection)
 * @param config - Configuration for the possession
 * @returns Number of points scored in the possession
 */
export function simulatePossession(
  stores: StatUpdateStoreActions,
  config: PossessionConfig,
): number {
  const { gameId, starterIds, benchIds, activeSetIds, isOurTeam, shootingPercentages, realism } =
    config;

  // Select player and set
  const playerId = isOurTeam ? selectWeightedPlayer(starterIds, benchIds) : "Opponent";
  const setId =
    activeSetIds.length > 0 ? activeSetIds[Math.floor(Math.random() * activeSetIds.length)] : "";

  // Determine shot type
  const shotType = determineShotType();

  // Determine if shot is successful
  const isMake = determineShotOutcome(shotType, shootingPercentages, realism);

  // Simulate the shot
  let points = 0;
  if (shotType === "2pt") {
    points = simulateTwoPointAttempt(stores, config, playerId, setId, isMake);
  } else if (shotType === "3pt") {
    points = simulateThreePointAttempt(stores, config, playerId, setId, isMake);
  } else {
    points = simulateFreeThrows(stores, config, playerId, setId);
  }

  // Possibly award bonus stat
  possiblyAwardBonusStat(stores, config, setId);

  // Increment set run counts for our team possessions
  // In simulation, every possession is atomic and concludes, so we increment for every our-team possession
  if (isOurTeam && setId && playerId !== "Opponent") {
    stores.incrementSetRunCount(gameId, setId);
    stores.incrementGlobalSetRunCount(setId);
  }

  return points;
}
