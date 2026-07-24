/**
 * Acceptance scenarios for canvas pan/zoom/reset-to-fit navigation
 * (docs/feature/canvas-pan-zoom-navigation, US-01/US-02/US-03).
 *
 * Matches docs/scenarios/canvas-pan-zoom-navigation/acceptance.feature.
 * Driving port: the Zustand store's viewport actions (setViewportPan,
 * zoomAt, resetViewport) — the same driving-port style as
 * url-persistence.acceptance.test.ts. Store actions are RED scaffolds
 * (__SCAFFOLD_VIEWPORT__ in store.ts / geometry.ts) as of this DISTILL wave
 * — every test below is expected to fail with the scaffold's thrown Error
 * until DELIVER implements the real transform, one scenario at a time.
 *
 * Pillar 3 (production composition root): tests call useStore.getState()
 * directly — the real Zustand store IS this app's composition root (no DI
 * container exists or is needed for a client-only SPA). No fakes: all
 * driven ports (packages/renderer's pure geometry functions) are real,
 * in-process calls per the Architecture of Reference (no external/costly
 * adapters exist in this feature — see feature-delta.md adapter coverage
 * table).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { useStore } from "./store.ts";
import { Canvas } from "./Canvas.tsx";
import { Toolbar } from "./Toolbar.tsx";
import { makeNodeId, makeEdgeId } from "@swoopy/engine";
import type { Graph } from "@swoopy/engine";
import { WheelInputPath, DiagramSize } from "./canvas-pan-zoom.domain-types.ts";

// ── Fixtures ──────────────────────────────────────────────────────────────
// Production-Data AC (slice-01/02/03): a realistic 14-node diagram, not a
// 1-2 node synthetic fixture — the off-screen-node pain point only
// manifests at realistic diagram sizes.

function buildDiagram(size: DiagramSize): Graph {
  const emptyGraph: Graph = {
    nodes: [],
    edges: [],
    annotations: [],
    modulators: [],
  };
  if (size === DiagramSize.Empty) return emptyGraph;

  const node = (i: number) => ({
    id: makeNodeId(`n${i}`),
    label: `Node ${i}`,
    x: i * 120,
    y: (i % 2) * 100,
    radius: 30,
    sizeTier: "m" as const,
    colourTier: "blue" as const,
    min: 0,
    max: 10,
    initial: 5,
  });

  if (size === DiagramSize.Single) {
    return { ...emptyGraph, nodes: [node(0)] };
  }

  // Many: 14 nodes (matches US-01's "14-node diagram" domain example),
  // 3 of which sit past a typical 1000px-wide visible canvas.
  const nodes = Array.from({ length: 14 }, (_, i) => node(i));
  const edges = nodes.slice(1).map((n, i) => ({
    kind: "causal" as const,
    id: makeEdgeId(`e${i}`),
    from: nodes[i]!.id,
    to: n.id,
    polarity: 1 as const,
    weight: 1,
    delay: "none" as const,
    transferFn: "linear" as const,
  }));
  return { ...emptyGraph, nodes, edges };
}

function resetStore(overrides: Partial<Parameters<typeof useStore.setState>[0]> = {}) {
  useStore.setState({
    graph: buildDiagram(DiagramSize.Many),
    mode: "select",
    viewport: { panX: 0, panY: 0, zoom: 1 },
    ...overrides,
  } as Parameters<typeof useStore.setState>[0]);
}

// ── US-01: Pan the canvas by dragging ──────────────────────────────────────

describe("US-01 — pan the canvas by dragging (AC-01a/b)", () => {
  beforeEach(() => resetStore());

  it("setViewportPan shifts the viewport in the drag direction", () => {
    useStore.getState().setViewportPan(-150, 0);
    expect(useStore.getState().viewport.panX).toBe(-150);
  });

  it("@contract-shape:unbounded-preservation panning never mutates node/edge/annotation coordinates", () => {
    const before = useStore.getState().graph;
    useStore.getState().setViewportPan(-150, -40);
    const after = useStore.getState().graph;
    expect(after).toBe(before); // referentially unchanged — no commitGraph call
    expect(after.nodes).toEqual(before.nodes);
  });
});

// @walking_skeleton @real-io @US-01 @contract-shape:bounded-change — this
// describe block is the feature's ONE walking skeleton: real production
// composition root (Canvas.tsx rendered, real jsdom PointerEvent dispatch),
// proving the shared viewport transform threads through the mature
// render/hitTest stack end-to-end (D3 — the one architectural risk).
describe("US-01 — pan gesture via the canvas driving port (AC-01a/c/d/e)", () => {
  beforeEach(() => resetStore());

  it("@walking_skeleton dragging on empty canvas background shifts the viewport (AC-01a)", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    const before = useStore.getState().viewport;

    fireEvent.pointerDown(canvas, { clientX: 500, clientY: 300 });
    fireEvent.pointerMove(canvas, { clientX: 350, clientY: 280 });
    fireEvent.pointerUp(canvas, { clientX: 350, clientY: 280 });

    expect(useStore.getState().viewport).not.toEqual(before);
  });

  it("panning in add-node mode does not create a node (AC-01d)", async () => {
    resetStore({ mode: "add-node" });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    const nodeCountBefore = useStore.getState().graph.nodes.length;

    fireEvent.pointerDown(canvas, { clientX: 500, clientY: 300 });
    fireEvent.pointerMove(canvas, { clientX: 350, clientY: 280 });
    fireEvent.pointerUp(canvas, { clientX: 350, clientY: 280 });

    expect(useStore.getState().graph.nodes.length).toBe(nodeCountBefore);
  });

  it.each(["select", "add-edge", "delete", "simulate"] as const)(
    "pan works in %s mode without breaking that mode's background click (AC-01e)",
    async (mode) => {
      resetStore({ mode });
      const { container } = render(<Canvas />);
      await act(async () => {});
      const canvas = container.querySelector("canvas")!;
      const before = useStore.getState().viewport;

      fireEvent.pointerDown(canvas, { clientX: 500, clientY: 300 });
      fireEvent.pointerMove(canvas, { clientX: 400, clientY: 300 });
      fireEvent.pointerUp(canvas, { clientX: 400, clientY: 300 });

      expect(useStore.getState().viewport).not.toEqual(before);
    },
  );
});

// ── US-02: Zoom in and out with wheel or pinch ─────────────────────────────

describe("US-02 — zoom via the zoomAt driving port (AC-02a/b/e)", () => {
  beforeEach(() => resetStore());

  it("zoomAt changes the zoom level", () => {
    useStore.getState().zoomAt(400, 300, -100);
    expect(useStore.getState().viewport.zoom).not.toBe(1);
  });

  it("@contract-shape:unbounded-preservation zooming never mutates node coordinates", () => {
    const before = useStore.getState().graph;
    useStore.getState().zoomAt(400, 300, -100);
    expect(useStore.getState().graph).toBe(before);
  });

  it("repeated zoom-in stops at the maximum bound (AC-02b)", () => {
    for (let i = 0; i < 50; i++) useStore.getState().zoomAt(400, 300, -1000);
    expect(useStore.getState().viewport.zoom).toBeLessThanOrEqual(4);
  });

  it("repeated zoom-out stops at the minimum bound (AC-02b)", () => {
    for (let i = 0; i < 50; i++) useStore.getState().zoomAt(400, 300, 1000);
    expect(useStore.getState().viewport.zoom).toBeGreaterThanOrEqual(0.5);
  });
});

describe("US-02 — wheel gesture via the canvas driving port (AC-02a)", () => {
  beforeEach(() => resetStore());

  it.each([
    [WheelInputPath.MouseWheelDesktop, { ctrlKey: false }],
    [WheelInputPath.TrackpadPinchCtrlWheel, { ctrlKey: true }],
  ])("%s: wheel event over the canvas changes zoom", async (_path, opts) => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    const before = useStore.getState().viewport.zoom;

    fireEvent.wheel(canvas, { deltaY: -100, clientX: 300, clientY: 200, ...opts });

    expect(useStore.getState().viewport.zoom).not.toBe(before);
  });
});

// ── US-03: Reset view to fit the whole diagram ─────────────────────────────

describe("US-03 — reset view via the resetViewport driving port (AC-03a/b/c/d)", () => {
  it.each([DiagramSize.Empty, DiagramSize.Single, DiagramSize.Many])(
    "resetViewport produces a finite, non-erroring viewport for a %s diagram (AC-03c)",
    (size) => {
      resetStore({ graph: buildDiagram(size), viewport: { panX: 999, panY: -999, zoom: 3.7 } });
      useStore.getState().resetViewport(800, 600);
      const { panX, panY, zoom } = useStore.getState().viewport;
      expect(Number.isFinite(panX)).toBe(true);
      expect(Number.isFinite(panY)).toBe(true);
      expect(zoom).toBeGreaterThan(0);
    },
  );

  it("@contract-shape:unbounded-preservation Reset View never mutates the graph model (AC-03d)", () => {
    resetStore();
    const before = useStore.getState().graph;
    useStore.getState().resetViewport(800, 600);
    expect(useStore.getState().graph).toBe(before);
  });

  it("Reset View recovers from an extreme zoomed-out state (AC-03a)", () => {
    resetStore({ viewport: { panX: 0, panY: 0, zoom: 0.5 } });
    useStore.getState().resetViewport(800, 600);
    const { zoom } = useStore.getState().viewport;
    expect(zoom).toBeGreaterThan(0);
    expect(zoom).toBeLessThanOrEqual(4);
  });
});

describe("US-03 — Reset View control on the Toolbar (AC-03b/e)", () => {
  beforeEach(() => resetStore());

  it("Reset View control is discoverable — visibly labelled, always rendered (AC-03e)", () => {
    const { getByTitle } = render(<Toolbar />);
    expect(getByTitle("Reset View")).toBeTruthy();
  });

  it.each(["select", "add-node", "add-edge", "delete", "simulate"] as const)(
    "Reset View control is available regardless of mode (AC-03b, mode=%s)",
    (mode) => {
      resetStore({ mode });
      const { getByTitle } = render(<Toolbar />);
      expect(getByTitle("Reset View")).toBeTruthy();
    },
  );
});
