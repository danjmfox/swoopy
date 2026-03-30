---
id: DR--20260330--app--new-model-action
dateCreated: '2026-03-30'
version: 1.0.0
status: draft
changeType: creation
domain: app
slug: new-model-action
changelog:
  - date: '2026-03-30'
    note: Initial creation
  - date: '2026-03-30'
    note: Marked as draft
lastEdited: '2026-03-30'
---
# DR--20260330--app--new-model-action

## Context

SE-08 (DR--20260329--app--model-identity-persistence) established model identity: each model has a
UUID, auto-saves to `swoopy_graph_<id>`, and the active model is tracked via `swoopy_current_model`
in localStorage and `?m=<id>` in the URL.

The UI has no way to start a fresh model. Without a `newModel()` action, a user who wants a blank
canvas must either clear localStorage manually or open a bare URL and lose their existing work.

This decision records how `newModel()` extends the SE-08 contract.

## Options Considered

| Option | Description | Outcome | Rationale |
|--------|-------------|---------|-----------|
| A | `newModel()` uses `history.pushState()` — adds a back-stack entry | Rejected | Without a `popstate` listener, Back changes the URL but the canvas stays on the new blank model — misleading UX. Deferred to a future navigation story. |
| B | `newModel()` uses `history.replaceState()` — replaces current URL, no back-stack entry | Accepted | Consistent with `forkIfTransient()`. Old model is preserved in localStorage under its UUID — no data loss, just no Back shortcut. |
| C | Confirm dialog before creating new model | Rejected | Every mutation already persists via `persist()`. A confirm would falsely imply unsaved work exists. Violates Stewardship: avoid ceremony that misleads. |

## Decision

`newModel()` will:
1. Generate a fresh UUID
2. Set graph to an empty graph (no nodes, no edges)
3. Set `transient: false`
4. Call `persist()` to write the empty graph under the new ID
5. Write the new ID to `localStorage.setItem('swoopy_current_model', newId)`
6. Update the URL via `history.replaceState()` to `?m=<newId>`, removing any `?g=` param
7. Clear undo history (`past: [], future: []`)

No confirmation dialog. Old model remains safely in localStorage under its previous UUID.

## Principles

- **Stewardship:** No confirm dialog — auto-save means the user's work is never at risk. False
  ceremony (confirmations for non-destructive actions) erodes trust.
- **Impeccability:** URL updated via `replaceState` — consistent with `forkIfTransient()` (SE-08).
- **Self-Stewardship:** `pushState` + popstate handler deferred — adds complexity for an edge case
  that multi-model switcher UI (also deferred) will eventually supersede.

## Lifecycle

Status: new → proposed → accepted (to be advanced before implementation).

## Reasoning

The old model is never destroyed. `swoopy_graph_<oldId>` remains in localStorage. The user can
return to it if they know the URL (`?m=<oldId>`) — but in practice, multi-model recovery requires
the forthcoming model-switcher UI (explicitly deferred per DR--20260329). This is a deliberate
known limitation of v1.

`replaceState` keeps parity with the existing `forkIfTransient()` pattern, reducing conceptual
surface area. A separate `popstate` story can add Back navigation when the model-switcher is built.

## Next Actions

- Advance to `proposed`, then `accepted` before implementing SE-09
- Implement `newModel()` in `packages/app/src/store.ts`
- Add SE-09 to PRD
- Move DR to `docs/decisions/` after acceptance (consistent with !44 consolidation)

## Confidence

High. The behaviour is a straightforward extension of SE-08. The main risk is the Back button UX
limitation, which is documented and deferred consciously.
