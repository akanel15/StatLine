import { Stat } from "@/types/stats";
import { PlayerType, GameNumbersType } from "@/types/player";
import { TeamType } from "@/types/team";
import { Team } from "@/types/game";
import { calculatePlayerAverages } from "./playerAverages";

/**
 * Format a stat value for display on a card (removes unnecessary decimals)
 * @param value - The stat value to format
 * @returns Formatted string without decimal for whole numbers, 1 decimal otherwise
 */
export function formatStatForCard(value: number): string {
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
}

/**
 * Calculate team's points per game average
 * @param team - The team object
 * @returns Team's PPG or 0 if no games played
 */
export function calculateTeamPPG(team: TeamType): number {
  const gamesPlayed = team.gameNumbers.gamesPlayed;
  if (gamesPlayed === 0) {
    return 0;
  }

  const totalPoints = team.stats[Team.Us][Stat.Points];
  return totalPoints / gamesPlayed;
}

/**
 * Calculate player card statistics (PPG, RPG, APG, games played)
 * @param player - The player object
 * @returns Object with ppg, rpg, apg, and gamesPlayed
 */
export function calculatePlayerCardStats(player: PlayerType): {
  ppg: number;
  rpg: number;
  apg: number;
  gamesPlayed: number;
} {
  const gamesPlayed = player.gameNumbers.gamesPlayed;

  if (gamesPlayed === 0) {
    return {
      ppg: 0,
      rpg: 0,
      apg: 0,
      gamesPlayed: 0,
    };
  }

  const averages = calculatePlayerAverages(player.stats, gamesPlayed);

  // Calculate total rebounds per game (offensive + defensive)
  const rpg = averages[Stat.OffensiveRebounds] + averages[Stat.DefensiveRebounds];

  return {
    ppg: averages[Stat.Points],
    rpg,
    apg: averages[Stat.Assists],
    gamesPlayed,
  };
}

/**
 * Format game numbers into a W-L-D record string
 * @param gameNumbers - The game numbers object
 * @returns Formatted record string (e.g., "5-2-1")
 */
export function formatRecord(gameNumbers: GameNumbersType): string {
  const wins = gameNumbers.wins;
  const losses = gameNumbers.losses;
  const draws = gameNumbers.draws;

  return `${wins}-${losses}-${draws}`;
}
