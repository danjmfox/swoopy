# CLAUDE.md for Swoopy

Global standing orders, coding preferences, and the verification stack are in `~/.claude/CLAUDE.md`.

## Commands

```bash
pnpm test --run          # run all tests once (workspace-wide)
pnpm typecheck           # tsc build check
pnpm lint                # trunk check
cd packages/app && pnpm dev    # dev server (Vite, localhost:5173)
cd packages/app && pnpm build  # production build
```

## graphify

This project has a graphify knowledge graph at graphify-out/.

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current

## Development Paradigm

**FP-leaning functional core** for engine and URL encoding; React imperative shell for rendering.

- `packages/engine` — pure functions only; signal propagation, graph transforms, no I/O
- `packages/renderer` — canvas 2D draw loop and hit testing; browser-only; not imported by Node tests
- `packages/app/src/url-encoding.ts` — pure encode/decode pipeline (deflate → base64); no side effects
- React components — imperative shell; all rendering and user interaction here
- `packages/app/src/store.ts` — Zustand store; all app state lives here; central to any UI work

**Import direction:** `engine` ← `renderer` ← `app`. Engine must not import from renderer or app.

For substantive engine/URL-encoding work delegate to `@nw-functional-software-crafter`; for substantive React/UI work, `@nw-software-crafter`. Small edits and single-file fixes: do them inline.

## Key Invariants

These are the primary regression guards for any serialisation change:

- **Roundtrip**: `decode(encode(graph))` deep-equals `graph` for all valid graphs
- **Idempotency**: `encode(decode(encode(graph)))` equals `encode(graph)`
- **Compression**: compressed output is shorter than plain base64 for non-trivial graphs
- **Null safety**: any invalid input to `decode` returns `null`, never throws

Property tests for all four live in `packages/app/src/url-encoding.test.ts`.

## Key Files

- `docs/ARCHITECTURE.md` — detailed package and simulation step docs; read before engine changes
- `docs/PRD.md` — feature requirements and IDs
- `docs/decisions/` — decision records (DRs); check before changing cross-package interfaces
- `packages/app/src/store.ts` — Zustand store (persistence, graph CRUD, URL share, simulation loop)
- `docs/AGENT-GRAPH-AUTHORING.md` — agent-facing guide to authoring graph JSON and encoding it via `scripts/encodeSharedModelURL.js`

## Persistence

Local storage keys: `swoopy_graph_<id>` (serialised graph) and `swoopy_title_<id>` (model title).
Any persistence work must preserve these keys for backwards compatibility.

## Mutation Testing

Per-feature, scoped by module characteristic, not package boundary: pure, side-effect-free logic
files are in scope wherever they live (`packages/engine` always; specific pure-logic files in
`packages/renderer` or `packages/app` when they carry algorithmic logic worth verifying — e.g.
`packages/app/src/url-encoding.ts`, `packages/renderer/src/geometry.ts`). React components,
event-wiring/imperative-shell code, and browser-API-coupled classes (RAF loop, canvas context
calls) are excluded regardless of package — mutating them is noise, not signal.
Kill rate gate: 80%. See `docs/decisions/DR--20260724--process--mutation-testing-scope.md`.

## dependency-cruiser

Not yet configured. When adding, enforce: engine may not import from app; app may import from engine.
