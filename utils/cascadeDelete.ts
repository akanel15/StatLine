import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { useSetStore } from "@/store/setStore";
import { useTeamStore } from "@/store/teamStore";
import { calculateGameResult } from "@/logic/gameCompletion";
import { Team } from "@/types/game";
import { Stat } from "@/types/stats";

export type CascadeDeletionInfo = {
  games: { id: string; name: string }[];
  players: { id: string; name: string }[];
  sets: { id: string; name: string }[];
};

export function getTeamDeletionInfo(teamId: string): CascadeDeletionInfo {
  const games = useGameStore.getState().games;
  const players = usePlayerStore.getState().players;
  const sets = useSetStore.getState().sets;

  const teamGames = Object.values(games)
    .filter(game => game.teamId === teamId)
    .map(game => ({
      id: game.id,
      name: `vs ${game.opposingTeamName}`,
    }));

  const teamPlayers = Object.values(players)
    .filter(player => player.teamId === teamId)
    .map(player => ({
      id: player.id,
      name: player.name,
    }));

  const teamSets = Object.values(sets)
    .filter(set => set.teamId === teamId)
    .map(set => ({
      id: set.id,
      name: set.name,
    }));

  return {
    games: teamGames,
    players: teamPlayers,
    sets: teamSets,
  };
}

export function getPlayerDeletionInfo(playerId: string): CascadeDeletionInfo {
  const games = useGameStore.getState().games;

  const playerGames = Object.values(games)
    .filter(
      game =>
        game.boxScore[playerId] !== undefined ||
        game.activePlayers.includes(playerId) ||
        game.gamePlayedList.includes(playerId),
    )
    .map(game => ({
      id: game.id,
      name: `vs ${game.opposingTeamName}`,
    }));

  return {
    games: playerGames,
    players: [],
    sets: [],
  };
}

export function cascadeDeleteTeam(teamId: string): void {
  const deletionInfo = getTeamDeletionInfo(teamId);

  // Delete all games for this team using proper cascading deletion
  deletionInfo.games.forEach(game => {
    cascadeDeleteGame(game.id);
  });

  // Delete all players for this team
  deletionInfo.players.forEach(player => {
    usePlayerStore.getState().removePlayer(player.id);
  });

  // Delete all sets for this team
  deletionInfo.sets.forEach(set => {
    useSetStore.getState().removeSet(set.id);
  });

  // Finally delete the team
  useTeamStore.getState().removeTeam(teamId);
}

export function getSetDeletionInfo(setId: string): CascadeDeletionInfo {
  const games = useGameStore.getState().games;

  const setGames = Object.values(games)
    .filter(game => game.sets[setId] !== undefined || game.activeSets.includes(setId))
    .map(game => ({
      id: game.id,
      name: `vs ${game.opposingTeamName}`,
    }));

  return {
    games: setGames,
    players: [],
    sets: [],
  };
}

export function cascadeDeletePlayer(playerId: string): void {
  const deletionInfo = getPlayerDeletionInfo(playerId);

  // Remove player from all games where they appear
  deletionInfo.games.forEach(game => {
    const gameState = useGameStore.getState().games[game.id];
    if (gameState) {
      // Remove from active players
      const newActivePlayers = gameState.activePlayers.filter(id => id !== playerId);
      useGameStore.getState().setActivePlayers(game.id, newActivePlayers);

      // Remove from game played list
      // Note: We keep their box score stats for historical record
    }
  });

  // Delete the player
  usePlayerStore.getState().removePlayer(playerId);
}

export function cascadeDeleteSet(setId: string): void {
  const deletionInfo = getSetDeletionInfo(setId);

  // Remove set from all games where it appears
  deletionInfo.games.forEach(game => {
    const gameState = useGameStore.getState().games[game.id];
    if (gameState) {
      // Remove from active sets
      const newActiveSets = gameState.activeSets.filter(id => id !== setId);
      useGameStore.getState().setActiveSets(game.id, newActiveSets);

      // Note: We keep set stats in games for historical record
    }
  });

  // Delete the set
  useSetStore.getState().removeSet(setId);
}

export function cascadeDeleteGame(gameId: string): void {
  const gameStore = useGameStore.getState();
  const teamStore = useTeamStore.getState();
  const playerStore = usePlayerStore.getState();
  const setStore = useSetStore.getState();

  const game = gameStore.games[gameId];
  if (!game) {
    console.warn(`Game with ID ${gameId} not found. Cannot delete.`);
    return;
  }

  // Only revert game counts and stats if the game was finished (had counts applied)
  if (game.isFinished) {
    const result = calculateGameResult(game);

    // 1. Revert team game numbers
    teamStore.revertGameNumbers(game.teamId, result);

    // 2. Revert team stats (both Us and Opponent)
    Object.entries(game.statTotals[Team.Us]).forEach(([stat, value]) => {
      if (value !== 0) {
        teamStore.updateStats(game.teamId, stat as Stat, -value, Team.Us);
      }
    });

    Object.entries(game.statTotals[Team.Opponent]).forEach(([stat, value]) => {
      if (value !== 0) {
        teamStore.updateStats(game.teamId, stat as Stat, -value, Team.Opponent);
      }
    });

    // 3. Revert player game numbers and stats
    game.gamePlayedList.forEach(playerId => {
      if (playerStore.players[playerId]) {
        playerStore.revertGameNumbers(playerId, result);

        // Revert player's box score stats if they have any
        const playerBoxScore = game.boxScore[playerId];
        if (playerBoxScore) {
          Object.entries(playerBoxScore).forEach(([stat, value]) => {
            if (value !== 0) {
              playerStore.updateStats(playerId, stat as Stat, -value);
            }
          });
        }
      }
    });

    // 4. Revert set stats and run counts
    Object.entries(game.sets).forEach(([setId, setData]) => {
      if (setStore.sets[setId]) {
        // Revert set stats
        Object.entries(setData.stats).forEach(([stat, value]) => {
          if (value !== 0) {
            setStore.updateStats(setId, stat as Stat, -value);
          }
        });

        // Decrement run count for each run in this game
        for (let i = 0; i < setData.runCount; i++) {
          setStore.decrementRunCount(setId);
        }
      }
    });

    console.log(`Reverted game counts and stats for finished game ${gameId} (${result})`);
  }

  // Finally, delete the game
  gameStore.removeGame(gameId);
}
