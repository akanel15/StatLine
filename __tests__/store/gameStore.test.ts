import { useGameStore } from "@/store/gameStore";
import { PeriodType, Team } from "@/types/game";
import { Stat, initialBaseStats } from "@/types/stats";

// Mock UUID for consistent IDs
jest.mock("react-native-uuid", () => ({
  v4: jest.fn(() => "test-game-id"),
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock zustand to bypass persistence for testing
jest.mock("zustand/middleware", () => ({
  persist: (fn: any) => fn,
  createJSONStorage: () => ({}),
}));

// Mock set store
jest.mock("@/store/setStore", () => ({
  useSetStore: {
    getState: () => ({
      sets: {
        "set-1": {
          id: "set-1",
          name: "Test Set 1",
          teamId: "team-1",
          runCount: 0,
          stats: { ...initialBaseStats },
        },
        "new-set": {
          id: "new-set",
          name: "New Test Set",
          teamId: "team-1",
          runCount: 0,
          stats: { ...initialBaseStats },
        },
      },
    }),
  },
}));

describe("Game Store", () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.getState().games = {};
  });

  afterEach(() => {
    // Clear all store state after tests
    useGameStore.getState().games = {};
  });

  describe("Game CRUD Operations", () => {
    it("should add a new game", () => {
      const store = useGameStore.getState();

      const gameId = store.addGame("team-1", "Opponent Team", PeriodType.Quarters);
      expect(gameId).toBe("test-game-id");

      const games = useGameStore.getState().games;
      expect(Object.keys(games)).toHaveLength(1);
      expect(games["test-game-id"]).toBeDefined();
      expect(games["test-game-id"].opposingTeamName).toBe("Opponent Team");
      expect(games["test-game-id"].periodType).toBe(PeriodType.Quarters);
      expect(games["test-game-id"].isFinished).toBe(false);
    });

    it("should remove a game", () => {
      const store = useGameStore.getState();

      store.addGame("team-1", "Opponent Team", PeriodType.Quarters);
      store.removeGame("test-game-id");

      expect(Object.keys(useGameStore.getState().games)).toHaveLength(0);
    });

    it("should warn and not crash when removing non-existent game", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = useGameStore.getState();

      store.removeGame("non-existent-id");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Game with ID non-existent-id not found. Cannot remove.",
      );
      expect(Object.keys(useGameStore.getState().games)).toHaveLength(0);
      consoleSpy.mockRestore();
    });
  });

  describe("Box Score Updates", () => {
    beforeEach(() => {
      const store = useGameStore.getState();
      store.addGame("team-1", "Opponent Team", PeriodType.Quarters);
    });

    it("should update box score for a player", () => {
      const store = useGameStore.getState();

      store.updateBoxScore("test-game-id", "player-1", Stat.TwoPointMakes, 1);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.boxScore["player-1"][Stat.TwoPointMakes]).toBe(1);
    });

    it("should accumulate box score stats", () => {
      const store = useGameStore.getState();

      store.updateBoxScore("test-game-id", "player-1", Stat.TwoPointMakes, 1);
      store.updateBoxScore("test-game-id", "player-1", Stat.TwoPointMakes, 1);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.boxScore["player-1"][Stat.TwoPointMakes]).toBe(2);
    });

    it("should handle negative amounts (stat reversals)", () => {
      const store = useGameStore.getState();

      store.updateBoxScore("test-game-id", "player-1", Stat.TwoPointMakes, 3);
      store.updateBoxScore("test-game-id", "player-1", Stat.TwoPointMakes, -1);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.boxScore["player-1"][Stat.TwoPointMakes]).toBe(2);
    });
  });

  describe("Stat Totals Updates", () => {
    beforeEach(() => {
      const store = useGameStore.getState();
      store.addGame("team-1", "Opponent Team", PeriodType.Quarters);
    });

    it("should update stat totals for our team", () => {
      const store = useGameStore.getState();

      store.updateTotals("test-game-id", Stat.Points, 2, Team.Us);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.statTotals[Team.Us][Stat.Points]).toBe(2);
    });

    it("should update stat totals for opponent team", () => {
      const store = useGameStore.getState();

      store.updateTotals("test-game-id", Stat.Points, 3, Team.Opponent);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.statTotals[Team.Opponent][Stat.Points]).toBe(3);
    });

    it("should accumulate stat totals", () => {
      const store = useGameStore.getState();

      store.updateTotals("test-game-id", Stat.Points, 2, Team.Us);
      store.updateTotals("test-game-id", Stat.Points, 3, Team.Us);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.statTotals[Team.Us][Stat.Points]).toBe(5);
    });
  });

  describe("Game Status Management", () => {
    beforeEach(() => {
      const store = useGameStore.getState();
      store.addGame("team-1", "Opponent Team", PeriodType.Quarters);
    });

    it("should mark game as finished", () => {
      const store = useGameStore.getState();

      store.markGameAsFinished("test-game-id");

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.isFinished).toBe(true);
    });

    it("should mark game as active", () => {
      const store = useGameStore.getState();

      store.markGameAsFinished("test-game-id");
      store.markGameAsActive("test-game-id");

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.isFinished).toBe(false);
    });

    it("should warn when marking non-existent game", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = useGameStore.getState();

      store.markGameAsFinished("non-existent");

      expect(consoleSpy).toHaveBeenCalledWith("Game with ID non-existent not found.");
      consoleSpy.mockRestore();
    });
  });

  describe("Player and Set Management", () => {
    beforeEach(() => {
      const store = useGameStore.getState();
      store.addGame("team-1", "Opponent Team", PeriodType.Quarters);
    });

    it("should set active players", () => {
      const store = useGameStore.getState();

      store.setActivePlayers("test-game-id", ["player-1", "player-2"]);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.activePlayers).toEqual(["player-1", "player-2"]);
    });

    it("should warn when setting active players for non-existent game", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = useGameStore.getState();

      store.setActivePlayers("non-existent", ["player-1"]);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Game with ID non-existent not found. Cannot update active players.",
      );
      consoleSpy.mockRestore();
    });

    it("should set active sets", () => {
      const store = useGameStore.getState();

      store.setActiveSets("test-game-id", ["set-1", "set-2"]);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.activeSets).toEqual(["set-1", "set-2"]);
    });

    it("should warn when setting active sets for non-existent game", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = useGameStore.getState();

      store.setActiveSets("non-existent", ["set-1"]);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Game with ID non-existent not found. Cannot update active sets.",
      );
      consoleSpy.mockRestore();
    });

    it("should add players to game played list without duplicates", () => {
      const store = useGameStore.getState();

      store.addPlayersToGamePlayedList("test-game-id", ["player-1", "player-2"]);
      store.addPlayersToGamePlayedList("test-game-id", ["player-2", "player-3"]);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.gamePlayedList).toEqual(["player-1", "player-2", "player-3"]);
    });

    it("should warn when adding players to non-existent game", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = useGameStore.getState();

      store.addPlayersToGamePlayedList("non-existent", ["player-1"]);

      expect(consoleSpy).toHaveBeenCalledWith("Game with ID non-existent not found.");
      consoleSpy.mockRestore();
    });

    it("should update set statistics", () => {
      const store = useGameStore.getState();

      store.updateSetStats("test-game-id", "set-1", Stat.TwoPointMakes, 1);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.sets["set-1"].stats[Stat.TwoPointMakes]).toBe(1);
    });

    it("should accumulate set statistics", () => {
      const store = useGameStore.getState();

      store.updateSetStats("test-game-id", "set-1", Stat.TwoPointMakes, 1);
      store.updateSetStats("test-game-id", "set-1", Stat.TwoPointMakes, 2);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.sets["set-1"].stats[Stat.TwoPointMakes]).toBe(3);
    });

    it("should warn when updating set stats for non-existent game", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = useGameStore.getState();

      store.updateSetStats("non-existent", "set-1", Stat.TwoPointMakes, 1);

      expect(consoleSpy).toHaveBeenCalledWith("Game with ID non-existent not found.");
      consoleSpy.mockRestore();
    });

    it("should increment set run count", () => {
      const store = useGameStore.getState();

      store.incrementSetRunCount("test-game-id", "set-1");
      store.incrementSetRunCount("test-game-id", "set-1");

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.sets["set-1"].runCount).toBe(2);
    });

    it("should initialize set run count from 0", () => {
      const store = useGameStore.getState();

      store.incrementSetRunCount("test-game-id", "new-set");

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.sets["new-set"].runCount).toBe(1);
    });

    it("should warn when incrementing run count for non-existent game", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = useGameStore.getState();

      store.incrementSetRunCount("non-existent", "set-1");

      expect(consoleSpy).toHaveBeenCalledWith("Game with ID non-existent not found.");
      consoleSpy.mockRestore();
    });
  });

  describe("Period Management and Play-by-Play", () => {
    beforeEach(() => {
      const store = useGameStore.getState();
      store.addGame("team-1", "Opponent Team", PeriodType.Quarters);
    });

    it("should update periods with scoring plays", () => {
      const store = useGameStore.getState();

      store.updatePeriods("test-game-id", "player-1", Stat.TwoPointMakes, 0, Team.Us);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.periods[0][Team.Us]).toBe(2);
      expect(game.periods[0].playByPlay).toHaveLength(1);
      expect(game.periods[0].playByPlay[0]).toEqual({
        playerId: "player-1",
        action: Stat.TwoPointMakes,
      });
    });

    it("should handle three point makes correctly", () => {
      const store = useGameStore.getState();

      store.updatePeriods("test-game-id", "player-1", Stat.ThreePointMakes, 0, Team.Us);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.periods[0][Team.Us]).toBe(3);
    });

    it("should handle free throws correctly", () => {
      const store = useGameStore.getState();

      store.updatePeriods("test-game-id", "player-1", Stat.FreeThrowsMade, 0, Team.Us);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.periods[0][Team.Us]).toBe(1);
    });

    it("should handle non-scoring stats without changing score", () => {
      const store = useGameStore.getState();

      store.updatePeriods("test-game-id", "player-1", Stat.DefensiveRebounds, 0, Team.Us);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.periods[0][Team.Us]).toBe(0);
      expect(game.periods[0].playByPlay).toHaveLength(1);
    });

    it("should handle opponent team scoring", () => {
      const store = useGameStore.getState();

      store.updatePeriods("test-game-id", "Opponent", Stat.TwoPointMakes, 0, Team.Opponent);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.periods[0][Team.Opponent]).toBe(2);
    });

    it("should create new periods if they do not exist", () => {
      const store = useGameStore.getState();

      store.updatePeriods("test-game-id", "player-1", Stat.TwoPointMakes, 3, Team.Us);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.periods[3]).toBeDefined();
      expect(game.periods[3][Team.Us]).toBe(2);
      expect(game.periods[3][Team.Opponent]).toBe(0);
    });

    it("should return unchanged state for non-existent game", () => {
      const store = useGameStore.getState();
      const initialState = { ...useGameStore.getState() };

      store.updatePeriods("non-existent", "player-1", Stat.TwoPointMakes, 0, Team.Us);

      expect(useGameStore.getState()).toEqual(initialState);
    });

    it("should undo last event correctly", () => {
      const store = useGameStore.getState();

      // Add some events
      store.updatePeriods("test-game-id", "player-1", Stat.TwoPointMakes, 0, Team.Us);
      store.updatePeriods("test-game-id", "player-2", Stat.ThreePointMakes, 0, Team.Us);

      // Undo last event (three pointer)
      store.undoLastEvent("test-game-id", 0);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.periods[0][Team.Us]).toBe(2); // Should only have 2 points from first event
      expect(game.periods[0].playByPlay).toHaveLength(1);
      expect(game.periods[0].playByPlay[0].playerId).toBe("player-1");
    });

    it("should undo opponent events correctly", () => {
      const store = useGameStore.getState();

      store.updatePeriods("test-game-id", "Opponent", Stat.TwoPointMakes, 0, Team.Opponent);
      store.undoLastEvent("test-game-id", 0);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.periods[0][Team.Opponent]).toBe(0);
      expect(game.periods[0].playByPlay).toHaveLength(0);
    });

    it("should handle undo with free throws", () => {
      const store = useGameStore.getState();

      store.updatePeriods("test-game-id", "player-1", Stat.FreeThrowsMade, 0, Team.Us);
      store.undoLastEvent("test-game-id", 0);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.periods[0][Team.Us]).toBe(0);
    });

    it("should warn when undoing from non-existent game", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = useGameStore.getState();

      store.undoLastEvent("non-existent", 0);

      expect(consoleSpy).toHaveBeenCalledWith("Game with ID non-existent not found.");
      consoleSpy.mockRestore();
    });

    it("should warn when undoing from empty period", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = useGameStore.getState();

      store.undoLastEvent("test-game-id", 0);

      expect(consoleSpy).toHaveBeenCalledWith("No play-by-play events to undo for period 0.");
      consoleSpy.mockRestore();
    });

    it("should reset period correctly", () => {
      const store = useGameStore.getState();

      // Add some events to the period
      store.updatePeriods("test-game-id", "player-1", Stat.TwoPointMakes, 0, Team.Us);
      store.updatePeriods("test-game-id", "player-2", Stat.ThreePointMakes, 0, Team.Us);

      // Reset the period
      store.resetPeriod("test-game-id", 0);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.periods[0][Team.Us]).toBe(0);
      expect(game.periods[0][Team.Opponent]).toBe(0);
      expect(game.periods[0].playByPlay).toHaveLength(0);
    });

    it("should warn when resetting period for non-existent game", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = useGameStore.getState();

      store.resetPeriod("non-existent", 0);

      expect(consoleSpy).toHaveBeenCalledWith("Game with ID non-existent not found.");
      consoleSpy.mockRestore();
    });

    it("should warn when resetting non-existent period", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = useGameStore.getState();

      store.resetPeriod("test-game-id", 5);

      expect(consoleSpy).toHaveBeenCalledWith("No period found with index 5.");
      consoleSpy.mockRestore();
    });

    it("should remove play from period correctly", () => {
      const store = useGameStore.getState();

      // Add some events
      store.updatePeriods("test-game-id", "player-1", Stat.TwoPointMakes, 0, Team.Us);
      store.updatePeriods("test-game-id", "player-2", Stat.ThreePointMakes, 0, Team.Us);

      // Remove the first play (most recent)
      store.removePlayFromPeriod("test-game-id", 0, 0);

      const game = useGameStore.getState().games["test-game-id"];
      expect(game.periods[0].playByPlay).toHaveLength(1);
      expect(game.periods[0].playByPlay[0].playerId).toBe("player-1");
    });

    it("should handle removing play from non-existent game gracefully", () => {
      const store = useGameStore.getState();

      // Should not throw error
      expect(() => {
        store.removePlayFromPeriod("non-existent", 0, 0);
      }).not.toThrow();
    });

    it("should handle removing play from non-existent period gracefully", () => {
      const store = useGameStore.getState();

      // Should not throw error
      expect(() => {
        store.removePlayFromPeriod("test-game-id", 5, 0);
      }).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should warn when updating stats for non-existent game", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = useGameStore.getState();

      store.updateBoxScore("non-existent", "player-1", Stat.TwoPointMakes, 1);

      expect(consoleSpy).toHaveBeenCalledWith("Game with ID non-existent not found.");
      consoleSpy.mockRestore();
    });

    it("should warn when updating totals for non-existent game", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = useGameStore.getState();

      store.updateTotals("non-existent", Stat.Points, 2, Team.Us);

      expect(consoleSpy).toHaveBeenCalledWith("Game with ID non-existent not found.");
      consoleSpy.mockRestore();
    });

    it("should warn when marking non-existent game as active", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const store = useGameStore.getState();

      store.markGameAsActive("non-existent");

      expect(consoleSpy).toHaveBeenCalledWith("Game with ID non-existent not found.");
      consoleSpy.mockRestore();
    });
  });
});
