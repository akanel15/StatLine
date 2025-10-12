import {
  calculateGameResult,
  canCompleteGame,
  getGameParticipants,
  prepareGameCompletion,
  executeGameCompletion,
  completeGameManually,
  completeGameAutomatically,
  GameCompletionActions,
} from "@/logic/gameCompletion";
import { GameType, Team, createGame, PeriodType } from "@/types/game";
import { Result } from "@/types/player";
import { Stat } from "@/types/stats";

// Mock console.log to avoid noise in tests
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();

describe("Game Completion Logic", () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  const createMockGame = (
    ourPoints: number = 0,
    opponentPoints: number = 0,
    isFinished: boolean = false,
    participants: string[] = ["player1", "player2"],
  ): GameType => {
    const game = createGame("test-game", "test-team", "Opponent Team", PeriodType.Quarters);

    // Set up score totals
    game.statTotals[Team.Us][Stat.Points] = ourPoints;
    game.statTotals[Team.Opponent][Stat.Points] = opponentPoints;
    game.isFinished = isFinished;
    game.gamePlayedList = participants;

    return game;
  };

  const createMockActions = (mockGame?: GameType): GameCompletionActions => ({
    markGameAsFinished: jest.fn(),
    updateTeamGameNumbers: jest.fn(),
    updatePlayerGameNumbers: jest.fn(),
    getCurrentGame: jest.fn(() => mockGame || createMockGame()),
  });

  describe("calculateGameResult", () => {
    test("should return Win when our team has more points", () => {
      const game = createMockGame(100, 90);
      expect(calculateGameResult(game)).toBe(Result.Win);
    });

    test("should return Loss when opponent has more points", () => {
      const game = createMockGame(85, 95);
      expect(calculateGameResult(game)).toBe(Result.Loss);
    });

    test("should return Draw when points are equal", () => {
      const game = createMockGame(88, 88);
      expect(calculateGameResult(game)).toBe(Result.Draw);
    });

    test("should handle zero scores", () => {
      const game = createMockGame(0, 0);
      expect(calculateGameResult(game)).toBe(Result.Draw);
    });

    test("should handle undefined scores as zero", () => {
      const game = createMockGame();
      game.statTotals[Team.Us][Stat.Points] = undefined as any;
      game.statTotals[Team.Opponent][Stat.Points] = undefined as any;
      expect(calculateGameResult(game)).toBe(Result.Draw);
    });
  });

  describe("canCompleteGame", () => {
    test("should return true for unfinished game", () => {
      const game = createMockGame(100, 90, false);
      expect(canCompleteGame(game)).toBe(true);
    });

    test("should return false for finished game", () => {
      const game = createMockGame(100, 90, true);
      expect(canCompleteGame(game)).toBe(false);
    });
  });

  describe("getGameParticipants", () => {
    test("should return list of participants", () => {
      const participants = ["player1", "player2", "player3"];
      const game = createMockGame(100, 90, false, participants);
      expect(getGameParticipants(game)).toEqual(participants);
    });

    test("should return empty array if no participants", () => {
      const game = createMockGame(100, 90, false, []);
      expect(getGameParticipants(game)).toEqual([]);
    });

    test("should handle undefined gamePlayedList", () => {
      const game = createMockGame();
      game.gamePlayedList = undefined as any;
      expect(getGameParticipants(game)).toEqual([]);
    });
  });

  describe("prepareGameCompletion", () => {
    test("should prepare completion data for winnable game", () => {
      const game = createMockGame(100, 90, false, ["player1", "player2"]);
      const data = prepareGameCompletion(game, "game-id", "team-id");

      expect(data).toEqual({
        gameId: "game-id",
        teamId: "team-id",
        result: Result.Win,
        participants: ["player1", "player2"],
        canComplete: true,
      });
    });

    test("should prepare completion data for finished game", () => {
      const game = createMockGame(100, 90, true, ["player1"]);
      const data = prepareGameCompletion(game, "game-id", "team-id");

      expect(data).toEqual({
        gameId: "game-id",
        teamId: "team-id",
        result: Result.Win,
        participants: ["player1"],
        canComplete: false,
      });
    });
  });

  describe("executeGameCompletion", () => {
    test("should execute completion for valid game", () => {
      const completionData = {
        gameId: "game-id",
        teamId: "team-id",
        result: Result.Win,
        participants: ["player1", "player2"],
        canComplete: true,
      };
      const actions = createMockActions();

      const result = executeGameCompletion(completionData, actions);

      expect(result).toBe(true);
      expect(actions.markGameAsFinished).toHaveBeenCalledTimes(1);
      expect(actions.updateTeamGameNumbers).toHaveBeenCalledWith("team-id", Result.Win);
      expect(actions.updatePlayerGameNumbers).toHaveBeenCalledTimes(2);
      expect(actions.updatePlayerGameNumbers).toHaveBeenCalledWith("player1", Result.Win);
      expect(actions.updatePlayerGameNumbers).toHaveBeenCalledWith("player2", Result.Win);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "GameCompletion: Starting completion - Game:",
        "game-id",
        "Result:",
        Result.Win,
        "Players:",
        2,
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "GameCompletion: Completion successful - Game marked as finished",
      );
    });

    test("should not execute completion for already finished game", () => {
      const completionData = {
        gameId: "game-id",
        teamId: "team-id",
        result: Result.Win,
        participants: ["player1"],
        canComplete: false,
      };
      const finishedGame = createMockGame(100, 90, true, ["player1"]);
      const actions = createMockActions(finishedGame);

      const result = executeGameCompletion(completionData, actions);

      expect(result).toBe(false);
      expect(actions.markGameAsFinished).not.toHaveBeenCalled();
      expect(actions.updateTeamGameNumbers).not.toHaveBeenCalled();
      expect(actions.updatePlayerGameNumbers).not.toHaveBeenCalled();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "GameCompletion: Attempted to complete already finished game:",
        "game-id",
      );
    });

    test("should use custom log prefix", () => {
      const completionData = {
        gameId: "game-id",
        teamId: "team-id",
        result: Result.Loss,
        participants: [],
        canComplete: true,
      };
      const actions = createMockActions();

      executeGameCompletion(completionData, actions, "CUSTOM_PREFIX");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "CUSTOM_PREFIX: Starting completion - Game:",
        "game-id",
        "Result:",
        Result.Loss,
        "Players:",
        0,
      );
    });

    test("should handle empty participants list", () => {
      const completionData = {
        gameId: "game-id",
        teamId: "team-id",
        result: Result.Draw,
        participants: [],
        canComplete: true,
      };
      const actions = createMockActions();

      const result = executeGameCompletion(completionData, actions);

      expect(result).toBe(true);
      expect(actions.updatePlayerGameNumbers).not.toHaveBeenCalled();
      expect(actions.updateTeamGameNumbers).toHaveBeenCalledWith("team-id", Result.Draw);
      expect(actions.markGameAsFinished).toHaveBeenCalledTimes(1);
    });

    test("should prevent race conditions by checking current game state", () => {
      const completionData = {
        gameId: "game-id",
        teamId: "team-id",
        result: Result.Win,
        participants: ["player1"],
        canComplete: true, // This was true when prepared
      };

      // But the current game is now finished (simulating race condition)
      const finishedGame = createMockGame(100, 90, true, ["player1"]);
      const actions = createMockActions(finishedGame);

      const result = executeGameCompletion(completionData, actions);

      expect(result).toBe(false);
      expect(actions.getCurrentGame).toHaveBeenCalled();
      expect(actions.markGameAsFinished).not.toHaveBeenCalled();
      expect(actions.updateTeamGameNumbers).not.toHaveBeenCalled();
      expect(actions.updatePlayerGameNumbers).not.toHaveBeenCalled();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "GameCompletion: Attempted to complete already finished game:",
        "game-id",
      );
    });
  });

  describe("completeGameManually", () => {
    test("should complete game manually with correct logging", () => {
      const game = createMockGame(75, 80, false, ["player1"]);
      const actions = createMockActions();

      const result = completeGameManually(game, "game-id", "team-id", actions);

      expect(result).toBe(true);
      expect(actions.updateTeamGameNumbers).toHaveBeenCalledWith("team-id", Result.Loss);
      expect(actions.updatePlayerGameNumbers).toHaveBeenCalledWith("player1", Result.Loss);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "GameCompletion: MANUAL: Starting completion - Game:",
        "game-id",
        "Result:",
        Result.Loss,
        "Players:",
        1,
      );
    });

    test("should not complete already finished game manually", () => {
      const game = createMockGame(100, 90, true);
      const actions = createMockActions(game);

      const result = completeGameManually(game, "game-id", "team-id", actions);

      expect(result).toBe(false);
      expect(actions.markGameAsFinished).not.toHaveBeenCalled();
    });
  });

  describe("completeGameAutomatically", () => {
    test("should complete game automatically with AppState trigger", () => {
      const game = createMockGame(88, 88, false, ["player1", "player2"]);
      const actions = createMockActions();

      const result = completeGameAutomatically(game, "game-id", "team-id", actions, "AppState");

      expect(result).toBe(true);
      expect(actions.updateTeamGameNumbers).toHaveBeenCalledWith("team-id", Result.Draw);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "GameCompletion: AUTO completion (AppState): Starting completion - Game:",
        "game-id",
        "Result:",
        Result.Draw,
        "Players:",
        2,
      );
    });

    test("should complete game automatically with Navigation trigger", () => {
      const game = createMockGame(95, 85, false, ["player1"]);
      const actions = createMockActions();

      const result = completeGameAutomatically(game, "game-id", "team-id", actions, "Navigation");

      expect(result).toBe(true);
      expect(actions.updateTeamGameNumbers).toHaveBeenCalledWith("team-id", Result.Win);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "GameCompletion: AUTO completion (Navigation): Starting completion - Game:",
        "game-id",
        "Result:",
        Result.Win,
        "Players:",
        1,
      );
    });

    test("should not complete already finished game automatically", () => {
      const game = createMockGame(100, 90, true);
      const actions = createMockActions(game);

      const result = completeGameAutomatically(game, "game-id", "team-id", actions, "AppState");

      expect(result).toBe(false);
      expect(actions.markGameAsFinished).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    test("should handle very high scores", () => {
      const game = createMockGame(999999, 999998);
      expect(calculateGameResult(game)).toBe(Result.Win);
    });

    test("should handle negative scores (edge case)", () => {
      const game = createMockGame(-5, -10);
      expect(calculateGameResult(game)).toBe(Result.Win);
    });

    test("should handle single participant", () => {
      const game = createMockGame(50, 60, false, ["single-player"]);
      const actions = createMockActions();

      const result = completeGameManually(game, "game-id", "team-id", actions);

      expect(result).toBe(true);
      expect(actions.updatePlayerGameNumbers).toHaveBeenCalledTimes(1);
      expect(actions.updatePlayerGameNumbers).toHaveBeenCalledWith("single-player", Result.Loss);
    });

    test("should handle large number of participants", () => {
      const manyPlayers = Array.from({ length: 50 }, (_, i) => `player${i + 1}`);
      const game = createMockGame(100, 95, false, manyPlayers);
      const actions = createMockActions();

      const result = completeGameManually(game, "game-id", "team-id", actions);

      expect(result).toBe(true);
      expect(actions.updatePlayerGameNumbers).toHaveBeenCalledTimes(50);
    });
  });
});
