import { Stat } from "@/types/stats";

/**
 * Stats that don't indicate a change of possession.
 * Fouls and deflections mean the opponent touched/affected play,
 * but doesn't mean they have possession.
 */
const NON_POSSESSION_STATS: Stat[] = [Stat.FoulsCommitted, Stat.FoulsDrawn, Stat.Deflections];

/**
 * Determines whether the active set should be reset based on the stat recorded.
 *
 * A set stays active for the entire possession.
 * The set only resets when the opponent gains possession.
 *
 * Reset Triggers:
 * 1. Our team's turnover → RESET
 * 2. Opponent records any stat EXCEPT a foul or deflection → RESET
 *
 *
 * @param stats - Array of stats being recorded
 * @param isOpponent - Whether the stat is for the opponent team
 * @returns true if the set should be reset, false otherwise
 */
export function shouldResetSet(stats: Stat[], isOpponent: boolean): boolean {
  // Empty stats array - no action taken, don't reset
  if (stats.length === 0) {
    return false;
  }

  // Our team's turnover = you lost possession = reset
  if (!isOpponent && stats.includes(Stat.Turnovers)) {
    return true;
  }

  // Opponent stat (except foul/deflection) = they have possession = reset
  if (isOpponent) {
    const hasOnlyNonPossessionStats = stats.every(stat => NON_POSSESSION_STATS.includes(stat));
    // Reset if any stat indicates possession (i.e., not all are non-possession stats)
    return !hasOnlyNonPossessionStats;
  }

  // Our team's other actions (shots, rebounds, assists, etc.) - stay active
  return false;
}
