---
id: DR--20260405--engine--modulator-effective-weight-formula
dateCreated: "2026-04-05"
version: 1.1.0
status: proposed
changeType: revision
domain: engine
slug: modulator-effective-weight-formula
changelog:
  - date: "2026-04-05"
    note: Initial creation
  - date: "2026-04-05"
    note: Marked as draft
  - date: "2026-04-05"
    note: Marked as proposed
  - date: "2026-04-11"
    note: "Revised to throttle semantics (factor 0→1, not 0→2). Amplification dropped based on systems thinking literature review — modulators model enabling conditions, not scaling. Base weight is now the ceiling. See DR--20260411--renderer--modulated-edge-weight-rendering."
lastEdited: "2026-04-11"
---

# Modulator Effective Weight Formula

## 🧭 Context

A `Modulator` connects a source node to a target causal edge and scales that edge's effective
weight at propagation time. The formula must be range-normalised (nodes carry arbitrary `[min, max]`
fields), and must model the semantics of an enabling condition: the source node gates or throttles
the relationship, but does not amplify it beyond its configured base weight.

The original design assumed a symmetric 0→2 factor range (suppress at one extreme, double at the
other), treating the midpoint as neutral. This was revised after a systems thinking literature
review: most real-world modulators model *enabling conditions* (gates and throttles), not scaling
multipliers. Amplification beyond base weight conflates the modulator with a second reinforcing
path — a different and stronger causal claim requiring explicit modelling.

The formula is a serialisation contract. This revision changes the factor ceiling from 2 to 1
and shifts the neutral point from midpoint to maximum. **A serialisation migration is required
for any graphs created under v1.0.0 that contain modulators.** (Deferred: no such graphs exist
in production at time of revision.)

## ⚖️ Options Considered

| Option | Description | Outcome | Rationale |
| ------ | ----------- | ------- | --------- |
| A | Fixed-range: `clamp(w × nodeValue / 5, 0, 5)` | Rejected | Breaks silently for any node with range ≠ [0, 10] |
| B | Symmetric 2×: `clamp(w × 2t, 0, 5)` — suppress at min, double at max | Rejected (v1.0.0) | Amplification conflates modulator with reinforcing path; pedagogically misleading |
| C | Throttle: `clamp(w × t, 0, 5)` — suppress at min, full strength at max | Accepted (v1.1.0) | Correct for any range; throttle-only semantics match enabling condition concept |
| D | Per-modulator coefficient `strength: number` on `Modulator` type | Deferred | No current use case; cognitive load tax; revisit when demanded |

## 🧠 Decision

**Option C — range-normalised throttle formula.**

```text
t = (nodeValue − node.min) / (node.max − node.min)

polarity +1:  effectiveWeight = clamp(baseWeight × t,       0, 5)
polarity -1:  effectiveWeight = clamp(baseWeight × (1 − t), 0, 5)

degenerate (min === max):  factor = 1  (passthrough — no modulation effect)
```

At the source node's maximum, polarity +1 yields `factor = 1` (full strength — base weight
unchanged). At minimum, `factor = 0` (fully suppressed). The base weight is always the ceiling;
the modulator can only reduce, never exceed it.

Non-zero minimum effective weight is achieved by applying a floor constraint to the modulator
source node (e.g. floor at 3/10 → `t_min = 0.3` → effective weight never drops below 30% of
base). This is composable and requires no additional modulator parameters.

The upper clamp of 5 is consistent with the weight ceiling (DR--20260328--engine--weight-range-expansion).

## 🪶 Principles

- **Stewardship:** Closed-form, no hidden state, easy to delete or replace. Constraint composition
  (floor on source node) handles non-zero minimums without adding modulator parameters.
- **Justice (shift-left):** Semantic revision made before any production graphs exist with modulators.
  No migration burden at this stage.
- **Impeccability:** Existing tests for no-modulator passthrough, both polarities, clamp, arbitrary
  range, and degenerate range must be updated to reflect factor ceiling of 1 (not 2).
- **Self-Stewardship:** Amplification deferred — no concrete motivating example exists; the simpler
  throttle semantics are sufficient and more teachable.

## 🔁 Lifecycle

v1.0.0: Implemented in `packages/engine/src/sim.ts:computeEffectiveWeights` with 2× factor ceiling.
v1.1.0: Formula revised to throttle semantics (factor 0→1). Tests require update.

## 🧩 Reasoning

The 2× ceiling in v1.0.0 was a provisional choice flagged as uncertain in the original DR. The
revision is motivated by two observations:

1. **Systems thinking literature** (Sterman, Meadows): modulators in real models are typically
   enabling conditions — they gate or throttle relationships, not amplify them. Amplification is
   usually modelled as a separate reinforcing causal path, making the relationship explicit.

2. **Pedagogical clarity**: telling a learner "Node B doubles the strength of A→C when B is high"
   is a different and harder claim than "Node B enables A→C." The throttle semantics support the
   simpler, more common teaching case.

The constraint-as-floor composition (`floor constraint on source node → non-zero effective weight
minimum`) emerged from the throttle design as a natural consequence and requires no new parameters.

## 🔄 Next Actions

- Update `computeEffectiveWeights` in `sim.ts` from `2t` to `t`.
- Update existing unit tests (12 tests) to reflect new factor ceiling.
- Update `NODE_MID` comment in `constants.ts` — now stale (references old fixed-range formula).
- Export `computeEffectiveWeights` from `index.ts` for renderer use.
- See DR--20260411--renderer--modulated-edge-weight-rendering for visual treatment.

## 🧠 Confidence

High on throttle semantics. The range-normalisation is unchanged and correct. The factor ceiling
change (2→1) is a deliberate simplification with clear pedagogical rationale. If a concrete
amplification use case emerges, revisit with a motivating model example.

## 🧾 Changelog

_Summarise notable updates, revisions, or corrections._
