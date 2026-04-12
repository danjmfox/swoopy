---
id: DR--20260412--app--node-role-indicators
dateCreated: "2026-04-12"
version: 1.0.0
status: new
changeType: creation
domain: app
slug: node-role-indicators
changelog:
  - date: "2026-04-12"
    note: Initial creation — emerged from use; DMs injecting outcome nodes directly breaks model pedagogy
---

# DR--20260412--app--node-role-indicators

## 🧭 Context

When using Swoopy to teach systems thinking, model authors design scenarios where certain nodes (e.g. "Feature Velocity") are emergent outcomes — they should only change via their causes, not by direct injection. Other nodes (e.g. "Cash Supply") are deliberate levers — things a player can directly act on.

Currently all nodes are equal in Simulate mode. A Delivery Manager can click "Feature Velocity" and inject a positive signal directly, bypassing the causal chain the model was built to demonstrate. This breaks the learning experience without any indication that it was the wrong move.

The problem is a category error, not malice. The fix should explain, not prevent.

## ⚖️ Options Considered

| Option | Description                                                                | Outcome  | Rationale                                                                            |
| ------ | -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| A      | Block injection on outcome nodes                                           | Rejected | Coercive; violates "thinking tool, not answer machine" philosophy                    |
| B      | Add `isLever: boolean` flag only                                           | Rejected | Doesn't name the opposite concept; DMs still don't know outcome nodes are off-limits |
| C      | Add `role: 'lever' \| 'outcome'` optional field; warn on outcome injection | Accepted | Names both concepts; warns without blocking; author-controlled                       |

## 🧠 Decision

Add an optional `role` field to the node schema:

```ts
type NodeRole = "lever" | "outcome";
// unset = author has no opinion
```

**Lever nodes** (`role: 'lever'`): display a visual indicator (distinct ring treatment or icon). Signal to the player: "you can act here directly."

**Outcome nodes** (`role: 'outcome'`): in Simulate mode, clicking shows a non-blocking warning — _"[Label] is a system outcome. To change it, act on its causes."_ — before allowing the injection to proceed. No visual indicator at rest.

The warning is advisory. The injection still happens if the player proceeds.

## 🪶 Principles

- **Stewardship:** author intent is preserved without hero patterns; `role` is a simple optional field with no engine coupling
- **Justice:** the category error (injecting an outcome) is surfaced at the point it occurs, not buried in documentation
- **Impeccability:** schema change is additive and backwards-compatible; unset `role` = current behaviour

## 🔁 Lifecycle

New → Proposed → Accepted on implementation.

## 🧩 Reasoning

`isLever` was considered but rejected because it only annotates one side. Without naming the `outcome` concept, model authors have no way to flag nodes that should not be directly injected. The two-value enum names both cases and leaves unset as a valid neutral state.

The warning-not-block choice is consistent with the existing philosophy: the tool explains, it doesn't coerce. A player who injects an outcome node directly is still learning something — they just need the nudge to look upstream.

The visual lever indicator serves a different purpose: it helps players find entry points quickly without guessing, especially in larger models.

## 🔄 Next Actions

1. Add `role?: NodeRole` to `GraphNode` schema in `packages/engine/src/types.ts`
2. Persist `role` in node config popover (alongside existing flags)
3. Render lever indicator on canvas nodes where `role === 'lever'`
4. Emit outcome warning in Simulate mode on first click of an `outcome` node

## 🧠 Confidence

High. Schema is minimal, engine is untouched, UX is advisory. Low risk of unintended consequences.

## 🧾 Changelog

_Summarise notable updates, revisions, or corrections. Each should have a date and note in YAML frontmatter for traceability._
