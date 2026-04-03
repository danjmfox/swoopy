/**
 * Integration: full share → restore round-trip (SE-02, SE-03, SE-06, SE-07)
 *
 * Exercises the real serialize/deserialize path end-to-end through the store,
 * rather than testing each action in isolation.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useStore } from "./store.ts";

describe("persistence round-trip (integration)", () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState({
      graph: { nodes: [], edges: [] },
      past: [],
      future: [],
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });
  });

  it("shareGraph → loadFromUrl restores the graph exactly", async () => {
    useStore.getState().addNode(100, 200);
    useStore.getState().addNode(300, 400);
    const { graph: original } = useStore.getState();
    useStore.getState().addEdge(original.nodes[0].id, original.nodes[1].id);
    const { graph: withEdge } = useStore.getState();

    await useStore.getState().shareGraph();

    const sharedUrl = (
      navigator.clipboard.writeText as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    const search = new URL(sharedUrl).search;

    useStore.setState({ graph: { nodes: [], edges: [] } });
    useStore.getState().loadFromUrl(search);

    const { graph: restored } = useStore.getState();
    expect(restored.nodes).toHaveLength(withEdge.nodes.length);
    expect(restored.edges).toHaveLength(withEdge.edges.length);
    expect(restored.nodes.map((n) => n.id)).toEqual(
      withEdge.nodes.map((n) => n.id),
    );
    expect(restored.nodes.map((n) => [n.x, n.y])).toEqual(
      withEdge.nodes.map((n) => [n.x, n.y]),
    );
    expect(restored.edges[0].from).toBe(withEdge.edges[0].from);
    expect(restored.edges[0].to).toBe(withEdge.edges[0].to);
  });
});
