import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as FileSystem from "expo-file-system/legacy";
import uuid from "react-native-uuid";
import { createTeam, TeamType } from "@/types/team";
import { Result } from "@/types/player";
import { Stat } from "@/types/stats";
import { Team } from "@/types/game";

type TeamState = {
  teams: Record<string, TeamType>;
  currentTeamId: string;
  addTeam: (name: string, imageUri?: string) => Promise<void>;
  removeTeam: (teamId: string) => void;
  removeTeamWithCascade: (teamId: string) => void;
  updateTeam: (
    teamId: string,
    updates: Partial<Pick<TeamType, "name" | "imageUri">>,
  ) => Promise<void>;
  setCurrentTeamId: (teamId: string) => void;
  updateGamesPlayed: (teamId: string, result: Result) => void;
  revertGameNumbers: (teamId: string, result: Result) => void;
  updateStats: (teamId: string, stat: Stat, amount: number, team: Team) => void;
  getTeamSafely: (teamId: string) => TeamType | null;
};

export const useTeamStore = create(
  persist<TeamState>(
    (set, get) => ({
      teams: {},
      currentTeamId: "",
      addTeam: async (name: string, imageUri?: string) => {
        // Default logo IDs that don't need file copying
        const defaultLogoIds = ["basketball", "falcon", "crown"];
        const isDefaultLogo = imageUri && defaultLogoIds.includes(imageUri);

        let finalImageUri = imageUri;

        // Only copy to file system if it's a custom image (not a default logo ID)
        if (imageUri && !isDefaultLogo) {
          const savedImageUri =
            FileSystem.documentDirectory +
            `${new Date().getTime()}-${imageUri.split("/").slice(-1)[0]}`;

          await FileSystem.copyAsync({
            from: imageUri,
            to: savedImageUri,
          });

          finalImageUri = savedImageUri;
        }

        const id = uuid.v4();

        set(state => ({
          teams: {
            [id]: createTeam(id, name, finalImageUri),
            ...state.teams,
          },
        }));
      },
      removeTeam: (teamId: string) => {
        return set(state => {
          if (!state.teams[teamId]) {
            console.warn(`Team with ID ${teamId} not found. Cannot remove.`);
            return state;
          }
          const newTeams = { ...state.teams };
          delete newTeams[teamId];

          // Reset currentTeamId if the deleted team was current
          const newCurrentTeamId = state.currentTeamId === teamId ? "" : state.currentTeamId;

          return {
            teams: newTeams,
            currentTeamId: newCurrentTeamId,
          };
        });
      },
      updateTeam: async (teamId: string, updates: Partial<Pick<TeamType, "name" | "imageUri">>) => {
        // Default logo IDs that don't need file copying
        const defaultLogoIds = ["basketball", "falcon", "crown"];
        const isDefaultLogo = updates.imageUri && defaultLogoIds.includes(updates.imageUri);

        let savedImageUri = updates.imageUri;

        // If a new image is provided and it's not a default logo or already in document directory, save it
        if (
          updates.imageUri &&
          !isDefaultLogo &&
          !updates.imageUri.startsWith(FileSystem.documentDirectory!)
        ) {
          savedImageUri =
            FileSystem.documentDirectory +
            `${new Date().getTime()}-${updates.imageUri.split("/").slice(-1)[0]}`;
          await FileSystem.copyAsync({
            from: updates.imageUri,
            to: savedImageUri,
          });
        }

        set(state => {
          const team = state.teams[teamId];
          if (!team) {
            console.warn(`Team with ID ${teamId} not found. Cannot update.`);
            return state;
          }

          return {
            teams: {
              ...state.teams,
              [teamId]: {
                ...team,
                ...updates,
                imageUri: savedImageUri,
              },
            },
          };
        });
      },
      setCurrentTeamId: (teamId: string) => {
        return set(state => ({
          ...state,
          currentTeamId: teamId,
        }));
      },
      updateGamesPlayed: (teamId: string, result: Result) => {
        set(state => {
          const team = state.teams[teamId];
          if (!team) {
            console.warn(`Team with ID ${teamId} not found.`);
            return state;
          }
          return {
            teams: {
              ...state.teams,
              [teamId]: {
                ...team,
                gameNumbers: {
                  ...team.gameNumbers,
                  [result]: (team.gameNumbers?.[result] || 0) + 1,
                  gamesPlayed: (team.gameNumbers.gamesPlayed || 0) + 1,
                },
              },
            },
          };
        });
      },
      revertGameNumbers: (teamId: string, result: Result) => {
        set(state => {
          const team = state.teams[teamId];
          if (!team) {
            console.warn(`Team with ID ${teamId} not found.`);
            return state;
          }
          return {
            teams: {
              ...state.teams,
              [teamId]: {
                ...team,
                gameNumbers: {
                  ...team.gameNumbers,
                  [result]: Math.max(0, team.gameNumbers[result] - 1), // Prevent negative
                  gamesPlayed: Math.max(0, team.gameNumbers.gamesPlayed - 1),
                },
              },
            },
          };
        });
      },
      updateStats(teamId: string, stat: Stat, amount: number, team: Team) {
        set(state => {
          const selectedTeam = state.teams[teamId];
          if (!selectedTeam) {
            console.warn(`Team with ID ${teamId} not found.`);
            return state;
          }
          return {
            teams: {
              ...state.teams,
              [teamId]: {
                ...selectedTeam,
                stats: {
                  ...selectedTeam.stats,
                  [team]: {
                    ...selectedTeam.stats[team],
                    [stat]: (selectedTeam.stats[team][stat] || 0) + amount,
                  },
                },
              },
            },
          };
        });
      },
      getTeamSafely: (teamId: string) => {
        const state = get();
        return state.teams[teamId] || null;
      },
      removeTeamWithCascade: (teamId: string) => {
        return set(state => {
          if (!state.teams[teamId]) {
            console.warn(`Team with ID ${teamId} not found. Cannot remove.`);
            return state;
          }

          // Note: This method will be called by UI components that need to trigger
          // cascading deletions. The actual cascading logic will be handled in the
          // UI layer to avoid circular dependencies between stores.

          const newTeams = { ...state.teams };
          delete newTeams[teamId];

          // Reset currentTeamId if the deleted team was current
          const newCurrentTeamId = state.currentTeamId === teamId ? "" : state.currentTeamId;

          return {
            teams: newTeams,
            currentTeamId: newCurrentTeamId,
          };
        });
      },
    }),
    {
      name: "statline-team-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
