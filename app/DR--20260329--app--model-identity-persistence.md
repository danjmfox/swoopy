---
id: DR--20260329--app--model-identity-persistence
dateCreated: '2026-03-29'
version: 1.0.0
status: draft
changeType: creation
domain: app
slug: model-identity-persistence
changelog:
  - date: '2026-03-29'
    note: Initial creation
  - date: '2026-03-29'
    note: Marked as draft
lastEdited: '2026-03-29'
---
# Model Identity and Persistence

## Context

Every graph mutation auto-saves to a single `localStorage` key (`swoopy_graph`). The startup
restore hook (`loadPersistedGraph`) exists in the store but has never been called from
`main.tsx`, so graphs never survive a page reload (bug: SE-07).

Before wiring up that startup hook, a design decision is needed: the single-slot model means
opening a shared `?g=...` URL and making edits would silently clobber the user's own saved
work on the next reload. Once the startup hook is live, this becomes a real data-loss risk.

## Options Considered

| Option | Description | Outcome | Rationale |
|--------|-------------|---------|-----------|
| A | Single slot; URL loads always transient (never call `persist` from `loadFromUrl`) | Rejected | Edits to shared models are silently lost on reload; confusing for users who work on a shared diagram for any length of time |
| B | ID-scoped localStorage; fork-on-first-edit | Accepted | Eliminates clobber risk; invisible to users at v1; defers multi-model UI without painting us into a corner |
| C | Prompt user on URL load ("open in new tab?") | Rejected | Adds friction to common share-link workflow; solves the immediate problem but not the underlying single-slot limitation |

## Decision

**Option B: ID-scoped localStorage with fork-on-first-edit.**

- Each model is assigned a UUID on creation.
- The `localStorage` key becomes `swoopy_graph_<id>`.
- The active model ID is reflected in the URL as `?m=<id>`.
- Opening a `?g=...` shared link loads the graph transiently (no ID, no persistence).
  The first mutation forks a new UUID, persists under that ID, and updates the URL to `?m=<newId>`.
- The user's prior model (their own `?m=<id>`) is never touched.
- **Migration:** on first load after this change, if the legacy `swoopy_graph` key exists, treat
  it as a model with a generated `default` ID and migrate it to `swoopy_graph_<id>` before
  discarding the old key.
- Multi-model management UI (list, rename, delete) is explicitly deferred.

## Principles

- **Stewardship / Delete-ability:** ID-scoped keys allow targeted deletion; the single key is
  a one-way door once the restore hook is live.
- **Justice (shift-left):** A user losing 30 minutes of edits to a shared model is a fragile
  assumption; identify and address it before wiring up SE-07, not after.
- **Stewardship / Cognitive Load Tax:** No new UI introduced at v1. The ID mechanism is
  invisible to the user unless they inspect the URL.

## Reasoning

The fork-on-first-edit rule means users experience the app as single-model (no switcher, no
list) while the underlying storage is safely multi-slot. The URL carries the model identity,
so bookmarking and sharing work correctly. The deferred multi-model UI can be added later
without any storage migration — the slots are already there.

Accepted trade-off: localStorage can accumulate orphaned model keys over time (no garbage
collection at v1). This is low risk for a local-only single-user tool.

## Exceptions

- If the app is ever embedded (iframe, kiosk) where URL params cannot be used, `?m=<id>` needs
  a fallback (e.g. sessionStorage for the active ID). Revisit then.
- If a server-side persistence layer is added (v2+), model IDs become the natural foreign key.
  No schema change needed — just a new sync layer.

## Next Actions

1. Create story: SE-07-fix — wire startup hook (`loadFromUrl` → `loadPersistedGraph` → seedGraph fallback)
2. Create story: SE-08 — implement model identity (UUID generation, ID-scoped localStorage, `?m=<id>` URL param, fork-on-first-edit, legacy key migration)
3. Update PRD, ARCHITECTURE, USER-GUIDE to reflect the new persistence model once SE-08 is scoped.
