---
id: DR--20260724--process--mutation-testing-scope
dateCreated: "2026-07-24"
version: 1.0.0
status: accepted
changeType: creation
domain: process
slug: mutation-testing-scope
changelog:
  - date: "2026-07-24"
    note: Initial creation
lastEdited: "2026-07-24"
---

# Mutation Testing Scope: Module Characteristic, Not Package Boundary

## 🧭 Context

CLAUDE.md's Mutation Testing section stated: "Per-feature, scoped to `packages/engine`. React
component mutations are noise — exclude `packages/app`." Taken literally, this scopes mutation
testing to one package and blanket-excludes another.

Actual practice already contradicts the literal wording: `stryker.config.mjs` mutates
`packages/app/src/url-encoding.ts` — a pure, side-effect-free encode/decode pipeline that happens
to live inside the nominally-excluded `packages/app` package.

The `canvas-pan-zoom-navigation` feature's DESIGN wave (Morgan/nw-solution-architect) placed new
pure viewport-transform functions (`screenToGraph`, `graphToScreen`, `clampZoom`, `zoomAtCursor`,
`computeFitViewport`) in `packages/renderer/src/geometry.ts` — a package the policy doesn't mention
in either direction. Apex (nw-platform-architect, DEVOPS wave) flagged this as an unresolved
scoping gap rather than silently deciding it.

## ⚖️ Options Considered

| Option | Description | Outcome | Rationale |
| --- | --- | --- | --- |
| A | Literal reading: mutation testing stays `packages/engine`-only; `geometry.ts` never mutated | Rejected | Contradicts existing precedent (`url-encoding.ts` already mutated); would leave the highest-risk new pure logic (viewport transform math, whose correctness gates hit-testing accuracy) unverified |
| B | Blanket-include all of `packages/renderer` | Rejected | Renderer also contains browser-coupled, non-pure code (`LoopyRenderer.ts`'s RAF loop, live `ctx` drawing) — mutating it is the same kind of noise the original policy excluded `packages/app`'s React components for |
| C | **(Chosen)** Scope by module characteristic — pure, side-effect-free logic files, wherever they live — not by package boundary | **Accepted** | Matches actual practice already in place; closes the ambiguity without inventing a new rule, just naming the rule already being followed |

## 🧠 Decision

Mutation testing targets pure, side-effect-free logic modules regardless of which package they
live in: always `packages/engine`; specific pure-logic files within `packages/renderer` or
`packages/app` when they carry algorithmic logic worth verifying (named examples:
`packages/app/src/url-encoding.ts`, `packages/renderer/src/geometry.ts`). React components,
imperative event-wiring, and browser-API-coupled classes (RAF loop, canvas context calls) are
excluded regardless of package, since mutating them produces noise rather than signal about test
quality.

Kill rate gate remains 80%, unchanged. Per-feature, on-demand invocation via `/nw-mutation-test`
remains unchanged — this decision only resolves *which files* a feature's mutation run should
target, not when or whether to run it.

## 🪶 Principles

- **Impeccability:** a testing policy that contradicts its own already-committed config
  (`stryker.config.mjs`) is a paper rule, not a real one — naming the actual practice restores
  policy-as-lived-truth.
- **Justice / Shift-left:** the highest-integration-risk code in `canvas-pan-zoom-navigation`
  (per its Shared Artifacts Registry) is exactly the coordinate-transform math this decision
  brings into mutation-testing scope — fragile/high-assumption areas get prioritized, not
  incidentally excluded by a package-boundary technicality.
- **Stewardship / Delete-ability:** no new tooling, no new config file structure — `stryker.config.mjs`'s
  per-feature `mutate` array is simply pointed at the relevant pure-logic file(s) when a feature's
  mutation run is invoked, exactly as it already is for `url-encoding.ts`.

## 🔁 Lifecycle

Effective immediately for any feature's `/nw-mutation-test` invocation. Applies retroactively in
spirit to the existing `url-encoding.ts` config (no config change needed — it already conforms).
`canvas-pan-zoom-navigation` is the first feature to apply this explicitly to `packages/renderer`.

## 🧩 Reasoning

The gap was discovered, not invented: DEVOPS-wave review of `canvas-pan-zoom-navigation` needed to
state a mutation-testing strategy for the feature's new logic, and the literal policy wording gave
a wrong answer (exclude `packages/renderer` entirely, or default to `packages/engine`-only, both of
which would skip verifying test quality on the feature's actual pure logic). Reading the existing
`stryker.config.mjs` resolved the ambiguity by revealing the policy already in practice.

## 🔄 Next Actions

- When `canvas-pan-zoom-navigation` reaches DELIVER and `packages/renderer/src/geometry.ts`'s new
  functions are implemented, point `stryker.config.mjs`'s `mutate` array at them for that feature's
  `/nw-mutation-test` run (same pattern as `url-encoding.ts`).
- No other project files require updates as a result of this decision.

## 🧠 Confidence

High. The decision names an already-operating practice rather than introducing a new one; the only
change is that CLAUDE.md's wording now matches `stryker.config.mjs`'s actual behaviour.

## 🧾 Changelog

_Summarise notable updates, revisions, or corrections. Each should have a date and note in YAML frontmatter for traceability._
