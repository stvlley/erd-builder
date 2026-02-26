// Layout geometry
export const TABLE_W = 260;
export const ROW_H = 24;
export const HEADER_H = 56;

// Grid layout for auto-positioning
export const GRID_GAP_X = 320;
export const GRID_GAP_Y = 40;
export const GRID_START_X = 60;
export const GRID_START_Y = 60;
export const GRID_COLS = 3;

// Neo-industrial palette
export const COLORS = {
  bg: "#242424",
  canvas: "#1a1a1a",
  surface: "#2a2a2a",
  elevated: "#333333",
  accent: "#2ecc40",
  accentHover: "#5fd96a",
  muted: "#adb3b7",
  border: "#adb3b7",
  borderDim: "#444444",
  text: "#e8e8e8",
  textDim: "#888888",
  textMuted: "#666666",
  gridDot: "#333333",
} as const;

// Table color palette for auto-assignment
export const TABLE_COLORS = [
  "#2ecc40", // phosphor green
  "#38BDF8", // sky blue
  "#34D399", // emerald
  "#C084FC", // purple
  "#FB923C", // orange
  "#F472B6", // pink
  "#A78BFA", // violet
  "#FBBF24", // amber
  "#2DD4BF", // teal
  "#818CF8", // indigo
] as const;
