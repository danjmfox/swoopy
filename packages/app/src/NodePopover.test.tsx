import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useStore } from "./store.ts";
import { NodePopover } from "./NodePopover.tsx";
import type { NodeId } from "@swoopy/engine";

function setup() {
  useStore.setState({
    graph: { nodes: [], edges: [], annotations: [], modulators: [] },
    past: [],
    future: [],
  });
  useStore.getState().addNode(100, 200);
  const nodeId = useStore.getState().graph.nodes[0]!.id as NodeId;
  useStore.setState({ editingNodeId: nodeId });
  return nodeId;
}

// GE-35: colour picker in NodePopover
describe("NodePopover colour picker", () => {
  beforeEach(setup);

  it("renders 8 colour swatch buttons", () => {
    render(<NodePopover />);
    const swatches = screen.getAllByRole("button", {
      name: /^(blue|green|red|orange|yellow|teal|purple|grey)$/i,
    });
    expect(swatches).toHaveLength(8);
  });

  it("clicking red calls updateNode with colourTier: 'red'", () => {
    const spy = vi.spyOn(useStore.getState(), "updateNode");
    render(<NodePopover />);
    fireEvent.click(screen.getByRole("button", { name: /^red$/i }));
    expect(spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ colourTier: "red" }),
    );
  });
});

// GE-36: annotation input in NodePopover
describe("NodePopover annotation input", () => {
  beforeEach(setup);

  it("renders an annotation text input", () => {
    render(<NodePopover />);
    expect(screen.getByPlaceholderText("Annotation")).toBeDefined();
  });

  it("committing with annotation calls updateNode with annotation value", () => {
    const spy = vi.spyOn(useStore.getState(), "updateNode");
    render(<NodePopover />);
    const input = screen.getByPlaceholderText("Annotation");
    fireEvent.change(input, { target: { value: "GDP per capita" } });
    fireEvent.click(screen.getByRole("button", { name: /ok/i }));
    expect(spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ annotation: "GDP per capita" }),
    );
  });
});

// GE-34: size picker in NodePopover
describe("NodePopover size picker", () => {
  beforeEach(setup);

  it("renders 5 size swatch buttons", () => {
    render(<NodePopover />);
    const swatches = screen.getAllByRole("button", {
      name: /^(XS|S|M|L|XL)$/i,
    });
    expect(swatches).toHaveLength(5);
  });

  it("clicking XL calls updateNode with sizeTier: 'xl'", () => {
    const spy = vi.spyOn(useStore.getState(), "updateNode");
    render(<NodePopover />);
    fireEvent.click(screen.getByRole("button", { name: /^XL$/i }));
    expect(spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ sizeTier: "xl" }),
    );
  });
});
