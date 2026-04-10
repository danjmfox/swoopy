---
id: DR--20260401--engine--relay-propagation-model
dateCreated: "2026-04-01"
version: 1.0.0
status: accepted
changeType: creation
domain: engine
slug: relay-propagation-model
changelog:
  - date: "2026-04-01"
    note: Initial creation — characterisation completed, MAX_HOPS=8 chosen, accepted
supersedes: DR--20260330--engine--staggered-density-signals
---

# DR--20260401--engine--relay-propagation-model

## 🧭 Context

The staggered-density model (DR--20260330) solved oscillation at high weights by normalising
signal strength (`delta/N`). However it introduced a new problem: **diamond graphs propagate
incorrectly**. A→B→D and A→C→D: only one path propagates, not both. The root cause is
delta-based emission — D only emits when its value changes; if the first path causes +1 and
the second path causes -1 (or the two cancel), D emits nothing.

Additionally, `prevNodeValues` and `EMIT_THRESHOLD` are now load-bearing complexity: they
exist solely to detect deltas between steps, a mechanism that is incompatible with the
multi-path propagation requirement.

**Characterisation approach:** A script (`packages/engine/src/characterise-relay.ts`) was
written to implement the relay model inline and test three scenarios across MAX_HOPS
candidates {3, 5, 8, 13}:

- Reinforcing loop A→B→A (+/+): expect saturation at max
- Balancing loop A→B→A (+/-): expect correction, no runaway
- Diamond A→B→D(+), A→C→D(-): expect both B and C to move

**Characterisation results (2026-04-01):**

```text
SIGNAL_SPEED=0.65  EDGE_TRANSIT_TICKS=92

Reinforcing loop A→B→A (+/+) — inject A +1:
  hops=3   peak-sig=1  final A=8.00  B=7.00   PARTIAL
  hops=5   peak-sig=1  final A=9.00  B=8.00   PARTIAL
  hops=8   peak-sig=1  final A=10.00 B=10.00  SATURATE ✓
  hops=13  peak-sig=1  final A=10.00 B=10.00  SATURATE ✓

Balancing loop A→B→A (+/-) — inject A +1:
  hops=3   CORRECT ✓ (A=4.00 B=7.00)
  hops=5   CORRECT ✓ (A=3.00 B=8.00)
  hops=8   CORRECT ✓ (A=2.00 B=10.00)
  hops=13  CORRECT ✓ (A=0.00 B=10.00)

Diamond A→B→D(+), A→C→D(-) — inject A +1:
  All hops: BOTH-PATHS ✓ (B=6.00 C=6.00 D=5.00 — +1 and -1 cancel at D, correct)
```

**MAX_HOPS=8** selected: lowest value at which reinforcing loop fully saturates; diamond and
balancing correct at all values. hops=13 offers no additional behavioural benefit and
increases oscillation amplitude in balancing loops.

## ⚖️ Options Considered

| Option | Description                                            | Outcome      | Rationale                                                                              |
| ------ | ------------------------------------------------------ | ------------ | -------------------------------------------------------------------------------------- |
| A      | Keep staggered-density (delta-emission)                | Rejected     | Diamond propagation broken; prevNodeValues complexity retained                         |
| B      | Relay propagation — arrival triggers fan-out           | **Accepted** | Correct diamond propagation; removes prevNodeValues/EMIT_THRESHOLD; weight = amplitude |
| C      | Relay with weight-as-density (strength/N per fragment) | Rejected     | Returns to stability issues at high weight; amplitude model is simpler and correct     |

## 🧠 Decision

Replace the delta-emission engine with a **relay propagation model**:

- `inject(nodeId, strength)` changes the node's value AND emits signals on all outgoing
  causal edges with `hopsRemaining = MAX_HOPS`
- When a signal arrives at a destination node:
  - `node.value += signal.strength × edge.polarity` (clamped to node bounds)
  - If `signal.hopsRemaining > 0`: emit relay signals on all outgoing causal edges of
    that node, each with `hopsRemaining = signal.hopsRemaining - 1`
- `weight = N` emits **N fragments** per relay event, each of `strength = signal.strength`
  (amplitude model: total effect = N × strength; weight controls both visual density AND
  effect magnitude)
- Fragments staggered across `EDGE_TRANSIT_TICKS` (visual contract unchanged)
- `MAX_HOPS = 8` (empirically determined: saturates simple reinforcing loops; supports
  paths up to 8 edges in length)
- `prevNodeValues`, `displayPrevNodeValues`, and `EMIT_THRESHOLD` are **removed**

**Semantic change for weight:**
Weight=N means N× the effect (amplitude model), not density. A weight=5 edge produces 5×
the node change per relay event compared to weight=1. This is the "stronger link = bigger
effect" intuition, consistent with users' expectations. The staggered-density model's
"weight=density" interpretation is superseded.

## 🪶 Principles

- **Stewardship (DR-001 fidelity):** No node-level decay introduced. Loop structure is
  load-bearing. Signal aging (`hopsRemaining`) is scoped to signals only.
- **Stewardship (deletability):** Net removal of complexity — `prevNodeValues`,
  `displayPrevNodeValues`, `EMIT_THRESHOLD`, and the delta-emission loop are all deleted.
- **Justice (shift-left):** MAX_HOPS risk characterised empirically before any implementation.
- **Impeccability (TDD):** Implementation proceeds one failing test at a time.

## 🔁 Lifecycle

Status: New → Accepted (characterisation evidence sufficient; no further review needed).
Supersedes: DR--20260330--engine--staggered-density-signals

## 🧩 Reasoning

The core insight: delta-based emission couples propagation to value change detection. This
works for linear chains but breaks for multi-path graphs where arriving signals cancel. The
relay model decouples them: propagation is triggered by signal arrival, not by whether the
destination's value changed. This is the correct model for causal loop diagrams where the
question is "did a signal travel this edge?" not "did this node's value change?"

The amplitude semantics for weight restore the intuition that stronger links have bigger
effects. The staggered-density model's invariant (total effect = delta regardless of weight)
was pedagogically confusing and practically unexpected. With the relay model, weight=N is
simply N times the signal — honest and testable.

Trade-off: higher weight + longer relay chains = more signal traffic. With MAX_HOPS=8 and
weight up to 5, worst-case peak signals on a complex graph could be significant. The existing
MAX_SIGNALS cap (132) provides a safety floor; re-characterisation post-implementation will
confirm whether it needs adjusting.

## 🔄 Next Actions

1. ~~Characterise relay model across MAX_HOPS candidates~~ ✓ (2026-04-01)
2. ~~Record DR and choose MAX_HOPS=8~~ ✓
3. Add `hopsRemaining: number` to `Signal` type in `types.ts`
4. Add `MAX_HOPS = 8` to `constants.ts`; remove `EMIT_THRESHOLD`
5. Rewrite `inject()` to emit signals on outgoing edges
6. Rewrite `step()` arrival section: apply value + relay if hops > 0
7. Implement weight = fragment count (amplitude); stagger preserved
8. Remove `prevNodeValues`, `displayPrevNodeValues`, emission loop from `step()`
9. Integration scenario tests (reinforcing, balancing, diamond)
10. Audit renderer/app for `displayPrevNodeValues` reads
11. Update `ARCHITECTURE.md` and PRD §7.2, §7.6, GE-13

## 🧠 Confidence

High. Relay model is the standard propagation mechanism for signal-based graph engines. The
characterisation script provides concrete evidence for MAX_HOPS=8. The deletion of
`prevNodeValues` is the biggest structural change; renderer impact is known and bounded.

## 🧾 Changelog

_See YAML frontmatter._
