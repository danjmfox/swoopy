import { describe, it, expect } from "vitest";
import { hitTest } from "./hitTest.ts";
import { makeNodeId, makeAnnotationId } from "@swoopy/engine";
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
    expect(hitTest({ nodes: [], edges: [], annotations: [] }, 100, 100)).toBeNull();
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
  };

  it("returns annotation hit when point is inside the rect", () => {
    // x=200, y=150, width=180 → centre at (290, ~165); test point well inside
    expect(hitTest(annotatedGraph, 210, 160)).toEqual({ kind: "annotation", id: annId });
  });

  it("returns null when point is outside the annotation rect", () => {
    expect(hitTest(annotatedGraph, 100, 100)).toBeNull();
  });

  it("returns null when point is to the right of the annotation rect", () => {
    expect(hitTest(annotatedGraph, 385, 160)).toBeNull(); // 200 + 180 = 380 right edge
  });
});
