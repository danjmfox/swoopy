import { describe, expect, it } from "vitest";
import { makeNodeId, makeEdgeId, makeModulatorId } from "./index.ts";
import type { Modulator, ModulatorId, Graph } from "./types.ts";

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
