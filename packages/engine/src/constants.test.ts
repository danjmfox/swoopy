import { describe, expect, it } from "vitest";
import { NODE_SIZE_RADII, NODE_COLOURS } from "./constants.js";
import type { SizeTier, ColourTier } from "./constants.js";
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
      colourTier: "blue",
      min: 0,
      max: 10,
      initial: 5,
    };
    expect(node.sizeTier).toBe("m");
  });
});

describe("ColourTier", () => {
  it("includes all eight tiers", () => {
    const tiers: ColourTier[] = [
      "blue",
      "green",
      "red",
      "orange",
      "yellow",
      "teal",
      "purple",
      "grey",
    ];
    expect(tiers).toHaveLength(8);
  });
});

describe("NODE_COLOURS", () => {
  it("covers all eight tiers", () => {
    expect(Object.keys(NODE_COLOURS)).toHaveLength(8);
  });

  it("each tier has swatch, low, and high hex strings", () => {
    const hexRe = /^#[0-9a-f]{6}$/i;
    for (const tier of Object.keys(NODE_COLOURS) as ColourTier[]) {
      expect(NODE_COLOURS[tier].swatch).toMatch(hexRe);
      expect(NODE_COLOURS[tier].low).toMatch(hexRe);
      expect(NODE_COLOURS[tier].high).toMatch(hexRe);
    }
  });
});

describe("Node.colourTier", () => {
  it("Node accepts colourTier and preserves it", () => {
    const node: Node = {
      id: makeNodeId("test"),
      label: "Test",
      x: 0,
      y: 0,
      radius: 30,
      sizeTier: "m",
      colourTier: "green",
      min: 0,
      max: 10,
      initial: 5,
    };
    expect(node.colourTier).toBe("green");
  });
});
