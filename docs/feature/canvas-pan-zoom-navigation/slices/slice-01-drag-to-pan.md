# Slice 01: Drag-to-pan the canvas

## Goal
A facilitator can click-and-drag the empty canvas background to shift the visible viewport and bring off-screen nodes into view, without moving any node in the underlying model.

## Story
US-01 — Pan the canvas (see `feature-delta.md` for full story, Elevator Pitch, and 5 UAT scenarios).

## IN Scope
- New viewport state (pan offset) in `packages/app/src/store.ts`, single source of truth.
- Renderer draw-time translate applied before drawing nodes/edges/annotations (`packages/renderer`).
- Screen→graph coordinate conversion applied before every existing `hitTest()` call site in `Canvas.tsx`.
- Drag-on-empty-background gesture pans the view; existing mode-specific background actions (add-node placement, add-annotation placement, deselect-on-click) continue to work unchanged.
- Pan works across all existing modes (select, add-edge, delete, simulate) without regressing their current click/drag behaviour.

## OUT Scope
- Zoom (slice 02), reset-to-fit (slice 03).
- Keyboard-only panning (arrow-key viewport pan) — flagged as an accessibility gap, tracked for a future feature, not this slice.
- Touch/mobile multi-touch panning.
- Persisting pan position across reloads (D5 — session-only by design).
- Exact input binding (which mouse button / modifier key triggers pan vs. the active mode's existing background click) — open question forwarded to DESIGN; this slice's AC are behavioural ("pan works" + "existing mode actions unchanged"), not input-binding-specific.

## Learning Hypothesis
If pan-drag conflicts with existing node-drag, annotation-drag, or spring-loading (Shift+drag) gestures, the single-shared-transform approach will surface it immediately in this slice — this disproves "the coordinate transform is purely additive with no rework of existing pointer handlers" if any existing Canvas.test.tsx scenario regresses. If all existing pointer-handler tests still pass unmodified after this slice, it confirms the transform can be layered on top of the mature renderer/hitTest code without restructuring it.

## Acceptance Criteria (from US-01)
- AC-01a: Dragging on empty canvas background moves the visible viewport in the drag direction; all nodes/edges/annotations shift together.
- AC-01b: Panning never changes any node's/edge's/annotation's stored coordinates in the graph model.
- AC-01c: After panning, clicking/dragging a node at its new screen position hits that node (hit-testing honors the current viewport transform).
- AC-01d: Panning does not trigger the active mode's background action (node placement, annotation placement, deselect).
- AC-01e: Pan works consistently across select/add-edge/delete/simulate modes.

## Production-Data AC
Acceptance test must exercise a diagram loaded from a realistic multi-node fixture (12+ nodes, mirroring the seed/demo graph shape in `packages/app/src/seed.ts`), not a 1–2 node synthetic fixture — the pain point (off-screen nodes) only manifests at realistic diagram sizes.

## Dependencies
- Existing `packages/renderer/src/{geometry.ts,hitTest.ts,LoopyRenderer.ts}` (mature, tested) — this slice extends, does not rewrite them.
- Existing `packages/app/src/store.ts` state-slice pattern (e.g. `dragPosition`, `focusedNodeId`) as the precedent for adding new state.

## Effort Estimate
1 day (≤6hr crafter dispatch): new store state + transform helper + draw-time translate + hitTest conversion + pointer-handler gating + regression check across existing Canvas.test.tsx scenarios.

## Reference Class
Comparable to the `url-persistence` feature's US-01 (auto-save on mutation) in shape: one new piece of shared state threaded through an existing, well-tested code path — similar effort profile.

## Pre-Slice Spike
Not required — the transform math (translate) is well-understood (standard 2D affine transform); no unresolved technical uncertainty justifies a time-boxed spike before starting.
