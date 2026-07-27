# DISCUSS Decisions — canvas-pan-zoom-navigation

## Key Decisions

- [D1] Viewport state (`panX`, `panY`, `zoom`) is a single source of truth owned by `packages/app/src/store.ts`, read by both the renderer's draw-time transform and Canvas.tsx's hit-test coordinate conversion: prevents the two consumers from ever disagreeing about the current transform (see feature-delta.md Shared Artifacts Registry).
- [D2] The screen↔graph coordinate transform is a pure function pair, owned by `packages/renderer` (consistent with DR--20260327 CSS-pixel geometry ownership) — `packages/app` calls it, never reimplements the math.
- [D3] No separate walking-skeleton phase. Slice 1 (drag-to-pan) is treated as the thinnest end-to-end proof of the shared integration risk (transform threading through store → renderer draw → hitTest → pointer handlers). Slices 2–3 are additive to the same transform, not independent integration surfaces. This is a deliberate deviation from the textbook "one thin task per backbone activity" rule — flagged, not silent (see feature-delta.md Walking Skeleton Decision for full rationale).
- [D4] One JTBD job (`navigate-diagram-viewport`), not three. Pan, zoom, and reset-to-fit are sub-motivations of a single job story sharing one Push/Pull/Anxiety/Habit profile. Opportunity scoring skipped — only one job identified.
- [D5] Viewport state (pan/zoom) is session-only and explicitly NOT persisted to `swoopy_graph_<id>` localStorage or the URL. Persisting it would require a serialization schema change (current schema is versioned at v5) — out of scope for this feature, tracked as a future decision if requested.
- [D6] Full JTBD analysis (job dimensions, four forces) rendered as a pre-authorized [WHY] expansion in feature-delta.md — the user explicitly selected "Full nWave DISCUSS" for JTBD specifically, overriding the project's lean+ask-intelligent density default for that one section only. No other Tier-2 expansion triggers fired (see feature-delta.md density note).

## Requirements Summary

- Primary job: facilitators (e.g. Priya Raman, agile coach) running live systems-thinking sessions need to pan/zoom/reset the canvas once a diagram outgrows one screen, without breaking flow or losing model data.
- Walking skeleton scope: none separate — see D3.
- Feature type: user-facing (canvas interaction).
- 3 user stories (US-01 pan, US-02 zoom, US-03 reset-to-fit), 3 elephant-carpaccio slices, each ≤1 day.

## Constraints Established

- Renderer/app package boundary preserved: transform math in `packages/renderer`, viewport state in `packages/app/src/store.ts`, no new cross-package duplication.
- No test touches the renderer directly from app-level tests (existing constraint, per `docs/product/architecture/brief.md`) — unaffected by this feature.
- Panning/zooming must never mutate node/edge/annotation coordinates in the `Graph` model — viewport is display-only.
- Viewport state is not part of the persisted/serialized graph (v5 schema unchanged).

## Upstream Changes

- None. No DISCOVER or DIVERGE artifacts exist for this feature (went straight from `/nw-new` to `/nw-discuss`). This is itself a tracked risk, not a contradiction: the JTBD job story below is authored by Luna directly from the feature description and `docs/product/vision.md`'s persona, not validated via user interviews or DIVERGE opportunity scoring. See feature-delta.md Pre-requisites section for the recommended follow-up validation.
