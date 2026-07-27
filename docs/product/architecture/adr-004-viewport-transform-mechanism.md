# ADR-004: Viewport pan/zoom applied as a single canvas-matrix transform in draw(), not per-shape coordinate rewriting

## Status

Accepted

## Context

`packages/renderer/src/LoopyRenderer.ts` currently draws ~15 private methods (`drawNodes`,
`drawCausalEdges`, `drawConstraintEdges`, `drawAnnotations`, `drawModulators`, `drawGhostNode`,
`drawAffordanceDots`, `drawSignalParticles`, `drawPendingModulatorHint`, ...) directly from raw
`node.x/y` graph coordinates, after only a DPR (device-pixel-ratio) `ctx.setTransform`. There is no
pan/zoom transform anywhere in the stack today (confirmed in DISCUSS). D2 already locks that the
screen↔graph transform is a pure function pair owned by `packages/renderer`; this ADR decides
_how that transform is applied to the draw path_ — the highest-leverage mechanism decision in the
feature, since it determines how much of the mature, tested draw code must change.

## Decision

Apply the viewport as a single canvas transform matrix — `ctx.translate(panX, panY)` then
`ctx.scale(zoom, zoom)` — **once per frame**, composed after the existing DPR `ctx.setTransform`
call, before any `drawXxx()` method runs. Every existing draw method continues to receive and use
raw graph-space coordinates (`node.x/y`, edge endpoints, annotation bounds) completely unchanged;
the canvas matrix does the screen-space translation for free, including font/stroke/arrowhead
scaling (`nodeLabelFont.ts` and friends need no zoom-awareness — the matrix scales whatever they
draw).

Screen→graph conversion needed _outside_ the draw path (pointer/wheel event handling in
`Canvas.tsx`, which must hit-test in graph space) is a **separate, explicit pure function pair** —
`screenToGraph`/`graphToScreen` in `geometry.ts` — not derived from reading the canvas's live
transform matrix. This keeps the transform's mathematical definition in exactly one place
(`geometry.ts`) even though it is _applied_ through two different mechanisms (the `ctx` API for
drawing, explicit function calls for hit-testing), and keeps `hitTest.ts` itself completely
unchanged (it still only ever sees graph-space coordinates, converted by its caller).

## Alternatives Considered

1. **Pre-transform every coordinate before it reaches each `drawXxx()` method** (call
   `graphToScreen()` on every node/edge/annotation coordinate before passing it into the existing
   draw methods; no `ctx.translate/scale` at all). Rejected: requires touching all ~15 existing,
   tested private draw methods and manually rescaling every currently-fixed-size visual (line
   widths, font sizes via `nodeLabelFont.ts`, arrowhead dimensions, edge-hit badge radii) that the
   canvas matrix would otherwise scale automatically. Large surface area, high regression risk to
   mature code, violates "reuse over reimplementation" and "simplest solution first."
2. **Maintain a shadow/duplicate set of screen-transformed node coordinates**, recomputed on every
   viewport change and stored alongside `graph.nodes`. Rejected outright: creates a second source
   of truth for node position, directly conflicting with the locked constraint "panning/zooming/
   reset must never mutate `Graph.nodes[].x/y` or any stored coordinates," and reintroduces exactly
   the divergence risk the Shared Artifacts Registry flags as this feature's highest integration
   risk (renderer and hit-test disagreeing about node position).
3. **(Chosen) Single canvas-matrix transform in `draw()`, pure function pair for hit-testing.**
   Zero changes to any existing `drawXxx()` method; one insertion point; matches how the existing
   DPR transform is already applied (precedent for "one matrix operation at the top of `draw()`,
   everything downstream unaware of it").

## Consequences

**Positive:** ~15 existing draw methods require zero changes; text/stroke/arrowhead scaling is
correct for free via the canvas matrix; the transform's math is defined exactly once
(`geometry.ts`), reused by both the draw-time matrix values and the explicit hit-test conversion;
`hitTest.ts` requires no signature change.

**Negative:** two coordinate-space mental models coexist in the codebase (draw methods think in
graph space via an implicit matrix; `Canvas.tsx` thinks in graph space via explicit function
calls) — mitigated by keeping both directions of the transform defined in one file so there is only
one place a future maintainer needs to read to understand the math, regardless of which mechanism
applies it.

## Enforcement

No new automated architecture-rule tooling is warranted beyond what already exists — this ADR does
not introduce a new module boundary (renderer already owns geometry per D2; this ADR only decides
which mechanism within the renderer applies it). Existing `packages/renderer/src/hitTest.test.ts`
and `LoopyRenderer.test.ts` remain the regression guard: any accidental divergence between the
draw-time matrix and the `screenToGraph`/`graphToScreen` functions will surface as a hit-testing
failure at non-default pan/zoom, which is exactly the scenario US-01 scenario 5 / US-02 scenario 5
assert against.
