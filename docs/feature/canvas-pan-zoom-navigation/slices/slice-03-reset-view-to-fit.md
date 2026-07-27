# Slice 03: Reset view to fit the diagram

## Goal
A facilitator who has panned or zoomed into a disorienting view can, in a single action, snap back to a view containing every node in the current diagram, fully visible and legible.

## Story
US-03 — Reset view to fit (see `feature-delta.md` for full story, Elevator Pitch, and 5 UAT scenarios).

## IN Scope
- A discoverable "Reset View" control (button and/or keyboard shortcut) always available regardless of current pan/zoom, mode, or diagram size.
- Fit-to-content calculation: bounding box over all node positions (+ radius) and annotations, mapped to a viewport that makes everything visible and legible.
- Defined, non-erroring behaviour for zero-node and one-node diagrams.
- Directly addresses both journey error paths: zoomed out too far to read anything, and panned a node off-screen and lost track of it.

## OUT Scope
- Animated fly-to transition — an instant snap is sufficient for this slice; animation is a future polish item.
- "Focus on node" targeted zoom-to-a-specific-node — a distinct, more advanced feature from generic fit-to-content; out of scope here.
- Persisting the reset/default view across reloads (D5 — session-only).

## Learning Hypothesis
If facilitators in a usability check still feel "lost" after clicking Reset View (e.g. because fit-to-content zooms in too far on a dense cluster, or too far out to read labels), this disproves "a single fit-to-bounding-box reset is sufficient recovery" — signal to add padding/max-zoom-in constraints to the fit calculation. If the usability check shows immediate relief/re-orientation, it confirms the simple fit-to-content approach is enough — no need for a more elaborate "smart" reset.

## Acceptance Criteria (from US-03)
- AC-03a: Reset View sets the viewport so every node is fully visible with legible labels (fit-to-content).
- AC-03b: Reset View is always available regardless of pan/zoom state, mode, or diagram size (including 0 and 1 node).
- AC-03c: Reset View never errors or produces a broken viewport (zero/negative/infinite scale) on any diagram.
- AC-03d: Reset View does not alter the graph model — only the viewport changes.
- AC-03e: The Reset View control is visually discoverable without requiring documentation.

## Production-Data AC
Acceptance test must cover three diagram sizes from real usage patterns: 0 nodes (new model), 1 node (just started), and the realistic 12+ node fixture shared with slices 01–02 (post pan+zoom disorientation scenario).

## Dependencies
- Slices 01 and 02 must be complete (reset writes to the same viewport state both slices established).
- Open question forwarded to DESIGN: exact default view for the 0-node case (no bounding box possible) — e.g. zoom=1, pan=0,0.

## Effort Estimate
0.5–1 day (smaller than slices 01/02 — no new gesture-handling code, only a bounding-box calculation and one UI control wired to existing viewport state).

## Reference Class
Comparable to `newModel()`'s "reset to a known-good state" shape (`packages/app/src/store.ts`) — a single store action that recomputes and overwrites one piece of state, with defined edge-case behaviour for the empty case.

## Pre-Slice Spike
Not required. Bounding-box-to-viewport-fit is a standard, well-understood calculation.
