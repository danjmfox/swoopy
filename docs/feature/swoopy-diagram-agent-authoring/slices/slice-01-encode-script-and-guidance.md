# Slice 01 — Encode script + agent-facing guidance

## Goal
An agent asked to "build a swoopy diagram" from a chat description can construct a graph, encode it into a working share link via a standalone script, and iterate — without exploring the app's source from scratch each time.

## IN scope
- New standalone Node script, `scripts/encodeSharedModelURL.js`, mirroring the existing decode script: reads a graph JSON file, wraps it (`{version: 5, graph}`), deflates + base64-encodes it, prints a full share URL (`?g=...&title=...`) to stdout.
- Schema validation before encoding: reject graphs with dangling edge references or missing required fields, exit non-zero with a clear stderr message.
- Roundtrip self-check: script decodes its own output and diffs against the input before printing (belt-and-braces on the project's existing roundtrip invariant).
- Agent-facing guidance doc (path decided in DESIGN) documenting the `Graph`/`Node`/`Edge`/`Modulator`/`Annotation` shapes, one worked example, the script invocation, and the edit→re-run iteration loop.
- A pointer to that doc from `CLAUDE.md`.

## OUT scope
- No import-from-JSON UI in the app itself (`packages/app`) — this stays a standalone script, not a product feature.
- No changes to the existing decode script, encoding pipeline, or query param scheme.
- No new SSOT entries (`docs/product/jobs.yaml`, journeys, personas) — infrastructure-only escape valve, see wave-decisions.

## Learning hypothesis
**Disproves**: an agent cannot reliably go from a natural-language causal-loop description to a correctly-rendering swoopy link using only the guidance doc + script — if it still needs to read `packages/app/src/url-encoding.ts` or `packages/engine/src/types.ts` from scratch to succeed, the doc has failed its job.
**Confirms**: guidance doc + script are sufficient — an agent can produce a valid, roundtrip-clean link for a simple 2-4 node causal loop on the first attempt.

## Acceptance criteria
See Story 1 and Story 2 AC in `../feature-delta.md`.

## Dependencies
- `packages/engine/src/types.ts` (schema, read-only)
- `packages/engine/src/serialisation.ts` (`serialize`, read-only)
- `fflate` (already a dependency, used by `packages/app/src/url-encoding.ts`)
- Existing `scripts/decodeSharedModelURL.js` as the reference implementation pattern to mirror

## Effort estimate
< 1 day (single script + single doc, no UI/API changes, no new dependencies).

## Reference class
Same shape as the existing `scripts/decodeSharedModelURL.js` — a standalone Node CLI reference script. This slice adds its encode-side counterpart plus the doc that makes both discoverable to an agent.

## Pre-slice SPIKE
Not needed — the encode pipeline is fully understood from existing code (`url-encoding.ts`), no unknowns to de-risk.
