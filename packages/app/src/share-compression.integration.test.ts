/**
 * Integration: compressed share URL (SE-02, SE-03, share-url-compression)
 *
 * Exercises shareGraph() and loadFromUrl() as driving ports — verifies compression
 * is wired end-to-end and legacy URLs still load correctly.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { serialize } from "@swoopy/engine";
import { useStore } from "./store.ts";

function legacyEncodeCurrentGraph(): string {
  const graph = useStore.getState().graph;
  const json = JSON.stringify(serialize(graph));
  const bytes = new TextEncoder().encode(json);
  return btoa(String.fromCharCode(...bytes));
}

beforeEach(() => {
  localStorage.clear();
  useStore.setState({
    graph: { nodes: [], edges: [], annotations: [], modulators: [] },
    past: [],
    future: [],
    modelTitle: "",
  });
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
  });
});

function captureSharedUrl(): string {
  return (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock
    .calls[0]![0] as string;
}

describe("shareGraph — compressed URL (share-url-compression)", () => {
  it("produces a URL with a ?g= parameter", async () => {
    useStore.getState().addNode(100, 200);
    await useStore.getState().shareGraph();
    const url = captureSharedUrl();
    expect(new URL(url).searchParams.has("g")).toBe(true);
  });

  it("compressed URL is shorter than plain base64 for a 10-node model", async () => {
    for (let i = 0; i < 10; i++) {
      useStore.getState().addNode(i * 80, i * 60);
    }
    const legacyEncoded = legacyEncodeCurrentGraph();

    await useStore.getState().shareGraph();
    const url = captureSharedUrl();
    const compressedEncoded = new URL(url).searchParams.get("g")!;

    const reduction = 1 - compressedEncoded.length / legacyEncoded.length;
    expect(reduction).toBeGreaterThanOrEqual(0.3);
  });

  it("includes title param when model has a title", async () => {
    useStore.setState({ modelTitle: "Demo Model" });
    useStore.getState().addNode(100, 200);
    await useStore.getState().shareGraph();
    const url = new URL(captureSharedUrl());
    expect(url.searchParams.get("title")).toBe("Demo Model");
  });

  it("omits title param when model has no title", async () => {
    useStore.setState({ modelTitle: "" });
    useStore.getState().addNode(100, 200);
    await useStore.getState().shareGraph();
    const url = new URL(captureSharedUrl());
    expect(url.searchParams.has("title")).toBe(false);
  });
});

describe("loadFromUrl — compressed + legacy (share-url-compression)", () => {
  it("loads a URL produced by the new compressed shareGraph", async () => {
    useStore.getState().addNode(100, 200);
    useStore.getState().addNode(300, 400);
    const nodeIds = useStore.getState().graph.nodes.map((n) => n.id);

    await useStore.getState().shareGraph();
    const search = new URL(captureSharedUrl()).search;

    useStore.setState({
      graph: { nodes: [], edges: [], annotations: [], modulators: [] },
    });
    useStore.getState().loadFromUrl(search);

    expect(useStore.getState().graph.nodes.map((n) => n.id)).toEqual(nodeIds);
  });

  it("loads a legacy plain-base64 ?g= URL correctly (backward compat)", () => {
    useStore.getState().addNode(100, 200);
    const nodeId = useStore.getState().graph.nodes[0]!.id;
    const legacy = legacyEncodeCurrentGraph();

    useStore.setState({
      graph: { nodes: [], edges: [], annotations: [], modulators: [] },
    });
    useStore.getState().loadFromUrl(`?g=${encodeURIComponent(legacy)}`);

    expect(useStore.getState().graph.nodes[0]?.id).toBe(nodeId);
  });

  it("leaves current graph intact when ?g= is corrupt", () => {
    useStore.getState().addNode(100, 200);
    useStore.getState().addNode(300, 400);
    expect(useStore.getState().graph.nodes).toHaveLength(2);

    useStore.getState().loadFromUrl("?g=!!!notvalidbase64!!!");

    expect(useStore.getState().graph.nodes).toHaveLength(2);
  });
});
