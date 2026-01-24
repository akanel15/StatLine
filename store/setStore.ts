import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import uuid from "react-native-uuid";
import { createSet, SetType } from "@/types/set";
import { Stat } from "@/types/stats";

// Type for batched set stat updates
export type SetStatUpdate = { setId: string; stat: Stat; amount: number };

type SetState = {
  sets: Record<string, SetType>;
  addSet: (name: string, teamId: string) => void;
  removeSet: (setId: string) => void;
  updateSet: (setId: string, updates: Partial<Pick<SetType, "name">>) => void;
  updateStats: (setId: string, stat: Stat, amount: number) => void;
  // Batched stat update - performs all set updates in a single set() call
  batchUpdateStats: (updates: SetStatUpdate[]) => void;
  incrementRunCount: (setId: string) => void;
  decrementRunCount: (setId: string) => void;
  getSetSafely: (setId: string) => SetType | null;
};

export const useSetStore = create(
  persist<SetState>(
    (set, get) => ({
      sets: {},
      addSet: (name: string, teamId: string) => {
        const id = uuid.v4();
        return set(state => ({
          sets: {
            [id]: createSet(id, name, teamId),
            ...state.sets,
          },
        }));
      },
      removeSet: (setId: string) => {
        return set(state => {
          if (!state.sets[setId]) {
            console.warn(`Set with ID ${setId} not found. Cannot remove.`);
            return state;
          }
          const newSets = { ...state.sets };
          delete newSets[setId];
          return { sets: newSets };
        });
      },
      updateSet: (setId: string, updates: Partial<Pick<SetType, "name">>) => {
        return set(state => {
          const set = state.sets[setId];
          if (!set) {
            console.warn(`Set with ID ${setId} not found. Cannot update.`);
            return state;
          }

          return {
            sets: {
              ...state.sets,
              [setId]: {
                ...set,
                ...updates,
              },
            },
          };
        });
      },
      updateStats: (setId: string, stat: Stat, amount: number) => {
        set(state => {
          const set = state.sets[setId];
          if (!set) {
            console.warn(`Set with ID ${setId} not found.`);
            return state;
          }
          return {
            sets: {
              ...state.sets,
              [setId]: {
                ...set,
                stats: {
                  ...set.stats,
                  [stat]: (set.stats?.[stat] || 0) + amount,
                },
              },
            },
          };
        });
      },

      // Batched stat update - performs ALL set stat updates in a single set() call
      // This dramatically reduces re-renders by emitting only 1 state change
      batchUpdateStats: (updates: SetStatUpdate[]) => {
        if (updates.length === 0) return;

        set(state => {
          const updatedSets = { ...state.sets };

          for (const update of updates) {
            const existingSet = updatedSets[update.setId];
            if (!existingSet) continue;

            updatedSets[update.setId] = {
              ...existingSet,
              stats: {
                ...existingSet.stats,
                [update.stat]: (existingSet.stats?.[update.stat] || 0) + update.amount,
              },
            };
          }

          return { sets: updatedSets };
        });
      },

      incrementRunCount: (setId: string) => {
        set(state => {
          const set = state.sets[setId];
          if (!state.sets[setId]) {
            console.warn(`Set with ID ${setId} not found. Cannot remove.`);
            return state;
          }
          return {
            sets: {
              ...state.sets,
              [setId]: {
                ...set,
                runCount: (set.runCount || 0) + 1,
              },
            },
          };
        });
      },
      decrementRunCount: (setId: string) => {
        set(state => {
          const set = state.sets[setId];
          if (!state.sets[setId]) {
            console.warn(`Set with ID ${setId} not found.`);
            return state;
          }
          return {
            sets: {
              ...state.sets,
              [setId]: {
                ...set,
                runCount: Math.max(0, (set.runCount || 0) - 1),
              },
            },
          };
        });
      },
      getSetSafely: (setId: string) => {
        const state = get();
        return state.sets[setId] || null;
      },
    }),
    {
      name: "statline-set-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
