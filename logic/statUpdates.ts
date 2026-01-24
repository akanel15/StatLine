import { Stat, getStatsForAction } from "@/types/stats";
import { Team } from "@/types/game";
import type {
  BoxScoreUpdate,
  TotalUpdate,
  PeriodUpdate,
  SetStatUpdate as GameSetStatUpdate,
  BatchStatUpdateParams,
} from "@/store/gameStore";
import type { PlayerStatUpdate } from "@/store/playerStore";
import type { TeamStatUpdate } from "@/store/teamStore";
import type { SetStatUpdate } from "@/store/setStore";

/**
 * Store actions interface for dependency injection
 * This allows the stat update logic to work with any store implementation
 */
export interface StatUpdateStoreActions {
  // Game store actions (individual - for backwards compatibility)
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

  // Batched store actions (for performance optimization)
  batchGameUpdate?: (gameId: string, params: BatchStatUpdateParams) => void;
  batchPlayerUpdate?: (updates: PlayerStatUpdate[]) => void;
  batchTeamUpdate?: (updates: TeamStatUpdate[]) => void;
  batchSetUpdate?: (updates: SetStatUpdate[]) => void;
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
 * Parameters for stat reversal (when deleting a play)
 */
export interface StatReversalParams {
  play: {
    playerId: string;
    action: Stat;
    activePlayers?: string[];
    setId?: string;
  };
  gameId: string;
  teamId: string;
  currentActivePlayers: string[]; // Fallback if play.activePlayers not stored
  currentSetId: string; // Fallback if play.setId not stored
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
 * Collector for batched updates - collects all updates before applying
 */
interface BatchedUpdates {
  gameUpdates: {
    boxScoreUpdates: BoxScoreUpdate[];
    totalUpdates: TotalUpdate[];
    periodUpdate?: PeriodUpdate;
    setStatUpdates: GameSetStatUpdate[];
  };
  playerUpdates: PlayerStatUpdate[];
  teamUpdates: TeamStatUpdate[];
  setUpdates: SetStatUpdate[];
}

/**
 * Collects plus/minus updates for all active players and teams
 */
function collectPlusMinusUpdates(
  collector: BatchedUpdates,
  teamId: string,
  activePlayers: string[],
  team: Team,
  points: number,
): void {
  const { usAmount, opponentAmount } = calculatePlusMinusForTeam(team, points);

  // Collect team plus/minus for both teams
  collector.teamUpdates.push({ teamId, stat: Stat.PlusMinus, amount: usAmount, team: Team.Us });
  collector.gameUpdates.totalUpdates.push({
    stat: Stat.PlusMinus,
    amount: usAmount,
    team: Team.Us,
  });

  collector.teamUpdates.push({
    teamId,
    stat: Stat.PlusMinus,
    amount: opponentAmount,
    team: Team.Opponent,
  });
  collector.gameUpdates.totalUpdates.push({
    stat: Stat.PlusMinus,
    amount: opponentAmount,
    team: Team.Opponent,
  });

  // Collect plus/minus for all active players
  for (const playerId of activePlayers) {
    collector.gameUpdates.boxScoreUpdates.push({
      playerId,
      stat: Stat.PlusMinus,
      amount: usAmount,
    });
    collector.playerUpdates.push({ playerId, stat: Stat.PlusMinus, amount: usAmount });
  }
}

/**
 * Collects all stat updates for a single stat action
 */
function collectSingleStatUpdates(
  collector: BatchedUpdates,
  params: StatUpdateParams,
  stat: Stat,
  team: Team,
): void {
  const { teamId, playerId, setId } = params;
  const isOurPlayer = playerId !== "Opponent";

  // Collect game-level tracking (for both teams)
  collector.gameUpdates.boxScoreUpdates.push({ playerId, stat, amount: 1 });
  collector.gameUpdates.totalUpdates.push({ stat, amount: 1, team });
  collector.teamUpdates.push({ teamId, stat, amount: 1, team });
  collector.gameUpdates.setStatUpdates.push({ setId, stat, amount: 1 });

  // Only update player/set stores for our team's players
  if (isOurPlayer) {
    collector.playerUpdates.push({ playerId, stat, amount: 1 });
    collector.setUpdates.push({ setId, stat, amount: 1 });
  }
}

/**
 * Collects points updates for a scoring play
 */
function collectPointsForScoringPlay(
  collector: BatchedUpdates,
  params: StatUpdateParams,
  stat: Stat,
  team: Team,
): void {
  const points = getPointsForStat(stat);
  if (points === 0) return;

  const { teamId, playerId, setId, activePlayers } = params;
  const isOurPlayer = playerId !== "Opponent";

  // Collect points in game-level tracking (for both teams)
  collector.gameUpdates.totalUpdates.push({ stat: Stat.Points, amount: points, team });
  collector.gameUpdates.boxScoreUpdates.push({ playerId, stat: Stat.Points, amount: points });
  collector.teamUpdates.push({ teamId, stat: Stat.Points, amount: points, team });
  collector.gameUpdates.setStatUpdates.push({ setId, stat: Stat.Points, amount: points });

  // Only update player/set stores for our team's players
  if (isOurPlayer) {
    collector.playerUpdates.push({ playerId, stat: Stat.Points, amount: points });
    collector.setUpdates.push({ setId, stat: Stat.Points, amount: points });
  }

  // Collect plus/minus for scoring plays
  collectPlusMinusUpdates(collector, teamId, activePlayers, team, points);
}

/**
 * Core stat update function - updates all stat tracking for a given action
 * This is the pure logic extracted from [gameId].tsx handleStatUpdate
 *
 * PERFORMANCE OPTIMIZED: Uses batched updates when available to reduce
 * re-renders from 15+ to 4 (one per store)
 *
 * @param stores - Store action functions (dependency injection)
 * @param params - Parameters for the stat update
 */
export function handleStatUpdate(stores: StatUpdateStoreActions, params: StatUpdateParams): void {
  const { stats, gameId, playerId, selectedPeriod } = params;
  const team = playerId === "Opponent" ? Team.Opponent : Team.Us;

  // Check if batched methods are available
  const useBatching =
    stores.batchGameUpdate &&
    stores.batchPlayerUpdate &&
    stores.batchTeamUpdate &&
    stores.batchSetUpdate;

  if (useBatching) {
    // OPTIMIZED PATH: Collect all updates first, then apply in 4 batch calls
    const collector: BatchedUpdates = {
      gameUpdates: {
        boxScoreUpdates: [],
        totalUpdates: [],
        periodUpdate: undefined,
        setStatUpdates: [],
      },
      playerUpdates: [],
      teamUpdates: [],
      setUpdates: [],
    };

    // Collect play-by-play and period info
    const { shouldUpdate, statToRecord } = shouldUpdatePeriods(stats);
    if (shouldUpdate && statToRecord) {
      collector.gameUpdates.periodUpdate = {
        playerId,
        stat: statToRecord,
        period: selectedPeriod,
        team,
        activePlayers: params.activePlayers, // Store for stat reversal on delete
        setId: params.setId, // Store for stat reversal on delete
      };
    }

    // Collect all stat updates
    for (const stat of stats) {
      // Collect basic stat tracking
      collectSingleStatUpdates(collector, params, stat, team);

      // Collect points for scoring plays
      if (isScoringPlay(stat)) {
        collectPointsForScoringPlay(collector, params, stat, team);
      }
    }

    // Apply all updates in 4 batched calls (1 per store)
    stores.batchGameUpdate!(gameId, collector.gameUpdates);
    stores.batchPlayerUpdate!(collector.playerUpdates);
    stores.batchTeamUpdate!(collector.teamUpdates);
    stores.batchSetUpdate!(collector.setUpdates);
  } else {
    // LEGACY PATH: Use individual store calls (for backwards compatibility)
    // Update play-by-play and period info
    const { shouldUpdate, statToRecord } = shouldUpdatePeriods(stats);
    if (shouldUpdate && statToRecord) {
      stores.updatePeriods(gameId, playerId, statToRecord, selectedPeriod, team);
    }

    // Update all stats using individual calls
    stats.forEach(stat => {
      // Update basic stat tracking
      updateSingleStatLegacy(stores, params, stat, team);

      // Handle points for scoring plays
      if (isScoringPlay(stat)) {
        updatePointsForScoringPlayLegacy(stores, params, stat, team);
      }
    });
  }
}

/**
 * Legacy: Updates all stats for a single stat action (individual calls)
 */
function updateSingleStatLegacy(
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
 * Legacy: Updates plus/minus stats for all active players and teams
 */
function updatePlusMinusStatsLegacy(
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
 * Legacy: Updates points for a scoring play
 */
function updatePointsForScoringPlayLegacy(
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
  updatePlusMinusStatsLegacy(stores, gameId, teamId, activePlayers, team, points);
}

/**
 * Reverses all stat updates for a deleted play.
 * This mirrors handleStatUpdate but uses negative amounts to reverse stats.
 *
 * CRITICAL: This must be called BEFORE removing the play from the play-by-play array
 * to ensure stats are properly reversed across all stores.
 *
 * @param stores - Store action functions (dependency injection)
 * @param params - Parameters for the stat reversal
 */
export function handleStatReversal(
  stores: StatUpdateStoreActions,
  params: StatReversalParams,
): void {
  const { play, gameId, teamId, currentActivePlayers, currentSetId } = params;
  const { playerId, action } = play;

  // Use stored activePlayers/setId if available, otherwise fall back to current
  const activePlayers = play.activePlayers || currentActivePlayers;
  const setId = play.setId || currentSetId;

  // Determine which team this play was for
  const team = playerId === "Opponent" ? Team.Opponent : Team.Us;
  const isOurPlayer = playerId !== "Opponent";

  // Get all stats that were originally recorded for this action
  const stats = getStatsForAction(action);

  // Reverse each stat (use -1 amount to subtract)
  for (const stat of stats) {
    // Reverse game-level tracking
    stores.updateBoxScore(gameId, playerId, stat, -1);
    stores.updateTotals(gameId, stat, -1, team);
    stores.updateTeamStats(teamId, stat, -1, team);
    stores.updateGameSetStats(gameId, setId, stat, -1);

    // Only reverse player/set stores for our team's players
    if (isOurPlayer) {
      stores.updatePlayerStats(playerId, stat, -1);
      stores.updateSetStats(setId, stat, -1);
    }

    // Reverse points for scoring plays
    if (isScoringPlay(stat)) {
      const points = getPointsForStat(stat);

      // Reverse points in game-level tracking
      stores.updateTotals(gameId, Stat.Points, -points, team);
      stores.updateBoxScore(gameId, playerId, Stat.Points, -points);
      stores.updateTeamStats(teamId, Stat.Points, -points, team);
      stores.updateGameSetStats(gameId, setId, Stat.Points, -points);

      // Only reverse player/set stores for our team's players
      if (isOurPlayer) {
        stores.updatePlayerStats(playerId, Stat.Points, -points);
        stores.updateSetStats(setId, Stat.Points, -points);
      }

      // Reverse plus/minus for all players who were active when the play was recorded
      const { usAmount, opponentAmount } = calculatePlusMinusForTeam(team, points);

      // Reverse team plus/minus for both teams
      stores.updateTeamStats(teamId, Stat.PlusMinus, -usAmount, Team.Us);
      stores.updateTotals(gameId, Stat.PlusMinus, -usAmount, Team.Us);
      stores.updateTeamStats(teamId, Stat.PlusMinus, -opponentAmount, Team.Opponent);
      stores.updateTotals(gameId, Stat.PlusMinus, -opponentAmount, Team.Opponent);

      // Reverse plus/minus for all active players
      for (const activePlayerId of activePlayers) {
        stores.updateBoxScore(gameId, activePlayerId, Stat.PlusMinus, -usAmount);
        stores.updatePlayerStats(activePlayerId, Stat.PlusMinus, -usAmount);
      }
    }
  }
}

/**
 * Factory function to create a stat reversal handler with store dependencies
 * This allows components to create a bound version of handleStatReversal
 */
export function createStatReversalHandler(
  stores: StatUpdateStoreActions,
): (params: StatReversalParams) => void {
  return (params: StatReversalParams) => handleStatReversal(stores, params);
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
