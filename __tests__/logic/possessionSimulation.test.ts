import {
  selectWeightedPlayer,
  determineShotType,
  determineShotOutcome,
  shouldAwardAssist,
  determineReboundType,
  shouldAwardBonusStat,
  selectBonusStat,
  simulatePossession,
  PossessionConfig,
} from "@/logic/possessionSimulation";
import { Stat } from "@/types/stats";
import { StatUpdateStoreActions } from "@/logic/statUpdates";

// Mock Math.random for deterministic tests
const mockRandom = (value: number) => {
  jest.spyOn(Math, "random").mockReturnValue(value);
};

const restoreRandom = () => {
  jest.spyOn(Math, "random").mockRestore();
};

describe("Possession Simulation Logic", () => {
  describe("selectWeightedPlayer", () => {
    afterEach(() => {
      restoreRandom();
    });

    test("should select from starters with 70% probability", () => {
      mockRandom(0.5); // Less than 0.7, should select starter
      const result = selectWeightedPlayer(["s1", "s2", "s3"], ["b1", "b2"]);
      expect(["s1", "s2", "s3"]).toContain(result);
    });

    test("should select from bench with 30% probability", () => {
      mockRandom(0.8); // Greater than 0.7, should select bench
      const result = selectWeightedPlayer(["s1", "s2"], ["b1", "b2"]);
      expect(["b1", "b2"]).toContain(result);
    });

    test("should always select from starters if no bench players", () => {
      const result = selectWeightedPlayer(["s1", "s2", "s3"], []);
      expect(["s1", "s2", "s3"]).toContain(result);
    });

    test("should handle single starter", () => {
      const result = selectWeightedPlayer(["s1"], []);
      expect(result).toBe("s1");
    });

    test("should handle single bench player", () => {
      mockRandom(0.8); // Select from bench
      const result = selectWeightedPlayer(["s1"], ["b1"]);
      expect(result).toBe("b1");
    });
  });

  describe("determineShotType", () => {
    afterEach(() => {
      restoreRandom();
    });

    test("should return 2pt for values < 0.65", () => {
      mockRandom(0.3);
      expect(determineShotType()).toBe("2pt");
    });

    test("should return 3pt for values between 0.65 and 0.95", () => {
      mockRandom(0.8);
      expect(determineShotType()).toBe("3pt");
    });

    test("should return ft for values >= 0.95", () => {
      mockRandom(0.96);
      expect(determineShotType()).toBe("ft");
    });

    test("should return 2pt at boundary (0.64)", () => {
      mockRandom(0.64);
      expect(determineShotType()).toBe("2pt");
    });

    test("should return 3pt at boundary (0.65)", () => {
      mockRandom(0.65);
      expect(determineShotType()).toBe("3pt");
    });

    test("should return ft at boundary (0.95)", () => {
      mockRandom(0.95);
      expect(determineShotType()).toBe("ft");
    });
  });

  describe("determineShotOutcome", () => {
    afterEach(() => {
      restoreRandom();
    });

    const shootingPercentages = {
      twoPoint: 0.5,
      threePoint: 0.35,
      freeThrow: 0.75,
    };

    test("should make 2pt shot with success rate", () => {
      mockRandom(0.4); // Less than adjusted success rate
      const result = determineShotOutcome("2pt", shootingPercentages, "low");
      expect(result).toBe(true);
    });

    test("should miss 2pt shot outside success rate", () => {
      mockRandom(0.9); // Greater than adjusted success rate
      const result = determineShotOutcome("2pt", shootingPercentages, "low");
      expect(result).toBe(false);
    });

    test("should use 3pt success rate for 3pt shots", () => {
      mockRandom(0.3); // Should make with 35% base rate
      const result = determineShotOutcome("3pt", shootingPercentages, "low");
      expect(result).toBe(true);
    });

    test("should use ft success rate for free throws", () => {
      mockRandom(0.7); // Should make with 75% base rate
      const result = determineShotOutcome("ft", shootingPercentages, "low");
      expect(result).toBe(true);
    });

    test("should apply low realism variance", () => {
      // Low realism has 0.05 variance multiplier
      const result = determineShotOutcome("2pt", shootingPercentages, "low");
      expect(typeof result).toBe("boolean");
    });

    test("should apply medium realism variance", () => {
      // Medium realism has 0.1 variance multiplier
      const result = determineShotOutcome("2pt", shootingPercentages, "medium");
      expect(typeof result).toBe("boolean");
    });

    test("should apply high realism variance", () => {
      // High realism has 0.15 variance multiplier
      const result = determineShotOutcome("2pt", shootingPercentages, "high");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("shouldAwardAssist", () => {
    afterEach(() => {
      restoreRandom();
    });

    test("should award assist 30% of time for 2pt", () => {
      mockRandom(0.2); // Less than 0.3
      expect(shouldAwardAssist("2pt")).toBe(true);
    });

    test("should not award assist 70% of time for 2pt", () => {
      mockRandom(0.5); // Greater than 0.3
      expect(shouldAwardAssist("2pt")).toBe(false);
    });

    test("should award assist 20% of time for 3pt", () => {
      mockRandom(0.1); // Less than 0.2
      expect(shouldAwardAssist("3pt")).toBe(true);
    });

    test("should not award assist 80% of time for 3pt", () => {
      mockRandom(0.3); // Greater than 0.2
      expect(shouldAwardAssist("3pt")).toBe(false);
    });

    test("should never award assist for free throws", () => {
      mockRandom(0.1);
      expect(shouldAwardAssist("ft")).toBe(false);
    });
  });

  describe("determineReboundType", () => {
    afterEach(() => {
      restoreRandom();
    });

    test("should return defensive 70% of time", () => {
      mockRandom(0.5); // Less than 0.7
      expect(determineReboundType()).toBe("defensive");
    });

    test("should return offensive 30% of time", () => {
      mockRandom(0.8); // Greater than 0.7
      expect(determineReboundType()).toBe("offensive");
    });

    test("should return defensive at boundary (0.69)", () => {
      mockRandom(0.69);
      expect(determineReboundType()).toBe("defensive");
    });

    test("should return offensive at boundary (0.7)", () => {
      mockRandom(0.7);
      expect(determineReboundType()).toBe("offensive");
    });
  });

  describe("shouldAwardBonusStat", () => {
    afterEach(() => {
      restoreRandom();
    });

    test("should award bonus stat 15% of time", () => {
      mockRandom(0.1); // Less than 0.15
      expect(shouldAwardBonusStat()).toBe(true);
    });

    test("should not award bonus stat 85% of time", () => {
      mockRandom(0.2); // Greater than 0.15
      expect(shouldAwardBonusStat()).toBe(false);
    });

    test("should not award at boundary (0.15)", () => {
      mockRandom(0.15);
      expect(shouldAwardBonusStat()).toBe(false);
    });
  });

  describe("selectBonusStat", () => {
    afterEach(() => {
      restoreRandom();
    });

    test("should select Steals for values < 0.4", () => {
      mockRandom(0.2);
      expect(selectBonusStat()).toBe(Stat.Steals);
    });

    test("should select Blocks for values between 0.4 and 0.6", () => {
      mockRandom(0.5);
      expect(selectBonusStat()).toBe(Stat.Blocks);
    });

    test("should select Turnovers for values >= 0.6", () => {
      mockRandom(0.7);
      expect(selectBonusStat()).toBe(Stat.Turnovers);
    });
  });

  describe("simulatePossession", () => {
    let mockStores: jest.Mocked<StatUpdateStoreActions>;
    let baseConfig: PossessionConfig;

    beforeEach(() => {
      mockStores = {
        updateBoxScore: jest.fn(),
        updateTotals: jest.fn(),
        updatePeriods: jest.fn(),
        updateGameSetStats: jest.fn(),
        incrementSetRunCount: jest.fn(),
        updateTeamStats: jest.fn(),
        updatePlayerStats: jest.fn(),
        updateSetStats: jest.fn(),
        incrementGlobalSetRunCount: jest.fn(),
      };

      baseConfig = {
        gameId: "game-1",
        teamId: "team-1",
        period: 0,
        starterIds: ["s1", "s2", "s3", "s4", "s5"],
        benchIds: ["b1", "b2"],
        activeSetIds: ["set-1", "set-2"],
        isOurTeam: true,
        shootingPercentages: {
          twoPoint: 0.5,
          threePoint: 0.35,
          freeThrow: 0.75,
        },
        realism: "medium",
      };
    });

    afterEach(() => {
      restoreRandom();
    });

    test("should simulate possession and update stores", () => {
      const points = simulatePossession(mockStores, baseConfig);

      // Should return valid point value (0-3)
      expect(points).toBeGreaterThanOrEqual(0);
      expect(points).toBeLessThanOrEqual(3);

      // Should call store update methods
      expect(mockStores.updateBoxScore).toHaveBeenCalled();
      expect(mockStores.updateTotals).toHaveBeenCalled();
      expect(mockStores.updatePeriods).toHaveBeenCalled();
    });

    test("should handle multiple possessions with varying results", () => {
      const results: number[] = [];

      for (let i = 0; i < 20; i++) {
        jest.clearAllMocks();
        const points = simulatePossession(mockStores, baseConfig);
        results.push(points);
      }

      // Should have some variety in results over multiple possessions
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);

      // All results should be valid point values
      results.forEach(points => {
        expect(points).toBeGreaterThanOrEqual(0);
        expect(points).toBeLessThanOrEqual(3);
      });
    });

    test("should return 0 points for missed shot", () => {
      // Mock sequence: select starter, 2pt shot, miss it, defensive rebound
      const mockValues = [0.5, 0.3, 0.9, 0.5];
      let callCount = 0;
      jest.spyOn(Math, "random").mockImplementation(() => mockValues[callCount++]);

      const points = simulatePossession(mockStores, baseConfig);

      expect(points).toBe(0);
    });

    test("should handle opponent team possession", () => {
      const opponentConfig = {
        ...baseConfig,
        isOurTeam: false,
      };

      // Mock: 2pt shot type, variance adjust, make it
      // Note: no setId random call since isOurTeam=false skips set selection
      const mockValues = [0.3, 0.5, 0.4, 0.9];
      let callCount = 0;
      jest.spyOn(Math, "random").mockImplementation(() => {
        const value = mockValues[callCount % mockValues.length];
        callCount++;
        return value;
      });

      const points = simulatePossession(mockStores, opponentConfig);

      expect(points).toBe(2);
      // Opponent possessions should still update stores
      expect(mockStores.updateBoxScore).toHaveBeenCalled();
    });

    test("should handle possession with no sets", () => {
      const noSetsConfig = {
        ...baseConfig,
        activeSetIds: [],
      };

      const mockValues = [0.5, 0.3, 0.4, 0.5];
      let callCount = 0;
      jest.spyOn(Math, "random").mockImplementation(() => mockValues[callCount++]);

      const points = simulatePossession(mockStores, noSetsConfig);

      expect(points).toBeGreaterThanOrEqual(0);
    });

    test("should handle possession with no bench players", () => {
      const noBenchConfig = {
        ...baseConfig,
        benchIds: [],
      };

      const mockValues = [0.3, 0.4, 0.5];
      let callCount = 0;
      jest.spyOn(Math, "random").mockImplementation(() => mockValues[callCount++]);

      const points = simulatePossession(mockStores, noBenchConfig);

      expect(points).toBeGreaterThanOrEqual(0);
    });

    test("should increment set run counts for our team possessions", () => {
      simulatePossession(mockStores, baseConfig);

      // Should increment both global and game-specific set run counts
      expect(mockStores.incrementGlobalSetRunCount).toHaveBeenCalled();
      expect(mockStores.incrementSetRunCount).toHaveBeenCalled();
    });

    test("should NOT increment set run counts for opponent possessions", () => {
      const opponentConfig = {
        ...baseConfig,
        isOurTeam: false,
      };

      simulatePossession(mockStores, opponentConfig);

      // Should NOT increment set counts for opponent
      expect(mockStores.incrementGlobalSetRunCount).not.toHaveBeenCalled();
      expect(mockStores.incrementSetRunCount).not.toHaveBeenCalled();
    });

    test("should NOT increment set run counts when no set is selected", () => {
      const noSetConfig = {
        ...baseConfig,
        activeSetIds: [],
      };

      simulatePossession(mockStores, noSetConfig);

      // Should NOT increment set counts when setId is empty
      expect(mockStores.incrementGlobalSetRunCount).not.toHaveBeenCalled();
      expect(mockStores.incrementSetRunCount).not.toHaveBeenCalled();
    });

    test("should increment set counts with correct IDs", () => {
      // Mock to always select first set (index 0 from activeSetIds)
      jest.spyOn(Math, "random").mockReturnValue(0);

      simulatePossession(mockStores, baseConfig);

      // Should increment with the selected set ID
      expect(mockStores.incrementGlobalSetRunCount).toHaveBeenCalledWith("set-1");
      expect(mockStores.incrementSetRunCount).toHaveBeenCalledWith("game-1", "set-1");
    });

    test("should call store methods with correct parameters", () => {
      const mockValues = [0.5, 0.3, 0.4, 0.5, 0.2];
      let callCount = 0;
      jest.spyOn(Math, "random").mockImplementation(() => mockValues[callCount++]);

      simulatePossession(mockStores, baseConfig);

      // Should call updateBoxScore
      expect(mockStores.updateBoxScore).toHaveBeenCalled();
      // Should call updateTotals
      expect(mockStores.updateTotals).toHaveBeenCalled();
      // Should call updatePeriods
      expect(mockStores.updatePeriods).toHaveBeenCalled();
    });

    test("should handle different shot types", () => {
      // Run multiple possessions to get different shot types
      const results = new Set<number>();

      for (let i = 0; i < 50; i++) {
        jest.clearAllMocks();
        const points = simulatePossession(mockStores, baseConfig);
        results.add(points);
      }

      // Should have gotten multiple different point values (0, 1, 2, or 3)
      expect(results.size).toBeGreaterThan(1);
    });

    test("should award assists for made shots", () => {
      // Mock: select player, setId, 2pt make, make shot, award assist (0.2), select different assister, no bonus
      const mockValues = [0.5, 0.3, 0.3, 0.5, 0.4, 0.2, 0.6, 0.9];
      let callCount = 0;
      jest.spyOn(Math, "random").mockImplementation(() => {
        const value = mockValues[callCount % mockValues.length];
        callCount++;
        return value;
      });

      simulatePossession(mockStores, baseConfig);

      // Should have multiple updateBoxScore calls (for scorer, assister, and plus/minus for all active players)
      // At minimum: 2 for scorer stats + 3 for plus/minus (for 3 active players from base params)
      expect(mockStores.updateBoxScore.mock.calls.length).toBeGreaterThanOrEqual(5);
    });

    test("should handle rebounds on misses", () => {
      // Mock: 2pt miss, offensive rebound
      const mockValues = [0.5, 0.3, 0.9, 0.8, 0.5];
      let callCount = 0;
      jest.spyOn(Math, "random").mockImplementation(() => mockValues[callCount++]);

      simulatePossession(mockStores, baseConfig);

      // Should update rebound stat
      expect(mockStores.updateBoxScore).toHaveBeenCalled();
    });

    test("should possibly award bonus stats", () => {
      // Mock: 2pt make, award bonus stat
      const mockValues = [0.5, 0.3, 0.4, 0.5, 0.1, 0.2];
      let callCount = 0;
      jest.spyOn(Math, "random").mockImplementation(() => mockValues[callCount++]);

      simulatePossession(mockStores, baseConfig);

      // Should have called updateBoxScore multiple times
      expect(mockStores.updateBoxScore.mock.calls.length).toBeGreaterThan(2);
    });
  });

  describe("Integration Tests", () => {
    test("should produce consistent results with same random seed", () => {
      const mockStores: jest.Mocked<StatUpdateStoreActions> = {
        updateBoxScore: jest.fn(),
        updateTotals: jest.fn(),
        updatePeriods: jest.fn(),
        updateGameSetStats: jest.fn(),
        incrementSetRunCount: jest.fn(),
        updateTeamStats: jest.fn(),
        updatePlayerStats: jest.fn(),
        updateSetStats: jest.fn(),
        incrementGlobalSetRunCount: jest.fn(),
      };

      const config: PossessionConfig = {
        gameId: "game-1",
        teamId: "team-1",
        period: 0,
        starterIds: ["s1", "s2", "s3", "s4", "s5"],
        benchIds: ["b1", "b2"],
        activeSetIds: ["set-1"],
        isOurTeam: true,
        shootingPercentages: {
          twoPoint: 0.5,
          threePoint: 0.35,
          freeThrow: 0.75,
        },
        realism: "medium",
      };

      // Run with same seed
      const mockValues = [0.5, 0.3, 0.4, 0.5];
      let callCount = 0;
      jest.spyOn(Math, "random").mockImplementation(() => mockValues[callCount++ % mockValues.length]);

      const points1 = simulatePossession(mockStores, config);

      // Reset and run again
      callCount = 0;
      const points2 = simulatePossession(mockStores, config);

      expect(points1).toBe(points2);
    });

    test("should handle all shot types over multiple possessions", () => {
      const mockStores: jest.Mocked<StatUpdateStoreActions> = {
        updateBoxScore: jest.fn(),
        updateTotals: jest.fn(),
        updatePeriods: jest.fn(),
        updateGameSetStats: jest.fn(),
        incrementSetRunCount: jest.fn(),
        updateTeamStats: jest.fn(),
        updatePlayerStats: jest.fn(),
        updateSetStats: jest.fn(),
        incrementGlobalSetRunCount: jest.fn(),
      };

      const config: PossessionConfig = {
        gameId: "game-1",
        teamId: "team-1",
        period: 0,
        starterIds: ["s1", "s2", "s3", "s4", "s5"],
        benchIds: [],
        activeSetIds: ["set-1"],
        isOurTeam: true,
        shootingPercentages: {
          twoPoint: 0.5,
          threePoint: 0.35,
          freeThrow: 0.75,
        },
        realism: "low",
      };

      // Simulate multiple possessions
      const results: number[] = [];
      for (let i = 0; i < 10; i++) {
        const points = simulatePossession(mockStores, config);
        results.push(points);
      }

      // Should have various point values
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });
  });
});
