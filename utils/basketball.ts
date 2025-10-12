import { PlayByPlayType } from "@/types/game";
import { Stat } from "@/types/stats";

/**
 * Determines the number of points earned from a basketball action/stat
 * @param action - The basketball action (stat type)
 * @returns The points earned from the action
 */
export const getPointsForAction = (action: Stat): number => {
  switch (action) {
    case Stat.ThreePointMakes:
      return 3;
    case Stat.TwoPointMakes:
      return 2;
    case Stat.FreeThrowsMade:
      return 1;
    default:
      return 0;
  }
};

/**
 * Determines the number of points earned from a single play
 * @param play - The play-by-play entry
 * @returns The points earned from the play
 */
export const getPointsForPlay = (play: PlayByPlayType): number => {
  return getPointsForAction(play.action);
};

/**
 * Formats a shooting percentage, returning "-" if there are no attempts
 * @param makes - Number of made shots
 * @param attempts - Number of attempted shots
 * @param decimals - Number of decimal places (default 1)
 * @returns Formatted percentage string (e.g., "45.2%" or "-")
 */
export const formatPercentage = (makes: number, attempts: number, decimals: number = 1): string => {
  if (attempts === 0 || isNaN(attempts) || isNaN(makes)) {
    return "-";
  }
  const percentage = (makes / attempts) * 100;
  return `${percentage.toFixed(decimals)}%`;
};
