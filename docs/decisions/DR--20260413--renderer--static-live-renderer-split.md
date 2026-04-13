---
id: DR--20260413--renderer--static-live-renderer-split
dateCreated: '2026-04-13'
version: 1.0.0
status: draft
changeType: creation
domain: renderer
slug: static-live-renderer-split
changelog:
  - date: '2026-04-13'
    note: Initial creation
  - date: '2026-04-13'
    note: Marked as draft
lastEdited: '2026-04-13'
---
# Static / Live Renderer Split

## 🧭 Context

`LoopyRenderer.ts` mixed two distinct concerns in a single class:

- **Static visual language** — how nodes, edges, signals, and annotations are drawn onto any `CanvasRenderingContext2D`
- **Live animation** — the RAF loop, `TrendTracker` smoothing, interactive overlays (drag ghost, affordance dots, pending modulator hint), and browser globals (`window.devicePixelRatio`, `requestAnimationFrame`)

This coupling prevented headless rendering. When doc image generation was needed, the only choices were: stub browser globals, or duplicate all drawing code. A cloud-agent experiment chose duplication, producing `drawScene.ts` with identical `drawCurvedArrow` and `DELAY_MARKS` copied from `LoopyRenderer.ts`. That duplication is the smell this decision resolves.

## ⚖️ Options Considered

| Option | Description | Outcome | Rationale |
| ------ | ----------- | -------- | --------- |
| A | Keep everything in `LoopyRenderer.ts` | Rejected | Browser globals bleed into drawing code; any new headless consumer duplicates or stubs |
| B | Extract `drawScene.ts` as env-agnostic static renderer; `LoopyRenderer` imports primitives and adds live overlays | **Accepted** | Clear boundary; `drawScene` works with any `CanvasRenderingContext2D`; duplication eliminated |
| C | Full delegation: `LoopyRenderer.draw()` calls `drawScene()` as a base pass, then adds overlays | Deferred | Cleanest long-term, but requires replacing `LoopyRenderer.drawNodes` (which uses `TrendTracker` smoothing) — behaviour change out of proportion to current need |

## 🧠 Decision

`drawScene.ts` is the canonical location for the static visual language. It contains all drawing primitives (`drawCurvedArrow`, `DELAY_MARKS`, `signalChevronVisuals`, `arrowheadDimensions`) and the top-level `drawScene(ctx, width, height, graph, sim)` export. No browser globals.

`LoopyRenderer.ts` is the live renderer. It imports drawing primitives from `drawScene.ts`, owns the RAF loop, `TrendTracker`, and all interactive overlays. It re-exports `signalChevronVisuals`, `arrowheadDimensions`, `ANIM_START`, `ANIM_END` for backward compatibility.

**Accepted trade-off:** `LoopyRenderer` has its own `drawNodes` method (with `TrendTracker` smoothing) that does not delegate to `drawScene`'s `drawNodes`. Two implementations of node rendering exist until Option C is revisited.

## 🪶 Principles

- **Stewardship / Delete-ability:** each module is independently usable and testable. `drawScene` has no browser dep; `LoopyRenderer` has no static rendering consumers.
- **Justice / Shift-left:** the structural pressure for duplication is eliminated at the boundary, not patched case-by-case.
- **Stewardship / Cognitive Load Tax:** Option C (full delegation) was rejected because it adds complexity (two-pass draw) without a concrete use case yet.

## 🔁 Lifecycle

Implemented in `feat/draw-scene-doc-images`. The split is active from this branch merge forward.

## 🧩 Reasoning

The trigger was doc image generation requiring headless Canvas 2D rendering. The `canvas` npm package (node-canvas) provides a `CanvasRenderingContext2D` compatible with the browser API, but `LoopyRenderer` used `window.devicePixelRatio` and `requestAnimationFrame`, blocking direct use.

Moving drawing primitives to `drawScene.ts` resolved the coupling without a behaviour change. `LoopyRenderer` now imports `drawCurvedArrow` from `drawScene.ts` instead of defining it locally — duplication eliminated.

The `drawNodes` duplication (Option C deferral) is bounded: the static version renders `trend` directly from `stockIndicator`; the live version runs it through `TrendTracker` for smooth transitions. These serve genuinely different use cases (snapshot vs animation) and diverging them intentionally is correct.

## 🔄 Next Actions

- Revisit Option C (full delegation) if `drawNodes` implementations diverge in a bug-producing way
- Any new headless consumer (thumbnail generation, server-side rendering, test assertions) should use `drawScene` directly, not `LoopyRenderer`

## 🧠 Confidence

High. The boundary is clean, the trade-off is named and bounded, and the test suite covers both paths (98 renderer tests, 2 `drawScene` smoke tests).

## 🧾 Changelog

_Summarise notable updates, revisions, or corrections. Each should have a date and note in YAML frontmatter for traceability._
