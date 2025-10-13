import { StatsType, initialBaseStats, Stat } from "@/types/stats";

/**
 * Calculate per-game averages from cumulative player statistics
 * @param stats - Cumulative statistics for a player
 * @param gamesPlayed - Number of games the player has played
 * @returns Per-game averaged statistics
 */
export function calculatePlayerAverages(stats: StatsType, gamesPlayed: number): StatsType {
  // Handle edge case: no games played
  if (gamesPlayed === 0) {
    return { ...initialBaseStats };
  }

  // Calculate averages for each stat
  const averages: StatsType = {
    [Stat.Points]: stats[Stat.Points] / gamesPlayed,
    [Stat.Assists]: stats[Stat.Assists] / gamesPlayed,
    [Stat.DefensiveRebounds]: stats[Stat.DefensiveRebounds] / gamesPlayed,
    [Stat.OffensiveRebounds]: stats[Stat.OffensiveRebounds] / gamesPlayed,
    [Stat.Steals]: stats[Stat.Steals] / gamesPlayed,
    [Stat.Deflections]: stats[Stat.Deflections] / gamesPlayed,
    [Stat.Blocks]: stats[Stat.Blocks] / gamesPlayed,
    [Stat.Turnovers]: stats[Stat.Turnovers] / gamesPlayed,
    [Stat.TwoPointMakes]: stats[Stat.TwoPointMakes] / gamesPlayed,
    [Stat.TwoPointAttempts]: stats[Stat.TwoPointAttempts] / gamesPlayed,
    [Stat.ThreePointMakes]: stats[Stat.ThreePointMakes] / gamesPlayed,
    [Stat.ThreePointAttempts]: stats[Stat.ThreePointAttempts] / gamesPlayed,
    [Stat.FreeThrowsMade]: stats[Stat.FreeThrowsMade] / gamesPlayed,
    [Stat.FreeThrowsAttempted]: stats[Stat.FreeThrowsAttempted] / gamesPlayed,
    [Stat.FoulsCommitted]: stats[Stat.FoulsCommitted] / gamesPlayed,
    [Stat.FoulsDrawn]: stats[Stat.FoulsDrawn] / gamesPlayed,
    [Stat.PlusMinus]: stats[Stat.PlusMinus] / gamesPlayed,
  };

  return averages;
}
