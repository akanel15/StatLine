import { useTeamStore } from "@/store/teamStore";
import { usePlayerStore } from "@/store/playerStore";
import { useSetStore } from "@/store/setStore";
import { PeriodType } from "@/types/game";
import { simulateGame } from "@/utils/debug/gameSimulator";

export interface PlayerData {
  name: string;
  number: string;
}

export interface TeamSetupConfig {
  teamName: string;
  players: PlayerData[];
  sets: string[];
}

/**
 * Creates a complete team with players and sets
 * Returns the team ID for navigation
 */
export async function setupTeam(config: TeamSetupConfig): Promise<string> {
  const { teamName, players, sets } = config;

  // Create the team
  await useTeamStore.getState().addTeam(teamName);

  // Get fresh state to access the newly created team by name
  const freshTeamState = useTeamStore.getState();
  const allTeams = Object.values(freshTeamState.teams);
  const newTeam = allTeams.find((t) => t.name === teamName);

  if (!newTeam) {
    throw new Error(`Failed to create team "${teamName}"`);
  }

  const teamId = newTeam.id;

  // Add all players
  for (const player of players) {
    await usePlayerStore.getState().addPlayer(player.name, player.number, teamId);
    // Small delay to ensure proper ordering
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Add all sets
  for (const setName of sets) {
    useSetStore.getState().addSet(setName, teamId);
  }

  // Set as current team
  useTeamStore.getState().setCurrentTeamId(teamId);

  return teamId;
}

/**
 * Predefined team: Vikes Div 1 Men
 */
export const VIKES_DIV1_MEN_CONFIG: TeamSetupConfig = {
  teamName: "Vikes Div 1 Men",
  players: [
    { name: "Nick Kanellis", number: "24" },
    { name: "Alex Kanellis", number: "15" },
    { name: "Jake Heath", number: "50" },
    { name: "Caleb Bruggeman", number: "43" },
    { name: "Matt Hart", number: "11" },
    { name: "Cormac Bohanna", number: "4" },
    { name: "Joshua Hamilton", number: "70" },
    { name: "Mike Zuccolo", number: "41" },
    { name: "Liam Costello", number: "18" },
    { name: "Ian Baker", number: "37" },
  ],
  sets: ["Flow", "Irish", "Downs"],
};

/**
 * Demo teams for App Store screenshots
 * 6 teams with varying player counts
 */
export const DEMO_TEAMS_CONFIG: TeamSetupConfig[] = [
  // Reversed order so Vikes (last) appears at top of team list
  {
    teamName: "Valley Titans",
    players: [
      { name: "Lily C", number: "9" },
      { name: "Chloe P", number: "18" },
      { name: "Grace F", number: "27" },
      { name: "Zoe M", number: "35" },
      { name: "Ella R", number: "2" },
      { name: "Scarlett J", number: "40" },
    ],
    sets: [],
  },
  {
    teamName: "Central Cougars",
    players: [
      { name: "Charlotte B", number: "13" },
      { name: "Amelia D", number: "24" },
      { name: "Harper L", number: "31" },
      { name: "Evelyn G", number: "42" },
      { name: "Abigail N", number: "6" },
      { name: "Emily H", number: "19" },
    ],
    sets: [],
  },
  {
    teamName: "Riverside Hawks",
    players: [
      { name: "Emma S", number: "10" },
      { name: "Olivia M", number: "25" },
      { name: "Sophia R", number: "30" },
      { name: "Ava T", number: "14" },
      { name: "Mia K", number: "3" },
      { name: "Isabella W", number: "32" },
    ],
    sets: [],
  },
  {
    teamName: "U18 Storm",
    players: [
      { name: "Tyler H", number: "12" },
      { name: "Brandon S", number: "23" },
      { name: "Kevin D", number: "34" },
      { name: "Marcus J", number: "45" },
      { name: "Derek F", number: "8" },
      { name: "Aaron C", number: "21" },
    ],
    sets: [],
  },
  {
    teamName: "U16 Warriors",
    players: [
      { name: "Ryan M", number: "11" },
      { name: "Jake T", number: "22" },
      { name: "Dylan P", number: "33" },
      { name: "Ethan R", number: "44" },
      { name: "Mason L", number: "55" },
      { name: "Lucas W", number: "7" },
    ],
    sets: [],
  },
  {
    teamName: "Vikes",
    players: [
      { name: "Alex K", number: "15" },
      { name: "Caleb B", number: "43" },
      { name: "Josh H", number: "70" },
      { name: "Nick K", number: "24" },
      { name: "Chris K", number: "17" },
      { name: "Shaun C", number: "5" },
      { name: "Matt C", number: "20" },
      { name: "Cormac B", number: "4" },
    ],
    sets: ["Flow", "Bolt", "Hook", "Cross"],
  },
];

/**
 * Creates all demo teams for App Store screenshots
 * Returns array of created team IDs
 */
export async function setupDemoTeams(): Promise<string[]> {
  const teamIds: string[] = [];

  for (const config of DEMO_TEAMS_CONFIG) {
    const teamId = await setupTeam(config);
    teamIds.push(teamId);
  }

  return teamIds;
}

// ============================================================
// Game Simulation
// ============================================================

/**
 * Pool of one-word opponent team names
 */
const OPPONENT_NAMES = [
  "Warriors",
  "Giants",
  "Redbacks",
  "Champs",
  "Thunder",
  "Blazers",
  "Rockets",
  "Eagles",
  "Wolves",
  "Panthers",
  "Spartans",
  "Tigers",
  "Knights",
  "Falcons",
  "Bulls",
];

/**
 * Number of games to simulate per demo team
 */
export const DEMO_GAME_COUNTS: Record<string, number> = {
  Vikes: 12,
  "U16 Warriors": 8,
  "U18 Storm": 6,
  "Riverside Hawks": 4,
  "Central Cougars": 3,
  "Valley Titans": 2,
};

export interface SimulationProgress {
  currentTeam: string;
  currentGame: number;
  totalGamesForTeam: number;
  completedGames: number;
  totalGames: number;
}

/**
 * Get opponents for a team, avoiding name conflicts
 */
function getOpponentsForTeam(teamName: string, count: number): string[] {
  // Filter out opponent names that match team name
  const available = OPPONENT_NAMES.filter(
    (name) => !teamName.toLowerCase().includes(name.toLowerCase()),
  );

  // Shuffle and pick, allowing repeats if needed
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const opponents: string[] = [];

  for (let i = 0; i < count; i++) {
    opponents.push(shuffled[i % shuffled.length]);
  }

  return opponents;
}

/**
 * Simulates games for a single team in batches
 */
async function simulateGamesForTeam(
  teamId: string,
  teamName: string,
  gameCount: number,
  completedBefore: number,
  totalGames: number,
  onProgress?: (progress: SimulationProgress) => void,
): Promise<number> {
  const opponents = getOpponentsForTeam(teamName, gameCount);
  const BATCH_SIZE = 1;
  let completedGames = completedBefore;

  for (let i = 0; i < gameCount; i += BATCH_SIZE) {
    const batch = opponents.slice(i, Math.min(i + BATCH_SIZE, gameCount));

    // Simulate batch in parallel
    await Promise.all(
      batch.map((opponent) =>
        simulateGame({
          teamId,
          opponentName: opponent,
          targetScore: { min: 80, max: 100 },
          opponentScore: { min: 70, max: 95 },
          periodType: PeriodType.Quarters,
          realism: "medium",
        }),
      ),
    );

    completedGames += batch.length;

    // Report progress
    onProgress?.({
      currentTeam: teamName,
      currentGame: Math.min(i + BATCH_SIZE, gameCount),
      totalGamesForTeam: gameCount,
      completedGames,
      totalGames,
    });

    // Delay between batches to prevent memory issues
    if (i + BATCH_SIZE < gameCount) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return completedGames;
}

/**
 * Simulates demo games for all demo teams
 * Processes games in batches to prevent app crashes
 */
export async function simulateDemoGames(
  onProgress?: (progress: SimulationProgress) => void,
): Promise<void> {
  const teamStore = useTeamStore.getState();
  const allTeams = Object.values(teamStore.teams);

  // Calculate total games
  const totalGames = Object.values(DEMO_GAME_COUNTS).reduce((sum, count) => sum + count, 0);
  let completedGames = 0;

  // Process each team
  for (const teamConfig of DEMO_TEAMS_CONFIG) {
    const gameCount = DEMO_GAME_COUNTS[teamConfig.teamName];
    if (!gameCount) continue;

    // Find the team by name
    const team = allTeams.find((t) => t.name === teamConfig.teamName);
    if (!team) {
      console.warn(`Team "${teamConfig.teamName}" not found, skipping game simulation`);
      continue;
    }

    completedGames = await simulateGamesForTeam(
      team.id,
      team.name,
      gameCount,
      completedGames,
      totalGames,
      onProgress,
    );

    // Delay between teams to allow memory cleanup
    await new Promise((r) => setTimeout(r, 3000));
  }
}
