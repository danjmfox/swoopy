# Architecture Brief — For Acceptance Designer

This document names the driving ports (acceptance test entry points) for each package.
It is a pointer document — the full architecture lives in `docs/ARCHITECTURE.md`.

---

## Package map

```
packages/
  engine/     Pure TypeScript. No browser or framework dependencies.
  renderer/   Canvas 2D + RAF loop. Browser only. Not imported in tests.
  app/        React + Vite. Zustand store. UI components. Persistence.
```

---

## Driving ports

### engine — pure function ports

All engine behavior is exercised through exported pure functions. No harness, no DOM, no mocks required.

| Port | Signature | What acceptance tests attach here |
|------|-----------|----------------------------------|
| `inject` | `inject(sim, graph, nodeId, strength) → SimState` | Signal injection: value change + relay emission |
| `step` | `step(graph, sim, dt) → SimState` | Full tick: constraint pre/post clamp, signal advance, arrival, relay |
| `computeEffectiveWeights` | `computeEffectiveWeights(graph, nodeValues) → Map<EdgeId, number>` | Modulator scaling formula |
| `makeInitialSim` | `makeInitialSim(graph) → SimState` | Initial state from graph |
| `serialize` | `serialize(graph) → SerializedGraph` | Graph → versioned JSON |
| `deserialize` | `deserialize(blob) → Graph` | Versioned JSON → Graph; throws on unknown version |

**All exported from** `packages/engine/src/index.ts`.

Test file placement: `packages/engine/src/*.test.ts` (co-located per project convention).

---

### app/store — Zustand store actions

App-level behavior is exercised through the Zustand store. Tests construct store state and call actions directly — no rendering required.

| Port | What acceptance tests attach here |
|------|----------------------------------|
| `addNode`, `addEdge`, `addConstraintEdge` | Graph mutation + undo stack recording |
| `deleteNode`, `moveNode`, `nudgeNode` | Structural mutations + undo |
| `inject(nodeId, strength)` | Store-level injection (wraps engine inject) |
| `tickSim(dt)` | Store-level step (wraps engine step) |
| `undo`, `redo` | Undo stack traversal |
| `addModulator`, `toggleModulatorPolarity` | Modulator lifecycle |
| `newModel` | UUID generation, localStorage, URL replaceState (SE-09) |

**Defined in** `packages/app/src/store.ts`.

Test file placement: `packages/app/src/store.test.tsx` and `packages/app/src/store.test.ts` (existing).

---

### app/persistence — URL + localStorage layer

Persistence behavior is exercised through the store's startup/mutation hooks and URL param parsing. Tests use jsdom's localStorage and control `window.location.search`.

| Port | Acceptance boundary | PRD ref |
|------|---------------------|---------|
| Auto-save on mutation | Every graph mutation calls `serialize → localStorage.setItem('swoopy_graph_<id>', ...)` | SE-07 |
| Restore from `?m=<id>` | On load, reads `swoopy_graph_<id>` from localStorage | SE-08 |
| Transient load from `?g=<base64>` | Deserialises without persisting; first mutation forks a new UUID | SE-08 |
| Legacy key migration | `swoopy_graph` → `swoopy_graph_<generated-id>`, URL updated to `?m=<id>` | SE-08 |
| New model action | Generates UUID, clears graph, updates `?m=`, preserves old model in localStorage | SE-09 |
| Welcome overlay | Shown when no `swoopy_current_model` and no `?g=`/`?m=` params; dismissed by CTA | SE-10 |

**Key tests:** `packages/app/src/persistence.integration.test.ts`, `packages/app/src/share-compression.integration.test.ts`.

---

## Constraint: no test touches the renderer

`packages/renderer` is browser-only. Tests that exercise the app/store layer mock the renderer via `vi.mock('@swoopy/renderer', ...)`. The renderer's own pure functions (`stockIndicator`, `timebombStrength`, `saturationAlpha`) are tested directly in `packages/renderer/src/indicators.test.ts`.

---

## Key invariants for acceptance test design

1. **inject() is unclamped** — value change is immediate and may exceed node [min, max]; clamping happens at the next `step()` call.
2. **Constraint resolution runs twice per tick** — pre-clamp (step 1, before arrivals) and post-clamp (step 6, after arrivals). Acceptance tests must distinguish these if testing constraint interaction with signal propagation.
3. **Serialization is versioned at v5** — `deserialize` migrates v1–v4 blobs; `serialize` always emits v5.
4. **Undo does not include sim state** — `inject()` and `tickSim()` are not in the undo stack; only graph structure mutations are.
5. **Transient model flag** — a model loaded from `?g=` is `transient: true` until the first mutation forks it; `persist()` is a no-op while transient.
