// Signal travel speed — fraction of edge traversed per second.
// Provisional: visually legible at typical canvas edge lengths. (PRD §7.6)
export const SIGNAL_SPEED = 0.65

// Exponential decay constant (per second). Provisional: nodes return to rest
// in ~3s without incoming signals. Formula: initial + (v - initial) × (1-DECAY)^dt
export const DECAY = 0.28

// Minimum |delta| before a node emits signals on outgoing edges.
// Suppresses noise without masking weak signals. (PRD §7.6)
export const EMIT_THRESHOLD = 0.06

// Strength of a single user injection (positive or negative). One click = 1 unit
// = 10% of the default 0–10 range. (PRD §7.6)
export const INJECT_STRENGTH = 1.0

// Delay tick counts — named constants mapping human time scales to simulation ticks.
// These are communication conventions for the modeller, not simulation invariants.
// Short = days, Medium = weeks, Long = months. (PRD §7.3)
// TBD: to be validated by characterisation test (PRD §7.7).
export const DELAY_TICKS_SHORT = 30
export const DELAY_TICKS_MEDIUM = 150
export const DELAY_TICKS_LONG = 600
