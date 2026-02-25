import { migrateGameSetStats } from "@/logic/migrateGameSetStats";
import { GameType, PeriodType, Team } from "@/types/game";
import { initialBaseStats, Stat } from "@/types/stats";

/** Helper to build a minimal game with given periods and sets */
function makeGame(overrides: Partial<GameType> = {}): GameType {
  return {
    id: "game-1",
    teamId: "team-1",
    opposingTeamName: "Opponent",
    activePlayers: [],
    activeSets: [],
    gamePlayedList: [],
    periodType: PeriodType.Quarters,
    statTotals: {
      [Team.Us]: { ...initialBaseStats },
      [Team.Opponent]: { ...initialBaseStats },
    },
    periods: [],
    boxScore: {},
    isFinished: false,
    sets: {},
    ...overrides,
  };
}

describe("migrateGameSetStats", () => {
  it("returns games with no sets unchanged", () => {
    const games = {
      g1: makeGame({ sets: {} }),
    };
    const result = migrateGameSetStats(games);
    expect(result.g1).toEqual(games.g1);
  });

  it("resets set stats and rebuilds from our team plays only", () => {
    const games = {
      g1: makeGame({
        sets: {
          "set-1": {
            id: "set-1",
            name: "Starting 5",
            teamId: "team-1",
            runCount: 3,
            // Corrupted stats (include opponent data)
            stats: { ...initialBaseStats, [Stat.Points]: 99, [Stat.Steals]: 50 },
          },
        },
        periods: [
          {
            [Team.Us]: 4,
            [Team.Opponent]: 2,
            playByPlay: [
              { id: "p1", playerId: "player-1", action: Stat.TwoPointMakes, setId: "set-1" },
              { id: "p2", playerId: "player-2", action: Stat.Steals, setId: "set-1" },
              { id: "p3", playerId: "player-1", action: Stat.TwoPointMakes, setId: "set-1" },
            ],
          },
        ],
      }),
    };

    const result = migrateGameSetStats(games);
    const setStats = result.g1.sets["set-1"].stats;

    // Two 2pt makes: 2 makes, 2 attempts, 4 points
    expect(setStats[Stat.TwoPointMakes]).toBe(2);
    expect(setStats[Stat.TwoPointAttempts]).toBe(2);
    expect(setStats[Stat.Points]).toBe(4);
    expect(setStats[Stat.Steals]).toBe(1);
  });

  it("excludes opponent plays from set stats", () => {
    const games = {
      g1: makeGame({
        sets: {
          "set-1": {
            id: "set-1",
            name: "Starting 5",
            teamId: "team-1",
            runCount: 1,
            stats: { ...initialBaseStats },
          },
        },
        periods: [
          {
            [Team.Us]: 2,
            [Team.Opponent]: 3,
            playByPlay: [
              { id: "p1", playerId: "player-1", action: Stat.TwoPointMakes, setId: "set-1" },
              { id: "p2", playerId: "Opponent", action: Stat.ThreePointMakes, setId: "set-1" },
              { id: "p3", playerId: "Opponent", action: Stat.Steals, setId: "set-1" },
            ],
          },
        ],
      }),
    };

    const result = migrateGameSetStats(games);
    const setStats = result.g1.sets["set-1"].stats;

    // Only our 2pt make counted
    expect(setStats[Stat.TwoPointMakes]).toBe(1);
    expect(setStats[Stat.TwoPointAttempts]).toBe(1);
    expect(setStats[Stat.Points]).toBe(2);
    // Opponent stats NOT included
    expect(setStats[Stat.ThreePointMakes]).toBe(0);
    expect(setStats[Stat.Steals]).toBe(0);
  });

  it("skips plays with missing or empty setId", () => {
    const games = {
      g1: makeGame({
        sets: {
          "set-1": {
            id: "set-1",
            name: "Starting 5",
            teamId: "team-1",
            runCount: 0,
            stats: { ...initialBaseStats },
          },
        },
        periods: [
          {
            [Team.Us]: 5,
            [Team.Opponent]: 0,
            playByPlay: [
              { id: "p1", playerId: "player-1", action: Stat.TwoPointMakes, setId: "set-1" },
              { id: "p2", playerId: "player-1", action: Stat.ThreePointMakes, setId: "" },
              { id: "p3", playerId: "player-1", action: Stat.Assists },
            ],
          },
        ],
      }),
    };

    const result = migrateGameSetStats(games);
    const setStats = result.g1.sets["set-1"].stats;

    // Only the first play (with valid setId) counts
    expect(setStats[Stat.TwoPointMakes]).toBe(1);
    expect(setStats[Stat.Points]).toBe(2);
    expect(setStats[Stat.ThreePointMakes]).toBe(0);
    expect(setStats[Stat.Assists]).toBe(0);
  });

  it("preserves runCount through migration", () => {
    const games = {
      g1: makeGame({
        sets: {
          "set-1": {
            id: "set-1",
            name: "Starting 5",
            teamId: "team-1",
            runCount: 7,
            stats: { ...initialBaseStats, [Stat.Points]: 99 },
          },
        },
        periods: [],
      }),
    };

    const result = migrateGameSetStats(games);
    expect(result.g1.sets["set-1"].runCount).toBe(7);
    // Stats reset to zero since no play-by-play
    expect(result.g1.sets["set-1"].stats[Stat.Points]).toBe(0);
  });

  it("correctly adds points for all scoring play types", () => {
    const games = {
      g1: makeGame({
        sets: {
          "set-1": {
            id: "set-1",
            name: "Starting 5",
            teamId: "team-1",
            runCount: 0,
            stats: { ...initialBaseStats },
          },
        },
        periods: [
          {
            [Team.Us]: 6,
            [Team.Opponent]: 0,
            playByPlay: [
              { id: "p1", playerId: "player-1", action: Stat.FreeThrowsMade, setId: "set-1" },
              { id: "p2", playerId: "player-1", action: Stat.TwoPointMakes, setId: "set-1" },
              { id: "p3", playerId: "player-1", action: Stat.ThreePointMakes, setId: "set-1" },
            ],
          },
        ],
      }),
    };

    const result = migrateGameSetStats(games);
    const setStats = result.g1.sets["set-1"].stats;

    // 1 + 2 + 3 = 6 points
    expect(setStats[Stat.Points]).toBe(6);
    expect(setStats[Stat.FreeThrowsMade]).toBe(1);
    expect(setStats[Stat.FreeThrowsAttempted]).toBe(1);
    expect(setStats[Stat.TwoPointMakes]).toBe(1);
    expect(setStats[Stat.TwoPointAttempts]).toBe(1);
    expect(setStats[Stat.ThreePointMakes]).toBe(1);
    expect(setStats[Stat.ThreePointAttempts]).toBe(1);
  });

  it("handles multiple sets across multiple periods", () => {
    const games = {
      g1: makeGame({
        sets: {
          "set-a": {
            id: "set-a",
            name: "Set A",
            teamId: "team-1",
            runCount: 2,
            stats: { ...initialBaseStats },
          },
          "set-b": {
            id: "set-b",
            name: "Set B",
            teamId: "team-1",
            runCount: 1,
            stats: { ...initialBaseStats },
          },
        },
        periods: [
          {
            [Team.Us]: 2,
            [Team.Opponent]: 0,
            playByPlay: [
              { id: "p1", playerId: "player-1", action: Stat.TwoPointMakes, setId: "set-a" },
            ],
          },
          {
            [Team.Us]: 3,
            [Team.Opponent]: 0,
            playByPlay: [
              { id: "p2", playerId: "player-2", action: Stat.ThreePointMakes, setId: "set-b" },
              { id: "p3", playerId: "player-1", action: Stat.Assists, setId: "set-a" },
            ],
          },
        ],
      }),
    };

    const result = migrateGameSetStats(games);

    expect(result.g1.sets["set-a"].stats[Stat.TwoPointMakes]).toBe(1);
    expect(result.g1.sets["set-a"].stats[Stat.Points]).toBe(2);
    expect(result.g1.sets["set-a"].stats[Stat.Assists]).toBe(1);

    expect(result.g1.sets["set-b"].stats[Stat.ThreePointMakes]).toBe(1);
    expect(result.g1.sets["set-b"].stats[Stat.Points]).toBe(3);
  });

  it("handles miss actions (attempts without makes)", () => {
    const games = {
      g1: makeGame({
        sets: {
          "set-1": {
            id: "set-1",
            name: "Starting 5",
            teamId: "team-1",
            runCount: 0,
            stats: { ...initialBaseStats },
          },
        },
        periods: [
          {
            [Team.Us]: 0,
            [Team.Opponent]: 0,
            playByPlay: [
              { id: "p1", playerId: "player-1", action: Stat.TwoPointAttempts, setId: "set-1" },
              { id: "p2", playerId: "player-1", action: Stat.ThreePointAttempts, setId: "set-1" },
              { id: "p3", playerId: "player-1", action: Stat.FreeThrowsAttempted, setId: "set-1" },
            ],
          },
        ],
      }),
    };

    const result = migrateGameSetStats(games);
    const setStats = result.g1.sets["set-1"].stats;

    // Misses only add attempts, no makes or points
    expect(setStats[Stat.TwoPointAttempts]).toBe(1);
    expect(setStats[Stat.ThreePointAttempts]).toBe(1);
    expect(setStats[Stat.FreeThrowsAttempted]).toBe(1);
    expect(setStats[Stat.TwoPointMakes]).toBe(0);
    expect(setStats[Stat.ThreePointMakes]).toBe(0);
    expect(setStats[Stat.FreeThrowsMade]).toBe(0);
    expect(setStats[Stat.Points]).toBe(0);
  });

  it("skips plays referencing a setId not present in game.sets", () => {
    const games = {
      g1: makeGame({
        sets: {
          "set-1": {
            id: "set-1",
            name: "Starting 5",
            teamId: "team-1",
            runCount: 0,
            stats: { ...initialBaseStats },
          },
        },
        periods: [
          {
            [Team.Us]: 5,
            [Team.Opponent]: 0,
            playByPlay: [
              { id: "p1", playerId: "player-1", action: Stat.TwoPointMakes, setId: "set-1" },
              {
                id: "p2",
                playerId: "player-1",
                action: Stat.ThreePointMakes,
                setId: "deleted-set",
              },
            ],
          },
        ],
      }),
    };

    const result = migrateGameSetStats(games);

    // Only the play referencing existing set-1 is counted
    expect(result.g1.sets["set-1"].stats[Stat.TwoPointMakes]).toBe(1);
    expect(result.g1.sets["set-1"].stats[Stat.Points]).toBe(2);
    // No crash, no "deleted-set" key created
    expect(result.g1.sets["deleted-set"]).toBeUndefined();
  });

  it("preserves set id, name, and teamId", () => {
    const games = {
      g1: makeGame({
        sets: {
          "set-1": {
            id: "set-1",
            name: "My Custom Set",
            teamId: "team-42",
            runCount: 5,
            stats: { ...initialBaseStats, [Stat.Points]: 999 },
          },
        },
        periods: [],
      }),
    };

    const result = migrateGameSetStats(games);
    const set = result.g1.sets["set-1"];
    expect(set.id).toBe("set-1");
    expect(set.name).toBe("My Custom Set");
    expect(set.teamId).toBe("team-42");
    expect(set.runCount).toBe(5);
  });
});
