import { useGameStore } from "@/store/gameStore";
import { correctGameCounts } from "@/utils/gameCountAudit";

export type HealthCheckReport = {
  gamesMarkedComplete: number;
  gameCountsFixed: boolean;
  duration: number;
  errors: string[];
};

/**
 * Marks all unfinished games as complete
 */
export function markAllGamesAsComplete(): number {
  const gameState = useGameStore.getState();
  const games = Object.values(gameState.games);
  let count = 0;

  games.forEach(game => {
    if (!game.isFinished) {
      gameState.markGameAsFinished(game.id);
      count++;
    }
  });

  return count;
}

/**
 * Syncs game counts for all teams and players based on finished games
 */
export function syncGameCounts(): boolean {
  try {
    correctGameCounts();
    return true;
  } catch (error) {
    if (__DEV__) {
      console.error("Error syncing game counts:", error);
    }
    return false;
  }
}

/**
 * Main health check orchestrator - runs all checks on app load
 */
export async function runAppLoadHealthCheck(): Promise<HealthCheckReport> {
  const startTime = Date.now();
  const errors: string[] = [];

  // Check 1: Mark all games as complete
  let gamesMarkedComplete = 0;
  try {
    gamesMarkedComplete = markAllGamesAsComplete();
  } catch (error) {
    const errorMsg = `Failed to mark games complete: ${error}`;
    if (__DEV__) {
      console.error(`❌ ${errorMsg}`);
    }
    errors.push(errorMsg);
  }

  // Check 2: Sync game counts
  let gameCountsFixed = false;
  try {
    gameCountsFixed = syncGameCounts();
    if (!gameCountsFixed) {
      const errorMsg = "Failed to sync game counts";
      if (__DEV__) {
        console.error(`❌ ${errorMsg}`);
      }
      errors.push(errorMsg);
    }
  } catch (error) {
    const errorMsg = `Failed to sync game counts: ${error}`;
    if (__DEV__) {
      console.error(`❌ ${errorMsg}`);
    }
    errors.push(errorMsg);
  }

  const duration = Date.now() - startTime;

  // Single log at the end (dev only)
  if (__DEV__) {
    if (errors.length === 0) {
      console.log(
        `✅ Health check complete: marked ${gamesMarkedComplete} games complete, synced counts`,
      );
    } else {
      console.warn(`⚠️ Health check completed with ${errors.length} errors`);
    }
  }

  return {
    gamesMarkedComplete,
    gameCountsFixed,
    duration,
    errors,
  };
}
