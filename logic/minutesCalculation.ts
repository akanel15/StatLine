import { StintType, GameType } from "@/types/game";

/**
 * Calculate minutes for a single stint.
 * checkInTime and checkOutTime are seconds remaining in the period (countdown clock).
 * So time played = checkInTime - checkOutTime.
 * If checkOutTime is undefined (still playing), treats as 0 (end of period).
 */
export function calculateStintMinutes(stint: StintType): number {
  const checkOut = stint.checkOutTime ?? 0;
  const seconds = stint.checkInTime - checkOut;
  return Math.max(0, seconds);
}

/**
 * Calculate total seconds played for a specific player across all their stints.
 */
export function calculatePlayerMinutes(stints: StintType[], playerId: string): number {
  return stints
    .filter(s => s.playerId === playerId)
    .reduce((total, stint) => total + calculateStintMinutes(stint), 0);
}

/**
 * Calculate total seconds played for all players.
 * For in-progress games, pass currentPeriodIndex and currentPeriodClockTime
 * so open stints in the current period use the last known clock position
 * instead of extrapolating to end of period.
 */
export function calculateAllPlayerMinutes(
  stints: StintType[],
  currentPeriodIndex?: number,
  currentPeriodClockTime?: number,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const stint of stints) {
    let seconds: number;
    if (
      stint.checkOutTime === undefined &&
      currentPeriodIndex !== undefined &&
      currentPeriodClockTime !== undefined &&
      stint.periodIndex === currentPeriodIndex
    ) {
      // Open stint in current period — use last known clock time, not 0
      seconds = Math.max(0, stint.checkInTime - currentPeriodClockTime);
    } else {
      seconds = calculateStintMinutes(stint);
    }
    result[stint.playerId] = (result[stint.playerId] || 0) + seconds;
  }
  return result;
}

/**
 * Format total seconds as "M:SS" display string.
 */
export function formatMinutes(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Parse clock input (minutes and seconds strings) into total seconds remaining.
 * Returns null for invalid input.
 */
export function parseClockInput(
  minutesStr: string,
  secondsStr: string,
  periodLength: number,
): number | null {
  const minutes = parseInt(minutesStr, 10);
  const seconds = parseInt(secondsStr, 10);

  if (isNaN(minutes) || isNaN(seconds)) return null;
  if (minutes < 0 || seconds < 0 || seconds > 59) return null;

  const totalSeconds = minutes * 60 + seconds;
  if (totalSeconds > periodLength) return null;

  return totalSeconds;
}

/**
 * Close all open stints for a specific period by setting checkOutTime = 0 (period ended).
 * Returns a new array (does not mutate).
 */
export function closePeriodStints(stints: StintType[], periodIndex: number): StintType[] {
  return stints.map(stint => {
    if (stint.periodIndex === periodIndex && stint.checkOutTime === undefined) {
      return { ...stint, checkOutTime: 0 };
    }
    return stint;
  });
}

/**
 * Create new check-in stints for all given players at the start of a new period.
 * Players are checked in at periodLength (full time remaining).
 */
export function openNewPeriodStints(
  stints: StintType[],
  playerIds: string[],
  periodIndex: number,
  periodLength: number,
): StintType[] {
  const newStints: StintType[] = playerIds.map(playerId => ({
    playerId,
    periodIndex,
    checkInTime: periodLength,
  }));
  return [...stints, ...newStints];
}

/**
 * Process a substitution: close stints for players leaving, open stints for players entering.
 * Returns a new stints array.
 */
export function processSubstitution(
  stints: StintType[],
  periodIndex: number,
  clockTimeSeconds: number,
  subbedOutPlayerIds: string[],
  subbedInPlayerIds: string[],
): StintType[] {
  // Close stints for subbed-out players
  const updated = stints.map(stint => {
    if (
      stint.periodIndex === periodIndex &&
      stint.checkOutTime === undefined &&
      subbedOutPlayerIds.includes(stint.playerId)
    ) {
      return { ...stint, checkOutTime: clockTimeSeconds };
    }
    return stint;
  });

  // Open new stints for subbed-in players
  const newStints: StintType[] = subbedInPlayerIds.map(playerId => ({
    playerId,
    periodIndex,
    checkInTime: clockTimeSeconds,
  }));

  return [...updated, ...newStints];
}

/**
 * Remap stint periodIndex values after a period deletion.
 * Removes stints for the deleted period and decrements indices for later periods.
 */
export function remapStintsAfterPeriodDeletion(
  stints: StintType[],
  deletedPeriodIndex: number,
): StintType[] {
  return stints
    .filter(stint => stint.periodIndex !== deletedPeriodIndex)
    .map(stint => {
      if (stint.periodIndex > deletedPeriodIndex) {
        return { ...stint, periodIndex: stint.periodIndex - 1 };
      }
      return stint;
    });
}

/**
 * Calculate a player's total minutes and number of games with minutes tracking
 * across all finished games for a team.
 */
export function calculatePlayerTotalMinutes(
  games: GameType[],
  playerId: string,
): { totalSeconds: number; gamesWithMinutes: number } {
  let totalSeconds = 0;
  let gamesWithMinutes = 0;

  for (const game of games) {
    if (!game.isFinished || !game.minutesTracking?.enabled) continue;
    if (!game.gamePlayedList.includes(playerId)) continue;

    const playerSeconds = calculatePlayerMinutes(game.minutesTracking.stints, playerId);
    totalSeconds += playerSeconds;
    gamesWithMinutes++;
  }

  return { totalSeconds, gamesWithMinutes };
}

/**
 * Calculate MPG (minutes per game) from total seconds and games count.
 * Returns null if no games have minutes data.
 */
export function calculateMPG(totalSeconds: number, gamesWithMinutes: number): number | null {
  if (gamesWithMinutes === 0) return null;
  return totalSeconds / 60 / gamesWithMinutes;
}
