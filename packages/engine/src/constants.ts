export type SizeTier = "xs" | "s" | "m" | "l" | "xl";

export const NODE_SIZE_RADII: Record<SizeTier, number> = {
  xs: 22,
  s: 26,
  m: 30,
  l: 34,
  xl: 38,
};

export type ColourTier =
  | "blue"
  | "green"
  | "red"
  | "orange"
  | "yellow"
  | "teal"
  | "purple"
  | "grey";

export const NODE_COLOURS: Record<
  ColourTier,
  { swatch: string; low: string; high: string }
> = {
  blue:   { swatch: "#3b82f6", low: "#254d90", high: "#2563eb" },
  green:  { swatch: "#22c55e", low: "#196e44", high: "#16a34a" },
  red:    { swatch: "#ef4444", low: "#7f2e37", high: "#dc2626" },
  orange: { swatch: "#f97316", low: "#844520", high: "#ea580c" },
  yellow: { swatch: "#facc15", low: "#857220", high: "#ca8a04" },
  teal:   { swatch: "#14b8a6", low: "#126868", high: "#0d9488" },
  purple: { swatch: "#a855f7", low: "#5c3691", high: "#9333ea" },
  grey:   { swatch: "#6b7280", low: "#3d4555", high: "#9ca3af" },
};

// Signal travel speed — fraction of edge traversed per second.
// Provisional: visually legible at typical canvas edge lengths. (PRD §7.6)
export const SIGNAL_SPEED = 0.65;

// Edge transit time in ticks at 60 fps. Used to space staggered signals evenly
// along an edge so N signals appear as N equally-spaced particles. (PRD §7.2)
export const EDGE_TRANSIT_TICKS = Math.round(1 / (SIGNAL_SPEED * (1 / 60))); // ≈ 92

// Maximum edge traversals a signal may make before being consumed without relay.
// Empirically chosen: saturates a simple 2-node reinforcing loop from 5→10 in one injection.
// See packages/engine/src/characterise-relay.ts for evidence. (DR--20260401)
export const MAX_HOPS = 8;

// Strength of a single user injection (positive or negative). One click = 1 unit
// = 10% of the default 0–10 range. (PRD §7.6)
export const INJECT_STRENGTH = 1.0;

// Maximum concurrent travelling signals. One immediate signal per edge is emitted per
// emission cycle (staggered model: only i=0 enters travelling; i>0 enter pending).
// Worst-case baseline: 12-node fully-connected graph = 12×11 = 132 edges, all emitting
// simultaneously at max injection. Set to 132 to avoid silent signal drop in this scenario.
// Stagger-pending signals are not capped — they self-drain into travelling over ~92 ticks.
export const MAX_SIGNALS = 132;

// Delay tick counts — named constants mapping human time scales to simulation ticks.
// These are communication conventions for the modeller, not simulation invariants.
// Short = days, Medium = weeks, Long = months. (PRD §7.3)
// TBD: to be validated by characterisation test (PRD §7.7).
export const DELAY_TICKS_SHORT = 30;
export const DELAY_TICKS_MEDIUM = 150;
export const DELAY_TICKS_LONG = 600;
