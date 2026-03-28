---
id: DR--20260328--engine--weight-range-expansion
dateCreated: '2026-03-28'
version: 1.0.0
status: accepted
changeType: creation
domain: engine
slug: weight-range-expansion
changelog:
  - date: '2026-03-28'
    note: Initial creation — accepted immediately, emerged from first use session
---
# DR--20260328--engine--weight-range-expansion

## 🧭 Context

The original GE-13 specified edge weight as `range: 0–1, default 1.0`. The intent was to allow
weakening of a relationship (0 = no effect, 1 = full effect).

During the first real use session, a practical problem emerged: the natural language of systems
thinking is relative — "this edge is twice as strong as the others." With a 0–1 range, expressing
that means editing *all other edges* down to 0.5, which is laborious and semantically backwards.
The user should be able to strengthen one edge, not weaken everything else.

## ⚖️ Options Considered

| Option | Description | Outcome | Rationale |
|--------|-------------|---------|-----------|
| A | Keep range 0–1 | Rejected | Forces users to weaken everything else to express relative amplification; counterintuitive |
| B | Expand to 0–2 | Rejected | Doubles the range but still limits "3×" expressions that are common in practice |
| C | Expand to 0–5 | Accepted | Supports "2× or 3× the others" naturally; 5 is a sensible ceiling for a teaching tool where extreme values are counterproductive |
| D | Uncapped / arbitrary positive | Rejected | No upper bound makes the slider/input UX poor and invites runaway signal strength |

## 🧠 Decision

Expand edge weight range from **0–1** to **0–5**. Default remains 1.0.

The engine formula `strength × edge.weight × edge.polarity` is unchanged — the range expansion
is purely a domain constraint change. Existing serialised graphs (all weights ≤ 1) remain valid.

## 🪶 Principles

- **Stewardship:** Backward-compatible — no migration needed; existing graphs unaffected.
- **Justice (Shift-Left):** The constraint emerged from real use, not speculation. Addressing it
  now prevents compounding UX debt across future stories that depend on weight.

## 🔁 Lifecycle

Status: Accepted. Effective immediately for all new implementation work.

## 🧩 Reasoning

A weight ceiling of 5 aligns with how facilitators talk about causal relationships in practice:
"this feedback loop dominates the others" maps naturally to weight 3–4. Beyond 5, a relationship
would typically be modelled by restructuring the graph (adding intermediate nodes) rather than
cranking a single weight. The ceiling is a teaching guardrail, not a technical limit.

The engine formula is linear (`strength × weight`), so weight = 2 doubles the signal, weight = 3
triples it. This is predictable and explainable to non-technical users.

## 🔄 Next Actions

1. Update `CausalEdge.weight` type comment in `packages/engine/src/types.ts` (0–1 → 0–5)
2. Update `EdgeWeightPopover` range/step/clamp (max: 1 → 5, step: 0.01 → 0.1)
3. Update renderer: map weight to `lineWidth` (e.g. `1 + weight * 1.5` → 1.5px at 0, 8.5px at 5)
4. Update GE-13 in PRD — done in this branch
5. Audit tests that assume `weight ≤ 1` (likely none — engine formula is weight-agnostic)

## 🧠 Confidence

High. The change is backward-compatible, the ceiling is arbitrary but well-reasoned, and the
UX benefit is immediate and clear. Could revisit ceiling value if 5 proves insufficient in
facilitation practice.

## 🧾 Changelog

_Summarise notable updates, revisions, or corrections. Each should have a date and note in YAML frontmatter for traceability._
