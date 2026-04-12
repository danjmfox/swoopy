import { describe, it, expect } from "vitest";
import { serialize, deserialize, makeEdgeId, makeNodeId } from "./index.ts";
import { seedGraph } from "./population.test.ts";
import type { Annotation, AnnotationId, CausalEdge, Node } from "./types.ts";

// SE-01, SE-04
describe("serialize", () => {
  it("emits version 5", () => {
    const blob = serialize(seedGraph);
    expect(blob).toMatchObject({ version: 5 });
  });
});

// SE-03, SE-05
describe("deserialize", () => {
  it("round-trips: deserialize(serialize(graph)) restores the graph exactly", () => {
    const restored = deserialize(serialize(seedGraph));
    expect(restored.nodes).toEqual(seedGraph.nodes);
    expect(restored.edges).toEqual(seedGraph.edges);
  });

  it("throws a descriptive error for an unknown version (SE-05)", () => {
    expect(() => deserialize({ version: 99, graph: seedGraph })).toThrow(
      /version 99/,
    );
  });

  it("throws a descriptive error for version 0", () => {
    expect(() => deserialize({ version: 0, graph: seedGraph })).toThrow(
      /Unsupported/,
    );
  });

  it("emits version 5", () => {
    const blob = serialize(seedGraph);
    expect(blob).toMatchObject({ version: 5 });
  });

  it("throws for version 6 (future unknown version)", () => {
    expect(() => deserialize({ version: 6, graph: seedGraph })).toThrow(
      /version 6/,
    );
  });
});

// GE-34: v1→v2 migration
describe("deserialize v1 migration", () => {
  it("adds sizeTier: 'm' to every node in a v1 blob", () => {
    const v1Blob = {
      version: 1,
      graph: {
        nodes: [
          {
            id: "n1",
            label: "A",
            x: 0,
            y: 0,
            radius: 50,
            min: 0,
            max: 10,
            initial: 5,
          },
        ],
        edges: [],
      },
    };
    const graph = deserialize(v1Blob);
    expect(graph.nodes[0]).toMatchObject({ sizeTier: "m" });
  });
});

// GE-35: v2→v3 migration
describe("deserialize v2 migration", () => {
  it("adds colourTier: 'blue' to every node in a v2 blob", () => {
    const v2Blob = {
      version: 2,
      graph: {
        nodes: [
          {
            id: "n1",
            label: "A",
            x: 0,
            y: 0,
            radius: 30,
            sizeTier: "m",
            min: 0,
            max: 10,
            initial: 5,
          },
        ],
        edges: [],
      },
    };
    const graph = deserialize(v2Blob);
    expect(graph.nodes[0]).toMatchObject({ colourTier: "blue" });
  });
});

// GE-41: QF flag round-trip
describe("QF flag serialisation", () => {
  it("round-trips isQuickFix: true on a causal edge", () => {
    const qfEdgeId = makeEdgeId("qf-edge");
    const nA = makeNodeId("a");
    const nB = makeNodeId("b");
    const qfGraph = {
      ...seedGraph,
      edges: [
        {
          kind: "causal" as const,
          id: qfEdgeId,
          from: nA,
          to: nB,
          polarity: 1 as const,
          weight: 2,
          delay: "none" as const,
          transferFn: "linear" as const,
          isQuickFix: true,
        },
      ],
    };
    const restored = deserialize(serialize(qfGraph));
    const edge = restored.edges.find(
      (e): e is CausalEdge => e.kind === "causal",
    )!;
    expect(edge.isQuickFix).toBe(true);
  });

  it("round-trips an edge without isQuickFix (defaults to undefined)", () => {
    const restored = deserialize(serialize(seedGraph));
    const edge = restored.edges.find(
      (e): e is CausalEdge => e.kind === "causal",
    )!;
    expect(edge.isQuickFix).toBeUndefined();
  });
});

// GE-37: Annotation type and Graph.annotations
describe("Annotation type", () => {
  it("Annotation has id, x, y, text fields", () => {
    const ann: Annotation = {
      id: "a1" as AnnotationId,
      x: 10,
      y: 20,
      text: "hello",
    };
    expect(ann.id).toBe("a1");
    expect(ann.x).toBe(10);
    expect(ann.y).toBe(20);
    expect(ann.text).toBe("hello");
  });

  it("deserialise v3 blob → annotations defaults to []", () => {
    const graph = deserialize(serialize(seedGraph));
    expect(graph.annotations).toEqual([]);
  });

  it("round-trip v4 preserves annotations", () => {
    const graphWithAnnotation = {
      ...seedGraph,
      annotations: [{ id: "a1" as AnnotationId, x: 10, y: 20, text: "hi" }],
    };
    const restored = deserialize(serialize(graphWithAnnotation));
    expect(restored.annotations).toEqual(graphWithAnnotation.annotations);
  });
});

// V4→V5 migration
describe("deserialize v4 migration", () => {
  it("adds modulators: [] to a v4 blob that has none", () => {
    const v4Blob = {
      version: 4,
      graph: {
        nodes: seedGraph.nodes,
        edges: seedGraph.edges,
        annotations: [],
      },
    };
    const restored = deserialize(v4Blob);
    expect(restored.modulators).toEqual([]);
  });
});

// DR--20260412--app--node-role-indicators
describe("role field serialisation", () => {
  it("round-trips role: 'lever' on a node", () => {
    const leverNode: Node = { ...seedGraph.nodes[0]!, role: "lever" };
    const graph = { ...seedGraph, nodes: [leverNode, ...seedGraph.nodes.slice(1)] };
    const restored = deserialize(serialize(graph));
    expect(restored.nodes[0]!.role).toBe("lever");
  });

  it("round-trips role: 'outcome' on a node", () => {
    const outcomeNode: Node = { ...seedGraph.nodes[0]!, role: "outcome" };
    const graph = { ...seedGraph, nodes: [outcomeNode, ...seedGraph.nodes.slice(1)] };
    const restored = deserialize(serialize(graph));
    expect(restored.nodes[0]!.role).toBe("outcome");
  });

  it("round-trips a node without role (role is undefined)", () => {
    const restored = deserialize(serialize(seedGraph));
    expect(restored.nodes[0]!.role).toBeUndefined();
  });
});
