import { describe, expect, it } from "vitest";
import { makeNodeId, makeEdgeId, makeModulatorId } from "./index.ts";
import type { Modulator, ModulatorId, Graph, Node, NodeRole } from "./types.ts";

describe("ModulatorId", () => {
  it("is a branded string", () => {
    const id: ModulatorId = makeModulatorId("01");
    expect(typeof id).toBe("string");
  });
});

describe("Modulator", () => {
  it("has the expected shape with polarity +1", () => {
    const m: Modulator = {
      id: makeModulatorId("01"),
      from: makeNodeId("n1"),
      target: makeEdgeId("e1"),
      polarity: 1,
    };
    expect(m.polarity).toBe(1);
    expect(m.from).toBeTruthy();
    expect(m.target).toBeTruthy();
  });

  it("has the expected shape with polarity -1", () => {
    const m: Modulator = {
      id: makeModulatorId("02"),
      from: makeNodeId("n2"),
      target: makeEdgeId("e2"),
      polarity: -1,
    };
    expect(m.polarity).toBe(-1);
  });
});

describe("Graph.modulators", () => {
  it("Graph accepts a modulators array", () => {
    const g: Graph = {
      nodes: [],
      edges: [],
      annotations: [],
      modulators: [],
    };
    expect(g.modulators).toHaveLength(0);
  });
});

const baseNode: Node = {
  id: makeNodeId("n1"),
  label: "Cash",
  x: 100,
  y: 100,
  radius: 30,
  sizeTier: "m",
  colourTier: "blue",
  min: 0,
  max: 10,
  initial: 5,
};

describe("NodeRole", () => {
  it("Node accepts role: 'lever'", () => {
    const n: Node = { ...baseNode, role: "lever" as NodeRole };
    expect(n.role).toBe("lever");
  });

  it("Node accepts role: 'outcome'", () => {
    const n: Node = { ...baseNode, role: "outcome" as NodeRole };
    expect(n.role).toBe("outcome");
  });

  it("Node with no role has role === undefined", () => {
    const n: Node = { ...baseNode };
    expect(n.role).toBeUndefined();
  });
});
