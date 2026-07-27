# ADR-003: Background drag-vs-click discrimination via movement threshold, deferred to pointerup

## Status
Accepted

## Context
`Canvas.tsx` currently fires mode-specific background actions (add-node placement, add-annotation
placement, select-mode deselect) **immediately on `pointerdown`** when the hit-test on empty
background returns `null` (see `packages/app/src/Canvas.tsx` lines ~172-237). US-01 (pan) requires
that dragging on the same empty background instead shift the viewport, without triggering that
mode action — but the two gestures share the identical starting condition (pointerdown on empty
background) and are indistinguishable until movement is observed.

DISCUSS forwarded this as an open question: "exact input binding for pan (plain left-drag vs. a
modifier key / middle-mouse-button, given existing mode-specific background-click semantics)."
The feature's Gherkin scenarios constrain the answer: US-01's happy-path scenario says Priya
"presses and drags on an empty area of the canvas background" — no modifier key or alternate mouse
button is mentioned anywhere in the 15 UAT scenarios across US-01/02/03. AC-01e additionally
requires pan to work "consistently across select/add-edge/delete/simulate modes."

## Decision
Plain left-button drag on empty background pans the view, in every mode, with no modifier key.
Discrimination between "click → mode action" and "drag → pan" uses a movement-distance threshold
(4 CSS px, matching common browser/OS drag-start thresholds), evaluated during `pointermove`.

This requires changing *when* background mode-actions commit: instead of firing on `pointerdown`,
the mode action becomes a **pending candidate** on `pointerdown` (recorded, not yet applied) and is
only committed on `pointerup` **if no movement past the threshold occurred**. If movement exceeds
the threshold, the gesture is reclassified as a pan for its remaining lifetime and the pending mode
action is discarded. This mirrors the pattern the codebase already uses for node-drag and
annotation-drag (`hasDragged` flag, committed at `pointerup`) — it extends an established pattern
to a third gesture family (background actions) rather than inventing a new one.

Shift-held background drag (existing "spring-loading" instant-add-node gesture, `Canvas.tsx` lines
158-170) is explicitly excluded from this new pan gate — pan only engages when `!shiftHeld` on
pointerdown, preserving that gesture unchanged.

## Alternatives Considered
1. **Modifier key or middle-mouse-button dedicated to pan** (e.g. Space+drag as in Figma, or
   middle-click-drag as in some Miro flows), leaving left-drag/click on background fully untouched.
   Rejected: contradicts the explicit Gherkin scenario text, which describes a plain drag with no
   modifier in every domain example, and contradicts the JTBD "Habit" force documented in
   `feature-delta.md` ("the habit to honor is 'this behaves like every other canvas tool I already
   know'" — plain background-drag-to-pan is that habit, not a modifier-gated variant of it).
2. **Restrict plain-drag pan to `select` mode only**, require a modifier in other modes. Rejected:
   directly contradicts AC-01e ("pan works consistently across select/add-edge/delete/simulate
   modes without breaking each mode's existing click/drag behaviour") — a mode-restricted pan is a
   different, unrequested feature.
3. **(Chosen) Movement-threshold discrimination, action commit deferred to `pointerup`.** Only
   option compatible with both the plain-drag requirement (Gherkin/Habit) and the
   works-in-every-mode requirement (AC-01e), and it reuses an existing, proven interaction pattern
   in the same file rather than introducing a new one.

## Consequences
**Positive:** pan works identically across every mode with zero new input vocabulary for the user;
extends (does not replace) the existing `hasDragged` click-vs-drag pattern; Shift+drag spring-
loading is unaffected.

**Negative / flagged for DISTILL:** moving add-node/add-annotation/deselect commit timing from
`pointerdown` to `pointerup` is a behavioural change to *when* the action fires (not *whether* it
fires — a stationary click still produces the same outcome, since zero movement occurred). Any
existing `Canvas.test.tsx` scenario that dispatches only a `pointerdown` event (without a matching
`pointerup`) to assert an add-node/add-annotation/deselect outcome will need a `pointerup` dispatch
added to its setup. This is an expected, flagged consequence — a real browser always delivers both
events for a genuine click — not a functional regression, and is called out explicitly in the
handoff to `acceptance-designer` so it is not mistaken for a guardrail-metric breach.
