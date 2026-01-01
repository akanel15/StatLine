import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as FileSystem from "expo-file-system/legacy";
import uuid from "react-native-uuid";
import { createPlayer, PlayerType, Result } from "@/types/player";
import { Stat } from "@/types/stats";

type PlayerState = {
  players: Record<string, PlayerType>;
  addPlayer: (name: string, number: string, teamId: string, imageUri?: string) => Promise<void>;
  removePlayer: (playerId: string) => void;
  updatePlayer: (
    playerId: string,
    updates: Partial<Pick<PlayerType, "name" | "number" | "imageUri">>,
  ) => Promise<void>;
  updateGamesPlayed: (playerId: string, result: Result) => void;
  revertGameNumbers: (playerId: string, result: Result) => void;
  updateStats: (playerId: string, stat: Stat, amount: number) => void;
  getPlayerSafely: (playerId: string) => PlayerType | null;
};

export const usePlayerStore = create(
  persist<PlayerState>(
    (set, get) => ({
      players: {},
      addPlayer: async (name: string, number: string, teamId: string, imageUri?: string) => {
        const savedImageUri =
          FileSystem.documentDirectory +
          `${new Date().getTime()}-${imageUri?.split("/").slice(-1)[0]}`;

        if (imageUri) {
          await FileSystem.copyAsync({
            from: imageUri,
            to: savedImageUri,
          });
        }
        const id = uuid.v4();

        set(state => ({
          players: {
            [id]: createPlayer(id, name, number, teamId, imageUri ? savedImageUri : undefined),
            ...state.players,
          },
        }));
      },
      removePlayer: (playerId: string) => {
        return set(state => {
          if (!state.players[playerId]) {
            console.warn(`Player with ID ${playerId} not found. Cannot remove.`);
            return state;
          }
          const newPlayers = { ...state.players };
          delete newPlayers[playerId];
          return { players: newPlayers };
        });
      },
      updatePlayer: async (
        playerId: string,
        updates: Partial<Pick<PlayerType, "name" | "number" | "imageUri">>,
      ) => {
        let savedImageUri = updates.imageUri;

        // If a new image is provided and it's not already in the document directory, save it
        if (updates.imageUri && !updates.imageUri.startsWith(FileSystem.documentDirectory!)) {
          savedImageUri =
            FileSystem.documentDirectory +
            `${new Date().getTime()}-${updates.imageUri.split("/").slice(-1)[0]}`;
          await FileSystem.copyAsync({
            from: updates.imageUri,
            to: savedImageUri,
          });
        }

        set(state => {
          const player = state.players[playerId];
          if (!player) {
            console.warn(`Player with ID ${playerId} not found. Cannot update.`);
            return state;
          }

          return {
            players: {
              ...state.players,
              [playerId]: {
                ...player,
                ...updates,
                imageUri: savedImageUri,
              },
            },
          };
        });
      },
      updateGamesPlayed: (playerId: string, result: Result) => {
        set(state => {
          const player = state.players[playerId];
          if (!player) {
            console.warn(`Player with ID ${playerId} not found.`);
            return state;
          }
          return {
            players: {
              ...state.players,
              [playerId]: {
                ...player,
                gameNumbers: {
                  ...player.gameNumbers,
                  [result]: (player.gameNumbers?.[result] || 0) + 1,
                  gamesPlayed: (player.gameNumbers.gamesPlayed || 0) + 1,
                },
              },
            },
          };
        });
      },
      revertGameNumbers: (playerId: string, result: Result) => {
        set(state => {
          const player = state.players[playerId];
          if (!player) {
            console.warn(`Player with ID ${playerId} not found.`);
            return state;
          }
          return {
            players: {
              ...state.players,
              [playerId]: {
                ...player,
                gameNumbers: {
                  ...player.gameNumbers,
                  [result]: Math.max(0, player.gameNumbers[result] - 1),
                  gamesPlayed: Math.max(0, player.gameNumbers.gamesPlayed - 1),
                },
              },
            },
          };
        });
      },
      //USED TO UPDATE AN INDIVIDUAL STAT FOR A PLAYER
      updateStats: (playerId: string, stat: Stat, amount: number) => {
        set(state => {
          const player = state.players[playerId];
          if (!player) {
            console.warn(`Player with ID ${playerId} not found.`);
            return state;
          }
          return {
            players: {
              ...state.players,
              [playerId]: {
                ...player,
                stats: {
                  ...player.stats,
                  [stat]: (player.stats?.[stat] || 0) + amount,
                },
              },
            },
          };
        });
      },
      getPlayerSafely: (playerId: string) => {
        const state = get();
        return state.players[playerId] || null;
      },
    }),
    {
      name: "statline-player-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
