import { describe, expect, it } from "vitest";
import { NODE_SIZE_RADII } from "./constants.js";
import type { SizeTier } from "./constants.js";
import { makeNodeId } from "./index.js";
import type { Node } from "./types.js";

describe("SizeTier", () => {
  it("includes all five tiers", () => {
    const tiers: SizeTier[] = ["xs", "s", "m", "l", "xl"];
    expect(tiers).toHaveLength(5);
  });
});

describe("NODE_SIZE_RADII", () => {
  it("maps each tier to its radius", () => {
    expect(NODE_SIZE_RADII.xs).toBe(22);
    expect(NODE_SIZE_RADII.s).toBe(26);
    expect(NODE_SIZE_RADII.m).toBe(30);
    expect(NODE_SIZE_RADII.l).toBe(34);
    expect(NODE_SIZE_RADII.xl).toBe(38);
  });

  it("covers all five tiers", () => {
    expect(Object.keys(NODE_SIZE_RADII)).toHaveLength(5);
  });
});

describe("Node.sizeTier", () => {
  it("Node accepts sizeTier and preserves it", () => {
    const node: Node = {
      id: makeNodeId("test"),
      label: "Test",
      x: 0,
      y: 0,
      radius: 30,
      sizeTier: "m",
      min: 0,
      max: 10,
      initial: 5,
    };
    expect(node.sizeTier).toBe("m");
  });
});
