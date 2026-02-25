import { PeriodType, Team } from "@/types/game";
import { Stat, StatsType } from "@/types/stats";
import { PlayerType } from "@/types/player";
import { GameType } from "@/types/game";
import { StatLineExport, StatLineExportGame, StatLineExportPlayer } from "@/types/statlineExport";

export type ValidationResult =
  | { isValid: true; export: StatLineExport; errors: [] }
  | { isValid: false; export: null; errors: string[] };

const STAT_KEYS = Object.values(Stat);

function isStatsType(obj: unknown): obj is StatsType {
  if (!obj || typeof obj !== "object") return false;
  const record = obj as Record<string, unknown>;
  return STAT_KEYS.every(key => typeof record[key] === "number");
}

function isValidPeriodType(value: unknown): value is PeriodType {
  return value === PeriodType.Halves || value === PeriodType.Quarters;
}

function validatePlayer(player: unknown, index: number): string[] {
  const errors: string[] = [];
  if (!player || typeof player !== "object") {
    errors.push(`players[${index}]: must be an object`);
    return errors;
  }
  const p = player as Record<string, unknown>;
  if (typeof p.originalId !== "string" || !p.originalId) {
    errors.push(`players[${index}].originalId: must be a non-empty string`);
  }
  if (typeof p.name !== "string") {
    errors.push(`players[${index}].name: must be a string`);
  }
  if (typeof p.number !== "string") {
    errors.push(`players[${index}].number: must be a string`);
  }
  return errors;
}

function validateGame(game: unknown, index: number): string[] {
  const errors: string[] = [];
  if (!game || typeof game !== "object") {
    errors.push(`games[${index}]: must be an object`);
    return errors;
  }
  const g = game as Record<string, unknown>;

  if (typeof g.originalId !== "string" || !g.originalId) {
    errors.push(`games[${index}].originalId: must be a non-empty string`);
  }
  if (typeof g.opposingTeamName !== "string") {
    errors.push(`games[${index}].opposingTeamName: must be a string`);
  }
  if (!isValidPeriodType(g.periodType)) {
    errors.push(
      `games[${index}].periodType: must be ${PeriodType.Halves} or ${PeriodType.Quarters}`,
    );
  }
  if (typeof g.isFinished !== "boolean") {
    errors.push(`games[${index}].isFinished: must be a boolean`);
  }

  // statTotals
  if (!g.statTotals || typeof g.statTotals !== "object") {
    errors.push(`games[${index}].statTotals: must be an object`);
  } else {
    const st = g.statTotals as Record<string, unknown>;
    if (!isStatsType(st[Team.Us])) {
      errors.push(`games[${index}].statTotals[Us]: invalid stats`);
    }
    if (!isStatsType(st[Team.Opponent])) {
      errors.push(`games[${index}].statTotals[Opponent]: invalid stats`);
    }
  }

  // boxScore
  if (!g.boxScore || typeof g.boxScore !== "object") {
    errors.push(`games[${index}].boxScore: must be an object`);
  }

  // periods
  if (!Array.isArray(g.periods)) {
    errors.push(`games[${index}].periods: must be an array`);
  }

  // gamePlayedList
  if (!Array.isArray(g.gamePlayedList)) {
    errors.push(`games[${index}].gamePlayedList: must be an array`);
  }

  // activePlayers
  if (!Array.isArray(g.activePlayers)) {
    errors.push(`games[${index}].activePlayers: must be an array`);
  }

  return errors;
}

/**
 * Validates a parsed JSON object against the StatLineExport schema.
 */
export function validateStatLineFile(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, export: null, errors: ["Root: must be an object"] };
  }

  const d = data as Record<string, unknown>;

  // Version
  if (d.version !== 1) {
    errors.push(`version: must be 1, got ${d.version}`);
  }

  // Export date
  if (typeof d.exportDate !== "string") {
    errors.push("exportDate: must be a string");
  }

  // Team
  if (!d.team || typeof d.team !== "object") {
    errors.push("team: must be an object");
  } else {
    const team = d.team as Record<string, unknown>;
    if (typeof team.name !== "string" || !team.name) {
      errors.push("team.name: must be a non-empty string");
    }
  }

  // Players
  if (!Array.isArray(d.players)) {
    errors.push("players: must be an array");
  } else {
    d.players.forEach((p: unknown, i: number) => {
      errors.push(...validatePlayer(p, i));
    });
  }

  // Games
  if (!Array.isArray(d.games)) {
    errors.push("games: must be an array");
  } else {
    if (d.games.length === 0) {
      errors.push("games: must contain at least one game");
    }
    d.games.forEach((g: unknown, i: number) => {
      errors.push(...validateGame(g, i));
    });
  }

  if (errors.length > 0) {
    return { isValid: false, export: null, errors };
  }

  return { isValid: true, export: data as StatLineExport, errors: [] };
}

/**
 * Detects duplicate games by matching opponent name (case-insensitive) + scores + isFinished.
 * Returns a Map from incoming game originalId to existing game ID (or null if no match).
 */
export function detectDuplicateGames(
  incoming: StatLineExportGame[],
  existing: GameType[],
): Map<string, string | null> {
  const result = new Map<string, string | null>();

  for (const incomingGame of incoming) {
    let matchId: string | null = null;

    for (const existingGame of existing) {
      const nameMatch =
        incomingGame.opposingTeamName.toLowerCase() === existingGame.opposingTeamName.toLowerCase();

      const usScore = incomingGame.statTotals[Team.Us][Stat.Points];
      const oppScore = incomingGame.statTotals[Team.Opponent][Stat.Points];
      const existUsScore = existingGame.statTotals[Team.Us][Stat.Points];
      const existOppScore = existingGame.statTotals[Team.Opponent][Stat.Points];

      const scoreMatch = usScore === existUsScore && oppScore === existOppScore;
      const finishedMatch = incomingGame.isFinished === existingGame.isFinished;

      if (nameMatch && scoreMatch && finishedMatch) {
        matchId = existingGame.id;
        break;
      }
    }

    result.set(incomingGame.originalId, matchId);
  }

  return result;
}

/**
 * Auto-matches incoming players to existing players.
 * First pass: exact name match (case-insensitive).
 * Second pass: name + number match for disambiguation.
 * Returns a Map from incoming player originalId to existing player ID (or null if no match).
 */
export function autoMatchPlayers(
  incoming: StatLineExportPlayer[],
  existing: PlayerType[],
): Map<string, string | null> {
  const result = new Map<string, string | null>();

  // Build lookup by lowercase name
  const existingByName = new Map<string, PlayerType[]>();
  for (const player of existing) {
    const key = player.name.toLowerCase();
    if (!existingByName.has(key)) {
      existingByName.set(key, []);
    }
    existingByName.get(key)!.push(player);
  }

  for (const incomingPlayer of incoming) {
    const nameKey = incomingPlayer.name.toLowerCase();
    const candidates = existingByName.get(nameKey);

    if (!candidates || candidates.length === 0) {
      result.set(incomingPlayer.originalId, null);
      continue;
    }

    if (candidates.length === 1) {
      // Unique name match
      result.set(incomingPlayer.originalId, candidates[0].id);
      continue;
    }

    // Multiple candidates - try name + number
    const numberMatch = candidates.find(c => c.number === incomingPlayer.number);
    if (numberMatch) {
      result.set(incomingPlayer.originalId, numberMatch.id);
    } else {
      // Ambiguous - take first match but could be improved
      result.set(incomingPlayer.originalId, candidates[0].id);
    }
  }

  return result;
}
