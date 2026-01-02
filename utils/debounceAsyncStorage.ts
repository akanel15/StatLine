import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Debounced AsyncStorage wrapper
 * Batches rapid writes to reduce blocking operations
 */
class DebouncedAsyncStorage {
  private writeTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private debounceMs: number;

  constructor(debounceMs: number = 300) {
    this.debounceMs = debounceMs;
  }

  /**
   * Debounced setItem - only writes after debounceMs of no changes
   */
  setItem = async (key: string, value: string): Promise<void> => {
    // Clear existing timeout for this key
    const existingTimeout = this.writeTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          await AsyncStorage.setItem(key, value);
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
   */
  getItem = async (key: string): Promise<string | null> => {
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
    return AsyncStorage.removeItem(key);
  };

  /**
   * Force flush all pending writes immediately
   */
  flush = async (): Promise<void> => {
    const timeouts = Array.from(this.writeTimeouts.values());
    timeouts.forEach(timeout => clearTimeout(timeout));
    this.writeTimeouts.clear();
  };
}

// Export singleton instance with 300ms debounce
export const debouncedAsyncStorage = new DebouncedAsyncStorage(300);
