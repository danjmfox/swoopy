# Task: Swoopy Walking Skeleton — Steps 1–10

## Goal

A working, testable foundation: a browser canvas with a live causal loop simulation running, interactive enough to inject a signal and watch it propagate — with the engine tested, the architecture validated, and the key decisions recorded. By step 10, feasibility and viability are confirmed; the next 10 steps can build features on solid ground.

## Context

- Repo: `/Users/danielosborne/projects/swoopy` — greenfield, no commits yet
- PRD: `docs/PRD.md` — authoritative requirements source, requirement IDs GE-xx / SI-xx / SE-xx
- Branch: `main` (no commits; feature branch `feat/walking-skeleton` to be created after step 1 scaffold commit)
- Stack (per PRD §6): TypeScript, pnpm workspaces, Vite, React, Zustand, Canvas 2D, Vitest
- Runtime: Node 22 (mise), pnpm, Trunk for lint

## Principles in play

- **Stewardship:** monorepo boundary discipline (engine has zero browser deps)
- **Justice:** technical risks first — RAF/React boundary is the highest-risk bet; validate early
- **Impeccability:** TDD rhythm from step 2; atomic commits; drctl for significant decisions
- **Self-Stewardship:** each step ends with a working, committed state; no half-open experiments

## PRD Compliance Mechanism

Requirement IDs (GE-01, SI-01, SE-01 etc.) are used as Vitest `describe`/`it` names.
Living checklist: `.claude/prd-compliance.md` — maps each requirement ID to test, status, and step.
Before closing any step, check that no PRD requirement in scope is unaddressed.

## Tasks

- [ ] 1. **Scaffold** — pnpm workspace (3 packages: engine, renderer, app), mise Node 22, strict tsconfig (no `any`), Vitest config, Trunk init, drctl init, `.gitignore` (includes `.claude/`). First commit. Create `feat/walking-skeleton` branch. — `chore: scaffold monorepo`
  - ADR candidate: pnpm workspaces monorepo over single package
  - ADR candidate: Canvas 2D over WebGL / PixiJS

- [ ] 2. **Engine types + RED test** — Branded `NodeId`/`EdgeId`, `Node`, `CausalEdge`, `SimState` types in `packages/engine`. Write the canonical Population/Births/Deaths integration test (PRD Appendix A). Assert: reinforcing loop amplifies, balancing loop damps, plateau reached. Red. — `test(engine): canonical population seed graph — RED`
  - Covers: PRD §5.3 canonical integration test; SI-05, SI-06

- [ ] 3. **step() GREEN** — Minimal `step(graph, sim, dt)` implementation: signal travel, arrival, polarity inversion, exponential decay toward `initial`, emit on delta ≥ EMIT_THRESHOLD. Pass the canonical test. No constraints, no delays yet. Refactor pass. — `feat(engine): step() — signal propagation and decay`
  - Covers: SI-01, SI-04, SI-05, SI-06, PRD §7.2 steps 2–9 (causal edges only)
  - Constants: SIGNAL_SPEED, DECAY, EMIT_THRESHOLD, INJECT_STRENGTH (provisional values from PRD §7.6)

- [ ] 4. **Serialisation** — `serialize(graph)` / `deserialize(blob)` in engine package, versioned format (v1). Round-trip tests. Unknown-version error test. — `feat(engine): versioned graph serialisation`
  - Covers: SE-01, SE-03, SE-04, SE-05

- [ ] 5. **Canvas + Vite scaffold** — `packages/app` Vite + React. Mount a canvas element. Static draw: one circle with label. No RAF, no store. Validates Canvas 2D renders correctly in the environment; establishes DPR scaling approach. — `chore(app): Vite + React + canvas mount`
  - ADR candidate: DPR handling strategy (CSS pixels for hit testing, DPR only at draw time)

- [ ] 6. **RAF loop + Zustand slice boundary** — `graphSlice` + `simSlice` in Zustand. `packages/renderer`: `LoopyRenderer` class with `start()`, `stop()`. RAF reads `simSlice` via `getState()` each frame — React does NOT subscribe to simSlice. Validate: zero React re-renders during ticks (React DevTools / Profiler API). — `feat(renderer): RAF loop and Zustand slice boundary`
  - This is the highest-risk architectural bet. If React re-renders during RAF, the design changes.
  - ADR: Zustand `getState()` in RAF vs signal/observable alternatives

- [ ] 7. **Walking skeleton end-to-end** — Wire seed graph into store. RAF calls `step()` each frame. Nodes render with activation colour. Auto-inject signal on load. No user interaction yet — but the simulation is visibly alive. Screenshot proof. — `feat: walking skeleton — engine + renderer + store connected`
  - Feasibility gate: if this works cleanly, the architecture is validated
  - Covers: SI-01, SI-07

- [ ] 8. **Hit testing + Simulate mode** — Canvas pointer events → `hitTest(x,y)` → store action. Click = positive injection (SI-02). Shift-click = negative (SI-03). Geometry tests for hit regions (no canvas instance, PRD §5.3). — `feat(renderer): hit testing and Simulate mode`
  - Covers: SI-02, SI-03, SI-08; GE-18 partially

- [ ] 9. **Edit mode: Add Node + Add Edge** — Enough to build a graph from scratch in-browser. GE-01 (create node), GE-04 (drag to create edge), GE-06/07 (polarity default), GE-09 (delete). Undo stack foundation (GE-21, GE-22). Toolbar mode switcher (§4.4). — `feat(app): Add Node, Add Edge, Delete, and undo stack`
  - Covers: GE-01, GE-04, GE-06, GE-07, GE-09, GE-21, GE-22; §4.4 modes

- [ ] 10. **URL serialisation + localStorage + Share** — Auto-save to localStorage on mutation (SE-07). Load from URL on startup (SE-03). Share button: encode graph → clipboard (SE-06). Round-trip validation. — `feat(app): URL share and localStorage auto-save`
  - Covers: SE-02, SE-06, SE-07
  - Viability gate: a complete graph can be shared and restored exactly

## Decisions to make

| Decision | When | ADR? |
|---|---|---|
| pnpm workspaces monorepo vs single package | Step 1 | Yes |
| Canvas 2D vs WebGL / PixiJS | Step 1 | Yes |
| DPR scaling strategy | Step 5 | Maybe |
| Zustand `getState()` in RAF vs observable alternative | Step 6 | Yes |

## Out of scope (steps 1–10)

- Constraint edges (GE-23–25) — step 11+
- Delay levels (GE-14–16, SI-14–16) — step 11+
- Edge weight UI (GE-13, GE-19) — step 11+
- Node popover (GE-18) — step 11+
- Drag-to-reposition nodes (GE-03) — step 9 undo stack foundation only
- Signal cap characterisation / MAX_SIGNALS (PRD §7.7) — step 11+
- Mobile / touch — out of scope v1
- E2E (Playwright) — after skeleton is stable
