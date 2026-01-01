import { initialBaseStats, StatsType } from "./stats";
export enum Result {
  Win = "wins",
  Loss = "losses",
  Draw = "draws",
}

export type GameNumbersType = {
  [Result.Win]: number;
  [Result.Loss]: number;
  [Result.Draw]: number;
  gamesPlayed: number;
};

export type PlayerType = {
  id: string;
  name: string;
  number: string;
  teamId: string;
  imageUri?: string;
  gameNumbers: GameNumbersType;
  stats: StatsType;
};

export const initialGameNumbers: GameNumbersType = {
  wins: 0,
  losses: 0,
  draws: 0,
  gamesPlayed: 0,
};

export const createPlayer = (
  id: string,
  name: string,
  number: string,
  teamId: string,
  imageUri?: string,
): PlayerType => ({
  id: id,
  name: name,
  number: number,
  teamId: teamId,
  imageUri: imageUri,
  gameNumbers: initialGameNumbers,
  stats: initialBaseStats,
});
