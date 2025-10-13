import { Stat } from "@/types/stats";
import { Team } from "@/types/game";

/**
 * Store actions interface for dependency injection
 * This allows the stat update logic to work with any store implementation
 */
export interface StatUpdateStoreActions {
  // Game store actions
  updateBoxScore: (gameId: string, playerId: string, stat: Stat, amount: number) => void;
  updateTotals: (gameId: string, stat: Stat, amount: number, team: Team) => void;
  updatePeriods: (gameId: string, playerId: string, stat: Stat, period: number, team: Team) => void;
  updateGameSetStats: (gameId: string, setId: string, stat: Stat, amount: number) => void;
  incrementSetRunCount: (gameId: string, setId: string) => void;

  // Team store actions
  updateTeamStats: (teamId: string, stat: Stat, amount: number, team: Team) => void;

  // Player store actions
  updatePlayerStats: (playerId: string, stat: Stat, amount: number) => void;

  // Set store actions
  updateSetStats: (setId: string, stat: Stat, amount: number) => void;
  incrementGlobalSetRunCount: (setId: string) => void;
}

/**
 * Parameters for stat update
 */
export interface StatUpdateParams {
  stats: Stat[];
  gameId: string;
  teamId: string;
  playerId: string;
  setId: string;
  selectedPeriod: number;
  activePlayers: string[];
}

/**
 * Pure function to calculate plus/minus amount based on team
 */
export function calculatePlusMinusForTeam(
  team: Team,
  amount: number,
): {
  usAmount: number;
  opponentAmount: number;
} {
  const adjustedAmount = team === Team.Opponent ? -amount : amount;
  const usAmount = adjustedAmount === -0 ? 0 : adjustedAmount;
  const opponentAmount = -adjustedAmount === -0 ? 0 : -adjustedAmount;
  return {
    usAmount,
    opponentAmount,
  };
}

/**
 * Pure function to determine points for a given stat
 */
export function getPointsForStat(stat: Stat): number {
  switch (stat) {
    case Stat.FreeThrowsMade:
      return 1;
    case Stat.TwoPointMakes:
      return 2;
    case Stat.ThreePointMakes:
      return 3;
    default:
      return 0;
  }
}

/**
 * Pure function to check if a stat is a scoring play
 */
export function isScoringPlay(stat: Stat): boolean {
  return (
    stat === Stat.FreeThrowsMade || stat === Stat.TwoPointMakes || stat === Stat.ThreePointMakes
  );
}

/**
 * Pure function to determine if we should update periods (play-by-play)
 * Only makes and single actions are added to play-by-play
 */
export function shouldUpdatePeriods(stats: Stat[]): {
  shouldUpdate: boolean;
  statToRecord: Stat | null;
} {
  if (stats.length === 2) {
    // Shot make - record the make (first stat)
    return { shouldUpdate: true, statToRecord: stats[0] };
  } else if (stats.length === 1) {
    // Single action (miss or other stat)
    return { shouldUpdate: true, statToRecord: stats[0] };
  }
  return { shouldUpdate: false, statToRecord: null };
}

/**
 * Updates plus/minus stats for all active players and teams
 */
function updatePlusMinusStats(
  stores: StatUpdateStoreActions,
  gameId: string,
  teamId: string,
  activePlayers: string[],
  team: Team,
  points: number,
): void {
  const { usAmount, opponentAmount } = calculatePlusMinusForTeam(team, points);

  // Update team plus/minus for both teams
  stores.updateTeamStats(teamId, Stat.PlusMinus, usAmount, Team.Us);
  stores.updateTotals(gameId, Stat.PlusMinus, usAmount, Team.Us);

  stores.updateTeamStats(teamId, Stat.PlusMinus, opponentAmount, Team.Opponent);
  stores.updateTotals(gameId, Stat.PlusMinus, opponentAmount, Team.Opponent);

  // Update plus/minus for all active players
  activePlayers.forEach(playerId => {
    stores.updateBoxScore(gameId, playerId, Stat.PlusMinus, usAmount);
    stores.updatePlayerStats(playerId, Stat.PlusMinus, usAmount);
  });
}

/**
 * Updates all stats for a single stat action
 */
function updateSingleStat(
  stores: StatUpdateStoreActions,
  params: StatUpdateParams,
  stat: Stat,
  team: Team,
): void {
  const { gameId, teamId, playerId, setId } = params;
  const isOurPlayer = playerId !== "Opponent";

  // Update game-level tracking (for both teams)
  stores.updateBoxScore(gameId, playerId, stat, 1);
  stores.updateTotals(gameId, stat, 1, team);
  stores.updateTeamStats(teamId, stat, 1, team);
  stores.updateGameSetStats(gameId, setId, stat, 1);

  // Only update player/set stores for our team's players
  if (isOurPlayer) {
    stores.updatePlayerStats(playerId, stat, 1);
    stores.updateSetStats(setId, stat, 1);
  }
}

/**
 * Updates points for a scoring play
 */
function updatePointsForScoringPlay(
  stores: StatUpdateStoreActions,
  params: StatUpdateParams,
  stat: Stat,
  team: Team,
): void {
  const points = getPointsForStat(stat);
  if (points === 0) return;

  const { gameId, teamId, playerId, setId, activePlayers } = params;
  const isOurPlayer = playerId !== "Opponent";

  // Update points in game-level tracking (for both teams)
  stores.updateTotals(gameId, Stat.Points, points, team);
  stores.updateBoxScore(gameId, playerId, Stat.Points, points);
  stores.updateTeamStats(teamId, Stat.Points, points, team);
  stores.updateGameSetStats(gameId, setId, Stat.Points, points);

  // Only update player/set stores for our team's players
  if (isOurPlayer) {
    stores.updatePlayerStats(playerId, Stat.Points, points);
    stores.updateSetStats(setId, Stat.Points, points);
  }

  // Update plus/minus for scoring plays
  updatePlusMinusStats(stores, gameId, teamId, activePlayers, team, points);
}

/**
 * Core stat update function - updates all stat tracking for a given action
 * This is the pure logic extracted from [gameId].tsx handleStatUpdate
 *
 * @param stores - Store action functions (dependency injection)
 * @param params - Parameters for the stat update
 */
export function handleStatUpdate(stores: StatUpdateStoreActions, params: StatUpdateParams): void {
  const { stats, gameId, playerId, selectedPeriod } = params;
  const team = playerId === "Opponent" ? Team.Opponent : Team.Us;

  // Update play-by-play and period info
  const { shouldUpdate, statToRecord } = shouldUpdatePeriods(stats);
  if (shouldUpdate && statToRecord) {
    stores.updatePeriods(gameId, playerId, statToRecord, selectedPeriod, team);
  }

  // Update all stats
  stats.forEach(stat => {
    // Update basic stat tracking
    updateSingleStat(stores, params, stat, team);

    // Handle points for scoring plays
    if (isScoringPlay(stat)) {
      updatePointsForScoringPlay(stores, params, stat, team);
    }
  });
}

/**
 * Factory function to create a stat update handler with store dependencies
 * This allows components to create a bound version of handleStatUpdate
 *
 * Usage in components:
 * ```
 * const statUpdateHandler = createStatUpdateHandler({
 *   updateBoxScore,
 *   updateTotals,
 *   // ... other store methods
 * });
 *
 * statUpdateHandler({
 *   stats: [Stat.TwoPointMakes, Stat.TwoPointAttempts],
 *   gameId,
 *   teamId,
 *   playerId,
 *   setId,
 *   selectedPeriod,
 *   activePlayers,
 * });
 * ```
 */
export function createStatUpdateHandler(
  stores: StatUpdateStoreActions,
): (params: StatUpdateParams) => void {
  return (params: StatUpdateParams) => handleStatUpdate(stores, params);
}
