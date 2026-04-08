import { describe, it, expect } from "vitest";
import { hitTest } from "./hitTest.ts";
import {
  makeNodeId,
  makeAnnotationId,
  makeEdgeId,
  makeModulatorId,
} from "@swoopy/engine";
import type { Graph } from "@swoopy/engine";

const id = makeNodeId("pop");
const graph: Graph = {
  nodes: [
    {
      id,
      label: "Population",
      x: 100,
      y: 100,
      radius: 50,
      sizeTier: "m" as const,
      colourTier: "blue" as const,
      min: 0,
      max: 10,
      initial: 5,
    },
  ],
  edges: [],
  annotations: [],
  modulators: [],
};

// PRD §5.3: hit testing testable without a canvas instance
describe("hitTest", () => {
  it("returns the node when point is inside its radius", () => {
    expect(hitTest(graph, 100, 100)).toEqual({ kind: "node", id });
  });

  it("returns the node when point is on the boundary", () => {
    expect(hitTest(graph, 150, 100)).toEqual({ kind: "node", id });
  });

  it("returns null when point is outside the radius", () => {
    expect(hitTest(graph, 151, 100)).toBeNull();
  });

  it("returns null for an empty graph", () => {
    expect(
      hitTest(
        { nodes: [], edges: [], annotations: [], modulators: [] },
        100,
        100,
      ),
    ).toBeNull();
  });
});

// GE-37: annotation hit testing
describe("hitTest — annotations", () => {
  const annId = makeAnnotationId("a1");
  // ANNOTATION_WIDTH = 180; annotation rect is (x, y, 180, height) — height grows with text
  // For an empty annotation, renderer uses a minimum height. We test the top-left region.
  const annotatedGraph: Graph = {
    nodes: [],
    edges: [],
    annotations: [{ id: annId, x: 200, y: 150, text: "" }],
    modulators: [],
  };

  it("returns annotation hit when point is inside the rect", () => {
    // x=200, y=150, width=180 → centre at (290, ~165); test point well inside
    expect(hitTest(annotatedGraph, 210, 160)).toEqual({
      kind: "annotation",
      id: annId,
    });
  });

  it("returns null when point is outside the annotation rect", () => {
    expect(hitTest(annotatedGraph, 100, 100)).toBeNull();
  });

  it("returns null when point is to the right of the annotation rect", () => {
    expect(hitTest(annotatedGraph, 385, 160)).toBeNull(); // 200 + 180 = 380 right edge
  });
});

// GE-43: constraint edges must be hittable in delete mode
describe("hitTest — constraint edges", () => {
  const nodeAId = makeNodeId("na");
  const nodeBId = makeNodeId("nb");
  const edgeId = makeEdgeId("ce1");
  // nodeA=(100,100,r=30) nodeB=(300,100,r=30): midpoint of straight line = (200,100)
  const constraintGraph: Graph = {
    nodes: [
      {
        id: nodeAId,
        label: "A",
        x: 100,
        y: 100,
        radius: 30,
        sizeTier: "m",
        colourTier: "blue",
        min: 0,
        max: 10,
        initial: 5,
      },
      {
        id: nodeBId,
        label: "B",
        x: 300,
        y: 100,
        radius: 30,
        sizeTier: "m",
        colourTier: "blue",
        min: 0,
        max: 10,
        initial: 5,
      },
    ],
    edges: [
      {
        kind: "constraint",
        id: edgeId,
        from: nodeAId,
        to: nodeBId,
        constraintKind: "floor",
      },
    ],
    annotations: [],
    modulators: [],
  };

  it("returns edge-constraint when clicking near the midpoint of a constraint edge", () => {
    expect(hitTest(constraintGraph, 200, 100)).toEqual({
      kind: "edge-constraint",
      edgeId,
    });
  });

  it("returns null when clicking far from the constraint edge midpoint", () => {
    expect(hitTest(constraintGraph, 200, 200)).toBeNull();
  });
});

// feat/modulator-polarity-toggle: modulator arc midpoint hit target
describe("hitTest — modulators", () => {
  // nodeA(100,100,r=30) → nodeB(300,100,r=30): single causal edge, bow=28
  // terminus (T_POLARITY on target edge): (200, 86)
  // nodeC(200,250,r=30): modulator source
  // modulator arc midpoint: ((200+200)/2, (250+86)/2) = (200, 168)
  const nodeAId = makeNodeId("ma");
  const nodeBId = makeNodeId("mb");
  const nodeCId = makeNodeId("mc");
  const edgeId = makeEdgeId("me1");
  const modId = makeModulatorId("mod1");
  const modulatorGraph: Graph = {
    nodes: [
      {
        id: nodeAId,
        label: "A",
        x: 100,
        y: 100,
        radius: 30,
        sizeTier: "m",
        colourTier: "blue",
        min: 0,
        max: 10,
        initial: 5,
      },
      {
        id: nodeBId,
        label: "B",
        x: 300,
        y: 100,
        radius: 30,
        sizeTier: "m",
        colourTier: "blue",
        min: 0,
        max: 10,
        initial: 5,
      },
      {
        id: nodeCId,
        label: "C",
        x: 200,
        y: 250,
        radius: 30,
        sizeTier: "m",
        colourTier: "blue",
        min: 0,
        max: 10,
        initial: 5,
      },
    ],
    edges: [
      {
        kind: "causal",
        id: edgeId,
        from: nodeAId,
        to: nodeBId,
        polarity: 1,
        delay: "none" as const,
        weight: 1,
        transferFn: "linear" as const,
        isQuickFix: false,
      },
    ],
    annotations: [],
    modulators: [{ id: modId, from: nodeCId, target: edgeId, polarity: 1 }],
  };

  it("returns modulator hit when clicking at the midpoint of the modulator arc", () => {
    // arc midpoint: (200, 168) — clear of terminus/edge-polarity badge at (200, 86)
    expect(hitTest(modulatorGraph, 200, 168)).toEqual({
      kind: "modulator",
      id: modId,
    });
  });
});
