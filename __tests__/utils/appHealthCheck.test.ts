import { useGameStore } from "@/store/gameStore";
import { useTeamStore } from "@/store/teamStore";
import {
  markAllGamesAsComplete,
  syncGameCounts,
  runAppLoadHealthCheck,
} from "@/utils/appHealthCheck";
import { correctGameCounts } from "@/utils/gameCountAudit";
import { PeriodType } from "@/types/game";

// Mock dependencies
jest.mock("@/utils/gameCountAudit");

describe("appHealthCheck", () => {
  beforeEach(() => {
    // Reset stores
    useGameStore.setState({ games: {} });
    useTeamStore.setState({ teams: {}, currentTeamId: "" });

    // Clear mocks
    jest.clearAllMocks();
  });

  describe("markAllGamesAsComplete", () => {
    it("should mark all unfinished games as complete", async () => {
      // Setup: Add team and games
      const teamId = "team1";
      await useTeamStore.getState().addTeam("Test Team", "basketball");

      const gameId1 = useGameStore.getState().addGame(teamId, "Opponent 1", PeriodType.Quarters);
      const gameId2 = useGameStore.getState().addGame(teamId, "Opponent 2", PeriodType.Quarters);
      const gameId3 = useGameStore.getState().addGame(teamId, "Opponent 3", PeriodType.Quarters);

      // Mark one game as finished manually
      useGameStore.getState().markGameAsFinished(gameId2);

      // Act
      const count = markAllGamesAsComplete();

      // Assert
      expect(count).toBe(2); // Only 2 were unfinished
      const games = useGameStore.getState().games;
      expect(games[gameId1].isFinished).toBe(true);
      expect(games[gameId2].isFinished).toBe(true);
      expect(games[gameId3].isFinished).toBe(true);
    });

    it("should return 0 when all games are already finished", async () => {
      const teamId = "team1";
      await useTeamStore.getState().addTeam("Test Team", "basketball");

      const gameId = useGameStore.getState().addGame(teamId, "Opponent", PeriodType.Quarters);
      useGameStore.getState().markGameAsFinished(gameId);

      const count = markAllGamesAsComplete();

      expect(count).toBe(0);
    });

    it("should return 0 when there are no games", () => {
      const count = markAllGamesAsComplete();
      expect(count).toBe(0);
    });
  });

  describe("syncGameCounts", () => {
    it("should call correctGameCounts and return true on success", () => {
      (correctGameCounts as jest.Mock).mockReturnValue({});

      const result = syncGameCounts();

      expect(result).toBe(true);
      expect(correctGameCounts).toHaveBeenCalledTimes(1);
    });

    it("should return false and log error on failure", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      (correctGameCounts as jest.Mock).mockImplementation(() => {
        throw new Error("Sync failed");
      });

      const result = syncGameCounts();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("runAppLoadHealthCheck", () => {
    it("should execute all health checks and return report", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      (correctGameCounts as jest.Mock).mockReturnValue({});

      await useTeamStore.getState().addTeam("Test Team", "basketball");
      const teams = useTeamStore.getState().teams;
      const teamId = Object.keys(teams)[0];
      useGameStore.getState().addGame(teamId, "Game 1", PeriodType.Quarters);

      const report = await runAppLoadHealthCheck();

      expect(report.gamesMarkedComplete).toBe(1);
      expect(report.gameCountsFixed).toBe(true);
      expect(report.duration).toBeGreaterThanOrEqual(0);
      expect(report.errors).toEqual([]);

      // Verify single log at end
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Health check complete: marked 1 games complete"),
      );

      consoleSpy.mockRestore();
    });

    it("should continue execution even if individual checks fail", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const errorSpy = jest.spyOn(console, "error").mockImplementation();
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();

      // Make sync game counts fail
      (correctGameCounts as jest.Mock).mockImplementation(() => {
        throw new Error("Sync failed");
      });

      const report = await runAppLoadHealthCheck();

      expect(report.gameCountsFixed).toBe(false);
      expect(report.errors.length).toBeGreaterThanOrEqual(1);
      expect(report.errors.some(e => e.includes("Failed to sync game counts"))).toBe(true);

      // Other checks should still run
      expect(report.gamesMarkedComplete).toBeGreaterThanOrEqual(0);

      consoleSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it("should show single log at end when no errors", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      (correctGameCounts as jest.Mock).mockReturnValue({});

      await runAppLoadHealthCheck();

      // Should only have ONE log call
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Health check complete"),
      );

      consoleSpy.mockRestore();
    });
  });
});
