# DR-001: Remove intrinsic decay — adopt pure signal-driven simulation

**Date:** 2026-03-28
**Status:** Accepted
**Deciders:** Dan Osborne

---

## Context

The original SI-06 requirement specified that node values decay exponentially toward their `initial` value when not receiving signals:

```
node.initial + (value − node.initial) × (1 − DECAY)^dt
```

This was implemented as a constant `DECAY = 0.28` (nodes return to rest in ~3s).

During visual validation of step 20, a conceptual problem was identified: intrinsic decay does work that should be done by the causal graph topology. Specifically:

- A node injected with a positive signal drifts back to `initial` regardless of whether a balancing loop exists
- From a user perspective, all systems look self-correcting — the model does not reveal whether the correction comes from a loop or from invisible physics
- This undermines the tool's core pedagogical purpose: making loop structure visible and consequential

In the original Loopy (Nicky Case), stocks are driven entirely by arriving signals. A node stays wherever signals leave it. Only a genuine balancing loop — a negative-polarity feedback path — brings a stock back down. Reinforcing loops saturate to `max` and stay there. This forces the modeller to think about what stabilises the system.

---

## Decision

Remove the intrinsic decay step from `step()`. Node values change only when signals arrive.

- `initial` becomes a reset-only value: used by `makeInitialSim()` and the Reset button; not a gravity well during simulation
- The `DECAY` constant is removed from `constants.ts` and from all exports
- SI-06 is revised: "Node values are not driven by intrinsic decay. Stocks remain at whatever value signals have left them. Only incoming signals (via causal edges) change a node's value during simulation."

---

## Consequences

### Behavioural changes

| Scenario | Before | After |
|----------|--------|-------|
| Inject node, no loops | Returns to `initial` in ~3s | Stays elevated indefinitely |
| Reinforcing loop only | Amplifies then decays back | Amplifies to `max`, stays |
| Balancing loop | Corrects faster due to decay + loop | Loop must do all the corrective work |
| No injection, no signals | Node stays at `initial` (decay already at floor) | No change — same outcome |

### Loop structure becomes load-bearing

Users will notice that reinforcing-only models do not self-correct. This is the correct behaviour: it surfaces the need for a balancing loop. It is no longer possible to mistake decay-driven stability for loop-driven stability.

### Tests affected

- **SI-06 test** — the existing decay assertion is removed; replaced with: "a node injected with no balancing loop stays elevated after 600 ticks"
- **GE-13 weight=0 test** — comment updated; assertion still passes (no signal means no change, same as before)
- **GE-24 dynamic constraint test** — relied on decay to push B back toward `initial` after a ceiling was relaxed; rewritten to use an explicit signal/injection to demonstrate the constraint bound updating
- **Appendix A population integration tests** — behaviour changes; assertions re-evaluated against the signal-driven model

### Documentation

- PRD §4.2 SI-06 updated
- USER-GUIDE "decay" section removed; "how balancing loops work" explanation added
- ARCHITECTURE step() algorithm updated

---

## Alternatives considered

**Keep decay, make it optional (node-level flag)**
Adds complexity without resolving the pedagogical problem. A user would need to know to turn it off to see true loop dynamics.

**Keep decay, slow it significantly**
Mitigates the masking effect but does not eliminate it. Models with no balancing loops still look stable eventually.

**Expose decay as an explicit negative self-loop**
Honest representation but requires a new edge type (self-loop) and would clutter every diagram with bookkeeping edges.
