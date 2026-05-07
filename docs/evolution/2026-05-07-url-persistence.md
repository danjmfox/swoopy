# Evolution: url-persistence

**Date:** 2026-05-07
**Feature ID:** url-persistence
**Wave path:** DISCUSS → DESIGN → DISTILL → DELIVER
**Type:** Brownfield retrofit (acceptance tests written post-implementation)

---

## Feature Summary

Formalised the URL and localStorage persistence layer that was already implemented in `store.ts`. The feature covers four user stories:

- **US-01** — Auto-save on every mutation to `swoopy_graph_<uuid>` (localStorage)
- **US-02** — Shared `?g=` URLs load transiently; first mutation forks a new UUID without touching existing saved models
- **US-03** — Legacy single-slot `swoopy_graph` key migrated to UUID-keyed scheme on first load
- **US-04** — New Model action resets canvas to blank, preserves old model in localStorage, clears undo stack

US-05 (welcome overlay) was already fully covered by `App.test.tsx`; no new scenarios required.

---

## Business Context

Swoopy is a causal loop diagramming tool for facilitators and coaches. Persistence is foundational: without it, a page refresh loses the user's model. The implementation predated the nWave process; this wave retrospectively applied formal acceptance criteria and test coverage to a working but uncontracted feature.

---

## Key Decisions

### DWD-01: ID-scoped localStorage with fork-on-first-edit

Each model has a UUID. localStorage key is `swoopy_graph_<id>`. Opening a `?g=` shared URL loads transiently; the first mutation forks a new ID without touching the user's own saved models.

Full record: `docs/decisions/app/DR--20260329--app--model-identity-persistence.md`

### DWD-02: New model uses replaceState, no confirmation dialog

`newModel()` uses `history.replaceState()` — no back-stack entry, no confirmation dialog. Old model stays in localStorage.

Full record: `docs/decisions/app/DR--20260330--app--new-model-action.md`

### DWD-03: URL param semantics

| Param | Meaning | Persistence |
|---|---|---|
| `?g=<base64>` | Shared graph (transient) | No — until first mutation forks |
| `?m=<id>` | Named local model | Yes — loads `swoopy_graph_<id>` |
| _(none)_ | First visit or bare URL | Loads seed graph or migrates legacy key |

### DWD-04: localStorage key schema

| Key | Written by | Contains |
|---|---|---|
| `swoopy_graph_<uuid>` | `persist()` on every mutation | `SerializedGraph` (JSON string) |
| `swoopy_current_model` | `newModel()`, `forkIfTransient()`, migration | Active model UUID |
| `swoopy_welcomed` | Welcome overlay CTA handler | `"true"` |
| `swoopy_graph` | _(legacy only)_ | Migrated and deleted on first load |

### DWD-05: No undo for sim state; newModel clears undo stack

Injections and sim ticks are not in the undo stack. `newModel()` clears it entirely. Graph structure mutations are recorded.

---

## Steps Completed

| Step | Phase | Status | Note |
|---|---|---|---|
| 01-01 | PREPARE | EXECUTED/PASS | Read store.ts + acceptance tests |
| 01-01 | RED_ACCEPTANCE | SKIPPED | NOT_APPLICABLE: brownfield retrofit — tests written post-implementation, all 20 scenarios already green |
| 01-01 | RED_UNIT | SKIPPED | NOT_APPLICABLE: implementation pre-exists |
| 01-01 | GREEN | EXECUTED/PASS | All 20 acceptance scenarios green |
| 01-01 | COMMIT | EXECUTED/PASS | Committed green suite |

---

## Coverage Gaps Addressed by Acceptance Suite

| Gap | Prior coverage | Addressed |
|---|---|---|
| Auto-save contract (AC-01a) | No test verified localStorage writes | 3 mutation scenarios |
| `loadFromUrl` sets `transient: true` | persistence.integration.test.ts checked round-trip only | Explicit transient assertion |
| Fork-on-first-edit: new UUID + old key untouched (AC-02b/c) | Not tested | 4 fork scenarios |
| Legacy key migration (AC-03) | Not tested | 4 migration scenarios |
| `newModel` direct contract (AC-04) | Only exercised indirectly via `deleteModel` | 6 new model scenarios |

Total: 20 acceptance scenarios across `packages/app/src/url-persistence.acceptance.test.ts`.

---

## Lessons Learned

### Brownfield Retrofit Pattern

This wave established a repeatable pattern for formalising implicit contracts on pre-existing code:

1. **DISCUSS** extracts the behavioural contracts from existing DRs and architecture docs into user stories with explicit AC.
2. **DESIGN** captures test implications per driving port — without changing any production code.
3. **DISTILL** writes acceptance scenarios against the existing implementation. RED phase is skipped (not applicable); GREEN is the first run.
4. **DELIVER** is verification-only: run the suite, confirm all green, commit.

This is preferable to the alternative (writing tests that are immediately green without being observed red) because the wave process still forces explicit articulation of each contract before the test file is written. The value is the contract specification, not the red/green cycle.

### URL Encoding Subtlety

`URLSearchParams` double-encodes unless `encodeURIComponent(encodeGraphForUrl(...))` is used when constructing test URLs. This was surfaced in DESIGN (DWD — DESIGN wave decisions) and prevented a class of silent test bugs.

### jsdom Is Sufficient for Persistence Contracts

Strategy C (Real local) — jsdom provides real localStorage and real `history.replaceState`. No mocks needed for persistence behaviour. This keeps the acceptance suite fast and free of brittle mock assertions.

### Driving Port Alignment

The adapter coverage table (DISTILL) mapped each driving port to a specific scenario. This prevented gaps: the fork path through `forkIfTransient()` inside `commitGraph` was initially easy to overlook because it is not called directly. Mapping ports to scenarios made it visible.

---

## Issues Encountered

None. The implementation was complete and correct. The wave's contribution was the formal contract documentation and test coverage.

---

## Migrated Artifacts

| Source | Destination |
|---|---|
| `discuss/user-stories.md` | No permanent destination in map — retained in feature workspace |
| `design/wave-decisions.md` | No permanent destination in map — retained in feature workspace |

No architecture-design.md, component-boundaries.md, ADRs, or walking-skeleton.md were produced by this wave (brownfield — no new architecture). No migration to `docs/architecture/` or `docs/adrs/` required.

---

## Related

- `docs/evolution/2026-04-27-share-url-compression.md` — prior feature; the base64 encoding used by `?g=` was delivered here
- `docs/decisions/app/DR--20260329--app--model-identity-persistence.md`
- `docs/decisions/app/DR--20260330--app--new-model-action.md`
- `packages/app/src/url-persistence.acceptance.test.ts` — 20 acceptance scenarios
- `packages/app/src/store.ts` — implementation
