import { PeriodType, PeriodInfo, Team } from "./game";
import { SetType } from "./set";
import { StatsType } from "./stats";

export interface StatLineExportPlayer {
  originalId: string;
  name: string;
  number: string;
}

export interface StatLineExportSet {
  originalId: string;
  name: string;
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
  sets: Record<string, SetType>;
  activeSets: string[];
}

export interface StatLineExport {
  version: 1;
  exportDate: string;
  team: { name: string };
  players: StatLineExportPlayer[];
  games: StatLineExportGame[];
  sets: StatLineExportSet[];
}

// Import wizard decision types
export type TeamDecision =
  | { type: "create"; name: string }
  | { type: "match"; existingTeamId: string };

export type PlayerDecision =
  | { type: "create"; originalId: string; name: string; number: string }
  | { type: "match"; originalId: string; existingPlayerId: string };

export type SetDecision =
  | { type: "create"; originalId: string; name: string }
  | { type: "match"; originalId: string; existingSetId: string };

export type GameDecision = {
  originalId: string;
  include: boolean;
};

export interface ImportDecisions {
  team: TeamDecision;
  players: PlayerDecision[];
  games: GameDecision[];
  sets: SetDecision[];
}
