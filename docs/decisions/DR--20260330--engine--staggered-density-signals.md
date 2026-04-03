---
id: DR--20260330--engine--staggered-density-signals
dateCreated: "2026-03-30"
version: 1.1.0
status: accepted
changeType: revision
domain: engine
slug: staggered-density-signals
changelog:
  - date: "2026-03-30"
    note: Initial creation — emerged from oscillation investigation during first high-weight use
  - date: "2026-03-30"
    note: Advanced to proposed — characterisation evidence committed alongside
  - date: "2026-03-30"
    note: Accepted — model confirmed, implementation proceeding
  - date: "2026-03-31"
    note: "v1.1 revision — stagger-after-delay extended to delayed edges (emerged from manual testing)"
---

# DR--20260330--engine--staggered-density-signals

## 🧭 Context

With the weight range expanded to 0–5 (DR--20260328--engine--weight-range-expansion) and
intrinsic decay removed (DR-001), the engine has no mechanism to prevent divergent oscillation
in balancing loops where edge weight > 1.

**Root cause:** In the current model, a node emitting delta emits one signal of strength
`delta × weight`. In a 2-node balancing loop, the round-trip loop gain is `w²`. At w=5,
gain = 25 — the system ping-pongs violently between floor and ceiling within seconds of
any injection.

The DR-001 decision to remove decay was correct and must be preserved: decay masked loop
structure and was pedagogically harmful. Any fix must not reintroduce an invisible stabiliser.

**Investigation approach:** A characterisation script
(`packages/engine/src/characterise-staggered.ts`) was written to test three candidate models
inline (no production code changed) against two scenarios:

- Scenario A: 6- and 12-node fully-connected reinforcing graph → steady-state signal count
- Scenario B: 2-node balancing loop at w=1, w=3, w=5 → oscillation check

**Characterisation results (2026-03-30):**

```text
SIGNAL_SPEED=0.65, EDGE_TRANSIT_TICKS≈92, EMIT_THRESHOLD=0.06

Scenario A — signal count (travelling + pending, p99 plateau ticks 120–600):
  6-node  w=1  peak=30   p99=0    (nodes saturate, no sustained activity)
  12-node w=1  peak=132  p99=0
  6-node  w=3  peak=90   p99=30
  12-node w=3  peak=396  p99=132
  6-node  w=5  peak=150  p99=90
  12-node w=5  peak=660  p99=396

Scenario B — 2-node balancing loop (A samples every 30 ticks, final at t=300):
  w=1  staggered(delta):    ✓ stable  final=5.00
  w=1  normalized(delta/N): ✓ stable  final=5.00
  w=1  damped(FRICTION=0.8):✓ stable  final=5.15
  w=3  staggered(delta):    ✗ crashes final=0.00
  w=3  normalized(delta/N): ✓ stable  final=5.11
  w=3  damped(FRICTION=0.8):✓ stable  final=5.20
  w=5  staggered(delta):    ✗ crashes final=0.00
  w=5  normalized(delta/N): ✓ stable  final=5.12
  w=5  damped(FRICTION=0.8):✓ stable  final=5.20
```

## ⚖️ Options Considered

| Option | Description                                                      | Outcome      | Rationale                                                                 |
| ------ | ---------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------- |
| A      | Keep current model (1 signal × delta × weight)                   | Rejected     | Loop gain = w²; oscillates violently at w>1                               |
| B      | Fixed damping (SIGNAL_DAMPING=0.95 at emission)                  | Rejected     | Round-trip gain still w²×d²=22.6 at w=5; insufficient by 22×              |
| C      | Staggered(delta): N signals × strength=delta each                | Rejected     | Delays onset but doesn't prevent oscillation; still crashes at w≥3        |
| D      | Normalized(delta/N): N signals × strength=delta/N each           | **Accepted** | Stable at all weights; weight controls visual density only                |
| E      | Damped(FRICTION=0.8): velocity-dependent suppression on top of D | Considered   | Also stable; slightly suppresses large injections; harder to explain/test |

## 🧠 Decision

Replace the current single-signal emission model with **staggered-density emission**:

- `weight=N` emits **N signals** on an outgoing edge, each of strength `delta / N`
- Signals depart staggered: signal `i` departs with a `ticksRemaining` offset of
  `i × floor(EDGE_TRANSIT_TICKS / N)`, so N signals appear as N equally-spaced
  particles travelling along the edge at any given time
- **Total effect per emission event = delta** (independent of weight)
- Signal arrival formula is unchanged: `nodeValue += signal.strength × edge.polarity`
- Weight 0 emits 0 signals (no effect); fractional weights are rounded to nearest integer
  (`round(weight)`, minimum 0)

**Semantic reinterpretation of weight:**
Weight no longer means "signal amplitude multiplier." It means **coupling density** —
how many simultaneous signal pathways exist on the edge. A weight=5 edge shows 5 particles
in transit; a weight=1 edge shows 1. This matches how Nicky Case's original Loopy expressed
relationship strength via multiple edges between the same nodes.

The label on the edge weight control should be updated from "Strength" to a word that
reflects density/coupling rather than amplitude. Candidate: "Coupling". Open question:
confirm label before implementing UI change.

**What weight does NOT do in this model:**
Weight does not change the steady-state outcome of a simple loop. It affects:

- Visual richness: more particles on screen for high-weight edges
- Temporal spread: multiple arrivals over the edge transit period
- In complex multi-loop graphs: more signal traffic on high-weight edges, creating
  qualitatively denser propagation patterns

## 🪶 Principles

- **Stewardship (DR-001 fidelity):** Does not reintroduce invisible physics. Loop structure
  remains load-bearing. A reinforcing loop still saturates to max; a balancing loop still
  corrects proportionally.
- **Justice (shift-left):** Oscillation fix verified empirically before implementation.
  Characterisation script committed alongside DR as evidence.
- **Impeccability:** MAX_SIGNALS must be re-characterised with the production engine after
  implementation. The current constant (30) was set for weight=1 graphs; high-weight graphs
  produce proportionally more signals.

## 🔁 Lifecycle

Status: New → Proposed → Accepted before implementation begins.

## 🧩 Reasoning

The key insight is that there are two distinct semantic interpretations of "stronger edge":

1. **Amplitude model** (current): one signal hits harder. Requires loop gain < 1 for
   stability; fails at w>1 without decay.
2. **Density model** (this decision): more signals travel. Total effect is the same but
   distributed over time and visible as multiple particles. Stable at all weights.

The density model is more faithful to the mental model of systems thinkers: a "strong"
causal relationship means the link fires frequently and reliably, not that each individual
event is catastrophic. Multiple particles on screen is also a direct analogue to Loopy's
multi-edge convention, which users of that tool will recognise immediately.

The trade-off is that weight no longer amplifies dynamics. A weight=5 edge and a weight=1
edge produce identical long-run node values in isolation. The modeller who expects "weight=5
means the target moves 5× as much" will be surprised. The documentation and UI label must
make this clear.

## 🔄 Next Actions

1. ~~Raise DR (this document)~~ ✓
2. Move DR to `docs/decisions/` and run `drctl decision accept` after review
3. Update `packages/engine/src/sim.ts` — emission section only:
   - Replace single-signal emission with staggered N-signal loop
   - Per-signal strength: `delta / count`
   - Stagger offset: `i × floor(EDGE_TRANSIT_TICKS / count)` via pending queue
4. Update `packages/engine/src/constants.ts`:
   - Add `EDGE_TRANSIT_TICKS` (or derive from SIGNAL_SPEED in sim.ts)
5. Re-run characterisation with production engine; update `MAX_SIGNALS`
6. Update tests: `population.test.ts` assertions may need revisiting (relative comparisons
   should survive; any assertion tied to absolute values may shift)
7. Update UI label for weight control (pending word decision)
8. Update PRD §7.2 (emission algorithm), §7.6 (constants), GE-13 (weight semantics)
9. Update ARCHITECTURE.md simulation step section

## v1.1 Revision — Delayed Edges (2026-03-31)

**Emerged from:** manual testing of a polarity=-1, weight=5, delay="short" edge which
showed only 1 particle in transit.

**Problem:** The v1.0 implementation scoped stagger to non-delayed edges only with the
comment "delay dominates." This was incorrect — weight-as-density must apply to delayed
edges too for consistent visual semantics. A weight=5 edge must show 5 particles regardless
of whether it carries a delay.

**Decision:** Stagger-after-delay. For delayed edges with weight > 1:

- Emit `count = round(weight)` signals, each of strength `delta / count`
- Signal `i` gets `ticksRemaining = DELAY_TICKS[edge.delay] + i × staggerTicks`
- The burst departs after the delay has expired, then spreads across the edge transit

This preserves the delay semantics (nothing moves until the delay expires) while restoring
the visual density guarantee (count particles will travel the edge after release).

**Implementation:** Update the `edge.delay !== "none"` branch in `sim.ts` to emit N
staggered signals instead of 1 full-strength signal.

## 🧠 Confidence

High for the physics model — the characterisation test is unambiguous. Moderate for the
UX implications of weight-as-density vs weight-as-amplitude. The label change (open
question) should be tested with at least one facilitation session before finalising.

## 🧾 Changelog

_See YAML frontmatter._
