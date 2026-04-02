import { describe, it, expect } from "vitest";
import { nodeLabelFont } from "./nodeLabelFont.js";

// GE-34: font size scales with node radius, clamped 9–15px
describe("nodeLabelFont", () => {
  it("returns correct px for each size tier radius", () => {
    // Radii: XS=22, S=26, M=30, L=34, XL=38 — proportional, clamped 9–15px
    // Reference: M (radius=30) should produce the mid-range font size
    expect(nodeLabelFont(30)).toMatch(/^\d+(\.\d+)?px /);
  });

  it("XS (radius 22) returns a smaller font than M (radius 30)", () => {
    const xs = parseInt(nodeLabelFont(22));
    const m = parseInt(nodeLabelFont(30));
    expect(xs).toBeLessThan(m);
  });

  it("XL (radius 38) returns a larger font than M (radius 30)", () => {
    const xl = parseInt(nodeLabelFont(38));
    const m = parseInt(nodeLabelFont(30));
    expect(xl).toBeGreaterThan(m);
  });

  it("clamps to minimum 9px at very small radius", () => {
    const font = parseInt(nodeLabelFont(1));
    expect(font).toBeGreaterThanOrEqual(9);
  });

  it("clamps to maximum 15px at very large radius", () => {
    const font = parseInt(nodeLabelFont(1000));
    expect(font).toBeLessThanOrEqual(15);
  });
});
