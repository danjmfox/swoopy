# Swoopy — Causal Loop Diagram Simulator

A browser-based tool for building and running [causal loop diagrams](https://en.wikipedia.org/wiki/Causal_loop_diagram). Draw a model, inject signals, and watch the simulation propagate in real time.

- Inspired by the legendary [Nicky Case](https://github.com/ncase)'s [Loopy](https://ncase.me/loopy/) ([github](https://github.com/ncase/loopy))
- Extended to handle the Systems Thinking concepts described at [less.works](https://less.works/less/principles/systems-thinking)
- Described by me and Claude Code
- Built entirely by Claude Code

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

- Can't "Name" a model. Name should be reflected in the page title and on the Canvas
- Rather than the timebomb as a dot inside the node, lets visual the wait state as a sized arc on the left of the node, mirroring the function of the stock arc on the right
- No mobile touch optimisation
- No export to image or data formats
- No annotation layer (goals, assumptions, quick-fix markers on Edges) — v2 candidate
- No flow / rate-of-change constraints — v2 candidate
- No multiplayer or shared sessions
- Currently a fixed node colour range indicating "temperature (value/range)". Instead, offer multiple colours in node settings, so a user can show aspects visually e.g. green for "good things", red for "bad things". Keep the dynamic temperature aspect (brighter/darker or similar)
- notion of levers: some things you can't directly influence, but some you can, so mark levers explicitly, and prevent signal injection in non-levers.
- All the annotations etc.
- A welcome model with annotations describing how to use it
- example models for each behaviour
- zoom in/out of canvas
- node sized to relative range max, ie. a max 5 node is smaller than a max 10 node
- import from Loopy
- batch entry for node names
- auto-switch modes based on key-presses?
- image export
- mermaid export?
- Activity/Debug logs?
- Trend Charts
- o ("opposing" syntax)
- inclusion of running models in html pages, e.g. the MODELS page, sitting alongs supporting text discussion.
- A Config screen, allowing edits for all current "constants"

---

See the [PRD](docs/PRD.md) for the full scope and design rationale.
