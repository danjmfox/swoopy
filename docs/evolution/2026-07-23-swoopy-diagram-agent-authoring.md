# Evolution: swoopy-diagram-agent-authoring

**Date**: 2026-07-23
**Feature ID**: swoopy-diagram-agent-authoring
**Goal**: Give an AI coding agent a deterministic, scriptable way to turn a chat-described causal loop into a working swoopy share link, without going through the app UI.

## Summary

An agent chatting with a human (persona `agent-author`) can now build a graph JSON object by hand,
run `node scripts/encodeSharedModelURL.js <file> [--title <text>]`, and get a full
`?g=...&title=...` share URL on stdout — deterministic, roundtrip-safe, no dev server. A companion
guidance doc (`docs/AGENT-GRAPH-AUTHORING.md`) documents the `Graph`/`Node`/`Edge`/`Modulator`/`Annotation`
schema, one worked example, exact invocation, and the edit → re-run iteration loop, so the agent
never needs to re-derive the schema from source each conversation. Infrastructure/tooling feature
— no UI, no API, no new SSOT entries — built entirely on top of the already-finalized
`share-url-compression` encoding pipeline.

## Business Context

Before this feature, an agent asked to "build a swoopy diagram" from a description had no path to a
working link except manually driving the app's UI node-by-node, or reading `url-encoding.ts`/`types.ts`
from scratch each time and guessing at internal, non-exported functions. This slows the core
loop (describe → get link → iterate) and risks malformed graphs. The new script + doc close that
gap for the `agent-author` persona while reusing the existing, proven encode/decode pipeline and
query-param scheme verbatim — zero changes to end-user-facing behaviour.

## Steps Completed

| Step | Name | Outcome |
|------|------|---------|
| 01-01 | Implement encode script pure functions and CLI shell | PASS (commit `fb7ef064d7f5f0f6bc0ad73903f6372e797c0755`) |
| 01-02 | Write agent-facing graph authoring guidance doc | PASS (commit `a194d1869cbad5636e7c7b8ea29c655efe0efcab`) |

## Key Decisions

### DISCUSS
- **D1**: Feature type infrastructure/tooling — CLI script + agent-facing doc, no UI/API surface.
- **D2**: No walking skeleton — brownfield addition wrapping the already-proven `share-url-compression` pipeline.
- **D3**: Lightweight UX research depth — single happy path, no emotional arc needed.
- **D4**: Infrastructure-only JTBD escape valve — full job-story/four-forces/opportunity-scoring ceremony skipped per the project's lean, on-demand rigor profile (confirmed with user).
- **D5**: Lean density mode, no Tier-2 expansion triggers fired.

### DESIGN
- **DES-1**: Encode script reimplements the deflate+base64 wire-format pipeline via `node:zlib` builtins rather than importing `packages/app/src/url-encoding.ts` — preserves the literal `node <file>.js` invocation (AC1) and the `engine ← renderer ← app` layering (ADR-001).
- **DES-2**: Guidance doc lives at `docs/AGENT-GRAPH-AUTHORING.md`, referenced by a one-line pointer from `CLAUDE.md`'s Key Files section, not inlined (ADR-002).
- **DES-3**: No schema-validation library added — hand-rolled `validateGraph` pure function; avoids a Cognitive Load Tax disproportionate to scale.
- **DES-4**: Outcome Collision Check treated as out-of-scope — both stories already `job_id: infrastructure-only`, no new typed contract.

### DISTILL
- **DIS-1**: Acceptance scenarios authored as Vitest `describe`/`it` blocks with AC tags in the title, not Gherkin `.feature` files — no Cucumber/BDD dependency exists anywhere in this repo. Project-convention override of the skill's default Gherkin framing.
- **DIS-2**: Tier B (state-machine property-based testing) skipped — single-shot, config-shaped CLI, no chained multi-step journey.
- **DIS-3**: ATDD Infrastructure Policy file not bootstrapped — zero driven-internal/external ports in scope (only `fs.readFileSync`/stdout/stderr, already builtin-classified by DESIGN).
- **DIS-4**: New `scripts/vitest.config.ts` project added to the root Vitest config — `scripts/` had no test wiring at all before this feature, a gap DESIGN's reuse analysis didn't surface.
- **DIS-5**: RED scaffolds created for both stories; pre-DELIVER gate run showed 7 genuine RED + 2 accepted-vacuous-pass (AC3 error-path scenarios passing trivially against an always-erroring scaffold) — zero wrong-reason failures.

## Issues Encountered

### Stale second decode script found (out of scope, flagged as drift risk)
While confirming the reference pattern to mirror, DISTILL discovered `scripts/decode-url.mjs` — an
older decode script that does plain base64→JSON with no `zlib` inflate step, so it silently
mis-decodes any real compressed share URL produced since `share-url-compression` shipped. This did
not change any DESIGN decision (`scripts/decodeSharedModelURL.js` remains the correct pattern) but is
a real drift risk left unresolved. **Recommended follow-up**: remove or fix `scripts/decode-url.mjs`.

### Long-pending uncommitted CLAUDE.md diff surfaced mid-feature
`CLAUDE.md` had an uncommitted diff sitting in the working tree since before this feature started
(flagged during a `/nw-buddy` project-status check at session start). Step 01-02 was the first
DELIVER step to touch `CLAUDE.md`, so its commit captured that pending diff alongside the new
guidance-doc pointer. Content was verified correct and consistent with what DISCUSS/DESIGN had
already been built against — nothing reverted or lost, but worth flagging as a process gap: stale
uncommitted diffs should be resolved (committed or discarded) before a new feature starts, not
carried silently into its first touching commit.

## Test Coverage

| File | Tests | Type |
|------|-------|------|
| `scripts/encodeSharedModelURL.test.js` | 9 | Unit/acceptance (Vitest, `@driving_adapter`/`@real-io`/`@error` tagged) |

9/9 green (`pnpm vitest run --project scripts`, 2026-07-23T18:27Z). Full workspace suite: 34/34
files, 554 passed + 6 skipped, 0 regressions.

## Quality Gates

| Gate | Outcome |
|------|---------|
| Roadmap review | Approved, 0 findings |
| Per-step TDD (RED/GREEN/COMMIT) | Both steps PASS |
| Adversarial review | Approved, 0 findings, zero Testing Theater patterns |
| Refactor (L1-L6) | Reviewed, zero changes needed |
| Mutation testing | Skipped — CLAUDE.md scopes the 80% kill-rate gate to `packages/engine` only; `scripts/` was never in scope |
| Integrity verification | `des-verify-integrity` — all 2 steps complete DES traces, exit 0 |

## Lessons Learned

1. **Infrastructure-only JTBD escape valve works as designed** — skipping full job-story ceremony for a one-script tooling addition kept process weight proportionate without losing traceability (rationale recorded per-story).
2. **Mirroring an existing sibling script pattern-by-reimplementation, not by import, avoids layering violations** — `decodeSharedModelURL.js`'s precedent of reimplementing rather than importing `url-encoding.ts` made ADR-001 an easy, evidence-based call.
3. **New source directories need explicit test-runner wiring** — `scripts/` had zero Vitest wiring before this feature; DESIGN's reuse analysis focused on production-code reuse and missed this, DISTILL caught it (DIS-4). Worth checking test-runner config coverage explicitly during future DESIGN reuse passes.
4. **Vacuous passes in RED scaffolds need explicit tracking** — negative-path (error) tests pass trivially against an always-erroring scaffold; DISTILL flagged this so DELIVER didn't mistake it for real coverage.
5. **Uncommitted diffs should be resolved before starting a new feature** — the stale `CLAUDE.md` diff got captured incidentally by an unrelated commit; harmless here, but a latent risk pattern.

## Migrated Artifacts

Architecture artifacts were written directly to their permanent SSOT location during DESIGN — no
migration needed (this repo uses the lean v3.14 single-file `feature-delta.md` model, not the
legacy multi-file temp-workspace layout).

| Artifact | Location |
|----------|----------|
| Architecture brief | `docs/product/architecture/brief.md` |
| ADR-001 (encode script reimplements pipeline) | `docs/product/architecture/adr-001-encode-script-reimplements-pipeline.md` |
| ADR-002 (guidance doc location) | `docs/product/architecture/adr-002-guidance-doc-location.md` |
| C4 diagrams | `docs/product/architecture/c4-diagrams.md` |
| Agent-facing guidance doc | `docs/AGENT-GRAPH-AUTHORING.md` |
| Encode script | `scripts/encodeSharedModelURL.js` |
| Slice brief (scope reasoning record) | `docs/feature/swoopy-diagram-agent-authoring/slices/slice-01-encode-script-and-guidance.md` (retained in place — feature directory preserved per finalize Phase C) |
