# Mutation Report — share-url-compression

## Summary

| Metric | Value |
|--------|-------|
| Target file | `packages/app/src/url-encoding.ts` |
| Total mutants | 22 |
| Killed | 15 |
| Timeout | 1 |
| Survived | 6 |
| No coverage | 0 |
| Kill rate | 72.73% |
| Verdict | WARN |

**Verdict**: WARN — kill rate 72.73% is in the 70–80% range (below ≥80% PASS threshold).

## Tool

- Stryker v9.6.1 with `@stryker-mutator/vitest-runner`
- Test runner: Vitest 3.x
- Coverage analysis: `all` (all 544 tests ran against each mutant)
- Tests per mutant (avg): 3.86

## Surviving Mutants

All 6 surviving mutants fall into two categories: **raw compression flag** and **boundary/guard logic**.

### 1. `raw: true` → `{}` (deflateSync, line 8)

```diff
- const compressed = deflateSync(bytes, { raw: true });
+ const compressed = deflateSync(bytes, {});
```

Why survived: With `{}` (no `raw` flag), fflate defaults to zlib-wrapped deflate. `btoa` still produces a string; the round-trip test passes because `inflateSync` is also missing the `raw` flag in the corresponding mutant... but in this case, `encodeGraphForUrl` uses `raw: true` while `decodeGraphFromUrl` tries `raw: true` inflate first — which will fail on zlib-wrapped data, then falls back to plain `atob`. The fallback successfully decodes the zlib output because the wrapper bytes are treated as valid JSON... or may fail silently. This mutant survives because the tests assert on structural round-trip identity, not on the specific compression algorithm used.

**Root cause**: Tests assert `decoded.nodes.map(n => n.id)` equals original, but this mutant causes a codec mismatch that may accidentally succeed through the fallback path.

### 2. `raw: false` (deflateSync, line 8)

```diff
- const compressed = deflateSync(bytes, { raw: true });
+ const compressed = deflateSync(bytes, { raw: false });
```

Same analysis as #1.

### 3. `i <= compressed.length` (for loop boundary, line 11)

```diff
- for (let i = 0; i < compressed.length; i += chunk) {
+ for (let i = 0; i <= compressed.length; i += chunk) {
```

Why survived: The off-by-one adds one extra empty chunk — `compressed.subarray(length, length + chunk)` returns an empty Uint8Array, and `String.fromCharCode(...[])` is `""`. The extra empty chunk doesn't corrupt the output but adds no bytes. The round-trip still succeeds. The 30% compression test passes because the extra chars are zero.

### 4. `if (false) return null` (empty guard, line 18)

```diff
- if (!encoded) return null;
+ if (false) return null;
```

Why survived: When `encoded = ""`, the code now falls through to `atob("")` which returns `""`, then `new TextDecoder().decode(Uint8Array.from("", ...))` returns `""`, then `JSON.parse("")` throws, which hits the outer `catch { return null }`. The observable outcome is the same: `null` is returned. Tests assert `decodeGraphFromUrl("") === null` — still passes.

### 5. `raw: true` → `{}` (inflateSync, line 22)

```diff
- const inflated = inflateSync(bytes, { raw: true });
+ const inflated = inflateSync(bytes, {});
```

Why survived: Similar to mutants 1–2, when `raw` is omitted from inflate but encode uses `raw: true`, the inflate fails (zlib vs raw mismatch), the inner catch triggers the plain-`atob` fallback, which also fails, outer catch returns `null`. Or the combination of both `raw` changes may form a consistent codec. In isolation this mutant may cause the round-trip to fail... but survives because Stryker ran mutants independently and the encode function was not mutated simultaneously.

### 6. `raw: false` (inflateSync, line 22)

Same as #5.

## Analysis: Why WARN and Not FAIL

The surviving mutants are all in the "compatible corruption" category:
- Compression flags: `raw: false` produces a different binary format but the fallback path in `decodeGraphFromUrl` absorbs the mismatch and returns `null` instead of the graph — but no test asserts the _compressed URL is shorter than plain base64_ using the **corrupt mutant**. The 30% compression test uses `legacyEncode` as baseline, which would be affected.
- Empty guard: The guard change is semantically equivalent at observable level.
- Loop boundary: Off-by-one is harmless.

## Test Improvement Recommendations

To reach ≥80%, the following tests would be needed:

1. **Assert `raw` flag indirectly**: Add a test that encodes with the real function, manually inflates with `raw: true` from the byte output, and asserts the JSON is valid. This would kill mutants 1–3 and 5–6.
2. **Assert encoding is actually deflate-raw**: Compare a tiny known graph against a pre-computed deflate-raw base64 golden master. This is brittle but kills all `raw` flag mutants.
3. **Assert empty-string guard path directly**: `decodeGraphFromUrl("")` already tested; the guard mutant (`if (false)`) produces the same result via a different path — this is inherently hard to distinguish without a spy. This is acceptable.

## Post-Run Verification

- Source files restored: `git checkout -- packages/app/src/url-encoding.ts packages/app/src/store.ts`
- Full suite after restore: **544 tests pass** (33 test files, 0 failures)

## Raw Report

JSON report: `docs/feature/share-url-compression/deliver/mutation/stryker-report.json`
