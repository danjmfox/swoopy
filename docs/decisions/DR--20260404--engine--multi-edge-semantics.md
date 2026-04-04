---
id: DR--20260404--engine--multi-edge-semantics
dateCreated: "2026-04-04"
version: 1.0.0
status: accepted
changeType: creation
domain: engine
slug: multi-edge-semantics
changelog:
  - date: "2026-04-04"
    note: >-
      Initial creation — GE-42 pre-condition. Proposed, awaiting agreement
      before implementation.
  - date: "2026-04-04"
    note: Marked as accepted
lastEdited: "2026-04-04"
dateAccepted: "2026-04-04"
---

# DR--20260404--engine--multi-edge-semantics

## 🧭 Context

GE-41 added `isQuickFix?: boolean` to `CausalEdge`. GE-42 extends this: a node pair
(A→B) should be able to hold **two** causal edges simultaneously — one QF (short delay,
typically positive) and one normal (long delay, typically balancing). This enables the
"sharp rise, slow fall" archetype: the quick fix produces fast positive change; the
normal edge captures the slow, often negative, unintended consequence.

The current duplicate guard in `store.ts:319` silently drops any causal edge where
`(from, to)` already exists. That invariant must be precisely revised before implementation.

Four questions must be resolved before any code changes:

1. **Double-propagation** — does A→B_qf + A→B_normal = 2× effect on B?
2. **Edge identity** — what uniquely identifies a causal edge?
3. **Toggle-creates-duplicate** — how is the degenerate state (two normal or two QF edges per pair) prevented?
4. **UI** — how does a modeller draw the second edge when the first already exists?

## ⚖️ Options Considered

### Q1 — Double-propagation

| Option | Description                                               | Outcome      |
| ------ | --------------------------------------------------------- | ------------ |
| A      | Two edges = 2× effect (additive, independent propagation) | **Accepted** |
| B      | Two edges share a propagation slot (mutually exclusive)   | Rejected     |

**Rationale for A:** In the relay model, signals are bound to a specific `edgeId`. A relay
from A fans out across all outgoing causal edges. If A→B_qf and A→B_normal both exist, B
receives two independent signals — one fast, one slow. This is semantically correct for
the archetype: the QF edge captures a distinct causal mechanism from the normal edge.
"Double effect" is intentional. The modeller controls relative strength via weight.

Option B would require merging or gating logic in the engine with no semantic gain; the
relay model already handles the multi-edge case correctly with no changes needed.

---

### Q2 — Edge identity

| Option | Description                                                                | Outcome            |
| ------ | -------------------------------------------------------------------------- | ------------------ |
| A      | Identity = `(from, to)` — one causal edge per pair (current)               | Rejected for GE-42 |
| B      | Identity = `(from, to, isQuickFix)` — at most one QF + one normal per pair | **Accepted**       |
| C      | Identity = `id` only — unlimited edges per pair                            | Rejected           |

**Rationale for B:** The archetype requires exactly the QF+normal pair. Unlimited edges (C)
create an unbounded state space with no modelling benefit. The new uniqueness key is
`(from, to, isQuickFix)`, permitting at most two causal edges between any pair.

The duplicate guard in `store.ts:addEdge` must update to:

```ts
graph.edges.some(
  (e) =>
    e.kind === "causal" &&
    e.from === from &&
    e.to === to &&
    e.isQuickFix === isQuickFix,
);
```

---

### Q3 — Toggle-creates-duplicate prevention

**Scenario:** E1 (QF=false) and E2 (QF=true) exist on pair A→B. User toggles QF off on E2.
Without a guard, E2 becomes QF=false, duplicating E1.

| Option | Description                                            | Outcome                               |
| ------ | ------------------------------------------------------ | ------------------------------------- |
| A      | Allow toggle; silently delete the conflicting edge     | Rejected — destructive and surprising |
| B      | Block toggle when target state conflicts (no-op)       | **Accepted**                          |
| C      | Disable toggle control in popover when conflict exists | Deferred to GE-43                     |

**Invariant:** `toggleEdgeQuickFix` must check whether a causal edge `(from, to, isQuickFix=target)`
already exists. If one does, the action is a no-op. The UI toggle remains enabled but produces
no change. Disabling the control when a conflict exists is a UX improvement for GE-43.

---

### Q4 — UI: drawing the second edge

**Current behaviour:** Canvas `addEdge` call is a no-op when `(from, to)` already exists.

| Option | Description                                                  | Outcome              |
| ------ | ------------------------------------------------------------ | -------------------- |
| A      | Second drag auto-creates the QF variant; third drag is no-op | **Accepted**         |
| B      | Second drag is ignored (current behaviour)                   | Rejected — invisible |
| C      | Context menu for edge type selection                         | Deferred to GE-43    |

**Rationale for A:** Most discoverable low-friction path. The store `addEdge(from, to)` action
resolves which variant to create:

- No causal edge exists → create normal (`isQuickFix=false`)
- Normal exists, QF does not → create QF (`isQuickFix=true`)
- QF exists, normal does not → create normal (`isQuickFix=false`)
- Both exist → no-op

The existing `addEdge(from, to)` API is unchanged. No callers need updating.

## 🧠 Decision

**Accepted invariants:**

1. **Double-propagation is correct.** Two edges = two independent relay signals = additive effect.
   Engine unchanged — relay propagation already fans out over all edges.
2. **Edge identity = `(from, to, isQuickFix)`.** At most one QF + one normal causal edge per pair.
3. **Toggle guard:** `toggleEdgeQuickFix` is a no-op when the target state conflicts with an
   existing edge. No destructive resolution.
4. **`addEdge` auto-selects variant:** resolves normal vs QF based on what already exists.
   No API change to callers.

## 🪶 Principles

- **Stewardship (deletability):** Engine unchanged. The auto-resolve logic in `addEdge` is
  three conditions, not a new abstraction.
- **Justice (shift-left):** The toggle guard (Q3) is the fragile invariant — it prevents the
  only route to a degenerate duplicate state. It ships before the UI affordance.
- **Impeccability:** Each invariant maps to a distinct failing test in the TDD rhythm.

## 🔁 Lifecycle

Status: Proposed — awaiting agreement before any implementation proceeds.

## 🧩 Reasoning

The core insight: `isQuickFix` is not a property of the pair relationship — it is a property
of a specific causal mechanism. A→B can legitimately carry two mechanisms simultaneously:
"quick fix effect" (fast, positive) and "unintended consequence" (slow, balancing). Treating
them as distinct edges with distinct identities is correct and is already supported by the
relay model's per-edge signal routing.

The maximum-of-two constraint (option B for Q2) is a domain constraint, not a technical one.
Causal loop diagrams rarely if ever carry three or more independent causal relationships
between the same pair; enforcing the limit prevents user error.

## 🔄 Next Actions (post-agreement)

1. Advance DR to `accepted`
2. Update `.claude/task_plan.md` with GE-42 task list
3. Red: `addEdge` — second call on existing normal pair creates QF; third is no-op
4. Green: update duplicate guard + variant resolution in `store.ts:addEdge`
5. Red: `toggleEdgeQuickFix` — no-op when conflict exists
6. Green: add conflict check to `toggleEdgeQuickFix`
7. Red: engine integration — relay from A with QF+normal pair produces two independent signals at B
8. Green: confirm engine no-op (relay already handles this)
9. Renderer: two edges between same pair render as offset parallel arcs (not overlapping lines)

## 🧠 Confidence

Medium-high. Engine semantics (Q1) and identity model (Q2) are clear and grounded in the
existing relay model. The auto-resolve UX (Q4) is pragmatic but the "second drag creates QF"
affordance is non-obvious to users — a canvas hint or tooltip is appropriate for GE-43.
Toggle guard (Q3) is deliberately conservative.

## 🧾 Changelog

_See YAML frontmatter._
