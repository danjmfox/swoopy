import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useStore } from "./store.ts";
import { NodePopover } from "./NodePopover.tsx";
import type { NodeId } from "@swoopy/engine";

function setup() {
  useStore.setState({ graph: { nodes: [], edges: [] }, past: [], future: [] });
  useStore.getState().addNode(100, 200);
  const nodeId = useStore.getState().graph.nodes[0].id as NodeId;
  useStore.setState({ editingNodeId: nodeId });
  return nodeId;
}

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
