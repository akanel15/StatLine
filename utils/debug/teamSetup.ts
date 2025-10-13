import { useTeamStore } from "@/store/teamStore";
import { usePlayerStore } from "@/store/playerStore";
import { useSetStore } from "@/store/setStore";

export interface PlayerData {
  name: string;
  number: number;
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

  // Get fresh state to access the newly created team
  const freshTeamState = useTeamStore.getState();
  const allTeams = Object.values(freshTeamState.teams);
  const newTeam = allTeams[0]; // Teams are added to the front of the list

  if (!newTeam) {
    throw new Error("Failed to create team");
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
    { name: "Nick Kanellis", number: 24 },
    { name: "Alex Kanellis", number: 15 },
    { name: "Jake Heath", number: 50 },
    { name: "Caleb Bruggeman", number: 43 },
    { name: "Matt Hart", number: 11 },
    { name: "Cormac Bohanna", number: 4 },
    { name: "Joshua Hamilton", number: 70 },
    { name: "Mike Zuccolo", number: 41 },
    { name: "Liam Costello", number: 18 },
    { name: "Ian Baker", number: 37 },
  ],
  sets: ["Flow", "Irish", "Downs"],
};
