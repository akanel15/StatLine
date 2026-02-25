import { PeriodType, PeriodInfo, Team } from "./game";
import { StatsType } from "./stats";

export interface StatLineExportPlayer {
  originalId: string;
  name: string;
  number: string;
}

export interface StatLineExportGame {
  originalId: string;
  opposingTeamName: string;
  periodType: PeriodType;
  isFinished: boolean;
  statTotals: { [Team.Us]: StatsType; [Team.Opponent]: StatsType };
  boxScore: Record<string, StatsType>; // keyed by original player ID
  periods: PeriodInfo[];
  gamePlayedList: string[];
  activePlayers: string[];
}

export interface StatLineExport {
  version: 1;
  exportDate: string;
  team: { name: string };
  players: StatLineExportPlayer[];
  games: StatLineExportGame[];
}

// Import wizard decision types
export type TeamDecision =
  | { type: "create"; name: string }
  | { type: "match"; existingTeamId: string };

export type PlayerDecision =
  | { type: "create"; originalId: string; name: string; number: string }
  | { type: "match"; originalId: string; existingPlayerId: string };

export type GameDecision = {
  originalId: string;
  include: boolean;
};

export interface ImportDecisions {
  team: TeamDecision;
  players: PlayerDecision[];
  games: GameDecision[];
}
