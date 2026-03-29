import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LoopyRenderer } from "./LoopyRenderer.ts";
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
  return { canvas, arcs: () => arcs };
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
          tick: 0,
        },
        focusedNodeId: null,
        mode: "select",
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    expect(arcs().some((a) => a.r === 4)).toBe(true);
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
    expect(arcs().filter((a) => a.r === 4).length).toBeGreaterThanOrEqual(2);
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
          tick: 0,
        },
        focusedNodeId: null,
        mode: "simulate",
      }) as unknown as RendererStore;
    const renderer = new LoopyRenderer(canvas, getState);
    renderer.start();
    vi.advanceTimersByTime(1000 / 60);
    renderer.stop();
    expect(arcs().some((a) => a.r === 4)).toBe(false);
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
