import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  LoopyRenderer,
  arrowheadDimensions,
  signalChevronVisuals,
  ANIM_START,
  ANIM_END,
} from "./LoopyRenderer.ts";
import type { RendererStore } from "./LoopyRenderer.ts";
import { makeNodeId, makeEdgeId, makeModulatorId } from "@swoopy/engine";
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
    graph: { nodes: [], edges: [], annotations: [], modulators: [] },
    sim: {
      signals: [],
      pending: [],
      nodeValues: new Map(),
      displayPrevNodeValues: new Map(),
      tick: 0,
    },
    focusedNodeId: null,
    mode: "select",
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
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
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
  id: "a" as import("@swoopy/engine").NodeId,
  label: "A",
  x: 100,
  y: 100,
  radius: 30,
  sizeTier: "m",
  colourTier: "blue",
  min: 0,
  max: 10,
  initial: 5,
};
const nodeB: Node = {
  id: "b" as import("@swoopy/engine").NodeId,
  label: "B",
  x: 300,
  y: 100,
  radius: 30,
  sizeTier: "m",
  colourTier: "blue",
  min: 0,
  max: 10,
  initial: 5,
};
const edgeAB: CausalEdge = {
  id: "e1" as import("@swoopy/engine").EdgeId,
  kind: "causal",
  from: "a" as import("@swoopy/engine").NodeId,
  to: "b" as import("@swoopy/engine").NodeId,
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
      id: "n1" as import("@swoopy/engine").NodeId,
      label: "A",
      x: 100,
      y: 100,
      radius: 40,
      sizeTier: "m",
      colourTier: "blue",
      min: 0,
      max: 10,
      initial: 5,
    };
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [node], edges: [], annotations: [], modulators: [] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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
      id: "n1" as import("@swoopy/engine").NodeId,
      label: "A",
      x: 100,
      y: 100,
      radius: 40,
      sizeTier: "m",
      colourTier: "blue",
      min: 0,
      max: 10,
      initial: 5,
    };
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [node], edges: [], annotations: [], modulators: [] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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
        graph: {
          nodes: [nodeA, nodeB],
          edges: [edgeAB],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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
        graph: {
          nodes: [nodeA, nodeB],
          edges: [edgeAB],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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
        graph: {
          nodes: [nodeA, nodeB],
          edges: [edgeAB],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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
        graph: {
          nodes: [nodeA, nodeB],
          edges: [edgeAB],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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
        graph: {
          nodes: [nodeA, nodeB],
          edges: [edgeAB],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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
        graph: {
          nodes: [nodeA, nodeB],
          edges: [edgeAB],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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
        graph: {
          nodes: [nodeA, nodeB],
          edges: [edgeAB],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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
          graph: {
            nodes: [nodeA, nodeB],
            edges: [edge],
            annotations: [],
            modulators: [],
          },
          sim: {
            signals: [],
            pending: [],
            nodeValues: new Map(),
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
      return strokes()[0]!.width;
    }
    const w0 = edgeCurveWidthForWeight(0);
    const w1 = edgeCurveWidthForWeight(1);
    const w5 = edgeCurveWidthForWeight(5);
    expect(w0).toBeLessThan(w1);
    expect(w1).toBeLessThan(w5);
  });

  it("signal with sign=1 on +ve edge renders blue chevron", () => {
    const { canvas, fills } = makeArcFillCanvas();
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: {
          nodes: [nodeA, nodeB],
          edges: [edgeAB],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [
            {
              id: "s1",
              edgeId: edgeAB.id,
              progress: 0.5,
              strength: 1,
              hopsRemaining: 8,
              sign: 1 as const,
            },
          ],
          pending: [],
          nodeValues: new Map(),
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
    // Chevron uses triangle path (no arc) — color is unique to signals
    expect(fills().some((f) => f.style === "rgb(125,211,252)")).toBe(true);
  });

  it("signal with sign=-1 on +ve edge renders red chevron", () => {
    const { canvas, fills } = makeArcFillCanvas();
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: {
          nodes: [nodeA, nodeB],
          edges: [edgeAB],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [
            {
              id: "s1",
              edgeId: edgeAB.id,
              progress: 0.5,
              strength: 1,
              hopsRemaining: 8,
              sign: -1 as const,
            },
          ],
          pending: [],
          nodeValues: new Map(),
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
    // Chevron uses triangle path (no arc) — color is unique to signals
    expect(fills().some((f) => f.style === "rgb(252,165,165)")).toBe(true);
  });

  it("signal with sign=1 rotates chevron screen-up (−π/2) and sign=-1 screen-down (+π/2)", () => {
    function rotateAnglesForSign(sign: 1 | -1): number[] {
      const rotates: number[] = [];
      const ctx = {
        setTransform: vi.fn(),
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        closePath: vi.fn(),
        fillText: vi.fn(),
        setLineDash: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn().mockImplementation((a: number) => rotates.push(a)),
        scale: vi.fn(),
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1,
        globalAlpha: 1,
        font: "",
        textAlign: "",
        textBaseline: "",
      };
      const canvas = {
        clientWidth: 800,
        clientHeight: 600,
        width: 0,
        height: 0,
        getContext: () => ctx,
      } as unknown as HTMLCanvasElement;
      const getState = () =>
        ({
          tickSim: vi.fn(),
          simRunning: false,
          simSpeed: 1,
          graph: {
            nodes: [nodeA, nodeB],
            edges: [edgeAB],
            annotations: [],
            modulators: [],
          },
          sim: {
            signals: [
              {
                id: "s1",
                edgeId: edgeAB.id,
                progress: 0.5,
                strength: 1,
                hopsRemaining: 8,
                sign,
              },
            ],
            pending: [],
            nodeValues: new Map(),
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
      return rotates;
    }

    const positiveAngles = rotateAnglesForSign(1);
    const negativeAngles = rotateAnglesForSign(-1);
    // Both should have exactly one rotate call (the signal chevron)
    expect(positiveAngles.length).toBe(1);
    expect(negativeAngles.length).toBe(1);
    // sign=1 → screen-up (−π/2), sign=-1 → screen-down (+π/2)
    expect(positiveAngles[0]).toBeCloseTo(-Math.PI / 2, 5);
    expect(negativeAngles[0]).toBeCloseTo(Math.PI / 2, 5);
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
        graph: {
          nodes: [nodeA, nodeB],
          edges: [heavyEdge],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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
    // nodeB is at x=300,y=100,r=30; edge goes left→right so x2=270
    const x2 = 270;
    const strokeCurve = quadCurves[0]!;
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
        graph: { nodes: [nodeA], edges: [], annotations: [], modulators: [] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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
        graph: { nodes: [nodeA], edges: [], annotations: [], modulators: [] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map([[nodeA.id, 7]]),
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
        graph: { nodes: [nodeA], edges: [], annotations: [], modulators: [] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map([[nodeA.id, 3]]),
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

  it("SI-18 label renders at node.y - 6 when trend is stable", () => {
    const fillTexts: { text: string; x: number; y: number }[] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      setLineDash: vi.fn(),
      scale: vi.fn(),
      fillText: vi
        .fn()
        .mockImplementation((text: string, x: number, y: number) => {
          fillTexts.push({ text, x, y });
        }),
      fillStyle: "" as string,
      strokeStyle: "" as string,
      lineWidth: 1 as number,
      globalAlpha: 1 as number,
      font: "" as string,
      textAlign: "" as string,
      textBaseline: "" as string,
    };
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;

    // stable: value === displayPrevValue
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [nodeA], edges: [], annotations: [], modulators: [] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map([[nodeA.id, 5]]),
          displayPrevNodeValues: new Map([[nodeA.id, 5]]),
          tick: 0,
        },
        focusedNodeId: null,
        mode: "select",
      }) as unknown as RendererStore;

    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();

    const labelCall = fillTexts.find((t) => t.text === nodeA.label);
    expect(labelCall).toBeDefined();
    expect(labelCall!.y).toBe(nodeA.y - 6);
  });

  it("SI-18 label renders at node.y - 6 when trend is active (no layout shift)", () => {
    const fillTexts: { text: string; x: number; y: number }[] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      setLineDash: vi.fn(),
      scale: vi.fn(),
      fillText: vi
        .fn()
        .mockImplementation((text: string, x: number, y: number) => {
          fillTexts.push({ text, x, y });
        }),
      fillStyle: "" as string,
      strokeStyle: "" as string,
      lineWidth: 1 as number,
      globalAlpha: 1 as number,
      font: "" as string,
      textAlign: "" as string,
      textBaseline: "" as string,
    };
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;

    // rising: value > displayPrevValue
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [nodeA], edges: [], annotations: [], modulators: [] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map([[nodeA.id, 7]]),
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

    const labelCall = fillTexts.find((t) => t.text === nodeA.label);
    expect(labelCall).toBeDefined();
    expect(labelCall!.y).toBe(nodeA.y - 6);
  });

  it("SI-12 stock arc end angle never exceeds start + π (constrained to right semicircle)", () => {
    const arcCalls: { start: number; end: number }[] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi
        .fn()
        .mockImplementation(
          (_x: number, _y: number, _r: number, start: number, end: number) => {
            arcCalls.push({ start, end });
          },
        ),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      scale: vi.fn(),
      fillStyle: "" as string,
      strokeStyle: "" as string,
      lineWidth: 1 as number,
      globalAlpha: 1 as number,
      font: "" as string,
      textAlign: "" as string,
      textBaseline: "" as string,
    };
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;

    // fill = 1 (value at max) — would produce a full circle under the old code
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [nodeA], edges: [], annotations: [], modulators: [] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map([[nodeA.id, 10]]),
          displayPrevNodeValues: new Map([[nodeA.id, 10]]),
          tick: 0,
        },
      }) as unknown as RendererStore;

    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();

    const stockArc = arcCalls.find(
      (a) => a.end > a.start && a.end - a.start <= Math.PI + 0.001,
    );
    expect(stockArc).toBeDefined();
    expect(stockArc!.end - stockArc!.start).toBeLessThanOrEqual(Math.PI);
  });

  it("SI-19 delay arc end angle never exceeds start − π (constrained to left semicircle)", () => {
    const arcCalls: { start: number; end: number; ccw: boolean }[] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi
        .fn()
        .mockImplementation(
          (
            _x: number,
            _y: number,
            _r: number,
            start: number,
            end: number,
            ccw = false,
          ) => {
            arcCalls.push({ start, end, ccw });
          },
        ),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      scale: vi.fn(),
      fillStyle: "" as string,
      strokeStyle: "" as string,
      lineWidth: 1 as number,
      globalAlpha: 1 as number,
      font: "" as string,
      textAlign: "" as string,
      textBaseline: "" as string,
    };
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;

    // fraction = 1 (mass >= nodeMax) — would produce a full circle under the old code
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: {
          nodes: [nodeA],
          edges: [edgeAB],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [
            {
              signal: {
                id: "p1",
                edgeId: edgeAB.id,
                progress: 0,
                strength: 10,
              },
              ticksRemaining: 3,
            },
          ],
          nodeValues: new Map([[nodeA.id, 5]]),
          displayPrevNodeValues: new Map([[nodeA.id, 5]]),
          tick: 0,
        },
      }) as unknown as RendererStore;

    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();

    const delayArc = arcCalls.find((a) => a.ccw);
    expect(delayArc).toBeDefined();
    expect(delayArc!.start - delayArc!.end).toBeLessThanOrEqual(Math.PI);
  });

  it("SI-19 delay arc strokes in amber when pending mass is within nodeMax", () => {
    const strokes: { style: string }[] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn().mockImplementation(function (this: typeof ctx) {
        strokes.push({ style: ctx.strokeStyle as string });
      }),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      scale: vi.fn(),
      fillStyle: "" as string,
      strokeStyle: "" as string,
      lineWidth: 1 as number,
      globalAlpha: 1 as number,
      font: "" as string,
      textAlign: "" as string,
      textBaseline: "" as string,
    };
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;

    // mass = 5, nodeA.max = 10 → fraction 0.5, no overflow
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: {
          nodes: [nodeA],
          edges: [edgeAB],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [
            {
              signal: { id: "p1", edgeId: edgeAB.id, progress: 0, strength: 5 },
              ticksRemaining: 3,
            },
          ],
          nodeValues: new Map([[nodeA.id, 5]]),
          displayPrevNodeValues: new Map([[nodeA.id, 5]]),
          tick: 0,
        },
      }) as unknown as RendererStore;

    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();

    expect(strokes.some((s) => s.style === "#fb923c")).toBe(true);
  });

  it("SI-19 delay arc strokes in red when pending mass exceeds nodeMax", () => {
    const strokes: { style: string }[] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn().mockImplementation(function (this: typeof ctx) {
        strokes.push({ style: ctx.strokeStyle as string });
      }),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      scale: vi.fn(),
      fillStyle: "" as string,
      strokeStyle: "" as string,
      lineWidth: 1 as number,
      globalAlpha: 1 as number,
      font: "" as string,
      textAlign: "" as string,
      textBaseline: "" as string,
    };
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;

    // mass = 12, nodeA.max = 10 → overflow
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: {
          nodes: [nodeA],
          edges: [edgeAB],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [
            {
              signal: {
                id: "p1",
                edgeId: edgeAB.id,
                progress: 0,
                strength: 12,
              },
              ticksRemaining: 3,
            },
          ],
          nodeValues: new Map([[nodeA.id, 5]]),
          displayPrevNodeValues: new Map([[nodeA.id, 5]]),
          tick: 0,
        },
      }) as unknown as RendererStore;

    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();

    expect(strokes.some((s) => s.style === "#f87171")).toBe(true);
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

  it("GE-36 draws annotation text below node circle when annotation is set", () => {
    const fillTexts: { text: string; x: number; y: number }[] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      setLineDash: vi.fn(),
      scale: vi.fn(),
      fillText: vi
        .fn()
        .mockImplementation((text: string, x: number, y: number) => {
          fillTexts.push({ text, x, y });
        }),
      fillStyle: "" as string,
      strokeStyle: "" as string,
      lineWidth: 1 as number,
      globalAlpha: 1 as number,
      font: "" as string,
      textAlign: "" as string,
      textBaseline: "" as string,
    };
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;

    const annotatedNode: Node = {
      ...nodeA,
      annotation: "GDP per capita",
    };
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: {
          nodes: [annotatedNode],
          edges: [],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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

    const annotationCall = fillTexts.find((t) => t.text === "GDP per capita");
    expect(annotationCall).toBeDefined();
    expect(annotationCall!.y).toBe(annotatedNode.y + annotatedNode.radius + 14);
  });

  it("GE-36 truncates annotation to 24 chars with ellipsis in renderer", () => {
    const fillTexts: { text: string; x: number; y: number }[] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      setLineDash: vi.fn(),
      scale: vi.fn(),
      fillText: vi
        .fn()
        .mockImplementation((text: string, x: number, y: number) => {
          fillTexts.push({ text, x, y });
        }),
      fillStyle: "" as string,
      strokeStyle: "" as string,
      lineWidth: 1 as number,
      globalAlpha: 1 as number,
      font: "" as string,
      textAlign: "" as string,
      textBaseline: "" as string,
    };
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;

    const annotatedNode: Node = {
      ...nodeA,
      annotation: "This is a very long annotation string",
    };
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: {
          nodes: [annotatedNode],
          edges: [],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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

    const annotationCall = fillTexts.find(
      (t) => t.text === "This is a very long anno…",
    );
    expect(annotationCall).toBeDefined();
  });

  it("GE-36 does not draw annotation text when annotation is undefined", () => {
    const fillTexts: string[] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      setLineDash: vi.fn(),
      scale: vi.fn(),
      fillText: vi.fn().mockImplementation((text: string) => {
        fillTexts.push(text);
      }),
      fillStyle: "" as string,
      strokeStyle: "" as string,
      lineWidth: 1 as number,
      globalAlpha: 1 as number,
      font: "" as string,
      textAlign: "" as string,
      textBaseline: "" as string,
    };
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;

    // nodeA has no annotation field
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: { nodes: [nodeA], edges: [], annotations: [], modulators: [] },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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

    // Only label "A" and no annotation-like text
    expect(
      fillTexts.every((t) => t === nodeA.label || t === "▲" || t === "▼"),
    ).toBe(true);
  });
});

// GE-37: annotation box rendering
describe("GE-37 annotation rendering", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("draws a rounded rect with electric blue (#3b82f6) stroke for an annotation", () => {
    const strokes: { style: string }[] = [];
    const fills: { style: string }[] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn().mockImplementation(function (this: typeof ctx) {
        fills.push({ style: ctx.fillStyle as string });
      }),
      stroke: vi.fn().mockImplementation(function (this: typeof ctx) {
        strokes.push({ style: ctx.strokeStyle as string });
      }),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      roundRect: vi.fn(),
      setLineDash: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 0 }),
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

    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: {
          nodes: [],
          edges: [],
          annotations: [{ id: "a1", x: 100, y: 100, text: "hello" }],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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

    const blueStroke = strokes.find((s) => s.style === "#3b82f6");
    expect(blueStroke).toBeDefined();
  });
});

// GE-41: QF edge rendering
describe("GE-41 QF edge rendering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls setLineDash with a non-empty pattern for a QF edge", () => {
    const setLineDashCalls: unknown[][] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      setLineDash: vi.fn().mockImplementation((...args: unknown[]) => {
        setLineDashCalls.push(args);
      }),
      scale: vi.fn(),
      fillText: vi.fn(),
      fillStyle: "" as string,
      strokeStyle: "" as string,
      lineWidth: 1 as number,
      globalAlpha: 1 as number,
      font: "" as string,
      textAlign: "" as string,
      textBaseline: "" as string,
    };
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;

    const qfEdge: CausalEdge = {
      ...edgeAB,
      isQuickFix: true,
    };

    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: {
          nodes: [nodeA, nodeB],
          edges: [qfEdge],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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

    // At least one setLineDash call must pass a non-empty array (the dashed pattern)
    const dashedCall = setLineDashCalls.find(
      (args) => Array.isArray(args[0]) && (args[0] as number[]).length > 0,
    );
    expect(dashedCall).toBeDefined();
  });

  it("renders a 'QF' label for a QF edge", () => {
    const fillTexts: string[] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      setLineDash: vi.fn(),
      scale: vi.fn(),
      fillText: vi.fn().mockImplementation((text: string) => {
        fillTexts.push(text);
      }),
      fillStyle: "" as string,
      strokeStyle: "" as string,
      lineWidth: 1 as number,
      globalAlpha: 1 as number,
      font: "" as string,
      textAlign: "" as string,
      textBaseline: "" as string,
    };
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;

    const qfEdge: CausalEdge = {
      ...edgeAB,
      isQuickFix: true,
    };

    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: {
          nodes: [nodeA, nodeB],
          edges: [qfEdge],
          annotations: [],
          modulators: [],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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

    expect(fillTexts).toContain("QF");
  });
});

// GE-44: modulator terminus must land at the T_POLARITY Bézier midpoint of the
// target edge. Bug: drawModulators computed cx/cy without normalising by edge
// length, so for long or diagonal edges the terminus landed far off-screen.
describe("GE-44 modulator terminus position", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("terminus arc lands at the T_POLARITY point of the target QF edge (same as polarity badge)", () => {
    const arcCalls: { x: number; y: number; r: number }[] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn().mockImplementation((x: number, y: number, r: number) => {
        arcCalls.push({ x, y, r });
      }),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      fillStyle: "" as string,
      strokeStyle: "" as string,
      lineWidth: 1 as number,
      globalAlpha: 1 as number,
      font: "" as string,
      textAlign: "" as string,
      textBaseline: "" as string,
    };
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;

    // Two parallel edges so the QF edge gets bow = -BOW (has a sibling).
    // nodeA=(100,100) → nodeB=(300,100): horizontal, edge length 200px,
    // clipped endpoints x1=130 y1=100, x2=270 y2=100.
    // controlPoint(130,100,270,100,-28): len=140, cy = 100+28 = 128.
    // bezierPoint(..., 0.5) → (200, 114).  That is where both polarity
    // badge and modulator terminus must land after the fix.
    const normalEdge: CausalEdge = {
      id: "e-normal" as import("@swoopy/engine").EdgeId,
      kind: "causal",
      from: nodeA.id,
      to: nodeB.id,
      polarity: 1,
      weight: 1,
      delay: "none",
      transferFn: "linear",
    };
    const qfEdge: CausalEdge = {
      id: "e-qf" as import("@swoopy/engine").EdgeId,
      kind: "causal",
      from: nodeA.id,
      to: nodeB.id,
      polarity: 1,
      weight: 1,
      delay: "none",
      transferFn: "linear",
      isQuickFix: true,
    };
    const nodeC: Node = {
      id: "c" as import("@swoopy/engine").NodeId,
      label: "C",
      x: 400,
      y: 300,
      radius: 30,
      sizeTier: "m",
      colourTier: "blue",
      min: 0,
      max: 10,
      initial: 5,
    };

    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: {
          nodes: [nodeA, nodeB, nodeC],
          edges: [normalEdge, qfEdge],
          annotations: [],
          modulators: [
            {
              id: "m1" as import("@swoopy/engine").ModulatorId,
              from: nodeC.id,
              target: qfEdge.id,
              polarity: 1 as const,
            },
          ],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map(),
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

    const BADGE_R = 9;
    const MOD_BADGE_R = 7;
    const TERMINUS_X = 200;
    const TERMINUS_Y = 114; // bezierPoint at t=0.5 using correct controlPoint
    // nodeC=(400,300), terminus=(200,114) → arc midpoint=(300,207)
    const MOD_BADGE_X = 300;
    const MOD_BADGE_Y = 207;

    // The QF edge polarity badge lands at (200, 114) when using the correct
    // normalised controlPoint formula.
    const qfBadge = arcCalls.find(
      (a) => a.r === BADGE_R && Math.abs(a.y - TERMINUS_Y) < 1,
    );
    // Modulator polarity badge (r=7) at arc midpoint (300, 207)
    const modBadge = arcCalls.find(
      (a) =>
        a.r === MOD_BADGE_R &&
        Math.abs(a.x - MOD_BADGE_X) < 1 &&
        Math.abs(a.y - MOD_BADGE_Y) < 1,
    );

    expect(
      qfBadge,
      "QF polarity badge arc (r=9) at y≈114 must be drawn",
    ).toBeDefined();
    expect(
      modBadge,
      "modulator polarity badge arc (r=7) at arc midpoint (300,207) must be drawn",
    ).toBeDefined();
    expect(qfBadge!.x).toBeCloseTo(TERMINUS_X, 0);
    expect(qfBadge!.y).toBeCloseTo(TERMINUS_Y, 0);
  });
});

// ─── Modulator arc rendering ─────────────────────────────────────────────────

describe("drawModulators — dotted arc from source node to edge midpoint", () => {
  it("draws a line and terminus circle for each modulator", () => {
    const lineTos: { x: number; y: number }[] = [];
    const moveTos: { x: number; y: number }[] = [];
    const setLineDashes: unknown[][] = [];
    const arcs: { x: number; y: number; r: number }[] = [];

    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn().mockImplementation((x: number, y: number, r: number) => {
        arcs.push({ x, y, r });
      }),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn().mockImplementation((x: number, y: number) => {
        moveTos.push({ x, y });
      }),
      lineTo: vi.fn().mockImplementation((x: number, y: number) => {
        lineTos.push({ x, y });
      }),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn().mockImplementation((d: unknown) => {
        setLineDashes.push(d as unknown[]);
      }),
      fillStyle: "" as string | CanvasGradient | CanvasPattern,
      strokeStyle: "" as string | CanvasGradient | CanvasPattern,
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

    const srcNode: Node = {
      id: makeNodeId("src"),
      label: "Src",
      x: 100,
      y: 100,
      radius: 30,
      sizeTier: "m",
      colourTier: "blue",
      min: 0,
      max: 10,
      initial: 5,
    };
    const tgtNode: Node = {
      id: makeNodeId("tgt"),
      label: "Tgt",
      x: 300,
      y: 100,
      radius: 30,
      sizeTier: "m",
      colourTier: "blue",
      min: 0,
      max: 10,
      initial: 5,
    };
    const edge: CausalEdge = {
      id: makeEdgeId("e1"),
      kind: "causal",
      from: srcNode.id,
      to: tgtNode.id,
      polarity: 1,
      weight: 2,
      delay: "none",
      transferFn: "linear",
    };

    const getState = () => ({
      tickSim: vi.fn(),
      simRunning: false,
      simSpeed: 1,
      graph: {
        nodes: [srcNode, tgtNode],
        edges: [edge],
        annotations: [],
        modulators: [
          {
            id: makeModulatorId("m1"),
            from: srcNode.id,
            target: edge.id,
            polarity: 1 as const,
          },
        ],
      },
      sim: {
        signals: [],
        pending: [],
        nodeValues: new Map([
          [srcNode.id, 5],
          [tgtNode.id, 5],
        ]),
        displayPrevNodeValues: new Map(),
        tick: 0,
      },
      focusedNodeId: null,
      mode: "select" as const,
    });

    vi.useFakeTimers();
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    vi.useRealTimers();

    // Should have called setLineDash with a non-empty array (dotted line)
    const hasDash = setLineDashes.some(
      (d) => Array.isArray(d) && (d as number[]).length > 0,
    );
    expect(hasDash).toBe(true);
    // Should have drawn a line (moveTo + lineTo for the arc)
    expect(lineTos.length).toBeGreaterThan(0);
    // Should have drawn a small circle (badge or terminus)
    expect(arcs.length).toBeGreaterThan(0);
  });

  it("draws a polarity badge (+/-) at the arc midpoint", () => {
    // srcNode(100,100), terminus(200,86) → arc midpoint (150, 93)
    const fillTexts: { text: string; x: number; y: number }[] = [];

    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fillText: vi
        .fn()
        .mockImplementation((text: string, x: number, y: number) => {
          fillTexts.push({ text, x, y });
        }),
      setLineDash: vi.fn(),
      fillStyle: "" as string | CanvasGradient | CanvasPattern,
      strokeStyle: "" as string | CanvasGradient | CanvasPattern,
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

    const srcNode: Node = {
      id: makeNodeId("src"),
      label: "Src",
      x: 100,
      y: 100,
      radius: 30,
      sizeTier: "m",
      colourTier: "blue",
      min: 0,
      max: 10,
      initial: 5,
    };
    const tgtNode: Node = {
      id: makeNodeId("tgt"),
      label: "Tgt",
      x: 300,
      y: 100,
      radius: 30,
      sizeTier: "m",
      colourTier: "blue",
      min: 0,
      max: 10,
      initial: 5,
    };
    const edge: CausalEdge = {
      id: makeEdgeId("e1"),
      kind: "causal",
      from: srcNode.id,
      to: tgtNode.id,
      polarity: 1,
      weight: 2,
      delay: "none",
      transferFn: "linear",
    };

    const getState = () => ({
      tickSim: vi.fn(),
      simRunning: false,
      simSpeed: 1,
      graph: {
        nodes: [srcNode, tgtNode],
        edges: [edge],
        annotations: [],
        modulators: [
          {
            id: makeModulatorId("m1"),
            from: srcNode.id,
            target: edge.id,
            polarity: 1 as const,
          },
        ],
      },
      sim: {
        signals: [],
        pending: [],
        nodeValues: new Map([
          [srcNode.id, 5],
          [tgtNode.id, 5],
        ]),
        displayPrevNodeValues: new Map(),
        tick: 0,
      },
      focusedNodeId: null,
      mode: "select" as const,
    });

    vi.useFakeTimers();
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    vi.useRealTimers();

    // arc midpoint: ((100+200)/2, (100+86)/2) = (150, 93)
    // (causal edge badge is at (200, 86) — filter by position)
    const modPolarityCall = fillTexts.find(
      (c) =>
        (c.text === "+" || c.text === "−") &&
        Math.abs(c.x - 150) < 2 &&
        Math.abs(c.y - 93) < 2,
    );
    expect(modPolarityCall).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// signalChevronVisuals — pure visual logic for signal direction animation
// ---------------------------------------------------------------------------

describe("signalChevronVisuals", () => {
  // +ve edge: sign stays constant throughout — no animation
  it("+ve edge, sign=1: angle=-π/2 (up) and blue at all progress values", () => {
    for (const t of [0, 0.44, 0.5, 0.56, 1]) {
      const v = signalChevronVisuals(t, 1, 1);
      expect(v.angle).toBeCloseTo(-Math.PI / 2, 5);
      expect(v.color).toBe("rgb(125,211,252)");
    }
  });

  it("+ve edge, sign=-1: angle=+π/2 (down) and red at all progress values", () => {
    for (const t of [0, 0.44, 0.5, 0.56, 1]) {
      const v = signalChevronVisuals(t, -1, 1);
      expect(v.angle).toBeCloseTo(Math.PI / 2, 5);
      expect(v.color).toBe("rgb(252,165,165)");
    }
  });

  // -ve edge, sign=-1: parent was +1 (up/blue) → transitions to -1 (down/red)
  it("-ve edge, sign=-1: starts up/blue (t<0.45)", () => {
    const v = signalChevronVisuals(0.3, -1, -1);
    expect(v.angle).toBeCloseTo(-Math.PI / 2, 5); // up
    expect(v.color).toBe("rgb(125,211,252)"); // blue
  });

  it("-ve edge, sign=-1: ends down/red (t>0.55)", () => {
    const v = signalChevronVisuals(0.7, -1, -1);
    expect(v.angle).toBeCloseTo(Math.PI / 2, 5); // down
    expect(v.color).toBe("rgb(252,165,165)"); // red
  });

  it("-ve edge, sign=-1: angle is halfway at t=0.5 (midpoint of animation)", () => {
    const v = signalChevronVisuals(0.5, -1, -1);
    expect(v.angle).toBeCloseTo(0, 5); // midpoint between -π/2 and +π/2
  });

  // -ve edge, sign=+1: parent was -1 (down/red) → transitions to +1 (up/blue)
  it("-ve edge, sign=+1: starts down/red (t<0.45)", () => {
    const v = signalChevronVisuals(0.3, 1, -1);
    expect(v.angle).toBeCloseTo(Math.PI / 2, 5); // down
    expect(v.color).toBe("rgb(252,165,165)"); // red
  });

  it("-ve edge, sign=+1: ends up/blue (t>0.55)", () => {
    const v = signalChevronVisuals(0.7, 1, -1);
    expect(v.angle).toBeCloseTo(-Math.PI / 2, 5); // up
    expect(v.color).toBe("rgb(125,211,252)"); // blue
  });
});

// ─── Ghost-outline rendering — modulated edge ────────────────────────────────

describe("ghost-outline rendering — modulated edge", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("draws ghost at base-weight lineWidth and fill at effective-weight lineWidth when edge is partially throttled", () => {
    const strokeWidths: number[] = [];
    const ctx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn().mockImplementation(function (this: typeof ctx) {
        strokeWidths.push(ctx.lineWidth as number);
      }),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      scale: vi.fn(),
      fillStyle: "" as string,
      strokeStyle: "" as string,
      lineWidth: 1 as number,
      font: "" as string,
      textAlign: "" as string,
      textBaseline: "" as string,
    };
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      width: 0,
      height: 0,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;

    // base weight=2; nodeA at midpoint (value=5, min=0, max=10) → t=0.5 → effective=1.0
    const edge: CausalEdge = { ...edgeAB, weight: 2 };
    const getState = () =>
      ({
        tickSim: vi.fn(),
        simRunning: false,
        simSpeed: 1,
        graph: {
          nodes: [nodeA, nodeB],
          edges: [edge],
          annotations: [],
          modulators: [
            {
              id: makeModulatorId("m1"),
              from: nodeA.id,
              target: edge.id,
              polarity: 1 as const,
            },
          ],
        },
        sim: {
          signals: [],
          pending: [],
          nodeValues: new Map([[nodeA.id, 5]]),
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

    // Ghost pass: base weight=2 → lineWidth = 1 + 2 × 1.5 = 4
    // Fill pass:  effective weight=1.0 → lineWidth = 1 + 1.0 × 1.5 = 2.5
    expect(strokeWidths).toContain(4); // ghost curve at base weight
    expect(strokeWidths).toContain(2.5); // fill curve at effective weight
  });
});

describe("signalChevronVisuals easing — smoothstep not linear", () => {
  // At t=0.475, linear frac=0.25; smoothstep frac=0.15625 (3t²−2t³)
  // sign=-1 on -ve edge: startSign=+1 → angleForSign(+1)=−π/2 (up), end=+π/2 (down)
  // smoothstep → angle = −π/2 + π * 0.15625 ≈ −1.0799 rad (stays closer to start)
  // linear    → angle = −π/2 + π * 0.25    ≈ −0.7854 rad
  it("-ve edge sign=-1 at t=0.475: angle follows smoothstep not linear frac", () => {
    const v = signalChevronVisuals(0.475, -1, -1);
    const smoothstepFrac = 0.15625;
    const expected = -Math.PI / 2 + Math.PI * smoothstepFrac;
    expect(v.angle).toBeCloseTo(expected, 3);
  });
});

describe("ANIM_START / ANIM_END exported constants", () => {
  it("ANIM_START is 0.45", () => {
    expect(ANIM_START).toBe(0.45);
  });

  it("ANIM_END is 0.55", () => {
    expect(ANIM_END).toBe(0.55);
  });
});
