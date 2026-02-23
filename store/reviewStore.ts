import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { storeHydration } from "@/utils/storeHydration";

type ReviewState = {
  reviewPromptsShown: number;
  _hasHydrated: boolean;

  // Actions
  incrementPromptsShown: () => void;
  resetReviewState: () => void; // For debugging
};

export const useReviewStore = create<ReviewState>()(
  persist(
    set => ({
      reviewPromptsShown: 0,
      _hasHydrated: false,

      incrementPromptsShown: () => {
        set(state => ({
          reviewPromptsShown: Math.min(state.reviewPromptsShown + 1, 3),
        }));
      },

      resetReviewState: () => {
        set({ reviewPromptsShown: 0 });
      },
    }),
    {
      name: "review-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        useReviewStore.setState({ _hasHydrated: true });
        storeHydration.markHydrated("review-storage");
      },
    },
  ),
);
