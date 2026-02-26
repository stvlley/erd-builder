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

// IBM i / 5250 terminal palette
export const COLORS = {
  bg: "#1c1c1e",
  canvas: "#141416",
  surface: "#232325",
  elevated: "#2e2e30",
  accent: "#4dba50",
  accentHover: "#5fcc62",
  accentMuted: "#3a8c3d",
  muted: "#7a7d80",
  border: "#7a7d80",
  borderDim: "#3a3a3c",
  text: "#d4d4d4",
  textDim: "#808084",
  textMuted: "#58585c",
  gridDot: "#2a2a2c",
} as const;

// Table color palette for auto-assignment
export const TABLE_COLORS = [
  "#4dba50", // terminal green
  "#5b9bd5", // steel blue
  "#c9a84c", // amber
  "#9b7ec8", // muted purple
  "#c87941", // copper
  "#b85c78", // dusty rose
  "#6ba3a0", // teal grey
  "#8b8bca", // slate violet
  "#4ca688", // jade
  "#b0864c", // brass
] as const;
