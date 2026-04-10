---
id: DR--20260405--engine--modulator-effective-weight-formula
dateCreated: "2026-04-05"
version: 1.0.0
status: proposed
changeType: creation
domain: engine
slug: modulator-effective-weight-formula
changelog:
  - date: "2026-04-05"
    note: Initial creation
  - date: "2026-04-05"
    note: Marked as draft
  - date: "2026-04-05"
    note: Marked as proposed
lastEdited: "2026-04-05"
---

# Modulator Effective Weight Formula

## 🧭 Context

A `Modulator` connects a source node to a target causal edge and scales that edge's effective
weight at propagation time. The formula must be neutral at the source node's midpoint, suppress
flow at one extreme, and amplify at the other.

The original design assumed all nodes have a fixed `[0, 10]` range and used `NODE_MID = 5` as the
neutral point. During implementation it became clear that nodes carry arbitrary `[min, max]` fields,
making any hardcoded range constant incorrect for the general case.

The formula is a semantic contract: graphs serialised today will depend on it. Changing it later
requires a serialisation version bump and a migration.

## ⚖️ Options Considered

| Option | Description                                                                 | Outcome  | Rationale                                                      |
| ------ | --------------------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| A      | Fixed-range: `clamp(w × nodeValue / 5, 0, 5)` (polarity +1)                 | Rejected | Breaks silently for any node with range ≠ [0, 10]              |
| B      | Range-normalised: `clamp(w × 2t, 0, 5)` where `t = (v − min) / (max − min)` | Accepted | Correct for any node range; mathematically clean               |
| C      | Per-modulator coefficient `strength: number` added to `Modulator` type      | Deferred | No current use case; cognitive load tax; revisit when demanded |

## 🧠 Decision

**Option B — range-normalised formula.**

```text
t = (nodeValue − node.min) / (node.max − node.min)

polarity +1:  effectiveWeight = clamp(baseWeight × 2t,       0, 5)
polarity -1:  effectiveWeight = clamp(baseWeight × 2(1 − t), 0, 5)

degenerate (min === max):  factor = 1  (no modulation effect)
```

At the node's own midpoint both polarities yield `factor = 1` (neutral — base weight unchanged).
At the extremes: polarity +1 is suppressed at `min`, doubled at `max`; polarity -1 is the inverse.
The upper clamp of 5 is consistent with the existing weight ceiling (DR--20260328--engine--weight-range-expansion).

## 🪶 Principles

- **Stewardship:** Closed-form, no hidden state, easy to delete or replace.
- **Justice (shift-left):** Discovered and fixed before threading into `step()` — no graphs
  serialised with the broken fixed-range formula.
- **Impeccability:** Formula is fully specified; 12 unit tests cover no-modulator passthrough,
  both polarities at min/mid/max, clamp, arbitrary range, and degenerate range.
- **Self-Stewardship:** Per-modulator coefficient deferred — no speculative complexity.

## 🔁 Lifecycle

Implemented and tested in `packages/engine/src/sim.ts:computeEffectiveWeights`.
Not yet threaded into `step()` — that is Task 5.

## 🧩 Reasoning

The range-normalisation (`t`) was not in the original design. It emerged when the implementation
revealed that `Node.min` and `Node.max` can be anything. The fixed-range formula (Option A) would
have produced correct results only for the default 0–10 nodes — a silent correctness hazard.

The 2× amplification ceiling is a design choice: at `max`, flow doubles; it cannot exceed the
weight ceiling of 5. This is intentionally conservative. If a model needs stronger amplification,
the formula must be revisited with a concrete motivating example.

## 🔄 Next Actions

- Thread `computeEffectiveWeights` into `step()` → `emitRelayFragments()` (Task 5).
- Export `computeEffectiveWeights` from `index.ts` so store/renderer can call it for display.

## 🧠 Confidence

High. Formula has full test coverage and the range-normalisation is mathematically correct.
The main uncertainty is the 2× ceiling — acceptable until a real model needs more.

## 🧾 Changelog

_Summarise notable updates, revisions, or corrections._
