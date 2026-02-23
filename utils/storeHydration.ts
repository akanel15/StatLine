/**
 * Store hydration tracking utility
 *
 * Zustand's persist middleware hydrates stores asynchronously from AsyncStorage.
 * This utility tracks which stores have completed hydration so we can safely
 * run operations that depend on persisted state (like health checks).
 */

type HydrationCallback = () => void;

class StoreHydrationTracker {
  private hydratedStores: Set<string> = new Set();
  private expectedStores: Set<string> = new Set();
  private callbacks: HydrationCallback[] = [];
  private isComplete: boolean = false;

  /**
   * Register a store that needs to be tracked for hydration
   * Call this when setting up each persisted store
   */
  registerStore(storeName: string): void {
    this.expectedStores.add(storeName);
  }

  /**
   * Mark a store as hydrated
   * Call this from the store's onRehydrateStorage callback
   */
  markHydrated(storeName: string): void {
    this.hydratedStores.add(storeName);

    if (__DEV__) {
      console.log(
        `Store hydrated: ${storeName} (${this.hydratedStores.size}/${this.expectedStores.size})`,
      );
    }

    // Check if all expected stores are hydrated
    if (this.hydratedStores.size >= this.expectedStores.size) {
      this.isComplete = true;
      // Notify all waiting callbacks
      this.callbacks.forEach(callback => callback());
      this.callbacks = [];
    }
  }

  /**
   * Wait for all registered stores to complete hydration
   * Returns immediately if already hydrated
   */
  waitForHydration(): Promise<void> {
    // If no stores registered or already complete, resolve immediately
    if (this.expectedStores.size === 0 || this.isComplete) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      // Check again in case state changed
      if (this.isComplete) {
        resolve();
        return;
      }

      // Add to callback queue
      this.callbacks.push(resolve);

      // Safety timeout - don't wait forever if something goes wrong
      // 5 seconds should be more than enough for hydration
      setTimeout(() => {
        if (!this.isComplete) {
          if (__DEV__) {
            console.warn(
              `Hydration timeout - proceeding anyway. ` +
                `Hydrated: ${Array.from(this.hydratedStores).join(", ")}. ` +
                `Expected: ${Array.from(this.expectedStores).join(", ")}`,
            );
          }
          resolve();
        }
      }, 5000);
    });
  }

  /**
   * Check if all stores are hydrated
   */
  isHydrated(): boolean {
    return this.isComplete;
  }

  /**
   * Reset state (useful for testing)
   */
  reset(): void {
    this.hydratedStores.clear();
    this.expectedStores.clear();
    this.callbacks = [];
    this.isComplete = false;
  }
}

// Export singleton instance
export const storeHydration = new StoreHydrationTracker();

// Register all our persisted stores
storeHydration.registerStore("statline-game-store");
storeHydration.registerStore("statline-team-store");
storeHydration.registerStore("statline-player-store");
storeHydration.registerStore("statline-set-store");
storeHydration.registerStore("help-storage");
storeHydration.registerStore("review-storage");
