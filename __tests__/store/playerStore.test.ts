import { usePlayerStore } from "@/store/playerStore";
import { Result } from "@/types/player";
import { Stat } from "@/types/stats";

// Mock UUID for consistent IDs
jest.mock("react-native-uuid", () => ({
  v4: jest.fn(() => "test-player-id"),
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Expo FileSystem
jest.mock("expo-file-system", () => ({
  documentDirectory: "file://test-directory/",
  copyAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock zustand to bypass persistence for testing
jest.mock("zustand/middleware", () => ({
  persist: (fn: any) => fn,
  createJSONStorage: () => ({}),
}));

describe("Player Store", () => {
  beforeEach(() => {
    // Reset store state before each test
    usePlayerStore.getState().players = {};
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clear all store state after tests
    usePlayerStore.getState().players = {};
  });

  describe("Player CRUD Operations", () => {
    it("should add a new player without image", async () => {
      const store = usePlayerStore.getState();

      await store.addPlayer("John Doe", 23, "team-1");

      const players = usePlayerStore.getState().players;
      expect(Object.keys(players)).toHaveLength(1);
      expect(players["test-player-id"]).toBeDefined();
      expect(players["test-player-id"].name).toBe("John Doe");
      expect(players["test-player-id"].number).toBe(23);
      expect(players["test-player-id"].teamId).toBe("team-1");
      expect(players["test-player-id"].imageUri).toBeUndefined();
      expect(players["test-player-id"].gameNumbers.gamesPlayed).toBe(0);
      expect(players["test-player-id"].stats[Stat.Points]).toBe(0);
    });

    it("should add a new player with image", async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mockFileSystem = require("expo-file-system/legacy");
      const store = usePlayerStore.getState();

      await store.addPlayer("Jane Smith", 10, "team-1", "file://test-image.jpg");

      expect(mockFileSystem.copyAsync).toHaveBeenCalled();
      const players = usePlayerStore.getState().players;
      expect(players["test-player-id"].imageUri).toContain("file://test-directory/");
      expect(players["test-player-id"].imageUri).toContain("test-image.jpg");
    });

    it("should remove a player", () => {
      const store = usePlayerStore.getState();

      // First add a player
      store.addPlayer("John Doe", 23, "team-1");
      expect(Object.keys(usePlayerStore.getState().players)).toHaveLength(1);

      // Then remove the player
      store.removePlayer("test-player-id");
      expect(Object.keys(usePlayerStore.getState().players)).toHaveLength(0);
    });

    it("should warn and not crash when removing non-existent player", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = usePlayerStore.getState();

      store.removePlayer("non-existent-id");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Player with ID non-existent-id not found. Cannot remove.",
      );
      expect(Object.keys(usePlayerStore.getState().players)).toHaveLength(0);
      consoleSpy.mockRestore();
    });
  });

  describe("Game Statistics Updates", () => {
    beforeEach(async () => {
      const store = usePlayerStore.getState();
      await store.addPlayer("John Doe", 23, "team-1");
    });

    it("should update games played for wins", () => {
      const store = usePlayerStore.getState();

      store.updateGamesPlayed("test-player-id", Result.Win);

      const player = usePlayerStore.getState().players["test-player-id"];
      expect(player.gameNumbers.wins).toBe(1);
      expect(player.gameNumbers.gamesPlayed).toBe(1);
      expect(player.gameNumbers.losses).toBe(0);
      expect(player.gameNumbers.draws).toBe(0);
    });

    it("should update games played for losses", () => {
      const store = usePlayerStore.getState();

      store.updateGamesPlayed("test-player-id", Result.Loss);

      const player = usePlayerStore.getState().players["test-player-id"];
      expect(player.gameNumbers.losses).toBe(1);
      expect(player.gameNumbers.gamesPlayed).toBe(1);
      expect(player.gameNumbers.wins).toBe(0);
      expect(player.gameNumbers.draws).toBe(0);
    });

    it("should update games played for draws", () => {
      const store = usePlayerStore.getState();

      store.updateGamesPlayed("test-player-id", Result.Draw);

      const player = usePlayerStore.getState().players["test-player-id"];
      expect(player.gameNumbers.draws).toBe(1);
      expect(player.gameNumbers.gamesPlayed).toBe(1);
      expect(player.gameNumbers.wins).toBe(0);
      expect(player.gameNumbers.losses).toBe(0);
    });

    it("should accumulate game numbers", () => {
      const store = usePlayerStore.getState();

      store.updateGamesPlayed("test-player-id", Result.Win);
      store.updateGamesPlayed("test-player-id", Result.Win);
      store.updateGamesPlayed("test-player-id", Result.Loss);

      const player = usePlayerStore.getState().players["test-player-id"];
      expect(player.gameNumbers.wins).toBe(2);
      expect(player.gameNumbers.losses).toBe(1);
      expect(player.gameNumbers.draws).toBe(0);
      expect(player.gameNumbers.gamesPlayed).toBe(3);
    });

    it("should warn when updating games for non-existent player", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = usePlayerStore.getState();

      store.updateGamesPlayed("non-existent", Result.Win);

      expect(consoleSpy).toHaveBeenCalledWith("Player with ID non-existent not found.");
      consoleSpy.mockRestore();
    });
  });

  describe("Game Statistics Reversion", () => {
    beforeEach(async () => {
      const store = usePlayerStore.getState();
      await store.addPlayer("John Doe", 23, "team-1");
      // Add some games first
      store.updateGamesPlayed("test-player-id", Result.Win);
      store.updateGamesPlayed("test-player-id", Result.Win);
      store.updateGamesPlayed("test-player-id", Result.Loss);
    });

    it("should revert win statistics", () => {
      const store = usePlayerStore.getState();

      store.revertGameNumbers("test-player-id", Result.Win);

      const player = usePlayerStore.getState().players["test-player-id"];
      expect(player.gameNumbers.wins).toBe(1);
      expect(player.gameNumbers.losses).toBe(1);
      expect(player.gameNumbers.draws).toBe(0);
      expect(player.gameNumbers.gamesPlayed).toBe(2);
    });

    it("should revert loss statistics", () => {
      const store = usePlayerStore.getState();

      store.revertGameNumbers("test-player-id", Result.Loss);

      const player = usePlayerStore.getState().players["test-player-id"];
      expect(player.gameNumbers.wins).toBe(2);
      expect(player.gameNumbers.losses).toBe(0);
      expect(player.gameNumbers.draws).toBe(0);
      expect(player.gameNumbers.gamesPlayed).toBe(2);
    });

    it("should not go below zero when reverting", () => {
      const store = usePlayerStore.getState();

      // Revert more draws than exist
      store.revertGameNumbers("test-player-id", Result.Draw);
      store.revertGameNumbers("test-player-id", Result.Draw);

      const player = usePlayerStore.getState().players["test-player-id"];
      expect(player.gameNumbers.draws).toBe(0);
      expect(player.gameNumbers.gamesPlayed).toBeGreaterThanOrEqual(0);
    });

    it("should warn when reverting games for non-existent player", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = usePlayerStore.getState();

      store.revertGameNumbers("non-existent", Result.Win);

      expect(consoleSpy).toHaveBeenCalledWith("Player with ID non-existent not found.");
      consoleSpy.mockRestore();
    });
  });

  describe("Player Statistics Updates", () => {
    beforeEach(async () => {
      const store = usePlayerStore.getState();
      await store.addPlayer("John Doe", 23, "team-1");
    });

    it("should update player statistics", () => {
      const store = usePlayerStore.getState();

      store.updateStats("test-player-id", Stat.Points, 15);

      const player = usePlayerStore.getState().players["test-player-id"];
      expect(player.stats[Stat.Points]).toBe(15);
    });

    it("should accumulate player statistics", () => {
      const store = usePlayerStore.getState();

      store.updateStats("test-player-id", Stat.Points, 10);
      store.updateStats("test-player-id", Stat.Points, 5);
      store.updateStats("test-player-id", Stat.Assists, 3);

      const player = usePlayerStore.getState().players["test-player-id"];
      expect(player.stats[Stat.Points]).toBe(15);
      expect(player.stats[Stat.Assists]).toBe(3);
      expect(player.stats[Stat.TwoPointMakes]).toBe(0); // Should remain unchanged
    });

    it("should handle negative stat updates (reversals)", () => {
      const store = usePlayerStore.getState();

      store.updateStats("test-player-id", Stat.Points, 20);
      store.updateStats("test-player-id", Stat.Points, -5);

      const player = usePlayerStore.getState().players["test-player-id"];
      expect(player.stats[Stat.Points]).toBe(15);
    });

    it("should update multiple different statistics", () => {
      const store = usePlayerStore.getState();

      store.updateStats("test-player-id", Stat.TwoPointMakes, 3);
      store.updateStats("test-player-id", Stat.ThreePointMakes, 2);
      store.updateStats("test-player-id", Stat.DefensiveRebounds, 7);
      store.updateStats("test-player-id", Stat.Assists, 4);

      const player = usePlayerStore.getState().players["test-player-id"];
      expect(player.stats[Stat.TwoPointMakes]).toBe(3);
      expect(player.stats[Stat.ThreePointMakes]).toBe(2);
      expect(player.stats[Stat.DefensiveRebounds]).toBe(7);
      expect(player.stats[Stat.Assists]).toBe(4);
    });

    it("should warn when updating stats for non-existent player", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = usePlayerStore.getState();

      store.updateStats("non-existent", Stat.Points, 10);

      expect(consoleSpy).toHaveBeenCalledWith("Player with ID non-existent not found.");
      consoleSpy.mockRestore();
    });
  });

  describe("Data Integrity", () => {
    it("should maintain separate player data", async () => {
      const store = usePlayerStore.getState();

      await store.addPlayer("Player 1", 10, "team-1");
      const player1Id = "test-player-id";

      // Mock UUID to return different ID for second player
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mockUuid = require("react-native-uuid");
      mockUuid.v4.mockReturnValueOnce("test-player-id-2");

      await store.addPlayer("Player 2", 20, "team-2");

      store.updateStats(player1Id, Stat.Points, 15);
      store.updateStats("test-player-id-2", Stat.Points, 25);
      store.updateGamesPlayed(player1Id, Result.Win);
      store.updateGamesPlayed("test-player-id-2", Result.Loss);

      const players = usePlayerStore.getState().players;
      expect(players[player1Id].stats[Stat.Points]).toBe(15);
      expect(players["test-player-id-2"].stats[Stat.Points]).toBe(25);
      expect(players[player1Id].gameNumbers.wins).toBe(1);
      expect(players["test-player-id-2"].gameNumbers.losses).toBe(1);
    });

    it("should preserve unchanged fields when updating", async () => {
      const store = usePlayerStore.getState();

      await store.addPlayer("John Doe", 23, "team-1", "file://image.jpg");

      const originalPlayer = usePlayerStore.getState().players["test-player-id"];
      const originalName = originalPlayer.name;
      const originalNumber = originalPlayer.number;
      const originalTeamId = originalPlayer.teamId;

      store.updateStats("test-player-id", Stat.Points, 10);

      const updatedPlayer = usePlayerStore.getState().players["test-player-id"];
      expect(updatedPlayer.name).toBe(originalName);
      expect(updatedPlayer.number).toBe(originalNumber);
      expect(updatedPlayer.teamId).toBe(originalTeamId);
      expect(updatedPlayer.stats[Stat.Points]).toBe(10);
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined or null stat values gracefully", async () => {
      const store = usePlayerStore.getState();

      await store.addPlayer("John Doe", 23, "team-1");

      // The stats should initialize to 0, not undefined
      const player = usePlayerStore.getState().players["test-player-id"];
      expect(player.stats[Stat.Points]).toBe(0);

      // Updating should work even if the stat is initially undefined
      store.updateStats("test-player-id", Stat.Points, 5);
      expect(usePlayerStore.getState().players["test-player-id"].stats[Stat.Points]).toBe(5);
    });

    it("should handle undefined or null game number values gracefully", async () => {
      const store = usePlayerStore.getState();

      await store.addPlayer("John Doe", 23, "team-1");

      // The game numbers should initialize to 0
      const player = usePlayerStore.getState().players["test-player-id"];
      expect(player.gameNumbers.wins).toBe(0);
      expect(player.gameNumbers.gamesPlayed).toBe(0);

      // Updating should work correctly
      store.updateGamesPlayed("test-player-id", Result.Win);
      const updatedPlayer = usePlayerStore.getState().players["test-player-id"];
      expect(updatedPlayer.gameNumbers.wins).toBe(1);
      expect(updatedPlayer.gameNumbers.gamesPlayed).toBe(1);
    });
  });
});
