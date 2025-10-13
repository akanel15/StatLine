import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import uuid from "react-native-uuid";
import { GameType, PeriodType, Team, createGame } from "@/types/game";
import { initialBaseStats, Stat, StatsType } from "@/types/stats";
import { useSetStore } from "./setStore";

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

  updateBoxScore: (gameId: string, playerId: string, stat: Stat, amount: number) => void;
  updateTotals: (gameId: string, stat: Stat, amount: number, team: Team) => void;
  updatePeriods: (gameId: string, playerId: string, stat: Stat, period: number, team: Team) => void;
  updateSetStats: (gameId: string, setId: string, stat: Stat, amount: number) => void;
  incrementSetRunCount: (gameId: string, setId: string) => void;
  addPlayersToGamePlayedList: (gameId: string, playerIds: string[]) => void;
  removePlayFromPeriod: (gameId: string, period: number, playIndex: number) => void;
  undoLastEvent: (gameId: string, period: number) => void;
  resetPeriod: (gameId: string, period: number) => void;
  markGameAsFinished: (gameId: string) => void;
  markGameAsActive: (gameId: string) => void;
  getGameSafely: (gameId: string) => GameType | null;
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

          // Add new play-by-play event
          updatedPeriods[period].playByPlay.unshift({
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

          // Create a new set to prevent duplicates, then convert back to an array
          const updatedGamePlayedList = Array.from(new Set([...game.gamePlayedList, ...playerIds]));

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
        const game = get().games[gameId];
        if (game && game.periods[period] && game.periods[period].playByPlay) {
          game.periods[period].playByPlay.splice(playIndex, 1);
        }
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

        // Check if game needs data repair
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
    }),
    {
      name: "statline-game-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
