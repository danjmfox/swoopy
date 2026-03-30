# Architecture

## Package structure

```plaintext
packages/
  engine/     Pure TypeScript. No browser or framework dependencies.
  renderer/   Canvas 2D + RAF loop. Browser only.
  app/        React + Vite. Zustand store. UI components.
```

Each package is a pnpm workspace with its own `package.json`. The `engine` package is the only shared dependency — both `renderer` and `app` import from it.

---

## engine

The simulation core. Every function is pure: same inputs, same outputs, no side effects. This makes the engine fully testable without a browser.

Key exports:

| Export                                          | Purpose                                                                                      | Details                |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------- |
| `Graph`, `Node`, `CausalEdge`, `ConstraintEdge` | Domain types                                                                                 |                        |
| `NodeId`, `EdgeId`                              | Branded primitive types — prevent accidental string substitution                             |                        |
| `SimState`                                      | Snapshot of simulation state: node values, prevNodeValues, travelling signals, pending queue |                        |
| `makeInitialSim(graph)`                         | Create a clean `SimState` from a graph                                                       |                        |
| `step(graph, sim, dt)`                          | Advance simulation by `dt` seconds; returns new `SimState`                                   |                        |
| `inject(sim, nodeId, strength)`                 | Return new `SimState` with node value nudged; clamping deferred to next `step()`             |                        |
| `serialize(graph)`                              | `Graph` → versioned JSON-compatible value                                                    |                        |
| `deserialize(raw)`                              | Versioned value → `Graph`; throws on unknown version                                         |                        |
| `hitTest(graph, x, y)`                          | Return `HitTarget` or `null`                                                                 | For canvas coordinates |
| `bezierPoint`, `controlPoint`                   | Geometry helpers for curve rendering and hit testing                                         |                        |

### Simulation step

`step()` runs in this order each tick:

1. Resolve constraint edges → compute `effective_min` / `effective_max` per node; pre-clamp values
2. Advance all signal progress by `SIGNAL_SPEED × dt`
3. Collect arrived signals (progress ≥ 1)
4. Apply arrivals to destination node values (`strength × polarity`)
5. Re-clamp to effective bounds (arrivals may have pushed values out of range)
6. Noise suppression: values within 0.001 of `initial` are snapped back to `initial`
7. Diff start vs end values; for each node where |delta| ≥ EMIT_THRESHOLD, emit signals
   per outgoing causal edge using the **staggered-density model** (DR--20260330):
   - `weight=0`: no signal
   - `weight < 1`: 1 signal of `strength = delta × weight` (attenuation)
   - `weight ≥ 1`: `count = round(weight)` signals of `strength = delta / count` each;
     signal 0 enters travelling immediately, signals 1…N-1 enter pending staggered by
     `floor(EDGE_TRANSIT_TICKS / count)` ticks — they appear as equally-spaced particles
   - Delayed edges: 1 signal of `strength = delta` into pending at the named delay level
8. Decrement pending queue counters; release zero-count entries into the travelling queue
9. Cap travelling signal count at `MAX_SIGNALS` (132), preferring highest-progress signals

The pending queue holds both delayed-edge signals and stagger-offset signals from
weight ≥ 1 edges. Constraint edges are resolved fresh each step — not part of either queue.

---

## renderer

Owns the canvas draw loop and hit testing. Browser-only — not imported by tests that run in Node.

Key exports:

| Export                                       | Purpose                                                            |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `LoopyRenderer`                              | Class managing the RAF loop and canvas draw                        |
| `hitTest`                                    | Re-exported from engine; used by `Canvas.tsx` for pointer handling |
| `stockIndicator(value, min, max, prevValue)` | Pure: fill ratio 0–1, trend direction                              |
| `timebombStrength(pending, nodeId, edges)`   | Pure: aggregate pending signal strength from a node                |
| `saturationAlpha(signalCount, maxSignals)`   | Pure: edge opacity 1→0.3 as signal count approaches cap            |

`LoopyRenderer` takes a canvas ref and a `getState()` callback. It manages its own lifecycle — React does not re-mount it on state changes. The RAF loop calls `getState()` every frame, ticks the sim if running, and redraws.

When `dragPosition` is set in the store, the renderer draws the dragged node dimmed at its stored position and a ghost copy at the cursor coordinates. The ghost uses a dashed outer ring and 0.75 alpha to distinguish it from a committed position. This gives immediate visual feedback during a drag without committing to `moveNode` until `pointerup`.

Indicator functions (`stockIndicator`, `timebombStrength`, `saturationAlpha`) are pure and tested independently of the canvas.

---

## app

React + Vite. Contains the Zustand store, UI components, and URL/localStorage persistence.

### Store

A single flat Zustand store holds both graph state and simulation state. All mutations are synchronous and return new immutable values.

The store is read in two ways:

- React components subscribe via `useStore(selector)` — re-renders on graph structure changes
- The RAF loop reads via `useStore.getState()` each frame — never triggers React re-renders

The sim tick path (`state.tickSim(dt)`) calls `step()` from the engine and writes back into the store. React does not subscribe to sim state changes — only the renderer reads `sim`.

### Key store actions

| Action                          | Behaviour                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `addNode`                       | Push new node; record in undo stack                                                    |
| `addEdge`                       | Push new causal edge; deduplicate; record in undo stack                                |
| `addConstraintEdge`             | Push new constraint edge; deduplicate by kind+pair; record in undo stack               |
| `deleteNode`                    | Remove node and all connected edges; record in undo stack                              |
| `moveNode`                      | Update node position; record in undo stack                                             |
| `nudgeNode`                     | Offset node by dx/dy; record in undo stack                                             |
| `undo` / `redo`                 | Walk linear history stack                                                              |
| `tickSim(dt)`                   | Advance sim via `step()`; does not record in undo stack                                |
| `inject(nodeId, strength)`      | Nudge node value; does not record in undo stack                                        |
| `focusNextNode`                 | Cycle keyboard focus through nodes                                                     |
| `setPendingConstraintEdge`      | Open constraint choice dialog                                                          |
| `confirmConstraintEdge(kind)`   | Commit pending constraint edge as ceiling or floor                                     |
| `setDragPosition(nodeId, x, y)` | Record cursor position while dragging a node; cleared by `moveNode`; not in undo stack |

### UI components

| Component                    | Responsibility                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `Canvas.tsx`                 | Canvas mount, pointer events, keyboard nav, drag state machine; updates `dragPosition` on `pointerMove` in select mode |
| `Toolbar.tsx`                | Pause/resume, reset, speed control, mode switcher                                                                      |
| `NodePopover.tsx`            | Inline label/min/max/initial editor triggered by double-click                                                          |
| `EdgeWeightPopover.tsx`      | Inline weight editor triggered by double-click on edge weight region                                                   |
| `ConstraintChoiceDialog.tsx` | Modal triggered when a modifier+drag gesture completes; confirms ceiling/floor                                         |

### Persistence

On every graph mutation: `serialize(graph)` → `localStorage.setItem('swoopy_graph_<modelId>', ...)`.

On load:

1. If `?g=` param present → deserialize as transient model (no ID, not persisted until first mutation forks it)
2. Else if `?m=<id>` param present → restore `swoopy_graph_<id>` from localStorage
3. Else if legacy `swoopy_graph` key exists → migrate to a new UUID, update URL to `?m=<id>`
4. Else → load seed graph (first visit)

Implemented in SE-07-fix + SE-08 (DR--20260329--app--model-identity-persistence, accepted).

Share button: `serialize` → base64 → write to `?g=` param → copy URL to clipboard. The `?m=` param is not included in shared URLs — recipients get a clean fork opportunity.

---

## Pointer and keyboard handling

Pointer events are handled in `Canvas.tsx` directly on the native canvas element — not via React's synthetic event system. This avoids re-render pressure on every mouse move.

Alt key state for the constraint drag gesture is tracked two ways. A document-level `keydown`/`keyup` listener maintains a `constraintModifierHeld` boolean — the primary approach for a modifier held continuously across a drag sequence. Additionally, `e.altKey` is checked directly on the `pointerup` event as a belt-and-suspenders fallback for Mac, where document-level key events are sometimes not delivered during a pointer drag. Both conditions are OR'd in `onPointerUp()`. In jsdom tests, `PointerEvent` does not propagate `altKey` through `fireEvent`, so tests simulate the modifier via `fireEvent.keyDown(document, { key: 'Alt' })` before the drag sequence.

---

## Testing

| Package    | Test files           | What they cover                                                                                                                     |
| ---------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `engine`   | `*.test.ts`          | Pure function unit tests; `population.integration.test.ts` for full propagation scenario                                            |
| `renderer` | `indicators.test.ts` | Pure indicator functions; no canvas dependency                                                                                      |
| `app`      | `store.test.tsx`     | Store actions, undo/redo, persistence; `Canvas.test.tsx` for pointer/keyboard; `persistence.integration.test.ts` for URL round-trip |

The jsdom environment is used for app tests. `@testing-library/react` cleanup is registered explicitly in `test-setup.ts` (`afterEach(cleanup)`) because `globals: false` in the Vitest config means the library's own auto-registration path is not triggered.

`hitTest` is mocked in `Canvas.test.tsx` via `vi.hoisted()` + `vi.mock('@swoopy/renderer', ...)` so tests do not depend on canvas coordinate geometry.

---

## Design decisions

**Engine is framework-free.** The engine has zero browser or framework dependencies. This is what makes it testable in Node without a DOM and deployable in non-browser contexts if needed.

**No React in the render loop.** The RAF loop writes to the Zustand store but React does not subscribe to sim state. This keeps the 60fps draw path entirely outside React's reconciler.

**No intrinsic decay (DR-001).** Node values change only when signals arrive. `initial` is a reset-only value — used by `makeInitialSim()` and the Reset button, not as a gravity well during simulation. Balancing loops must do all corrective work; this makes loop structure visible and consequential.

**Undo does not include sim state.** Injections and sim ticks are not recorded in the undo stack. Undo covers graph structure changes only. Sim can always be reset independently.

**Constraint edges are resolved, not propagated.** Constraints are not part of the signal queue. They are resolved fresh from current source node values at the start and end of each `step()`. This means constraint effects are immediate and do not interact with signal delay.

**Branded IDs.** `NodeId` and `EdgeId` are branded primitive types. TypeScript will reject accidental string substitution at function call sites, which prevents a class of bugs that appear at runtime in unbranded ID systems.
