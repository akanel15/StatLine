import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");
const BASE_WIDTH = 393; // iPhone 14 Pro
const BUTTON_COLUMNS = 3; // Always 3 columns for consistency

// Device detection
export const isTablet = width >= 768;
export const isSmallPhone = width <= 375;
export const screenWidth = width;

// Standard scaling (capped at 1.5x)
export const scale = (size: number): number => {
  const scaled = (width / BASE_WIDTH) * size;
  return Math.min(scaled, size * 1.5);
};

// For dimensions that should scale more on large screens (buttons, etc.)
export const scaleForLargeScreens = (size: number): number => {
  const scaled = (width / BASE_WIDTH) * size;
  if (isTablet) {
    return Math.min(scaled, size * 2.5); // Allow 2.5x on tablets
  }
  return Math.min(scaled, size * 1.5);
};

// For fonts - scale less aggressively but more on tablets
export const moderateScale = (size: number, factor = 0.3): number => {
  const scaled = size + (scale(size) - size) * factor;
  if (isTablet) {
    return Math.min(scaled, size * 1.5); // Allow 1.5x fonts on tablet
  }
  return Math.min(scaled, size * 1.3);
};

// Calculate button width for exact 3-column fit
export const getButtonWidth = (gap: number = 6, containerPadding: number = 10): number => {
  const scaledGap = scale(gap);
  const scaledPadding = scale(containerPadding);
  const availableWidth = width - scaledPadding * 2;
  const totalGaps = (BUTTON_COLUMNS - 1) * scaledGap;
  return Math.floor((availableWidth - totalGaps) / BUTTON_COLUMNS);
};

// Height-based scaling for elements that need to fit vertically
export const getStatButtonHeight = (baseHeight: number = 75): number => {
  // Available height estimate: screen - nav(44) - tab(49) - matchup(~100) - headings(~80) - gaps(~30) - close(~50) - margins(~20)
  const reservedSpace = 373;
  const availableForButtons = height - reservedSpace;
  const maxFromHeight = Math.floor(availableForButtons / 5); // 5 rows of buttons

  // Width-based scaling (same as scaleForLargeScreens but capped more aggressively)
  const widthScaled = (width / BASE_WIDTH) * baseHeight;
  const cappedByWidth = Math.min(widthScaled, baseHeight * 2.2); // Cap at 2.2x (not 2.5x)

  // Return the smaller of width-scaled or height-available
  return Math.min(cappedByWidth, maxFromHeight);
};

// Shared heights for play-by-play list (must match styled component heights)
export const PLAY_TILE_HEIGHT = scale(48);
export const DIVIDER_HEIGHT = scale(44);
