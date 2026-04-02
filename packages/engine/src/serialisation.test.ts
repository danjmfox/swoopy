import { describe, it, expect } from "vitest";
import { serialize, deserialize } from "./index.ts";
import { seedGraph } from "./population.test.ts";

// SE-01, SE-04
describe("serialize", () => {
  it("emits version 2", () => {
    const blob = serialize(seedGraph);
    expect(blob).toMatchObject({ version: 2 });
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

  it("throws for version 3 (future unknown version)", () => {
    expect(() => deserialize({ version: 3, graph: seedGraph })).toThrow(
      /version 3/,
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
