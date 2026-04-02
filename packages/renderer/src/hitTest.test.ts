import { describe, it, expect } from "vitest";
import { hitTest } from "./hitTest.ts";
import { makeNodeId } from "@swoopy/engine";
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
      min: 0,
      max: 10,
      initial: 5,
    },
  ],
  edges: [],
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
    expect(hitTest({ nodes: [], edges: [] }, 100, 100)).toBeNull();
  });
});
