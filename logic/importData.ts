import { Team } from "@/types/game";
import { Stat, StatsType } from "@/types/stats";
import { Result } from "@/types/player";
import { StatLineExport, StatLineExportGame, ImportDecisions } from "@/types/statlineExport";

const SPECIAL_IDS = ["Opponent", "Team"];

/**
 * Remaps all player IDs in a game from original IDs to new IDs.
 * Preserves special IDs ("Opponent", "Team").
 */
export function remapGamePlayerIds(
  game: StatLineExportGame,
  playerIdMapping: Map<string, string>,
): StatLineExportGame {
  const remapId = (id: string): string => {
    if (SPECIAL_IDS.includes(id)) return id;
    return playerIdMapping.get(id) ?? id;
  };

  const remapIdList = (ids: string[]): string[] => ids.map(remapId);

  // Remap boxScore keys
  const newBoxScore: Record<string, StatsType> = {};
  for (const [oldId, stats] of Object.entries(game.boxScore)) {
    const newId = remapId(oldId);
    newBoxScore[newId] = stats;
  }

  // Remap periods - playByPlay entries
  const newPeriods = game.periods.map(period => {
    if (!period?.playByPlay) return period;
    return {
      ...period,
      playByPlay: period.playByPlay.map(play => ({
        ...play,
        playerId: remapId(play.playerId),
        activePlayers: play.activePlayers ? remapIdList(play.activePlayers) : undefined,
      })),
    };
  });

  return {
    ...game,
    boxScore: newBoxScore,
    gamePlayedList: remapIdList(game.gamePlayedList),
    activePlayers: remapIdList(game.activePlayers),
    periods: newPeriods,
  };
}

/**
 * Determines the game result from stat totals.
 */
function calculateResult(statTotals: { [Team.Us]: StatsType; [Team.Opponent]: StatsType }): Result {
  const us = statTotals[Team.Us][Stat.Points] || 0;
  const opp = statTotals[Team.Opponent][Stat.Points] || 0;
  if (us > opp) return Result.Win;
  if (us < opp) return Result.Loss;
  return Result.Draw;
}

// Store interfaces for dependency injection (testability)
export interface ImportGameStore {
  importGame: (gameData: {
    teamId: string;
    opposingTeamName: string;
    periodType: number;
    isFinished: boolean;
    statTotals: StatLineExportGame["statTotals"];
    boxScore: Record<string, StatsType>;
    periods: StatLineExportGame["periods"];
    gamePlayedList: string[];
    activePlayers: string[];
  }) => string;
}

export interface ImportTeamStore {
  addTeamSync: (name: string) => string;
  updateGamesPlayed: (teamId: string, result: Result) => void;
  batchUpdateStats: (updates: { teamId: string; stat: Stat; amount: number; team: Team }[]) => void;
}

export interface ImportPlayerStore {
  addPlayerSync: (name: string, number: string, teamId: string) => string;
  updateGamesPlayed: (playerId: string, result: Result) => void;
  batchUpdateStats: (updates: { playerId: string; stat: Stat; amount: number }[]) => void;
}

export interface ImportStores {
  gameStore: ImportGameStore;
  teamStore: ImportTeamStore;
  playerStore: ImportPlayerStore;
}

/**
 * Executes the full import process based on user decisions.
 * Returns the team ID of the imported/matched team.
 */
export function executeImport(
  exportData: StatLineExport,
  decisions: ImportDecisions,
  stores: ImportStores,
): string {
  // Step 1: Resolve team
  let teamId: string;
  if (decisions.team.type === "create") {
    teamId = stores.teamStore.addTeamSync(decisions.team.name);
  } else {
    teamId = decisions.team.existingTeamId;
  }

  // Step 2: Create new players and build full ID mapping
  const playerIdMapping = new Map<string, string>();

  for (const playerDecision of decisions.players) {
    if (playerDecision.type === "create") {
      const newId = stores.playerStore.addPlayerSync(
        playerDecision.name,
        playerDecision.number,
        teamId,
      );
      playerIdMapping.set(playerDecision.originalId, newId);
    } else {
      playerIdMapping.set(playerDecision.originalId, playerDecision.existingPlayerId);
    }
  }

  // Step 3: Import selected games
  const gamesToImport = exportData.games.filter(game => {
    const decision = decisions.games.find(d => d.originalId === game.originalId);
    return decision?.include === true;
  });

  const teamStatUpdates: {
    teamId: string;
    stat: Stat;
    amount: number;
    team: Team;
  }[] = [];
  const playerStatUpdates: {
    playerId: string;
    stat: Stat;
    amount: number;
  }[] = [];

  for (const game of gamesToImport) {
    // Remap player IDs
    const remappedGame = remapGamePlayerIds(game, playerIdMapping);

    // Insert the game
    stores.gameStore.importGame({
      teamId,
      opposingTeamName: remappedGame.opposingTeamName,
      periodType: remappedGame.periodType,
      isFinished: remappedGame.isFinished,
      statTotals: remappedGame.statTotals,
      boxScore: remappedGame.boxScore,
      periods: remappedGame.periods,
      gamePlayedList: remappedGame.gamePlayedList,
      activePlayers: remappedGame.activePlayers,
    });

    // Only update cumulative stats for finished games
    if (!remappedGame.isFinished) continue;

    const result = calculateResult(remappedGame.statTotals);

    // Update team game numbers
    stores.teamStore.updateGamesPlayed(teamId, result);

    // Accumulate team stat totals
    for (const statKey of Object.values(Stat)) {
      const usAmount = remappedGame.statTotals[Team.Us][statKey] || 0;
      if (usAmount !== 0) {
        teamStatUpdates.push({
          teamId,
          stat: statKey,
          amount: usAmount,
          team: Team.Us,
        });
      }
      const oppAmount = remappedGame.statTotals[Team.Opponent][statKey] || 0;
      if (oppAmount !== 0) {
        teamStatUpdates.push({
          teamId,
          stat: statKey,
          amount: oppAmount,
          team: Team.Opponent,
        });
      }
    }

    // Update player game numbers and accumulate player stats
    for (const playerId of remappedGame.gamePlayedList) {
      if (SPECIAL_IDS.includes(playerId)) continue;
      stores.playerStore.updateGamesPlayed(playerId, result);
    }

    // Accumulate player box score stats
    for (const [playerId, stats] of Object.entries(remappedGame.boxScore)) {
      if (SPECIAL_IDS.includes(playerId)) continue;
      for (const statKey of Object.values(Stat)) {
        const amount = stats[statKey] || 0;
        if (amount !== 0) {
          playerStatUpdates.push({
            playerId,
            stat: statKey,
            amount,
          });
        }
      }
    }
  }

  // Step 4: Batch update cumulative stats
  if (teamStatUpdates.length > 0) {
    stores.teamStore.batchUpdateStats(teamStatUpdates);
  }
  if (playerStatUpdates.length > 0) {
    stores.playerStore.batchUpdateStats(playerStatUpdates);
  }

  return teamId;
}
