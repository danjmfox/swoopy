/**
 * Tests for bezier geometry utilities
 * DR--20260408--engine--signal-direction: bezierTangent needed for signal direction chevron
 */
import { describe, it, expect } from "vitest";
import { bezierTangent } from "./geometry.ts";

describe("bezierTangent", () => {
  it("returns a unit vector for a straight horizontal bezier", () => {
    // A→B along x-axis: start=(0,0) cp=(5,0) end=(10,0)
    // Tangent should point right: {dx: 1, dy: 0} at any t
    const { dx, dy } = bezierTangent(0, 0, 5, 0, 10, 0, 0.5);
    expect(dx).toBeCloseTo(1, 5);
    expect(dy).toBeCloseTo(0, 5);
  });

  it("returns a unit vector for a straight vertical bezier", () => {
    // start=(0,0) cp=(0,5) end=(0,10)
    const { dx, dy } = bezierTangent(0, 0, 0, 5, 0, 10, 0.5);
    expect(dx).toBeCloseTo(0, 5);
    expect(dy).toBeCloseTo(1, 5);
  });

  it("returned vector has unit length", () => {
    // Any quadratic bezier tangent should be normalized
    const { dx, dy } = bezierTangent(0, 0, 10, 20, 30, 5, 0.3);
    expect(Math.hypot(dx, dy)).toBeCloseTo(1, 5);
  });
});
