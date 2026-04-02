import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "./store.ts";

beforeEach(() => {
  useStore.setState({ graph: { nodes: [], edges: [] }, past: [], future: [] });
});

// GE-34: addNode default size tier
describe("addNode", () => {
  it("creates a node with sizeTier: 'm' and radius: 30", () => {
    useStore.getState().addNode(100, 200);
    const node = useStore.getState().graph.nodes[0];
    expect(node.sizeTier).toBe("m");
    expect(node.radius).toBe(30);
  });
});

// GE-34: updateNode size tier derives radius
describe("updateNode", () => {
  it("updating sizeTier: 'xl' sets radius: 38", () => {
    useStore.getState().addNode(0, 0);
    const id = useStore.getState().graph.nodes[0].id;
    useStore.getState().updateNode(id, { sizeTier: "xl" });
    const node = useStore.getState().graph.nodes[0];
    expect(node.sizeTier).toBe("xl");
    expect(node.radius).toBe(38);
  });
});
