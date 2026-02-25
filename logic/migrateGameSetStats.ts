import { GameType } from "@/types/game";
import { initialBaseStats, getStatsForAction, Stat } from "@/types/stats";
import { isScoringPlay, getPointsForStat } from "@/logic/statUpdates";

/**
 * Rebuilds `game.sets[setId].stats` by replaying play-by-play entries.
 *
 * The opponent-stats-in-sets bug (fixed in statUpdates.ts / possessionSimulation.ts)
 * corrupted game-level set stats by including opponent stats. This migration
 * resets every set's stats to zero then re-derives them from play-by-play,
 * skipping opponent plays and plays without a setId.
 *
 * Safe to run on already-clean data — the result is idempotent.
 */
export function migrateGameSetStats(games: Record<string, GameType>): Record<string, GameType> {
  const migrated: Record<string, GameType> = {};

  for (const [gameId, game] of Object.entries(games)) {
    // No sets → nothing to fix
    if (!game.sets || Object.keys(game.sets).length === 0) {
      migrated[gameId] = game;
      continue;
    }

    // Deep-clone sets and reset stats (preserve id, name, teamId, runCount)
    const rebuiltSets = { ...game.sets };
    for (const setId of Object.keys(rebuiltSets)) {
      rebuiltSets[setId] = {
        ...rebuiltSets[setId],
        stats: { ...initialBaseStats },
      };
    }

    // Replay every play-by-play entry across all periods
    for (const period of game.periods) {
      if (!period?.playByPlay) continue;

      for (const play of period.playByPlay) {
        // Skip plays without a setId or opponent plays
        if (!play.setId || play.playerId === "Opponent") continue;

        // Skip if this setId doesn't exist in game.sets
        if (!rebuiltSets[play.setId]) continue;

        const stats = getStatsForAction(play.action);

        for (const stat of stats) {
          rebuiltSets[play.setId].stats[stat] = (rebuiltSets[play.setId].stats[stat] || 0) + 1;

          if (isScoringPlay(stat)) {
            const points = getPointsForStat(stat);
            rebuiltSets[play.setId].stats[Stat.Points] =
              (rebuiltSets[play.setId].stats[Stat.Points] || 0) + points;
          }
        }
      }
    }

    migrated[gameId] = { ...game, sets: rebuiltSets };
  }

  return migrated;
}
