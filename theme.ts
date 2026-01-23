export const theme = {
  colorOrangePeel: "#FFA000",
  colorOnyx: "#393D3F",
  colorLightGrey: "#eee",
  colorWhite: "#fff",
  colorBlack: "#000",
  colorGrey: "#808080",
  colorBlue: "#007BFF",
  colorRedCrayola: "#EF3054",
  colorMayaBlue: "#7CC6FE",
  colorMindaroGreen: "#C5D86D",
  colorLightGreen: "#d4edda",
  colorLightRed: "#f8d7da",
  colorGreen: "#155724",
  colorRed: "#721c24",
  colorPurple: "#6f42c1",
  colorTeal: "#20c997",
  colorWarning: "#ffc107",
  colorSuccess: "#28a745",
  colorDestructive: "#DC2626",
};

// Typography system for Dynamic Type support
// Use with AppText component for automatic font scaling
export const typography = {
  display: { fontSize: 32, fontWeight: "700" as const, lineHeight: 38 },
  headline: { fontSize: 24, fontWeight: "700" as const, lineHeight: 30 },
  title1: { fontSize: 20, fontWeight: "600" as const, lineHeight: 26 },
  title2: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22 },
  bodyBold: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
  caption: { fontSize: 14, fontWeight: "500" as const, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
  tiny: { fontSize: 10, fontWeight: "400" as const, lineHeight: 14 },
};

export type TypographyVariant = keyof typeof typography;
