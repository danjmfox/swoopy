---
id: DR--20260408--engine--signal-direction
dateCreated: "2026-04-08"
version: 1.0.0
status: accepted
changeType: creation
domain: engine
slug: signal-direction
changelog:
  - date: "2026-04-08"
    note: Initial creation
  - date: "2026-04-08"
    note: Marked as draft
  - date: "2026-04-08"
    note: Marked as proposed
  - date: "2026-04-08"
    note: Marked as accepted
lastEdited: "2026-04-08"
dateAccepted: "2026-04-08"
---

# Signal Direction as First-Class Engine Property

## 🧭 Context

Swoopy's primary purpose is teaching and communication — helping users understand causal loop
dynamics by watching signals propagate through a system. Currently `Signal` carries only
`strength` (magnitude) and `hopsRemaining`. Direction (increase vs. decrease) is not modelled.

This creates two problems:

**1. Visual gap.** The renderer cannot draw meaningful up/down arrows because it doesn't know
whether a signal represents an increasing or decreasing effect. All signals look identical in
transit. This removes the clearest pedagogical affordance Loopy has: watching an "up" arrow flip
to "down" as it crosses a balancing edge.

**2. Semantic gap.** The relay formula `nodeValues += strength × edge.polarity` treats every
relay signal as a positive impulse and applies polarity only at the point of arrival. This is
correct for the _first_ hop (injection) but wrong for subsequent hops. A signal that caused a
_decrease_ at node B relays from B as an unsigned positive — it will _increase_ downstream nodes
via +1 edges, when correct semantics require it to _decrease_ them (B went down; via a +1 edge
from B→C, C should also go down).

Concrete example: A→B (−1) → B→C (+1). Inject A.

- Hop 1: B decreases ✓ (strength × −1)
- Hop 2 (current): C increases ✗ (strength × +1 — relay ignores that B decreased)
- Hop 2 (correct): C decreases ✓ (B decreased, +1 edge means C tracks B)

For a teaching tool, visual and semantic truth must be consistent. Misleading arrows undermine
the trust that is the tool's entire value.

## ⚖️ Options Considered

| Option | Description                                                                 | Outcome      | Rationale                                                                                                     |
| ------ | --------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------- |
| A      | Keep Signal as-is; infer direction at render time by walking polarity chain | Rejected     | Renderer must understand relay semantics (coupling violation); expensive per-frame; does not fix semantic gap |
| B      | Add `sign: 1 \| -1` to Signal for visual purposes only; math unchanged      | Rejected     | Visual arrows may contradict actual multi-hop effects — worse than no arrows for a teaching tool              |
| C      | Add `sign: 1 \| -1` to Signal; incorporate into relay math                  | **Accepted** | Correct semantics and correct visual; single source of truth                                                  |

## 🧠 Decision

Add `sign: 1 | -1` to `Signal`. Incorporate sign into relay propagation so that direction
accumulates through the relay chain:

**At injection** — for each outgoing signal on edge E (polarity P):

```text
signal.sign = P
```

(An increase at the source node produces an increase at the destination for +1 edges, a decrease
for −1 edges.)

**At relay** — when a signal with sign S arrives at node B via incoming edge, and a new relay
signal is emitted on outgoing edge E (polarity Q):

```text
relay.sign = S × Q
```

(The accumulated direction of the chain determines the direction of the next hop.)

**Arrival effect** — replace `nodeValues += strength × edge.polarity` with:

```text
nodeValues += strength × sign
```

(Sign already encodes the accumulated polarity chain; no additional multiplication needed.)

This preserves existing single-hop correctness (injection sign = edge.polarity → same math as
before), fixes multi-hop semantics, and directly drives renderer arrow direction.

## 🪶 Principles

- **Justice (shift-left):** The semantic gap is a correctness bug, not a visual nicety. Fix it
  at the engine layer before building a renderer on top of a wrong model.
- **Stewardship (deletability):** `edge.polarity` multiplication moves from the arrival formula
  into relay emission. Net complexity neutral; no new abstractions.
- **Impeccability (TDD):** Multi-hop semantic change must be characterised before implementation
  — existing MAX_HOPS scenarios re-run, new "decrease propagates through +1 edge" scenario added.
- **Self-Stewardship:** Option B (visual only) is the tempting quick win. It is rejected because
  a teaching tool with misleading visuals is worse than one with no visuals at all.

## 🔁 Lifecycle

Status: New → Draft → Proposed → Accepted
Requires: characterisation script updated and run before advancing to Proposed.

## 🧩 Reasoning

The core insight: the relay model currently treats every signal as a positive impulse and lets
edge polarity resolve direction at each hop independently. This is correct for single-hop graphs
but breaks for multi-hop chains because "B decreased" is not carried forward — relay fragments
always emit with the same unsigned strength.

Adding `sign` makes direction an intrinsic property of the signal, accumulated through the
polarity chain. This is the model Loopy uses implicitly (up/down arrows flip at balancing edges)
and is semantically correct for causal loop diagrams where the question is "what is the
_direction_ of this influence?", not just "did something arrive?".

**Behavioural change:** existing test scenarios (reinforcing, balancing, diamond) are expected to
remain correct — those patterns are all single-polarity chains or cancel symmetrically. However,
mixed-polarity multi-hop chains will change. MAX_HOPS re-characterisation is required.

**Trade-off accepted:** this is a non-trivial engine change requiring re-characterisation. The
alternative (Option B, visual-only sign) was explicitly rejected because a teaching tool must not
display arrows that contradict the system's actual behaviour.

## 🔄 Next Actions

1. Update characterisation script to include mixed-polarity multi-hop scenario: A→B (−1) → B→C (+1)
2. Re-run characterisation across MAX_HOPS candidates with new relay formula
3. Add `sign: 1 | -1` to `Signal` type in `types.ts`
4. Update `inject()` to set `sign = edge.polarity` for emitted signals
5. Update relay emission to set `sign = parent.sign × outgoing_edge.polarity`
6. Change arrival formula from `strength × edge.polarity` to `strength × sign`
7. Add failing tests for multi-hop direction propagation before implementing
8. Re-run existing relay/sim test suite; update expected values where multi-hop semantics change

## 🧠 Confidence

Medium. The model change is logically sound and the formula is simple. Confidence is limited by
not yet having run characterisation — existing tests may reveal unexpected interaction effects
with MAX_HOPS and the signal cap. Advance to Proposed after characterisation results are in hand.

## 📊 Characterisation Results

Run: `node --experimental-strip-types packages/engine/src/characterise-relay.ts`
Formula: new (sign-carrying relay, Option C)

| Scenario                     | hops=3       | hops=5       | hops=8       | hops=13      |
| ---------------------------- | ------------ | ------------ | ------------ | ------------ |
| Reinforcing A→B→A (+/+)      | PARTIAL      | PARTIAL      | SATURATE ✓   | SATURATE ✓   |
| Balancing A→B→A (+/-)        | CORRECT ✓    | CORRECT ✓    | CORRECT ✓    | CORRECT ✓    |
| Diamond A→B→D(+)/A→C→D(-)    | BOTH-PATHS ✓ | BOTH-PATHS ✓ | BOTH-PATHS ✓ | BOTH-PATHS ✓ |
| Polarity chain A→B(−1)→C(+1) | CHAIN-OK ✓   | CHAIN-OK ✓   | CHAIN-OK ✓   | CHAIN-OK ✓   |

**Findings:**

- All existing scenarios produce identical results to the prior characterisation (DR--20260401) — new formula is backward-compatible for single-polarity and symmetric chains.
- Polarity chain scenario: B=4.00 (decreased from 5 via sign −1), C=4.00 (decreased from 5 via sign −1 × +1 = −1). Formula is semantically correct.
- MAX_HOPS=8 remains the recommendation (reinforcing loop requires 8 hops to saturate; lower values produce PARTIAL).
- Peak signal count: 1 across all chain scenarios; 2 in diamond (fan-out) — no signal explosion.

**Confidence raised to High.** The formula change is safe to implement. Existing tests covering single-hop and reinforcing/balancing patterns will need sign field added to Signal type; multi-hop polarity tests should be added before implementation per TDD rhythm.

## 🧾 Changelog

_See YAML frontmatter._
