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

- **Nodes** — variables with a label, a `[min, max]` value range, a size tier (XS–XL), a colour tier, and an optional short annotation
- **Causal edges** — directed links with reinforcing `+` or balancing `−` polarity, adjustable weight (0–5), and delay level; can be flagged as Quick-Fix for fast-acting short-term interventions that run on a parallel path
- **Constraint edges** — dynamic bounds: a ceiling caps a target's effective maximum; a floor raises its effective minimum
- **Modulators** — interaction effects where a source node scales the strength of a causal edge using a range-normalised formula; polarity controls amplification or suppression
- **Signals** — packets of activation that travel along edges, carrying positive or negative strength (`sign = ±1`); sign accumulates through the causal chain (chevron animates the polarity flip at balancing edges)
- **Annotations** — free-floating text labels placed anywhere on the canvas for context, assumptions, or goals

The simulation is deliberately imprecise. Node values are qualitative proxies, not measurements. This keeps the tool accessible and prevents false confidence in quantitative outputs.

---

## Known limitations

- **Non-linear relationships:** Relationships are currently linear (strength × weight × sign). Modulators are the first step toward richer transfer functions (sigmoid, threshold, exponential) that could model tipping points and saturating relationships. Full transfer functions are deferred to v2.
- **Run mode edits:** Delete and polarity-toggle are not prevented in Simulate mode — this is intentional (live edits on a running sim aid discovery), but undocumented and may surprise users.
- **Delay indicators** can be hard to read on high-weight (5×) edges where the line is thick.
- **No mobile touch optimisation** — canvas interactions are pointer-based only.
- **No export to image** — data export as CSV is available via the History overlay.
- **No flow / rate-of-change constraints** — ceiling/floor cap values, not rates; flow constraints are a v2 candidate.
- **No multiplayer or shared sessions.**
- **No keyboard-only panning** — canvas pan/zoom (see below) is pointer/wheel-driven only; no arrow-key camera movement.

---

See the [PRD](docs/PRD.md) for the full scope and design rationale.
