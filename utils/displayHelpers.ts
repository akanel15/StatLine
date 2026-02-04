import { usePlayerStore } from "@/store/playerStore";
import { useSetStore } from "@/store/setStore";
import { PlayerType } from "@/types/player";
import { SetType } from "@/types/set";

/**
 * Gets a player by ID or returns an unknown player placeholder
 */
export const getPlayerOrUnknown = (playerId: string): PlayerType | null => {
  const players = usePlayerStore.getState().players;
  return players[playerId] || null;
};

/**
 * Gets a set by ID or returns an unknown set placeholder
 */
export const getSetOrUnknown = (setId: string): SetType | null => {
  const sets = useSetStore.getState().sets;
  return sets[setId] || null;
};

/**
 * Gets player display name with unknown fallback
 */
export const getPlayerDisplayName = (playerId: string): string => {
  if (playerId === "Opponent") {
    return "Opponent";
  }

  if (playerId === "Team") {
    return "Team";
  }

  const player = getPlayerOrUnknown(playerId);
  return player ? player.name : "Unknown Player";
};

/**
 * Gets player display name with number and unknown fallback
 */
export const getPlayerDisplayNameWithNumber = (playerId: string): string => {
  if (playerId === "Opponent") {
    return "Opponent";
  }

  if (playerId === "Team") {
    return "Team";
  }

  const player = getPlayerOrUnknown(playerId);
  return player ? `${player.name} (#${player.number})` : "Unknown Player";
};

/**
 * Gets set display name with unknown fallback
 */
export const getSetDisplayName = (setId: string): string => {
  const set = getSetOrUnknown(setId);
  return set ? set.name : "Unknown Set";
};

/**
 * Checks if a player exists
 */
export const playerExists = (playerId: string): boolean => {
  if (playerId === "Opponent") return true;
  if (playerId === "Team") return true;
  return getPlayerOrUnknown(playerId) !== null;
};

/**
 * Checks if a set exists
 */
export const setExists = (setId: string): boolean => {
  return getSetOrUnknown(setId) !== null;
};
