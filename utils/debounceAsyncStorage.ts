import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";

/**
 * Debounced AsyncStorage wrapper
 * Batches rapid writes to reduce blocking operations
 * Automatically flushes pending writes when app goes to background
 */
class DebouncedAsyncStorage {
  private writeTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private pendingWrites: Map<string, string> = new Map();
  private debounceMs: number;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

  constructor(debounceMs: number = 300) {
    this.debounceMs = debounceMs;
    this.setupAppStateListener();
  }

  /**
   * Set up listener to flush writes when app goes to background
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "background" || nextState === "inactive") {
        // Flush all pending writes before app goes to background
        this.flush().catch(error => {
          if (__DEV__) {
            console.error("Failed to flush storage on background:", error);
          }
        });
      }
    });
  }

  /**
   * Debounced setItem - only writes after debounceMs of no changes
   * Stores value immediately in pendingWrites so flush() can access it
   */
  setItem = async (key: string, value: string): Promise<void> => {
    // Store the value immediately so flush() can access it
    this.pendingWrites.set(key, value);

    // Clear existing timeout for this key
    const existingTimeout = this.writeTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          // Get the latest value (may have changed during debounce)
          const latestValue = this.pendingWrites.get(key);
          if (latestValue !== undefined) {
            await AsyncStorage.setItem(key, latestValue);
            this.pendingWrites.delete(key);
          }
          this.writeTimeouts.delete(key);
          resolve();
        } catch (error) {
          this.writeTimeouts.delete(key);
          reject(error);
        }
      }, this.debounceMs);

      this.writeTimeouts.set(key, timeout);
    });
  };

  /**
   * Immediate getItem (no debouncing on reads)
   * Returns pending write value if available for consistency
   */
  getItem = async (key: string): Promise<string | null> => {
    // Check if there's a pending write for this key
    const pendingValue = this.pendingWrites.get(key);
    if (pendingValue !== undefined) {
      return pendingValue;
    }
    return AsyncStorage.getItem(key);
  };

  /**
   * Immediate removeItem (no debouncing on deletes)
   */
  removeItem = async (key: string): Promise<void> => {
    // Clear any pending writes for this key
    const existingTimeout = this.writeTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.writeTimeouts.delete(key);
    }
    this.pendingWrites.delete(key);
    return AsyncStorage.removeItem(key);
  };

  /**
   * Force flush all pending writes immediately
   * Writes all pending values to AsyncStorage before clearing
   */
  flush = async (): Promise<void> => {
    // Cancel all pending timeouts first
    this.writeTimeouts.forEach(timeout => clearTimeout(timeout));
    this.writeTimeouts.clear();

    // Get all pending writes
    const writes = Array.from(this.pendingWrites.entries());

    if (writes.length === 0) {
      return;
    }

    // Write all pending data to AsyncStorage
    try {
      await Promise.all(writes.map(([key, value]) => AsyncStorage.setItem(key, value)));

      // Clear pending writes only after successful write
      this.pendingWrites.clear();

      if (__DEV__) {
        console.log(`Flushed ${writes.length} pending storage write(s)`);
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error flushing storage:", error);
      }
      throw error;
    }
  };

  /**
   * Check if there are any pending writes
   */
  hasPendingWrites = (): boolean => {
    return this.pendingWrites.size > 0;
  };
}

// Export singleton instance with 300ms debounce
export const debouncedAsyncStorage = new DebouncedAsyncStorage(300);
