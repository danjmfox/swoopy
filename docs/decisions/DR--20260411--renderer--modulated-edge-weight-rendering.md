---
id: DR--20260411--renderer--modulated-edge-weight-rendering
dateCreated: "2026-04-11"
version: 1.0.0
status: proposed
changeType: creation
domain: renderer
slug: modulated-edge-weight-rendering
changelog:
  - date: "2026-04-11"
    note: Initial creation
  - date: "2026-04-11"
    note: Marked as draft
  - date: "2026-04-11"
    note: Marked as proposed
lastEdited: "2026-04-11"
---

# Modulated Edge Weight Rendering

## 🧭 Context

A `Modulator` connects a source node to a target causal edge and scales that edge's effective
weight at runtime. Under throttle semantics (DR--20260405--engine--modulator-effective-weight-formula,
pending revision), an edge's effective weight ranges from 0 (fully suppressed) to its base weight
(full strength) — never amplified beyond the configured value.

The renderer (`LoopyRenderer`) currently draws all causal edges using only `edge.weight` (the static
base weight). A learner watching the simulation has no visual signal that a relationship is being
throttled. They may observe fewer/weaker signals on a modulated edge, but cannot read the throttle
depth or confirm the relationship still exists at full potential.

The base weight and effective weight must both be readable simultaneously: _how strong could this
relationship be_ and _how strong is it right now_.

## ⚖️ Options Considered

| Option | Description               | Outcome  | Rationale                                                                                 |
| ------ | ------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| A      | Ghost outline + fill      | Accepted | Shows both potential and current state; unmodulated edges visually unchanged              |
| B      | Opacity only              | Rejected | Throttled edge fades but base weight is unreadable; full vs partial suppression ambiguous |
| C      | Thickness only (no ghost) | Rejected | No reference point — a thin edge looks like a low-weight edge, not a throttled one        |
| D      | No render change          | Rejected | Modulation invisible to learner; defeats the teaching purpose of the feature              |

## 🧠 Decision

**Option A — ghost outline behind fill.**

For any causal edge with at least one modulator attached:

1. Draw the edge at `edge.weight` geometry using a dimmed stroke (50% opacity of the edge's normal
   colour). This is the ghost — it represents the relationship's full potential.
2. Draw the edge at `effectiveWeight` geometry using the normal stroke, on top. This is the fill —
   it represents current runtime state.

When `effectiveWeight === edge.weight` (no throttling): the fill perfectly occludes the ghost.
The edge looks identical to an unmodulated edge. No visual change for the learner unless modulation
is actually acting.

When `effectiveWeight < edge.weight`: the ghost bleeds around the thinner fill, making the throttle
depth legible. The 50% opacity ensures the partial state reads as _reduced_, not _full_.

Unmodulated edges: single draw pass, unchanged.

## 🪶 Principles

- **Stewardship:** Unmodulated edges are visually identical before and after this change. No
  regression in the existing visual language. Two-pass rendering is additive, not destructive.
- **Justice (shift-left):** A learner who cannot see modulation in action may draw incorrect causal
  conclusions from the simulation. Making the effect visible is a correctness concern, not cosmetic.
- **Self-Stewardship:** No new UI elements, legends, or controls. The ghost emerges from the same
  draw call with a z-order and opacity change only.

## 🔁 Lifecycle

Proposed. Pending implementation alongside the throttle formula revision to
DR--20260405--engine--modulator-effective-weight-formula.

## 🧩 Reasoning

The ghost-behind-fill approach encodes a meaningful distinction: the outline is the _structural claim_
(this relationship exists at this strength), the fill is the _current activation_ (this is how much
is operating now). This maps directly to the systems thinking concept of latent vs active
relationships — a learner can see that a fully suppressed edge still exists in the model.

Opacity of 50% for the ghost is provisional. On light canvases it reads as shadow; on dark canvases
it may need adjustment. This is a tuning concern, not a structural one.

The ghost is drawn only for edges with a modulator. This keeps the canvas clean and makes modulated
edges visually distinctive — learners can immediately identify which relationships have a gating
condition.

### Rendering implementation

`LoopyRenderer` has access to `graph` (with modulators) and `sim.nodeValues` at draw time.
`computeEffectiveWeights(graph, sim.nodeValues)` can be called once per frame at the top of
`drawCausalEdges`, with the result passed to `drawCurvedArrow` alongside the base weight.
No store changes required.

```
drawCausalEdges(edges, sim, graph, ...)
  effectiveWeights = computeEffectiveWeights(graph, sim.nodeValues)  // O(edges + modulators)
  for each edge:
    if edge has modulator:
      drawCurvedArrow(edge, baseWeight=edge.weight, opacity=0.5)   // ghost pass
      drawCurvedArrow(edge, baseWeight=effectiveWeight, opacity=1)  // fill pass
    else:
      drawCurvedArrow(edge, baseWeight=edge.weight, opacity=1)      // unchanged
```

## 🔄 Next Actions

- Revise DR--20260405--engine--modulator-effective-weight-formula to reflect throttle semantics
  (factor range 0→1, not 0→2).
- Export `computeEffectiveWeights` from `packages/engine/src/index.ts` if not already (needed by
  renderer import).
- Implement two-pass rendering in `LoopyRenderer.drawCausalEdges`.
- Write renderer tests for: ghost-only at full suppression, ghost+fill at partial throttle,
  single pass for unmodulated edges.

## 🧠 Confidence

Medium-high. The ghost/fill approach is conceptually sound and the implementation path is clear.
The 50% ghost opacity is an initial estimate — visual tuning expected after first render. Dark mode
compatibility is a known open question.

## 🧾 Changelog

_Summarise notable updates, revisions, or corrections. Each should have a date and note in YAML frontmatter for traceability._
