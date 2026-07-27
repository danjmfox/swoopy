# Slice 02: Wheel / trackpad-pinch zoom

## Goal
A facilitator can scroll the mouse wheel or pinch on a trackpad to zoom the canvas in/out, centered on the cursor, within clamped bounds, without breaking hit-testing at any zoom level.

## Story
US-02 — Zoom in/out (see `feature-delta.md` for full story, Elevator Pitch, and 5 UAT scenarios).

## IN Scope
- Extends slice 01's viewport state with a `zoom` scalar and extends the transform helper with a scale factor.
- Wheel event handling on the canvas; zoom centered on cursor position (the graph-space point under the cursor stays fixed as scale changes).
- Minimum and maximum zoom bounds enforced (exact numeric values are a DESIGN decision, tracked as an open question).
- Legible rendering (labels, indicators) across the supported zoom range.
- Hit-testing remains accurate at any zoom level within bounds.

## OUT Scope
- Reset-to-fit (slice 03).
- Dedicated touch-pinch gesture handling beyond the trackpad's synthesized wheel deltaY (most browsers already map trackpad pinch to wheel events with `ctrlKey: true`; true multi-touch pinch is out of scope).
- Zoom buttons / keyboard shortcuts (+/-) — candidate accessibility addition, not required for this slice; may be folded into slice 03 if effort allows, otherwise tracked as a future gap.

## Learning Hypothesis
If zoom-toward-cursor requires reworking the pan-only transform helper from slice 01 (rather than a pure additive scale term), this disproves "pan and zoom share one transform function with no rework" — signal to revisit slice 01's transform API before continuing. If slice 01's transform needs no structural change (only a new scale parameter), it confirms the shared-transform design was correct from the start.

## Acceptance Criteria (from US-02)
- AC-02a: Scroll wheel / trackpad pinch changes zoom level, centered on cursor position.
- AC-02b: Zoom is clamped to a min/max range; input beyond bounds has no further effect.
- AC-02c: Node labels/indicators remain legible across the supported zoom range.
- AC-02d: Hit-testing remains accurate at any zoom level within range.
- AC-02e: Zooming never changes any node's/edge's/annotation's stored coordinates (same invariant as pan).

## Production-Data AC
Acceptance test must verify legibility and hit-testing on the same realistic 12+ node fixture used in slice 01, at three concrete zoom levels: default, near-minimum, near-maximum.

## Dependencies
- Slice 01 must be complete (shared transform, shared viewport state).
- Open question forwarded to DESIGN: exact min/max zoom bounds and per-wheel-tick increment (no numeric value prescribed here).

## Effort Estimate
1 day.

## Reference Class
Extends slice 01's transform the way `computeEffectiveWeights` extends base edge weight in the engine — an additive scaling layer over an existing, tested mechanism.

## Pre-Slice Spike
Not required. Zoom-toward-cursor is a well-known formula (translate to keep the cursor's graph-space point fixed under the new scale); no unresolved uncertainty.
