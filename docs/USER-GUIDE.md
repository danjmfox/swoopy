# User Guide

Swoopy is a tool for building and running causal loop diagrams in a browser. You sketch a model of how things influence each other, inject a disturbance, and watch how the system responds over time.

---

## The basics

A model has two elements:

**Nodes** — variables. Each has a label, a value range (`min` to `max`), and a current value shown by colour and the arc around its edge.

**Edges** — influences between nodes. There are two kinds:
- **Causal edge** — a solid curved arrow; carries a signal from one node to another
- **Constraint edge** — a dashed line; dynamically caps or floors another node's value

---

## Modes

The toolbar at the bottom of the screen controls what your mouse does. The active mode is shown in the toolbar.

| Mode | What clicking / dragging does |
|------|-------------------------------|
| **Select** | Click a node or edge to select it. Drag a node to reposition it. Double-click to configure. |
| **Add Node** | Click empty canvas to create a node. Double-click an existing node to rename or configure it. |
| **Add Edge** | Drag from one node to another to draw a causal edge. Hold **Alt** while dragging to draw a constraint edge instead. |
| **Simulate** | Click a node to inject a positive signal. Shift-click to inject a negative one. |
| **Delete** | Click a node or edge to remove it. Deleting a node removes all its connected edges. |

---

## Building a model

### Add a node

Switch to **Add Node** mode, then click the canvas. A node appears with a default label. Double-click it to set the label and configure its range.

### Configure a node

Double-click any node (in any mode) to open its popover:

| Field | Meaning |
|-------|---------|
| Label | What this variable is called |
| Min | The lowest value this variable can reach |
| Max | The highest value it can reach |
| Initial | Where it starts; also the value restored by the Reset button |

### Draw a causal edge

Switch to **Add Edge** mode, then drag from one node to another. The arrow direction shows which node influences which.

A new edge is reinforcing (`+`) by default. To configure it:

| Region on the edge | Double-click action |
|--------------------|---------------------|
| Polarity badge (`+` / `−`) at the midpoint | Toggle reinforcing / balancing |
| Delay marks (if any) — left of centre | Cycle delay: none → `‖` (days) → `‖‖` (weeks) → `‖‖‖` (months) → none |
| Weight region — right of centre | Open weight popover (0–1); lower weight = weaker signal |

### Draw a constraint edge

Hold **Alt** and drag from one node to another in **Add Edge** mode. On release, choose:

- **Ceiling ⌈** — the source node's current value becomes the upper limit of the target
- **Floor ⌊** — the source node's current value becomes the lower limit of the target

Constraint edges are dashed lines with a `⌈` or `⌊` label. They have no arrowhead and carry no signals — they reshape the effective range of the target as the simulation runs.

---

## Running the simulation

Switch to **Simulate** mode.

- **Click** a node to inject a positive signal (things are going well)
- **Shift-click** a node to inject a negative signal (things are going badly)

Watch signals travel along edges as small coloured dots:
- Blue dot — positive signal
- Red dot — negative signal

A signal crossing a balancing (`−`) edge **reverses its polarity**. This is how self-correcting loops work: a positive push eventually comes back as a negative one.

> **Stocks stay where signals leave them.** There is no automatic decay. A node injected with a positive signal stays elevated until a negative signal brings it back down. If your model has only reinforcing loops, stocks will climb to their maximum and stay there — that is the correct behaviour, showing you that no corrective mechanism exists in your model.

### Simulation controls

| Control | Action |
|---------|--------|
| ⏸ / ▶ | Pause and resume the simulation |
| ↺ | Reset all node values to their initial settings; clear all signals |
| Speed: `0.25×` `0.5×` `1×` `2×` `4×` | Compress or expand time — useful for observing slow delay effects quickly |

---

## Reading the visuals

### Node colour

Nodes shift from blue (low value) through to warm red (high value), relative to their `[min, max]` range.

### Stock arc

A thin arc around the inside of each node ring shows the node's current value as a proportion of its range:

| Colour | Meaning |
|--------|---------|
| Green | Value is in the lower quarter of its range |
| Yellow | Value is in the middle of its range |
| Orange | Value is in the upper quarter — approaching its maximum |

### Trend arrow

A small arrow inside the node label area shows the recent direction of change:

- `▲` — value is rising
- `▼` — value is falling

### Timebomb dot

An orange dot in the upper-right of a node means signals are queued at a delayed outgoing edge — they have been emitted but not yet released. The brighter the dot, the more signal is banked up. Expect a delayed effect.

### Edge dimming

When many signals are travelling on the same edge simultaneously, the edge dims. This indicates the edge is near its signal capacity; further injections on this path will have diminishing visual effect.

### Constraint edge labels

A `⌈` label on a dashed line means ceiling constraint. A `⌊` means floor constraint.

---

## Keyboard shortcuts

These work when the canvas has focus (click the canvas first if shortcuts are not responding).

| Key | Action |
|-----|--------|
| `Tab` | Cycle keyboard focus through nodes |
| `Arrow keys` | Nudge the focused node |
| `Delete` | Remove the focused node |
| `Ctrl Z` | Undo |
| `Ctrl Shift Z` | Redo |

---

## Sharing a model

The toolbar includes a **Share** button. Clicking it encodes the current graph into the URL and copies it to the clipboard. Send that URL to anyone and they will open the same model.

> The URL is generated on demand — it does not update automatically as you edit.

Your model is also auto-saved to browser storage. If you close and reopen the tab (with no URL), your last model is restored.

---

## What the simulation does not do

Swoopy is a thinking tool, not a predictive model. Node values are qualitative proxies — a value of 7 means "high relative to the range", not a real measurement. The dynamics are real (reinforcing loops do amplify, delays do cause oscillation) but the numbers are not.

Things it does not currently model:
- Rate constraints ("only N hires per month regardless of budget") — the ceiling/floor constraints cap values, not rates
- Interaction effects — a variable that changes the *strength* of a relationship between two others
- Goals and threshold reactions
- Annotation (assumptions, quick-fix markers, goals on the diagram)

These are [documented limitations](PRD.md#out-of-scope-v1), not bugs.
