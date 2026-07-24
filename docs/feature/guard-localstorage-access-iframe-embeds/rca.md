# RCA: blank white page when Swoopy is embedded in a sandboxed iframe (e.g. Miro)

## Root cause chain

1. Embedding tools (Miro, Notion, Confluence, ...) commonly render third-party
   content in a sandboxed iframe (`sandbox="allow-scripts ..."`) **without**
   `allow-same-origin`, to isolate the embed from the host page's storage/cookies.
2. Without `allow-same-origin`, the iframe's origin is opaque/`null`.
3. In an opaque-origin context, `localStorage`/`sessionStorage` access throws a
   `SecurityError` instead of returning empty.
4. `shouldShowWelcome()` (`packages/app/src/App.tsx:14-22`) calls
   `localStorage.getItem(...)` unconditionally, and is invoked as the
   `useState(shouldShowWelcome)` initializer (`App.tsx:30`) — i.e. synchronously
   during React's first render pass, before any `useEffect` (including the
   `?g=`/`?m=` URL-loading logic) runs.
5. `packages/app/src/main.tsx` has no `ErrorBoundary` around `<App />`.
6. Result: the `SecurityError` is thrown during initial render, uncaught, React
   unmounts the tree, and nothing is drawn — a blank white page — regardless of
   whether the URL uses `?g=` (self-contained share link) or `?m=` (local-only
   reference).

## Evidence

- Verified `danjmfox.github.io/swoopy` sets no `X-Frame-Options` or CSP
  `frame-ancestors` header (checked via `curl -I`), so framing itself is not
  blocked — the failure is inside the app, not at the network/header layer.
- Traced the synchronous `localStorage` call to `App.tsx:19-20`, confirmed no
  other localStorage access happens before it (store.ts's initial state uses
  `seedGraph` + `crypto.randomUUID()`, no storage read at module load).
- Confirmed no `ErrorBoundary` exists in `main.tsx`.

## Correction found during implementation

Earlier analysis (in conversation, before this fix) stated `shouldShowWelcome()`
touches `localStorage` "unconditionally" before the `?g=` branch runs. That's
inaccurate: the check is `!params.has("g") && !params.has("m") && ...`, and JS
`&&` short-circuits — for a `?g=`-bearing URL, `!params.has("g")` is already
`false`, so `localStorage.getItem` is never reached. The actual second crash
site (found while writing the regression test) is `App.tsx`'s startup
`useEffect`, at the `localStorage.getItem("swoopy_current_model")` call in the
`else` branch — also skipped when `?g=` is present, but hit for bare URLs and
`?m=` URLs.

Net effect: `?g=` links were likely never affected by this particular crash.
`?m=` links and bare URLs (no query params) were affected by both the
`shouldShowWelcome` and the `useEffect` call sites. `store.ts`'s
`loadPersistedGraph` (called from that same `else` branch) has further
unguarded `localStorage` calls not individually patched here — the
`ErrorBoundary` is the backstop for those and any other call site, current or
future, rather than an exhaustive per-call-site guard.

## Separately confirmed (not part of this fix)

`?m=<uuid>` links are local-storage references and are inherently not portable
to another browser/device/sandboxed context — that's expected behavior, not a
bug. `?g=<compressed-graph>` links are self-contained and were not reachable
by this crash at all (see correction above).

## Proposed fix (user-approved)

1. Guard the synchronous `localStorage` reads in `shouldShowWelcome()` so a
   thrown `SecurityError` degrades to a safe default instead of crashing render.
2. Add a top-level `ErrorBoundary` around `<App />` in `main.tsx` as a backstop
   for any other uncaught render error, so failures show a minimal fallback
   instead of blank white.

## Risk

Low — both changes are additive guards around existing behavior; no change to
normal (non-sandboxed) execution paths.

## Outcome

Both fixes implemented via RED→GREEN TDD, in worktree
`.claude/worktrees/fix-embed-localstorage-crash`:

1. `packages/app/src/App.tsx` — added `safeGetItem()`, used it in
   `shouldShowWelcome()` and the startup `useEffect`'s `else` branch.
2. `packages/app/src/ErrorBoundary.tsx` (new) — class component backstop,
   wrapped around `<App />` in `packages/app/src/main.tsx`.

Regression tests: `App.test.tsx` (`SE-11` describe block) and
`ErrorBoundary.test.tsx`. Full workspace suite: 586 passed, 6 skipped
(pre-existing), 0 failed. `pnpm typecheck` clean.
