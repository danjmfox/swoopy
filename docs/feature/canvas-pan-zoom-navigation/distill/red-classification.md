# RED Classification — canvas-pan-zoom-navigation

Run: `npx vitest run` (root, workspace projects `engine`/`renderer`/`app`/`scripts`), 2026-07-24.

Result: **34 new failing tests, all classify as RED (MISSING_FUNCTIONALITY). Zero BROKEN.**
Pre-existing suite: 601 passed, 6 skipped (unrelated, pre-existing) — zero regressions from
this DISTILL session's edits (the 4 `Canvas.test.tsx` fixes + new scaffolds).

Per `nw-distill` "Pre-DELIVER fail-for-the-right-reason gate": every failure below reaches
either (a) the scaffold's thrown `Error` (a designed RED signal, not an infra error), or
(b) a real assertion that fails because the driving-port wiring doesn't exist yet. Neither
is an `IMPORT_ERROR` / `FIXTURE_BROKEN` / `SETUP_FAILURE` / `WRONG_ASSERTION`. Handoff gate:
**PASS** — zero BROKEN classifications, no fix required before DELIVER.

## packages/renderer/src/geometry.test.ts (15 failures — all thrown-scaffold RED)

| Test | Classification |
|---|---|
| `clampZoom` — 5 example cases + 2 property tests | RED — throws `__SCAFFOLD_VIEWPORT__` Error from `clampZoom()` |
| `screenToGraph / graphToScreen` — identity + roundtrip property | RED — throws from `screenToGraph()` |
| `zoomAtCursor` — cursor-fixed-point property + clamp-bounds property | RED — throws from `zoomAtCursor()` (via `screenToGraph()` for the first) |
| `computeFitViewport` — 0-node, 1-node examples + 2 property tests | RED — throws from `computeFitViewport()` |

All 15 fail via `Error: Not yet implemented — RED scaffold (__SCAFFOLD_VIEWPORT__)` thrown
from the scaffold function body (`packages/renderer/src/geometry.ts`). Correct RED per
Mandate 7 — assertion-equivalent failure, not `ImportError`/`ModuleNotFoundError`.

## packages/app/src/canvas-pan-zoom.acceptance.test.tsx (19 failures)

| Test | Failure mode | Classification |
|---|---|---|
| `setViewportPan shifts the viewport in the drag direction` | thrown scaffold Error (`store.ts` `setViewportPan`) | RED |
| `unbounded-preservation panning never mutates node/edge/annotation coordinates` | thrown scaffold Error | RED |
| `@walking_skeleton dragging on empty canvas background shifts the viewport (AC-01a)` | assertion fails — `viewport` unchanged (Canvas.tsx has no pan-gesture wiring yet) | RED (MISSING_FUNCTIONALITY) |
| `panning in add-node mode does not create a node (AC-01d)` | assertion fails — node count went 14→15 (no movement-threshold gate exists yet, add-node still fires unconditionally on pointerdown) | RED (MISSING_FUNCTIONALITY) — this is the exact gap ADR-003 describes |
| `pan works in select/add-edge/delete/simulate mode (AC-01e)` ×4 | assertion fails — `viewport` unchanged | RED (MISSING_FUNCTIONALITY) |
| `zoomAt changes the zoom level` | thrown scaffold Error | RED |
| `unbounded-preservation zooming never mutates node coordinates` | thrown scaffold Error | RED |
| `repeated zoom-in stops at the maximum bound (AC-02b)` | thrown scaffold Error | RED |
| `repeated zoom-out stops at the minimum bound (AC-02b)` | thrown scaffold Error | RED |
| `mouse-wheel-desktop: wheel event over the canvas changes zoom` | assertion fails — zoom unchanged (Canvas.tsx has no `wheel` listener yet) | RED (MISSING_FUNCTIONALITY) |
| `trackpad-pinch-ctrl-wheel: wheel event over the canvas changes zoom` | assertion fails — zoom unchanged | RED (MISSING_FUNCTIONALITY) |
| `resetViewport produces a finite, non-erroring viewport` ×3 (empty/single/many) | thrown scaffold Error | RED |
| `unbounded-preservation Reset View never mutates the graph model (AC-03d)` | thrown scaffold Error | RED |
| `Reset View recovers from an extreme zoomed-out state (AC-03a)` | thrown scaffold Error | RED |

## Tests that PASS already at DISTILL handoff (expected, not a gap)

Two Reset-View-discoverability tests pass without any scaffold change, because the scaffold
button itself was added to `Toolbar.tsx` in this DISTILL session (a UI-existence check, not
business logic — analogous to "already implemented from WS, remove `@skip`"):

- `Reset View control is discoverable — visibly labelled, always rendered (AC-03e)`
- `Reset View control is available regardless of mode (AC-03b, mode=...)` ×5

These are legitimate GREEN-at-handoff — AC-03e/AC-03b only require the control to exist and
render in every mode, which the scaffold button already satisfies. The button's `onClick`
still throws (verified separately in the `resetViewport` tests above), so no business logic
was implemented ahead of DELIVER.

## packages/app/src/Canvas.test.tsx (89 tests, all pass — 4 fixed this session)

Fixed per ADR-003's flagged consequence (background mode-actions now commit on `pointerup`,
not `pointerdown`): added a matching `pointerup` dispatch to 4 tests that previously asserted
an outcome from a lone `pointerdown`. All 89 tests in this file pass — zero regressions.
