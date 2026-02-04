import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { storeHydration } from "@/utils/storeHydration";

export type HintId = "gameFlow" | "setReset" | "substitution";

type HelpState = {
  hasSeenGameFlowHint: boolean;
  hasSeenSetResetHint: boolean;
  hasSeenSubstitutionHint: boolean;
  _hasHydrated: boolean;

  // Actions
  markHintAsSeen: (hintId: HintId) => void;
  resetAllHints: () => void; // For debugging
};

export const useHelpStore = create<HelpState>()(
  persist(
    set => ({
      // Initial state - all hints not seen
      hasSeenGameFlowHint: false,
      hasSeenSetResetHint: false,
      hasSeenSubstitutionHint: false,
      _hasHydrated: false,

      // Mark a hint as seen
      markHintAsSeen: (hintId: HintId) => {
        switch (hintId) {
          case "gameFlow":
            set({ hasSeenGameFlowHint: true });
            break;
          case "setReset":
            set({ hasSeenSetResetHint: true });
            break;
          case "substitution":
            set({ hasSeenSubstitutionHint: true });
            break;
        }
      },

      // Reset all hints (for debugging/testing)
      resetAllHints: () => {
        set({
          hasSeenGameFlowHint: false,
          hasSeenSetResetHint: false,
          hasSeenSubstitutionHint: false,
        });
      },
    }),
    {
      name: "help-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        useHelpStore.setState({ _hasHydrated: true });
        storeHydration.markHydrated("help-storage");
      },
    },
  ),
);
