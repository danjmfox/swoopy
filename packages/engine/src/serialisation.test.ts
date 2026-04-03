import { describe, it, expect } from "vitest";
import { serialize, deserialize } from "./index.ts";
import { seedGraph } from "./population.test.ts";
import type { Annotation, AnnotationId } from "./types.ts";

// SE-01, SE-04
describe("serialize", () => {
  it("emits version 4", () => {
    const blob = serialize(seedGraph);
    expect(blob).toMatchObject({ version: 4 });
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

  it("throws for version 5 (future unknown version)", () => {
    expect(() => deserialize({ version: 5, graph: seedGraph })).toThrow(
      /version 5/,
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
