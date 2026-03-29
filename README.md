# Swoopy — Causal Loop Diagram Simulator

A browser-based tool for building and running [causal loop diagrams](https://en.wikipedia.org/wiki/Causal_loop_diagram). Draw a model, inject signals, and watch the simulation propagate in real time.

Built for facilitators, coaches, and educators running systems thinking sessions — particularly in organisational change, agile adoption, and retrospective work.

> **The primary value is the conversation while building.** Two people who disagree about how a system works will disagree about how to draw it. That disagreement is productive. The simulation then acts as a shared reference.

---

## For facilitators and coaches

See [docs/USER-GUIDE.md](docs/USER-GUIDE.md) for:

- How to build a model
- Interaction reference (modes, keyboard shortcuts)
- What the visual indicators mean
- How to share a model via URL

## For developers

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for:

- Package structure and boundaries
- How to run, test, and extend

---

## Quick start

```sh
# Requires Node 22, pnpm
pnpm install
pnpm --filter @swoopy/app dev
```

App runs at `http://localhost:5173`.

```sh
# Run all tests
pnpm test

# Type-check all packages
pnpm typecheck
```

---

## What it models

Swoopy implements a signal-propagation simulation over a directed graph:

- **Nodes** — variables with a label and a `[min, max]` value range
- **Causal edges** — directed links with polarity (reinforcing `+` / balancing `−`), weight, and delay
- **Constraint edges** — dynamic bounds: a ceiling caps a target's effective maximum; a floor raises its effective minimum
- **Signals** — packets of activation that travel along edges, carrying positive or negative strength; polarity is applied when a signal crosses a balancing edge

The simulation is deliberately imprecise. Node values are qualitative proxies, not measurements. This keeps the tool accessible and prevents false confidence in quantitative outputs.

---

## Known limitations (v1)

- Auto-save restore not yet active — closing and reopening the tab reloads the default example (fix: SE-07-fix)
- Model identity and safe shared-link handling not yet implemented (SE-08, DR--20260329--app--model-identity-persistence)
- No mobile touch optimisation
- No export to image or data formats
- No annotation layer (goals, assumptions, quick-fix markers) — v2 candidate
- No flow / rate-of-change constraints — v2 candidate
- No multiplayer or shared sessions

See the [PRD](docs/PRD.md) for the full scope and design rationale.
