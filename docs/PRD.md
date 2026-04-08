# Product Requirements Document

## Swoopy — Causal Loop Diagram Simulator

**Version:** 2.0
**Status:** v2.0.0 — relay propagation engine
**Stack:** TypeScript · pnpm workspaces · Vite · React · Zustand · Canvas 2D · Vitest

---

## 1. Purpose

Swoopy is a browser-based tool for building and running causal loop diagrams — systems of nodes connected by signed directed edges. Users draw a model, inject signals, and watch the simulation propagate in real time.

The goal of this rebuild is to reproduce the core interaction model of Nicky Case's Loopy on a maintainable, testable, extensible modern stack, and to extend it with richer stock and delay modelling suited to organisational systems thinking — particularly in the context of large-scale agile adoption and retrospective facilitation.

The original Loopy is the interaction and simulation reference point. Where Swoopy diverges — min/max bounds, delay levels, edge weight, undo history — those additions are deliberate and documented.

### 1.1 Modelling philosophy

This tool is **deliberately imprecise**. Node values are qualitative proxies, not measurements. A node value of 7 does not mean "feature velocity is 7.3 units per sprint." It means "feature velocity is high and rising relative to its range." The simulation is a thinking aid, not a predictive model.

This imprecision is a feature. It keeps the tool accessible to non-technical users, encourages conversation over calculation, and prevents false confidence in quantitative outputs. Users coming from system dynamics tools (Vensim, Stella, AnyLogic) should understand that this tool occupies a different point on the rigour/accessibility tradeoff — closer to a whiteboard than a simulator.

The primary value of the tool is the **conversation while building**. Two people who disagree about how a system works will disagree about how to draw it. That disagreement is productive. The simulation then acts as a shared reference: "let's run your model and see what it predicts." That is a qualitatively different kind of conversation than debating bullet points in a retrospective.

### 1.2 What the simulation makes tangible

The tool is specifically designed to surface the system dynamics that defeat common sense:

- **Reinforcing loops** — small perturbations amplify; the system does not return to rest
- **Balancing loops** — self-correcting behaviour; the system resists change
- **Delay** — cause and effect are separated in time; consequences appear long after decisions
- **Saturation** — stocks have limits; what happens at the boundary matters
- **Interaction between loops** — reinforcing and balancing loops in the same system produce non-obvious stable and unstable states

These are the dynamics behind Senge's eleven laws, Weinberg-Brooks' Law, and the "faster is slower" pattern described in the LeSS systems thinking principle.

### 1.3 LeSS causal loop notation — elements represented and not represented

The LeSS systems thinking page describes a richer notation than this tool implements. The following elements are **represented**:

- Variables (nodes with labels and bounded values)
- Causal links with direction (directed edges)
- Opposite effects / polarity (reinforcing + / balancing −)
- Delays (|| / |||| / |||||| marks with pending signal queue)
- Positive and negative feedback loops (emergent from graph topology)
- Edge weight (extreme effects — thick lines in LeSS notation become high-weight edges)
- Constraints (partially — see below)

#### Simulation gaps — require engine changes to represent fully

**Constraints.** In LeSS notation a constraint caps a variable without being a causal link — cash supply limits hiring, but more cash does not automatically mean more hires. In this tool, constraints are modelled as **constraint-type edges between two nodes**, where the source node's current value acts as a dynamic bound on the target. Two kinds are supported:

- **Ceiling constraint** — `effective_max = min(target.max, source.value)`: tightens the upper bound; can never raise it above the target's designed maximum
- **Floor constraint** — `effective_min = max(target.min, source.value)`: raises the lower bound; can never push it below the target's designed minimum

A node may have multiple incoming constraint edges of either kind from different sources; all resolve in combination. If active constraints produce `effective_min > effective_max`, floor wins and the node is pinned to `effective_min`.

Because constraint source nodes are normal nodes subject to full signal propagation, constraints are **fully dynamic** — a constraint source driven by other nodes in the model will vary its bounding effect as the simulation runs.

Scale alignment remains a facilitation concern: if source and target are on incompatible scales, the constraint may never meaningfully bite. The tool does not enforce scale alignment.

Rate-of-change caps (flow constraints, e.g. "you can only hire N people per month regardless of cash") are **deferred to v2** — they require `step()` to track per-tick deltas per node, which is additional complexity.

**Interaction effects.** A causal link entering another causal link — a moderating variable that changes the strength or direction of a relationship. Not representable in v1. The closest approximation is manually adjusting edge weight. This is the gap most likely to frustrate sophisticated users; it is where transfer functions (§7.5) begin to address the problem in future.

**Goals and threshold reactions.** A target value that generates pressure and triggers a policy reaction when crossed. No threshold or reactive policy concept in v1.

#### Annotation gaps — static callouts, no engine changes required

These elements are communicative rather than computational — they label intent, assumption, or context on the diagram without affecting the simulation. They are **lower implementation cost than simulation gaps** and potentially higher facilitation value.

**Goals.** In LeSS diagrams, goals appear as callout annotations — "higher feature velocity" labelling a pressure arrow. They are non-dynamic: they don't receive signals or change value. In this tool they would be a labelled callout shape attached to a node or edge, rendered on canvas but invisible to `step()`.

**Quick-fix markers.** A 'QF' label on a causal link indicating a reaction chosen for speed over systemic effect. Static annotation.

**Assumption / mental model notes.** The LeSS First Law of Diagramming — "model to have a conversation" — specifically calls for surfacing assumptions on the diagram. A free-text note attached to any element is the minimum viable implementation.

**Delay human-scale labels.** The || marks already communicate delay visually; a small text label showing "days / weeks / months" next to the marks would make the human-scale mapping explicit without requiring the modeller to explain it verbally.

These four annotation types are **v2 candidates** — they share a common implementation pattern (positioned text + canvas hit target) and can be designed as a single annotation layer without touching the engine.

#### Measurement dysfunction

The LeSS model explicitly shows how reward systems create perverse incentives — a dynamic that requires both goal modelling and annotation to represent. This depends on both gap categories above and is therefore a **v3 candidate** at earliest.

These gaps do not prevent useful facilitation. They are limitations to communicate to participants so the tool is used with appropriate expectations.

---

## 2. Users

The primary user is a facilitator, coach, or educator running a systems thinking session — typically in the context of organisational change, agile adoption, or retrospective work. They are not necessarily technical. They want to sketch a shared model quickly, run it to test intuitions, and use it as a conversation anchor.

The secondary user is someone exploring a system on their own — a researcher, curious generalist, or practitioner thinking through a problem. They may use the tool asynchronously and share a URL to invite comment.

Tertiary users are developers building on or extending the tool.

---

## 3. Scope

### In scope

- Node and edge creation, editing, and deletion
- Directed signed edges (reinforcing / balancing)
- Constraint edges — dynamic ceiling (`effective_max = min(target.max, source.value)`) and floor (`effective_min = max(target.min, source.value)`); multiple constraints per node from different sources; fully dynamic as source nodes change value
- Real-time signal propagation simulation with global speed control
- Positive and negative signal injection
- Node label editing with inline popover
- Node min / max / initial value configuration via inline popover
- Edge weight and delay configuration
- Graph serialisation to and deserialisation from URL (base64 query param)
- localStorage auto-save (last graph persisted across sessions)
- Share via URL
- Linear undo / redo history
- Basic keyboard navigation (tab, arrow keys, delete)
- Responsive canvas that fills the viewport

### Out of scope (v1)

- Multiple simultaneous models
- Collaboration / multiplayer
- Export to image or data formats
- Mobile touch optimisation (canvas interactions are pointer-based)
- Trend overlay (value-over-time chart per node)
- Annotation layer: goals, assumptions, quick-fix markers, delay labels _(v2 candidate)_
- Flow / rate-of-change constraints _(v2 candidate)_
- Interaction effects / edge modulation _(v2/v3 candidate)_
- Threshold reactions and goal modelling _(v2/v3 candidate)_
- Measurement dysfunction modelling _(v3 candidate)_

---

## 4. Functional Requirements

### 4.1 Graph editing

| ID    | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GE-01 | User can create a node by clicking empty canvas in Add Node mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| GE-02 | Nodes are circular with a visible label                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| GE-03 | User can drag a node to reposition it in Add Node or Select mode; drag is an undoable mutation                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| GE-04 | User can create a directed edge by dragging from one node to another in Add Edge mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| GE-05 | Edges are rendered as curves with an arrowhead indicating direction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| GE-06 | Each edge has a polarity: reinforcing (+) or balancing (−)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| GE-07 | Default polarity for a new edge is reinforcing (+)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| GE-08 | User can toggle edge polarity by double-clicking the polarity badge on the edge midpoint                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| GE-09 | User can delete a node (and all its connected edges) in Delete mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| GE-10 | Duplicate causal edges between the same node pair in the same direction are not permitted; duplicate constraint edges of the same kind (ceiling or floor) from the same source to the same target are not permitted; a ceiling and a floor constraint between the same pair are permitted                                                                                                                                                                                                                                                                             |
| GE-11 | Each node has a configurable min and max value (defaults: 0 and 10)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| GE-12 | Each node has a configurable initial value, used as the reset state (default: 0)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| GE-13 | Each edge has a configurable weight representing coupling amplitude (default: 1.0, range: 0–5); weight=N causes N signal fragments to travel the edge per relay event, each carrying full signal strength — total effect = N × strength; weight is rendered as line thickness — weight 1 = standard width, weight 5 = maximum width; higher weight means both more visual activity and stronger causal influence                                                                                                                                                      |
| GE-14 | Each edge has a configurable delay level: none, short (days), medium (weeks), long (months)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| GE-15 | Delay level is rendered as vertical bars on the edge curve: none = no marks, short = \|\|, medium = \|\|\|\|, long = \|\|\|\|\|\|                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| GE-16 | A fixed-size hit region exists on the edge curve for delay cycling regardless of whether delay marks are currently visible; double-clicking this region cycles none → \|\| → \|\|\|\| → \|\|\|\|\|\| → none                                                                                                                                                                                                                                                                                                                                                           |
| GE-17 | Polarity badge, delay hit region, and weight popover target are visually distinct and occupy non-overlapping hit regions along the edge curve                                                                                                                                                                                                                                                                                                                                                                                                                         |
| GE-18 | Double-clicking a node in Select, Add Node, Add Edge, or Delete mode opens an inline popover for label, min, max, and initial value; double-clicking a node in Simulate mode has no effect                                                                                                                                                                                                                                                                                                                                                                            |
| GE-19 | Double-clicking the weight region of an edge (between polarity badge and arrowhead) opens an inline popover for weight configuration; active in Select, Add Node, Add Edge, and Delete modes                                                                                                                                                                                                                                                                                                                                                                          |
| GE-20 | In Select mode, Tab key cycles focus through nodes; arrow keys nudge the focused node; Delete key removes it                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| GE-21 | Ctrl+Z undoes and Ctrl+Shift+Z redoes regardless of active mode; all graph mutations (add, delete, move, configure) are recorded in the linear undo stack                                                                                                                                                                                                                                                                                                                                                                                                             |
| GE-22 | Undo history is session-only and is not persisted to localStorage                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| GE-23 | User can create a constraint edge by holding Alt and dragging from node to node in any mode; on release a choice is offered: ceiling or floor constraint; constraint edges are visually distinct from causal edges (dashed line, no arrowhead) and labelled ⌈ or ⌊ accordingly                                                                                                                                                                                                                                                                                        |
| GE-24 | Ceiling constraint edges set `effective_max = min(target.max, source.value)` each step; floor constraint edges set `effective_min = max(target.min, source.value)` each step; if active constraints produce a state where effective_min > effective_max, floor wins and the node is pinned to effective_min                                                                                                                                                                                                                                                           |
| GE-25 | A node may have multiple incoming constraint edges of either kind from different source nodes; all are resolved in combination before signal propagation each step                                                                                                                                                                                                                                                                                                                                                                                                    |
| GE-26 | User can delete an individual causal edge in Delete mode by clicking any hit region on that edge (polarity badge, delay region, or weight region); constraint edges are deletable by clicking their midpoint (GE-43)                                                                                                                                                                                                                                                                                                                                                  |
| GE-27 | In Select mode, pressing Enter/Return while a node is focused opens its node editor popover                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| GE-28 | Each mode has a keyboard shortcut (S = Select, N = Add Node, E = Add Edge, R = Run/Simulate, D = Delete); the Toolbar button for each mode displays its shortcut key; the active mode is visually highlighted                                                                                                                                                                                                                                                                                                                                                         |
| GE-29 | In Select mode, the delay hit region and weight hit region on each edge are rendered with a subtle visible indicator (e.g. a dim translucent dot) so users can discover they are interactive without hovering                                                                                                                                                                                                                                                                                                                                                         |
| GE-30 | In Select mode, hovering over a delay hit region or weight hit region brightens the affordance indicator to signal the region is under the cursor and ready to interact with                                                                                                                                                                                                                                                                                                                                                                                          |
| GE-31 | A `?` button in the toolbar opens a modal overlay showing mode descriptions and keyboard shortcuts reference; the modal is dismissible via the button, an explicit close button, pressing Escape, or pressing `?` again (toggle)                                                                                                                                                                                                                                                                                                                                      |
| GE-34 | User can assign one of five named size tiers (XS/S/M/L/XL) to a node in the node editor popover; the tier determines the node's display radius (XS=22px … XL=38px); the picker renders circle swatches at proportional sizes; default tier is M; serialisation v2 migration: `sizeTier ?? 'm'` — emerged from use 2026-04-02 (DR--20260402--app--node-visual-property-tiers)                                                                                                                                                                                          |
| GE-35 | User can assign one of eight named colour tiers (blue/green/red/orange/yellow/teal/purple/grey) to a node in the node editor popover; the tier is the node's identity colour; node fill interpolates from a faint tint (value=min) to a saturated shade (value=max) in the chosen colour, replacing the hardcoded blue→red activation gradient; picker renders filled circle swatches adjacent to size picker; default tier is blue; serialisation v3 migration: `colourTier ?? 'blue'` — emerged from use 2026-04-02 (DR--20260402--app--node-visual-property-tiers) |
| GE-36 | Each node has an optional annotation string (max 24 chars displayed, truncated with ellipsis); editable via the node editor popover; rendered below the node circle in a muted style — emerged from use 2026-04-02                                                                                                                                                                                                                                                                                                                                                    |
| GE-37 | User can place free-floating text annotation boxes on the canvas in Add Annotation mode (A key); boxes can be moved by dragging in Select mode, edited via double-click popover, and deleted in Delete mode; stored as `Graph.annotations`; serialisation v3 migration adds `annotations: []` — emerged from use 2026-04-02                                                                                                                                                                                                                                           |
| GE-38 | An H key and a toolbar button toggle a history overlay showing recent model mutations; the overlay is closeable via the same controls or Escape — emerged from use 2026-04-03                                                                                                                                                                                                                                                                                                                                                                                         |
| GE-39 | The history overlay has two views toggled by [Table] / [Graph] buttons: a table listing recent mutations with tick and delta, and an SVG line chart showing node value trajectories over time — emerged from use 2026-04-03                                                                                                                                                                                                                                                                                                                                           |
| GE-40 | A `historySeq` counter increments on every mutation that should appear in the history overlay; subscribers use it to detect when to refresh; the counter is distinct from the undo stack — emerged from use 2026-04-03                                                                                                                                                                                                                                                                                                                                                |
| GE-41 | Causal edges can be flagged as Quick Fix (QF); QF edges are rendered with a dashed line, a `QF` label, and participate in parallel-edge offset logic; the QF flag is togglable; toggling to QF is prevented if a QF edge already exists between the same pair — emerged from use 2026-04-04                                                                                                                                                                                                                                                                           |
| GE-42 | Two causal edges between the same node pair are permitted when exactly one is QF and one is normal; they are rendered offset to opposite sides of the straight line (normal = +BOW, QF = −BOW); propagation treats them as independent edges — emerged from use 2026-04-04                                                                                                                                                                                                                                                                                            |
| GE-43 | Constraint edges are deletable in Delete mode by clicking within `EDGE_HIT_RADIUS` of their midpoint — completes GE-26 for constraint edges — emerged from use 2026-04-05                                                                                                                                                                                                                                                                                                                                                                                             |
| GE-44 | A modulator edge is rendered as a dashed arc from the source node centre to the T=0.5 Bézier midpoint of the target causal edge; arc colour indicates polarity (blue = +1, red = −1); a small filled circle marks the terminus; the pending-modulator target edge is highlighted with an amber ring — emerged from use 2026-04-05                                                                                                                                                                                                                                     |
| GE-45 | In Add Edge mode, clicking any hit region of a causal edge enters pending-modulator state; a banner at the top of the canvas names the target edge; subsequently clicking a source node creates a modulator with default polarity +1 — emerged from use 2026-04-05                                                                                                                                                                                                                                                                                                    |

### 4.2 Simulation

| ID    | Requirement                                                                                                                                                                                                                                                     |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SI-01 | Simulation runs continuously at 60fps via requestAnimationFrame                                                                                                                                                                                                 |
| SI-02 | User can inject a positive signal into a node by clicking it in Simulate mode                                                                                                                                                                                   |
| SI-03 | User can inject a negative signal by shift-clicking a node in Simulate mode                                                                                                                                                                                     |
| SI-04 | Injected signal propagates along outgoing edges as animated particles                                                                                                                                                                                           |
| SI-05 | Signal polarity is inverted when it traverses a balancing (−) edge                                                                                                                                                                                              |
| SI-06 | Node values are driven only by arriving signals. Stocks remain at whatever value signals have left them; there is no intrinsic decay. Only a genuine balancing loop — a negative-polarity feedback path — brings a stock back toward a lower value. See DR-001. |
| SI-07 | Node visual state reflects current activation level (colour and glow)                                                                                                                                                                                           |
| SI-08 | Signal particles are coloured to indicate positive or negative strength                                                                                                                                                                                         |
| SI-09 | Simulation state can be paused and resumed                                                                                                                                                                                                                      |
| SI-10 | Simulation state can be reset to initial values without clearing the graph                                                                                                                                                                                      |
| SI-11 | Maximum concurrent signals are capped; when the cap is active, affected edges are visually dimmed or flash to indicate saturation                                                                                                                               |
| SI-12 | Each node displays a stock indicator showing current value as a proportion of its **designed** [min, max] range — not the effective constrained range; this keeps the fill scale stable as constraint sources vary; exact visual form is TBD (see §10)          |
| SI-13 | Node values are clamped to [effective_min, effective_max] at the end of each step; signals that would exceed the bounds are absorbed silently                                                                                                                   |
| SI-14 | Delayed edges hold emitted signals in a pending queue at the source node for a number of ticks corresponding to the delay level before releasing them to travel                                                                                                 |
| SI-15 | Signals pending in a delay queue are visually indicated on the source node as a 'charged' or 'primed' state — the timebomb indicator — distinct from active node value; exact visual form is TBD (see §10)                                                      |
| SI-16 | Delay tick counts are derived from simulation time units mapped to days/weeks/months scale; the mapping is a named constant, not a magic number                                                                                                                 |
| SI-17 | A global simulation speed multiplier is always visible in the toolbar, allowing the modeller to compress or expand perceived time without changing delay constants                                                                                              |
| SI-18 | Each node displays a persistent trend indicator (▲/▼/blank) in a fixed position below the node label; the label position does not shift between stable and active trend states — emerged from use 2026-03-31                                                    |
| SI-19 | Delay queue state is visualised as an arc on the left side of the node, mirroring the stock arc on the right; the arc encodes pending signal mass and replaces the timebomb dot — emerged from use 2026-03-31                                                   |

### 4.3 Serialisation

| ID    | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SE-01 | Graph structure is serialisable to a JSON-compatible value type                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| SE-02 | Serialised graph is base64-encoded; it is written to the URL query string only on an explicit Share action, not on every mutation                                                                                                                                                                                                                                                                                                                                                                             |
| SE-03 | Loading a URL with a valid encoded graph restores the graph exactly                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| SE-04 | Serialisation format is versioned                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| SE-05 | Deserialisation of an unknown version produces a descriptive error, not a crash                                                                                                                                                                                                                                                                                                                                                                                                                               |
| SE-06 | A Share button generates the encoded URL and copies it to the clipboard; the URL does not update automatically on mutation                                                                                                                                                                                                                                                                                                                                                                                    |
| SE-07 | The current graph is auto-saved to localStorage on every mutation; on load, if no URL-encoded graph is present, the last saved graph is restored                                                                                                                                                                                                                                                                                                                                                              |
| SE-08 | Each model is assigned a UUID on creation; localStorage key is `swoopy_graph_<id>`; the active model ID is reflected in the URL as `?m=<id>`; opening a `?g=...` shared link loads transiently — the first mutation forks a new local model (new UUID, new `?m=` param) without touching the opener's saved work; legacy `swoopy_graph` key is migrated to a generated ID on first load (DR--20260329--app--model-identity-persistence)                                                                       |
| SE-09 | A New Model action resets the canvas to a blank graph, generates a fresh UUID, updates `swoopy_current_model`, and updates the URL to `?m=<newId>` via `replaceState`; the previous model remains intact in localStorage under its UUID; no confirmation dialog is shown (auto-save guarantees no data loss); Back-button recovery is not supported without a `popstate` handler (deferred) — (DR--20260330--app--new-model-action)                                                                           |
| SE-10 | A welcome overlay is shown once to first-time visitors: displayed when there is no `swoopy_current_model` in localStorage and no `?g=` or `?m=` URL param on load; copy includes a one-line tagline and 2–3 capability bullets; a single "Start building" CTA dismisses the overlay and sets `swoopy_welcomed = true` in localStorage to prevent re-display; the overlay is not shown on subsequent bare-URL visits, on `?m=` direct links, or on `?g=` shared links; keyboard-accessible (Escape to dismiss) |

### 4.4 Modes

The editor operates in one of five mutually exclusive modes. Mode is always visible in the toolbar.

| Mode     | Behaviour                                                                                                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Select   | Click to select a node or edge. Drag a node to reposition it. Double-click a node to open its config popover. Double-click an edge badge/region to configure polarity, delay, or weight. |
| Add Node | Click empty canvas to create a node. Double-click an existing node to open its config popover.                                                                                           |
| Add Edge | Drag from node to node to create an edge. Double-click edge regions to configure.                                                                                                        |
| Simulate | Click node to inject positive signal. Shift-click to inject negative. Double-click has no effect.                                                                                        |
| Delete   | Click a node to remove it and its edges. Click an edge to remove it.                                                                                                                     |

#### GE-32 — Transient / spring-loaded mode switching (emerged from use)

Spring-loaded modes are ephemeral sub-modes triggered by Shift and cancelled on release. They do not appear in the toolbar as named modes. Spring-loading is only available when NOT already in a spring state (`previousMode === null`) and NOT in Simulate mode (which reserves Shift for inject direction).

| Gesture                                               | Behaviour                                                                                                                                 |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Shift-down on node (non-simulate, non-spring)         | Enters spring Add Edge mode from that node; drag to target. Release on a different node creates a causal edge. Release elsewhere cancels. |
| Shift+Option-down on node                             | Same as above but release on a different node creates a constraint edge (opens kind picker).                                              |
| Shift-down on blank canvas (non-simulate, non-spring) | Enters spring Add Node mode. The next pointer-down creates a node and exits spring mode.                                                  |
| Shift-up (while in spring mode)                       | Exits spring mode; returns to previous mode. No side effect if no valid target was reached.                                               |
| Space (tap)                                           | Toggles simulation running/paused. Switches to Simulate mode if not already there.                                                        |
| Escape (while in spring mode)                         | Exits spring mode; returns to previous mode.                                                                                              |
| Escape (not in spring mode)                           | Returns to Select mode.                                                                                                                   |

#### GE-33 — Toolbar spring-loaded visual feedback (emerged from use)

The toolbar mode buttons must reflect spring-loaded state with a visually distinct style so the user can see that a temporary mode is active.

| State                                        | Toolbar behaviour                                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Persistent mode (normal)                     | Active mode button: filled background (`#334155`), bold weight                                           |
| Spring-loaded mode (`previousMode !== null`) | Active mode button: amber outline border (`#f59e0b`), no fill — signals "this will return when released" |
| Space tap (→ simulate mode, sticky)          | R button shows filled/active style; play/pause control appears in toolbar                                |

---

## 5. Non-Functional Requirements

### 5.1 Performance

- Simulation step and canvas draw must complete within a single 16ms frame budget at 60fps
- No React re-renders must occur during simulation ticks; React renders only on structural graph changes
- Signal cap must be determined by characterisation test, not by intuition (see §7)

### 5.2 Correctness

- Node values must be clamped to [min, max] after each step, including after signal arrival
- Relay propagation must fan out on all outgoing causal edges of the destination node when `hopsRemaining > 0`
- Polarity inversion must be applied at the edge, not at the emitting node

### 5.3 Testability

- Engine package must have zero browser or framework dependencies
- All engine functions must be pure (same inputs → same outputs, no side effects)
- Hit testing and curve geometry must be testable without a canvas instance
- Canonical integration test: Population/Births/Deaths seed graph, positive injection into Population, assert reinforcing loop amplifies and balancing loop damps within N ticks

### 5.4 Maintainability

- Strict TypeScript throughout; `any` is a build error
- Branded primitive types for NodeId and EdgeId to prevent accidental string substitution
- All domain types defined in the engine package; no domain logic in the app package

---

## 6. Architecture

### 6.1 Package structure

```plaintext
packages/
  engine/     Pure TS. Graph types, step(), inject(), serialize(), deserialize(), geometry.
  renderer/   Canvas 2D + RAF loop. LoopyRenderer class. Hit testing bridge to store.
  app/        React + Vite. Zustand store. Toolbar. Label editor. URL sync.
```

### 6.2 State boundary

Two Zustand slices, readable from both React and the RAF loop:

- `graphSlice` — nodes, edges, editor mode, selected ID. React subscribes for UI updates.
- `simSlice` — signals, node values, running state. Renderer reads via `getState()` each frame; React does not subscribe.

The RAF loop must never trigger React re-renders. React must never own simulation tick logic.

### 6.3 Renderer contract

The renderer is instantiated once on canvas mount, receives a canvas ref and the store, and manages its own lifecycle. React does not re-mount the renderer on prop or state changes.

```plaintext
LoopyRenderer
  start()           begin RAF loop
  stop()            cancel RAF loop
  hitTest(x, y)     return HitTarget | null
```

Pointer events from the canvas are translated to store actions via hit test results. They do not pass through React's synthetic event system.

### 6.4 Serialisation

Graph serialisation lives entirely in the engine package. The app's URL sync hook calls `serialize()` on graph changes and `deserialize()` on load. The router does not own serialisation logic.

---

## 7. Engine Specification

### 7.1 Node type

```ts
interface Node {
  readonly id: NodeId;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly min: number; // default 0
  readonly max: number; // default 10
  readonly initial: number; // reset value (used by makeInitialSim and Reset button); default 0
}
```

`initial` must satisfy `min ≤ initial ≤ max`. Deserialisation must enforce this invariant.

### 7.2 step(graph, sim, dt) → SimState

1. Resolve constraint edges: for each node, collect all incoming constraint edges and compute:
   - `effective_max = min(target.max, ...source.value for all ceiling constraints)`
   - `effective_min = max(target.min, ...source.value for all floor constraints)`
   - If `effective_min > effective_max`: floor wins — pin the node to `effective_min`
   - Otherwise clamp current value to `[effective_min, effective_max]`
   - _(This pre-clamp ensures the node enters the step within its constrained range before arrivals are applied)_
2. Snapshot `nodeValues` as `displayPrevNodeValues` (renderer trend arrows read this)
3. Advance all signal progress values by `SIGNAL_SPEED × dt`
4. For each arrived signal (progress ≥ 1):
   - Apply to destination: `node.value += signal.strength × edge.polarity`
   - If `signal.hopsRemaining > 0`: emit relay fragments on all outgoing causal edges of the
     destination with `hopsRemaining = signal.hopsRemaining − 1` (relay propagation model —
     DR--20260401--engine--relay-propagation-model)
5. Clamp all node values to their effective max and min as recomputed from current constraint source values
   - _(Re-clamping here is necessary: arrivals in step 4 may have pushed values outside the constrained range)_
6. Decrement pending queue counters by 1; release signals whose counter reaches 0 into the travelling queue
7. Cap total travelling signal count at MAX_SIGNALS, preferring signals with highest progress

**Relay fragment emission** (shared by `inject()` and step arrival relay):

- `weight === 0`: no fragment emitted
- `weight < 1`: 1 fragment of `strength = signal.strength × weight` (attenuation)
- `weight ≥ 1`: let `count = round(weight)`. Emit `count` fragments each of `strength = signal.strength`,
  staggered by pre-advancing progress: fragment `i` starts at `progress = i / count × (SIGNAL_SPEED × EDGE_TRANSIT_TICKS / 60)`.
  Total effect = `count × strength` (amplitude model — weight controls both visual density AND causal strength).
- Delayed edges (`edge.delay ≠ none`): fragments enter pending queue at
  `ticksRemaining = DELAY_TICKS[delay] + i × floor(EDGE_TRANSIT_TICKS / count)`

`inject(sim, graph, nodeId, strength)` changes the node value and emits relay fragments immediately
(before the next step); signals carry `hopsRemaining = MAX_HOPS`.

The pending queue is part of `SimState`, not `Graph`. Resetting the simulation clears both queues. Constraint edges are not part of the signal queues — they are resolved fresh each step from current node values.

### 7.3 Delay levels and tick mapping

| Level  | Marks        | Simulation ticks   | Human scale |
| ------ | ------------ | ------------------ | ----------- |
| none   | —            | 0                  | immediate   |
| short  | \|\|         | DELAY_TICKS_SHORT  | days        |
| medium | \|\|\|\|     | DELAY_TICKS_MEDIUM | weeks       |
| long   | \|\|\|\|\|\| | DELAY_TICKS_LONG   | months      |

Tick constants are named and committed alongside a comment explaining the intended human-scale mapping. The simulation has no concept of real time — the mapping is a communication convention for the modeller, not a simulation invariant.

### 7.4 inject(sim, graph, nodeId, strength) → SimState

Returns a new SimState with the node's value incremented by strength and relay fragments emitted on all outgoing causal edges with `hopsRemaining = MAX_HOPS`. Clamping to [min, max] is applied at the end of the next `step()` call.

### 7.5 Transfer functions (future extension point)

Non-linear relationships between variables are modelled as transfer functions on edges, not on nodes. The relationship is non-linear; the stock is not. The current linear model (`strength × weight × polarity`) is the default and must remain so.

The edge type should be designed with all current and anticipated fields from v1:

```ts
type DelayLevel = "none" | "short" | "medium" | "long";
type EdgeKind = "causal" | "constraint";
type ConstraintKind = "ceiling" | "floor";

interface CausalEdge {
  readonly kind: "causal";
  readonly id: EdgeId;
  readonly from: NodeId;
  readonly to: NodeId;
  readonly polarity: 1 | -1;
  readonly weight: number; // 0–5; see DR--20260328--engine--weight-range-expansion
  readonly delay: DelayLevel; // default 'none'
  readonly transferFn: "linear"; // v1 only; extended in future
}

interface ConstraintEdge {
  readonly kind: "constraint";
  readonly constraintKind: ConstraintKind; // 'ceiling' or 'floor'
  readonly id: EdgeId;
  readonly from: NodeId;
  readonly to: NodeId;
  // no polarity, weight, delay, or transferFn
}

type Edge = CausalEdge | ConstraintEdge;

interface PendingSignal {
  readonly signal: Signal;
  readonly ticksRemaining: number;
}

interface Signal {
  readonly id: string;
  readonly edgeId: EdgeId;
  readonly progress: number;
  readonly strength: number;
  readonly hopsRemaining: number; // decremented per edge traversal; relay stops at 0
}

interface SimState {
  readonly signals: ReadonlyArray<Signal>; // travelling
  readonly pending: ReadonlyArray<PendingSignal>; // held at source (delay or stagger)
  readonly nodeValues: ReadonlyMap<NodeId, number>;
  readonly displayPrevNodeValues: ReadonlyMap<NodeId, number>; // renderer trend arrows (SI-12)
  readonly tick: number;
}
```

When non-linear transfer functions are introduced, candidates include sigmoid (soft saturation), threshold (signal only passes above a value), and exponential (amplifying). These will require the transfer function to receive the destination node's current value as context, which `step()` already has access to. No architectural change to `step()` is anticipated — only the per-edge application in step 4 above changes.

### 7.6 Constants (subject to characterisation tests)

| Constant           | Value | Rationale                                                                                                                                  |
| ------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| SIGNAL_SPEED       | 0.65  | Visually legible at typical edge lengths                                                                                                   |
| INJECT_STRENGTH    | 1.0   | One click = 1 unit = 10% of default 0–10 range; meaningful nudge without saturating immediately                                            |
| EDGE_TRANSIT_TICKS | 92    | Edge transit time in ticks at 60fps; used to space staggered fragments evenly along an edge                                                |
| MAX_HOPS           | 8     | Empirical: saturates a 2-node reinforcing loop (inject+8 hops); supports 8-edge causal chains. Set by characterise-relay.ts (DR--20260401) |
| DELAY_TICKS_SHORT  | 30    | Represents days — brief but perceptible at 60fps                                                                                           |
| DELAY_TICKS_MEDIUM | 150   | Represents weeks — noticeably deferred                                                                                                     |
| DELAY_TICKS_LONG   | 600   | Represents months — consequence long after cause                                                                                           |
| MAX_SIGNALS        | 132   | Set by characterisation: 12-node fully-connected graph = 132 edges; ensures no silent signal drop at worst case                            |

### 7.7 Signal cap characterisation test

Build a fully connected reinforcing graph of N nodes. Inject maximum strength. Run for M ticks. Record signal count per tick. MAX_SIGNALS should be set to the 99th percentile of the plateau, not the spike. This test must be committed alongside the constant.

---

## 8. Test Strategy

| Layer             | Tool                  | Focus                                                                                                                                                                                                                                                                                                   |
| ----------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| engine            | Vitest                | Pure unit tests. Every exported function. Property-based tests for serialise/deserialise round-trip. Version migration. Constraint resolution: ceiling, floor, multiple sources, floor-wins tie-break, dynamic source variation.                                                                        |
| renderer/geometry | Vitest                | Hit testing (all edge regions including invisible delay hit region), curve interpolation, arrowhead placement. No canvas required.                                                                                                                                                                      |
| app/store         | Vitest                | Zustand slice actions in isolation. Undo/redo stack: mutations record, undo restores, redo replays. localStorage read/write.                                                                                                                                                                            |
| app/ui            | React Testing Library | Toolbar mode switching (five modes). Node popover open/close/commit. Share button clipboard write. Mock renderer.                                                                                                                                                                                       |
| integration       | Vitest                | Seed graph scenarios. Canonical Population model. Signal cap behaviour. Delay queue release timing. Constraint ceiling pins node below designed max. Constraint floor lifts node above initial. Floor-wins when floor > ceiling. Round-trip: mutate → serialise → deserialise → assert graph identical. |

No canvas drawing is tested. Visual correctness is validated by inspection against the prototype.

---

## 9. Risks and Mitigations

| Risk                                                                           | Likelihood | Impact | Mitigation                                                                                   |
| ------------------------------------------------------------------------------ | ---------- | ------ | -------------------------------------------------------------------------------------------- |
| Reinforcing loops produce exponential signal growth                            | High       | High   | MAX_SIGNALS cap + characterisation test                                                      |
| React re-renders during RAF causing frame drops                                | Medium     | High   | Strict Zustand slice boundary; no sim state in React state                                   |
| Serialisation format churn breaking shared URLs                                | Medium     | Medium | Version field from day one; migration function per version                                   |
| Hit testing imprecision on high-DPR displays                                   | Medium     | Low    | Hit test operates in CSS pixels; DPR applied only at draw time                               |
| dt spike on tab wake causing simulation jump                                   | Low        | Medium | Cap dt at 50ms per frame                                                                     |
| Pending queue accumulates unboundedly on long-delay edges in reinforcing loops | Medium     | High   | Pending queue subject to same MAX_SIGNALS cap as travelling signals                          |
| Delay tick constants feel wrong at different simulation speeds                 | Medium     | Medium | Expose a global simulation speed multiplier so modellers can tune without changing constants |

---

## 10. Open Questions

These are finer design decisions deferred pending prototyping or further discussion.

**Edge weight UI (GE-19)**
Weight is a continuous 0–1 value. A popover is confirmed; the control inside it is open. Options: a graded slider with snap points (0.25, 0.5, 0.75, 1.0); a continuous slider; a numeric input. Snap points may be more usable in a workshop context — is fine-grained precision actually needed?

**Node boundary indicator**
Two distinct saturation states need visual differentiation: (a) natural saturation — node value is at or near its designed max; (b) constraint saturation — node is pinned below its designed max by an active constraint. Both benefit from a boundary indicator (bump, halo, colour shift on node boundary), but they communicate different things to the facilitator. Natural saturation means the stock is full; constraint saturation means the stock is being held down by an external limit that could be relaxed. The visual treatment should distinguish these, or at minimum not conflate them. To be explored in prototype.

**Min / max / initial control in the popover**
A two-point range slider would let users set min and max simultaneously with a natural gesture, with initial as a third point constrained between them. Default is **0–10, initial 0**; each click injection adds 1 unit — ten distinguishable states, one click is a meaningful nudge. False precision of 0–100 is inappropriate for qualitative organisational variables. To be validated in first facilitated use session; range is user-configurable per node so the default can be revised without architectural change.

**Stock indicator visual form (SI-12) — resolved**
Stock arc (fill ratio 0–1, right side of node ring) + persistent trend arrow (▲/▼, held for 2s, below label). Implemented in SI-12, SI-18.

**Timebomb indicator visual form (SI-15) — resolved**
Delay queue arc on the left side of the node ring, mirroring the stock arc. Encodes pending signal mass relative to node max. Implemented in SI-15, SI-19.

---

## Appendix A — Seed Graph (canonical integration test fixture)

Population/Births/Deaths — a minimal Limits to Growth archetype.

**Nodes** (all use default range unless stated):

| Node       | min | max | initial |
| ---------- | --- | --- | ------- |
| Population | 0   | 10  | 5       |
| Births     | 0   | 10  | 0       |
| Deaths     | 0   | 10  | 0       |

**Edges:**

```plaintext
Population → Births     (causal, polarity: +, weight: 1.0, delay: none)
Births     → Population (causal, polarity: +, weight: 1.0, delay: none)  ← reinforcing loop
Population → Deaths     (causal, polarity: +, weight: 1.0, delay: none)
Deaths     → Population (causal, polarity: −, weight: 1.0, delay: none)  ← balancing loop
```

Population starts at 5 (mid-range) so both positive and negative injections produce observable behaviour without immediately hitting a boundary.

**Expected behaviour on positive injection into Population:**

- Births amplify the signal (reinforcing loop)
- Deaths progressively damp the reinforcing effect (balancing loop)
- System reaches a plateau rather than diverging indefinitely

**Expected behaviour on negative injection into Population:**

- Births reduce (reinforcing loop damps further)
- Deaths reduce (balancing loop reduces drag)
- System stabilises at a lower plateau
- Births reduce (reinforcing loop damps further)
- Deaths reduce (balancing loop reduces drag)
- System stabilises at a lower plateau
