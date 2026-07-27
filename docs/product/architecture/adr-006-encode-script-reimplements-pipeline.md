# ADR-006: Encode script reimplements the wire-format pipeline via Node builtins rather than importing packages/app/url-encoding.ts

## Status

Accepted

## Context

Story 1 (`swoopy-diagram-agent-authoring`) needs `scripts/encodeSharedModelURL.js`, the encode-side counterpart to the existing `scripts/decodeSharedModelURL.js`. AC1 fixes the literal invocation contract: `node scripts/encodeSharedModelURL.js <file>` — no build step, no `tsx`, no experimental flags.

The obvious "reuse" candidate is `packages/app/src/url-encoding.ts` (`encodeGraphForUrl`/`decodeGraphFromUrl`), which already implements the exact deflate-raw + chunked-base64 pipeline and imports `serialize`/`deserialize` from `@swoopy/engine`. However:

- `url-encoding.ts` is a `.ts` source file inside `packages/app/src`, not exported from any package's public entry point (`packages/app/package.json` has no `exports` map; `@swoopy/app` is not a dependency anywhere else in the repo).
- Plain `node` cannot import a `.ts` file without either `tsx` (changes invocation to `tsx scripts/....ts`, breaking AC1's literal command) or Node's experimental `--experimental-strip-types` flag (still breaks the literal no-flag command, and is not used anywhere else in this project).
- The sibling script this feature is explicitly told to mirror (`scripts/decodeSharedModelURL.js` — named in the slice brief as "the reference implementation pattern to mirror") already does not import from `@swoopy/engine` or `packages/app`; it reimplements the inflate half using Node's builtin `zlib.inflateRawSync` and manual field access, and this has been running against real browser-produced share URLs since `share-url-compression` shipped — proving builtin `zlib` is byte-compatible with `fflate`'s raw-deflate output today.

## Decision

`scripts/encodeSharedModelURL.js` is plain ESM JavaScript, invoked directly via `node`. It reimplements:

- The `{version, graph}` wrapper inline (version hardcoded to `5`, with a comment cross-referencing `packages/engine/src/serialisation.ts`'s `CURRENT_VERSION` as the source of truth to keep in sync).
- The deflate-raw + chunked-base64 encode, using Node builtin `zlib.deflateRawSync` (mirrors `decodeSharedModelURL.js`'s use of `zlib.inflateRawSync` for the inverse operation).
- A local inflate-based self-check decode (same builtin, same logic shape as the sibling script) used only for the AC2 roundtrip self-check before printing the URL — not a process-shell-out to the sibling script.

Schema validation (AC3: dangling edge references, missing required fields) is new, hand-rolled logic — no existing runtime validator exists anywhere in the codebase (the TS types in `packages/engine/src/types.ts` are compile-time only), and no schema-validation library (zod/ajv/joi) is currently a dependency.

## Alternatives Considered

1. **Import `encodeGraphForUrl`/`serialize` directly from `packages/app/src/url-encoding.ts` / `@swoopy/engine`, run via `tsx`.** Precedent exists for this style (`scripts/gen-doc-images.ts` imports `packages/renderer/src/drawScene.ts` directly and runs via `tsx`). Rejected: changes the invocation from `node scripts/....js` to `tsx scripts/....ts`, breaking AC1's literal command contract, and imports an app-internal (non-exported) module from a root script, inverting this project's `engine ← renderer ← app` layering (CLAUDE.md).
2. **Use Node's native TypeScript type-stripping** (`node --experimental-strip-types`) to import `url-encoding.ts` without `tsx`. Rejected: still requires a non-default flag (breaks the literal `node <file>` command), and is an experimental/unstable Node feature not used anywhere else in this project.
3. **Add `fflate` as a script-level import** of `url-encoding.ts`'s functions. Rejected: same layering-inversion and invocation-contract issues as (1); also redundant, since Node's builtin `zlib` already does the identical job with zero new dependency, as proven by the existing decode script.

## Consequences

**Positive:**

- AC1's exact command works with zero setup, zero build step, matches the existing decode script's invocation style exactly.
- Zero new dependencies.
- No risk from TS-import edge cases (module resolution, experimental flags) in a script an agent is expected to run unattended.

**Negative:**

- The wire-format logic now conceptually exists in three places: `url-encoding.ts` (browser), `decodeSharedModelURL.js`'s inflate half, and this script's encode + inflate-for-self-check halves. Drift risk if the wire format ever changes.
- **Mitigation:** the roundtrip self-check (AC2) fails loudly if this script's encode/decode ever diverge from what the browser can read; a code comment in the new script points back to `url-encoding.ts` as the format's source of truth.
- **Deferred (open question for DISTILL/DELIVER):** if a third Node-side consumer of this wire format ever appears, consider extracting a tiny shared pure-function wire-format module usable from both browser and Node without a bundler. Not done now — YAGNI at two-implementations scale.
