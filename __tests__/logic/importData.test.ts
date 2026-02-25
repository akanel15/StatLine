import { remapGamePlayerIds, executeImport, ImportStores } from "@/logic/importData";
import { Team, PeriodType } from "@/types/game";
import { Stat, initialBaseStats } from "@/types/stats";
import { Result } from "@/types/player";
import {
  StatLineExport,
  StatLineExportGame,
  ImportDecisions,
} from "@/types/statlineExport";

describe("importData", () => {
  describe("remapGamePlayerIds", () => {
    const makeGame = (overrides: Partial<StatLineExportGame> = {}): StatLineExportGame => ({
      originalId: "g1",
      opposingTeamName: "Rival",
      periodType: PeriodType.Quarters,
      isFinished: true,
      statTotals: {
        [Team.Us]: { ...initialBaseStats },
        [Team.Opponent]: { ...initialBaseStats },
      },
      boxScore: {},
      periods: [],
      gamePlayedList: [],
      activePlayers: [],
      sets: {},
      activeSets: [],
      ...overrides,
    });

    test("should remap boxScore keys", () => {
      const game = makeGame({
        boxScore: {
          "old-p1": { ...initialBaseStats, [Stat.Points]: 20 },
          "old-p2": { ...initialBaseStats, [Stat.Points]: 15 },
        },
      });

      const mapping = new Map([
        ["old-p1", "new-p1"],
        ["old-p2", "new-p2"],
      ]);

      const result = remapGamePlayerIds(game, mapping);
      expect(result.boxScore["new-p1"][Stat.Points]).toBe(20);
      expect(result.boxScore["new-p2"][Stat.Points]).toBe(15);
      expect(result.boxScore["old-p1"]).toBeUndefined();
    });

    test("should remap gamePlayedList", () => {
      const game = makeGame({
        gamePlayedList: ["old-p1", "old-p2"],
      });

      const mapping = new Map([
        ["old-p1", "new-p1"],
        ["old-p2", "new-p2"],
      ]);

      const result = remapGamePlayerIds(game, mapping);
      expect(result.gamePlayedList).toEqual(["new-p1", "new-p2"]);
    });

    test("should remap activePlayers", () => {
      const game = makeGame({
        activePlayers: ["old-p1"],
      });

      const mapping = new Map([["old-p1", "new-p1"]]);

      const result = remapGamePlayerIds(game, mapping);
      expect(result.activePlayers).toEqual(["new-p1"]);
    });

    test("should remap play-by-play playerIds", () => {
      const game = makeGame({
        periods: [
          {
            [Team.Us]: 2,
            [Team.Opponent]: 0,
            playByPlay: [
              { id: "play1", playerId: "old-p1", action: Stat.TwoPointMakes },
            ],
          },
        ],
      });

      const mapping = new Map([["old-p1", "new-p1"]]);

      const result = remapGamePlayerIds(game, mapping);
      expect(result.periods[0].playByPlay[0].playerId).toBe("new-p1");
    });

    test("should remap play-by-play activePlayers", () => {
      const game = makeGame({
        periods: [
          {
            [Team.Us]: 0,
            [Team.Opponent]: 0,
            playByPlay: [
              {
                id: "play1",
                playerId: "old-p1",
                action: Stat.Assists,
                activePlayers: ["old-p1", "old-p2"],
              },
            ],
          },
        ],
      });

      const mapping = new Map([
        ["old-p1", "new-p1"],
        ["old-p2", "new-p2"],
      ]);

      const result = remapGamePlayerIds(game, mapping);
      expect(result.periods[0].playByPlay[0].activePlayers).toEqual(["new-p1", "new-p2"]);
    });

    test("should preserve Opponent special ID", () => {
      const game = makeGame({
        boxScore: {
          Opponent: { ...initialBaseStats, [Stat.Points]: 30 },
          "old-p1": { ...initialBaseStats },
        },
        gamePlayedList: ["old-p1"],
        periods: [
          {
            [Team.Us]: 0,
            [Team.Opponent]: 3,
            playByPlay: [
              { id: "play1", playerId: "Opponent", action: Stat.ThreePointMakes },
            ],
          },
        ],
      });

      const mapping = new Map([["old-p1", "new-p1"]]);

      const result = remapGamePlayerIds(game, mapping);
      expect(result.boxScore["Opponent"]).toBeDefined();
      expect(result.boxScore["new-p1"]).toBeDefined();
      expect(result.periods[0].playByPlay[0].playerId).toBe("Opponent");
    });

    test("should preserve Team special ID", () => {
      const game = makeGame({
        boxScore: {
          Team: { ...initialBaseStats },
        },
      });

      const mapping = new Map<string, string>();

      const result = remapGamePlayerIds(game, mapping);
      expect(result.boxScore["Team"]).toBeDefined();
    });

    test("should keep original ID when no mapping exists", () => {
      const game = makeGame({
        boxScore: {
          "unmapped-id": { ...initialBaseStats },
        },
        gamePlayedList: ["unmapped-id"],
      });

      const mapping = new Map<string, string>();

      const result = remapGamePlayerIds(game, mapping);
      expect(result.boxScore["unmapped-id"]).toBeDefined();
      expect(result.gamePlayedList).toEqual(["unmapped-id"]);
    });

    test("should handle null playByPlay in periods", () => {
      const game = makeGame({
        periods: [
          { [Team.Us]: 0, [Team.Opponent]: 0, playByPlay: null as any },
        ],
      });

      const mapping = new Map<string, string>();

      const result = remapGamePlayerIds(game, mapping);
      expect(result.periods[0].playByPlay).toBeNull();
    });

    test("should handle plays without activePlayers field", () => {
      const game = makeGame({
        periods: [
          {
            [Team.Us]: 0,
            [Team.Opponent]: 0,
            playByPlay: [
              { id: "play1", playerId: "old-p1", action: Stat.Assists },
            ],
          },
        ],
      });

      const mapping = new Map([["old-p1", "new-p1"]]);

      const result = remapGamePlayerIds(game, mapping);
      expect(result.periods[0].playByPlay[0].activePlayers).toBeUndefined();
    });

    test("should preserve non-player game data", () => {
      const game = makeGame({
        opposingTeamName: "Test Opponent",
        periodType: PeriodType.Halves,
        isFinished: false,
        statTotals: {
          [Team.Us]: { ...initialBaseStats, [Stat.Points]: 50 },
          [Team.Opponent]: { ...initialBaseStats, [Stat.Points]: 40 },
        },
      });

      const result = remapGamePlayerIds(game, new Map());
      expect(result.opposingTeamName).toBe("Test Opponent");
      expect(result.periodType).toBe(PeriodType.Halves);
      expect(result.isFinished).toBe(false);
      expect(result.statTotals[Team.Us][Stat.Points]).toBe(50);
    });
  });

  describe("executeImport", () => {
    const makeExportData = (overrides: Partial<StatLineExport> = {}): StatLineExport => ({
      version: 1,
      exportDate: "2026-01-01T00:00:00.000Z",
      team: { name: "Imported Team" },
      players: [
        { originalId: "p1", name: "Player One", number: "1" },
        { originalId: "p2", name: "Player Two", number: "2" },
      ],
      sets: [],
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
            p1: { ...initialBaseStats, [Stat.Points]: 30 },
            p2: { ...initialBaseStats, [Stat.Points]: 20 },
          },
          periods: [],
          gamePlayedList: ["p1", "p2"],
          activePlayers: ["p1", "p2"],
          sets: {},
          activeSets: [],
        },
      ],
      ...overrides,
    });

    const createMockStores = (): ImportStores & {
      calls: {
        importGame: any[];
        addTeamSync: any[];
        addPlayerSync: any[];
        addSetSync: any[];
        updateTeamGamesPlayed: any[];
        updatePlayerGamesPlayed: any[];
        teamBatchUpdateStats: any[];
        playerBatchUpdateStats: any[];
        setBatchUpdateStats: any[];
        setIncrementRunCount: any[];
      };
    } => {
      const calls = {
        importGame: [] as any[],
        addTeamSync: [] as any[],
        addPlayerSync: [] as any[],
        addSetSync: [] as any[],
        updateTeamGamesPlayed: [] as any[],
        updatePlayerGamesPlayed: [] as any[],
        teamBatchUpdateStats: [] as any[],
        playerBatchUpdateStats: [] as any[],
        setBatchUpdateStats: [] as any[],
        setIncrementRunCount: [] as any[],
      };

      let playerCounter = 0;
      let setCounter = 0;

      return {
        calls,
        gameStore: {
          importGame: (gameData: any) => {
            calls.importGame.push(gameData);
            return `new-game-${calls.importGame.length}`;
          },
        },
        teamStore: {
          addTeamSync: (name: string) => {
            calls.addTeamSync.push(name);
            return "new-team-id";
          },
          updateGamesPlayed: (teamId: string, result: Result) => {
            calls.updateTeamGamesPlayed.push({ teamId, result });
          },
          batchUpdateStats: (updates: any[]) => {
            calls.teamBatchUpdateStats.push(updates);
          },
        },
        playerStore: {
          addPlayerSync: (name: string, number: string, teamId: string) => {
            playerCounter++;
            calls.addPlayerSync.push({ name, number, teamId });
            return `new-player-${playerCounter}`;
          },
          updateGamesPlayed: (playerId: string, result: Result) => {
            calls.updatePlayerGamesPlayed.push({ playerId, result });
          },
          batchUpdateStats: (updates: any[]) => {
            calls.playerBatchUpdateStats.push(updates);
          },
        },
        setStore: {
          addSetSync: (name: string, teamId: string) => {
            setCounter++;
            calls.addSetSync.push({ name, teamId });
            return `new-set-${setCounter}`;
          },
          batchUpdateStats: (updates: any[]) => {
            calls.setBatchUpdateStats.push(updates);
          },
          incrementRunCount: (setId: string) => {
            calls.setIncrementRunCount.push(setId);
          },
        },
      };
    };

    test("should create a new team when decision is create", () => {
      const stores = createMockStores();
      const decisions: ImportDecisions = {
        team: { type: "create", name: "New Team" },
        players: [
          { type: "create", originalId: "p1", name: "Player One", number: "1" },
          { type: "create", originalId: "p2", name: "Player Two", number: "2" },
        ],
        games: [{ originalId: "g1", include: true }],
        sets: [],
      };

      const teamId = executeImport(makeExportData(), decisions, stores);
      expect(teamId).toBe("new-team-id");
      expect(stores.calls.addTeamSync).toEqual(["New Team"]);
    });

    test("should use existing team when decision is match", () => {
      const stores = createMockStores();
      const decisions: ImportDecisions = {
        team: { type: "match", existingTeamId: "existing-team-123" },
        players: [
          { type: "create", originalId: "p1", name: "Player One", number: "1" },
          { type: "create", originalId: "p2", name: "Player Two", number: "2" },
        ],
        games: [{ originalId: "g1", include: true }],
        sets: [],
      };

      const teamId = executeImport(makeExportData(), decisions, stores);
      expect(teamId).toBe("existing-team-123");
      expect(stores.calls.addTeamSync).toHaveLength(0);
    });

    test("should create new players for create decisions", () => {
      const stores = createMockStores();
      const decisions: ImportDecisions = {
        team: { type: "create", name: "Team" },
        players: [
          { type: "create", originalId: "p1", name: "Player One", number: "1" },
          { type: "create", originalId: "p2", name: "Player Two", number: "2" },
        ],
        games: [{ originalId: "g1", include: true }],
        sets: [],
      };

      executeImport(makeExportData(), decisions, stores);
      expect(stores.calls.addPlayerSync).toHaveLength(2);
      expect(stores.calls.addPlayerSync[0]).toEqual({
        name: "Player One",
        number: "1",
        teamId: "new-team-id",
      });
    });

    test("should not create players for match decisions", () => {
      const stores = createMockStores();
      const decisions: ImportDecisions = {
        team: { type: "create", name: "Team" },
        players: [
          { type: "match", originalId: "p1", existingPlayerId: "existing-p1" },
          { type: "match", originalId: "p2", existingPlayerId: "existing-p2" },
        ],
        games: [{ originalId: "g1", include: true }],
        sets: [],
      };

      executeImport(makeExportData(), decisions, stores);
      expect(stores.calls.addPlayerSync).toHaveLength(0);
    });

    test("should import selected games with remapped player IDs", () => {
      const stores = createMockStores();
      const decisions: ImportDecisions = {
        team: { type: "create", name: "Team" },
        players: [
          { type: "create", originalId: "p1", name: "Player One", number: "1" },
          { type: "create", originalId: "p2", name: "Player Two", number: "2" },
        ],
        games: [{ originalId: "g1", include: true }],
        sets: [],
      };

      executeImport(makeExportData(), decisions, stores);
      expect(stores.calls.importGame).toHaveLength(1);

      const importedGame = stores.calls.importGame[0];
      expect(importedGame.teamId).toBe("new-team-id");
      expect(importedGame.opposingTeamName).toBe("Rival");
      // Player IDs should be remapped
      expect(importedGame.gamePlayedList).toContain("new-player-1");
      expect(importedGame.gamePlayedList).toContain("new-player-2");
    });

    test("should skip games with include=false", () => {
      const stores = createMockStores();
      const exportData = makeExportData({
        games: [
          {
            originalId: "g1",
            opposingTeamName: "Rival",
            periodType: PeriodType.Quarters,
            isFinished: true,
            statTotals: {
              [Team.Us]: { ...initialBaseStats },
              [Team.Opponent]: { ...initialBaseStats },
            },
            boxScore: {},
            periods: [],
            gamePlayedList: [],
            activePlayers: [],
            sets: {},
            activeSets: [],
          },
          {
            originalId: "g2",
            opposingTeamName: "Other",
            periodType: PeriodType.Quarters,
            isFinished: true,
            statTotals: {
              [Team.Us]: { ...initialBaseStats },
              [Team.Opponent]: { ...initialBaseStats },
            },
            boxScore: {},
            periods: [],
            gamePlayedList: [],
            activePlayers: [],
            sets: {},
            activeSets: [],
          },
        ],
      });

      const decisions: ImportDecisions = {
        team: { type: "create", name: "Team" },
        players: [],
        games: [
          { originalId: "g1", include: true },
          { originalId: "g2", include: false },
        ],
        sets: [],
      };

      executeImport(exportData, decisions, stores);
      expect(stores.calls.importGame).toHaveLength(1);
      expect(stores.calls.importGame[0].opposingTeamName).toBe("Rival");
    });

    test("should update team game numbers for finished games", () => {
      const stores = createMockStores();
      const decisions: ImportDecisions = {
        team: { type: "create", name: "Team" },
        players: [
          { type: "create", originalId: "p1", name: "P1", number: "1" },
          { type: "create", originalId: "p2", name: "P2", number: "2" },
        ],
        games: [{ originalId: "g1", include: true }],
        sets: [],
      };

      executeImport(makeExportData(), decisions, stores);
      expect(stores.calls.updateTeamGamesPlayed).toHaveLength(1);
      expect(stores.calls.updateTeamGamesPlayed[0].result).toBe(Result.Win); // 50 > 40
    });

    test("should not update game numbers for unfinished games", () => {
      const exportData = makeExportData();
      exportData.games[0].isFinished = false;

      const stores = createMockStores();
      const decisions: ImportDecisions = {
        team: { type: "create", name: "Team" },
        players: [
          { type: "create", originalId: "p1", name: "P1", number: "1" },
          { type: "create", originalId: "p2", name: "P2", number: "2" },
        ],
        games: [{ originalId: "g1", include: true }],
        sets: [],
      };

      executeImport(exportData, decisions, stores);
      expect(stores.calls.updateTeamGamesPlayed).toHaveLength(0);
      expect(stores.calls.updatePlayerGamesPlayed).toHaveLength(0);
    });

    test("should update player game numbers for participants", () => {
      const stores = createMockStores();
      const decisions: ImportDecisions = {
        team: { type: "create", name: "Team" },
        players: [
          { type: "create", originalId: "p1", name: "P1", number: "1" },
          { type: "create", originalId: "p2", name: "P2", number: "2" },
        ],
        games: [{ originalId: "g1", include: true }],
        sets: [],
      };

      executeImport(makeExportData(), decisions, stores);
      expect(stores.calls.updatePlayerGamesPlayed).toHaveLength(2);
    });

    test("should batch update team cumulative stats", () => {
      const stores = createMockStores();
      const decisions: ImportDecisions = {
        team: { type: "create", name: "Team" },
        players: [
          { type: "create", originalId: "p1", name: "P1", number: "1" },
          { type: "create", originalId: "p2", name: "P2", number: "2" },
        ],
        games: [{ originalId: "g1", include: true }],
        sets: [],
      };

      executeImport(makeExportData(), decisions, stores);
      expect(stores.calls.teamBatchUpdateStats).toHaveLength(1);
      const updates = stores.calls.teamBatchUpdateStats[0];
      // Should contain both Us and Opponent stat updates for non-zero values
      expect(updates.length).toBeGreaterThan(0);
      expect(updates.some((u: any) => u.team === Team.Us && u.stat === Stat.Points)).toBe(true);
      expect(updates.some((u: any) => u.team === Team.Opponent && u.stat === Stat.Points)).toBe(true);
    });

    test("should batch update player cumulative stats", () => {
      const stores = createMockStores();
      const decisions: ImportDecisions = {
        team: { type: "create", name: "Team" },
        players: [
          { type: "create", originalId: "p1", name: "P1", number: "1" },
          { type: "create", originalId: "p2", name: "P2", number: "2" },
        ],
        games: [{ originalId: "g1", include: true }],
        sets: [],
      };

      executeImport(makeExportData(), decisions, stores);
      expect(stores.calls.playerBatchUpdateStats).toHaveLength(1);
      const updates = stores.calls.playerBatchUpdateStats[0];
      expect(updates.length).toBeGreaterThan(0);
    });

    test("should handle loss result correctly", () => {
      const exportData = makeExportData();
      // Flip scores so it's a loss
      exportData.games[0].statTotals[Team.Us][Stat.Points] = 40;
      exportData.games[0].statTotals[Team.Opponent][Stat.Points] = 50;

      const stores = createMockStores();
      const decisions: ImportDecisions = {
        team: { type: "create", name: "Team" },
        players: [
          { type: "create", originalId: "p1", name: "P1", number: "1" },
          { type: "create", originalId: "p2", name: "P2", number: "2" },
        ],
        games: [{ originalId: "g1", include: true }],
        sets: [],
      };

      executeImport(exportData, decisions, stores);
      expect(stores.calls.updateTeamGamesPlayed[0].result).toBe(Result.Loss);
    });

    test("should handle draw result correctly", () => {
      const exportData = makeExportData();
      exportData.games[0].statTotals[Team.Us][Stat.Points] = 50;
      exportData.games[0].statTotals[Team.Opponent][Stat.Points] = 50;

      const stores = createMockStores();
      const decisions: ImportDecisions = {
        team: { type: "create", name: "Team" },
        players: [
          { type: "create", originalId: "p1", name: "P1", number: "1" },
          { type: "create", originalId: "p2", name: "P2", number: "2" },
        ],
        games: [{ originalId: "g1", include: true }],
        sets: [],
      };

      executeImport(exportData, decisions, stores);
      expect(stores.calls.updateTeamGamesPlayed[0].result).toBe(Result.Draw);
    });

    test("should not call batch updates when no games are selected", () => {
      const stores = createMockStores();
      const decisions: ImportDecisions = {
        team: { type: "create", name: "Team" },
        players: [],
        games: [{ originalId: "g1", include: false }],
        sets: [],
      };

      executeImport(makeExportData(), decisions, stores);
      expect(stores.calls.importGame).toHaveLength(0);
      expect(stores.calls.teamBatchUpdateStats).toHaveLength(0);
      expect(stores.calls.playerBatchUpdateStats).toHaveLength(0);
    });

    test("should skip special IDs in gamePlayedList when updating player game numbers", () => {
      const exportData = makeExportData();
      exportData.games[0].gamePlayedList = ["p1", "Opponent", "Team"];

      const stores = createMockStores();
      const decisions: ImportDecisions = {
        team: { type: "create", name: "Team" },
        players: [
          { type: "create", originalId: "p1", name: "P1", number: "1" },
        ],
        games: [{ originalId: "g1", include: true }],
        sets: [],
      };

      executeImport(exportData, decisions, stores);
      // Only p1 should get game number updates, not Opponent or Team
      const playerUpdates = stores.calls.updatePlayerGamesPlayed;
      expect(playerUpdates.every((u: any) => u.playerId !== "Opponent")).toBe(true);
      expect(playerUpdates.every((u: any) => u.playerId !== "Team")).toBe(true);
    });
  });
});
