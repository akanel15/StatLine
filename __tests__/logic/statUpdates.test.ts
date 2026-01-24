import {
  calculatePlusMinusForTeam,
  getPointsForStat,
  isScoringPlay,
  shouldUpdatePeriods,
  handleStatUpdate,
  handleStatReversal,
  createStatUpdateHandler,
  createStatReversalHandler,
  StatUpdateStoreActions,
  StatUpdateParams,
  StatReversalParams,
} from "@/logic/statUpdates";
import { Stat } from "@/types/stats";
import { Team } from "@/types/game";

describe("Stat Updates Logic", () => {
  describe("calculatePlusMinusForTeam", () => {
    test("should return positive for our team", () => {
      const result = calculatePlusMinusForTeam(Team.Us, 2);
      expect(result).toEqual({
        usAmount: 2,
        opponentAmount: -2,
      });
    });

    test("should return negative for opponent team", () => {
      const result = calculatePlusMinusForTeam(Team.Opponent, 3);
      expect(result).toEqual({
        usAmount: -3,
        opponentAmount: 3,
      });
    });

    test("should handle zero points", () => {
      const result = calculatePlusMinusForTeam(Team.Us, 0);
      expect(result).toEqual({
        usAmount: 0,
        opponentAmount: 0,
      });
    });

    test("should handle negative points", () => {
      const result = calculatePlusMinusForTeam(Team.Us, -2);
      expect(result).toEqual({
        usAmount: -2,
        opponentAmount: 2,
      });
    });
  });

  describe("getPointsForStat", () => {
    test("should return 1 for free throw makes", () => {
      expect(getPointsForStat(Stat.FreeThrowsMade)).toBe(1);
    });

    test("should return 2 for two point makes", () => {
      expect(getPointsForStat(Stat.TwoPointMakes)).toBe(2);
    });

    test("should return 3 for three point makes", () => {
      expect(getPointsForStat(Stat.ThreePointMakes)).toBe(3);
    });

    test("should return 0 for non-scoring stats", () => {
      expect(getPointsForStat(Stat.Assists)).toBe(0);
      expect(getPointsForStat(Stat.DefensiveRebounds)).toBe(0);
      expect(getPointsForStat(Stat.Steals)).toBe(0);
      expect(getPointsForStat(Stat.Blocks)).toBe(0);
    });

    test("should return 0 for shot attempts", () => {
      expect(getPointsForStat(Stat.TwoPointAttempts)).toBe(0);
      expect(getPointsForStat(Stat.ThreePointAttempts)).toBe(0);
      expect(getPointsForStat(Stat.FreeThrowsAttempted)).toBe(0);
    });
  });

  describe("isScoringPlay", () => {
    test("should return true for free throw makes", () => {
      expect(isScoringPlay(Stat.FreeThrowsMade)).toBe(true);
    });

    test("should return true for two point makes", () => {
      expect(isScoringPlay(Stat.TwoPointMakes)).toBe(true);
    });

    test("should return true for three point makes", () => {
      expect(isScoringPlay(Stat.ThreePointMakes)).toBe(true);
    });

    test("should return false for non-scoring stats", () => {
      expect(isScoringPlay(Stat.Assists)).toBe(false);
      expect(isScoringPlay(Stat.DefensiveRebounds)).toBe(false);
      expect(isScoringPlay(Stat.Steals)).toBe(false);
    });

    test("should return false for shot attempts", () => {
      expect(isScoringPlay(Stat.TwoPointAttempts)).toBe(false);
      expect(isScoringPlay(Stat.ThreePointAttempts)).toBe(false);
      expect(isScoringPlay(Stat.FreeThrowsAttempted)).toBe(false);
    });
  });

  describe("shouldUpdatePeriods", () => {
    test("should update periods for shot makes (2 stats)", () => {
      const stats = [Stat.TwoPointMakes, Stat.TwoPointAttempts];
      const result = shouldUpdatePeriods(stats);
      expect(result).toEqual({
        shouldUpdate: true,
        statToRecord: Stat.TwoPointMakes,
      });
    });

    test("should update periods for single action", () => {
      const stats = [Stat.TwoPointAttempts];
      const result = shouldUpdatePeriods(stats);
      expect(result).toEqual({
        shouldUpdate: true,
        statToRecord: Stat.TwoPointAttempts,
      });
    });

    test("should not update periods for empty stats", () => {
      const stats: Stat[] = [];
      const result = shouldUpdatePeriods(stats);
      expect(result).toEqual({
        shouldUpdate: false,
        statToRecord: null,
      });
    });

    test("should not update periods for more than 2 stats", () => {
      const stats = [Stat.TwoPointMakes, Stat.TwoPointAttempts, Stat.Assists];
      const result = shouldUpdatePeriods(stats);
      expect(result).toEqual({
        shouldUpdate: false,
        statToRecord: null,
      });
    });
  });

  describe("handleStatUpdate", () => {
    let mockStores: jest.Mocked<StatUpdateStoreActions>;
    let baseParams: StatUpdateParams;

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

      baseParams = {
        stats: [],
        gameId: "game-1",
        teamId: "team-1",
        playerId: "player-1",
        setId: "set-1",
        selectedPeriod: 0,
        activePlayers: ["player-1", "player-2", "player-3"],
      };
    });

    test("should handle two-point make correctly", () => {
      const params = {
        ...baseParams,
        stats: [Stat.TwoPointMakes, Stat.TwoPointAttempts],
      };

      handleStatUpdate(mockStores, params);

      // Should update periods with the make
      expect(mockStores.updatePeriods).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.TwoPointMakes,
        0,
        Team.Us,
      );

      // Should update each stat (makes and attempts)
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.TwoPointMakes,
        1,
      );
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.TwoPointAttempts,
        1,
      );

      // Should update points (2 points for 2pt make)
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith("game-1", "player-1", Stat.Points, 2);
      expect(mockStores.updateTotals).toHaveBeenCalledWith("game-1", Stat.Points, 2, Team.Us);

      // Should update plus/minus for all active players
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.PlusMinus,
        2,
      );
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-2",
        Stat.PlusMinus,
        2,
      );
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-3",
        Stat.PlusMinus,
        2,
      );
    });

    test("should handle three-point make correctly", () => {
      const params = {
        ...baseParams,
        stats: [Stat.ThreePointMakes, Stat.ThreePointAttempts],
      };

      handleStatUpdate(mockStores, params);

      // Should update periods with the make
      expect(mockStores.updatePeriods).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.ThreePointMakes,
        0,
        Team.Us,
      );

      // Should update points (3 points for 3pt make)
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith("game-1", "player-1", Stat.Points, 3);
      expect(mockStores.updateTotals).toHaveBeenCalledWith("game-1", Stat.Points, 3, Team.Us);

      // Should update plus/minus with 3 points
      expect(mockStores.updatePlayerStats).toHaveBeenCalledWith("player-1", Stat.PlusMinus, 3);
    });

    test("should handle free throw make correctly", () => {
      const params = {
        ...baseParams,
        stats: [Stat.FreeThrowsMade, Stat.FreeThrowsAttempted],
      };

      handleStatUpdate(mockStores, params);

      // Should update points (1 point per FT make)
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith("game-1", "player-1", Stat.Points, 1);
      expect(mockStores.updateTotals).toHaveBeenCalledWith("game-1", Stat.Points, 1, Team.Us);

      // Should update plus/minus with 1 point
      expect(mockStores.updatePlayerStats).toHaveBeenCalledWith("player-1", Stat.PlusMinus, 1);
    });

    test("should handle shot miss correctly", () => {
      const params = {
        ...baseParams,
        stats: [Stat.TwoPointAttempts],
      };

      handleStatUpdate(mockStores, params);

      // Should update periods with the attempt
      expect(mockStores.updatePeriods).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.TwoPointAttempts,
        0,
        Team.Us,
      );

      // Should update the attempt
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.TwoPointAttempts,
        1,
      );

      // Should NOT update points
      expect(mockStores.updateBoxScore).not.toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.Points,
        expect.anything(),
      );

      // Should NOT update plus/minus for misses
      expect(mockStores.updatePlayerStats).not.toHaveBeenCalledWith(
        "player-1",
        Stat.PlusMinus,
        expect.anything(),
      );
    });

    test("should handle opponent scoring", () => {
      const params = {
        ...baseParams,
        playerId: "Opponent",
        stats: [Stat.TwoPointMakes, Stat.TwoPointAttempts],
      };

      handleStatUpdate(mockStores, params);

      // Should use Team.Opponent
      expect(mockStores.updatePeriods).toHaveBeenCalledWith(
        "game-1",
        "Opponent",
        Stat.TwoPointMakes,
        0,
        Team.Opponent,
      );
      expect(mockStores.updateTotals).toHaveBeenCalledWith(
        "game-1",
        Stat.TwoPointMakes,
        1,
        Team.Opponent,
      );

      // Should update plus/minus with negative for opponent scoring
      expect(mockStores.updatePlayerStats).toHaveBeenCalledWith("player-1", Stat.PlusMinus, -2);
      expect(mockStores.updatePlayerStats).toHaveBeenCalledWith("player-2", Stat.PlusMinus, -2);
    });

    test("should handle non-scoring stats", () => {
      const params = {
        ...baseParams,
        stats: [Stat.Assists],
      };

      handleStatUpdate(mockStores, params);

      // Should update the stat
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith("game-1", "player-1", Stat.Assists, 1);
      expect(mockStores.updateTotals).toHaveBeenCalledWith("game-1", Stat.Assists, 1, Team.Us);

      // Should NOT update points
      expect(mockStores.updateBoxScore).not.toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.Points,
        expect.anything(),
      );

      // Should NOT update plus/minus
      expect(mockStores.updatePlayerStats).not.toHaveBeenCalledWith(
        "player-1",
        Stat.PlusMinus,
        expect.anything(),
      );
    });

    test("should update all tracking systems for each stat", () => {
      const params = {
        ...baseParams,
        stats: [Stat.DefensiveRebounds],
      };

      handleStatUpdate(mockStores, params);

      // Should update all 6 tracking systems
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.DefensiveRebounds,
        1,
      );
      expect(mockStores.updateTotals).toHaveBeenCalledWith("game-1", Stat.DefensiveRebounds, 1, Team.Us);
      expect(mockStores.updatePlayerStats).toHaveBeenCalledWith("player-1", Stat.DefensiveRebounds, 1);
      expect(mockStores.updateTeamStats).toHaveBeenCalledWith("team-1", Stat.DefensiveRebounds, 1, Team.Us);
      expect(mockStores.updateSetStats).toHaveBeenCalledWith("set-1", Stat.DefensiveRebounds, 1);
      expect(mockStores.updateGameSetStats).toHaveBeenCalledWith("game-1", "set-1", Stat.DefensiveRebounds, 1);
    });

    test("should handle multiple stats in one update", () => {
      const params = {
        ...baseParams,
        stats: [Stat.DefensiveRebounds, Stat.Steals],
      };

      handleStatUpdate(mockStores, params);

      // Should update both stats
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.DefensiveRebounds,
        1,
      );
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith("game-1", "player-1", Stat.Steals, 1);
    });

    test("should handle different periods", () => {
      const params = {
        ...baseParams,
        stats: [Stat.TwoPointMakes, Stat.TwoPointAttempts],
        selectedPeriod: 2,
      };

      handleStatUpdate(mockStores, params);

      expect(mockStores.updatePeriods).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.TwoPointMakes,
        2,
        Team.Us,
      );
    });
  });

  describe("createStatUpdateHandler", () => {
    test("should create a handler function", () => {
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

      const handler = createStatUpdateHandler(mockStores);

      expect(typeof handler).toBe("function");
    });

    test("should create a handler that calls handleStatUpdate", () => {
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

      const handler = createStatUpdateHandler(mockStores);

      const params: StatUpdateParams = {
        stats: [Stat.Points],
        gameId: "game-1",
        teamId: "team-1",
        playerId: "player-1",
        setId: "set-1",
        selectedPeriod: 0,
        activePlayers: ["player-1"],
      };

      handler(params);

      // Should have called the store methods
      expect(mockStores.updateBoxScore).toHaveBeenCalled();
      expect(mockStores.updateTotals).toHaveBeenCalled();
    });

    test("should create a handler that preserves store references", () => {
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

      const handler1 = createStatUpdateHandler(mockStores);
      const handler2 = createStatUpdateHandler(mockStores);

      const params: StatUpdateParams = {
        stats: [Stat.Assists],
        gameId: "game-1",
        teamId: "team-1",
        playerId: "player-1",
        setId: "set-1",
        selectedPeriod: 0,
        activePlayers: ["player-1"],
      };

      handler1(params);
      handler2(params);

      // Both handlers should use the same store
      expect(mockStores.updateBoxScore).toHaveBeenCalledTimes(2);
    });
  });

  describe("Edge Cases", () => {
    let mockStores: jest.Mocked<StatUpdateStoreActions>;

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
    });

    test("should handle empty stats array", () => {
      const params: StatUpdateParams = {
        stats: [],
        gameId: "game-1",
        teamId: "team-1",
        playerId: "player-1",
        setId: "set-1",
        selectedPeriod: 0,
        activePlayers: ["player-1"],
      };

      handleStatUpdate(mockStores, params);

      // Should not update periods for empty stats
      expect(mockStores.updatePeriods).not.toHaveBeenCalled();

      // Should not update any stats
      expect(mockStores.updateBoxScore).not.toHaveBeenCalled();
    });

    test("should handle empty active players list", () => {
      const params: StatUpdateParams = {
        stats: [Stat.TwoPointMakes, Stat.TwoPointAttempts],
        gameId: "game-1",
        teamId: "team-1",
        playerId: "player-1",
        setId: "set-1",
        selectedPeriod: 0,
        activePlayers: [],
      };

      handleStatUpdate(mockStores, params);

      // Should still update the scorer's stats
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.TwoPointMakes,
        1,
      );

      // Should still update plus/minus for teams even with no active players
      expect(mockStores.updateTeamStats).toHaveBeenCalledWith(
        "team-1",
        Stat.PlusMinus,
        2,
        Team.Us,
      );
    });

    test("should handle empty set ID", () => {
      const params: StatUpdateParams = {
        stats: [Stat.Points],
        gameId: "game-1",
        teamId: "team-1",
        playerId: "player-1",
        setId: "",
        selectedPeriod: 0,
        activePlayers: ["player-1"],
      };

      handleStatUpdate(mockStores, params);

      // Should still call set updates (they should handle empty IDs)
      expect(mockStores.updateSetStats).toHaveBeenCalledWith("", Stat.Points, 1);
      expect(mockStores.updateGameSetStats).toHaveBeenCalledWith("game-1", "", Stat.Points, 1);
    });
  });

  describe("handleStatReversal", () => {
    let mockStores: jest.Mocked<StatUpdateStoreActions>;
    let baseParams: StatReversalParams;

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

      baseParams = {
        play: {
          playerId: "player-1",
          action: Stat.TwoPointMakes,
          activePlayers: ["player-1", "player-2", "player-3"],
          setId: "set-1",
        },
        gameId: "game-1",
        teamId: "team-1",
        currentActivePlayers: ["player-1", "player-2"],
        currentSetId: "set-2",
      };
    });

    test("should reverse two-point make correctly", () => {
      handleStatReversal(mockStores, baseParams);

      // Should reverse makes and attempts (2pt make triggers both)
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.TwoPointMakes,
        -1,
      );
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.TwoPointAttempts,
        -1,
      );

      // Should reverse points
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith("game-1", "player-1", Stat.Points, -2);
      expect(mockStores.updateTotals).toHaveBeenCalledWith("game-1", Stat.Points, -2, Team.Us);

      // Should reverse player stats
      expect(mockStores.updatePlayerStats).toHaveBeenCalledWith("player-1", Stat.Points, -2);

      // Should reverse plus/minus for all active players
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.PlusMinus,
        -2,
      );
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-2",
        Stat.PlusMinus,
        -2,
      );
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-3",
        Stat.PlusMinus,
        -2,
      );
    });

    test("should reverse three-point make correctly", () => {
      const params = {
        ...baseParams,
        play: {
          ...baseParams.play,
          action: Stat.ThreePointMakes,
        },
      };

      handleStatReversal(mockStores, params);

      // Should reverse points (3 points)
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith("game-1", "player-1", Stat.Points, -3);
      expect(mockStores.updateTotals).toHaveBeenCalledWith("game-1", Stat.Points, -3, Team.Us);

      // Should reverse plus/minus with 3 points
      expect(mockStores.updatePlayerStats).toHaveBeenCalledWith("player-1", Stat.PlusMinus, -3);
    });

    test("should reverse free throw make correctly", () => {
      const params = {
        ...baseParams,
        play: {
          ...baseParams.play,
          action: Stat.FreeThrowsMade,
        },
      };

      handleStatReversal(mockStores, params);

      // Should reverse points (1 point)
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith("game-1", "player-1", Stat.Points, -1);
      expect(mockStores.updateTotals).toHaveBeenCalledWith("game-1", Stat.Points, -1, Team.Us);

      // Should reverse plus/minus with 1 point
      expect(mockStores.updatePlayerStats).toHaveBeenCalledWith("player-1", Stat.PlusMinus, -1);
    });

    test("should reverse shot miss correctly (no points or plus/minus)", () => {
      const params = {
        ...baseParams,
        play: {
          ...baseParams.play,
          action: Stat.TwoPointAttempts, // Miss
        },
      };

      handleStatReversal(mockStores, params);

      // Should reverse the attempt
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.TwoPointAttempts,
        -1,
      );

      // Should NOT reverse points (misses don't score)
      expect(mockStores.updateBoxScore).not.toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.Points,
        expect.anything(),
      );

      // Should NOT reverse plus/minus (misses don't affect plus/minus)
      expect(mockStores.updatePlayerStats).not.toHaveBeenCalledWith(
        "player-1",
        Stat.PlusMinus,
        expect.anything(),
      );
    });

    test("should reverse opponent scoring correctly", () => {
      const params = {
        ...baseParams,
        play: {
          ...baseParams.play,
          playerId: "Opponent",
        },
      };

      handleStatReversal(mockStores, params);

      // Should use Team.Opponent
      expect(mockStores.updateTotals).toHaveBeenCalledWith(
        "game-1",
        Stat.TwoPointMakes,
        -1,
        Team.Opponent,
      );
      expect(mockStores.updateTotals).toHaveBeenCalledWith(
        "game-1",
        Stat.Points,
        -2,
        Team.Opponent,
      );

      // Should NOT update player stats for opponent
      expect(mockStores.updatePlayerStats).not.toHaveBeenCalledWith(
        "Opponent",
        Stat.TwoPointMakes,
        expect.anything(),
      );

      // Should reverse plus/minus with positive amount for our players (opponent scoring reversed)
      expect(mockStores.updatePlayerStats).toHaveBeenCalledWith("player-1", Stat.PlusMinus, 2);
      expect(mockStores.updatePlayerStats).toHaveBeenCalledWith("player-2", Stat.PlusMinus, 2);
    });

    test("should use stored activePlayers from play over current", () => {
      const params = {
        ...baseParams,
        play: {
          ...baseParams.play,
          activePlayers: ["player-a", "player-b"], // Different from currentActivePlayers
        },
      };

      handleStatReversal(mockStores, params);

      // Should use the stored activePlayers from the play
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-a",
        Stat.PlusMinus,
        -2,
      );
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-b",
        Stat.PlusMinus,
        -2,
      );

      // Should NOT use currentActivePlayers
      expect(mockStores.updateBoxScore).not.toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.PlusMinus,
        expect.anything(),
      );
    });

    test("should fall back to currentActivePlayers when play has no stored activePlayers", () => {
      const params = {
        ...baseParams,
        play: {
          playerId: "player-1",
          action: Stat.TwoPointMakes,
          // No activePlayers stored
        },
      };

      handleStatReversal(mockStores, params);

      // Should use currentActivePlayers as fallback
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.PlusMinus,
        -2,
      );
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-2",
        Stat.PlusMinus,
        -2,
      );
    });

    test("should use stored setId from play over current", () => {
      const params = {
        ...baseParams,
        play: {
          ...baseParams.play,
          setId: "set-stored", // Different from currentSetId
        },
      };

      handleStatReversal(mockStores, params);

      // Should use the stored setId
      expect(mockStores.updateSetStats).toHaveBeenCalledWith("set-stored", Stat.TwoPointMakes, -1);
      expect(mockStores.updateGameSetStats).toHaveBeenCalledWith(
        "game-1",
        "set-stored",
        Stat.TwoPointMakes,
        -1,
      );
    });

    test("should reverse non-scoring stats correctly", () => {
      const params = {
        ...baseParams,
        play: {
          ...baseParams.play,
          action: Stat.DefensiveRebounds,
        },
      };

      handleStatReversal(mockStores, params);

      // Should reverse the stat
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.DefensiveRebounds,
        -1,
      );
      expect(mockStores.updateTotals).toHaveBeenCalledWith(
        "game-1",
        Stat.DefensiveRebounds,
        -1,
        Team.Us,
      );
      expect(mockStores.updatePlayerStats).toHaveBeenCalledWith(
        "player-1",
        Stat.DefensiveRebounds,
        -1,
      );
      expect(mockStores.updateSetStats).toHaveBeenCalledWith("set-1", Stat.DefensiveRebounds, -1);

      // Should NOT update points or plus/minus
      expect(mockStores.updateBoxScore).not.toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.Points,
        expect.anything(),
      );
    });

    test("should reverse team plus/minus for both teams on scoring play", () => {
      handleStatReversal(mockStores, baseParams);

      // Should reverse plus/minus for both teams
      expect(mockStores.updateTeamStats).toHaveBeenCalledWith(
        "team-1",
        Stat.PlusMinus,
        -2,
        Team.Us,
      );
      expect(mockStores.updateTeamStats).toHaveBeenCalledWith(
        "team-1",
        Stat.PlusMinus,
        2,
        Team.Opponent,
      );

      // Should also update game totals for plus/minus
      expect(mockStores.updateTotals).toHaveBeenCalledWith("game-1", Stat.PlusMinus, -2, Team.Us);
      expect(mockStores.updateTotals).toHaveBeenCalledWith(
        "game-1",
        Stat.PlusMinus,
        2,
        Team.Opponent,
      );
    });
  });

  describe("createStatReversalHandler", () => {
    test("should create a handler function", () => {
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

      const handler = createStatReversalHandler(mockStores);

      expect(typeof handler).toBe("function");
    });

    test("should create a handler that calls handleStatReversal", () => {
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

      const handler = createStatReversalHandler(mockStores);

      const params: StatReversalParams = {
        play: {
          playerId: "player-1",
          action: Stat.TwoPointMakes,
        },
        gameId: "game-1",
        teamId: "team-1",
        currentActivePlayers: ["player-1"],
        currentSetId: "set-1",
      };

      handler(params);

      // Should have called the store methods with negative amounts
      expect(mockStores.updateBoxScore).toHaveBeenCalledWith(
        "game-1",
        "player-1",
        Stat.TwoPointMakes,
        -1,
      );
    });
  });
});
