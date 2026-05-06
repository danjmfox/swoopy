# Design Wave Decisions — URL + localStorage Persistence

This file references accepted design decisions rather than restating them.
Read the linked DRs for full context and options considered.

---

## DWD-01: ID-scoped localStorage with fork-on-first-edit

**Decision:** Each model has a UUID. localStorage key is `swoopy_graph_<id>`. Opening a `?g=` shared URL loads transiently; the first mutation forks a new ID without touching the user's own saved models.

**Full record:** `docs/decisions/app/DR--20260329--app--model-identity-persistence.md`
**Status:** Accepted

**Acceptance test implications:**
- Tests for AC-02a must assert `transient: true` after loading a `?g=` URL (no localStorage write).
- Tests for AC-02b must assert a *new* key appears in localStorage after the first mutation; the original key is untouched.
- Tests for AC-03 must assert the legacy `swoopy_graph` key is deleted after migration.

---

## DWD-02: New model uses replaceState, no confirmation dialog

**Decision:** `newModel()` uses `history.replaceState()` — no back-stack entry, no confirm dialog. Old model stays in localStorage.

**Full record:** `docs/decisions/app/DR--20260330--app--new-model-action.md`
**Status:** Accepted

**Acceptance test implications:**
- Tests for AC-04 must assert the old localStorage key still exists after `newModel()`.
- Tests must assert undo stack is empty after `newModel()`.
- No confirmation dialog: tests should not expect a modal or prompt.

---

## DWD-03: URL params and their semantics

**Decision** (from DR--20260329 + PRD SE-08):

| Param | Meaning | Persistence |
|-------|---------|-------------|
| `?g=<base64>` | Shared graph (transient) | No — until first mutation forks |
| `?m=<id>` | Named local model | Yes — loads `swoopy_graph_<id>` |
| _(none)_ | First visit or bare URL | Loads seed graph or migrates legacy key |

The `?m=` param is NOT included in shared URLs (Share button). Recipients get a clean fork opportunity.

**Acceptance test implications:**
- Tests for the load sequence must cover all three URL cases.
- Persistence integration tests live in `packages/app/src/persistence.integration.test.ts` (existing).

---

## DWD-04: localStorage key schema

| Key | Written by | Contains |
|-----|-----------|----------|
| `swoopy_graph_<uuid>` | `persist()` on every mutation | `SerializedGraph` (JSON string) |
| `swoopy_current_model` | `newModel()`, `forkIfTransient()`, migration | Active model UUID |
| `swoopy_welcomed` | Welcome overlay CTA handler | `"true"` |
| `swoopy_graph` | _(legacy only)_ | Migrated and deleted on first load |

**Acceptance test implications:**
- Tests must use `localStorage.getItem` / `localStorage.setItem` directly (jsdom provides this).
- Tests must clear relevant keys in `beforeEach` to avoid state leakage between scenarios.

---

## DWD-05: No undo for sim state, no undo for new model

Per `docs/ARCHITECTURE.md`:
- Injections and sim ticks are **not** in the undo stack.
- `newModel()` clears the undo stack entirely (fresh start).
- Graph structure mutations (add, delete, move, configure) **are** recorded.

**Acceptance test implications:**
- `newModel()` tests: assert `past: []` and `future: []` after the action.
- Do not write acceptance tests that expect `undo()` to reverse a `newModel()` call.
