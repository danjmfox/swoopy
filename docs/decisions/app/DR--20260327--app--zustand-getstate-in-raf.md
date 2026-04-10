---
id: DR--20260327--app--zustand-getstate-in-raf
dateCreated: "2026-03-27"
version: 1.0.0
status: accepted
changeType: creation
domain: app
slug: zustand-getstate-in-raf
changelog:
  - date: "2026-03-27"
    note: Initial creation — captured at RAF + store implementation (step 6)
  - date: "2026-03-28"
    note: Accepted — decision validated by Zustand slice boundary test (store.test.tsx)
lastEdited: "2026-03-28"
---

# RAF loop reads simSlice via Zustand getState(), not useStore()

## 🧭 Context

The simulation must run at 60fps via `requestAnimationFrame` (SI-01). Each frame,
`step()` must be called with the current graph and sim state, and the result written
back to the store. The question is how the RAF loop accesses and updates that state
without causing React re-renders.

React components must never re-render during simulation ticks — only on structural
graph changes (PRD §5.1, §6.2). If the RAF loop triggers re-renders, frame drops
occur and the React/RAF boundary collapses.

## ⚖️ Options Considered

| Option | Description                                                  | Outcome  | Rationale                                                                                                                                                                 |
| ------ | ------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | Store sim state in React state (`useState`/`useReducer`)     | Rejected | Every tick causes a re-render; violates PRD §5.1 directly                                                                                                                 |
| B      | Use a Zustand subscription (`subscribe()`) in the RAF loop   | Rejected | Inverted: RAF should push to store, not react to it; adds unnecessary complexity                                                                                          |
| C      | Two Zustand slices; RAF calls `store.getState().tickSim(dt)` | Chosen   | `getState()` is a snapshot read with no subscription; `tickSim` updates the sim slice; React components subscribe to graphSlice only and never re-render from sim changes |
| D      | Observable/signal library (RxJS, nanostores) for sim state   | Rejected | Cognitive load tax — adds a second reactive primitive for one boundary; Zustand already solves this with `getState()`                                                     |

## 🧠 Decision

The RAF loop (`LoopyRenderer`) holds a reference to `store.getState` (not
`useStore`). Each frame it calls `getState().tickSim(dt)`. `tickSim` reads the
current graph and sim via `get()`, calls `step()`, and calls `set({ sim: nextSim })`.

React components subscribe to `graphSlice` fields only. Because `set({ sim })` does
not change any graphSlice value, Zustand's selector-based equality check prevents
any re-render.

Validated by test: `store.test.tsx` asserts render count stays at 1 across multiple
`tickSim()` calls.

## 🪶 Principles

- **Justice:** The highest-risk bet in the architecture (PRD §9: "React re-renders
  during RAF causing frame drops") is addressed at the boundary rather than worked
  around later.
- **Stewardship:** No additional library. Zustand's `getState()` is a documented,
  idiomatic escape hatch for non-reactive reads. No bespoke signal machinery.
- **Cognitive Stewardship:** Option D (observables) was explicitly considered and
  rejected — the cognitive load of a second reactive system is not justified here.

## 🔁 Lifecycle

Status: `new` → advance to `draft` once reviewed.

## 🧩 Reasoning

The key insight: Zustand's `getState()` is a synchronous snapshot — it does not
create a subscription and triggers no React renders. `set()` notifies only
subscribers whose selected value changed. Since no React component selects `sim`,
`set({ sim: nextSim })` produces zero re-renders.

This was the highest architectural risk in the plan. The test confirms the bet pays off.

## 🔄 Next Actions

- Advance to `proposed` after review
- In step 7, wire the seed graph into the store and verify the full RAF→step→draw
  cycle produces no React re-renders (the walking skeleton feasibility gate)

## 🧠 Confidence

High. Validated by a passing test against the real Zustand store and React renderer.
The pattern is documented in Zustand's own guidance for non-reactive reads.

## 🧾 Changelog

| Date       | Note                                                                       |
| ---------- | -------------------------------------------------------------------------- |
| 2026-03-27 | Initial draft — captured at step 6 implementation (feat/step-6-raf-slices) |
