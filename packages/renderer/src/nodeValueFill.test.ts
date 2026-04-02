import { describe, it, expect } from "vitest";
import { nodeValueFill } from "./nodeValueFill.ts";

describe("nodeValueFill", () => {
  it("returns the low colour at ratio 0", () => {
    // blue low = #254d90
    expect(nodeValueFill(0, "blue")).toBe("#254d90");
  });

  it("returns the high colour at ratio 1", () => {
    // blue high = #2563eb
    expect(nodeValueFill(1, "blue")).toBe("#2563eb");
  });

  it("returns a hex string at mid ratio", () => {
    const result = nodeValueFill(0.5, "green");
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("clamps ratio below 0 to low colour", () => {
    expect(nodeValueFill(-1, "red")).toBe(nodeValueFill(0, "red"));
  });

  it("clamps ratio above 1 to high colour", () => {
    expect(nodeValueFill(2, "red")).toBe(nodeValueFill(1, "red"));
  });

  it("uses the correct tier palette", () => {
    // grey low = #3d4555, grey high = #9ca3af
    expect(nodeValueFill(0, "grey")).toBe("#3d4555");
    expect(nodeValueFill(1, "grey")).toBe("#9ca3af");
  });
});
