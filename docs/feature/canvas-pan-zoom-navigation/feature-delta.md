# Feature Delta — canvas-pan-zoom-navigation

<!-- markdownlint-disable MD024 -->

Add canvas navigation to Swoopy — pan/move the viewport and zoom in/out, Miro/Figma-style
(drag-to-pan, wheel/pinch-to-zoom, reset-to-fit). Brownfield: `packages/renderer` (canvas 2D +
RAF loop, hit-testing) and `packages/app` (Zustand store, React UI) are mature and unchanged in
this DISCUSS wave — no production code touched.

**Density**: project default is lean + `ask-intelligent` (per `~/.nwave/global-config.json`).
Checked all `ask-intelligent` triggers against this feature's artifacts: cross-context complexity
(2 bounded contexts — renderer, app — not ≥3), multi-stakeholder (1 persona, not ≥3),
compliance/regulatory (none), WS strategy = D (not applicable, no config-switching walking
skeleton). **No trigger fired** — Tier-2 catalog stays collapsed except one section below, which
the user pre-authorized directly (not via the trigger mechanism): full JTBD analysis, per the
user's explicit "Full nWave DISCUSS" selection for this feature. That section is marked `[WHY]`
below to keep the tiering honest; every other section is `[REF]` (Tier-1, always emitted).

---

## Wave: DISCUSS

### [REF] Prior-wave reading confirmation

- ✓ `docs/product/vision.md` — read; primary persona (facilitator/coach/educator) and "conversation
  while building" value proposition confirmed.
- ✓ `docs/product/jobs.yaml` — read; 3 existing jobs, none covering canvas navigation directly.
- ✓ `docs/product/architecture/brief.md` — read; driving ports for `packages/renderer` and
  `packages/app/src/store.ts`, plus the "no test touches the renderer directly" constraint.
- ⊘ `docs/feature/canvas-pan-zoom-navigation/discover/` — not found (no DISCOVER wave).
- ⊘ `docs/feature/canvas-pan-zoom-navigation/diverge/recommendation.md` — not found (no DIVERGE
  wave).
- ⊘ `docs/feature/canvas-pan-zoom-navigation/diverge/job-analysis.md` — not found.
- ⊘ `docs/project-brief.md`, `docs/stakeholders.yaml` — do not exist in this project (confirmed by
  orchestrator; not re-checked).

No contradictions to reconcile — this feature has no upstream DISCOVER/DIVERGE assumptions to
compare against. This absence is itself tracked as a risk (see Pre-requisites section and
`discuss/wave-decisions.md`).

Also read directly (not part of the mandated prior-wave list, but necessary to ground the Walking
Skeleton decision and shared-artifact tracking in the real architecture): `packages/renderer/src/
LoopyRenderer.ts`, `packages/renderer/src/hitTest.ts`, `packages/app/src/Canvas.tsx`. Confirmed:
the renderer currently applies only a DPR (device-pixel-ratio) transform at draw time — there is
no pan/zoom transform anywhere in the stack today, and `hitTest()` operates directly on raw
canvas-relative CSS pixel coordinates. Every pointer handler in `Canvas.tsx` computes graph-space
coordinates as `e.clientX - rect.left` / `e.clientY - rect.top` with no conversion step.

### [REF] Persona

**Priya Raman** — agile coach facilitating a remote systems-thinking workshop for a 6-person
product team over video call, screen-sharing Swoopy live. Secondary example persona used in
domain examples below: **Devon Okafor**, a solo practitioner who opens a colleague's shared model
URL on a laptop.

---

### [WHY] JTBD Full Analysis (pre-authorized expansion — Phase 1)

_Rendered because the user explicitly selected "Full nWave DISCUSS" for JTBD on this feature —
not because an `ask-intelligent` trigger fired. No other Tier-2 section is expanded._

#### Job Story

> When my causal loop diagram grows beyond what fits on one screen during a live facilitation
> session, I want to pan and zoom the canvas smoothly and always be able to snap back to a full,
> readable view, so I can keep working with any part of the model and keep the group oriented
> without ever pausing to reload the page.

Job ID: `navigate-diagram-viewport` (added to `docs/product/jobs.yaml`).

#### Job Dimensions

| Dimension      | Description                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Functional** | Move the viewport and adjust zoom level to bring any node or region into view, without altering the underlying model data.                                                                  |
| **Emotional**  | Feel in control and unhurried while manipulating the view in front of a live audience — never fumbling, never visibly "lost."                                                               |
| **Social**     | Appear fluent and competent to the group being facilitated. A facilitator who visibly struggles with the canvas ("hold on, let me reload...") undermines their own credibility mid-session. |

#### Four Forces

| Force       | Description                                                                                                                                                                                                                                                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Push**    | The canvas has no camera today — it renders the full graph at a single fixed scale in a single fixed position. A diagram that grows past ~12 nodes, or a shared model built on a wider monitor, can place nodes outside the visible canvas with no way to reach them short of resizing the browser window or reloading.                                                     |
| **Pull**    | A smooth, familiar drag-to-pan / scroll-to-zoom interaction (Miro, Figma, Google Maps) that requires zero training and "just works" the first time, in real time, without breaking the facilitator's flow.                                                                                                                                                                  |
| **Anxiety** | "What if I pan or zoom too far and can't find my way back to a readable view?" — fear of getting the canvas into an unrecoverable, disoriented state in front of the group mid-session.                                                                                                                                                                                     |
| **Habit**   | Facilitators already carry Miro/Figma/Maps muscle memory — they will instinctively try dragging the background and scrolling the wheel before reading any instructions. The habit to honor is "this behaves like every other canvas tool I already know." The habit to _break_ is today's silent no-op: dragging the background or scrolling currently does nothing at all. |

#### One-Job Decision (opportunity scoring skipped)

Pan, zoom, and reset-to-fit were evaluated as candidate _separate_ jobs (per task framing) and
judged to be **one job with three sub-motivations**, not three jobs: all three share the identical
Push (no camera → unreachable content) and the identical desired outcome (stay oriented without
interrupting the session). They differ only in _when_ they're invoked (content off-screen → pan;
need more/less detail → zoom; feeling lost → reset), not in underlying motivation. Opportunity
scoring (importance × satisfaction-gap ranking) is skipped because it requires **multiple**
distinct jobs to rank against each other — with one job identified, the "opportunity" is simply:
maximal importance (blocks the primary `explore-system-dynamics` job at realistic diagram sizes)
× maximal satisfaction gap (0% — the capability does not exist today).

This job does not replace or duplicate `explore-system-dynamics` (build-and-run-model journey) —
it is an _enabling_ capability for that job once diagrams grow past what fits in one viewport.

#### JTBD-to-Story Bridge

| Sub-motivation                                          | User Story              | Job dimension emphasized                     |
| ------------------------------------------------------- | ----------------------- | -------------------------------------------- |
| "I need to see content that's off-screen"               | US-01 Pan the canvas    | Functional                                   |
| "I need more/less detail without losing my place"       | US-02 Zoom in/out       | Functional + Emotional                       |
| "I've lost my bearings — get me back to a working view" | US-03 Reset view to fit | Emotional (Anxiety force directly addressed) |

---

### [REF] Scope Assessment

Oversized-feature signals checked (any 2+ triggers the split gate):

| Signal                              | Threshold | Actual                                                                                                                       | Triggered? |
| ----------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------- |
| User stories                        | >10       | 3                                                                                                                            | No         |
| Bounded contexts / modules          | >3        | 2 (`packages/renderer`, `packages/app`)                                                                                      | No         |
| Walking skeleton integration points | >5        | 0 (no separate WS phase — see below)                                                                                         | No         |
| Estimated effort                    | >2 weeks  | ~3 days (3 slices × ~1 day)                                                                                                  | No         |
| Independently shippable outcomes    | multiple  | 0 — zoom and reset both depend on pan's shared transform; none of the three ships value alone as a separate product decision | No         |

**Scope Assessment: PASS — 3 stories, 2 bounded contexts, estimated 3 days.** No split proposed.

---

### [REF] Walking Skeleton Decision

**Decision: no separate walking-skeleton slice.** Slice 1 (drag-to-pan, `slices/
slice-01-drag-to-pan.md`) serves as the thinnest end-to-end proof of the one architectural risk
this feature carries.

**Reasoning:**

1. The textbook Walking Skeleton rule (user-story-mapping skill) asks for one thin task per
   backbone activity (pan / zoom / reset) drawn as a single horizontal line. A literal reading
   would add a fourth, throwaway slice: stub buttons for a fixed-direction nudge-pan, a
   fixed-increment zoom, and a no-op reset — proving each activity exists before building the real
   gesture-driven versions.
2. That literal skeleton is **not warranted here** because pan, zoom, and reset do not carry three
   independent integration risks — they share exactly **one** risk: whether the viewport transform
   threads consistently through `store.ts` → renderer `draw()` → `hitTest()` → Canvas.tsx pointer
   handlers. Zoom (slice 2) is an additive scale term on the same transform slice 1 establishes;
   reset (slice 3) writes to the same viewport state via a bounding-box calculation. Neither
   introduces a new integration surface.
3. `packages/renderer` and `packages/app/src/store.ts` are mature, tested, brownfield code (per
   `docs/product/architecture/brief.md`) — the risk this feature adds is confined to _threading a
   new transform through proven code_, not _proving new architectural layers connect at all_ (the
   purpose a Walking Skeleton exists to serve). This matches the option "isolated enough to build
   directly" from the feature brief.
4. **This is a flagged deviation, not a silent skip** (per project standing orders: "flag rather
   than silently skip"). If slice 1's learning hypothesis fails — i.e. threading the transform
   through `hitTest()` and existing pointer handlers turns out to require restructuring rather than
   layering on top — the plan is to stop, insert a true minimal skeleton (stub pan/zoom/reset
   buttons with no gesture handling) to re-derisk cheaply, and only then resume slices 2–3.

Locked as **[D3]** in `discuss/wave-decisions.md`.

---

### [REF] Journey — Mental Model, Happy Path, Emotional Arc

**Mental model** (borrowed directly from Miro/Figma per the feature's explicit reference point,
per Discovery Methodology Phase 2): Priya expects the canvas background to behave like every other
infinite-canvas tool she's used — drag empty space to move the "camera," scroll or pinch to zoom,
and some standard way to "zoom to fit" everything back into frame. She does not expect dragging a
_node_ to pan the view (that already moves the node), and she does not expect clicking blank space
in "add node" mode to suddenly pan instead of placing a node.

**Happy path (ASCII flow with emotional annotations):**

```text
[Trigger]                  [Step 1: Pan]              [Step 2: Zoom]             [Step 3: Reset]            [Goal]
Diagram grows past    -->  Drag empty canvas     -->  Scroll/pinch to        --> Click "Reset View"    --> Session continues
visible viewport            background                adjust detail level                                  uninterrupted

Feels: mildly anxious      Feels: focused,            Feels: engaged,            Feels: relieved,           Feels: confident,
 ("will this behave         testing intuition           in control                 re-oriented                in control
  like Miro?")
Sees: nodes near/past      Sees: whole diagram        Sees: view scales          Sees: full diagram         Sees: group never
 screen edge                 slides under cursor;       around cursor position;    snaps into one             notices a hiccup
                             off-screen nodes           labels stay legible        readable, fit view
                             reappear

Artifacts: node x/y        Artifacts: ${viewport.     Artifacts: ${viewport.    Artifacts: viewport
 (model, unchanged           panX}/${viewport.panY}     zoom} (store.ts)          reset to bounding-box
 throughout)                 (store.ts)                                           of all nodes (store.ts)
```

**Emotional arc**: start (mildly anxious/curious) → middle (focused, then briefly disoriented at
the error-path extremes) → end (confident, re-oriented). Confidence recovers via Reset View
specifically — no other step in the happy path is allowed to leave Priya more lost than she
started, which is why Reset View is a hard requirement (not deferred) rather than a nice-to-have.

Gherkin scenarios for this journey are the UAT scenarios embedded per story below — US-01
scenarios 1–2 cover the happy-path pan step, US-02 scenarios 1–2 cover the happy-path zoom step,
and US-03 scenarios 1–2 cover both identified error paths (not duplicated here to keep this
section lean; see [REF] User Stories).

---

### [REF] Shared Artifacts Registry

| Artifact                                         | Source of truth                                                              | Consumers                                                                                                                                                                                                                                                                         | Owner                             | Integration risk                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `viewport` (`panX`, `panY`, `zoom`)              | `packages/app/src/store.ts` (new state slice, exact shape a DESIGN decision) | Renderer `LoopyRenderer.draw()` (applies transform before drawing); `Canvas.tsx` pointer handlers (`onPointerDown/Move/Up`, wheel) — must convert screen→graph coordinates using current viewport before every existing `hitTest()` call; a new Reset View control (reads/writes) | `packages/app/src/store.ts`       | **HIGH** — if the renderer's draw-time transform and Canvas.tsx's hit-test coordinate conversion ever diverge (e.g. one applies zoom, the other doesn't), every click hits the wrong node. This is the single most important integration point in the feature. Validated by: US-01 scenario 5, US-02 scenario 5 ("hit-testing remains accurate after panning / at any zoom level"). |
| Node coordinates (`x`, `y` in graph/model space) | `Graph.nodes[].x/y` in `packages/engine` (unchanged by this feature)         | Renderer draw (via transform), `hitTest` (via inverse transform), existing store mutations (`moveNode`, `nudgeNode` — unchanged)                                                                                                                                                  | `packages/engine` (`Graph` model) | **MEDIUM** — this feature must never write pan/zoom-adjusted coordinates back into `node.x/y`. Protected by AC-01b, AC-02e, AC-03d ("panning/zooming/reset never changes stored coordinates").                                                                                                                                                                                      |

Every `${variable}` above has one documented source and one owner — no artifact lacks a source.

---

### [REF] Error Paths

Per the feature brief's explicitly-scoped key error paths (lightweight UX depth — not exhaustive):

1. **Zoomed out too far to see anything** — Priya scrolls to zoom out repeatedly until all nodes
   are unreadable dots. Recovery: Reset View (US-03 scenario 1). Zoom is also clamped at a minimum
   (US-02 AC-02b) so the diagram never shrinks to zero/invisible scale even before Reset is used.
2. **Panned a node off-screen and lost track of it** — Devon pans far in one direction chasing a
   specific node and loses spatial reference entirely (doesn't know which direction to pan back).
   Recovery: Reset View (US-03 scenario 2), which fits the whole diagram back into frame regardless
   of how far the pan drifted.

Both error paths converge on the same recovery mechanism (Reset View) — this is why US-03 is a
hard requirement rather than a deferred nice-to-have (see Walking Skeleton / emotional-arc
rationale above).

---

### [REF] Story Map

**Backbone** (3 activities, matching the JTBD sub-motivations):

| Activity 1: See more of the diagram (Pan) | Activity 2: Adjust detail level (Zoom)   | Activity 3: Recover a known-good view (Reset) |
| ----------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| Drag empty background to shift viewport   | Scroll/pinch to zoom, centered on cursor | Click/press Reset View to fit whole diagram   |

**Walking skeleton**: none separate — see Walking Skeleton Decision above. Slice 1 (Pan) is the
thin end-to-end proof; slices 2–3 build additively on the same viewport-state/transform.

**Release 1 (only release — feature ships as one coherent increment):**
Slice 01 (pan) → Slice 02 (zoom) → Slice 03 (reset). All three ship together as one feature
release; splitting into separate _shipped_ releases isn't meaningful here because pan alone
without zoom/reset leaves the Anxiety force (getting lost) unaddressed, and zoom alone without
pan doesn't solve the off-screen-node problem. Sequencing below is about _build and learning_
order, not staged release.

---

### [REF] Priority Rationale

| Priority | Slice            | Rationale                                                                                                                                                                                                                                                                                                               |
| -------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1st      | Slice 01 — Pan   | Highest learning leverage: proves the shared transform threads through the mature render/hit-test stack (the one real architectural risk in this feature). If this fails cheaply here, every later slice is cheaper to fix. Also the most severe unaddressed pain today (off-screen content is completely unreachable). |
| 2nd      | Slice 02 — Zoom  | Depends on slice 01's transform; second-highest value (lets Priya move between big-picture and detail view) and second-highest risk (zoom-toward-cursor math extends the transform).                                                                                                                                    |
| 3rd      | Slice 03 — Reset | Lowest effort (no new gesture handling, reuses slices 01–02's viewport state) but addresses the strongest emotional force (Anxiety) — sequenced last only because it depends on the other two, not because it matters least.                                                                                            |

Tie-breaking rule applied: Walking Skeleton > Riskiest Assumption > Highest Value — slice 01 wins
on both riskiest-assumption and (in the absence of a separate skeleton) walking-skeleton grounds.

---

### [REF] User Stories

Every story below has `job_id: navigate-diagram-viewport`.

#### US-01: Pan the canvas by dragging

##### Problem

Priya Raman is a facilitator who is 15 minutes into a live systems-thinking session; her diagram
has grown to 14 nodes and 3 of them now sit past the right edge of her visible canvas. She finds
it impossible to reach those nodes — the canvas has no way to move the view, so her only
workaround today is resizing her browser window, which disrupts her screen-share layout mid-call.

##### Who

- Facilitator/coach running a live session with a growing diagram | Screen-sharing to a remote
  group | Motivated by never having to pause the conversation to fight the UI

##### Solution

Dragging on an empty area of the canvas background shifts the visible viewport, bringing
off-screen content into view, without moving any node in the underlying model.

##### Domain Examples

1. **Happy path** — Priya Raman, mid-session with a 14-node diagram in "select" mode, has 3 nodes
   positioned right of her visible canvas. She presses and drags on empty background; the whole
   diagram shifts left under her cursor and the 3 hidden nodes come into view.
2. **Edge case** — Devon Okafor opens a colleague's shared model (`?g=...` URL) built on a wide
   monitor; several nodes sit outside his laptop's visible canvas on first load. He drags to pan
   and locates every node without resizing his window.
3. **Error/boundary** — Priya is in "add-node" mode; pressing and dragging on empty background
   must pan the view without also creating an unwanted node as a side effect of the gesture.

##### Elevator Pitch

Before: Priya cannot see nodes that have drifted past the edge of her screen — the canvas has no
way to move the view, so an off-screen node is only reachable by resizing her browser window or
reloading with a smaller diagram.
After: run "click-and-drag on an empty area of the canvas" → sees the whole diagram shift smoothly
under the cursor, bringing previously off-screen nodes into view without moving or losing any
node's position in the model.
Decision enabled: Priya decides whether to keep building where she is or pan over to review or
connect to a node she placed earlier — without interrupting the group's conversation to reload the
page.

##### UAT Scenarios (BDD)

```gherkin
Scenario: Panning reveals nodes that were off-screen
  Given Priya Raman is facilitating a session with a 14-node diagram in "select" mode
  And 3 nodes are positioned to the right of her visible canvas area
  When she presses and drags on an empty area of the canvas background
  Then the entire diagram shifts in the direction of her drag
  And the 3 previously off-screen nodes become visible within the canvas

Scenario: Panning does not alter the model
  Given Priya Raman has panned the view to bring a node into the center of her screen
  When she checks the node's position in the underlying model
  Then the node's stored x/y coordinates are unchanged from before the pan
  And only the viewport has moved, not the diagram itself

Scenario: Node dragging still works after panning
  Given Devon Okafor has panned the view to locate a node that was off-screen
  When he presses and drags that node to a new position
  Then the node moves to the new position exactly under his cursor
  And the pan does not interfere with the node's drag

Scenario: Panning does not trigger mode-specific background actions
  Given Priya Raman is in "add-node" mode
  When she presses and drags on empty canvas background to pan the view
  Then no new node is created as a side effect of the pan gesture
  And the view still shifts to reveal previously hidden content

Scenario: Hit-testing remains accurate after panning
  Given Devon Okafor has panned the view so a node sits in a new screen position
  When he clicks directly on that node at its new screen position
  Then the click is recognized as a hit on that node
  And the node's edit popover opens exactly as it would before any panning occurred
```

##### Acceptance Criteria

- [ ] AC-01a: Dragging on empty canvas background moves the visible viewport in the drag
      direction; all nodes/edges/annotations shift together.
- [ ] AC-01b: Panning never changes any node's, edge's, or annotation's stored coordinates in the
      graph model.
- [ ] AC-01c: After panning, clicking/dragging a node at its new screen position hits that node.
- [ ] AC-01d: Panning does not trigger the active mode's background action (node placement,
      annotation placement, deselect).
- [ ] AC-01e: Pan works consistently across select/add-edge/delete/simulate modes without breaking
      each mode's existing click/drag behaviour.

##### Outcome KPIs

- **Who**: facilitators running diagrams that exceed one screen (12+ nodes)
- **Does what**: locate and interact with an off-screen node without reloading the page
- **By how much**: 100% success rate (0% today — currently impossible without a page reload or
  window resize)
- **Measured by**: acceptance-test suite (AC-01a–e) + usability session with 3–5 facilitators
  building a 15+ node diagram live
- **Baseline**: 0% — any node placed outside current viewport bounds is permanently unreachable
  today short of resizing the window

##### Technical Notes (Optional)

- Viewport state lives in `packages/app/src/store.ts` (existing "all app state in store.ts"
  convention); coordinate transform math lives in `packages/renderer` (existing DR--20260327
  CSS-pixel-geometry ownership) — app must not duplicate transform math.
- Must not break the `vi.mock('@swoopy/renderer', ...)` convention in app-level tests.
- Open question forwarded to DESIGN: exact input binding for pan (plain left-drag vs. a modifier
  key / middle-mouse-button, given existing mode-specific background-click semantics for add-node,
  add-annotation, and deselect). AC above are behavioural, not binding-specific, so this does not
  block DoR.

---

#### US-02: Zoom in and out with wheel or pinch

##### Problem

Priya Raman cannot see more or less detail on her canvas — it always renders at one fixed scale.
A 14-node diagram either overflows her screen, or if she zooms her whole browser to compensate,
every label becomes too small to read on a screen-share.

##### Who

- Facilitator/coach who needs to move between a big-picture recap for the group and detailed
  editing of a dense cluster | Motivated by staying at a legible zoom level throughout a live
  session

##### Solution

Scrolling the mouse wheel, or pinching on a trackpad, changes the zoom level centered on the
cursor position, within clamped minimum/maximum bounds.

##### Domain Examples

1. **Happy path** — Priya scrolls the wheel up while hovering over a cluster of 4 nodes; the view
   zooms in on that cluster without it drifting off-screen.
2. **Edge case** — Devon pinches out on his trackpad to see the "big picture" of a 20-node diagram
   before adding a new node.
3. **Boundary** — Priya scrolls to zoom in repeatedly; zoom stops at a maximum level rather than
   continuing into unreadable or visually broken rendering.

##### Elevator Pitch

Before: Priya cannot see more or less detail — the canvas always renders at a single fixed scale,
so a 14-node diagram either overflows the screen or, if she zooms her whole browser, makes every
label unreadably small.
After: run "scroll the mouse wheel (or pinch on the trackpad) while hovering over the canvas" →
sees the diagram smoothly scale in or out, centered on the cursor, with labels remaining legible
at zoom levels a facilitator would actually use.
Decision enabled: Priya decides whether to zoom out for a big-picture recap for the group or zoom
in to work on a dense cluster of nodes, in real time, without losing her place.

##### UAT Scenarios (BDD)

```gherkin
Scenario: Zooming in centers on the cursor
  Given Priya Raman is viewing a diagram with a cluster of 4 nodes near the left edge of her screen
  When she scrolls the mouse wheel up while her cursor is over that cluster
  Then the view zooms in and the cluster grows larger under her cursor position
  And nodes away from her cursor move further toward the edges of the screen

Scenario: Zooming out reveals the whole structure
  Given Devon Okafor is viewing a 20-node diagram that does not fully fit on screen
  When he performs a pinch-out gesture on his trackpad
  Then the view zooms out and more of the diagram becomes visible
  And all node labels remain legible at the new zoom level

Scenario: Zoom has a maximum limit
  Given Priya Raman repeatedly scrolls to zoom in on a single node
  When she reaches the maximum zoom level
  Then further scroll-up input has no additional zooming effect
  And the node remains fully rendered, readable, and not visually broken

Scenario: Zoom has a minimum limit
  Given Priya Raman repeatedly scrolls to zoom out on her diagram
  When she reaches the minimum zoom level
  Then further scroll-down input has no additional zooming effect
  And every node remains visible at a non-zero, clickable size

Scenario: Hit-testing remains accurate at any zoom level
  Given Devon Okafor has zoomed in to 200% on a specific node
  When he double-clicks that node
  Then the node's edit popover opens for that exact node
  And no neighboring node is mistakenly targeted
```

##### Acceptance Criteria

- [ ] AC-02a: Scroll wheel / trackpad pinch changes zoom level, centered on cursor position.
- [ ] AC-02b: Zoom is clamped to a minimum and maximum level; input beyond bounds has no further
      effect.
- [ ] AC-02c: Node labels and indicators remain legible across the supported zoom range.
- [ ] AC-02d: Hit-testing remains accurate at any zoom level within the supported range.
- [ ] AC-02e: Zooming never changes any node's, edge's, or annotation's stored coordinates.

##### Outcome KPIs

- **Who**: facilitators working with dense diagrams (15+ nodes)
- **Does what**: adjust zoom level to move between a big-picture recap and detailed editing within
  the same session
- **By how much**: ≥2 zoom actions per session on average (evidence the feature is actually used,
  not merely present), with 0 zoom-related hit-testing errors
- **Measured by**: acceptance-test suite (AC-02a–e) + usability session observation
- **Baseline**: N/A — zoom does not exist today

##### Technical Notes (Optional)

- Extends slice 01's transform helper with a scale factor — see slice learning hypothesis in
  `slices/slice-02-wheel-pinch-zoom.md`.
- Zoom-toward-cursor requires converting the cursor's screen position to graph space using the
  _current_ (pre-zoom) transform, then re-deriving pan so that graph point stays fixed under the
  cursor after the scale changes — flagged as a known non-trivial formula for DESIGN, not
  prescribed here.
- Open question forwarded to DESIGN: exact numeric zoom min/max bounds and per-wheel-tick
  increment.

---

#### US-03: Reset view to fit the whole diagram

##### Problem

Once Priya has panned or zoomed away from a readable view, her only way back to a known-good view
of the whole diagram is trial-and-error dragging and scrolling, or reloading the page — which for
a transient (shared-URL) model risks losing unsaved work.

##### Who

- Facilitator/coach who has lost their bearings mid-session (zoomed too far out, or panned away
  chasing a node) | Motivated by recovering instantly, without pausing the group's conversation

##### Solution

A single, always-visible "Reset View" control snaps the viewport to a view containing every node
in the current diagram, fully visible and legible.

##### Domain Examples

1. **Happy path** — Priya has zoomed out so far that all 14 nodes appear as unreadable dots; she
   clicks Reset View and the canvas snaps to a view where every node is fully visible and legible.
2. **Edge case** — Devon panned far away chasing an off-screen node and lost track of where the
   rest of the diagram is; he presses the reset shortcut and the full diagram reappears centered on
   screen.
3. **Boundary** — Priya opens a brand-new, empty diagram (0 nodes) and clicks Reset View — nothing
   breaks; the view returns to a sensible default rather than erroring.

##### Elevator Pitch

Before: Once Priya has panned or zoomed away from a readable view, her only way back is
trial-and-error dragging/scrolling, or reloading the page (which risks losing unsaved work on a
transient shared model).
After: run "click the Reset View control (or press the reset shortcut)" → sees the canvas snap
immediately to a view containing every node in the current diagram, fully visible and readable.
Decision enabled: Priya decides to keep facilitating with confidence, knowing she is always one
click away from a full, readable view of the model — rather than pausing the session to recover
her bearings.

##### UAT Scenarios (BDD)

```gherkin
Scenario: Reset View recovers from zooming out too far
  Given Priya Raman has zoomed out until all 14 nodes are tiny, unreadable dots
  When she activates Reset View
  Then the canvas snaps to a view where every node is fully visible and its label is readable

Scenario: Reset View recovers a node panned off-screen
  Given Devon Okafor panned far in one direction and can no longer see any part of the diagram
  When he activates Reset View
  Then the canvas snaps to a view containing the entire diagram, centered on screen

Scenario: Reset View works on an empty diagram
  Given Priya Raman has just started a brand-new model with zero nodes
  When she activates Reset View
  Then the canvas returns to a default view without error

Scenario: Reset View works with a single node
  Given Priya Raman's diagram currently has exactly one node
  When she activates Reset View
  Then the canvas centers on that node at a readable, non-extreme zoom level

Scenario: Reset View is discoverable without prior instruction
  Given Devon Okafor has never used Swoopy's pan/zoom before and is now visually lost
  When he looks at the canvas UI
  Then he can find and activate a visibly-labelled Reset View control without consulting
    documentation
```

##### Acceptance Criteria

- [ ] AC-03a: Activating Reset View sets the viewport so every node is fully visible with legible
      labels (fit-to-content).
- [ ] AC-03b: Reset View is always available (button and/or keyboard shortcut) regardless of
      current pan/zoom state, mode, or diagram size — including zero-node and one-node diagrams.
- [ ] AC-03c: Reset View never errors or produces a broken viewport (zero/negative/infinite scale)
      on any diagram, including empty diagrams.
- [ ] AC-03d: Reset View does not alter the graph model — only the viewport changes.
- [ ] AC-03e: The Reset View control is visually discoverable (labelled, always visible) without
      requiring documentation.

##### Outcome KPIs

- **Who**: facilitators who have panned/zoomed away from a readable view (self-reported "lost"
  state during usability sessions)
- **Does what**: recover to a fully-visible, readable view
- **By how much**: recovery in exactly 1 action (single click/keypress), 100% success rate,
  replacing today's only recovery path (a full page reload, which risks losing state for
  transient/shared models)
- **Measured by**: acceptance-test suite (AC-03a–e) + usability session timing
- **Baseline**: page reload only; 100% of recovery attempts today risk state loss for transient
  (shared-URL) models

##### Technical Notes (Optional)

- Fit-to-content requires a bounding box over all node positions (+ radius) and annotations;
  empty-diagram edge case needs a defined default (no bounding box possible) — left as a DESIGN
  decision (e.g. zoom = 1, pan = 0,0 when 0 nodes).
- Reuses the viewport state established in slices 01–02; no new shared state introduced.

---

### [REF] Outcome KPIs (consolidated)

Per KPI-granularity rule (1–3 stories → one table suffices):

| #   | Who                                          | Does What                                                 | By How Much                                | Baseline                            | Measured By                              | Type    |
| --- | -------------------------------------------- | --------------------------------------------------------- | ------------------------------------------ | ----------------------------------- | ---------------------------------------- | ------- |
| 1   | Facilitators with diagrams >12 nodes         | Locate/interact with an off-screen node without reloading | 100% success (0% today)                    | 0% — impossible today               | Acceptance tests + usability session     | Leading |
| 2   | Facilitators with dense diagrams (15+ nodes) | Move between big-picture and detail zoom within a session | ≥2 zoom actions/session, 0 hit-test errors | N/A — zoom doesn't exist today      | Acceptance tests + usability observation | Leading |
| 3   | Facilitators who've lost orientation         | Recover to a fully-visible view                           | 1 action, 100% success                     | Page reload only (risks state loss) | Acceptance tests + usability timing      | Leading |

**North Star**: Facilitators can bring any node into a readable view in ≤2 pan/zoom/reset actions,
regardless of diagram size or current viewport state.
**Leading Indicators**: pan-gesture invocations/session, zoom-gesture invocations/session,
Reset View click rate.
**Guardrail Metrics**: zero regression in existing node-drag, edge-creation, annotation-drag, and
mode-shortcut success rates after the viewport transform ships (a regression in any existing
`Canvas.test.tsx` scenario is a guardrail breach).

**Measurement honesty note**: Swoopy has no analytics/telemetry instrumentation today (client-only
app, no backend). KPI 1 and KPI 3 baselines are stated from architectural inspection (confirmed:
no camera exists) rather than production analytics. Automated behavioral measurement (e.g.
session-based event counters) would require new instrumentation — flagged as a DEVOPS-wave
dependency if the team wants it tracked continuously; not required for this feature to ship, since
the acceptance-test suite directly verifies the underlying capability (ACs above) even without
usage telemetry.

**Hypothesis**: We believe that a Miro/Figma-style pan/zoom/reset-to-fit viewport for facilitators
running growing causal-loop diagrams will keep `explore-system-dynamics` sessions uninterrupted at
diagram sizes beyond one screen. We will know this is true when facilitators like Priya Raman
locate and interact with any node in ≤2 actions, with zero page reloads, across diagrams of any
size tested.

---

### [REF] Definition of Ready Validation

#### Story: US-01 — Pan the canvas by dragging

| DoR Item                                     | Status | Evidence/Issue                                                                                                              |
| -------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Problem statement clear, domain language     | PASS   | "Priya Raman... 3 nodes now sit past the right edge... impossible to reach"                                                 |
| User/persona with specific characteristics   | PASS   | Priya Raman, facilitator, 15 min into a live session, 14-node diagram                                                       |
| 3+ domain examples with real data            | PASS   | Priya (happy path), Devon (edge case), Priya in add-node mode (boundary)                                                    |
| UAT in Given/When/Then (3-7 scenarios)       | PASS   | 5 scenarios                                                                                                                 |
| AC derived from UAT                          | PASS   | AC-01a–e map 1:1 to scenario outcomes                                                                                       |
| Right-sized (1-3 days, 3-7 scenarios)        | PASS   | 1 day estimate, 5 scenarios                                                                                                 |
| Technical notes: constraints/dependencies    | PASS   | Store/renderer boundary, mock convention, input-binding open question tracked                                               |
| Dependencies resolved or tracked             | PASS   | Depends on existing mature renderer/hitTest/store patterns (available); input-binding open question tracked, owner = DESIGN |
| Outcome KPIs defined with measurable targets | PASS   | 100% success target, 0% baseline, acceptance test + usability method                                                        |

**DoR Status: PASSED.**

#### Story: US-02 — Zoom in and out with wheel or pinch

| DoR Item                                     | Status | Evidence/Issue                                                                            |
| -------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| Problem statement clear, domain language     | PASS   | "Priya cannot see more or less detail... every label unreadably small"                    |
| User/persona with specific characteristics   | PASS   | Priya Raman, needs big-picture vs. detail view mid-session                                |
| 3+ domain examples with real data            | PASS   | Priya (happy path), Devon (edge case), Priya at max zoom (boundary)                       |
| UAT in Given/When/Then (3-7 scenarios)       | PASS   | 5 scenarios                                                                               |
| AC derived from UAT                          | PASS   | AC-02a–e map 1:1 to scenario outcomes                                                     |
| Right-sized (1-3 days, 3-7 scenarios)        | PASS   | 1 day estimate, 5 scenarios                                                               |
| Technical notes: constraints/dependencies    | PASS   | Zoom-toward-cursor formula flagged, bounds open question tracked                          |
| Dependencies resolved or tracked             | PASS   | Depends on slice 01 (tracked, sequenced first); zoom-bounds open question owned by DESIGN |
| Outcome KPIs defined with measurable targets | PASS   | ≥2 actions/session target, N/A baseline (feature doesn't exist), method defined           |

**DoR Status: PASSED.**

#### Story: US-03 — Reset view to fit the whole diagram

| DoR Item                                     | Status | Evidence/Issue                                                                                                |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| Problem statement clear, domain language     | PASS   | "Priya's only way back... is trial-and-error... or reloading the page"                                        |
| User/persona with specific characteristics   | PASS   | Priya Raman, lost bearings mid-session                                                                        |
| 3+ domain examples with real data            | PASS   | Priya (happy path zoomed-out recovery), Devon (edge case panned-off recovery), Priya empty-diagram (boundary) |
| UAT in Given/When/Then (3-7 scenarios)       | PASS   | 5 scenarios                                                                                                   |
| AC derived from UAT                          | PASS   | AC-03a–e map 1:1 to scenario outcomes                                                                         |
| Right-sized (1-3 days, 3-7 scenarios)        | PASS   | 0.5–1 day estimate, 5 scenarios                                                                               |
| Technical notes: constraints/dependencies    | PASS   | Bounding-box calculation, empty-diagram default flagged as DESIGN decision                                    |
| Dependencies resolved or tracked             | PASS   | Depends on slices 01–02 (tracked, sequenced last); empty-diagram default open question owned by DESIGN        |
| Outcome KPIs defined with measurable targets | PASS   | 1-action/100%-success target, page-reload baseline, method defined                                            |

**DoR Status: PASSED.**

**All 3 stories PASSED. No remediation required. Cleared for DESIGN wave handoff.**

Per-wave peer review (`nw-product-owner-reviewer`) was **not invoked** — no ambiguity surfaced
during DoR validation, no unverified JTBD assumption beyond the already-flagged "no
DISCOVER/DIVERGE preceded this feature" risk, and no vendor-neutrality concern in any AC. The
mandatory consolidated review fires at end of DISTILL per project convention.

---

### [REF] Requirements Completeness Score

**Score: 0.97** (threshold: >0.95 — PASS)

- Functional requirements: fully specified across 3 stories, 15 total UAT scenarios, 15 AC.
- Non-functional requirements: performance (transform must not regress the existing RAF-loop frame
  budget — see `kpi-contracts.yaml` KPI-01, unaffected by this feature since transform is O(1) per
  draw call), usability (Miro/Figma habit-parity, explicit AC-02c legibility requirement),
  reliability (AC-01b/AC-02e/AC-03d model-immutability invariant). Accessibility: keyboard-only
  panning is explicitly flagged as OUT OF SCOPE (a known gap, not a silent omission) — this is the
  0.03 deduction, reflecting an intentionally deferred NFR rather than an oversight.
- Business rules: viewport non-persistence (D5) and model-coordinate immutability are both
  explicit, testable rules with dedicated AC.

---

### [REF] Out of Scope

- Keyboard-only viewport panning (arrow-key camera movement) — accessibility gap, explicitly
  flagged and deferred, not silently dropped.
- Touch/mobile multi-touch gesture handling beyond trackpad-synthesized wheel events.
- Animated fly-to transitions for Reset View (instant snap is in scope; animation is future polish).
- "Focus on node" targeted zoom-to-a-specific-node (distinct, more advanced feature from generic
  fit-to-content reset).
- Persisting viewport state (pan/zoom) across page reloads or in the shared URL (D5 — would
  require a serialization schema change, tracked as a future decision if requested).
- Minimap/thumbnail overview of the diagram.
- Zoom/pan buttons or on-screen controls beyond Reset View (wheel/pinch/drag are the only required
  input mechanisms for this feature; buttons are a possible DESIGN addition, not required here).

---

### [REF] Driving Surfaces

- Canvas pointer events (`pointerdown`, `pointermove`, `pointerup`) in `packages/app/src/Canvas.tsx`
  — drag-to-pan gesture.
- Canvas `wheel` event — zoom gesture (mouse wheel and trackpad pinch, which browsers typically
  deliver as `wheel` events with `ctrlKey: true`).
- A new UI control (Reset View) — exact placement (Toolbar vs. dedicated control) is a DESIGN
  decision; existing `packages/app/src/Toolbar.tsx` is a plausible host given its existing
  mode-button pattern, but not prescribed here.
- New store actions on `packages/app/src/store.ts` for viewport pan/zoom/reset — exact API surface
  (action names, state shape) is a DESIGN decision.

---

### [REF] Pre-requisites and Dependencies

- Depends on existing, mature `packages/renderer/src/{geometry.ts, hitTest.ts, LoopyRenderer.ts}`
  and `packages/app/src/store.ts` state-slice pattern — all available, no external dependencies.
- Two open questions tracked (not blocking DoR), both owned by DESIGN wave:
  1. Exact input binding for pan given existing mode-specific background-click semantics
     (US-01 Technical Notes).
  2. Exact numeric zoom min/max bounds and empty-diagram Reset View default (US-02/US-03
     Technical Notes).
- **Risk, tracked**: no DISCOVER or DIVERGE wave preceded this feature. The JTBD job story above is
  authored directly by Luna from the feature description and `docs/product/vision.md`'s persona,
  not validated via user interviews or DIVERGE opportunity scoring. Recommendation: a lightweight
  usability check with 2–3 real facilitators, timed either just before DELIVER (to validate the
  Miro/Figma-parity mental-model assumption before committing to exact gesture bindings) or shortly
  after (to validate the zoom bounds and Reset View discoverability assumptions empirically). This
  does not block DoR — DoR validates story readiness for DESIGN, not upstream market validation.

---

### [REF] Locked Decisions

See `discuss/wave-decisions.md` for the full D1–D6 list with rationale. Summary:

- **D1**: Viewport state single source of truth in `store.ts`.
- **D2**: Coordinate transform owned by `packages/renderer`, pure functions.
- **D3**: No separate walking-skeleton phase (see Walking Skeleton Decision above).
- **D4**: One JTBD job, not three; opportunity scoring skipped.
- **D5**: Viewport state is session-only, not persisted.
- **D6**: Full JTBD analysis rendered as a pre-authorized [WHY] expansion (user-selected, not
  `ask-intelligent`-triggered).

---

### [REF] Wave Decisions Summary

Full summary lives in `docs/feature/canvas-pan-zoom-navigation/discuss/wave-decisions.md`
(Key Decisions D1–D6, Requirements Summary, Constraints Established, Upstream Changes = none).

---

## Wave: DESIGN

### [REF] Prior-wave reading confirmation

- ✓ `docs/product/architecture/brief.md` — read; extended with a new `## Application Architecture`
  section (first architect section in this file — no prior conflicting content to reconcile).
- ✓ `docs/product/architecture/adr-001-share-url-compression-library.md`,
  `adr-001-encode-script-reimplements-pipeline.md`, `adr-002-guidance-doc-location.md` — skimmed;
  no precedent conflicts with this feature's decisions. `adr-002` supplied the ADR format followed
  for `adr-003`/`adr-004` below.
- ✓ `docs/product/journeys/canvas-pan-zoom-navigation.yaml` — read (short pointer file: job id
  `navigate-diagram-viewport`, status `discuss-complete`).
- ⊘ No SPIKE wave preceded this feature — skipped per task scope, nothing to reconcile.
- ✓ `packages/app/src/Canvas.tsx`, `Toolbar.tsx`, `packages/app/src/store.ts`,
  `packages/renderer/src/{geometry.ts, hitTest.ts, LoopyRenderer.ts, nodeLabelFont.ts}` — read
  directly to ground both open-question resolutions in real code (not designed in the abstract).
  Confirmed: background mode-actions (add-node, add-annotation, deselect) currently fire on
  `pointerdown`, not `pointerup` — this drove ADR-003. Confirmed: `LoopyRenderer.draw()` applies
  only a DPR transform today, and ~15 private draw methods consume raw graph coordinates directly
  — this drove ADR-004. Confirmed: `nodeLabelFont.ts` clamps label font size to `[9, 15]`px around
  a 13px reference at m-tier radius — this grounded the zoom-bounds legibility rationale (DDD-5).

### [REF] Reuse Analysis

| Existing Component                                                                   | File                                     | Overlap                                                     | Decision                     | Justification                                                                                                                                             |
| ------------------------------------------------------------------------------------ | ---------------------------------------- | ----------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `geometry.ts` pure functions                                                         | `packages/renderer/src/geometry.ts`      | Same "pure CSS-pixel geometry, renderer-owned" pattern      | EXTEND                       | Add `screenToGraph`, `graphToScreen`, `clampZoom`, `zoomAtCursor`, `computeFitViewport`, `Viewport` type — same file, same ownership convention (D2)      |
| `hitTest(graph, x, y)`                                                               | `packages/renderer/src/hitTest.ts`       | Consumes graph-space x/y, currently assumed equal to screen | NO CHANGE (fix at call site) | Callers convert via `screenToGraph` before calling; `hitTest` stays viewport-agnostic — smaller diff, no churn to an already-tested pure function         |
| `LoopyRenderer.draw()`                                                               | `packages/renderer/src/LoopyRenderer.ts` | Draws graph coordinates directly, DPR-only transform today  | EXTEND                       | One `ctx.translate`/`ctx.scale` insertion after the DPR transform, before existing `drawXxx()` calls — zero changes to ~15 private draw methods (ADR-004) |
| Ephemeral store-state pattern (`dragPosition`, `hoveredEdgeRegion`)                  | `packages/app/src/store.ts`              | Precedent for non-persisted, non-undo-tracked state         | EXTEND                       | Add `viewport` slice + `setViewportPan`/`zoomAt`/`resetViewport` actions, same pattern                                                                    |
| Pointer-handler drag-vs-click state machine (`hasDragged`, committed at `pointerup`) | `packages/app/src/Canvas.tsx`            | Precedent for deferred-commit gesture discrimination        | EXTEND                       | Extend the pattern to background gestures (ADR-003); add a genuinely new `wheel` listener (no prior precedent)                                            |
| Toolbar mode-button row                                                              | `packages/app/src/Toolbar.tsx`           | Existing button/title/shortcut styling                      | EXTEND                       | Add a "Reset View" control, same `btn` style convention                                                                                                   |

No new file or module created. Full table with rationale also in
`docs/feature/canvas-pan-zoom-navigation/design/wave-decisions.md`.

### [REF] Component Decomposition

No new architectural pattern or module — additive extension within the existing renderer/app
split (modular monolith, ports-and-adapters-ish boundary already established). Two significant,
hard-to-reverse mechanism decisions were made and recorded as ADRs (each with 3 options and
rejection rationale):

- **ADR-004** (recommended architecture): viewport pan/zoom applied as a **single canvas-matrix
  transform** (`ctx.translate`/`ctx.scale`) once per frame in `LoopyRenderer.draw()`, composed
  after the existing DPR transform, before any existing draw call. Rejected alternatives:
  (1) pre-transforming every coordinate before each of the ~15 existing draw methods — too much
  surface area, forces manual rescaling of fonts/strokes/arrowheads that the canvas matrix already
  handles for free; (2) a shadow/duplicate set of screen-transformed node coordinates — directly
  conflicts with the "never mutate `Graph.nodes[].x/y`" constraint and reintroduces the exact
  divergence risk the Shared Artifacts Registry flags as highest-risk.
- **ADR-003** (pan input binding, open question 1): plain left-drag on empty background pans the
  view in every mode, discriminated from mode-specific background click actions (add-node,
  add-annotation, deselect) via a 4px movement threshold evaluated on `pointermove`, with the
  candidate mode action committed on `pointerup` only if no movement occurred — extending the
  codebase's existing `hasDragged` drag-vs-click pattern (already used for node/annotation drag) to
  a third gesture family. Rejected alternatives: (1) a modifier key/middle-mouse-button dedicated
  to pan — contradicts the plain-drag Gherkin scenario text and the JTBD Habit force; (2)
  restricting pan to `select` mode only — contradicts AC-01e's "works consistently across
  modes" requirement. Shift-held background drag (existing spring-loading add-node) is explicitly
  excluded from the pan gate to preserve that gesture unchanged.

No Component (L3) diagram: every change lands inside five already-existing files; the added
complexity is control-flow branching within `Canvas.tsx`'s pointer handlers, not a new
decomposable subsystem.

### [REF] Driving/Driven Ports

Extends `docs/product/architecture/brief.md`'s driving-ports tables — full port table (signatures,
contract shapes) lives there under the new `## Application Architecture` section. Summary:

| Port                                                                                | Owner                                        | Contract shape                                                                                         |
| ----------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `screenToGraph`, `graphToScreen`, `clampZoom`, `zoomAtCursor`, `computeFitViewport` | `packages/renderer/src/geometry.ts`          | pure-function (return-only)                                                                            |
| `LoopyRenderer.draw(state)` — `RendererStore.viewport` (new read-only field)        | `packages/renderer/src/LoopyRenderer.ts`     | bounded-change (canvas pixels only; renderer stays write-free on the store)                            |
| `hitTest(graph, x, y)`                                                              | `packages/renderer/src/hitTest.ts`           | pure-function (return-only) — **unchanged signature**                                                  |
| `viewport` state, `setViewportPan`, `zoomAt`, `resetViewport`                       | `packages/app/src/store.ts`                  | bounded-change: writes only `viewport`, never `graph.nodes[].x/y`; bypasses undo/persist entirely (D5) |
| Pointer/wheel handlers, Reset View control                                          | `packages/app/src/Canvas.tsx`, `Toolbar.tsx` | Driving surfaces — dispatch the above actions                                                          |

Driving port for zoom/pan is deliberately **not** exposed as a single read-write port: `zoomAt`
and `setViewportPan` are separate write actions from any read access to `viewport` (plain state
subscription) — no driving port exposes both read and write on the same interface, consistent with
Mandate-12's read/write split requirement.

### [REF] Technology Choices

None new. No new npm dependency, no new package, no new runtime. Confirmed explicitly — existing
React/Zustand/Canvas 2D stack only.

### [REF] Decisions (DDD-1..8)

See `docs/feature/canvas-pan-zoom-navigation/design/wave-decisions.md` for the full table
(DDD-1 transform mechanism, DDD-2 hitTest call-site conversion, DDD-3 pan binding, DDD-4 shift-drag
exclusion, DDD-5 zoom bounds/increment, DDD-6 empty/single-node reset default, DDD-7 undo/persist
bypass, DDD-8 `Viewport` type ownership).

### [REF] Open Questions

Both open questions forwarded from DISCUSS are **resolved**, none survive to DISTILL/DELIVER:

1. **Pan input binding** → plain left-drag on background, all modes, 4px movement threshold,
   deferred-commit discrimination (ADR-003).
2. **Zoom bounds/increment/empty-diagram default** → zoom range `[0.5, 4]`, ~10%-per-notch
   multiplicative increment (exact sensitivity constant left to crafter within these bounds),
   `computeFitViewport` with a minimum-extent guard producing `zoom=1, pan=(0,0)` for 0 nodes and a
   centered non-extreme result for 1 node, both via the same `clampZoom` used by wheel-zoom
   (DDD-5, DDD-6).

**One flagged consequence carried forward** (not an open question, a known implementation
consequence): existing `Canvas.test.tsx` scenarios that assert add-node/add-annotation/deselect
from a lone `pointerdown` dispatch (no matching `pointerup`) will need a `pointerup` added to their
setup, because those actions now commit on `pointerup` instead of `pointerdown` (ADR-003
Consequences). This is expected behavior-timing change, not a functional regression — flagged
explicitly for `acceptance-designer` so it isn't mistaken for a guardrail-metric breach.

### [REF] C4 Diagrams

Container-level diagram (Mermaid) lives in `docs/product/architecture/brief.md` under
`## Application Architecture` (`### C4 Container — viewport state flow`) to avoid duplicating a
large diagram across two documents — reproduced there in full, showing
facilitator → Canvas.tsx → geometry.ts/store.ts/hitTest.ts → LoopyRenderer → engine Graph model,
every arrow labeled with a verb. No Component (L3) diagram (see Component Decomposition above for
why).

### [REF] Peer Review

Skipped per task scope: no contested ADR expected beyond the two authored here (both grounded
directly in locked DISCUSS constraints and existing code, not novel/contested patterns), no
unverified performance budget, no security boundary change. Mandatory consolidated review fires at
end of DISTILL per project convention.

---

## Wave: DEVOPS

### [REF] Prior-wave reading confirmation

- ✓ `docs/feature/canvas-pan-zoom-navigation/feature-delta.md` (this file, `## Wave: DISCUSS` +
  `## Wave: DESIGN`) — read in full: 3 user stories with AC/UAT/KPIs, reuse analysis, ADR-003/
  ADR-004, DDD-1..8, driving/driven ports.
- ✓ `docs/feature/canvas-pan-zoom-navigation/design/wave-decisions.md` — read in full: DDD-1..8,
  reuse table, constraints established, no upstream architecture changes required by DEVOPS.
- ✓ `docs/product/kpi-contracts.yaml` — read; KPI-01..06 confirmed unrelated to this feature.
  Extended with KPI-07/08/09 (see Monitoring contracts below).
- ✓ `docs/product/architecture/brief.md` — read `## Application Architecture` section (viewport
  ports table, C4 container diagram). No deployment-topology change triggers an update to this
  file from DEVOPS (still GitHub Pages, no new managed service/region) — not modified.
- ✓ `.github/workflows/ci.yml` — read in full: `lint` → `typecheck` → `test` (matrix
  `[engine, renderer, app]`) → `dependency-review` (PR-only) → `build` → `sbom` (main-only) →
  `deploy` (main-only, `actions/deploy-pages`).
- ⊘ `docs/feature/canvas-pan-zoom-navigation/discuss/outcome-kpis.md` as a standalone file — not
  found; the 3 outcome KPIs live inline in this file's `## Wave: DISCUSS` → `[REF] Outcome KPIs
(consolidated)` section instead. Read from there.

No contradictions found between DESIGN architecture and DEVOPS infrastructure reality — this
feature's brownfield, no-new-dependency, no-new-package posture (DESIGN's Technology Choices
section) matches DEVOPS's "confirm, don't invent" mandate exactly.

### [REF] Environment matrix

Full inventory: `docs/feature/canvas-pan-zoom-navigation/devops/environments.yaml`.

This is a pure client-side browser feature, not something installed into systems — the skill's
default install-lifecycle template (`clean` / `with-pre-commit` / `with-stale-config`) does not fit
and would produce three meaningless entries. Adapted instead to the two documented input paths this
feature depends on (per DISCUSS's "Driving Surfaces" and DESIGN's DDD-3/DDD-5): mouse+wheel
(`mouse-wheel-desktop`), trackpad-pinch synthesized as ctrlKey-wheel (`trackpad-pinch-ctrl-wheel`),
and drag-pan across all interaction modes (`mouse-drag-pan-all-modes`). Each entry documents what
is CI-verified (jsdom-simulated events in `packages/renderer/src/geometry.test.ts` and
`packages/app/src/Canvas.test.tsx`, once DISTILL/DELIVER write them) versus what is NOT
CI-exercisable (real-browser wheel-scaling/deltaMode variance, real trackpad ctrlKey-synthesis
heuristics) and therefore relies on the manual usability session already recommended in DISCUSS.
Touch/mobile and keyboard-only navigation are excluded from the matrix, matching DISCUSS's explicit
Out of Scope list — not a silent omission.

### [REF] CI/CD pipeline outline (confirm-no-change)

**No changes to `.github/workflows/ci.yml`.** Verified explicitly, stage by stage:

- `test` (matrix `[engine, renderer, app]`): once acceptance-designer/software-crafter write
  `geometry.test.ts` (new pure functions), the `renderer` leg (`pnpm --filter ./packages/renderer
test --coverage`) exercises them automatically — no new matrix entry needed, `packages/renderer`
  is already a matrix member. Similarly, new/updated `Canvas.test.tsx`, `store.test.ts`,
  `Toolbar.test.tsx` assertions are picked up by the existing `app` leg.
- Coverage upload (`actions/upload-artifact`, per-package `coverage-${{ matrix.package }}`):
  no change needed — new test files roll into the existing per-package coverage report; no new
  artifact name or path required.
- `dependency-review` (PR-only, fails on high severity) and `sbom` (main-only, SPDX JSON): both
  unaffected — this feature adds **zero new npm dependencies** (confirmed explicitly in this file's
  own `## Wave: DESIGN` → Technology Stack: "No new dependency. No new package. No new runtime.").
- `build` and `deploy`: unaffected — same `pnpm --filter ./packages/app build` and
  `actions/deploy-pages` steps, no new build flag or secret required.

If this analysis is later found wrong (e.g. a genuinely new CI need emerges once real tests exist),
that is flagged for the user rather than silently patched into `ci.yml` here.

### [REF] Monitoring contracts (manual/acceptance-test-measured)

Per Decision 5 (deferred instrumentation), **no data-collection pipeline is designed or proposed**
for this feature's 3 outcome KPIs. Documented instead in `docs/product/kpi-contracts.yaml` as new
entries KPI-07 (off-screen reachability via pan, US-01), KPI-08 (zoom actions/session + zero
hit-test regressions, US-02), KPI-09 (Reset View one-action recovery, US-03) — all classified
`gate: soft`, all measured by:

1. The acceptance-test suite DISTILL will author against AC-01a–e / AC-02a–e / AC-03a–e (fully
   automatable, CI-verifiable portions of each KPI — e.g. AC-02d's "0 hit-test errors").
2. An occasional manual usability session (3–5 facilitators building a realistic diagram live) —
   for the portions genuinely not automatable without telemetry (e.g. "≥2 zoom actions/session",
   "1-action recovery" timing).

Rationale (user-provided, not re-litigated here): Swoopy has no analytics/telemetry today
(client-only, no backend); adding one for this feature's 3 KPIs would introduce a real cost
(consent/privacy handling, a data pipe with nowhere to send to) disproportionate to a hobby-project
feature whose underlying capability is already fully verified by acceptance tests. This matches
DISCUSS's own "Measurement honesty note" verbatim.

### [REF] Deployment strategy (recreate, platform-given)

**Recreate** — not a strategy choice made for this feature, a platform-given fact restated
explicitly per principle 7's rollback-first requirement: GitHub Pages has no built-in blue-green or
canary primitive without introducing new tooling (excluded — this wave adds no new tooling).
**Rollback-first**: revert the merge commit on `main`; the existing `deploy` job (unconditioned on
anything new) rebuilds and republishes the prior state atomically on the next push. No database
migration, no schema versioning, no persisted state to reconcile — viewport state is session-only
(DDD-7/D5), so a bad deploy's worst case is a page reload, an already-documented (if
undesirable) recovery path in US-03's own error-path design. Zero risk of state corruption from a
failed deploy.

**Rejected alternatives** (per Simplest Solution Check, principle 4):

- **Canary/blue-green via a third-party static-hosting proxy or feature-flag service** — rejected:
  would be genuinely new tooling for a feature whose actual blast radius (a client-only pan/zoom
  transform, session-only state, guarded by existing acceptance tests) does not warrant it. No
  server-side state, no payment/critical-path risk profile.
- **A separate staging GitHub Pages environment for pre-production validation** — rejected: no
  existing precedent in this repo, and the feature's guardrail metric (existing `Canvas.test.tsx`
  scenarios must not regress) is already enforced pre-merge by the `test` CI stage, making a
  separate staging deploy redundant for this feature's risk profile.

### [REF] Mutation testing strategy (confirm existing + flag renderer scoping gap)

Confirmed: this feature follows the **existing project-wide policy already in CLAUDE.md**
("per-feature... scoped to `packages/engine`... exclude `packages/app`... Kill rate gate: 80%,"
plus the global standing order "target 85% kill rate on core modules — run via
`/nw-mutation-test`, not as a merge gate"). No new or different mutation-testing strategy is
proposed for this feature, and CLAUDE.md is **not modified**.

**Flagged scoping gap** (not silently resolved): this feature's new logic is 5 pure functions in
`packages/renderer/src/geometry.ts` — not `packages/engine`, and not the excluded `packages/app`
either. The existing policy wording names neither `packages/renderer`'s inclusion nor exclusion.
Precedent check against the repo's actual Stryker configs (`stryker.config.mjs` at root,
`packages/app/stryker.config.mjs`) shows both target `url-encoding.ts` — a pure-logic file that
physically lives in `packages/app`, the package CLAUDE.md's literal wording excludes. This suggests
real practice is "mutate the feature's new pure-logic file(s) regardless of package, provided
they're not React components" rather than a literal `packages/engine`-only reading. Under that
reading, `geometry.ts`'s 5 new functions look like a natural per-feature Stryker target by the same
logic as `url-encoding.ts`. **This is presented to the user as an open scoping question, not
resolved here** — no Stryker config was authored for this feature in this wave.

**Resolved post-DEVOPS**: the user confirmed extending mutation-testing scope by module
characteristic rather than package boundary. See
`docs/decisions/DR--20260724--process--mutation-testing-scope.md` and the updated CLAUDE.md
Mutation Testing section. `packages/renderer/src/geometry.ts`'s new pure functions are now an
explicit in-scope target — `stryker.config.mjs`'s `mutate` array will point at them once DELIVER
implements them, same pattern as `url-encoding.ts`. No new Stryker config needed at this wave.

### [REF] Observability stack (deferred, per Decision 5)

No new observability stack (no Prometheus/Grafana/Datadog/ELK/OpenTelemetry/CloudWatch). No
existing stack to extend either — confirmed in DISCUSS's Measurement honesty note ("Swoopy has no
analytics/telemetry instrumentation today"). This wave adds none, per explicit Decision 5. The only
"observability" this feature relies on is: (1) CI test results (pass/fail signal per PR), (2) the
acceptance-test suite as the source of truth for whether the underlying capability works, (3)
manual usability sessions for the usage-frequency/timing portions of the 3 KPIs that cannot be
automated without telemetry.

### [REF] Branching strategy (trunk-based, existing)

**Trunk-Based Development** — the project's existing standard (CLAUDE.md: "trunk-based
development"), matching `ci.yml`'s trigger rules exactly as configured (`push: [main]` +
`pull_request`, no `develop`/`release/*`/`hotfix/*` branches to account for). No change proposed;
this feature's short-lived feature branch follows the existing
"feature branch → `/check` → push → MR → merge → pull main → delete branch" lifecycle documented
in CLAUDE.md's Engineering Defaults.

### [REF] Coexistence matrix (N/A or minimal — no install-time hooks for this feature)

This feature installs nothing and adds no new hook. The only coexistence concern is trivial: new
test files (`geometry.test.ts`, updated `Canvas.test.tsx`/`store.test.ts`/`Toolbar.test.tsx`) must
run under the project's existing `lefthook` pre-commit gate (`pnpm test --run`, workspace-wide) —
they do, automatically, as part of the same `pnpm test --run` invocation every other test file
already uses. No new hook stage, no new tool to coexist with. Full entry in
`docs/feature/canvas-pan-zoom-navigation/devops/environments.yaml`'s `coexistence_matrix`.

### [REF] Pre-requisites

- Depends on DESIGN wave's five already-existing files being extended as designed (`geometry.ts`,
  `LoopyRenderer.ts`, `store.ts`, `Canvas.tsx`, `Toolbar.tsx`) — no DEVOPS-side blocker.
- Open scoping question (mutation testing, `packages/renderer` core-vs-not-core) carried forward to
  the user for a decision — does not block DISTILL handoff, since mutation testing is on-demand,
  not a merge gate, per existing project policy.
- No new secrets, environment variables, or GitHub Actions permissions required.
- `docs/product/kpi-contracts.yaml` now includes KPI-07/08/09 with `current_tests: []` — DISTILL
  should populate these once AC-01..03 tests are authored (informational, not a gate — KPIs are
  `soft`).

### [REF] Wave Decisions Summary

Full summary: `docs/feature/canvas-pan-zoom-navigation/devops/wave-decisions.md` (Decisions D1–D9
covering deployment target, container orchestration, CI/CD platform, existing infrastructure,
observability, deployment strategy, continuous learning, branching, mutation testing — including
the flagged renderer scoping gap).

Per-wave peer review (`nw-platform-architect-reviewer`) **skipped**: no novel deployment target, no
new CI/CD framework, no observability rewrite, no security posture change. Mandatory consolidated
review fires at end of DISTILL per project convention.

---

## Wave: DISTILL

### [REF] Prior-wave reading confirmation

- ✓ `docs/product/journeys/canvas-pan-zoom-navigation.yaml` — read; short pointer file (job id
  `navigate-diagram-viewport`, status `discuss-complete`, no embedded Gherkin — UAT scenarios live
  in this file's `## Wave: DISCUSS` section instead).
- ✓ `docs/product/architecture/brief.md` — read in full, including `## Application Architecture`
  (viewport ports table, C4 diagram) added by DESIGN.
- ✓ `docs/product/kpi-contracts.yaml` — read; KPI-07/08/09 confirmed, all `soft` gate. Extended
  with `current_tests` entries below (back-propagation).
- ✓ `docs/feature/canvas-pan-zoom-navigation/feature-delta.md` (this file, DISCUSS+DESIGN+DEVOPS)
  — read in full.
- ✓ `docs/feature/canvas-pan-zoom-navigation/{discuss,design,devops}/wave-decisions.md` — read in
  full for the Wave-Decision Reconciliation gate (see below).
- ✓ `docs/feature/canvas-pan-zoom-navigation/slices/slice-0{1,2,3}-*.md` — read; production-data AC
  (14-node realistic fixture) applied in the acceptance test fixtures.
- ✓ `docs/product/architecture/adr-003-pan-drag-vs-click-discrimination.md`,
  `adr-004-viewport-transform-mechanism.md` — read; scenarios and scaffolds written against these
  exact mechanism decisions.
- ⊘ No DISCOVER, SPIKE, or pre-existing walking skeleton — none found, no promotion to reconcile.
- ✓ `packages/renderer/src/{geometry.ts,geometry.test.ts,hitTest.ts,LoopyRenderer.ts,
nodeLabelFont.ts}`, `packages/app/src/{store.ts,Canvas.tsx,Canvas.test.tsx,Toolbar.tsx,
Toolbar.test.tsx,seed.ts}` — read directly to ground scaffolds/tests in the real codebase
  (not designed in the abstract).

### [REF] Wave-Decision Reconciliation

Read all three `wave-decisions.md` files in full (DISCUSS D1–D6, DESIGN DDD-1–8, DEVOPS D1–D9).
Checked each DISCUSS decision against DESIGN/DEVOPS for contradiction (email-vs-in-app-notification
style conflicts, API-shape conflicts, tenancy conflicts): none found. DESIGN's two open questions
(pan input binding, zoom bounds/empty-diagram default) are resolutions, not reversals, of DISCUSS's
locked D1–D6. DEVOPS's environment matrix and mutation-testing scoping are additive, non-contradicting
extensions.

**Reconciliation passed — 0 contradictions.**

### [REF] Adapter classification (Architecture of Reference)

This is a pure client-side, in-process feature — no database, HTTP, filesystem, or subprocess
boundary. Per the Architecture of Reference, every port in scope is either a **driving** port
(real adapter: jsdom + `@testing-library/react` `fireEvent`) or a **driven internal** port (real
adapter: direct, in-process function/store calls — no Testcontainers, no fakes needed, since
nothing here is external or non-deterministic).

| Port                                                                            | Class           | Treatment                                                                                                                                                   | Mechanism                                                                                               |
| ------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Canvas `pointerdown/move/up`, `wheel` events                                    | Driving         | Real adapter                                                                                                                                                | jsdom `fireEvent` on the rendered `<Canvas />` (`@testing-library/react`)                               |
| "Reset View" click                                                              | Driving         | Real adapter                                                                                                                                                | jsdom `fireEvent.click` on the rendered `<Toolbar />`                                                   |
| `screenToGraph`/`graphToScreen`/`clampZoom`/`zoomAtCursor`/`computeFitViewport` | Driven internal | Real adapter                                                                                                                                                | Direct in-process function call (`packages/renderer/src/geometry.ts`)                                   |
| `viewport` state / `setViewportPan`/`zoomAt`/`resetViewport`                    | Driven internal | Real adapter                                                                                                                                                | Direct in-process Zustand store call (`useStore.getState()`) — the store IS this app's composition root |
| `LoopyRenderer.draw()`                                                          | Driven internal | Real adapter (not exercised by new tests — no new draw-path assertions in this DISTILL session; existing `LoopyRenderer.test.ts` unaffected, 50/50 passing) | n/a                                                                                                     |

No port in this feature qualifies as "driven external / non-deterministic" (no clock, network,
LLM, payment, or third-party API) — so no fake/stub mechanism is needed anywhere, and no entry
was added to `docs/architecture/atdd-infrastructure-policy.md` (file does not exist in this
project; bootstrapping it was assessed as out of proportion for a project with zero external/
non-deterministic ports across its entire history — flagged, not silently skipped).

### [REF] Adapter coverage table (Mandate 6)

| Adapter                                                                 | `@real-io` scenario | Covered by                                                                              |
| ----------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `screenToGraph`/`graphToScreen`                                         | YES                 | `geometry.test.ts` — identity + roundtrip property                                      |
| `clampZoom`                                                             | YES                 | `geometry.test.ts` — 5 boundary examples + 2 property tests                             |
| `zoomAtCursor`                                                          | YES                 | `geometry.test.ts` — cursor-fixed-point + clamp-bounds properties                       |
| `computeFitViewport`                                                    | YES                 | `geometry.test.ts` — 0/1/N-node examples + 2 property tests                             |
| `useStore` viewport actions (`setViewportPan`/`zoomAt`/`resetViewport`) | YES                 | `canvas-pan-zoom.acceptance.test.tsx` — direct store-driving-port calls                 |
| Canvas pointer/wheel driving port                                       | YES                 | `canvas-pan-zoom.acceptance.test.tsx` — real jsdom `fireEvent` on rendered `<Canvas />` |
| Toolbar Reset View driving port                                         | YES                 | `canvas-pan-zoom.acceptance.test.tsx` — real jsdom render of `<Toolbar />`              |

Zero "NO — MISSING" rows: every driven adapter in this feature's scope has at least one
`@real-io` scenario.

### [REF] Scenario list with tags

18 scenarios in `docs/scenarios/canvas-pan-zoom-navigation/acceptance.feature` (15 from the
DISCUSS-authored UAT + 3 pure-function property scenarios). 1 walking skeleton (per harness
instruction — exactly one). Tier A only (no Tier B — 3 short chained journeys, not ≥3-scenario
domain-rich input space per Mandate 10's skip condition).

| #   | Scenario                                                         | Tags                                                                    |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | Panning reveals nodes that were off-screen                       | `@walking_skeleton @real-io @US-01 @contract-shape:bounded-change @kpi` |
| 2   | Panning does not alter the model                                 | `@real-io @US-01 @contract-shape:unbounded-preservation`                |
| 3   | Node dragging still works after panning                          | `@real-io @US-01 @contract-shape:bounded-change`                        |
| 4   | Panning does not trigger mode-specific background actions        | `@real-io @US-01 @contract-shape:bounded-change`                        |
| 5   | Hit-testing remains accurate after panning                       | `@real-io @US-01 @contract-shape:bounded-change @kpi`                   |
| 6   | Zooming in centers on the cursor                                 | `@real-io @US-02 @contract-shape:bounded-change @kpi`                   |
| 7   | Zooming out reveals the whole structure                          | `@real-io @US-02 @contract-shape:bounded-change`                        |
| 8   | Zoom has a maximum limit                                         | `@real-io @US-02 @contract-shape:bounded-change @property`              |
| 9   | Zoom has a minimum limit                                         | `@real-io @US-02 @contract-shape:bounded-change @property`              |
| 10  | Hit-testing remains accurate at any zoom level                   | `@real-io @US-02 @contract-shape:bounded-change @kpi`                   |
| 11  | Reset View recovers from zooming out too far                     | `@real-io @US-03 @contract-shape:bounded-change @kpi`                   |
| 12  | Reset View recovers a node panned off-screen                     | `@real-io @US-03 @contract-shape:bounded-change @kpi`                   |
| 13  | Reset View works on an empty diagram                             | `@real-io @US-03 @contract-shape:bounded-change`                        |
| 14  | Reset View works with a single node                              | `@real-io @US-03 @contract-shape:bounded-change`                        |
| 15  | Reset View is discoverable without prior instruction             | `@real-io @US-03 @contract-shape:bounded-change`                        |
| 16  | Screen-to-graph/graph-to-screen coordinate transforms round-trip | `@real-io @property @contract-shape:pure-function`                      |
| 17  | Zoom is always clamped within the supported range                | `@real-io @property @contract-shape:pure-function`                      |
| 18  | Fit-to-content always produces a finite, in-bounds viewport      | `@real-io @property @contract-shape:pure-function`                      |

Error/edge/boundary count: 7/18 ≈ 39% (scenarios 2–4, 8–9, 13–14) — close to the 40% target;
this feature's shape (geometry + clamping, not CRUD/validation) naturally skews happy-path-heavy,
flagged rather than force-padded with contrived error scenarios.

### [REF] Test placement

- `docs/scenarios/canvas-pan-zoom-navigation/acceptance.feature` — Gherkin SSOT/documentation
  (not executed directly — no cucumber-js/pytest-bdd runtime in this project).
- `packages/renderer/src/geometry.test.ts` — extended (pre-existing file) with 5 new pure-function
  describe blocks (fast-check property tests + boundary examples).
- `packages/app/src/canvas-pan-zoom.acceptance.test.tsx` — new dedicated acceptance file, following
  the `url-persistence.acceptance.test.ts` precedent (multi-scenario feature → dedicated
  `*.acceptance.test.ts` file).
- `packages/app/src/canvas-pan-zoom.domain-types.ts` — new domain types module (Mandate-12
  criterion 1; TypeScript adaptation of the Python `domain_types.py` pilot).
- `packages/app/src/Canvas.test.tsx` — extended in place: 4 existing tests fixed per ADR-003 (see
  below); no new pan/zoom scenarios added here (kept in the dedicated acceptance file instead, to
  avoid inflating an already-1550-line file).
- `packages/app/src/Toolbar.tsx` — minimal Reset View control scaffold (existing file, extended).

Precedent: `docs/scenarios/share-url-compression/acceptance.feature` +
`packages/app/src/url-persistence.acceptance.test.ts` /
`packages/app/src/share-compression.integration.test.ts` — `.feature` as documentation SSOT,
hand-authored Vitest `describe`/`it` as the executable form. No cucumber-js/pytest-bdd dependency
introduced.

### [REF] Existing tests fixed (ADR-003 flagged consequence)

Per ADR-003's explicitly-flagged consequence and the harness instructions, 4 tests in
`packages/app/src/Canvas.test.tsx` that asserted an add-node/deselect/add-annotation outcome from
a **lone `pointerdown`** dispatch (no matching `pointerup`) needed a `pointerup` added — because
those background mode-actions now commit on `pointerup`, not `pointerdown`, once the pan-vs-click
movement-threshold gate lands (a real browser always delivers both events for a stationary click,
so this is a timing fix matching real behavior, not a weakened assertion):

1. `"GE-20 click sets focused node in select mode" > "pointerdown on empty canvas clears focusedNodeId"`
2. `"GE-01 add-node mode — click canvas creates node" > "pointerdown on empty space calls addNode with pointer coordinates"`
3. `"GE-37 add-annotation mode — pointerdown places annotation" > "pointerdown calls addAnnotation with pointer coordinates"`
4. `"GE-37 add-annotation mode — pointerdown places annotation" > "pointerdown calls openAnnotationEditor with the returned id"`

All 4 fixed tests, plus the other 85 tests in the file (89 total), pass — zero regressions.

### [REF] Scaffolds (Mandate 7 — RED-ready)

| File                                | Scaffold marker                    | Contents                                                                                                                                                                                                                                         |
| ----------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/renderer/src/geometry.ts` | `__SCAFFOLD_VIEWPORT__ = true`     | `Viewport` type, `ZOOM_MIN`/`ZOOM_MAX` constants, `screenToGraph`, `graphToScreen`, `clampZoom`, `zoomAtCursor`, `computeFitViewport` — all throw `Error("Not yet implemented — RED scaffold (__SCAFFOLD_VIEWPORT__)")`                          |
| `packages/renderer/src/index.ts`    | n/a (export wiring only)           | Re-exports the 5 scaffold functions + `Viewport` type + `ZOOM_MIN`/`ZOOM_MAX`, so `@swoopy/app` can import them                                                                                                                                  |
| `packages/app/src/store.ts`         | `// __SCAFFOLD_VIEWPORT__` comment | `viewport` state (real default `{panX:0,panY:0,zoom:1}` — data, not scaffolded logic); `setViewportPan`/`zoomAt`/`resetViewport` actions all throw the same scaffold Error                                                                       |
| `packages/app/src/Toolbar.tsx`      | `// __SCAFFOLD_VIEWPORT__` comment | Minimal "Reset View" button wired to `resetViewport()` (throws on click); canvas-dimension lookup via `document.querySelector("canvas")` is a scaffold placeholder flagged for the crafter to revisit properly (Toolbar has no canvas ref today) |

Verified RED (not BROKEN) — see `docs/feature/canvas-pan-zoom-navigation/distill/red-classification.md`.

### [REF] Driving port coverage

Every driving surface named in DISCUSS's "Driving Surfaces" section has at least one scenario
exercising it via its real protocol (jsdom `fireEvent`, not a bypassed service call):

- Canvas `pointerdown`/`pointermove`/`pointerup` — covered (walking skeleton + AC-01d/e tests).
- Canvas `wheel` — covered (AC-02a tests, both `mouse-wheel-desktop` and `trackpad-pinch-ctrl-wheel`
  input paths per `devops/environments.yaml`).
- Toolbar "Reset View" control — covered (AC-03b/e tests).
- New store actions (`setViewportPan`/`zoomAt`/`resetViewport`) — covered directly (store-level
  driving-port tests) in addition to the Canvas/Toolbar-level tests above.

### [REF] Pre-requisites

- DESIGN's driving/driven ports table (`docs/product/architecture/brief.md` `## Application
Architecture`) and DEVOPS's `environments.yaml` are the two upstream artifacts these scenarios
  depend on; both read in full (see Prior-wave reading above).
- `docs/architecture/atdd-infrastructure-policy.md` does not exist and was not bootstrapped —
  flagged as a deliberate scope decision (zero external/non-deterministic ports in this project's
  history to date), not a silent omission.
- `tests/common/state_delta.<ext>` (Mandate 8 Universe port) was **not** bootstrapped in this
  session. Flagged adaptation, not a silent skip: this project's entire existing test suite (600+
  tests) uses plain Vitest assertions with zero prior precedent for the nWave state-delta/Universe
  pattern; introducing new test infrastructure machinery unrequested by the harness instructions,
  on a hobby project under the "lean, on-demand gates" rigor profile (project CLAUDE.md), was
  judged a Cognitive Load Tax disproportionate to this feature's scope. All new tests instead use
  plain `expect()` assertions matching 100% of this project's existing acceptance-test style
  (`url-persistence.acceptance.test.ts`, `share-compression.integration.test.ts`).

### [REF] Mandate-12 compliance (SSOT via types — TypeScript adaptation)

- **Criterion 1** (domain types module): `packages/app/src/canvas-pan-zoom.domain-types.ts` —
  `WheelInputPath` (mouse-wheel-desktop / trackpad-pinch-ctrl-wheel, matching `environments.yaml`)
  and `DiagramSize` (empty/single/many, C3 cardinality) enums.
- **Criterion 2** (typed composition parameters): the store's pre-existing `AppMode` enum is
  reused for mode parametrization (`it.each(["select","add-edge","delete","simulate"] as const)`);
  no raw string was introduced where a domain enum already exists. The new `WheelInputPath`/
  `DiagramSize` enums parametrize test cases (`it.each`), not composition-root method signatures —
  `zoomAt`/`resetViewport` take geometric floats (screenX/deltaY/canvasWidth), which have no
  natural enum domain.
- **Criterion 3** (no business logic in step bodies): this project has **no separate
  step-definition layer** — Gherkin in the `.feature` file is documentation-only (project
  precedent: `share-url-compression`), and Vitest `it()` bodies ARE the executable tests, not a
  thin step-glue layer over a service. The ≤2-statement/no-control-flow AST constraint is
  therefore not mechanically applicable in this project's convention; flagged as an adaptation
  rather than force-fitting an unused step-glue abstraction. Test bodies still delegate 100% of
  business logic to the composition root (`useStore.getState()`, `render(<Canvas/>)`) — zero
  inline reimplementation of clamping/transform math anywhere in the test files.
- **Criterion 4** (step-reuse-ratio): not applicable for the reason given in Criterion 3 (no
  step-decorator layer to count). Documented here as the informational finding, per Mandate-12's
  "ratio informs, criteria 1–3 govern" discipline.

### [REF] Outcomes registration — BLOCKED (tool bug, flagged)

Attempted `nwave-ai outcomes register` for 4 new typed contract surfaces (viewport coordinate
transform, zoom clamping/cursor-centered zoom, fit-to-content calculation, viewport store
actions). All 4 attempts failed with the same tool-internal error:

```text
FileNotFoundError: [Errno 2] No such file or directory:
  '.../site-packages/docs/product/outcomes/schema.json'
```

The installed `nwave-ai` CLI resolves its bundled `schema.json` relative to the package's
`site-packages` install directory instead of a packaged resource path — an environment bug in the
tool itself, not something fixable from this repo. Flagged per project standing orders ("flag
rather than silently skip") rather than silently omitting registration. `docs/product/outcomes/
registry.yaml` remains unchanged (`outcomes: []`) — no OUT-N rows added this session.

### [REF] Self-Completeness Audit (15-item checklist, abbreviated)

Applicable items for this feature (pure client-side geometry + gesture feature, no persistence,
no network, no multi-actor concurrency claim):

- C1a/C1b (boundary): PASS — zoom min/max boundary examples + `clampZoom` property test.
- C2a/C2b (state machine): N/A-documented — pan-vs-click gesture discrimination is a 2-state
  machine (pending-click / dragging) fully specified by ADR-003; DELIVER implements it, DISTILL's
  tests assert both outcomes (AC-01d "no side-effect" + AC-01a "viewport shifts").
- C3 (0/1/N cardinality): PASS — `DiagramSize` enum + `computeFitViewport` 0/1/many property test.
- C4a/C4b (idempotency/inverse): PASS-partial — `clampZoom` idempotency property test; no natural
  CRUD inverse exists for pan/zoom (not a create/delete pair) — documented gap, not silently
  skipped.
- C5a/C5b (mode-flag coverage): PASS — pan tested across all 5 `AppMode` values (AC-01e).
- C6a/C6b/C6c (negative/robustness): PARTIAL — this feature has no user-facing invalid-input
  channel (pan/zoom/reset take no free-text/numeric user input, only pointer/wheel coordinates
  which are always well-formed numbers from the browser) — C6 is largely N/A by the feature's own
  shape, documented rather than force-padded.
- C7a/b/c (config/interruption/concurrency): N/A-documented — no resource-starvation path (pure
  in-memory computation), no interruption-mid-operation semantics (each gesture is synchronous),
  no concurrency claim made by any AC.

Verdict: **ACCEPTABLE_WITH_DOCUMENTED_GAPS** (~10–11/15 mechanically applicable + passing; several
items are legitimately N/A for this feature's shape rather than gaps). Gaps classified
`AT_GAP_IN_DELIVERY_SCOPE` where DELIVER can close them via implementation (C2, C4b); none are
`SPECIFICATION_AMBIGUITY` — DESIGN's ADR-003/ADR-004/DDD-1..8 fully specify the contract, no
upstream re-entry needed.

### [REF] Final Wave Review Gate

Run by the orchestrator, 4 reviewers dispatched in parallel against this full feature-delta.md
(full 4-reviewer gate — user's explicit choice over the Sentinel-only lean default):

| Reviewer                                     | Scope   | Verdict                    | Blockers | High | Low |
| -------------------------------------------- | ------- | -------------------------- | -------- | ---- | --- |
| Eclipse (`nw-product-owner-reviewer`)        | DISCUSS | **APPROVED**               | 0        | 0    | 0   |
| Architect (`nw-solution-architect-reviewer`) | DESIGN  | **APPROVED**               | 0        | 0    | 0   |
| Forge (`nw-platform-architect-reviewer`)     | DEVOPS  | **CONDITIONALLY_APPROVED** | 0        | 0    | 2   |
| Sentinel (`nw-acceptance-designer-reviewer`) | DISTILL | **APPROVED**               | 0        | 0    | 0   |

Forge's 2 low-severity findings and their disposition:

1. "CI/CD test-discovery relies on convention, not verified" — **closed**: the orchestrator
   independently ran `pnpm test --run` after DISTILL completed and confirmed the existing `test`
   matrix (`[engine, renderer, app]`) auto-discovered all new test files with zero CI config
   changes — 34 new tests ran and failed RED as expected, 601 pre-existing tests unaffected,
   typecheck clean. Convention confirmed correct empirically, not just assumed.
2. "Stryker config not yet updated to target `geometry.ts`" — **carried forward to DELIVER**, not
   a gap: this is exactly the plan already recorded in
   `docs/decisions/DR--20260724--process--mutation-testing-scope.md`'s Next Actions ("when
   canvas-pan-zoom-navigation reaches DELIVER... point `stryker.config.mjs`'s `mutate` array at
   [`geometry.ts`'s new functions]"). No action needed now.

**Gate result: PASS — zero blockers, zero unresolved high-severity findings across all four
reviewers. Cleared for DELIVER wave handoff.**

---

## Wave: DELIVER

### [REF] Implementation Summary

Shipped Miro-style pan/zoom/reset-to-fit viewport navigation across 3 roadmap steps (01-01 pan,
01-02 zoom, 01-03 reset), each RED→GREEN→COMMIT via `nw-functional-software-crafter`. All work
lands in 6 existing files (zero new files, per DESIGN's Reuse Analysis): `packages/renderer/src/
geometry.ts` (5 new pure functions + `Viewport` type + `ZOOM_MIN`/`ZOOM_MAX`/
`RESET_VIEW_ZOOM_FLOOR` constants), `packages/renderer/src/LoopyRenderer.ts` (one transform
insertion), `packages/app/src/store.ts` (viewport state + 3 actions), `packages/app/src/
Canvas.tsx` (pan-vs-click discrimination + wheel handler), `packages/app/src/Toolbar.tsx` (Reset
View control), `packages/app/src/App.tsx` (canvas-dimension threading for Reset View).

One genuine architecture deviation surfaced and resolved during DELIVER: ADR-005 decouples Reset
View's zoom floor from manual zoom's `ZOOM_MIN`, amending DDD-6 — see ADR-005 and the DDD-6
amendment note above. Discovered by a property test correctly failing on a real, provable
mathematical conflict (not a coding gap); resolved by the human choosing to fix the architecture
rather than narrow the test.

### [REF] Files Modified

**Production**: `packages/renderer/src/geometry.ts`, `packages/renderer/src/LoopyRenderer.ts`,
`packages/app/src/store.ts`, `packages/app/src/Canvas.tsx`, `packages/app/src/Toolbar.tsx`,
`packages/app/src/App.tsx`.

**Tests**: `packages/renderer/src/geometry.test.ts` (fast-check PBT for all 5 new pure functions,
authored at DISTILL, one assertion amended at DELIVER per ADR-005), `packages/app/src/
canvas-pan-zoom.acceptance.test.tsx` (authored at DISTILL), `packages/app/src/Canvas.test.tsx` (4
tests fixed at DISTILL per ADR-003's pointerup timing consequence), `packages/app/src/
canvas-pan-zoom.domain-types.ts` (authored at DISTILL), `packages/app/src/test-setup.ts` (new
helper added at step 01-01).

**Docs**: `docs/product/architecture/adr-005-reset-view-zoom-floor-decoupled.md` (new),
`docs/feature/canvas-pan-zoom-navigation/design/wave-decisions.md` (DDD-6 amendment note).

### [REF] Scenarios Green Count

**34 of 34** DISTILL-authored tests green (18 Gherkin-mapped + 16 supporting pure-function/property
tests). Full workspace suite: **635 passed, 6 skipped, 0 failed** (38 test files), `pnpm typecheck`
clean. Zero regressions in the pre-existing 601-test baseline. Timestamp: 2026-07-24T15:24Z.

### [REF] DoD Check

| DISCUSS DoD item                             | Status                                                                                                                                       |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Problem statement clear, domain language     | PASS (unchanged from DISCUSS)                                                                                                                |
| Persona with specific characteristics        | PASS                                                                                                                                         |
| 3+ domain examples per story                 | PASS                                                                                                                                         |
| UAT in Given/When/Then                       | PASS — all implemented, all green                                                                                                            |
| AC derived from UAT                          | PASS — all 15 AC verified by passing tests                                                                                                   |
| Right-sized                                  | PASS — 3 steps, ~3 days estimated vs actual (3 crafter dispatches + 1 escalation cycle)                                                      |
| Technical constraints/dependencies           | PASS — both DISCUSS-forwarded open questions resolved at DESIGN; one new architecture question (zoom floor) surfaced and resolved at DELIVER |
| Dependencies resolved or tracked             | PASS                                                                                                                                         |
| Outcome KPIs defined with measurable targets | PASS — KPI-07/08/09 in `kpi-contracts.yaml`, measured manually per DEVOPS Decision 5 (deferred instrumentation)                              |

### [REF] Demo Evidence — 2026-07-24

Elevator Pitch demos for this feature describe UI gestures (drag, wheel-scroll, click), not CLI
commands — the Post-Merge Integration Gate's subprocess-execution mechanism doesn't fit a
browser-only feature. Adapted per this session's UI-testing convention: ran `pnpm --filter
./packages/app dev`, drove the real rendered app via browser automation (pointer/wheel event
dispatch + screenshot comparison), not synthetic jsdom.

- **US-01 (Pan)** — "run 'click-and-drag on an empty area of the canvas' → sees the whole diagram
  shift smoothly under the cursor": dispatched a pointerdown→pointermove→pointerup drag on empty
  background in select mode. All 3 nodes (Pressure, Debt, Shortcuts) shifted by an identical delta
  matching the drag vector. **PASS.**
- **US-02 (Zoom)** — "run 'scroll the mouse wheel...while hovering over the canvas' → sees the
  diagram smoothly scale in or out, centered on the cursor": dispatched a `wheel` event
  (`deltaY:-300`) over the graph. Diagram visibly scaled up, centered near the cursor point.
  **PASS.**
- **US-03 (Reset)** — "run 'click the Reset View control' → sees the canvas snap immediately to a
  view containing every node...fully visible and readable": after the pan+zoom above, clicked the
  "⛶ Reset View" toolbar button. Viewport snapped back to a fully-visible, centered layout
  matching the pre-transform framing. **PASS.**
- **Regression check**: clicked directly on the "Pressure" node's new on-screen position after the
  pan+zoom+reset sequence — hit-test correctly resolved to that node (AC-01c/AC-02d), confirming
  hit-testing accuracy survives the viewport transform in a real browser, not just jsdom. Zero
  console errors throughout the session.

All demo commands produced visible, correct output. Gate passes.

### [REF] Quality Gates

| Phase                       | Outcome                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roadmap review              | APPROVED (nw-acceptance-designer-reviewer, 0 blockers)                                                                                                        |
| Per-step TDD (01-01/02/03)  | All COMMIT/PASS in execution-log.json; step 01-03 includes 2 honest GREEN/FAIL log entries during a genuine architecture-vs-test escalation, never fabricated |
| Post-merge integration gate | PASS (this section)                                                                                                                                           |
| Refactoring (L1-L6)         | pending — next                                                                                                                                                |
| Adversarial code review     | pending — next (user chose full gate)                                                                                                                         |
| Mutation testing            | deferred — project rigor profile runs this on-demand via `/nw-mutation-test`, not as a DELIVER-blocking gate                                                  |
| Integrity verification      | pending — next                                                                                                                                                |

### [REF] Pre-requisites

DISTILL's 34 RED scaffolds and DESIGN's 8 DDD decisions (+ADR-003/004, and DELIVER's own ADR-005)
fully determined this implementation — no undocumented judgment calls beyond the canvas-dimension
threading for Reset View (flagged in slice-03's roadmap step as a DELIVER-owned implementation
choice, not an architecture question).
