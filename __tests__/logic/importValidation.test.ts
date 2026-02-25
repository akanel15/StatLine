import {
  validateStatLineFile,
  detectDuplicateGames,
  autoMatchPlayers,
} from "@/logic/importValidation";
import { Team, PeriodType, createGame, GameType } from "@/types/game";
import { Stat, initialBaseStats } from "@/types/stats";
import { PlayerType, createPlayer } from "@/types/player";
import { StatLineExport, StatLineExportGame, StatLineExportPlayer } from "@/types/statlineExport";

describe("importValidation", () => {
  const makeValidExport = (overrides: Partial<StatLineExport> = {}): StatLineExport => ({
    version: 1,
    exportDate: "2026-01-01T00:00:00.000Z",
    team: { name: "Test Team" },
    players: [
      { originalId: "p1", name: "Player One", number: "1" },
    ],
    games: [
      {
        originalId: "g1",
        opposingTeamName: "Rival",
        periodType: PeriodType.Quarters,
        isFinished: true,
        statTotals: {
          [Team.Us]: { ...initialBaseStats, [Stat.Points]: 50 },
          [Team.Opponent]: { ...initialBaseStats, [Stat.Points]: 40 },
        },
        boxScore: {
          p1: { ...initialBaseStats, [Stat.Points]: 20 },
        },
        periods: [],
        gamePlayedList: ["p1"],
        activePlayers: ["p1"],
      },
    ],
    ...overrides,
  });

  describe("validateStatLineFile", () => {
    test("should accept a valid export file", () => {
      const result = validateStatLineFile(makeValidExport());
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.export).not.toBeNull();
    });

    test("should reject null input", () => {
      const result = validateStatLineFile(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Root: must be an object");
    });

    test("should reject non-object input", () => {
      const result = validateStatLineFile("not an object");
      expect(result.isValid).toBe(false);
    });

    test("should reject wrong version", () => {
      const result = validateStatLineFile(makeValidExport({ version: 2 as any }));
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("version"))).toBe(true);
    });

    test("should reject missing exportDate", () => {
      const data = makeValidExport();
      (data as any).exportDate = 123;
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("exportDate"))).toBe(true);
    });

    test("should reject missing team", () => {
      const data = makeValidExport();
      (data as any).team = null;
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("team"))).toBe(true);
    });

    test("should reject empty team name", () => {
      const data = makeValidExport({ team: { name: "" } });
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("team.name"))).toBe(true);
    });

    test("should reject non-array players", () => {
      const data = makeValidExport();
      (data as any).players = "not an array";
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("players"))).toBe(true);
    });

    test("should reject player with missing originalId", () => {
      const data = makeValidExport({
        players: [{ originalId: "", name: "Test", number: "1" }],
      });
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("players[0].originalId"))).toBe(true);
    });

    test("should reject player with non-string name", () => {
      const data = makeValidExport({
        players: [{ originalId: "p1", name: 123 as any, number: "1" }],
      });
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("players[0].name"))).toBe(true);
    });

    test("should reject empty games array", () => {
      const data = makeValidExport({ games: [] });
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("games: must contain at least one game"))).toBe(true);
    });

    test("should reject game with missing originalId", () => {
      const data = makeValidExport();
      (data.games[0] as any).originalId = "";
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("games[0].originalId"))).toBe(true);
    });

    test("should reject game with invalid periodType", () => {
      const data = makeValidExport();
      (data.games[0] as any).periodType = 3;
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("games[0].periodType"))).toBe(true);
    });

    test("should reject game with non-boolean isFinished", () => {
      const data = makeValidExport();
      (data.games[0] as any).isFinished = "yes";
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("games[0].isFinished"))).toBe(true);
    });

    test("should reject game with invalid statTotals", () => {
      const data = makeValidExport();
      (data.games[0] as any).statTotals = null;
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("games[0].statTotals"))).toBe(true);
    });

    test("should reject game with invalid Us stats", () => {
      const data = makeValidExport();
      (data.games[0].statTotals as any)[Team.Us] = { notAStat: 1 };
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("statTotals[Us]"))).toBe(true);
    });

    test("should reject player with non-string number", () => {
      const data = makeValidExport({
        players: [{ originalId: "p1", name: "Test", number: 1 as any }],
      });
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("players[0].number"))).toBe(true);
    });

    test("should reject game with non-string opposingTeamName", () => {
      const data = makeValidExport();
      (data.games[0] as any).opposingTeamName = 42;
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("games[0].opposingTeamName"))).toBe(true);
    });

    test("should reject game with invalid Opponent stats in statTotals", () => {
      const data = makeValidExport();
      (data.games[0].statTotals as any)[Team.Opponent] = { bad: "data" };
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("statTotals[Opponent]"))).toBe(true);
    });

    test("should reject game with missing boxScore", () => {
      const data = makeValidExport();
      (data.games[0] as any).boxScore = null;
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("games[0].boxScore"))).toBe(true);
    });

    test("should reject game with non-array periods", () => {
      const data = makeValidExport();
      (data.games[0] as any).periods = "not an array";
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("games[0].periods"))).toBe(true);
    });

    test("should reject game with non-array gamePlayedList", () => {
      const data = makeValidExport();
      (data.games[0] as any).gamePlayedList = null;
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("games[0].gamePlayedList"))).toBe(true);
    });

    test("should reject game with non-array activePlayers", () => {
      const data = makeValidExport();
      (data.games[0] as any).activePlayers = {};
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("games[0].activePlayers"))).toBe(true);
    });

    test("should accept valid Halves period type", () => {
      const data = makeValidExport();
      data.games[0].periodType = PeriodType.Halves;
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(true);
    });

    test("should accept empty players array", () => {
      const data = makeValidExport({ players: [] });
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(true);
    });

    test("should collect multiple errors", () => {
      const data = {
        version: 2,
        exportDate: 123,
        team: null,
        players: "nope",
        games: "nope",
      };
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });

    test("should reject non-object game entries", () => {
      const data = makeValidExport();
      (data as any).games = ["not an object"];
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("games[0]: must be an object"))).toBe(true);
    });

    test("should reject non-object player entries", () => {
      const data = makeValidExport();
      (data as any).players = [42];
      const result = validateStatLineFile(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("players[0]: must be an object"))).toBe(true);
    });
  });

  describe("detectDuplicateGames", () => {
    const makeIncomingGame = (
      id: string,
      opponent: string,
      usPoints: number,
      oppPoints: number,
      isFinished: boolean = true,
    ): StatLineExportGame => ({
      originalId: id,
      opposingTeamName: opponent,
      periodType: PeriodType.Quarters,
      isFinished,
      statTotals: {
        [Team.Us]: { ...initialBaseStats, [Stat.Points]: usPoints },
        [Team.Opponent]: { ...initialBaseStats, [Stat.Points]: oppPoints },
      },
      boxScore: {},
      periods: [],
      gamePlayedList: [],
      activePlayers: [],
    });

    const makeExistingGame = (
      id: string,
      opponent: string,
      usPoints: number,
      oppPoints: number,
      isFinished: boolean = true,
    ): GameType => {
      const game = createGame(id, "team-1", opponent, PeriodType.Quarters);
      game.statTotals[Team.Us][Stat.Points] = usPoints;
      game.statTotals[Team.Opponent][Stat.Points] = oppPoints;
      game.isFinished = isFinished;
      return game;
    };

    test("should detect exact duplicate games", () => {
      const incoming = [makeIncomingGame("g1", "Rival", 75, 60)];
      const existing = [makeExistingGame("existing-1", "Rival", 75, 60)];

      const result = detectDuplicateGames(incoming, existing);
      expect(result.get("g1")).toBe("existing-1");
    });

    test("should match case-insensitively on opponent name", () => {
      const incoming = [makeIncomingGame("g1", "RIVAL TEAM", 75, 60)];
      const existing = [makeExistingGame("existing-1", "rival team", 75, 60)];

      const result = detectDuplicateGames(incoming, existing);
      expect(result.get("g1")).toBe("existing-1");
    });

    test("should return null for games with no match", () => {
      const incoming = [makeIncomingGame("g1", "Rival", 75, 60)];
      const existing = [makeExistingGame("existing-1", "Other Team", 75, 60)];

      const result = detectDuplicateGames(incoming, existing);
      expect(result.get("g1")).toBeNull();
    });

    test("should not match when scores differ", () => {
      const incoming = [makeIncomingGame("g1", "Rival", 75, 60)];
      const existing = [makeExistingGame("existing-1", "Rival", 80, 60)];

      const result = detectDuplicateGames(incoming, existing);
      expect(result.get("g1")).toBeNull();
    });

    test("should not match when isFinished differs", () => {
      const incoming = [makeIncomingGame("g1", "Rival", 75, 60, true)];
      const existing = [makeExistingGame("existing-1", "Rival", 75, 60, false)];

      const result = detectDuplicateGames(incoming, existing);
      expect(result.get("g1")).toBeNull();
    });

    test("should handle multiple incoming games", () => {
      const incoming = [
        makeIncomingGame("g1", "Rival", 75, 60),
        makeIncomingGame("g2", "Other", 90, 85),
      ];
      const existing = [
        makeExistingGame("e1", "Rival", 75, 60),
      ];

      const result = detectDuplicateGames(incoming, existing);
      expect(result.get("g1")).toBe("e1");
      expect(result.get("g2")).toBeNull();
    });

    test("should handle empty incoming array", () => {
      const result = detectDuplicateGames([], [makeExistingGame("e1", "Rival", 75, 60)]);
      expect(result.size).toBe(0);
    });

    test("should handle empty existing array", () => {
      const incoming = [makeIncomingGame("g1", "Rival", 75, 60)];
      const result = detectDuplicateGames(incoming, []);
      expect(result.get("g1")).toBeNull();
    });
  });

  describe("autoMatchPlayers", () => {
    const makeIncomingPlayer = (
      id: string,
      name: string,
      number: string,
    ): StatLineExportPlayer => ({ originalId: id, name, number });

    const makeExistingPlayer = (
      id: string,
      name: string,
      number: string,
      teamId: string = "team-1",
    ): PlayerType => createPlayer(id, name, number, teamId);

    test("should match players by name (case-insensitive)", () => {
      const incoming = [makeIncomingPlayer("p1", "john doe", "23")];
      const existing = [makeExistingPlayer("e1", "John Doe", "23")];

      const result = autoMatchPlayers(incoming, existing);
      expect(result.get("p1")).toBe("e1");
    });

    test("should return null for unmatched players", () => {
      const incoming = [makeIncomingPlayer("p1", "John Doe", "23")];
      const existing = [makeExistingPlayer("e1", "Jane Smith", "10")];

      const result = autoMatchPlayers(incoming, existing);
      expect(result.get("p1")).toBeNull();
    });

    test("should disambiguate by number when multiple name matches exist", () => {
      const incoming = [makeIncomingPlayer("p1", "John", "23")];
      const existing = [
        makeExistingPlayer("e1", "John", "10"),
        makeExistingPlayer("e2", "John", "23"),
      ];

      const result = autoMatchPlayers(incoming, existing);
      expect(result.get("p1")).toBe("e2");
    });

    test("should fall back to first match when number doesn't disambiguate", () => {
      const incoming = [makeIncomingPlayer("p1", "John", "99")];
      const existing = [
        makeExistingPlayer("e1", "John", "10"),
        makeExistingPlayer("e2", "John", "23"),
      ];

      const result = autoMatchPlayers(incoming, existing);
      expect(result.get("p1")).toBe("e1");
    });

    test("should handle empty incoming array", () => {
      const result = autoMatchPlayers([], [makeExistingPlayer("e1", "John", "23")]);
      expect(result.size).toBe(0);
    });

    test("should handle empty existing array", () => {
      const incoming = [makeIncomingPlayer("p1", "John", "23")];
      const result = autoMatchPlayers(incoming, []);
      expect(result.get("p1")).toBeNull();
    });

    test("should match multiple players independently", () => {
      const incoming = [
        makeIncomingPlayer("p1", "John", "23"),
        makeIncomingPlayer("p2", "Jane", "10"),
        makeIncomingPlayer("p3", "Unknown", "5"),
      ];
      const existing = [
        makeExistingPlayer("e1", "John", "23"),
        makeExistingPlayer("e2", "Jane", "10"),
      ];

      const result = autoMatchPlayers(incoming, existing);
      expect(result.get("p1")).toBe("e1");
      expect(result.get("p2")).toBe("e2");
      expect(result.get("p3")).toBeNull();
    });

    test("should handle unique name match without needing number", () => {
      const incoming = [makeIncomingPlayer("p1", "John Doe", "99")];
      const existing = [makeExistingPlayer("e1", "John Doe", "23")];

      const result = autoMatchPlayers(incoming, existing);
      expect(result.get("p1")).toBe("e1");
    });
  });
});
