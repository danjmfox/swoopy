# Evolution: share-url-compression

**Date**: 2026-04-27  
**Feature ID**: share-url-compression  
**Goal**: Add deflate compression to share URL encoding so complex models produce shorter URLs

## Summary

Implemented URL compression for the `?g=` share parameter. Complex models previously produced
base64 strings that wrapped or failed in chat/email clients. The new implementation compresses
with raw deflate (fflate) before base64-encoding, achieving ≥30% reduction in URL length for
10-node graphs. Legacy plain-base64 URLs decode transparently via a silent fallback path.

## Business Context

Users sharing models via chat or email encountered URLs too long to be clickable or that were
silently truncated. This feature targeted complex models (10+ nodes) as the primary beneficiary.
No URL schema change — the `?g=` param name is unchanged and backward compatible.

## Steps Completed

| Step | Name | Outcome |
|------|------|---------|
| 01-01 | Implement encodeGraphForUrl and decodeGraphFromUrl with fflate | PASS |
| 02-01 | Update shareGraph() and loadFromUrl() to delegate to url-encoding.ts | PASS |
| 02-02 | Update decodeSharedModelURL.js debug script to handle compressed URLs | PASS |

## Key Decisions

### DISCUSS
- **D1**: Keep `?g=` param name — compression is a transport encoding change, not a format change; backward compat via fallback decode.
- **D2**: Prefer fflate (sync) over CompressionStream (async) — `loadFromUrl()` must remain synchronous; fflate adds ≤5KB gzipped.
- **D3**: Fallback is silent — no UI indicator whether URL is compressed or legacy.

### DESIGN
- **D1**: Extract `url-encoding.ts` as an isolated pure-function utility — no React/Zustand/DOM imports; independently testable.
- **D2**: fflate `deflateSync`/`inflateSync` with `raw: true` — documented in ADR-001.
- **D3**: Debug script uses Node.js built-in `zlib.inflateRawSync` — no fflate dependency in tooling.

### ADR-001
fflate sync chosen over Web Compression Streams async API. Full ADR at:
`docs/product/architecture/adr-001-share-url-compression-library.md`

## Issues Encountered

### fflate API confusion
The fflate API is `deflateSync(data, { raw: true })` — NOT `deflateRawSync`. Early implementation
used the wrong method name; discovered during GREEN phase.

### fflate/node vs fflate
Using `import from "fflate/node"` resolved correctly in jsdom (Vitest) but failed in Vite's
browser production build. Fixed by using the main `"fflate"` entry which resolves correctly
in both environments.

### btoa spread overflow
`btoa(String.fromCharCode(...largeUint8Array))` causes call stack overflow for large payloads.
Fixed with a 32KB chunked loop.

### Test files not committed
The initial TDD test files (`url-encoding.test.ts`, `share-compression.integration.test.ts`)
were created during delivery but never staged and committed by the executing agents. Discovered
and committed during finalization.

### Mutation testing limitation
Stryker kill rate: 72.73% (WARN — below 80% PASS threshold). The 6 surviving mutants are
semantically equivalent — fflate's `raw` flag is permissive in both directions
(`inflateSync` handles both raw and zlib-wrapped data transparently). A 7th test was added to
directly verify raw deflate format via manual inflate, but the kill rate did not improve.
Accepted as WARN with documented equivalent mutants.

## Test Coverage

| File | Tests | Type |
|------|-------|------|
| `packages/app/src/url-encoding.test.ts` | 7 | Unit |
| `packages/app/src/share-compression.integration.test.ts` | 7 | Integration |

All 343 tests in `@swoopy/app` pass after implementation.

## Lessons Learned

1. **Commit test files immediately after writing them** — they are as important as production code and should be in the same commit.
2. **fflate's raw flag is permissive** — using `{ raw: false }` on raw deflate data doesn't throw in fflate, making mutation testing less effective for this specific flag. Document equivalent mutants.
3. **Sandbox-based mutation testing breaks vitest alias resolution** — Stryker's default sandbox mode can't resolve workspace package aliases (`@swoopy/engine`). Use `--inPlace` for projects with pnpm workspace aliases in vitest config.

## Migrated Artifacts

| Source | Destination |
|--------|-------------|
| `discuss/journey-share-compressed-url.yaml` | `docs/ux/share-url-compression/` |
| `discuss/journey-share-compressed-url-visual.md` | `docs/ux/share-url-compression/` |
| `distill/acceptance.feature` | `docs/scenarios/share-url-compression/` |
| ADR-001 (pre-existing) | `docs/product/architecture/adr-001-share-url-compression-library.md` |
