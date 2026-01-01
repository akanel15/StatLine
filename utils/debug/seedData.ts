import uuid from "react-native-uuid";
import { createTeam, TeamType } from "@/types/team";
import { createPlayer, PlayerType } from "@/types/player";
import { createGame, GameType, PeriodType, Team } from "@/types/game";
import { createSet, SetType } from "@/types/set";
import { initialBaseStats, Stat } from "@/types/stats";
import { DebugSnapshot } from "./snapshotManager";

export type SeedType = "minimal" | "fullSeason" | "edgeCases";

const SEED_VERSION = "1.0.0";

/**
 * Generates realistic seed data for testing
 */
export function generateSeed(type: SeedType): DebugSnapshot {
  switch (type) {
    case "minimal":
      return generateMinimalSeed();
    case "fullSeason":
      return generateFullSeasonSeed();
    case "edgeCases":
      return generateEdgeCasesSeed();
    default:
      throw new Error(`Unknown seed type: ${type}`);
  }
}

/**
 * Minimal seed: 1 team, 5 players, 1 game, 2 sets
 */
function generateMinimalSeed(): DebugSnapshot {
  const teamId = uuid.v4() as string;
  const team = createTeam(teamId, "Warriors", undefined);

  const playerIds: string[] = [];
  const players: Record<string, PlayerType> = {};

  // Create 5 players
  for (let i = 1; i <= 5; i++) {
    const playerId = uuid.v4() as string;
    playerIds.push(playerId);
    players[playerId] = createPlayer(
      playerId,
      `Player ${i}`,
      i.toString(),
      teamId,
      undefined,
    );
  }

  // Create 2 sets
  const setIds: string[] = [];
  const sets: Record<string, SetType> = {};

  const startingFiveId = uuid.v4() as string;
  setIds.push(startingFiveId);
  sets[startingFiveId] = createSet(startingFiveId, "Starting Five", teamId);

  const benchId = uuid.v4() as string;
  setIds.push(benchId);
  sets[benchId] = createSet(benchId, "Bench", teamId);

  // Create 1 active game
  const gameId = uuid.v4() as string;
  const game = createGame(gameId, teamId, "Lakers", PeriodType.Quarters);
  game.activePlayers = playerIds;
  game.activeSets = setIds;

  return {
    version: SEED_VERSION,
    timestamp: new Date().toISOString(),
    metadata: {
      name: "Minimal Seed",
      description:
        "1 team, 5 players, 1 game, 2 sets - perfect for basic testing",
      deviceInfo: "Generated seed data",
    },
    stores: {
      teams: { [teamId]: team },
      players,
      games: { [gameId]: game },
      sets,
      teamCurrentId: teamId,
    },
  };
}

/**
 * Full season seed: 2 teams, 15 players per team, 10 games, multiple sets
 */
function generateFullSeasonSeed(): DebugSnapshot {
  const teams: Record<string, TeamType> = {};
  const players: Record<string, PlayerType> = {};
  const games: Record<string, GameType> = {};
  const sets: Record<string, SetType> = {};

  const teamConfigs = [
    { name: "Warriors", color: "blue" },
    { name: "Lakers", color: "purple" },
  ];

  let currentTeamId = "";

  teamConfigs.forEach((config, teamIndex) => {
    const teamId = uuid.v4() as string;
    if (teamIndex === 0) currentTeamId = teamId; // Set first team as current

    const team = createTeam(teamId, config.name, undefined);

    // Add some wins/losses to make it realistic
    team.gameNumbers = {
      wins: Math.floor(Math.random() * 8) + 2,
      losses: Math.floor(Math.random() * 4) + 1,
      draws: Math.floor(Math.random() * 2),
      gamesPlayed: 0,
    };
    team.gameNumbers.gamesPlayed =
      team.gameNumbers.wins + team.gameNumbers.losses + team.gameNumbers.draws;

    teams[teamId] = team;

    // Create 15 players per team
    const playerPositions = ["PG", "SG", "SF", "PF", "C"];
    for (let i = 1; i <= 15; i++) {
      const playerId = uuid.v4() as string;
      const position =
        playerPositions[Math.floor(Math.random() * playerPositions.length)];
      const player = createPlayer(
        playerId,
        `${position} ${i}`,
        i.toString(),
        teamId,
        undefined,
      );

      // Add realistic game numbers
      player.gameNumbers = {
        wins: Math.floor(Math.random() * 6) + 1,
        losses: Math.floor(Math.random() * 3) + 1,
        draws: Math.floor(Math.random() * 1),
        gamesPlayed: 0,
      };
      player.gameNumbers.gamesPlayed =
        player.gameNumbers.wins +
        player.gameNumbers.losses +
        player.gameNumbers.draws;

      players[playerId] = player;
    }

    // Create sets for this team
    const setConfigs = [
      { name: "Starting Five", players: 5 },
      { name: "Second Unit", players: 5 },
      { name: "Defensive Lineup", players: 5 },
    ];

    setConfigs.forEach((setConfig) => {
      const setId = uuid.v4() as string;
      const set = createSet(setId, setConfig.name, teamId);

      // Add some stats to sets
      set.stats = {
        ...initialBaseStats,
        [Stat.Points]: Math.floor(Math.random() * 100) + 20,
        [Stat.Assists]: Math.floor(Math.random() * 50) + 10,
        [Stat.DefensiveRebounds]: Math.floor(Math.random() * 60) + 15,
      };
      set.runCount = Math.floor(Math.random() * 10) + 1;

      sets[setId] = set;
    });
  });

  // Create some games
  const opponents = [
    "Celtics",
    "Nets",
    "Heat",
    "Bulls",
    "Knicks",
    "76ers",
    "Raptors",
    "Pacers",
  ];
  const teamIds = Object.keys(teams);

  for (let i = 0; i < 10; i++) {
    const gameId = uuid.v4() as string;
    const teamId = teamIds[Math.floor(Math.random() * teamIds.length)];
    const opponent = opponents[Math.floor(Math.random() * opponents.length)];

    const game = createGame(gameId, teamId, opponent, PeriodType.Quarters);

    // Randomly finish some games
    if (Math.random() > 0.3) {
      game.isFinished = true;

      // Add some realistic period scores
      game.periods = [
        {
          [Team.Us]: Math.floor(Math.random() * 30) + 15,
          [Team.Opponent]: Math.floor(Math.random() * 30) + 15,
          playByPlay: [],
        },
        {
          [Team.Us]: Math.floor(Math.random() * 30) + 15,
          [Team.Opponent]: Math.floor(Math.random() * 30) + 15,
          playByPlay: [],
        },
        {
          [Team.Us]: Math.floor(Math.random() * 30) + 15,
          [Team.Opponent]: Math.floor(Math.random() * 30) + 15,
          playByPlay: [],
        },
        {
          [Team.Us]: Math.floor(Math.random() * 30) + 15,
          [Team.Opponent]: Math.floor(Math.random() * 30) + 15,
          playByPlay: [],
        },
      ];

      // Calculate totals
      const ourTotal = game.periods.reduce(
        (sum, period) => sum + period[Team.Us],
        0,
      );
      const oppTotal = game.periods.reduce(
        (sum, period) => sum + period[Team.Opponent],
        0,
      );

      game.statTotals[Team.Us][Stat.Points] = ourTotal;
      game.statTotals[Team.Opponent][Stat.Points] = oppTotal;
    }

    games[gameId] = game;
  }

  return {
    version: SEED_VERSION,
    timestamp: new Date().toISOString(),
    metadata: {
      name: "Full Season Seed",
      description:
        "2 teams, 30 players total, 10 games, multiple sets with realistic stats",
      deviceInfo: "Generated seed data",
    },
    stores: {
      teams,
      players,
      games,
      sets,
      teamCurrentId: currentTeamId,
    },
  };
}

/**
 * Edge cases seed: Data designed to test validation and edge cases
 */
function generateEdgeCasesSeed(): DebugSnapshot {
  const teams: Record<string, TeamType> = {};
  const players: Record<string, PlayerType> = {};
  const games: Record<string, GameType> = {};
  const sets: Record<string, SetType> = {};

  // Create team
  const teamId = uuid.v4() as string;
  const team = createTeam(teamId, "Test Team", undefined);
  teams[teamId] = team;

  // Create some players with edge case data
  const playerConfigs = [
    { name: "Normal Player", number: "1", hasIssues: false },
    {
      name: "Player with Wrong Team",
      number: "2",
      hasIssues: true,
      issue: "wrongTeam",
    },
    {
      name: "Player with Negative Stats",
      number: "3",
      hasIssues: true,
      issue: "negativeStats",
    },
    {
      name: "Player with Huge Stats",
      number: "4",
      hasIssues: true,
      issue: "hugeStats",
    },
    {
      name: "Player with Special Number 00",
      number: "00",
      hasIssues: true,
      issue: "specialNumber",
    },
  ];

  playerConfigs.forEach((config) => {
    const playerId = uuid.v4() as string;
    let player = createPlayer(
      playerId,
      config.name,
      config.number,
      teamId,
      undefined,
    );

    if (config.hasIssues) {
      switch (config.issue) {
        case "wrongTeam":
          player.teamId = "nonexistent-team-id";
          break;
        case "negativeStats":
          player.stats[Stat.Points] = -10;
          player.stats[Stat.Assists] = -5;
          break;
        case "hugeStats":
          player.stats[Stat.Points] = 99999;
          player.stats[Stat.Assists] = 50000;
          break;
        case "badNumber":
          // Already set number to 0
          break;
      }
    }

    players[playerId] = player;
  });

  // Create game with mismatched data
  const gameId = uuid.v4() as string;
  const game = createGame(gameId, teamId, "Test Opponent", PeriodType.Quarters);

  // Add players that don't exist
  game.activePlayers = [
    Object.keys(players)[0],
    "nonexistent-player-1",
    "nonexistent-player-2",
  ];
  game.gamePlayedList = Object.keys(players).slice(0, 2); // Mismatch with activePlayers

  // Add inconsistent stats
  game.statTotals[Team.Us][Stat.Points] = 100;
  game.statTotals[Team.Opponent][Stat.Points] = 95;

  // But periods don't add up
  game.periods = [
    { [Team.Us]: 20, [Team.Opponent]: 25, playByPlay: [] },
    { [Team.Us]: 30, [Team.Opponent]: 20, playByPlay: [] },
    { [Team.Us]: 25, [Team.Opponent]: 30, playByPlay: [] },
    { [Team.Us]: 30, [Team.Opponent]: 25, playByPlay: [] }, // Total: 105 vs 100 (mismatch)
  ];

  game.isFinished = true;
  games[gameId] = game;

  // Create set with orphaned teamId
  const setId = uuid.v4() as string;
  const set = createSet(setId, "Orphaned Set", "nonexistent-team-id");
  set.stats[Stat.Points] = -50; // Negative stats
  sets[setId] = set;

  // Create another set with valid team but extreme stats
  const validSetId = uuid.v4() as string;
  const validSet = createSet(validSetId, "Valid Set", teamId);
  validSet.runCount = -1; // Invalid run count
  sets[validSetId] = validSet;

  return {
    version: SEED_VERSION,
    timestamp: new Date().toISOString(),
    metadata: {
      name: "Edge Cases Seed",
      description:
        "Intentionally broken data to test validation and fixing capabilities",
      deviceInfo: "Generated seed data",
    },
    stores: {
      teams,
      players,
      games,
      sets,
      teamCurrentId: teamId,
    },
  };
}

/**
 * Gets description for seed types
 */
export function getSeedDescription(type: SeedType): string {
  switch (type) {
    case "minimal":
      return "1 team, 5 players, 1 game, 2 sets - perfect for basic testing";
    case "fullSeason":
      return "2 teams, 30 players total, 10 games, multiple sets with realistic stats";
    case "edgeCases":
      return "Intentionally broken data to test validation and fixing capabilities";
    default:
      return "Unknown seed type";
  }
}

/**
 * Gets the display name for seed types
 */
export function getSeedDisplayName(type: SeedType): string {
  switch (type) {
    case "minimal":
      return "Minimal Test Data";
    case "fullSeason":
      return "Full Season Data";
    case "edgeCases":
      return "Edge Cases & Validation Test";
    default:
      return type;
  }
}
