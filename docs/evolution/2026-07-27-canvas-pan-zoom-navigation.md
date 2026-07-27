# Evolution: canvas-pan-zoom-navigation

**Date**: 2026-07-27
**Feature ID**: canvas-pan-zoom-navigation
**Goal**: Add Miro/Figma-style pan/zoom/reset-to-fit viewport navigation to the Swoopy canvas, so
facilitators running live systems-thinking sessions can keep working with diagrams larger than one
screen without pausing to reload or resize the browser window.

## Summary

Facilitators can now drag the empty canvas background to pan, scroll/pinch to zoom centered on the
cursor, and click a "Reset View" toolbar control to snap back to a fully-visible, legible view of
the whole diagram. Brownfield addition entirely within `packages/renderer` (5 new pure geometry
functions + one transform insertion) and `packages/app` (viewport store slice + Canvas gesture
wiring + Toolbar control) — zero new files, zero new runtime dependencies, zero changes to the
`packages/engine` domain model or the persisted graph schema (viewport state is session-only, never
serialized).

## Business Context

Before this feature, Swoopy rendered the full graph at a single fixed scale and position with no
camera — a diagram growing past ~12 nodes, or a shared model built on a wider monitor, could place
nodes permanently outside the visible canvas with no recovery short of resizing the browser window
mid-session (disrupting screen-share layout) or reloading (risking state loss for transient
shared-URL models). This directly threatened the product's core value proposition — "the
conversation while building" — once a live session's diagram grew past what fits on one screen.

## Steps Completed

| Step | Name | Outcome |
|------|------|---------|
| 01-01 | Drag-to-pan viewport transform (walking skeleton) | PASS (commit `0c0c21e`) |
| 01-02 | Wheel/trackpad-pinch zoom centered on cursor | PASS (commit `6e188c9`) |
| 01-03 | Reset View — fit viewport to diagram content | PASS (commit `738af0d`), after one genuine mid-flight architecture escalation (see Issues below) |
| refactor-01 | L1-L6 refactoring pass | PASS (commits `5943465`, `216d974` — two passes, both found real cleanup opportunities) |

## Key Decisions

### DISCUSS
- **D1–D6** (full list in `docs/feature/canvas-pan-zoom-navigation/discuss/wave-decisions.md`): one
  JTBD job (`navigate-diagram-viewport`) covering pan/zoom/reset as sub-motivations, not three
  separate jobs; no separate walking-skeleton phase (slice 1/pan serves as the thin end-to-end
  proof, a deliberate documented deviation from the textbook rule); viewport state is session-only,
  never persisted.
- User explicitly chose **Full nWave DISCUSS** (complete JTBD ceremony) over the project's lean
  default, given the intent to exercise the whole pipeline deliberately.

### DESIGN
- **DDD-1–DDD-8** (`design/wave-decisions.md`): single canvas-matrix transform
  (`ctx.translate`/`ctx.scale`) in `LoopyRenderer.draw()`, not per-shape coordinate rewriting
  (ADR-004); pan-vs-click discrimination via a 4px movement threshold with mode-action commit
  deferred to `pointerup` (ADR-003); zoom range `[0.5, 4]`; viewport state bypasses undo/persist
  entirely, same category as existing `dragPosition`.
- Reuse Analysis: **all EXTEND, zero new files** — the entire feature landed inside 6 pre-existing
  files.

### DEVOPS
- Confirmed the existing GitHub Actions CI (`lint → typecheck → test → dependency-review → build →
  sbom → deploy`) needed **zero changes** — later verified empirically, not just assumed.
- KPI instrumentation explicitly **deferred** (user's choice) — client-only hobby app, no backend;
  acceptance tests + occasional manual usability sessions substitute for telemetry.
- Surfaced and resolved a real gap in the project's mutation-testing policy: `packages/renderer`
  was named in neither CLAUDE.md's "scoped to engine" nor "exclude app" clauses. Resolved via
  **`docs/decisions/DR--20260724--process--mutation-testing-scope.md`** — scope is now defined by
  module characteristic (pure logic, any package) rather than package boundary, matching an
  already-existing but previously-undocumented practice (`url-encoding.ts`).

### DISTILL
- 18 Gherkin scenarios authored as documentation SSOT (`docs/scenarios/canvas-pan-zoom-navigation/
  acceptance.feature`), executed as hand-written Vitest tests — no Cucumber/pytest-bdd dependency,
  following this repo's established `share-url-compression` precedent.
- RED scaffolds created for all 5 new geometry functions and 3 new store actions; 34/34 classified
  genuinely RED (thrown scaffold errors), zero BROKEN.
- Final Wave Review Gate (4 parallel reviewers covering all of DISCUSS/DESIGN/DEVOPS/DISTILL): 3
  approved, 1 conditionally approved (Forge/DEVOPS, 2 low-severity, both closed or carried forward
  as documented DELIVER plan) — zero blockers.

### DELIVER
- **ADR-005** (new): Reset View's zoom floor is decoupled from manual zoom's `ZOOM_MIN=0.5`,
  amending DDD-6. Surfaced by a property test correctly proving the shared-floor design was
  mathematically incompatible with AC-03a ("every node fully visible") for diagrams spread wider
  than the floor could display. Resolved by the human choosing to fix the architecture (give Reset
  View its own near-zero floor, guarding only against zero/negative/infinite) rather than narrow
  the test's input space — the crafter's own recommended path, and the substantively correct one
  since Reset View's entire purpose is the "see everything" escape hatch manual zoom was
  deliberately *not* designed to be.

## Issues Encountered

### Local `nwave-ai` toolchain partially broken
Three separate tooling gaps surfaced across this feature's delivery, none blocking the actual work
but all worth fixing:
1. `drctl` is not installed at all — decision records were hand-authored matching the existing
   `docs/decisions/DR--*.md` template instead.
2. `nwave-ai outcomes register` fails on every attempt with a tool-internal bug (bad `schema.json`
   path resolution against the installed package). The outcomes registry (`docs/product/
   outcomes/registry.yaml`) stayed empty for this feature's new typed contracts — flagged, not
   silently skipped. Per explicit user direction, not pursued further this session.
3. `des-init-log`/`des-log-phase`/`des-commit`/`des-verify-integrity`/`des-roadmap` all failed via
   the default `PATH` (`~/.local/bin/*`, missing the `des` Python module and a broken `uv` cache).
   Working shims were found at `~/.claude/bin/*` and used by full path throughout DELIVER — every
   crafter dispatch had to be told explicitly to bypass the broken default resolution.
   **Recommended follow-up**: fix or remove the broken `~/.local/bin` install so the default PATH
   resolves to a working `nwave-ai`, or document the `~/.claude/bin` shims as the canonical path
   project-wide.

### Genuine architecture-vs-test conflict at step 01-03 (handled correctly, not a process failure)
The crafter found — via a property test that generates realistic large node-position spreads — that
routing `computeFitViewport`'s zoom through the shared `clampZoom`/`ZOOM_MIN` floor makes AC-03a
("every node fully visible") mathematically unsatisfiable for sufficiently spread diagrams. Rather
than fudge the test or fabricate a passing log entry, the crafter logged two honest `GREEN/FAIL`
DES entries and escalated with a clear proof and two concrete resolution options. This is exactly
the TDD discipline the methodology exists to produce — surfaced here as a positive signal, not an
issue to prevent recurring.

## Test Coverage

| File | Tests | Type |
|------|-------|------|
| `packages/renderer/src/geometry.test.ts` | 18 (incl. fast-check PBT for all 5 new functions) | Unit/property |
| `packages/app/src/canvas-pan-zoom.acceptance.test.tsx` | ~19 | Acceptance (driving-port, jsdom `fireEvent`) |
| `packages/app/src/Canvas.test.tsx` | 89 (4 modified per ADR-003) | Integration |

Full workspace suite: 38 files, **635 passed, 6 skipped, 0 failed**, `pnpm typecheck` clean
(2026-07-27T15:24Z). Zero regressions against the pre-feature 601-test baseline.

Additionally verified live in a real browser (not just jsdom): pan, zoom, and Reset View all
manually driven via the actual dev server with real pointer/wheel events, screenshots captured as
demo evidence (`feature-delta.md`'s DELIVER section), zero console errors.

## Quality Gates

| Gate | Outcome |
|------|---------|
| Roadmap review | Approved, 0 findings |
| Per-step TDD (RED/GREEN/COMMIT) | All 3 steps PASS; step 01-03 includes 2 honest GREEN/FAIL entries during genuine escalation |
| Post-merge integration gate | PASS — full suite green, all 3 Elevator Pitch demos verified live in browser |
| Refactor (L1-L6) | Two passes, both found genuine cleanup (helper extraction in `computeFitViewport`) |
| Adversarial review (full 4-reviewer DISTILL gate + Phase 4 DELIVER code review) | All APPROVED or CONDITIONALLY_APPROVED; DELIVER code review: APPROVED, zero Testing Theater patterns, all 3 ADRs verified compliant against actual committed code |
| Mutation testing | Deferred — project rigor profile runs this on-demand via `/nw-mutation-test`, not a DELIVER-blocking gate (per DR--20260724, `packages/renderer/src/geometry.ts` is now in scope for when it runs) |
| Integrity verification | `des-verify-integrity` — all 3 steps complete DES traces, exit 0 |

## Lessons Learned

1. **Full-rigor DISCUSS/DEVOPS/DISTILL passes paid for themselves at DELIVER.** The DESIGN-wave
   ADRs were specific enough (exact thresholds, exact mechanisms) that DELIVER's 3 crafter dispatches
   were near-mechanical transcription rather than fresh design work — the one place genuine judgment
   was still needed (the zoom-floor conflict) was exactly the kind of thing no amount of upfront
   documentation could have caught without an actual property test exercising the real input space.
2. **Property-based tests earn their keep by finding real architecture gaps, not just code bugs.**
   The AC-03a/AC-03c conflict was a specification error (DDD-6), not an implementation error — PBT
   generating realistic-but-extreme inputs is what surfaced it; an example-based test with 2-3
   hand-picked node positions would have missed it entirely.
3. **A broken local toolchain doesn't have to block DES-monitored delivery** — working shims existed
   in a non-default location; explicitly telling every subagent to use full paths kept the audit
   trail genuine rather than either faking compliance or abandoning DES monitoring altogether.
4. **UI-gesture Elevator Pitches need a different demo-evidence mechanism than CLI-shaped ones** —
   the Post-Merge Integration Gate's subprocess-execution assumption doesn't fit "drag the canvas";
   adapted to live browser automation (real dev server, real pointer/wheel events, screenshots)
   instead, consistent with this project's general UI-verification convention.
5. **Scoping DEVOPS honestly as "mostly confirmation, not creation" for a client-only static-site
   feature avoided manufacturing unnecessary infrastructure ceremony** — the wave still surfaced one
   genuine, valuable finding (the mutation-testing scoping gap) despite being deliberately thin
   everywhere else.

## Migrated Artifacts

No migration needed — this repo uses the lean v3.14 single-file `feature-delta.md` model
throughout, and every wave already wrote its lasting artifacts directly to their permanent SSOT
location as it went, not to a temporary path requiring a finalize-time move.

| Artifact | Location |
|----------|----------|
| Architecture brief (Application Architecture section) | `docs/product/architecture/brief.md` |
| ADR-003 (pan-vs-click discrimination) | `docs/product/architecture/adr-003-pan-drag-vs-click-discrimination.md` |
| ADR-004 (viewport transform mechanism) | `docs/product/architecture/adr-004-viewport-transform-mechanism.md` |
| ADR-005 (Reset View zoom-floor decoupling) | `docs/product/architecture/adr-005-reset-view-zoom-floor-decoupled.md` |
| DR (mutation-testing scope) | `docs/decisions/DR--20260724--process--mutation-testing-scope.md` |
| Job story + journey | `docs/product/jobs.yaml`, `docs/product/journeys/canvas-pan-zoom-navigation.yaml` |
| KPI contracts (KPI-07/08/09) | `docs/product/kpi-contracts.yaml` |
| Gherkin scenario SSOT | `docs/scenarios/canvas-pan-zoom-navigation/acceptance.feature` |
| Full wave narrative (all 5 waves) | `docs/feature/canvas-pan-zoom-navigation/feature-delta.md` (retained in place — feature directory preserved per finalize Phase C) |
| Slice briefs, wave-decisions, environments.yaml, red-classification.md | Retained in `docs/feature/canvas-pan-zoom-navigation/{slices,discuss,design,devops,distill}/` |
