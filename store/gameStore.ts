import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import uuid from "react-native-uuid";
import { GameType, PeriodType, Team, createGame, PlayByPlayType } from "@/types/game";
import { initialBaseStats, Stat, StatsType } from "@/types/stats";
import { useSetStore } from "./setStore";
import { debouncedAsyncStorage } from "@/utils/debounceAsyncStorage";
import { storeHydration } from "@/utils/storeHydration";

export type UnifiedPlayEntry = {
  play: PlayByPlayType;
  periodIndex: number;
  indexInPeriod: number;
  cumulativeIndex: number;
};

// Types for batched stat updates
export type BoxScoreUpdate = { playerId: string; stat: Stat; amount: number };
export type TotalUpdate = { stat: Stat; amount: number; team: Team };
export type PeriodUpdate = {
  playerId: string;
  stat: Stat;
  period: number;
  team: Team;
  activePlayers?: string[]; // Players on court for stat reversal
  setId?: string; // Set/lineup in use for stat reversal
};
export type SetStatUpdate = { setId: string; stat: Stat; amount: number };

export type BatchStatUpdateParams = {
  boxScoreUpdates: BoxScoreUpdate[];
  totalUpdates: TotalUpdate[];
  periodUpdate?: PeriodUpdate;
  setStatUpdates: SetStatUpdate[];
};

type GameState = {
  games: Record<string, GameType>;
  addGame: (
    teamId: string,
    opposingTeamName: string,
    periodType: PeriodType,
    opposingTeamImageUri?: string,
  ) => string;
  removeGame: (gameId: string) => void;
  updateGame: (
    gameId: string,
    updates: Partial<Pick<GameType, "opposingTeamName" | "opposingTeamImageUri">>,
  ) => void;
  setActivePlayers: (gameId: string, newActivePlayers: string[]) => void;
  setActiveSets: (gameId: string, newActiveSets: string[]) => void;

  // Batched stat update - performs all game updates in a single set() call
  batchStatUpdate: (gameId: string, params: BatchStatUpdateParams) => void;

  updateBoxScore: (gameId: string, playerId: string, stat: Stat, amount: number) => void;
  updateTotals: (gameId: string, stat: Stat, amount: number, team: Team) => void;
  updatePeriods: (gameId: string, playerId: string, stat: Stat, period: number, team: Team) => void;
  updateSetStats: (gameId: string, setId: string, stat: Stat, amount: number) => void;
  incrementSetRunCount: (gameId: string, setId: string) => void;
  addPlayersToGamePlayedList: (gameId: string, playerIds: string[]) => void;
  removePlayFromPeriod: (gameId: string, period: number, playIndex: number) => void;
  reorderPlaysInPeriod: (
    gameId: string,
    period: number,
    fromIndex: number,
    toIndex: number,
  ) => void;
  undoLastEvent: (gameId: string, period: number) => void;
  resetPeriod: (gameId: string, period: number) => void;
  markGameAsFinished: (gameId: string) => void;
  markGameAsActive: (gameId: string) => void;
  getGameSafely: (gameId: string) => GameType | null;
  getUnifiedPlayList: (gameId: string) => UnifiedPlayEntry[];
  movePlayBetweenPeriods: (
    gameId: string,
    fromPeriod: number,
    fromIndex: number,
    toPeriod: number,
    toIndex: number,
  ) => void;
  movePeriodDivider: (gameId: string, periodIndex: number, newPlayIndex: number) => void;
  createNewPeriod: (gameId: string) => number;
  updateAllPeriods: (gameId: string, newPeriods: any[]) => void;
  deletePeriod: (gameId: string, periodIndex: number) => void;
  migratePlayIds: () => { gamesUpdated: number; playsUpdated: number };
  importGame: (gameData: Omit<GameType, "id" | "sets" | "opposingTeamImageUri">) => string;
};

export const useGameStore = create(
  persist<GameState>(
    (set, get) => ({
      games: {},
      addGame: (
        teamId: string,
        opposingTeamName: string,
        periodType: PeriodType,
        opposingTeamImageUri?: string,
      ) => {
        const id = uuid.v4();
        set(state => ({
          games: {
            [id]: createGame(id, teamId, opposingTeamName, periodType, opposingTeamImageUri),
            ...state.games,
          },
        }));
        return id;
      },

      removeGame: (gameId: string) => {
        set(state => {
          if (!state.games[gameId]) {
            console.warn(`Game with ID ${gameId} not found. Cannot remove.`);
            return state;
          }
          const newGames = { ...state.games };
          delete newGames[gameId];
          return { games: newGames };
        });
      },
      updateGame: (gameId: string, updates: Partial<Pick<GameType, "opposingTeamName">>) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found. Cannot update.`);
            return state;
          }

          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                ...updates,
              },
            },
          };
        });
      },
      setActivePlayers: (gameId, newActivePlayers) => {
        set(state => {
          if (!state.games[gameId]) {
            console.warn(`Game with ID ${gameId} not found. Cannot update active players.`);
            return state;
          }
          return {
            games: {
              ...state.games,
              [gameId]: {
                ...state.games[gameId],
                activePlayers: newActivePlayers,
              },
            },
          };
        });
      },
      setActiveSets: (gameId, newActiveSets) => {
        set(state => {
          if (!state.games[gameId]) {
            console.warn(`Game with ID ${gameId} not found. Cannot update active sets.`);
            return state;
          }
          return {
            games: {
              ...state.games,
              [gameId]: {
                ...state.games[gameId],
                activeSets: newActiveSets,
              },
            },
          };
        });
      },

      // Batched stat update - performs ALL game-related stat updates in a single set() call
      // This dramatically reduces re-renders by emitting only 1 state change instead of 8+
      batchStatUpdate: (gameId: string, params: BatchStatUpdateParams) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }

          // Clone the game object for mutations
          let updatedBoxScore = { ...game.boxScore };
          let updatedStatTotals = {
            [Team.Us]: { ...game.statTotals[Team.Us] },
            [Team.Opponent]: { ...game.statTotals[Team.Opponent] },
          };
          let updatedPeriods = [...game.periods];
          let updatedSets = { ...game.sets };

          // Apply box score updates
          for (const update of params.boxScoreUpdates) {
            const playerBoxScore: StatsType = updatedBoxScore[update.playerId]
              ? { ...updatedBoxScore[update.playerId] }
              : { ...initialBaseStats };
            playerBoxScore[update.stat] = (playerBoxScore[update.stat] || 0) + update.amount;
            updatedBoxScore[update.playerId] = playerBoxScore;
          }

          // Apply total updates
          for (const update of params.totalUpdates) {
            updatedStatTotals[update.team][update.stat] =
              (updatedStatTotals[update.team][update.stat] || 0) + update.amount;
          }

          // Apply period update (play-by-play)
          if (params.periodUpdate) {
            const { playerId, stat, period, team, activePlayers, setId } = params.periodUpdate;

            // Ensure the period index exists
            if (!updatedPeriods[period]) {
              updatedPeriods[period] = {
                [Team.Us]: 0,
                [Team.Opponent]: 0,
                playByPlay: [],
              };
            }

            let scoreIncrease = 0;
            if (stat === Stat.TwoPointMakes) scoreIncrease = 2;
            if (stat === Stat.ThreePointMakes) scoreIncrease = 3;
            if (stat === Stat.FreeThrowsMade) scoreIncrease = 1;

            updatedPeriods[period] = {
              ...updatedPeriods[period],
              [team]: (updatedPeriods[period]?.[team] ?? 0) + scoreIncrease,
              playByPlay: [
                {
                  id: uuid.v4() as string,
                  playerId,
                  action: stat,
                  activePlayers, // Store for stat reversal on delete
                  setId, // Store for stat reversal on delete
                },
                ...updatedPeriods[period].playByPlay,
              ],
            };
          }

          // Apply set stat updates
          for (const update of params.setStatUpdates) {
            let existingSet = updatedSets[update.setId];

            // If set doesn't exist in game yet, initialize it from global set store
            if (!existingSet) {
              const globalSet = useSetStore.getState().sets[update.setId];
              if (globalSet) {
                existingSet = {
                  id: globalSet.id,
                  name: globalSet.name,
                  teamId: globalSet.teamId,
                  runCount: 0,
                  stats: { ...initialBaseStats },
                };
              } else {
                continue; // Skip if set not found
              }
            }

            updatedSets[update.setId] = {
              ...existingSet,
              stats: {
                ...existingSet.stats,
                [update.stat]: (existingSet.stats[update.stat] || 0) + update.amount,
              },
            };
          }

          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                boxScore: updatedBoxScore,
                statTotals: updatedStatTotals,
                periods: updatedPeriods,
                sets: updatedSets,
              },
            },
          };
        });
      },

      //USED TO UPDATE AN INDIVIDUAL STAT FOR OUR TEAM IN THE BOX SCORE AND STAT TOTALS VALUES
      updateBoxScore: (gameId: string, playerId: string, stat: Stat, amount: number) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }

          // Ensure player has a stats entry
          const playerBoxScore: StatsType = game.boxScore[playerId]
            ? { ...game.boxScore[playerId] }
            : { ...initialBaseStats };

          // Update the player's specific stat
          playerBoxScore[stat] = (playerBoxScore[stat] || 0) + amount;

          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                boxScore: {
                  ...game.boxScore,
                  [playerId]: playerBoxScore,
                },
              },
            },
          };
        });
      },
      updateTotals: (gameId: string, stat: Stat, amount: number, team: Team) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }

          // Update the team's stat totals
          const newStatTotals = { ...game.statTotals };

          newStatTotals[team][stat] = (newStatTotals[team][stat] || 0) + amount;

          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                statTotals: newStatTotals,
              },
            },
          };
        });
      },
      updatePeriods: (gameId: string, playerId: string, stat: Stat, period: number, team: Team) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) return state; // Game not found, return state as is

          // Clone the periods array so we don't mutate state directly
          const updatedPeriods = [...game.periods];

          // Ensure the period index exists
          if (!updatedPeriods[period]) {
            updatedPeriods[period] = {
              [Team.Us]: 0,
              [Team.Opponent]: 0,
              playByPlay: [],
            };
          }
          let scoreIncrease = 0;
          if (stat === Stat.TwoPointMakes) scoreIncrease = 2;
          if (stat === Stat.ThreePointMakes) scoreIncrease = 3;
          if (stat === Stat.FreeThrowsMade) scoreIncrease = 1;

          updatedPeriods[period] = {
            ...updatedPeriods[period],
            [team]: (updatedPeriods[period]?.[team] ?? 0) + scoreIncrease,
          };

          // Add new play-by-play event with unique ID for stable rendering
          updatedPeriods[period].playByPlay.unshift({
            id: uuid.v4() as string,
            playerId,
            action: stat,
          });

          return {
            ...state,
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                periods: updatedPeriods,
              },
            },
          };
        });
      },
      updateSetStats: (gameId: string, setId: string, stat: Stat, amount: number) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }

          let existingSet = game.sets[setId];

          // If set doesn't exist in game yet, initialize it from global set store
          if (!existingSet) {
            const globalSet = useSetStore.getState().sets[setId];
            if (globalSet) {
              existingSet = {
                id: globalSet.id,
                name: globalSet.name,
                teamId: globalSet.teamId,
                runCount: 0,
                stats: { ...initialBaseStats },
              };
            } else {
              console.warn(`Set with ID ${setId} not found in global set store.`);
              return state;
            }
          }

          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                sets: {
                  ...game.sets,
                  [setId]: {
                    ...existingSet,
                    stats: {
                      ...existingSet.stats,
                      [stat]: (existingSet.stats[stat] || 0) + amount,
                    },
                  },
                },
              },
            },
          };
        });
      },
      incrementSetRunCount: (gameId: string, setId: string) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }

          let existingSet = game.sets[setId];

          // If set doesn't exist in game yet, initialize it from global set store
          if (!existingSet) {
            const globalSet = useSetStore.getState().sets[setId];
            if (globalSet) {
              existingSet = {
                id: globalSet.id,
                name: globalSet.name,
                teamId: globalSet.teamId,
                runCount: 0,
                stats: { ...initialBaseStats },
              };
            } else {
              console.warn(`Set with ID ${setId} not found in global set store.`);
              return state;
            }
          }

          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                sets: {
                  ...game.sets,
                  [setId]: {
                    ...existingSet,
                    runCount: existingSet.runCount + 1,
                  },
                },
              },
            },
          };
        });
      },
      addPlayersToGamePlayedList: (gameId: string, playerIds: string[]) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }

          // Filter out special identifiers like "Opponent" and "Team" - they are not actual players
          const validPlayerIds = playerIds.filter(id => id !== "Opponent" && id !== "Team");

          // Create a new set to prevent duplicates, then convert back to an array
          const updatedGamePlayedList = Array.from(
            new Set([...game.gamePlayedList, ...validPlayerIds]),
          );

          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                gamePlayedList: updatedGamePlayedList,
              },
            },
          };
        });
      },
      undoLastEvent: (gameId: string, period: number) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }

          const updatedPeriods = [...game.periods];

          // Check if the period exists and if playByPlay is an array
          const periodInfo = updatedPeriods[period];
          if (
            periodInfo &&
            Array.isArray(periodInfo.playByPlay) &&
            periodInfo.playByPlay.length > 0
          ) {
            const lastEvent = periodInfo.playByPlay[0]; // Get the first event (the one to undo)

            // Remove the first action
            periodInfo.playByPlay = periodInfo.playByPlay.slice(1);

            // Reverse the action of the last event
            let scoreChange = 0;
            if (lastEvent.action === Stat.TwoPointMakes) scoreChange = -2;
            if (lastEvent.action === Stat.ThreePointMakes) scoreChange = -3;
            if (lastEvent.action === Stat.FreeThrowsMade) scoreChange = -1;

            // Determine which team to subtract the score from
            const team = lastEvent.playerId === "Opponent" ? Team.Opponent : Team.Us;

            periodInfo[team] = (periodInfo[team] ?? 0) + scoreChange;

            // Return the updated game state
            return {
              games: {
                ...state.games,
                [gameId]: {
                  ...game,
                  periods: updatedPeriods,
                },
              },
            };
          } else {
            console.warn(`No play-by-play events to undo for period ${period}.`);
            return state;
          }
        });
      },
      removePlayFromPeriod: (gameId: string, period: number, playIndex: number) => {
        set(state => {
          const game = state.games[gameId];
          if (!game?.periods[period]?.playByPlay) {
            console.warn(`Cannot remove play: invalid game/period/playByPlay`);
            return state;
          }

          const playByPlay = [...game.periods[period].playByPlay];

          if (playIndex < 0 || playIndex >= playByPlay.length) {
            console.warn(`Invalid playIndex: ${playIndex}`);
            return state;
          }

          const [removedPlay] = playByPlay.splice(playIndex, 1);

          // Calculate points to subtract from period score
          let points = 0;
          if (removedPlay.action === Stat.TwoPointMakes) points = 2;
          if (removedPlay.action === Stat.ThreePointMakes) points = 3;
          if (removedPlay.action === Stat.FreeThrowsMade) points = 1;

          const team = removedPlay.playerId === "Opponent" ? Team.Opponent : Team.Us;

          const updatedPeriods = [...game.periods];
          updatedPeriods[period] = {
            ...updatedPeriods[period],
            playByPlay,
            [team]: Math.max(0, (updatedPeriods[period][team] || 0) - points),
          };

          return {
            games: {
              ...state.games,
              [gameId]: { ...game, periods: updatedPeriods },
            },
          };
        });
      },
      reorderPlaysInPeriod: (
        gameId: string,
        period: number,
        fromIndex: number,
        toIndex: number,
      ) => {
        set(state => {
          const game = state.games[gameId];
          if (!game?.periods[period]?.playByPlay) {
            console.warn(`Cannot reorder plays: invalid game/period/playByPlay`);
            return state;
          }

          const playByPlay = [...game.periods[period].playByPlay];

          // Validate indices
          if (
            fromIndex < 0 ||
            fromIndex >= playByPlay.length ||
            toIndex < 0 ||
            toIndex >= playByPlay.length
          ) {
            console.warn(`Invalid indices: fromIndex=${fromIndex}, toIndex=${toIndex}`);
            return state;
          }

          // IMPORTANT: playByPlay is stored newest-first (unshift)
          // fromIndex and toIndex refer to this reversed array

          // Remove from old position
          const [play] = playByPlay.splice(fromIndex, 1);

          // Insert at new position
          playByPlay.splice(toIndex, 0, play);

          // Update period with new order
          const updatedPeriods = [...game.periods];
          updatedPeriods[period] = {
            ...updatedPeriods[period],
            playByPlay,
          };

          // Period scores don't change (same plays, just reordered)
          // Score DISPLAY recalculation happens in component

          return {
            games: {
              ...state.games,
              [gameId]: { ...game, periods: updatedPeriods },
            },
          };
        });
      },
      resetPeriod: (gameId: string, period: number) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }

          const updatedPeriods = [...game.periods];
          if (updatedPeriods[period]) {
            // Reset the period and play-by-play events
            updatedPeriods[period] = {
              [Team.Us]: 0,
              [Team.Opponent]: 0,
              playByPlay: [],
            };
            // Return the updated game state
            return {
              games: {
                ...state.games,
                [gameId]: {
                  ...game,
                  periods: updatedPeriods,
                },
              },
            };
          } else {
            console.warn(`No period found with index ${period}.`);
            return state;
          }
        });
      },
      markGameAsFinished: (gameId: string) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }
          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                isFinished: true,
              },
            },
          };
        });
      },

      markGameAsActive: (gameId: string) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }
          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                isFinished: false,
              },
            },
          };
        });
      },
      getGameSafely: (gameId: string) => {
        const state = get();
        const game = state.games[gameId];
        if (!game) return null;

        // Check if game needs data repair (null periods or missing playByPlay)
        let needsRepair = false;
        const repairedPeriods = game.periods.map(period => {
          // Handle null periods (skipped quarters/halves)
          if (!period) {
            needsRepair = true;
            return {
              [Team.Us]: 0,
              [Team.Opponent]: 0,
              playByPlay: [],
            };
          }
          // Handle periods missing playByPlay array
          if (!period.playByPlay) {
            needsRepair = true;
            return {
              ...period,
              playByPlay: [],
            };
          }
          return period;
        });

        // If repair was needed, update the game in storage
        if (needsRepair) {
          set(currentState => ({
            games: {
              ...currentState.games,
              [gameId]: {
                ...game,
                periods: repairedPeriods,
              },
            },
          }));

          return {
            ...game,
            periods: repairedPeriods,
          };
        }

        return game;
      },

      getUnifiedPlayList: (gameId: string) => {
        const game = get().games[gameId];
        if (!game || !game.periods) return [];

        const unifiedList: UnifiedPlayEntry[] = [];
        let cumulativeIndex = 0;

        // Iterate through periods in order (Q1, Q2, Q3, Q4, OT, etc.)
        game.periods.forEach((period, periodIndex) => {
          if (!period || !period.playByPlay || !Array.isArray(period.playByPlay)) return;

          // Plays are stored in reverse chronological order (newest first)
          // So we iterate in reverse to get chronological order for display
          for (let i = period.playByPlay.length - 1; i >= 0; i--) {
            unifiedList.push({
              play: period.playByPlay[i],
              periodIndex,
              indexInPeriod: i,
              cumulativeIndex,
            });
            cumulativeIndex++;
          }
        });

        return unifiedList;
      },

      movePlayBetweenPeriods: (
        gameId: string,
        fromPeriod: number,
        fromIndex: number,
        toPeriod: number,
        toIndex: number,
      ) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }

          const updatedPeriods = [...game.periods];

          // Validate source period exists
          if (!updatedPeriods[fromPeriod]) {
            console.warn(`Invalid period indices: from ${fromPeriod}, to ${toPeriod}`);
            return state;
          }

          // Ensure destination period exists (create if needed)
          if (!updatedPeriods[toPeriod]) {
            updatedPeriods[toPeriod] = {
              [Team.Us]: 0,
              [Team.Opponent]: 0,
              playByPlay: [],
            };
          }

          const fromPlayByPlay = [...updatedPeriods[fromPeriod].playByPlay];
          const toPlayByPlay =
            fromPeriod === toPeriod ? fromPlayByPlay : [...updatedPeriods[toPeriod].playByPlay];

          // Validate indices
          if (fromIndex < 0 || fromIndex >= fromPlayByPlay.length) {
            console.warn(`Invalid fromIndex: ${fromIndex}`);
            return state;
          }

          // Remove play from source period
          const [playToMove] = fromPlayByPlay.splice(fromIndex, 1);

          // Calculate points for the play
          let points = 0;
          if (playToMove.action === Stat.TwoPointMakes) points = 2;
          if (playToMove.action === Stat.ThreePointMakes) points = 3;
          if (playToMove.action === Stat.FreeThrowsMade) points = 1;

          const team = playToMove.playerId === "Opponent" ? Team.Opponent : Team.Us;

          // Update scores for source period (subtract)
          updatedPeriods[fromPeriod] = {
            ...updatedPeriods[fromPeriod],
            playByPlay: fromPlayByPlay,
            [team]: (updatedPeriods[fromPeriod][team] || 0) - points,
          };

          // Add play to destination period
          const insertIndex = Math.min(toIndex, toPlayByPlay.length);
          toPlayByPlay.splice(insertIndex, 0, playToMove);

          // Update scores for destination period (add)
          updatedPeriods[toPeriod] = {
            ...updatedPeriods[toPeriod],
            playByPlay: toPlayByPlay,
            [team]: (updatedPeriods[toPeriod][team] || 0) + points,
          };

          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                periods: updatedPeriods,
              },
            },
          };
        });
      },

      createNewPeriod: (gameId: string) => {
        let newPeriodIndex = 0;
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }

          newPeriodIndex = game.periods.length;

          const newPeriod = {
            [Team.Us]: 0,
            [Team.Opponent]: 0,
            playByPlay: [],
          };

          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                periods: [...game.periods, newPeriod],
              },
            },
          };
        });
        return newPeriodIndex;
      },

      updateAllPeriods: (gameId: string, newPeriods: any[]) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }

          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                periods: newPeriods,
              },
            },
          };
        });
      },

      deletePeriod: (gameId: string, periodIndex: number) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }

          // Cannot delete Q1/H1 (period 0)
          if (periodIndex === 0) {
            console.warn("Cannot delete first period (Q1/H1).");
            return state;
          }

          // Cannot delete non-existent period
          if (!game.periods[periodIndex]) {
            console.warn(`Period ${periodIndex} does not exist.`);
            return state;
          }

          const updatedPeriods = [...game.periods];
          const deletedPeriod = updatedPeriods[periodIndex];
          const prevPeriod = updatedPeriods[periodIndex - 1];

          // Move all plays from deleted period to previous period
          // Plays are stored newest-first, so prepend deleted period's plays
          // to maintain relative chronological order (deleted plays happened "after")
          const mergedPlayByPlay = [...deletedPeriod.playByPlay, ...prevPeriod.playByPlay];

          // Update previous period with merged plays and combined scores
          updatedPeriods[periodIndex - 1] = {
            [Team.Us]: prevPeriod[Team.Us] + deletedPeriod[Team.Us],
            [Team.Opponent]: prevPeriod[Team.Opponent] + deletedPeriod[Team.Opponent],
            playByPlay: mergedPlayByPlay,
          };

          // Remove the deleted period
          updatedPeriods.splice(periodIndex, 1);

          return {
            games: {
              ...state.games,
              [gameId]: {
                ...game,
                periods: updatedPeriods,
              },
            },
          };
        });
      },

      movePeriodDivider: (gameId: string, periodIndex: number, newPlayIndex: number) => {
        set(state => {
          const game = state.games[gameId];
          if (!game) {
            console.warn(`Game with ID ${gameId} not found.`);
            return state;
          }

          // Get unified play list to understand the cumulative structure
          const unifiedList = get().getUnifiedPlayList(gameId);
          if (newPlayIndex < 0 || newPlayIndex > unifiedList.length) {
            console.warn(`Invalid newPlayIndex: ${newPlayIndex}`);
            return state;
          }

          // Determine which period the new index falls into
          let targetPeriod = 0;
          if (newPlayIndex < unifiedList.length) {
            targetPeriod = unifiedList[newPlayIndex].periodIndex;
          } else if (unifiedList.length > 0) {
            // If at the end, use the last period + 1
            targetPeriod = unifiedList[unifiedList.length - 1].periodIndex;
          }

          // If moving divider to same period, no change needed
          if (targetPeriod === periodIndex) {
            return state;
          }

          // This is a simplified implementation - reassigning plays between periods
          // In a full implementation, you would redistribute plays based on the divider position
          if (__DEV__) {
            console.log(
              `Moving period ${periodIndex} divider to position ${newPlayIndex} (target period: ${targetPeriod})`,
            );
          }

          // For now, return state unchanged - this would require more complex logic
          // to properly redistribute plays across periods
          return state;
        });
      },

      migratePlayIds: () => {
        const state = get();
        let gamesUpdated = 0;
        let playsUpdated = 0;

        const updatedGames = { ...state.games };

        Object.entries(updatedGames).forEach(([gameId, game]) => {
          let gameNeedsUpdate = false;

          const updatedPeriods = game.periods.map((period, periodIndex) => {
            if (!period?.playByPlay) return period;

            const updatedPlays = period.playByPlay.map((play, playIndex) => {
              if (!play.id) {
                playsUpdated++;
                gameNeedsUpdate = true;
                return { ...play, id: `migrated-${gameId}-${periodIndex}-${playIndex}` };
              }
              return play;
            });

            return { ...period, playByPlay: updatedPlays };
          });

          if (gameNeedsUpdate) {
            gamesUpdated++;
            updatedGames[gameId] = { ...game, periods: updatedPeriods };
          }
        });

        if (gamesUpdated > 0) {
          set({ games: updatedGames });
        }

        if (__DEV__) {
          console.log(`Migration complete: ${gamesUpdated} games, ${playsUpdated} plays updated`);
        }
        return { gamesUpdated, playsUpdated };
      },

      importGame: (
        gameData: Omit<GameType, "id" | "sets" | "activeSets" | "opposingTeamImageUri">,
      ) => {
        const id = uuid.v4() as string;
        set(state => ({
          games: {
            [id]: {
              ...gameData,
              id,
              sets: {},
              activeSets: [],
              opposingTeamImageUri: undefined,
            },
            ...state.games,
          },
        }));
        return id;
      },
    }),
    {
      name: "statline-game-store",
      // Use debounced AsyncStorage to prevent blocking UI during rapid drag operations
      // Writes are batched and delayed by 300ms, improving drag responsiveness
      storage: createJSONStorage(() => debouncedAsyncStorage),
      onRehydrateStorage: () => state => {
        // Mark this store as hydrated when rehydration completes
        // This allows health checks to wait for all stores to load from AsyncStorage
        storeHydration.markHydrated("statline-game-store");
      },
    },
  ),
);
