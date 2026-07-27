# ADR-005: Reset View's zoom floor is decoupled from manual zoom's ZOOM_MIN

## Status

Accepted

## Context

DDD-6 (DESIGN wave) specified that `computeFitViewport`'s computed zoom is passed through the
same `clampZoom` function used by manual wheel-zoom (`ZOOM_MIN=0.5`, `ZOOM_MAX=4`), reasoning that
"one shared zoom-validity invariant, applied everywhere zoom is set" was simpler than two.

During DELIVER (step 01-03), the crafter discovered this is unsatisfiable for AC-03a ("every node
is fully visible with legible labels") on diagrams whose content spread exceeds what the 0.5×
floor can show: at `zoom=0.5` an 800×600 canvas displays 1600×1200 graph-units; any diagram with
nodes spread wider than that in either axis cannot have every node on screen at any pan/center
choice once zoom is floored at 0.5. The feature's own property test
(`packages/renderer/src/geometry.test.ts`, "every node's screen position lies within the canvas
bounds") generates node spreads up to 4000 units and correctly failed, proving the gap is real, not
a test artifact.

This is a genuine conflict between two acceptance criteria that DDD-6 implicitly assumed compatible:

- **AC-03a** (Reset View correctness): every node must be visible after Reset View — an
  unconditional promise.
- **AC-02b / ZOOM_MIN's actual purpose** (manual zoom legibility): 0.5× is a UX floor — DESIGN's own
  rationale (feature-delta.md DDD-5) notes 0.5× already renders reference-size labels at 6.5px,
  "the lower edge of legibility," accepted specifically because Reset View — not manual zoom-out —
  was designed to be the feature's dedicated "see everything" mechanism. DDD-6 then undermined that
  by giving Reset View the same floor as the mechanism it was meant to be the escape hatch for.

## Decision

`computeFitViewport`'s zoom is clamped to its own dedicated range, not `clampZoom`'s
`[ZOOM_MIN, ZOOM_MAX]`:

- **Lower bound**: a small positive constant (`RESET_VIEW_ZOOM_FLOOR`, e.g. `0.001`) whose only job
  is preventing zero/negative/infinite scale (AC-03c) — not a legibility floor. Reset View may zoom
  out below manual zoom's 0.5× floor when content genuinely requires it to keep every node visible.
- **Upper bound**: unchanged, still `ZOOM_MAX=4` — this direction never conflicts with AC-03a
  (capping zoom-_in_ only ever shows more area than the natural fit requires, never less), so
  reusing the existing ceiling is safe and requires no new reasoning.

Manual wheel-zoom's `clampZoom`/`ZOOM_MIN=0.5` is unchanged — this ADR narrows DDD-6, it does not
reopen DDD-5.

## Alternatives Considered

1. **(Rejected — user's non-chosen option) Narrow the property test's node-spread generator** to a
   range the 0.5× floor can satisfy. Rejected: treats a real product gap (Reset View silently
   failing to show everything on a large, legitimately-buildable diagram) as a test artifact. The
   engine (`packages/engine`) places no upper bound on node coordinate spread — a facilitator
   dragging nodes far apart during a long session is a real, not hypothetical, input.
2. **(Chosen) Decouple Reset View's zoom floor from `ZOOM_MIN`.** Preserves AC-03a's unconditional
   promise for all realistic and unrealistic diagrams alike; only weakens legibility (not
   correctness) in the pathological large-spread case, which is the correct trade-off since Reset
   View's entire purpose is recovery from disorientation, not maintaining a legible zoom level.

## Consequences

**Positive**: AC-03a holds unconditionally, matching its literal wording and the feature's Anxiety
force (DISCUSS JTBD) — Reset View always works, full stop. No change to manual zoom's UX floor.

**Negative**: for pathologically spread diagrams, Reset View may produce an extremely small,
technically-illegible zoom level. Accepted: this is strictly better than the alternative (silently
failing to show some nodes at all), and such diagrams are themselves an edge case a facilitator
would immediately notice and address (e.g. by deleting stray far-flung nodes) rather than a
steady-state working mode.

## Amends

DDD-6 (`docs/feature/canvas-pan-zoom-navigation/design/wave-decisions.md`) — the "one shared
zoom-validity invariant" simplification is superseded by this ADR for the lower bound only; upper
bound sharing (`ZOOM_MAX`) is retained from DDD-6 unchanged.
