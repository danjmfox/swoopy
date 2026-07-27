Feature: Canvas pan, zoom, and reset-to-fit navigation
  As a facilitator running a live systems-thinking session
  I want to pan, zoom, and reset the canvas viewport
  So that I can reach any part of a growing diagram without pausing the session

  Background:
    Given a diagram with 14 nodes, 3 of which sit outside the visible canvas

  # ── US-01: Pan the canvas by dragging ────────────────────────────────────────
  # Driving port: pointerdown/pointermove/pointerup on the canvas element
  # (packages/app/src/Canvas.tsx), exercised via jsdom fireEvent.

  # @walking_skeleton @real-io @US-01 @contract-shape:bounded-change @kpi
  Scenario: Panning reveals nodes that were off-screen
    Given Priya Raman is facilitating a session with a 14-node diagram in "select" mode
    And 3 nodes are positioned to the right of her visible canvas area
    When she presses and drags on an empty area of the canvas background
    Then the entire diagram shifts in the direction of her drag
    And the 3 previously off-screen nodes become visible within the canvas

  # @real-io @US-01 @contract-shape:unbounded-preservation
  Scenario: Panning does not alter the model
    Given Priya Raman has panned the view to bring a node into the center of her screen
    When she checks the node's position in the underlying model
    Then the node's stored x/y coordinates are unchanged from before the pan
    And only the viewport has moved, not the diagram itself

  # @real-io @US-01 @contract-shape:bounded-change
  Scenario: Node dragging still works after panning
    Given Devon Okafor has panned the view to locate a node that was off-screen
    When he presses and drags that node to a new position
    Then the node moves to the new position exactly under his cursor
    And the pan does not interfere with the node's drag

  # @real-io @US-01 @contract-shape:bounded-change
  Scenario: Panning does not trigger mode-specific background actions
    Given Priya Raman is in "add-node" mode
    When she presses and drags on empty canvas background to pan the view
    Then no new node is created as a side effect of the pan gesture
    And the view still shifts to reveal previously hidden content

  # @real-io @US-01 @contract-shape:bounded-change @kpi
  Scenario: Hit-testing remains accurate after panning
    Given Devon Okafor has panned the view so a node sits in a new screen position
    When he clicks directly on that node at its new screen position
    Then the click is recognized as a hit on that node
    And the node's edit popover opens exactly as it would before any panning occurred

  # ── US-02: Zoom in and out with wheel or pinch ───────────────────────────────
  # Driving port: wheel events on the canvas element (deltaY only = mouse wheel;
  # deltaY + ctrlKey:true = trackpad pinch synthesis, per environments.yaml).

  # @real-io @US-02 @contract-shape:bounded-change @kpi
  Scenario: Zooming in centers on the cursor
    Given Priya Raman is viewing a diagram with a cluster of 4 nodes near the left edge of her screen
    When she scrolls the mouse wheel up while her cursor is over that cluster
    Then the view zooms in and the cluster grows larger under her cursor position
    And nodes away from her cursor move further toward the edges of the screen

  # @real-io @US-02 @contract-shape:bounded-change
  Scenario: Zooming out reveals the whole structure
    Given Devon Okafor is viewing a 20-node diagram that does not fully fit on screen
    When he performs a pinch-out gesture on his trackpad
    Then the view zooms out and more of the diagram becomes visible
    And all node labels remain legible at the new zoom level

  # @real-io @US-02 @contract-shape:bounded-change @property
  Scenario: Zoom has a maximum limit
    Given Priya Raman repeatedly scrolls to zoom in on a single node
    When she reaches the maximum zoom level
    Then further scroll-up input has no additional zooming effect
    And the node remains fully rendered, readable, and not visually broken

  # @real-io @US-02 @contract-shape:bounded-change @property
  Scenario: Zoom has a minimum limit
    Given Priya Raman repeatedly scrolls to zoom out on her diagram
    When she reaches the minimum zoom level
    Then further scroll-down input has no additional zooming effect
    And every node remains visible at a non-zero, clickable size

  # @real-io @US-02 @contract-shape:bounded-change @kpi
  Scenario: Hit-testing remains accurate at any zoom level
    Given Devon Okafor has zoomed in to 200% on a specific node
    When he double-clicks that node
    Then the node's edit popover opens for that exact node
    And no neighboring node is mistakenly targeted

  # ── US-03: Reset view to fit the whole diagram ───────────────────────────────
  # Driving port: click on the "Reset View" control (packages/app/src/Toolbar.tsx).

  # @real-io @US-03 @contract-shape:bounded-change @kpi
  Scenario: Reset View recovers from zooming out too far
    Given Priya Raman has zoomed out until all 14 nodes are tiny, unreadable dots
    When she activates Reset View
    Then the canvas snaps to a view where every node is fully visible and its label is readable

  # @real-io @US-03 @contract-shape:bounded-change @kpi
  Scenario: Reset View recovers a node panned off-screen
    Given Devon Okafor panned far in one direction and can no longer see any part of the diagram
    When he activates Reset View
    Then the canvas snaps to a view containing the entire diagram, centered on screen

  # @real-io @US-03 @contract-shape:bounded-change
  Scenario: Reset View works on an empty diagram
    Given Priya Raman has just started a brand-new model with zero nodes
    When she activates Reset View
    Then the canvas returns to a default view without error

  # @real-io @US-03 @contract-shape:bounded-change
  Scenario: Reset View works with a single node
    Given Priya Raman's diagram currently has exactly one node
    When she activates Reset View
    Then the canvas centers on that node at a readable, non-extreme zoom level

  # @real-io @US-03 @contract-shape:bounded-change
  Scenario: Reset View is discoverable without prior instruction
    Given Devon Okafor has never used Swoopy's pan/zoom before and is now visually lost
    When he looks at the canvas UI
    Then he can find and activate a visibly-labelled Reset View control without consulting documentation

  # ── Pure-function contracts (packages/renderer/src/geometry.ts) ─────────────
  # Backing property tests: packages/renderer/src/geometry.test.ts (fast-check).
  # These 3 scenarios are documentation pointers to PBT properties, not
  # independently-executed Gherkin — the executable form lives entirely in
  # the Vitest file, per this project's precedent (share-url-compression).

  # @real-io @property @contract-shape:pure-function
  Scenario: Screen-to-graph and graph-to-screen coordinate transforms round-trip
    Given any viewport with pan and zoom within supported bounds
    When a screen coordinate is converted to graph space and back to screen space
    Then the result equals the original screen coordinate

  # @real-io @property @contract-shape:pure-function
  Scenario: Zoom is always clamped within the supported range
    Given any requested zoom level, including values outside the supported range
    When the zoom level is clamped
    Then the result is always within the minimum and maximum zoom bounds

  # @real-io @property @contract-shape:pure-function
  Scenario: Fit-to-content always produces a finite, in-bounds viewport
    Given any diagram with zero, one, or many nodes
    When the viewport is computed to fit all content
    Then the resulting pan and zoom are finite numbers within the supported zoom range
    And every node's screen position lies within the canvas bounds
