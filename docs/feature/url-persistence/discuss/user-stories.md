# User Stories — URL + localStorage Persistence

Derived from PRD §4.3 (SE-07 through SE-10) and DR--20260329--app--model-identity-persistence.

**Primary user:** facilitator/coach running a systems thinking session.
**Secondary user:** solo practitioner working asynchronously and sharing via URL.

---

## US-01 — Graphs survive a page reload

**As a** facilitator building a causal loop diagram,
**I want** my graph to be automatically saved as I work,
**so that** a browser refresh or accidental tab close doesn't lose my model.

### Acceptance criteria — US-01

- AC-01a: When a user mutates the graph (add node, add edge, move, delete, configure), the current graph is saved to localStorage under `swoopy_graph_<modelId>` before the next user action is possible.
- AC-01b: When a user reloads the page with `?m=<id>` in the URL, the graph stored under `swoopy_graph_<id>` is restored exactly (all nodes, edges, annotations, modulators).
- AC-01c: When no URL param is present and no localStorage graph exists, the seed graph is loaded.

**PRD ref:** SE-07, SE-08
**Driving port:** `store.persist()`, `store.loadPersistedGraph(id)`, localStorage

---

## US-02 — Opening a shared URL doesn't destroy my work

**As a** facilitator who receives a shared model URL (`?g=...`) from a colleague,
**I want** to explore the shared graph without risking my own saved work,
**so that** I can open someone else's model and still return to mine.

### Acceptance criteria — US-02

- AC-02a: When a user opens a `?g=<base64>` URL, the graph loads without being written to localStorage (`transient: true` state).
- AC-02b: When a transient-state user makes their first mutation, a new UUID is generated, the graph is persisted under `swoopy_graph_<newId>`, and the URL updates to `?m=<newId>` — without touching any previously stored model.
- AC-02c: The original model at `?m=<previousId>` remains intact in localStorage after the fork.

**PRD ref:** SE-08 (fork-on-first-edit)
**Driving port:** `store.forkIfTransient()`, localStorage
**Decision record:** DR--20260329--app--model-identity-persistence

---

## US-03 — Legacy graphs are automatically migrated

**As a** returning user whose browser has the old single-slot `swoopy_graph` key,
**I want** my saved graph to be migrated seamlessly,
**so that** I don't lose my previous work when the app updates.

### Acceptance criteria — US-03

- AC-03a: On load, if `localStorage.getItem('swoopy_graph')` exists and no `?m=`/`?g=` param is present, the graph is read from the legacy key, a new UUID is generated, and the graph is written to `swoopy_graph_<id>`.
- AC-03b: The legacy `swoopy_graph` key is removed after migration.
- AC-03c: The URL updates to `?m=<id>` via `replaceState` (no new history entry).
- AC-03d: Subsequent reloads load from `swoopy_graph_<id>`, not the legacy key.

**PRD ref:** SE-08 (legacy key migration)
**Driving port:** `store.loadGraph()` startup path

---

## US-04 — Starting a new model without losing the current one

**As a** facilitator who wants to start a fresh diagram mid-session,
**I want** a New Model action that gives me a blank canvas,
**so that** I can start over without destroying my previous work.

### Acceptance criteria — US-04

- AC-04a: When a user triggers the New Model action, the canvas resets to an empty graph (no nodes, no edges, no annotations).
- AC-04b: The previous model remains intact in localStorage under its UUID.
- AC-04c: A new UUID is generated; the URL updates to `?m=<newId>` via `replaceState`.
- AC-04d: The undo stack is cleared (past and future are empty).
- AC-04e: No confirmation dialog is shown — auto-save ensures no data loss.

**PRD ref:** SE-09
**Driving port:** `store.newModel()`
**Decision record:** DR--20260330--app--new-model-action

---

## US-05 — First-time visitors see a welcoming orientation

**As a** new user arriving at a bare URL with no existing saved model,
**I want** a brief overlay explaining what the tool is and what I can do,
**so that** I'm not dropped into a blank canvas with no context.

### Acceptance criteria — US-05

- AC-05a: The welcome overlay is shown when there is no `swoopy_current_model` in localStorage AND no `?g=` or `?m=` param in the URL.
- AC-05b: The overlay contains a tagline and 2–3 capability bullets describing the tool.
- AC-05c: A single "Start building" CTA dismisses the overlay and sets `swoopy_welcomed = true` in localStorage.
- AC-05d: The overlay is NOT shown on subsequent bare-URL visits (i.e., when `swoopy_welcomed` is set).
- AC-05e: The overlay is NOT shown on `?m=<id>` direct links or `?g=<base64>` shared links.
- AC-05f: The overlay is keyboard-accessible: Escape key dismisses it.

**PRD ref:** SE-10
**Driving port:** WelcomeOverlay component + `swoopy_welcomed` localStorage key

---

## Scope boundary

These stories cover the persistence and URL sync layer only. The Share button behavior (SE-02, SE-06) is already implemented; share-url-compression (the base64 compression feature) is archived at `docs/evolution/2026-04-27-share-url-compression.md`.

Out of scope for this feature:

- Multi-model management UI (list, rename, delete) — explicitly deferred per DR--20260329
- `popstate` back-navigation handler — deferred per DR--20260330
- Server-side persistence — deferred to v2+
