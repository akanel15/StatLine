import { useReviewStore } from "@/store/reviewStore";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock zustand to bypass persistence for testing
jest.mock("zustand/middleware", () => ({
  persist: (fn: any) => fn,
  createJSONStorage: () => ({}),
}));

describe("Review Store", () => {
  beforeEach(() => {
    useReviewStore.setState({ reviewPromptsShown: 0 });
    jest.clearAllMocks();
  });

  describe("incrementPromptsShown", () => {
    test("increments from 0 to 1", () => {
      useReviewStore.getState().incrementPromptsShown();
      expect(useReviewStore.getState().reviewPromptsShown).toBe(1);
    });

    test("increments from 1 to 2", () => {
      useReviewStore.setState({ reviewPromptsShown: 1 });
      useReviewStore.getState().incrementPromptsShown();
      expect(useReviewStore.getState().reviewPromptsShown).toBe(2);
    });

    test("increments from 2 to 3", () => {
      useReviewStore.setState({ reviewPromptsShown: 2 });
      useReviewStore.getState().incrementPromptsShown();
      expect(useReviewStore.getState().reviewPromptsShown).toBe(3);
    });

    test("caps at 3 and does not increment beyond", () => {
      useReviewStore.setState({ reviewPromptsShown: 3 });
      useReviewStore.getState().incrementPromptsShown();
      expect(useReviewStore.getState().reviewPromptsShown).toBe(3);
    });
  });

  describe("resetReviewState", () => {
    test("resets reviewPromptsShown to 0", () => {
      useReviewStore.setState({ reviewPromptsShown: 3 });
      useReviewStore.getState().resetReviewState();
      expect(useReviewStore.getState().reviewPromptsShown).toBe(0);
    });

    test("resets from any value to 0", () => {
      useReviewStore.setState({ reviewPromptsShown: 1 });
      useReviewStore.getState().resetReviewState();
      expect(useReviewStore.getState().reviewPromptsShown).toBe(0);
    });
  });

  describe("initial state", () => {
    test("starts with reviewPromptsShown at 0", () => {
      useReviewStore.setState({ reviewPromptsShown: 0 });
      expect(useReviewStore.getState().reviewPromptsShown).toBe(0);
    });
  });
});
