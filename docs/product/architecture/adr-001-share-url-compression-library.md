# ADR-001 — Compression library for share URL encoding

**Status:** Accepted  
**Date:** 2026-04-24  
**Feature:** share-url-compression  
**Deciders:** nw-solution-architect (DESIGN wave)

---

## Context

The current share URL encodes the model as: `JSON → UTF-8 bytes → btoa(base64)`. Complex models
produce URLs long enough to wrap in Slack and exceed typical chat message limits. Compressing the
bytes before base64-encoding would materially reduce URL length.

Two viable approaches exist:

1. **fflate `deflateRawSync` / `inflateRawSync`** — synchronous deflate; new npm dependency (~3KB
   gzipped); no browser API dependency; available in all modern browsers and Node.js.

2. **Web Streams `CompressionStream` / `DecompressionStream`** — native browser API; no new
   dependency; but asynchronous — requires `loadFromUrl()` to become `async`, changing its
   interface and requiring refactoring of all call sites and the store initialization sequence.

---

## Decision

**Use fflate `deflateRawSync` / `inflateRawSync`.**

---

## Rationale

| Factor | fflate | CompressionStream |
|--------|--------|-------------------|
| `loadFromUrl()` stays synchronous | Yes | No — interface change required |
| New dependency | Yes (~3KB gzip) | No |
| Store initialization refactor | None | Significant (all `loadFromUrl` callers) |
| Browser support | All modern + Node | Chrome 80+, Safari 15.4+, Firefox 113+ |
| Node.js support (debug script) | Yes (`deflateRawSync` in Node) | Yes (Node 18+) |
| Testability | Pure sync, easily unit-tested | Requires async test setup |

The synchronicity constraint is the deciding factor. `loadFromUrl()` is called on app boot during
store hydration (`useEffect`), and its current synchronous contract is embedded across the store
slice interface definition and its callers. Making it async is a non-trivial refactor with
blast radius beyond this feature's scope.

fflate's bundle cost is bounded (~3KB gzipped) and it is a well-maintained, widely used library
(used by Vite itself for gzip plugin). This is an acceptable Cognitive Load Tax given the
alternative.

---

## Consequences

- `fflate` added to `@swoopy/app` dependencies
- `packages/app/src/url-encoding.ts` created as the sole owner of the transport encoding contract
- `scripts/decodeSharedModelURL.js` reimplements deflate decode using Node.js `zlib` built-in
  (no fflate import required in the script — Node has `zlib.inflateRawSync`)
- Legacy `?g=` URLs (plain base64) continue to work via the catch/fallback path in
  `decodeGraphFromUrl()`
- If `CompressionStream` becomes compelling in future (e.g. `loadFromUrl` is made async for another
  reason), fflate can be replaced — the transport boundary is isolated in `url-encoding.ts`

---

## Rejected Alternatives

**CompressionStream (async):** Rejected because it requires `loadFromUrl()` to become async. The
blast radius of that change exceeds the value of avoiding a 3KB dependency.

**pako:** Heavier than fflate (~50KB minified vs ~7KB). Rejected on bundle size.

**LZString:** Optimised for string-to-string compression rather than bytes-to-bytes. Less
standard; would require updating the debug script to a non-standard codec.

**No compression:** Rejected — this is the problem being solved.
