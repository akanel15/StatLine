import { buildExportPackage } from "@/logic/exportData";
import { GameType, Team, PeriodType, createGame } from "@/types/game";
import { PlayerType, createPlayer } from "@/types/player";
import { Stat, initialBaseStats } from "@/types/stats";

describe("exportData", () => {
  const createMockPlayer = (
    id: string,
    name: string,
    number: string,
    teamId: string = "team-1",
  ): PlayerType => createPlayer(id, name, number, teamId);

  const createMockGame = (
    id: string,
    opposingTeamName: string = "Opponent",
    isFinished: boolean = true,
  ): GameType => {
    const game = createGame(id, "team-1", opposingTeamName, PeriodType.Quarters);
    game.isFinished = isFinished;
    return game;
  };

  describe("buildExportPackage", () => {
    test("should build a valid export package with basic data", () => {
      const players: Record<string, PlayerType> = {
        "p1": createMockPlayer("p1", "John Doe", "23"),
        "p2": createMockPlayer("p2", "Jane Smith", "10"),
      };

      const game = createMockGame("g1", "Rival Team");
      game.boxScore = {
        p1: { ...initialBaseStats, [Stat.Points]: 20 },
        p2: { ...initialBaseStats, [Stat.Points]: 15 },
      };
      game.gamePlayedList = ["p1", "p2"];
      game.activePlayers = ["p1", "p2"];
      game.statTotals[Team.Us][Stat.Points] = 35;
      game.statTotals[Team.Opponent][Stat.Points] = 30;

      const result = buildExportPackage("My Team", [game], players);

      expect(result.version).toBe(1);
      expect(result.exportDate).toBeTruthy();
      expect(result.team.name).toBe("My Team");
      expect(result.players).toHaveLength(2);
      expect(result.games).toHaveLength(1);
      expect(result.games[0].originalId).toBe("g1");
      expect(result.games[0].opposingTeamName).toBe("Rival Team");
    });

    test("should set version to 1 and include export date", () => {
      const result = buildExportPackage("Team", [createMockGame("g1")], {});
      expect(result.version).toBe(1);
      expect(new Date(result.exportDate).getTime()).not.toBeNaN();
    });

    test("should collect player IDs from boxScore keys", () => {
      const players: Record<string, PlayerType> = {
        "p1": createMockPlayer("p1", "Player One", "1"),
      };

      const game = createMockGame("g1");
      game.boxScore = {
        p1: { ...initialBaseStats, [Stat.Points]: 10 },
      };

      const result = buildExportPackage("Team", [game], players);
      expect(result.players).toHaveLength(1);
      expect(result.players[0].originalId).toBe("p1");
      expect(result.players[0].name).toBe("Player One");
    });

    test("should collect player IDs from gamePlayedList", () => {
      const players: Record<string, PlayerType> = {
        "p1": createMockPlayer("p1", "Player One", "1"),
        "p2": createMockPlayer("p2", "Player Two", "2"),
      };

      const game = createMockGame("g1");
      game.gamePlayedList = ["p1", "p2"];

      const result = buildExportPackage("Team", [game], players);
      expect(result.players).toHaveLength(2);
    });

    test("should collect player IDs from activePlayers", () => {
      const players: Record<string, PlayerType> = {
        "p1": createMockPlayer("p1", "Player One", "1"),
      };

      const game = createMockGame("g1");
      game.activePlayers = ["p1"];

      const result = buildExportPackage("Team", [game], players);
      expect(result.players).toHaveLength(1);
    });

    test("should collect player IDs from play-by-play", () => {
      const players: Record<string, PlayerType> = {
        "p1": createMockPlayer("p1", "Player One", "1"),
        "p3": createMockPlayer("p3", "Player Three", "3"),
      };

      const game = createMockGame("g1");
      game.periods = [
        {
          [Team.Us]: 2,
          [Team.Opponent]: 0,
          playByPlay: [
            { id: "play1", playerId: "p1", action: Stat.TwoPointMakes },
            { id: "play2", playerId: "p3", action: Stat.Assists, activePlayers: ["p1", "p3"] },
          ],
        },
      ];

      const result = buildExportPackage("Team", [game], players);
      const playerIds = result.players.map(p => p.originalId);
      expect(playerIds).toContain("p1");
      expect(playerIds).toContain("p3");
    });

    test("should filter out special IDs (Opponent, Team)", () => {
      const players: Record<string, PlayerType> = {
        "p1": createMockPlayer("p1", "Player One", "1"),
      };

      const game = createMockGame("g1");
      game.boxScore = {
        p1: { ...initialBaseStats },
        Opponent: { ...initialBaseStats },
        Team: { ...initialBaseStats },
      };
      game.gamePlayedList = ["p1", "Opponent"];
      game.activePlayers = ["p1", "Team"];

      const result = buildExportPackage("Team", [game], players);
      expect(result.players).toHaveLength(1);
      expect(result.players[0].originalId).toBe("p1");
    });

    test("should handle deleted players as Unknown Player", () => {
      const game = createMockGame("g1");
      game.boxScore = {
        "deleted-id": { ...initialBaseStats, [Stat.Points]: 5 },
      };

      const result = buildExportPackage("Team", [game], {});
      expect(result.players).toHaveLength(1);
      expect(result.players[0].originalId).toBe("deleted-id");
      expect(result.players[0].name).toBe("Unknown Player");
      expect(result.players[0].number).toBe("");
    });

    test("should collect unique player IDs across multiple games", () => {
      const players: Record<string, PlayerType> = {
        "p1": createMockPlayer("p1", "Player One", "1"),
        "p2": createMockPlayer("p2", "Player Two", "2"),
        "p3": createMockPlayer("p3", "Player Three", "3"),
      };

      const game1 = createMockGame("g1");
      game1.boxScore = { p1: { ...initialBaseStats }, p2: { ...initialBaseStats } };

      const game2 = createMockGame("g2");
      game2.boxScore = { p2: { ...initialBaseStats }, p3: { ...initialBaseStats } };

      const result = buildExportPackage("Team", [game1, game2], players);
      expect(result.players).toHaveLength(3);
      expect(result.games).toHaveLength(2);
    });

    test("should export game stat totals correctly", () => {
      const game = createMockGame("g1");
      game.statTotals[Team.Us][Stat.Points] = 75;
      game.statTotals[Team.Opponent][Stat.Points] = 60;

      const result = buildExportPackage("Team", [game], {});
      expect(result.games[0].statTotals[Team.Us][Stat.Points]).toBe(75);
      expect(result.games[0].statTotals[Team.Opponent][Stat.Points]).toBe(60);
    });

    test("should export isFinished state", () => {
      const finishedGame = createMockGame("g1", "Opp", true);
      const activeGame = createMockGame("g2", "Opp2", false);

      const result = buildExportPackage("Team", [finishedGame, activeGame], {});
      expect(result.games[0].isFinished).toBe(true);
      expect(result.games[1].isFinished).toBe(false);
    });

    test("should export periods data", () => {
      const game = createMockGame("g1");
      game.periods = [
        {
          [Team.Us]: 20,
          [Team.Opponent]: 15,
          playByPlay: [{ id: "play1", playerId: "p1", action: Stat.TwoPointMakes }],
        },
        {
          [Team.Us]: 18,
          [Team.Opponent]: 22,
          playByPlay: [],
        },
      ];

      const result = buildExportPackage("Team", [game], {});
      expect(result.games[0].periods).toHaveLength(2);
      expect(result.games[0].periods[0][Team.Us]).toBe(20);
      expect(result.games[0].periods[0].playByPlay).toHaveLength(1);
    });

    test("should handle empty games array", () => {
      const result = buildExportPackage("Team", [], {});
      expect(result.players).toHaveLength(0);
      expect(result.games).toHaveLength(0);
    });

    test("should handle play-by-play activePlayers containing special IDs", () => {
      const players: Record<string, PlayerType> = {
        "p1": createMockPlayer("p1", "Player One", "1"),
      };

      const game = createMockGame("g1");
      game.periods = [
        {
          [Team.Us]: 0,
          [Team.Opponent]: 0,
          playByPlay: [
            {
              id: "play1",
              playerId: "Opponent",
              action: Stat.TwoPointMakes,
              activePlayers: ["p1", "Opponent"],
            },
          ],
        },
      ];

      const result = buildExportPackage("Team", [game], players);
      const playerIds = result.players.map(p => p.originalId);
      expect(playerIds).toContain("p1");
      expect(playerIds).not.toContain("Opponent");
    });

    test("should handle games with null/undefined periods gracefully", () => {
      const game = createMockGame("g1");
      game.periods = [
        null as any,
        { [Team.Us]: 0, [Team.Opponent]: 0, playByPlay: [] },
      ];

      // Should not throw
      const result = buildExportPackage("Team", [game], {});
      expect(result.games).toHaveLength(1);
    });

    test("should not include opposingTeamImageUri in export", () => {
      const game = createMockGame("g1");
      game.opposingTeamImageUri = "/some/path/image.png";

      const result = buildExportPackage("Team", [game], {});
      expect((result.games[0] as any).opposingTeamImageUri).toBeUndefined();
    });
  });
});
