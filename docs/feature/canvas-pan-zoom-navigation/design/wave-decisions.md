# DESIGN Decisions — canvas-pan-zoom-navigation

## Key Decisions

- [DDD-1] Viewport transform mechanism = single canvas-matrix (`ctx.translate`/`ctx.scale`) applied
  once per frame in `LoopyRenderer.draw()`, not per-shape coordinate rewriting. Zero changes to the
  ~15 existing `drawXxx()` methods. See ADR-004.
- [DDD-2] Screen→graph coordinate conversion happens at `Canvas.tsx` call sites, before every
  existing `hitTest()` call; `hitTest.ts`'s signature and internals are completely unchanged.
- [DDD-3] Pan input binding = plain left-button drag on empty canvas background, in every mode, no
  modifier key. Discrimination from mode-specific background click actions (add-node,
  add-annotation, deselect) uses a 4px movement threshold, evaluated on `pointermove`, with the
  candidate mode action committed on `pointerup` only if no movement occurred. See ADR-003.
- [DDD-4] Shift-held background drag (existing spring-loading instant-add-node gesture) is
  excluded from the new pan gate — pan only engages when `!shiftHeld`, preserving that gesture.
- [DDD-5] Zoom bounds = `[0.5, 4]` (50%–400%), centered-on-cursor via `zoomAtCursor`. Rationale:
  `nodeLabelFont.ts` renders the reference (m-tier) node label at 13px before any zoom; at the
  minimum bound (0.5×) that renders at 6.5px — the lower edge of legibility for a screen-share
  context, accepted because Reset View (not manual zoom-out) is the feature's dedicated
  "see everything" mechanism (US-03), not manual zoom. At the maximum bound (4×) a canvas 2D
  redraw scales cleanly with no vector breakage, so the ceiling is a UX-sanity choice, not a
  technical necessity — 4× matches common diagram-tool conventions (Miro allows up to 400%).
  Wheel/pinch increment target ≈10% zoom change per standard wheel notch, multiplicative
  (exponential) rather than additive, so relative zoom-in/out feel stays consistent regardless of
  current zoom level — exact sensitivity constant is a crafter implementation choice within these
  bounds, not prescribed here (architecture specifies contract + bounds, not algorithm, per
  principle 2).
- [DDD-6] Empty/single-node Reset View default: one general `computeFitViewport` algorithm with a
  minimum-extent guard for degenerate (zero-width/height) bounding boxes — no special-cased 0-node
  or 1-node branches. A 0-node diagram's bounding box has no extent, so the guard substitutes a
  default extent, which combined with `clampZoom` naturally yields `zoom=1, pan=(0,0)` (the
  identity transform — matches the app's pre-feature rendering exactly, so a brand-new empty
  diagram behaves identically to before this feature shipped). A 1-node diagram similarly degenerates
  to a point-sized box, guarded the same way, producing a "centered, non-extreme zoom" result without
  a separate code path. `computeFitViewport`'s output is passed through the same `clampZoom` used by
  wheel-zoom — one shared zoom-validity invariant, applied everywhere zoom is set, per AC-03c
  (never zero/negative/infinite).

  **Amended during DELIVER (step 01-03) — see `docs/product/architecture/adr-005-reset-view-zoom-floor-decoupled.md`**:
  sharing `ZOOM_MIN=0.5` as the lower bound is unsatisfiable for AC-03a on diagrams spread wider
  than the 0.5× floor can display (discovered via the property test in `geometry.test.ts`).
  `computeFitViewport`'s lower bound is now its own dedicated floor (guards only against
  zero/negative/infinite, not legibility) — the upper bound (`ZOOM_MAX=4`) is retained shared with
  wheel-zoom unchanged, since it never conflicts with AC-03a.
- [DDD-7] Viewport state (`panX`, `panY`, `zoom`) and its three actions (`setViewportPan`,
  `zoomAt`, `resetViewport`) bypass `commitGraph`/the undo-redo stack entirely — ephemeral,
  session-only state in the same category as the existing `dragPosition`/`hoveredEdgeRegion`
  precedent (matches D5).
- [DDD-8] `Viewport` type is owned by `packages/renderer/src/geometry.ts` (co-located with the
  pure functions that operate on it), imported by `packages/app/src/store.ts` — avoids a duplicate
  shape definition in `app`, consistent with D2 (renderer owns geometry).

## Architecture Summary

No new architectural pattern introduced — this is a bounded, additive extension within the
existing modular monolith / renderer-app split. All new logic lands inside five already-existing
files (`geometry.ts`, `hitTest.ts` — unchanged, `LoopyRenderer.ts`, `store.ts`, `Canvas.tsx`, plus
`Toolbar.tsx` for the Reset View control). No new package, no new top-level module, no new runtime
dependency. Development paradigm stays consistent: pure functions in `packages/renderer`
(functional core), imperative event wiring in `packages/app` (imperative shell) — matches the
project-wide Pure Core / Imperative Shell standard.

## Reuse Analysis

| Existing Component | File | Overlap | Decision | Justification |
| --- | --- | --- | --- | --- |
| `geometry.ts` pure functions (`edgeEndpoints`, `bezierPoint`, etc.) | `packages/renderer/src/geometry.ts` | Same "pure CSS-pixel geometry, renderer-owned" pattern | EXTEND | Add `screenToGraph`, `graphToScreen`, `clampZoom`, `zoomAtCursor`, `computeFitViewport`, `Viewport` type to this file — same ownership convention (D2), no new file |
| `hitTest(graph, x, y)` | `packages/renderer/src/hitTest.ts` | Consumes graph-space x/y; assumed-equal-to-screen today | NO CHANGE (consumer-side fix only) | Callers gain a `screenToGraph` conversion step; `hitTest` itself stays viewport-agnostic — smaller diff than adding a viewport parameter to a pure, already-tested function (see ADR-004 sub-decision) |
| `LoopyRenderer.draw()` | `packages/renderer/src/LoopyRenderer.ts` | Draws graph coordinates directly, no transform beyond DPR | EXTEND | Insert one `ctx.translate`/`ctx.scale` call at the top of `draw()`, after the DPR transform, before existing `drawXxx()` calls — no changes to any of the ~15 private draw methods (ADR-004) |
| Ephemeral store-state pattern (`dragPosition`, `hoveredEdgeRegion`, `focusedNodeId`) | `packages/app/src/store.ts` | Precedent for non-persisted, non-undo-tracked state | EXTEND | Add `viewport` state slice + `setViewportPan`/`zoomAt`/`resetViewport` actions following the identical ephemeral-state pattern |
| Canvas.tsx pointer-handler state machine (`hasDragged`, drag-vs-click at `pointerup`) | `packages/app/src/Canvas.tsx` | Precedent for deferred-commit drag-vs-click discrimination (already used for node/annotation drag) | EXTEND | Extend the same discrimination pattern to background gestures (ADR-003); add a `wheel` listener (genuinely new event type, no prior precedent to extend) |
| Toolbar.tsx mode-button row | `packages/app/src/Toolbar.tsx` | Existing button/title/shortcut styling pattern | EXTEND | Add a "Reset View" control using the same `btn` style convention — not mode-gated (an action, not a mode) |

No new component/file created. Only genuinely new code: the `wheel` event listener (no existing
event handler to extend) and the new pure functions in `geometry.ts` (no existing function computes
a viewport transform today — confirmed absent in DISCUSS).

## Technology Stack

No new dependency. No new package. Confirmed explicitly: this feature is implemented entirely with
existing project dependencies (React, Zustand, Canvas 2D — all already in use).

## Constraints Established

- `Viewport` type and all viewport transform math owned by `packages/renderer`; `packages/app`
  calls it, never reimplements (D2, reaffirmed).
- `hitTest.ts` signature frozen — no viewport parameter added to it.
- Viewport state/actions never call `commitGraph` and are excluded from `past`/`future` (undo
  stack) and from `persist()` — matches D5.
- `LoopyRenderer`'s `RendererStore` interface gains only a read-only `viewport` field; the renderer
  continues to have zero write access to the store (existing read-only driving-port pattern,
  unchanged).
- Zoom range `[0.5, 4]`, `Reset View` output always clamped through the same `clampZoom` used by
  wheel-zoom.

## Upstream Changes

- `docs/product/architecture/brief.md` — new `## Application Architecture` section added (this was
  the first architect section in that file for this project; no conflicting prior section to
  reconcile).
- Two new ADRs added: `adr-003-pan-drag-vs-click-discrimination.md`,
  `adr-004-viewport-transform-mechanism.md`.

## Open Questions Resolved

Both open questions forwarded from DISCUSS are resolved by this wave — see ADR-003 (input binding)
and DDD-5/DDD-6 above (zoom bounds, wheel increment, empty-diagram default). No open question
survives into DISTILL, with one flagged consequence for acceptance-designer's attention: existing
`Canvas.test.tsx` scenarios asserting add-node/add-annotation/deselect from a lone `pointerdown`
dispatch will need a `pointerup` added to their setup (ADR-003 Consequences).
