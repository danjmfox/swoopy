import { describe, it, expect } from "vitest";
import { drawScene } from "./drawScene.ts";
import {
  makeNodeId,
  makeEdgeId,
  makeInitialSim,
  NODE_SIZE_RADII,
} from "@swoopy/engine";
import type { Graph } from "@swoopy/engine";

function makeStubCtx(): CanvasRenderingContext2D {
  const noop = () => {};
  return {
    clearRect: noop,
    beginPath: noop,
    arc: noop,
    moveTo: noop,
    lineTo: noop,
    quadraticCurveTo: noop,
    closePath: noop,
    fill: noop,
    stroke: noop,
    fillText: noop,
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    setLineDash: noop,
    roundRect: noop,
    measureText: () => ({ width: 0 }) as TextMetrics,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    textAlign: "left" as CanvasTextAlign,
    textBaseline: "alphabetic" as CanvasTextBaseline,
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}

const minimalGraph: Graph = {
  nodes: [
    {
      id: makeNodeId("n1"),
      label: "A",
      x: 200,
      y: 200,
      radius: NODE_SIZE_RADII["m"],
      sizeTier: "m",
      colourTier: "blue",
      min: 0,
      max: 10,
      initial: 5,
    },
  ],
  edges: [],
  annotations: [],
  modulators: [],
};

describe("drawScene", () => {
  it("renders a minimal graph without throwing", () => {
    const ctx = makeStubCtx();
    const sim = makeInitialSim(minimalGraph);
    expect(() => drawScene(ctx, 400, 300, minimalGraph, sim)).not.toThrow();
  });

  it("renders a graph with a causal edge without throwing", () => {
    const graph: Graph = {
      nodes: [
        {
          id: makeNodeId("n1"),
          label: "A",
          x: 150,
          y: 200,
          radius: NODE_SIZE_RADII["m"],
          sizeTier: "m",
          colourTier: "blue",
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: makeNodeId("n2"),
          label: "B",
          x: 350,
          y: 200,
          radius: NODE_SIZE_RADII["m"],
          sizeTier: "m",
          colourTier: "green",
          min: 0,
          max: 10,
          initial: 5,
        },
      ],
      edges: [
        {
          kind: "causal",
          id: makeEdgeId("e1"),
          from: makeNodeId("n1"),
          to: makeNodeId("n2"),
          polarity: 1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
      ],
      annotations: [],
      modulators: [],
    };
    const ctx = makeStubCtx();
    const sim = makeInitialSim(graph);
    expect(() => drawScene(ctx, 400, 300, graph, sim)).not.toThrow();
  });
});
