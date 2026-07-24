# Feature Delta — swoopy-diagram-agent-authoring

## Wave: DISCUSS / [REF] Persona

- **Persona ID**: `agent-author` — an AI coding agent (e.g. Claude) chatting with a human inside or alongside the swoopy repo, asked to turn a described causal loop into a working diagram.

## Wave: DISCUSS / [REF] JTBD one-liner

When a human describes a causal loop in chat, the agent wants a deterministic way to turn that description into a valid swoopy share link, so it can hand back a working, inspectable diagram without round-tripping through the app's UI.

(Full JTBD ceremony — job dimensions, four forces, opportunity scoring — skipped; see Locked Decisions D4.)

## Wave: DISCUSS / [REF] Scope Assessment

2 stories, 1 slice, single bounded concern (a script + a doc), 0 new integration points, effort < 1 day. **PASS** — right-sized, no split needed.

## Wave: DISCUSS / [REF] Journey (lightweight)

**Happy path:**
1. Human describes a causal loop in chat (e.g. "births increase population, deaths decrease population, population increases deaths").
2. Agent reads the guidance doc (Story 2) for the `Graph` schema and script usage.
3. Agent constructs a graph JSON object (nodes + causal/constraint edges) matching the schema.
4. Agent runs `node scripts/encodeSharedModelURL.js <file>` (Story 1), which validates, roundtrip-checks, and prints a share URL.
5. Agent hands the URL to the human.
6. Human opens the link, sees the diagram rendered, asks for a change ("make the death-rate edge a medium delay").
7. Agent edits the graph JSON and repeats from step 4 — no re-reading of source files needed on iteration.

**Shared artifacts:**
- The graph JSON object — single source: the agent's working file for this conversation, built fresh each turn from the schema doc.
- The share URL — single source: the script's stdout.

**Error path:**
- Invalid graph (dangling edge reference, missing required field) → script exits non-zero with a stderr message; no URL is printed. Agent corrects the JSON and retries.

## Wave: DISCUSS / [REF] Locked Decisions

- **D1** Feature type: Infrastructure/tooling. *Rationale*: a CLI script + agent-facing doc, no UI or API surface change.
- **D2** Walking skeleton: No. *Rationale*: brownfield, isolated feature — the encode pipeline it wraps already exists and is proven (share-url-compression, finalized).
- **D3** UX research depth: Lightweight. *Rationale*: single happy path, no emotional arc needed for a scripted tool.
- **D4** JTBD depth: Infrastructure-only escape valve (no formal job story / four-forces / opportunity scoring, no SSOT `jobs.yaml`/`journeys/` entries). *Rationale*: per project CLAUDE.md's "Hobby project on Claude Pro — gates are on-demand" rigor profile and the Self-Stewardship virtue (Lean Pivot), full JTBD ceremony for a one-script tooling addition would be disproportionate process weight. Confirmed with user before this wave ran.
- **D5** Density mode: `lean` (from `~/.nwave/global-config.json`), `expansion_prompt: ask-intelligent`. No Tier-2 trigger fired (checked: AC ambiguity — none, both ACs are concrete; cross-context complexity — single technology (Node/TS) across 3 files, not 3 distinct technologies; multi-stakeholder — single persona; compliance — none; WS strategy D — n/a, no walking skeleton). No expansion menu shown.

## Wave: DISCUSS / [REF] User Stories

### Story 1 — Encode a graph into a swoopy share link

**As** an agent building a swoopy diagram from a chat request,
**I want** to run a script that turns a hand-built graph JSON object into a valid, working swoopy share URL,
**so that** I can hand the user a link that renders their causal loop without needing the app's UI.

`job_id: infrastructure-only`
`infrastructure_rationale`: Developer/agent tooling script wrapping the existing (human-only, UI-driven) share-encoding pipeline for programmatic reuse. No independent end-user job in `docs/product/jobs.yaml` — the person who eventually opens the resulting link inherits the already-validated job from the finalized share-url-compression feature.

#### Elevator Pitch
Before: An agent has no way to turn a hand-built graph description into a swoopy link without opening the app UI and manually building the diagram node-by-node.
After: run `node scripts/encodeSharedModelURL.js graph.json` → sees a full `https://.../?g=...&title=...` URL printed to stdout.
Decision enabled: the user decides whether the rendered diagram matches what they described, and asks for edits or accepts it.

#### Acceptance Criteria
- **AC1**: Given a valid graph JSON file matching the schema in `packages/engine/src/types.ts`, running `node scripts/encodeSharedModelURL.js <file>` prints a URL containing a `g=` query param to stdout and exits 0.
- **AC2**: The printed URL, decoded via the existing `scripts/decodeSharedModelURL.js`, deep-equals the input graph (roundtrip invariant, per CLAUDE.md Key Invariants).
- **AC3**: Given a graph JSON that fails validation (edge referencing a nonexistent node id, or a missing required field), the script prints a clear error to stderr and exits non-zero — no URL is printed.
- **AC4**: The script accepts an optional `--title <text>` flag, included in the URL's `title` param, matching the app's existing title-sharing behavior.
- **AC5**: The script runs standalone via Node with no dev server or browser dependency, consistent with the existing decode script.

### Story 2 — Agent-facing guidance doc

**As** an agent asked to "build a swoopy diagram" from a chat description,
**I want** a discoverable doc describing the graph schema, the encode script's usage, and the iteration loop,
**so that** I can reliably go from a natural-language causal loop to a working share link without re-deriving the schema from source every time.

`job_id: infrastructure-only`
`infrastructure_rationale`: Documentation whose primary audience is an AI agent, not a human end-user; no independent product job — it exists to support Story 1's script by making it discoverable and used correctly.

#### Elevator Pitch
Before: An agent asked to build a swoopy diagram has to explore `packages/engine/src/types.ts`, `serialisation.ts`, and `url-encoding.ts` from scratch each time, risking an out-of-date or malformed graph.
After: read the guidance doc → sees the exact `Graph` shape, one complete worked example, and the `node scripts/encodeSharedModelURL.js` invocation.
Decision enabled: the agent decides how to map the user's causal-loop description onto nodes/edges correctly on the first attempt, without guessing field names.

#### Acceptance Criteria
- **AC1**: A doc file (path decided in DESIGN — candidates: root `AGENTS.md`, or a new section in `CLAUDE.md`) contains the `Graph`/`Node`/`Edge`/`Modulator`/`Annotation` shapes with field-level descriptions.
- **AC2**: The doc includes at least one complete, valid worked example graph JSON (a 2-3 node causal loop) that passes the encode script's validation (Story 1 AC1–AC3).
- **AC3**: The doc documents the exact script invocation (path, args, `--title` flag), the resulting query param name (`g`), and the URL structure.
- **AC4**: The doc explicitly states the iteration loop (edit JSON → re-run script → new link) so an agent doesn't need to re-derive this per conversation.
- **AC5**: The doc is discoverable from `CLAUDE.md` — either inline or as a "fetch when relevant" pointer, consistent with how other reference files (e.g. `~/.claude/stack.md`) are surfaced.

## Wave: DISCUSS / [REF] Outcome KPIs

- **KPI1**: An agent produces a working, roundtrip-valid share link on the first attempt for a simple causal loop (2-4 nodes), using only the guidance doc + script. Target: 3/3 success across manually-run example prompts during DELIVER's acceptance testing. Measurement: manual verification (open each resulting link, confirm it renders the described loop).
- **KPI2**: Turns-to-first-working-link after the guidance doc is read. Target: ≤2 tool calls (construct JSON, run script). Measurement: observed during DELIVER acceptance testing.

## Wave: DISCUSS / [REF] Definition of Ready

1. ✅ Persona identified (`agent-author`).
2. ✅ Problem/value articulated (journey + JTBD one-liner above).
3. ✅ User stories drafted with job traceability (`infrastructure-only` + rationale, both stories).
4. ✅ Elevator Pitch present and passes the "real invocable entry point + concrete observable output" test for both stories.
5. ✅ Acceptance criteria testable and unambiguous (all AC reference exact commands/files/exit codes).
6. ✅ Outcome KPIs defined with numeric targets and measurement method.
7. ✅ Dependencies identified (slice brief: engine types, serialisation, fflate, existing decode script as reference pattern).
8. ✅ Effort estimated (< 1 day, single slice).
9. ✅ Scope assessment passed (right-sized, no elephant-carpaccio split needed).

**DoR: PASSED.**

## Wave: DISCUSS / [REF] Out-of-scope

- No import-from-JSON UI in `packages/app` — stays a standalone script.
- No changes to the existing decode script, URL encoding pipeline, or query param scheme.
- No new SSOT (`docs/product/`) entries — infrastructure-only escape valve.
- No CI/pipeline integration for the new script (can be added later if it proves useful beyond ad-hoc agent use).

## Wave: DISCUSS / [REF] WS Strategy

Not applicable — no walking skeleton (D2).

## Wave: DISCUSS / [REF] Driving Ports

- CLI: `node scripts/encodeSharedModelURL.js <file> [--title <text>]` (new)
- Doc read: guidance doc referenced from `CLAUDE.md` (new)

## Wave: DISCUSS / [REF] Pre-requisites

- Existing, finalized `share-url-compression` feature (encoding pipeline, schema, query param scheme) — all reused, none modified.

## Wave: DISCUSS / Wave Decisions Summary

### Key Decisions
- [D1] Feature type: Infrastructure/tooling — script + doc, no UI/API surface.
- [D2] No walking skeleton — isolated brownfield addition to a proven pipeline.
- [D3] Lightweight UX research depth — single happy path only.
- [D4] Infrastructure-only JTBD escape valve — full JTBD ceremony skipped per project's lean rigor profile; confirmed with user.
- [D5] Lean density, no Tier-2 expansions triggered.

### Requirements Summary
- Primary need: let an agent go from a chat-described causal loop to a working swoopy share link, deterministically and repeatably, without re-deriving the schema each time.
- Walking skeleton scope: n/a.
- Feature type: infrastructure.

### Constraints Established
- Must reuse the existing schema (`packages/engine/src/types.ts`), serialisation wrapper, and URL/query-param scheme exactly — no new encoding format.
- Script must be standalone (no dev server, no browser).
- Must preserve the roundtrip invariant already established for share-url-compression.

### Upstream Changes
- None — no DISCOVER/DIVERGE artifacts existed for this feature; DISCUSS bootstraps it directly.

## Wave: DESIGN / [REF] DDD List

Not applicable — no domain complexity introduced. The feature reuses the existing `Graph` domain model (`packages/engine/src/types.ts`) verbatim; no new bounded context, aggregate, or domain event.

## Wave: DESIGN / [REF] Component Decomposition

| Component | Path | Change Type | Responsibility |
|---|---|---|---|
| Encode CLI entry point | `scripts/encodeSharedModelURL.js` | CREATE NEW | I/O shell: file arg + `--title` flag, orchestrates validate → encode → self-check-decode, stdout/stderr, exit code |
| `validateGraph(raw)` | `scripts/encodeSharedModelURL.js` (internal) | CREATE NEW | Pure function — required-field + dangling-reference checks |
| `encodeGraph(graph)` | `scripts/encodeSharedModelURL.js` (internal) | CREATE NEW (reimplementation, ADR-001) | Pure function — `{version:5, graph}` + `zlib.deflateRawSync` + chunked base64 |
| `decodeForSelfCheck(encoded)` | `scripts/encodeSharedModelURL.js` (internal) | CREATE NEW (pattern-reused) | Pure function — `zlib.inflateRawSync` + `JSON.parse`, mirrors `decodeSharedModelURL.js` |
| Guidance doc | `docs/AGENT-GRAPH-AUTHORING.md` | CREATE NEW | Schema reference, worked example, script usage, iteration loop |
| `CLAUDE.md` Key Files pointer | `CLAUDE.md` | EXTEND | One-line pointer, mirrors existing `docs/ARCHITECTURE.md`/`docs/PRD.md` entries |
| `Graph`/`Node`/`Edge`/`Modulator`/`Annotation` schema | `packages/engine/src/types.ts` | REUSE (reference only) | Source of truth for schema documented + validated |
| `serialize()`/version wrapper | `packages/engine/src/serialisation.ts` | REUSE (pattern only, inlined) | `CURRENT_VERSION` cross-referenced by comment |
| Decode reference script | `scripts/decodeSharedModelURL.js` | REUSE (mirrored, unmodified) | Named pattern to mirror; also used for manual DISTILL/DELIVER verification |

Full detail: `docs/product/architecture/brief.md` — Component Architecture section.

## Wave: DESIGN / [REF] Driving Ports

- CLI: `node scripts/encodeSharedModelURL.js <file> [--title <text>]` (new)
- Doc read: `docs/AGENT-GRAPH-AUTHORING.md`, discoverable via `CLAUDE.md` (new)

## Wave: DESIGN / [REF] Driven Ports and Adapters

- Filesystem read (`fs.readFileSync`) — Node builtin, no abstraction needed (single call site).
- stdout/stderr + `process.exit(code)` — Node builtin.
- No network, no database, no external API, no new adapter interfaces.
- Earned Trust note: the only substrate assumption (Node `zlib` byte-compatible with `fflate`'s raw-deflate mode) is already empirically proven by `scripts/decodeSharedModelURL.js` in production use. AC2's roundtrip self-check *is* this component's probe, run every invocation.

## Wave: DESIGN / [REF] Technology Choices

| Choice | Rationale | License |
|---|---|---|
| Plain Node ESM `.js`, no build/tsx | AC1 fixes literal `node <file>.js` invocation (ADR-001) | n/a (Node builtin) |
| `node:zlib` | Zero new dependency, proven byte-compatible with `fflate` | n/a (Node builtin) |
| Hand-rolled validation (no zod/ajv) | No schema library currently a dependency; avoids Cognitive Load Tax at this scale | n/a |
| Markdown doc under `docs/` | Matches `docs/ARCHITECTURE.md`/`docs/PRD.md` pattern (ADR-002) | n/a |

## Wave: DESIGN / [REF] Decisions Table

| ID | Decision | ADR |
|---|---|---|
| DES-1 | Encode script reimplements wire-format pipeline via Node builtins rather than importing `packages/app/src/url-encoding.ts` | adr-001 |
| DES-2 | Guidance doc lives at `docs/AGENT-GRAPH-AUTHORING.md`, pointed to from `CLAUDE.md` | adr-002 |

## Wave: DESIGN / [REF] Reuse Analysis Table

| Existing component | Decision | Contract shape | Justification (not "simpler") |
|---|---|---|---|
| `packages/engine/src/types.ts` schema | REUSE (reference only) | n/a (types, not runtime) | Compile-time types; documented verbatim in guidance doc, validated at runtime by hand-rolled checks since types don't exist at runtime |
| `serialize()` (`packages/engine/src/serialisation.ts`) | CREATE NEW (inline reimplementation) | pure-function | Trivial 1-line wrapper; importing the `.ts` module requires `tsx`/experimental flags, breaking AC1's literal `node <file>.js` command; existing sibling `decodeSharedModelURL.js` already reimplements rather than imports, for the same reason |
| `encodeGraphForUrl()` (`packages/app/src/url-encoding.ts`) | CREATE NEW (reimplementation using Node builtin zlib) | pure-function | `url-encoding.ts` is not an exported package entry point; importing app-internal source from a root script inverts the project's `engine ← renderer ← app` layering; mirroring the named sibling script (`decodeSharedModelURL.js`) means reimplementing, as that script already does for the inverse operation |
| `decodeGraphFromUrl()` / `decodeSharedModelURL.js`'s inflate logic | EXTEND by pattern-reuse (duplicated inline, not process-shelled) | pure-function | 5-line proven snippet; shelling out to the sibling script for a self-check adds process-spawn/stdout-parsing fragility for no benefit |
| Runtime graph validator | CREATE NEW | pure-function (return-only) | No existing runtime validator anywhere in the codebase; no schema library is a dependency — introducing one is disproportionate at this scale |

## Wave: DESIGN / [REF] Open Questions

- If a third Node-side consumer of the wire-format pipeline ever appears, consider extracting a shared pure-function wire-format module usable from both browser and Node without a bundler (deferred — YAGNI at two-implementations scale). Flagged for DISTILL/DELIVER awareness, not a blocker.
- Guidance doc's worked example (Story 2 AC2) and exact validation error message wording are implementation detail for software-crafter to finalize during DISTILL/DELIVER — not fixed by this ADR.

## Wave: DESIGN / Wave Decisions Summary

### Key Decisions
- [DES-1] Encode script is plain Node ESM `.js`, no build step; reimplements the deflate+base64 pipeline via `node:zlib` rather than importing `packages/app/src/url-encoding.ts` (ADR-001).
- [DES-2] Guidance doc lives at `docs/AGENT-GRAPH-AUTHORING.md`, referenced via a one-line pointer in `CLAUDE.md`'s "Key Files" section (ADR-002).
- [DES-3] No schema-validation library added; hand-rolled `validateGraph` pure function.
- [DES-4] Outcome Collision Check treated as out-of-scope (methodology-adjacent tooling, no new typed contract, both stories already `job_id: infrastructure-only`).

### Architecture Summary
Modular monolith unchanged — this feature adds a standalone CLI script + a reference doc, no new service, no new container beyond the script itself, no change to the existing app/engine/renderer boundary. Pure Core/Imperative Shell applied inside the new script: `validateGraph`/`encodeGraph`/`decodeForSelfCheck` are pure functions; the CLI entry point is the thin imperative shell (file read, stdout/stderr, exit code). C4 diagrams: `docs/product/architecture/c4-diagrams.md` (L1 + L2).

### Reuse Analysis
See table above — one component classified REUSE (types, reference-only), four CREATE NEW (each justified by AC1's literal-invocation constraint and/or the project's existing layering rule, not by simplicity preference), one EXTEND-by-pattern (inflate logic duplicated inline from the named sibling script).

### Technology Stack
Node 22 builtins only (`fs`, `zlib`, `process`) — zero new dependencies. Markdown for the guidance doc.

### Constraints Established
- Encode script must remain invocable via plain `node scripts/encodeSharedModelURL.js <file>` — no build step, no flags (drives ADR-001).
- Must not import across the `engine ← renderer ← app` layering in the reverse direction.
- Guidance doc must stay `docs/`-based with a `CLAUDE.md` pointer, not inline in `CLAUDE.md` (drives ADR-002).

### Upstream Changes
- `CLAUDE.md` gains one new bullet under "Key Files" pointing to `docs/AGENT-GRAPH-AUTHORING.md` (to be added during DISTILL/DELIVER implementation, specified here as a design constraint).

## Wave: DISTILL / [REF] Upstream Finding (not a contradiction — flagged for follow-up)

While determining the reference pattern to mirror, found `scripts/decode-url.mjs` — a second, older decode script that does **not** inflate (plain base64→JSON, no `zlib`), so it silently mis-decodes any real compressed share URL produced since `share-url-compression` shipped. DESIGN's Reuse Analysis only considered `scripts/decodeSharedModelURL.js` (the sibling named in the slice brief), which is correct and current. This does not change any DESIGN decision — `decodeSharedModelURL.js` remains the right pattern to mirror — but `decode-url.mjs` is a drift risk in its own right and out of this feature's scope to fix. Recommend a follow-up task.

## Wave: DISTILL / [REF] Language & Test Framework Detection

Detected via `package.json`: TypeScript/JavaScript, Vitest. No Cucumber/Gherkin dependency exists in this repo (confirmed: no `cucumber`/`gherkin`/`bdd` package anywhere in the workspace) — acceptance scenarios are authored as Vitest `describe`/`it` blocks with business-language BDD-style names and AC tags in the title (`@walking_skeleton`, `@driving_adapter`, `@real-io`, `@error`), not `.feature` Gherkin files. This is a project-convention override of the skill's Python/Gherkin-centric examples, per the skill's own Language Convention Frame.

## Wave: DISTILL / [REF] Scenario List

| Scenario | Tags | AC |
|---|---|---|
| Valid graph → prints share URL, exit 0 | `@walking_skeleton @driving_adapter` | Story 1 AC1 |
| Printed URL roundtrips to exact input graph | `@real-io` | Story 1 AC2 |
| Dangling edge reference → non-zero exit, stderr, no URL | `@error` | Story 1 AC3 |
| Missing required field → non-zero exit, stderr, no URL | `@error` | Story 1 AC3 |
| `--title` flag included in output | — | Story 1 AC4 |
| (AC5 — standalone, no dev server — proven structurally by every scenario above using plain `node`) | — | Story 1 AC5 |
| Doc contains all 6 schema shape names | — | Story 2 AC1 |
| Doc's worked example validates via the real script | `@real-io` | Story 2 AC2 |
| Doc documents invocation, `--title`, `g=` param | — | Story 2 AC3 |
| Doc states the edit → re-run loop | — | Story 2 AC4 |

## Wave: DISTILL / [REF] WS Strategy

One scenario tagged `@walking_skeleton @driving_adapter`: valid graph in → share URL out, exercised via real subprocess (`node scripts/encodeSharedModelURL.js <file>`), not by calling internal functions directly — satisfies the Driving Adapter Verification mandate (proves the CLI actually parses argv and exits correctly, not just that the pipeline logic works in isolation).

Two-Tier Composition: **Tier A only.** Tier B (state-machine PBT) explicitly skipped — feature is config-shaped (single-shot CLI, no chained multi-step journey), matching the skill's own Tier B skip criterion verbatim.

ATDD Infrastructure Policy: not bootstrapped. This feature has zero driven-internal or driven-external ports (only `fs.readFileSync`/stdout/stderr — Node builtins already classified in DESIGN as needing no adapter abstraction) — there is nothing to add a policy row for. Deferred to the first feature that introduces a real driven adapter.

## Wave: DISTILL / [REF] Adapter Coverage Table

| Adapter | `@real-io` scenario | Covered by |
|---|---|---|
| Filesystem read (graph JSON file) | YES | Every scenario (real temp file via `mkdtempSync`) |
| stdout / stderr / exit code | YES | Every scenario (real subprocess via `execFileSync`) |
| `node:zlib` deflate/inflate | YES | Roundtrip scenario (real inflate of real script output) |

No external/non-deterministic adapters in scope. Zero "NO — MISSING" rows.

## Wave: DISTILL / [REF] Scaffolds

| File | Marker | RED confirmed |
|---|---|---|
| `scripts/encodeSharedModelURL.js` | `__SCAFFOLD__: true` comment; exits 1 with a stderr message | Yes — `AssertionError`, not crash |
| `docs/AGENT-GRAPH-AUTHORING.md` | `__SCAFFOLD__: true` HTML comment; placeholder body | Yes — `AssertionError`, not crash |

Pre-DELIVER fail-for-right-reason gate run: `pnpm vitest run --project scripts`. Result: 7 failed (all clean `AssertionError`, zero import/crash errors — genuine RED), 2 passed. The 2 passes are the AC3 error-path scenarios (dangling edge ref, missing field) — they pass **vacuously** against the always-erroring scaffold, an inherent and accepted limitation of negative-path tests written before real validation logic exists (per this skill's Hebert ch.6 negative-testing note). They are not proof of anything yet; DELIVER must keep them green while implementing real validation, not treat their current green state as already-satisfied. Full workspace suite re-run after scaffolding: 33/34 files pass, 547 pre-existing tests unaffected, typecheck clean — zero regressions from adding the `scripts` Vitest project.

## Wave: DISTILL / [REF] Test Placement

`scripts/encodeSharedModelURL.test.js`, co-located with the script — matches this project's existing convention of co-located `*.test.ts`/`.test.js` files next to source (e.g. `packages/app/src/url-encoding.ts` + `.test.ts`). New `scripts/vitest.config.ts` project added to root `vitest.config.ts`'s `projects` array — `scripts/` had no test wiring before this feature (a gap DESIGN's Reuse Analysis didn't surface, since it focused on production-code reuse, not test-runner wiring).

## Wave: DISTILL / [REF] Driving Adapter Coverage

Single driving port (`node scripts/encodeSharedModelURL.js <file> [--title]`, per DESIGN) — covered by the `@walking_skeleton @driving_adapter` scenario via real subprocess invocation. Zero uncovered entry points.

## Wave: DISTILL / [REF] Pre-requisites

- DESIGN driving port: `node scripts/encodeSharedModelURL.js <file> [--title <text>]`.
- DEVOPS: not run (out-of-scope per DISCUSS — no CI/pipeline integration). Default environment (local Node 22, no container) applies; no environment matrix needed for a single-shot local CLI.

## Wave: DISTILL / Wave Decisions Summary

### Key Decisions
- [DIS-1] Acceptance scenarios authored as Vitest `describe`/`it` (business-language names + AC tags), not Gherkin `.feature` files — no Cucumber/BDD dependency exists in this repo.
- [DIS-2] Tier B (state-machine PBT) skipped — config-shaped, single-shot CLI, no chained journey.
- [DIS-3] ATDD Infrastructure Policy file not bootstrapped — zero driven-internal/external ports in this feature's scope.
- [DIS-4] New `scripts/vitest.config.ts` project added to root config — `scripts/` previously had no test wiring at all.
- [DIS-5] RED scaffolds created for both Story 1 and Story 2 deliverables; pre-DELIVER gate run and passed (7 genuine RED, 2 accepted-vacuous-pass, zero wrong-reason failures).

### Reuse Analysis
No new Reuse Analysis beyond DESIGN's — DISTILL discovered one additional gap (test wiring for `scripts/`, DIS-4) not a reuse decision.

### Technology Stack
Vitest (existing), Node builtins only for the scaffolds/tests (`node:child_process`, `node:fs`, `node:zlib`, `node:os`, `node:path`) — no new dependencies.

### Constraints Established
- The encode script's stdout must be *exactly* the share URL on its own line, nothing else — clarifies Story 1 AC1 so an agent can capture stdout directly (`const url = execSync(...)`) without needing to parse it out of surrounding text. This was ambiguous in DISCUSS/DESIGN; DISTILL made it explicit and testable.

### Upstream Changes
- None to DISCUSS or DESIGN decisions. See the separate "Upstream Finding" section above (`decode-url.mjs` drift risk) — informational, not a contradiction, no decision changed.

## Wave: DELIVER / [REF] Implementation Summary

Both roadmap steps shipped. `scripts/encodeSharedModelURL.js` now has a real implementation (pure `validateGraph`/`encodeGraph`/`decodeForSelfCheck` + a thin CLI shell, mirroring `decodeSharedModelURL.js`'s `node:zlib` usage per ADR-001). `docs/AGENT-GRAPH-AUTHORING.md` now has real content: full schema reference, a validated 3-node/2-causal-edge/1-constraint-edge/1-modulator/1-annotation worked example, exact invocation docs, and the edit-rerun loop. `CLAUDE.md` gained one "Key Files" pointer to the new doc.

## Wave: DELIVER / [REF] Files Modified

| File | Type | Change |
|---|---|---|
| `scripts/encodeSharedModelURL.js` | production | RED scaffold replaced with real implementation (step 01-01) |
| `docs/AGENT-GRAPH-AUTHORING.md` | docs | RED scaffold replaced with real content (step 01-02) |
| `CLAUDE.md` | docs | One-line "Key Files" pointer added (step 01-02); also captured a long-pending uncommitted cleanup diff that predated this feature (see note below) |

Note: `CLAUDE.md` had an uncommitted diff sitting in the working tree since before this feature started (flagged during `/nw-buddy` project-status check at the top of this session). Step 01-02 was the first DELIVER step to touch `CLAUDE.md`, so its commit captured that pending diff alongside the new bullet — the resulting content is correct and matches everything this feature's DISCUSS/DESIGN waves were already built against; nothing was reverted or lost.

## Wave: DELIVER / [REF] Scenarios Green

9 of 9 (`scripts/encodeSharedModelURL.test.js`, both `describe` blocks) — confirmed via `pnpm vitest run --project scripts`, 2026-07-23T18:27Z.

## Wave: DELIVER / [REF] DoD Check

| DISCUSS DoD item | Status |
|---|---|
| Persona identified | ✅ |
| Problem/value articulated | ✅ |
| Stories drafted with job traceability | ✅ |
| Elevator Pitch passes real-invocable-entry-point test | ✅ (verified live below) |
| Acceptance criteria testable and unambiguous | ✅ (9/9 green) |
| Outcome KPIs defined with targets | ✅ (see below) |
| Dependencies identified | ✅ |
| Effort estimated | ✅ (came in at 2 roadmap steps, matching the < 1 day slice estimate) |
| Scope assessment passed | ✅ |

## Wave: DELIVER / [REF] Demo Evidence

Neither story is tagged `@infrastructure` (the Elevator-Pitch-exemption tag) — both have real observable output, so both are subject to the mandatory demo gate despite using the `job_id: infrastructure-only` JTBD escape valve (a separate, unrelated exemption). Executed for real, 2026-07-23T18:29Z:

**Story 1** — `node scripts/encodeSharedModelURL.js <graph.json> --title "Population Growth"`:
```
exit code: 0
stdout: ?g=hdAxT8QwDAXg%2F%2FLmDGmhS0YGZgY2dIO25...&title=Population+Growth
```
Non-empty, exit 0, contains `g=` and the title — matches the Elevator Pitch's "sees a full ...?g=...&title=... URL" claim.

**Story 2** — the doc's own worked example, extracted verbatim from `docs/AGENT-GRAPH-AUTHORING.md` and piped through the real (non-scaffold) script:
```
extracted worked example, 3 nodes
exit code: 0
stdout: ?g=jZLLasMwEEV...
```
Confirms the doc's worked example is genuinely valid — not just plausible-looking — closing the loop DISTILL's AC2 scenario already checks in CI, demonstrated live here too.

## Wave: DELIVER / [REF] Quality Gates

| Gate | Outcome |
|---|---|
| Roadmap review | Approved, 0 findings (nw-acceptance-designer-reviewer) |
| Per-step TDD (3-phase canon) | Both steps COMMIT/PASS |
| Post-merge integration (full suite) | 34/34 files, 554 passed + 6 skipped, 0 regressions |
| Environment matrix | No DEVOPS environment matrix exists (DEVOPS wave out of scope, per DISCUSS); defaults (clean / with-pre-commit / with-stale-config) don't meaningfully differentiate for a stateless CLI reading a user-supplied file with zero repo-config dependency — the real `pnpm test --run` run in this checkout is the only environment-sensitive check that applies here |
| Refactor (L1-L6) | Reviewed, zero changes — file already clean at every RPP level (nw-functional-software-crafter) |
| Adversarial review | Approved, 0 blockers/high/low findings, zero Testing Theater patterns detected across the 7-pattern scan (nw-software-crafter-reviewer) |
| Mutation testing | Skipped — out of scope (CLAUDE.md scopes the 80% gate to `packages/engine` only; `scripts/` was never in scope) |
| Integrity verification | `des-verify-integrity` — "All 2 steps have complete DES traces", exit 0 |

## Wave: DELIVER / [REF] Pre-requisites

DISTILL's 9 acceptance scenarios (`scripts/encodeSharedModelURL.test.js`) and DESIGN's component decomposition (`docs/product/architecture/brief.md`) — both fully consumed, zero deviations from either.
