---
id: DR--20260331--app--spring-loaded-modes
dateCreated: "2026-03-31"
version: 1.0.0
status: accepted
domain: app
slug: spring-loaded-modes
changelog:
  - date: "2026-03-31"
    note: Initial creation — GE-32 emerged from use; Shift key has dual-role conflict requiring explicit resolution
  - date: "2026-03-31"
    note: Accepted — implementation complete, all 271 tests passing
---

# DR--20260331--app--spring-loaded-modes

## Status: Accepted

## Context

The current mode model is a flat union (`"select" | "add-node" | "add-edge" | "simulate" | "delete"`) with no concept of "previous mode." Full mode switches (keyboard shortcuts s/n/e/r/d) persist until changed.

During use it became clear that Shift is a natural spring-loaded modifier for two common gestures:

- Drawing an edge from a node without switching to Add Edge mode permanently
- Adding a node on blank canvas without switching to Add Node mode permanently

Shift is already in use in Simulate mode as an inject-direction modifier (Shift+click = negative inject). This creates a dual-role conflict that must be resolved explicitly.

Additionally, `transient: boolean` already exists in the store with a different meaning (a graph loaded from a shared URL that has not yet been locally saved — DR--20260329). The new concept must not shadow or reuse this field.

## Decision

### New store state

Add `previousMode: AppMode | null` to the store. Non-null signals an active spring state; null is the normal persistent-mode state.

Two new store actions:

- `enterSpringMode(mode: AppMode)` — saves current mode to `previousMode`, sets `mode`
- `exitSpringMode()` — restores `mode = previousMode`, sets `previousMode = null`; no-op if `previousMode` is null

### Spring-loading gate

Spring-loading is blocked when:

1. `previousMode !== null` (already in a spring state — no double-spring)
2. `mode === "simulate"` (Shift is reserved for inject direction in this mode)

This cleanly preserves existing inject-direction behaviour without a mode check inside the inject handler.

### Shift+Option in spring edge mode

When the spring edge pointer-up event fires with `constraintModifierHeld || e.altKey`, the path calls `setPendingConstraintEdge` instead of `addEdge` — exactly mirroring the existing Alt+drag constraint path.

### Space key

Space tap toggles `simRunning`. Does not change mode (simulation can run in any mode). Handled in `onDocKeyDown` alongside existing mode shortcuts.

### Escape key

- While in spring mode: calls `exitSpringMode()`
- While not in spring mode: sets `mode = "select"`

## Alternatives considered

### A. Named spring modes (e.g. `"spring-edge" | "spring-node"`)

Rejected. Adds entries to the `AppMode` union that the toolbar and existing mode-gated code would need to handle. The `previousMode` field keeps spring state orthogonal to persistent mode — callers checking `mode === "add-edge"` work correctly whether the mode is persistent or spring.

### B. Local closure flags in Canvas.tsx

Rejected. Spring state needs to be visible to future tests and potentially to the toolbar (to show a visual hint). Store is the right home for observable UI state.

### C. Exempt only simulate mode (allow spring from within spring)

Rejected. Double-spring with no clear exit path is confusing and untestable. Gate on `previousMode === null` instead.

## Consequences

- Store type contract gains one field (`previousMode`) and two actions.
- All existing mode-gated code is unaffected — `mode` still holds the active mode string.
- Inject-direction behaviour in Simulate mode is fully preserved.
- Spring state is testable via store actions directly, independent of Canvas event plumbing.
