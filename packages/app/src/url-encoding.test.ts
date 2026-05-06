import { describe, it, expect } from "vitest";
import { inflateSync } from "fflate";
import type { Graph } from "@swoopy/engine";
import { serialize, makeNodeId, makeEdgeId } from "@swoopy/engine";
import { encodeGraphForUrl, decodeGraphFromUrl } from "./url-encoding.ts";

function makeComplexGraph(): Graph {
  const nodes = Array.from({ length: 10 }, (_, i) => ({
    id: makeNodeId(`node-${i}`),
    label: `Node ${i}`,
    x: i * 80,
    y: i * 60,
    radius: 30,
    min: 0,
    max: 10,
    initial: 5,
    sizeTier: "m" as const,
    colourTier: "blue" as const,
  }));
  const edges = Array.from({ length: 8 }, (_, i) => ({
    kind: "causal" as const,
    id: makeEdgeId(`edge-${i}`),
    from: nodes[i % 10]!.id,
    to: nodes[(i + 1) % 10]!.id,
    polarity: (i % 2 === 0 ? 1 : -1) as 1 | -1,
    weight: 1.0,
    delay: "none" as const,
    transferFn: "linear" as const,
  }));
  return { nodes, edges, annotations: [], modulators: [] };
}

function legacyEncode(graph: Graph): string {
  const json = JSON.stringify(serialize(graph));
  const bytes = new TextEncoder().encode(json);
  return btoa(String.fromCharCode(...bytes));
}

describe("encodeGraphForUrl / decodeGraphFromUrl", () => {
  it("round-trips: decodeGraphFromUrl(encodeGraphForUrl(graph)) returns the same graph", () => {
    const graph = makeComplexGraph();
    const encoded = encodeGraphForUrl(graph);
    const decoded = decodeGraphFromUrl(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.nodes.map((n) => n.id)).toEqual(
      graph.nodes.map((n) => n.id),
    );
    expect(decoded!.edges.map((e) => e.id)).toEqual(
      graph.edges.map((e) => e.id),
    );
  });

  it("produces a string at least 30% shorter than plain base64 for a 10-node graph", () => {
    const graph = makeComplexGraph();
    const compressed = encodeGraphForUrl(graph);
    const plain = legacyEncode(graph);
    const reduction = 1 - compressed.length / plain.length;
    expect(reduction).toBeGreaterThanOrEqual(0.3);
  });

  it("decodes a legacy plain-base64 string produced by the old shareGraph()", () => {
    const graph = makeComplexGraph();
    const legacy = legacyEncode(graph);
    const decoded = decodeGraphFromUrl(legacy);
    expect(decoded).not.toBeNull();
    expect(decoded!.nodes.map((n) => n.id)).toEqual(
      graph.nodes.map((n) => n.id),
    );
  });

  it("returns null for a corrupt string", () => {
    expect(decodeGraphFromUrl("not-valid-base64!!!")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(decodeGraphFromUrl("")).toBeNull();
  });

  it("returns null for valid base64 that is not a valid graph", () => {
    const junk = btoa("this is not json");
    expect(decodeGraphFromUrl(junk)).toBeNull();
  });

  it("uses raw deflate — inflateSync with raw:true recovers valid serialized graph JSON", () => {
    const graph = makeComplexGraph();
    const encoded = encodeGraphForUrl(graph);
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));

    const inflated = inflateSync(bytes, { raw: true } as Parameters<
      typeof inflateSync
    >[1]);
    const parsed = JSON.parse(new TextDecoder().decode(inflated));
    expect(parsed).toHaveProperty("graph");
    expect(Array.isArray(parsed.graph.nodes)).toBe(true);
  });
});
