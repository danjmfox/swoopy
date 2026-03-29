import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { useStore } from "./store.ts";
import { seedGraph } from "./seed.ts";
import { EdgeWeightPopover } from "./EdgeWeightPopover.tsx";

describe("GE-13 EdgeWeightPopover range", () => {
  beforeEach(() => {
    const edge = seedGraph.edges.find((e) => e.kind === "causal")!;
    useStore.setState({ graph: seedGraph, editingEdgeId: edge.id });
  });

  it("range slider has max=5 and step=0.1", () => {
    const { container } = render(<EdgeWeightPopover />);
    const slider = container.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    expect(slider.max).toBe("5");
    expect(slider.step).toBe("0.1");
  });

  it("number input has max=5 and step=0.1", () => {
    const { container } = render(<EdgeWeightPopover />);
    const input = container.querySelector(
      'input[type="number"]',
    ) as HTMLInputElement;
    expect(input.max).toBe("5");
    expect(input.step).toBe("0.1");
  });
});
