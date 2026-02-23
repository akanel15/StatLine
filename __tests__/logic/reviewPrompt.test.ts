import { shouldRequestReview, triggerReviewIfEligible } from "@/logic/reviewPrompt";
import * as StoreReview from "expo-store-review";

jest.mock("expo-store-review");

const mockIsAvailableAsync = StoreReview.isAvailableAsync as jest.MockedFunction<
  typeof StoreReview.isAvailableAsync
>;
const mockRequestReview = StoreReview.requestReview as jest.MockedFunction<
  typeof StoreReview.requestReview
>;

describe("Review Prompt Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailableAsync.mockResolvedValue(true);
    mockRequestReview.mockResolvedValue(undefined);
  });

  describe("shouldRequestReview", () => {
    describe("returns true at milestones when under prompt cap", () => {
      test.each([
        [3, 0],
        [3, 1],
        [3, 2],
        [10, 0],
        [10, 1],
        [10, 2],
        [15, 0],
        [15, 1],
        [15, 2],
      ])("returns true for (%i, %i)", (finishedCount, promptsShown) => {
        expect(shouldRequestReview(finishedCount, promptsShown)).toBe(true);
      });
    });

    describe("returns false when prompt cap reached", () => {
      test.each([
        [3, 3],
        [10, 3],
        [15, 3],
      ])("returns false for (%i, %i)", (finishedCount, promptsShown) => {
        expect(shouldRequestReview(finishedCount, promptsShown)).toBe(false);
      });
    });

    describe("returns false for non-milestone counts", () => {
      test.each([
        [1, 0],
        [2, 0],
        [4, 0],
        [5, 0],
        [7, 0],
        [9, 0],
        [11, 0],
        [14, 0],
        [16, 0],
        [100, 0],
      ])("returns false for (%i, %i)", (finishedCount, promptsShown) => {
        expect(shouldRequestReview(finishedCount, promptsShown)).toBe(false);
      });
    });
  });

  describe("triggerReviewIfEligible", () => {
    test("calls requestReview and onPromptShown at milestone", async () => {
      const onPromptShown = jest.fn();
      await triggerReviewIfEligible(3, 0, onPromptShown);

      expect(mockIsAvailableAsync).toHaveBeenCalled();
      expect(mockRequestReview).toHaveBeenCalled();
      expect(onPromptShown).toHaveBeenCalled();
    });

    test("does not call requestReview at non-milestone", async () => {
      const onPromptShown = jest.fn();
      await triggerReviewIfEligible(4, 0, onPromptShown);

      expect(mockIsAvailableAsync).not.toHaveBeenCalled();
      expect(mockRequestReview).not.toHaveBeenCalled();
      expect(onPromptShown).not.toHaveBeenCalled();
    });

    test("does not call requestReview when prompts capped", async () => {
      const onPromptShown = jest.fn();
      await triggerReviewIfEligible(10, 3, onPromptShown);

      expect(mockIsAvailableAsync).not.toHaveBeenCalled();
      expect(mockRequestReview).not.toHaveBeenCalled();
      expect(onPromptShown).not.toHaveBeenCalled();
    });

    test("does not call requestReview when StoreReview unavailable", async () => {
      mockIsAvailableAsync.mockResolvedValue(false);
      const onPromptShown = jest.fn();
      await triggerReviewIfEligible(3, 0, onPromptShown);

      expect(mockIsAvailableAsync).toHaveBeenCalled();
      expect(mockRequestReview).not.toHaveBeenCalled();
      expect(onPromptShown).not.toHaveBeenCalled();
    });

    test("calls onPromptShown after requestReview succeeds", async () => {
      const callOrder: string[] = [];
      mockRequestReview.mockImplementation(async () => {
        callOrder.push("requestReview");
      });
      const onPromptShown = jest.fn(() => callOrder.push("onPromptShown"));

      await triggerReviewIfEligible(10, 1, onPromptShown);

      expect(callOrder).toEqual(["requestReview", "onPromptShown"]);
    });
  });
});
