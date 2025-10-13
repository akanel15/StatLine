import {
  getTeamDeletionInfo,
  getPlayerDeletionInfo,
  getSetDeletionInfo,
  cascadeDeleteTeam,
  cascadeDeletePlayer,
  cascadeDeleteSet,
  cascadeDeleteGame,
} from "../../utils/cascadeDelete";
import { useGameStore } from "../../store/gameStore";
import { usePlayerStore } from "../../store/playerStore";
import { useSetStore } from "../../store/setStore";
import { useTeamStore } from "../../store/teamStore";
import { GameType } from "../../types/game";
import { PlayerType } from "../../types/player";
import { SetType } from "../../types/set";
import { TeamType } from "../../types/team";
import { Stat, initialBaseStats } from "../../types/stats";
import { PeriodType, Team } from "../../types/game";

// Mock the stores
jest.mock("../../store/gameStore");
jest.mock("../../store/playerStore");
jest.mock("../../store/setStore");
jest.mock("../../store/teamStore");

describe("cascadeDelete", () => {
  // Helper function to create complete mock game
  const createMockGame = (overrides: Partial<GameType> = {}): GameType => ({
    id: "game-1",
    teamId: "team-1",
    opposingTeamName: "Opponents",
    activePlayers: [],
    activeSets: [],
    gamePlayedList: [],
    periodType: PeriodType.Quarters,
    statTotals: {
      [Team.Us]: { ...initialBaseStats },
      [Team.Opponent]: { ...initialBaseStats },
    },
    boxScore: {},
    sets: {},
    periods: [],
    isFinished: false,
    ...overrides,
  });

  // Mock store instances
  const mockGameStore = {
    games: {} as Record<string, GameType>,
    removeGame: jest.fn(),
    setActivePlayers: jest.fn(),
    setActiveSets: jest.fn(),
  };

  const mockPlayerStore = {
    players: {} as Record<string, PlayerType>,
    removePlayer: jest.fn(),
    revertGameNumbers: jest.fn(),
    updateStats: jest.fn(),
  };

  const mockSetStore = {
    sets: {} as Record<string, SetType>,
    removeSet: jest.fn(),
    updateStats: jest.fn(),
    decrementRunCount: jest.fn(),
  };

  const mockTeamStore = {
    teams: {} as Record<string, TeamType>,
    removeTeam: jest.fn(),
    revertGameNumbers: jest.fn(),
    updateStats: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock store data
    mockGameStore.games = {};
    mockPlayerStore.players = {};
    mockSetStore.sets = {};
    mockTeamStore.teams = {};

    // Mock store getState methods
    (useGameStore.getState as jest.Mock).mockReturnValue(mockGameStore);
    (usePlayerStore.getState as jest.Mock).mockReturnValue(mockPlayerStore);
    (useSetStore.getState as jest.Mock).mockReturnValue(mockSetStore);
    (useTeamStore.getState as jest.Mock).mockReturnValue(mockTeamStore);
  });

  describe("getTeamDeletionInfo", () => {
    it("should return empty arrays when team has no associated data", () => {
      const result = getTeamDeletionInfo("team-1");

      expect(result).toEqual({
        games: [],
        players: [],
        sets: [],
      });
    });

    it("should return all associated games, players, and sets for a team", () => {
      const teamId = "team-1";

      // Mock data
      mockGameStore.games = {
        "game-1": {
          id: "game-1",
          teamId,
          opposingTeamName: "Opponents",
        } as GameType,
        "game-2": {
          id: "game-2",
          teamId: "other-team",
          opposingTeamName: "Other Opponents",
        } as GameType,
      };

      mockPlayerStore.players = {
        "player-1": {
          id: "player-1",
          teamId,
          name: "Player 1",
        } as PlayerType,
        "player-2": {
          id: "player-2",
          teamId: "other-team",
          name: "Player 2",
        } as PlayerType,
      };

      mockSetStore.sets = {
        "set-1": {
          id: "set-1",
          teamId,
          name: "Set 1",
        } as SetType,
        "set-2": {
          id: "set-2",
          teamId: "other-team",
          name: "Set 2",
        } as SetType,
      };

      const result = getTeamDeletionInfo(teamId);

      expect(result).toEqual({
        games: [{ id: "game-1", name: "vs Opponents" }],
        players: [{ id: "player-1", name: "Player 1" }],
        sets: [{ id: "set-1", name: "Set 1" }],
      });
    });
  });

  describe("getPlayerDeletionInfo", () => {
    it("should return empty arrays when player has no associated games", () => {
      const result = getPlayerDeletionInfo("player-1");

      expect(result).toEqual({
        games: [],
        players: [],
        sets: [],
      });
    });

    it("should return games where player appears in boxScore", () => {
      const playerId = "player-1";

      mockGameStore.games = {
        "game-1": createMockGame({
          id: "game-1",
          opposingTeamName: "Team A",
          boxScore: {
            [playerId]: { ...initialBaseStats, [Stat.Points]: 10 },
          },
        }),
        "game-2": createMockGame({
          id: "game-2",
          opposingTeamName: "Team B",
          boxScore: {},
        }),
      };

      const result = getPlayerDeletionInfo(playerId);

      expect(result).toEqual({
        games: [{ id: "game-1", name: "vs Team A" }],
        players: [],
        sets: [],
      });
    });

    it("should return games where player appears in activePlayers", () => {
      const playerId = "player-1";

      mockGameStore.games = {
        "game-1": createMockGame({
          id: "game-1",
          opposingTeamName: "Team A",
          activePlayers: [playerId],
        }),
      };

      const result = getPlayerDeletionInfo(playerId);

      expect(result).toEqual({
        games: [{ id: "game-1", name: "vs Team A" }],
        players: [],
        sets: [],
      });
    });

    it("should return games where player appears in gamePlayedList", () => {
      const playerId = "player-1";

      mockGameStore.games = {
        "game-1": createMockGame({
          id: "game-1",
          opposingTeamName: "Team A",
          gamePlayedList: [playerId],
        }),
      };

      const result = getPlayerDeletionInfo(playerId);

      expect(result).toEqual({
        games: [{ id: "game-1", name: "vs Team A" }],
        players: [],
        sets: [],
      });
    });
  });

  describe("getSetDeletionInfo", () => {
    it("should return empty arrays when set has no associated games", () => {
      const result = getSetDeletionInfo("set-1");

      expect(result).toEqual({
        games: [],
        players: [],
        sets: [],
      });
    });

    it("should return games where set appears in sets object", () => {
      const setId = "set-1";

      mockGameStore.games = {
        "game-1": createMockGame({
          id: "game-1",
          opposingTeamName: "Team A",
          sets: {
            [setId]: {
              id: setId,
              name: "Test Set",
              teamId: "team-1",
              runCount: 5,
              stats: { ...initialBaseStats, [Stat.Points]: 5 },
            },
          },
        }),
        "game-2": createMockGame({
          id: "game-2",
          opposingTeamName: "Team B",
        }),
      };

      const result = getSetDeletionInfo(setId);

      expect(result).toEqual({
        games: [{ id: "game-1", name: "vs Team A" }],
        players: [],
        sets: [],
      });
    });

    it("should return games where set appears in activeSets", () => {
      const setId = "set-1";

      mockGameStore.games = {
        "game-1": createMockGame({
          id: "game-1",
          opposingTeamName: "Team A",
          activeSets: [setId],
        }),
      };

      const result = getSetDeletionInfo(setId);

      expect(result).toEqual({
        games: [{ id: "game-1", name: "vs Team A" }],
        players: [],
        sets: [],
      });
    });
  });

  describe("cascadeDeleteTeam", () => {
    it("should delete all associated games, players, sets, and the team", () => {
      const teamId = "team-1";

      // Set up mock data
      mockGameStore.games = {
        "game-1": { id: "game-1", teamId } as GameType,
        "game-2": { id: "game-2", teamId: "other-team" } as GameType,
      };

      mockPlayerStore.players = {
        "player-1": { id: "player-1", teamId } as PlayerType,
      };

      mockSetStore.sets = {
        "set-1": { id: "set-1", teamId } as SetType,
      };

      cascadeDeleteTeam(teamId);

      expect(mockGameStore.removeGame).toHaveBeenCalledWith("game-1");
      expect(mockPlayerStore.removePlayer).toHaveBeenCalledWith("player-1");
      expect(mockSetStore.removeSet).toHaveBeenCalledWith("set-1");
      expect(mockTeamStore.removeTeam).toHaveBeenCalledWith(teamId);

      // Should not delete items from other teams
      expect(mockGameStore.removeGame).not.toHaveBeenCalledWith("game-2");
    });
  });

  describe("cascadeDeletePlayer", () => {
    it("should remove player from games and delete the player", () => {
      const playerId = "player-1";
      const gameId = "game-1";

      const mockGame = createMockGame({
        id: gameId,
        activePlayers: [playerId, "player-2"],
        gamePlayedList: [playerId],
      });

      mockGameStore.games = {
        [gameId]: mockGame,
      };

      const mockSetActivePlayers = jest.fn();
      mockGameStore.setActivePlayers = mockSetActivePlayers;

      cascadeDeletePlayer(playerId);

      expect(mockSetActivePlayers).toHaveBeenCalledWith(gameId, ["player-2"]);
      expect(mockPlayerStore.removePlayer).toHaveBeenCalledWith(playerId);
    });

    it("should handle player not in any games", () => {
      const playerId = "player-1";

      cascadeDeletePlayer(playerId);

      expect(mockPlayerStore.removePlayer).toHaveBeenCalledWith(playerId);
    });
  });

  describe("cascadeDeleteSet", () => {
    it("should remove set from games and delete the set", () => {
      const setId = "set-1";
      const gameId = "game-1";

      const mockGame = createMockGame({
        id: gameId,
        activeSets: [setId, "set-2"],
      });

      mockGameStore.games = {
        [gameId]: mockGame,
      };

      const mockSetActiveSets = jest.fn();
      mockGameStore.setActiveSets = mockSetActiveSets;

      cascadeDeleteSet(setId);

      expect(mockSetActiveSets).toHaveBeenCalledWith(gameId, ["set-2"]);
      expect(mockSetStore.removeSet).toHaveBeenCalledWith(setId);
    });

    it("should handle set not in any games", () => {
      const setId = "set-1";

      cascadeDeleteSet(setId);

      expect(mockSetStore.removeSet).toHaveBeenCalledWith(setId);
    });
  });

  describe("cascadeDeleteGame", () => {
    it("should delete the game", () => {
      const gameId = "game-1";

      // Set up mock game data
      const mockGame = createMockGame({ id: gameId });
      mockGameStore.games = {
        [gameId]: mockGame,
      };

      cascadeDeleteGame(gameId);

      expect(mockGameStore.removeGame).toHaveBeenCalledWith(gameId);
    });

    it("should revert team stats when deleting finished game", () => {
      const gameId = "game-1";
      const teamId = "team-1";

      // Create mock team with existing stats
      const mockTeam = {
        id: teamId,
        name: "Test Team",
        gameNumbers: { wins: 2, losses: 1, draws: 0, gamesPlayed: 3 },
        stats: {
          [Team.Us]: {
            ...initialBaseStats,
            [Stat.Points]: 252, // 3 games: 92 + 80 + 80
            [Stat.Assists]: 60,
            [Stat.DefensiveRebounds]: 90,
          },
          [Team.Opponent]: {
            ...initialBaseStats,
            [Stat.Points]: 210,
            [Stat.Assists]: 45,
          },
        },
      } as TeamType;

      mockTeamStore.teams = { [teamId]: mockTeam };

      // Create finished game with stats
      const mockGame = createMockGame({
        id: gameId,
        teamId,
        isFinished: true,
        statTotals: {
          [Team.Us]: {
            ...initialBaseStats,
            [Stat.Points]: 80, // This game's stats
            [Stat.Assists]: 20,
            [Stat.DefensiveRebounds]: 30,
          },
          [Team.Opponent]: {
            ...initialBaseStats,
            [Stat.Points]: 70,
            [Stat.Assists]: 15,
          },
        },
        gamePlayedList: ["player-1", "player-2"],
      });

      mockGameStore.games = { [gameId]: mockGame };

      // Mock the store methods
      const mockRevertGameNumbers = jest.fn();
      const mockUpdateTeamStats = jest.fn();
      mockTeamStore.revertGameNumbers = mockRevertGameNumbers;
      mockTeamStore.updateStats = mockUpdateTeamStats;

      const mockRevertPlayerGameNumbers = jest.fn();
      mockPlayerStore.revertGameNumbers = mockRevertPlayerGameNumbers;
      mockPlayerStore.players = {
        "player-1": { id: "player-1" } as PlayerType,
        "player-2": { id: "player-2" } as PlayerType,
      };

      cascadeDeleteGame(gameId);

      // Verify team stats are reverted (negative amounts)
      expect(mockUpdateTeamStats).toHaveBeenCalledWith(teamId, Stat.Points, -80, Team.Us);
      expect(mockUpdateTeamStats).toHaveBeenCalledWith(teamId, Stat.Assists, -20, Team.Us);
      expect(mockUpdateTeamStats).toHaveBeenCalledWith(
        teamId,
        Stat.DefensiveRebounds,
        -30,
        Team.Us,
      );

      expect(mockUpdateTeamStats).toHaveBeenCalledWith(teamId, Stat.Points, -70, Team.Opponent);
      expect(mockUpdateTeamStats).toHaveBeenCalledWith(teamId, Stat.Assists, -15, Team.Opponent);

      // Verify game numbers still reverted
      expect(mockRevertGameNumbers).toHaveBeenCalled();
      expect(mockRevertPlayerGameNumbers).toHaveBeenCalledTimes(2);
    });

    it("should revert individual player box score stats when deleting finished game", () => {
      const gameId = "game-1";
      const teamId = "team-1";

      // Create players with stats
      const player1 = {
        id: "player-1",
        name: "Player 1",
        teamId,
        stats: {
          ...initialBaseStats,
          [Stat.Points]: 45, // Total across all games
          [Stat.Assists]: 12,
          [Stat.DefensiveRebounds]: 20,
        },
        gameNumbers: { wins: 2, losses: 0, draws: 0, gamesPlayed: 2 },
      } as PlayerType;

      const player2 = {
        id: "player-2",
        name: "Player 2",
        teamId,
        stats: {
          ...initialBaseStats,
          [Stat.Points]: 30,
          [Stat.ThreePointMakes]: 5,
        },
        gameNumbers: { wins: 2, losses: 0, draws: 0, gamesPlayed: 2 },
      } as PlayerType;

      mockPlayerStore.players = {
        "player-1": player1,
        "player-2": player2,
      };

      // Create game with box scores
      const mockGame = createMockGame({
        id: gameId,
        teamId,
        isFinished: true,
        statTotals: {
          [Team.Us]: { ...initialBaseStats, [Stat.Points]: 50 },
          [Team.Opponent]: { ...initialBaseStats, [Stat.Points]: 45 },
        },
        boxScore: {
          "player-1": {
            ...initialBaseStats,
            [Stat.Points]: 20, // This game's stats for player 1
            [Stat.Assists]: 5,
            [Stat.DefensiveRebounds]: 8,
          },
          "player-2": {
            ...initialBaseStats,
            [Stat.Points]: 15, // This game's stats for player 2
            [Stat.ThreePointMakes]: 2,
          },
        },
        gamePlayedList: ["player-1", "player-2"],
      });

      mockGameStore.games = { [gameId]: mockGame };
      mockTeamStore.teams = { [teamId]: { id: teamId } as TeamType };

      const mockUpdatePlayerStats = jest.fn();
      mockPlayerStore.updateStats = mockUpdatePlayerStats;
      mockPlayerStore.revertGameNumbers = jest.fn();
      mockTeamStore.revertGameNumbers = jest.fn();
      mockTeamStore.updateStats = jest.fn();

      cascadeDeleteGame(gameId);

      // Verify player 1 stats reverted
      expect(mockUpdatePlayerStats).toHaveBeenCalledWith("player-1", Stat.Points, -20);
      expect(mockUpdatePlayerStats).toHaveBeenCalledWith("player-1", Stat.Assists, -5);
      expect(mockUpdatePlayerStats).toHaveBeenCalledWith("player-1", Stat.DefensiveRebounds, -8);

      // Verify player 2 stats reverted
      expect(mockUpdatePlayerStats).toHaveBeenCalledWith("player-2", Stat.Points, -15);
      expect(mockUpdatePlayerStats).toHaveBeenCalledWith("player-2", Stat.ThreePointMakes, -2);
    });

    it("should revert set stats and run counts when deleting game", () => {
      const gameId = "game-1";
      const teamId = "team-1";
      const set1Id = "set-1";
      const set2Id = "set-2";

      // Create sets with stats
      mockSetStore.sets = {
        [set1Id]: {
          id: set1Id,
          name: "Starting 5",
          teamId,
          runCount: 10, // Total runs across all games
          stats: {
            ...initialBaseStats,
            [Stat.Points]: 120,
            [Stat.Assists]: 30,
          },
        } as SetType,
        [set2Id]: {
          id: set2Id,
          name: "Bench",
          teamId,
          runCount: 5,
          stats: {
            ...initialBaseStats,
            [Stat.Points]: 40,
          },
        } as SetType,
      };

      // Create game with set stats
      const mockGame = createMockGame({
        id: gameId,
        teamId,
        isFinished: true,
        statTotals: {
          [Team.Us]: { ...initialBaseStats },
          [Team.Opponent]: { ...initialBaseStats },
        },
        sets: {
          [set1Id]: {
            id: set1Id,
            name: "Starting 5",
            teamId,
            runCount: 5, // Runs in this game
            stats: {
              ...initialBaseStats,
              [Stat.Points]: 40, // Stats in this game
              [Stat.Assists]: 10,
            },
          },
          [set2Id]: {
            id: set2Id,
            name: "Bench",
            teamId,
            runCount: 2,
            stats: {
              ...initialBaseStats,
              [Stat.Points]: 15,
            },
          },
        },
        gamePlayedList: [],
      });

      mockGameStore.games = { [gameId]: mockGame };
      mockTeamStore.teams = { [teamId]: { id: teamId } as TeamType };

      const mockUpdateSetStats = jest.fn();
      const mockDecrementRunCount = jest.fn();
      mockSetStore.updateStats = mockUpdateSetStats;
      mockSetStore.decrementRunCount = mockDecrementRunCount;
      mockTeamStore.revertGameNumbers = jest.fn();
      mockTeamStore.updateStats = jest.fn();

      cascadeDeleteGame(gameId);

      // Verify set 1 stats reverted
      expect(mockUpdateSetStats).toHaveBeenCalledWith(set1Id, Stat.Points, -40);
      expect(mockUpdateSetStats).toHaveBeenCalledWith(set1Id, Stat.Assists, -10);
      expect(mockDecrementRunCount).toHaveBeenCalledWith(set1Id);

      // Verify set 2 stats reverted
      expect(mockUpdateSetStats).toHaveBeenCalledWith(set2Id, Stat.Points, -15);
      expect(mockDecrementRunCount).toHaveBeenCalledWith(set2Id);
    });

    it("should not revert stats for unfinished games", () => {
      const gameId = "game-1";
      const teamId = "team-1";

      const mockGame = createMockGame({
        id: gameId,
        teamId,
        isFinished: false, // Not finished
        statTotals: {
          [Team.Us]: { ...initialBaseStats, [Stat.Points]: 80 },
          [Team.Opponent]: { ...initialBaseStats, [Stat.Points]: 70 },
        },
        boxScore: {
          "player-1": { ...initialBaseStats, [Stat.Points]: 20 },
        },
        gamePlayedList: ["player-1"],
      });

      mockGameStore.games = { [gameId]: mockGame };
      mockTeamStore.teams = { [teamId]: { id: teamId } as TeamType };
      mockPlayerStore.players = { "player-1": { id: "player-1" } as PlayerType };

      const mockUpdateTeamStats = jest.fn();
      const mockUpdatePlayerStats = jest.fn();
      mockTeamStore.updateStats = mockUpdateTeamStats;
      mockPlayerStore.updateStats = mockUpdatePlayerStats;
      mockTeamStore.revertGameNumbers = jest.fn();
      mockPlayerStore.revertGameNumbers = jest.fn();

      cascadeDeleteGame(gameId);

      // Stats should NOT be reverted for unfinished games
      expect(mockUpdateTeamStats).not.toHaveBeenCalled();
      expect(mockUpdatePlayerStats).not.toHaveBeenCalled();

      // Game numbers should also NOT be reverted
      expect(mockTeamStore.revertGameNumbers).not.toHaveBeenCalled();
      expect(mockPlayerStore.revertGameNumbers).not.toHaveBeenCalled();
    });

    it("should handle games with no stats gracefully", () => {
      const gameId = "game-1";
      const teamId = "team-1";

      const mockGame = createMockGame({
        id: gameId,
        teamId,
        isFinished: true,
        statTotals: {
          [Team.Us]: { ...initialBaseStats }, // All zeros
          [Team.Opponent]: { ...initialBaseStats },
        },
        boxScore: {}, // No players
        sets: {}, // No sets
        gamePlayedList: [],
      });

      mockGameStore.games = { [gameId]: mockGame };
      mockTeamStore.teams = { [teamId]: { id: teamId } as TeamType };
      mockTeamStore.revertGameNumbers = jest.fn();
      mockTeamStore.updateStats = jest.fn();

      // Should not throw error
      expect(() => cascadeDeleteGame(gameId)).not.toThrow();
      expect(mockGameStore.removeGame).toHaveBeenCalledWith(gameId);
    });
  });
});
