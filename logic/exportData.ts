import { GameType } from "@/types/game";
import { PlayerType } from "@/types/player";
import { StatLineExport, StatLineExportPlayer } from "@/types/statlineExport";

const SPECIAL_IDS = ["Opponent", "Team"];

/**
 * Collects all unique player IDs referenced in a game's data.
 * Checks boxScore keys, gamePlayedList, activePlayers, and play-by-play entries.
 */
function collectPlayerIdsFromGame(game: GameType): Set<string> {
  const ids = new Set<string>();

  // Box score keys
  for (const id of Object.keys(game.boxScore)) {
    if (!SPECIAL_IDS.includes(id)) {
      ids.add(id);
    }
  }

  // Game played list
  for (const id of game.gamePlayedList) {
    if (!SPECIAL_IDS.includes(id)) {
      ids.add(id);
    }
  }

  // Active players
  for (const id of game.activePlayers) {
    if (!SPECIAL_IDS.includes(id)) {
      ids.add(id);
    }
  }

  // Play-by-play entries across all periods
  for (const period of game.periods) {
    if (!period?.playByPlay) continue;
    for (const play of period.playByPlay) {
      if (!SPECIAL_IDS.includes(play.playerId)) {
        ids.add(play.playerId);
      }
      // Active players stored on individual plays (for stat reversal)
      if (play.activePlayers) {
        for (const id of play.activePlayers) {
          if (!SPECIAL_IDS.includes(id)) {
            ids.add(id);
          }
        }
      }
    }
  }

  return ids;
}

/**
 * Builds a StatLineExport package from the given team name, games, and player lookup.
 * Players not found in the lookup are exported as "Unknown Player".
 */
export function buildExportPackage(
  teamName: string,
  games: GameType[],
  playersRecord: Record<string, PlayerType>,
): StatLineExport {
  // Collect all unique player IDs across all games
  const allPlayerIds = new Set<string>();
  for (const game of games) {
    const gamePlayerIds = collectPlayerIdsFromGame(game);
    for (const id of gamePlayerIds) {
      allPlayerIds.add(id);
    }
  }

  // Build player list - handle deleted players gracefully
  const players: StatLineExportPlayer[] = Array.from(allPlayerIds).map(id => {
    const player = playersRecord[id];
    return {
      originalId: id,
      name: player?.name ?? "Unknown Player",
      number: player?.number ?? "",
    };
  });

  // Build game list
  const exportGames = games.map(game => ({
    originalId: game.id,
    opposingTeamName: game.opposingTeamName,
    periodType: game.periodType,
    isFinished: game.isFinished,
    statTotals: game.statTotals,
    boxScore: game.boxScore,
    periods: game.periods,
    gamePlayedList: game.gamePlayedList,
    activePlayers: game.activePlayers,
  }));

  return {
    version: 1,
    exportDate: new Date().toISOString(),
    team: { name: teamName },
    players,
    games: exportGames,
  };
}
