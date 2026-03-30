import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LoopyRenderer, arrowheadDimensions } from "./LoopyRenderer.ts";
import type { RendererStore } from "./LoopyRenderer.ts";
import type { Node, CausalEdge } from "@swoopy/engine";

function makeCanvas(): HTMLCanvasElement {
  return {
    clientWidth: 800,
    clientHeight: 600,
    getContext: () => null,
  } as unknown as HTMLCanvasElement;
}

function makeStore(tickSim = vi.fn()): () => RendererStore {
  return () => ({
    tickSim,
    simRunning: true,
    simSpeed: 1,
    graph: { nodes: [], edges: [] },
    sim: {
      signals: [],
      pending: [],
      nodeValues: new Map(),
      prevNodeValues: new Map(),
      displayPrevNodeValues: new Map(),
      tick: 0,
    },
  });
}

function makeSpyCanvas(): {
  canvas: HTMLCanvasElement;
  strokes: () => { style: string; width: number }[];
} {
  const strokes: { style: string; width: number }[] = [];
  const ctx = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn().mockImplementation(function (this: typeof ctx) {
      strokes.push({
        style: ctx.strokeStyle as string,
        width: ctx.lineWidth as number,
      });
    }),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    fillText: vi.fn(),
    fillStyle: "" as string,
    strokeStyle: "" as string,
    lineWidth: 1 as number,
    font: "" as string,
    textAlign: "" as string,
    textBaseline: "" as string,
    scale: vi.fn(),
  };
  const canvas = {
    clientWidth: 800,
    clientHeight: 600,
    width: 0,
    height: 0,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
  return { canvas, strokes: () => strokes };
}

function makeArcCanvas(): {
  canvas: HTMLCanvasElement;
  arcs: () => { x: number; y: number; r: number }[];
} {
  const arcs: { x: number; y: number; r: number }[] = [];
  const ctx = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn().mockImplementation((x: number, y: number, r: number) => {
      arcs.push({ x, y, r });
    }),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    fillText: vi.fn(),
    setLineDash: vi.fn(),
    fillStyle: "" as string,
    strokeStyle: "" as string,
    lineWidth: 1 as number,
    globalAlpha: 1 as number,
    font: "" as string,
    textAlign: "" as string,
    textBaseline: "" as string,
    scale: vi.fn(),
  };
  const canvas = {
    clientWidth: 800,
    clientHeight: 600,
    width: 0,
    height: 0,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
  return { canvas, arcs: () => arcs };
}

function makeArcFillCanvas(): {
  canvas: HTMLCanvasElement;
  fills: () => { r: number; style: string }[];
  texts: () => string[];
} {
  const fills: { r: number; style: string }[] = [];
  const texts: string[] = [];
  let lastArcR = 0;
  const ctx = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn().mockImplementation((_x: number, _y: number, r: number) => {
      lastArcR = r;
    }),
    fill: vi.fn().mockImplementation(function (this: typeof ctx) {
      fills.push({ r: lastArcR, style: ctx.fillStyle as string });
    }),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    fillText: vi.fn().mockImplementation((text: string) => {
      texts.push(text);
    }),
    setLineDash: vi.fn(),
    fillStyle: "" as string,
    strokeStyle: "" as string,
    lineWidth: 1 as number,
    globalAlpha: 1 as number,
    font: "" as string,
    textAlign: "" as string,
    textBaseline: "" as string,
    scale: vi.fn(),
  };
  const canvas = {
    clientWidth: 800,
    clientHeight: 600,
    width: 0,
    height: 0,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
  return { canvas, fills: () => fills, texts: () => texts };
}

const nodeA: Node = {
  id: "a",
  label: "A",
  x: 100,
  y: 100,
  radius: 30,
  min: 0,
  max: 10,
  initial: 5,
};
const nodeB: Node = {
  id: "b",
  label: "B",
  x: 300,
  y: 100,
  radius: 30,
  min: 0,
  max: 10,
  initial: 5,
};
const edgeAB: CausalEdge = {
  id: "e1",
  kind: "causal",
  from: "a",
  to: "b",
  polarity: 1,
  weight: 1,
  delay: "none",
  transferFn: "linear",
};

describe("LoopyRenderer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("start() calls tickSim on each RAF frame", () => {
    const tickSim = vi.fn();
    const renderer = new LoopyRenderer(makeCanvas(), makeStore(tickSim));

    renderer.start();
    vi.advanceTimersByTime(3 * (1000 / 60));
    renderer.stop();

    expect(tickSim).toHaveBeenCalled();
  });

  it("GE-20 focused node draws a white focus ring", () => {
    const { canvas, strokes } = makeSpyCanvas();
    const node: Node = {
      id: "n1",
      label: "A",
      x: 100,
      y: 100,
      radius: 40,
      min: 0,
      max: 10,
      initial: 5,
    };
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [node], edges: [] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
          prevNodeValues: new Map(),
          displayPrevNodeValues: new Map(),
          tick: 0,
        },
        focusedNodeId: node.id,
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    expect(strokes().some((s) => s.style === "#ffffff" && s.width === 3)).toBe(
      true,
    );
  });

  it("GE-20 unfocused node does not draw a white focus ring", () => {
    const { canvas, strokes } = makeSpyCanvas();
    const node: Node = {
      id: "n1",
      label: "A",
      x: 100,
      y: 100,
      radius: 40,
      min: 0,
      max: 10,
      initial: 5,
    };
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [node], edges: [] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
          prevNodeValues: new Map(),
          displayPrevNodeValues: new Map(),
          tick: 0,
        },
        focusedNodeId: null,
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    expect(strokes().some((s) => s.style === "#ffffff" && s.width === 3)).toBe(
      false,
    );
  });

  it("GE-29 draws a dim dot at the delay region on each causal edge in Select mode", () => {
    const { canvas, arcs } = makeArcCanvas();
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [nodeA, nodeB], edges: [edgeAB] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
          prevNodeValues: new Map(),
          displayPrevNodeValues: new Map(),
          tick: 0,
        },
        focusedNodeId: null,
        mode: "select",
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    expect(arcs().some((a) => a.r === 8)).toBe(true);
  });

  it("GE-29 draws a dim dot at the weight region on each causal edge in Select mode", () => {
    const { canvas, arcs } = makeArcCanvas();
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [nodeA, nodeB], edges: [edgeAB] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
          prevNodeValues: new Map(),
          displayPrevNodeValues: new Map(),
          tick: 0,
        },
        focusedNodeId: null,
        mode: "select",
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    // Expect at least 2 radius-4 dots: one for T_DELAY, one for T_WEIGHT
    expect(arcs().filter((a) => a.r === 8).length).toBeGreaterThanOrEqual(2);
  });

  it("GE-29 does not draw affordance dots in non-Select modes", () => {
    const { canvas, arcs } = makeArcCanvas();
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [nodeA, nodeB], edges: [edgeAB] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
          prevNodeValues: new Map(),
          displayPrevNodeValues: new Map(),
          tick: 0,
        },
        focusedNodeId: null,
        mode: "simulate",
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    expect(arcs().some((a) => a.r === 8)).toBe(false);
  });

  it("GE-30 draws a bright dot when hoveredEdgeRegion matches edge-delay", () => {
    const { canvas, fills } = makeArcFillCanvas();
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [nodeA, nodeB], edges: [edgeAB] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
          prevNodeValues: new Map(),
          displayPrevNodeValues: new Map(),
          tick: 0,
        },
        focusedNodeId: null,
        mode: "select",
        hoveredEdgeRegion: { edgeId: edgeAB.id, region: "delay" },
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    const dotFills = fills().filter((f) => f.r === 8);
    expect(dotFills.some((f) => f.style === "rgba(148,163,184,0.9)")).toBe(
      true,
    );
  });

  it("GE-30 draws a bright dot when hoveredEdgeRegion matches edge-weight", () => {
    const { canvas, fills } = makeArcFillCanvas();
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [nodeA, nodeB], edges: [edgeAB] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
          prevNodeValues: new Map(),
          displayPrevNodeValues: new Map(),
          tick: 0,
        },
        focusedNodeId: null,
        mode: "select",
        hoveredEdgeRegion: { edgeId: edgeAB.id, region: "weight" },
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    const dotFills = fills().filter((f) => f.r === 8);
    expect(dotFills.some((f) => f.style === "rgba(148,163,184,0.9)")).toBe(
      true,
    );
  });

  it("GE-30 renders 'Delay' tooltip text when hovering delay region", () => {
    const { canvas, texts } = makeArcFillCanvas();
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [nodeA, nodeB], edges: [edgeAB] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
          prevNodeValues: new Map(),
          displayPrevNodeValues: new Map(),
          tick: 0,
        },
        focusedNodeId: null,
        mode: "select",
        hoveredEdgeRegion: { edgeId: edgeAB.id, region: "delay" },
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    expect(texts()).toContain("Delay");
  });

  it("GE-30 renders 'Weight' tooltip text when hovering weight region", () => {
    const { canvas, texts } = makeArcFillCanvas();
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [nodeA, nodeB], edges: [edgeAB] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
          prevNodeValues: new Map(),
          displayPrevNodeValues: new Map(),
          tick: 0,
        },
        focusedNodeId: null,
        mode: "select",
        hoveredEdgeRegion: { edgeId: edgeAB.id, region: "weight" },
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    expect(texts()).toContain("Weight");
  });

  it("GE-13 causal edge lineWidth scales with weight (formula: 1 + weight * 1.5)", () => {
    function edgeCurveWidthForWeight(weight: number): number {
      const { canvas, strokes } = makeSpyCanvas();
      const edge: CausalEdge = { ...edgeAB, weight };
      const getState = () =>
        ({
          tickSim: vi.fn(),
          simRunning: false,
          simSpeed: 1,
          graph: { nodes: [nodeA, nodeB], edges: [edge] },
          sim: {
            signals: [],
            pending: [],
            nodeValues: new Map(),
            prevNodeValues: new Map(),
            displayPrevNodeValues: new Map(),
            tick: 0,
          },
          focusedNodeId: null,
          mode: "simulate",
        }) as unknown as RendererStore;
      const renderer = new LoopyRenderer(canvas, getState);
      renderer.start();
      vi.advanceTimersByTime(1000 / 60);
      renderer.stop();
      // Causal edges are drawn before nodes; the first stroke() is the edge curve
      return strokes()[0].width;
    }
    const w0 = edgeCurveWidthForWeight(0);
    const w1 = edgeCurveWidthForWeight(1);
    const w5 = edgeCurveWidthForWeight(5);
    expect(w0).toBeLessThan(w1);
    expect(w1).toBeLessThan(w5);
  });

  it("stroke path ends at arrowhead base, not tip, so thick lines don't square off the arrowhead", () => {
    const quadCurves: Array<{
      cpx: number;
      cpy: number;
      ex: number;
      ey: number;
    }> = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      quadraticCurveTo: vi
        .fn()
        .mockImplementation(
          (cpx: number, cpy: number, ex: number, ey: number) => {
            quadCurves.push({ cpx, cpy, ex, ey });
          },
        ),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      font: "",
      textAlign: "",
      textBaseline: "",
      scale: vi.fn(),
    };
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;
    const heavyEdge: CausalEdge = { ...edgeAB, weight: 5 };
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [nodeA, nodeB], edges: [heavyEdge] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
          prevNodeValues: new Map(),
          displayPrevNodeValues: new Map(),
          tick: 0,
        },
        focusedNodeId: null,
        mode: "simulate",
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    // nodeB is at x=300,y=100,r=30; edge goes left→right so x2=270,y2=100
    const x2 = 270,
      y2 = 100;
    const strokeCurve = quadCurves[0];
    expect(strokeCurve.ex).not.toBeCloseTo(x2, 0);
    expect(strokeCurve).toBeDefined();
  });

  it("arrowheadDimensions(1) returns the baseline size (len=10, half=5)", () => {
    const { len, half } = arrowheadDimensions(1);
    expect(len).toBe(10);
    expect(half).toBe(5);
  });

  it("arrowheadDimensions(5) halfWidth exceeds half the lineWidth so arrowhead is visible", () => {
    const lineWidthAt5 = 1 + 5 * 1.5; // 8.5
    const { half } = arrowheadDimensions(5);
    expect(half).toBeGreaterThan(lineWidthAt5 / 2);
  });

  it("arrowheadDimensions scales up from weight=1 to weight=5", () => {
    const w1 = arrowheadDimensions(1);
    const w5 = arrowheadDimensions(5);
    expect(w5.len).toBeGreaterThan(w1.len);
    expect(w5.half).toBeGreaterThan(w1.half);
  });

  it("draws a ghost arc at dragPosition when a node is being dragged", () => {
    const { canvas, arcs } = makeArcCanvas();
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [nodeA], edges: [] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
          prevNodeValues: new Map(),
          displayPrevNodeValues: new Map(),
          tick: 0,
        },
        focusedNodeId: null,
        mode: "select",
        dragPosition: { nodeId: nodeA.id, x: 200, y: 250 },
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    // Ghost arc drawn at drag position (200, 250) with nodeA.radius
    expect(
      arcs().some((a) => a.x === 200 && a.y === 250 && a.r === nodeA.radius),
    ).toBe(true);
  });

  it("SI-12 draws ▲ trend arrow when displayPrevNodeValues is lower than current value", () => {
    const { canvas, texts } = makeArcFillCanvas();
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: true,
        simSpeed: 1,
        graph: { nodes: [nodeA], edges: [] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map([[nodeA.id, 7]]),
          prevNodeValues: new Map([[nodeA.id, 7]]),
          displayPrevNodeValues: new Map([[nodeA.id, 5]]),
          tick: 1,
        },
        focusedNodeId: null,
        mode: "select",
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    expect(texts()).toContain("▲");
  });

  it("SI-12 draws ▼ trend arrow when displayPrevNodeValues is higher than current value", () => {
    const { canvas, texts } = makeArcFillCanvas();
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: true,
        simSpeed: 1,
        graph: { nodes: [nodeA], edges: [] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map([[nodeA.id, 3]]),
          prevNodeValues: new Map([[nodeA.id, 3]]),
          displayPrevNodeValues: new Map([[nodeA.id, 5]]),
          tick: 1,
        },
        focusedNodeId: null,
        mode: "select",
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    expect(texts()).toContain("▼");
  });

  it("stop() halts the RAF loop", () => {
    const tickSim = vi.fn();
    const renderer = new LoopyRenderer(makeCanvas(), makeStore(tickSim));

    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    const callsAtStop = tickSim.mock.calls.length;

    vi.advanceTimersByTime(10 * (1000 / 60));
    expect(tickSim.mock.calls.length).toBe(callsAtStop);
  });
});
