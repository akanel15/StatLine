import { useGameStore } from "@/store/gameStore";
import { correctGameCounts } from "@/utils/gameCountAudit";
import { storeHydration } from "@/utils/storeHydration";

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
 *
 * IMPORTANT: This function waits for all Zustand stores to hydrate from AsyncStorage
 * before running any checks. This prevents the race condition where we would
 * "correct" game counts to 0 before the actual data loads.
 */
export async function runAppLoadHealthCheck(): Promise<HealthCheckReport> {
  const startTime = Date.now();
  const errors: string[] = [];

  // CRITICAL: Wait for all stores to hydrate from AsyncStorage before running checks
  // Without this, we would read empty state and "correct" all game counts to 0
  try {
    if (__DEV__) {
      console.log("⏳ Waiting for store hydration before health check...");
    }
    await storeHydration.waitForHydration();
    if (__DEV__) {
      console.log("✅ Store hydration complete, running health check...");
    }
  } catch (error) {
    const errorMsg = `Store hydration failed: ${error}`;
    if (__DEV__) {
      console.error(`❌ ${errorMsg}`);
    }
    errors.push(errorMsg);
    // Continue anyway - better to try the health check than skip it entirely
  }

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
