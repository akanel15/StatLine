import * as StoreReview from "expo-store-review";

const REVIEW_MILESTONES = [3, 5, 10];

export const shouldRequestReview = (
  finishedGameCount: number,
  reviewPromptsShown: number,
): boolean => {
  if (reviewPromptsShown >= 3) return false;
  return REVIEW_MILESTONES.includes(finishedGameCount);
};

export const triggerReviewIfEligible = async (
  finishedGameCount: number,
  reviewPromptsShown: number,
  onPromptShown: () => void,
): Promise<void> => {
  if (!shouldRequestReview(finishedGameCount, reviewPromptsShown)) return;
  if (!(await StoreReview.isAvailableAsync())) return;
  await StoreReview.requestReview();
  onPromptShown();
};
