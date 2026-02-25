import { GameType } from "@/types/game";
import { PlayerType } from "@/types/player";
import { SetType } from "@/types/set";
import { StatLineExport, StatLineExportPlayer, StatLineExportSet } from "@/types/statlineExport";

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
 * Collects all unique set IDs referenced in a game's data.
 * Checks game.sets keys, game.activeSets, and play-by-play setId entries.
 */
function collectSetIdsFromGame(game: GameType): Set<string> {
  const ids = new Set<string>();

  for (const id of Object.keys(game.sets)) {
    ids.add(id);
  }

  for (const id of game.activeSets) {
    ids.add(id);
  }

  for (const period of game.periods) {
    if (!period?.playByPlay) continue;
    for (const play of period.playByPlay) {
      if (play.setId) {
        ids.add(play.setId);
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
  setsRecord: Record<string, SetType> = {},
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

  // Collect all unique set IDs across all games
  const allSetIds = new Set<string>();
  for (const game of games) {
    const gameSetIds = collectSetIdsFromGame(game);
    for (const id of gameSetIds) {
      allSetIds.add(id);
    }
  }

  // Build set list - use global set store name, fallback to game.sets name
  const sets: StatLineExportSet[] = Array.from(allSetIds).map(id => {
    const globalSet = setsRecord[id];
    if (globalSet) {
      return { originalId: id, name: globalSet.name };
    }
    // Fallback: find name from any game's sets
    for (const game of games) {
      if (game.sets[id]) {
        return { originalId: id, name: game.sets[id].name };
      }
    }
    return { originalId: id, name: "Unknown Set" };
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
    sets: game.sets,
    activeSets: game.activeSets,
  }));

  return {
    version: 1,
    exportDate: new Date().toISOString(),
    team: { name: teamName },
    players,
    games: exportGames,
    sets,
  };
}
