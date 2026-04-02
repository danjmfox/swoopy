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

## Known limitations

Non-Linear Transfer Functions: Currently, relationships are linear (strength × weight). Implementing sigmoid or threshold-based transfer functions (as noted in PRD §7.5) would allow for modeling "tipping points" where a relationship only activates or saturates after a specific threshold is met.
The Annotation Layer (v2 Candidate): There is a significant opportunity to add an "instructional" layer—static callouts for goals, "Quick Fix" (QF) markers, and mental model notes. This would bridge the gap between a pure simulator and a professional presentation tool.
Trend Visualization: While nodes currently show a simple trend arrow (▲/▼), adding a "sparkline" or value-over-time overlay would help users visualize oscillations in balancing loops that might be moving too fast to track by eye.
Interaction Effects (Edge Modulation): In complex systems, one variable often changes the strength of a relationship between two others (e.g., "Psychological Safety" moderating the link between "Mistakes" and "Learning"). Supporting edges that point to other edges would significantly increase the tool's modeling power.

- A node emitting to 2 nodes, both emitting to a 4th node (but with opposing polarity) prevents any emits from the 4th node due to all edge transits taking the same duration
- Can't "Name" a model. Name should be reflected in the page title and on the Canvas
- Delay indicators are lost in 5x edges. Need to scale or be otherwise distinct.
- Run mode prevents model edits:
- Delete should not work in Run mode
- Change edge polarity should not work in Run mode.
- note the sim stays running in other modes which do allow edits. this is good. Live edits on a running sim is good for discovery, especially with undo feature.
- stock changes are allowed in run mode
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
