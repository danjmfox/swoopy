import { describe, it, expect } from "vitest";
import { serialize, deserialize } from "./index.ts";
import { seedGraph } from "./population.test.ts";

// SE-01, SE-04
describe("serialize", () => {
  it("returns a value with a version field", () => {
    const blob = serialize(seedGraph);
    expect(blob).toMatchObject({ version: 1 });
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

  it("S4 — v1 has no migration path: version 0 is unknown and throws", () => {
    // Serialisation format is versioned from day one (SE-04). There is no migration path in v1.
    // Any data serialised under a different version number is rejected. This test guards
    // that contract: if a migration path is added, this test should be updated to assert it.
    expect(() => deserialize({ version: 0, graph: seedGraph })).toThrow(
      /Unsupported/,
    );
  });
});
