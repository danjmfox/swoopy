---
id: DR--20260727--engine--max-hops-increase
dateCreated: "2026-07-27"
version: 1.0.0
status: accepted
changeType: amendment
domain: engine
slug: max-hops-increase
changelog:
  - date: "2026-07-27"
    note: >-
      Initial creation — documents an already-shipped revision (MAX_HOPS 8 -> 26) found
      undocumented during a full docs audit. The code (constants.ts comment,
      characterise-relay.ts scenarioLongChain) already carried the evidence and rationale;
      no formal decision record existed for the change until now.
amends: DR--20260401--engine--relay-propagation-model
---

# DR--20260727--engine--max-hops-increase

## 🧭 Context

`DR--20260401--engine--relay-propagation-model` set `MAX_HOPS = 8`, empirically determined to
saturate simple (2-node) reinforcing loops. That characterisation tested candidates
`{3, 5, 8, 13}` against four scenarios, none of which exercised a loop longer than 2 nodes.

In practice, a facilitator building a realistic causal loop diagram routinely creates
reinforcing loops with more than 2 nodes — a 5-node loop (`A→B→C→D→E→A`, all polarity +1) is a
common shape, not an edge case. At `MAX_HOPS = 8`, a signal chain traversing this loop is
consumed after 8 edge-traversals — less than two full round-trips (5 hops = 1 round trip) — so
the loop never reaches its stable saturated state. A facilitator running this exact scenario in
a live session would see the nodes settle at an intermediate, non-saturated value (peak ≈ 7 of a
max of 10) and reasonably conclude the tool is broken or the model is wrong, when the actual
behavior is an artifact of an under-scoped constant.

This gap was not caught by the original characterisation because no scenario in
`characterise-relay.ts` tested a loop longer than a diamond (4 nodes, non-cyclic path). A fifth
scenario (`scenarioLongChain`, 5-node reinforcing loop) was added to the same characterisation
script at some point after `DR--20260401` was written, and `MAX_HOPS` was raised to `26` in
`packages/engine/src/constants.ts` with an inline comment explaining the reasoning — but no DR
was written to record the change, leaving `DR--20260401` stale on this point. Found and closed
during a full documentation audit (2026-07-27), not during original development.

## ⚖️ Options Considered

| Option | Description                                                                                                                   | Outcome                                                   | Rationale                                                                                                                                                                                        |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A      | Leave `MAX_HOPS = 8`                                                                                                          | Rejected (already rejected in practice, prior to this DR) | Fails to saturate any reinforcing loop longer than 2 nodes — the exact shape DISCUSS-level product framing (facilitator workshops) treats as a common, not rare, model structure                 |
| B      | Raise to a value covering only the specific loop sizes tested                                                                 | Rejected                                                  | Arbitrary without a stated minimum-loop-size target; `13` (the next characterised candidate after 8) still fails the 5-node case per the evidence below                                          |
| C      | **(Chosen)** Raise to `26` — the lowest characterised candidate at which the 5-node reinforcing-loop scenario fully saturates | **Accepted**                                              | Directly evidenced: `26 / 5 = 5.2` round-trips through a 5-node loop is the minimum needed to reach saturation per the characterisation run; matches the value already shipped in `constants.ts` |

## 🧠 Decision

`MAX_HOPS = 26` (up from `8`). Rationale, verbatim from the shipped code comment
(`packages/engine/src/constants.ts`):

> Binding constraint: a 5-node reinforcing loop (A→B→C→D→E→A) requires 5 hops per round-trip.
> Starting at 5 (range 0–10), full saturation needs 5 round-trips = 25 hops minimum. hops=26 is
> the lowest candidate where all characterisation scenarios pass, including the 5-node
> long-chain scenario added to evidence the increase from 8. hops=8 saturates only 2-node loops;
> a facilitator building a 5-node model sees only peak=7, not saturation — insufficient to
> demonstrate stable-state behaviour.

This is a **pure amendment** to `DR--20260401`, not a reversal: the relay propagation _model_
(fragment-per-hop emission, amplitude semantics, edge-transit staggering) described there is
unchanged. Only the `MAX_HOPS` constant's value changed, along with the characterisation
evidence base (`characterise-relay.ts` gained a fifth scenario, `scenarioLongChain`, to test it).

## 🪶 Principles

- **Justice (shift-left):** the gap was a testing-coverage gap (no scenario exercised a
  realistic 5-node loop), not an implementation bug — closing it before it surfaced as a
  confusing live-session experience for a facilitator is exactly the shift-left this project's
  Virtue Filter asks for.
- **Impeccability:** a decision record that silently drifts from the code it documents is worse
  than no record — this DR (and the amendment note added to `DR--20260401`) restores
  policy-as-lived-truth, the same principle applied in
  `DR--20260724--process--mutation-testing-scope.md` earlier this project.
- **Stewardship / Delete-ability:** no new mechanism, no new file beyond this record and one
  updated code comment (`characterise-relay.ts`'s header, corrected to describe 5 scenarios and
  candidate `26`, matching its own body).

## 🔁 Lifecycle

Already in effect — `constants.ts` has shipped `MAX_HOPS = 26` since before this DR was written.
This record closes a documentation gap, it does not trigger any new code change.

## 🧩 Reasoning

Found via a full-repo documentation audit (`/nw-documentarist`-style review across all `.md`
files, 2026-07-27) that cross-checked every foundational engine decision record against current
source. `DR--20260401` was the only one of six checked engine DRs found to have drifted from
its own subject matter's current value. See `characterise-relay.ts`'s `scenarioLongChain`
function (added after `DR--20260401`) for the executable evidence backing `26`.

## 🔄 Next Actions

- None — the code, its comment, and now this DR and the amendment note on `DR--20260401` are
  mutually consistent. No further action required unless a future characterisation run
  identifies an even larger binding loop size.

## 🧠 Confidence

High. The evidence (code comment, `scenarioLongChain` characterisation function, `KPI-05` entry
in `docs/product/kpi-contracts.yaml`) all independently corroborate the same `8 → 26` figure and
rationale — this DR consolidates already-consistent evidence into the missing formal record,
rather than introducing a new claim.
