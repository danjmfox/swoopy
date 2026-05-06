import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { inflateSync } from "fflate";
import type { Graph } from "@swoopy/engine";
import {
  serialize,
  makeNodeId,
  makeEdgeId,
  makeAnnotationId,
  makeModulatorId,
} from "@swoopy/engine";
import { encodeGraphForUrl, decodeGraphFromUrl } from "./url-encoding.ts";

// --- Arbitrary Generators ---

const nodeArbitrary = fc
  .tuple(
    fc.integer({ min: 0, max: 99999 }),
    fc.string({ unit: "grapheme", minLength: 0, maxLength: 20 }),
    fc.float({ min: -10000, max: 10000, noNaN: true }),
    fc.float({ min: -10000, max: 10000, noNaN: true }),
    fc.float({ min: 1, max: 100, noNaN: true }),
    fc.constantFrom("xs", "s", "m", "l", "xl" as const),
    fc.constantFrom(
      "blue",
      "green",
      "red",
      "orange",
      "yellow",
      "teal",
      "purple",
      "grey" as const,
    ),
    fc.option(fc.string({ unit: "grapheme", minLength: 1, maxLength: 50 }), {
      nil: undefined,
    }),
    fc.option(fc.constantFrom("lever", "outcome" as const), { nil: undefined }),
    fc.integer({ min: -100, max: 100 }),
    fc.integer({ min: 1, max: 200 }),
  )
  .chain(
    ([id, label, x, y, radius, sizeTier, colourTier, annotation, role, minVal, range]) => {
      const min = minVal;
      const max = minVal + range;
      return fc
        .integer({ min: minVal, max: minVal + range })
        .map((initial) => ({
          id: makeNodeId(String(id)),
          label,
          x,
          y,
          radius,
          sizeTier,
          colourTier,
          annotation,
          role,
          min,
          max,
          initial,
        }));
    },
  );

const causalEdgeArbitrary = (fromId: string, toId: string) =>
  fc
    .tuple(
      fc.integer({ min: 0, max: 99999 }),
      fc.constantFrom(1, -1 as const),
      fc.float({ min: 0, max: 5, noNaN: true }),
      fc.constantFrom("none", "short", "medium", "long" as const),
      fc.option(fc.boolean(), { nil: undefined }),
    )
    .map(([id, polarity, weight, delay, isQuickFix]) => ({
      kind: "causal" as const,
      id: makeEdgeId(String(id)),
      from: makeNodeId(fromId),
      to: makeNodeId(toId),
      polarity,
      weight,
      delay,
      transferFn: "linear" as const,
      isQuickFix,
    }));

const constraintEdgeArbitrary = (fromId: string, toId: string) =>
  fc
    .tuple(
      fc.integer({ min: 0, max: 99999 }),
      fc.constantFrom("ceiling", "floor" as const),
    )
    .map(([id, constraintKind]) => ({
      kind: "constraint" as const,
      constraintKind,
      id: makeEdgeId(String(id)),
      from: makeNodeId(fromId),
      to: makeNodeId(toId),
    }));

const annotationArbitrary = fc
  .tuple(
    fc.integer({ min: 0, max: 99999 }),
    fc.string({ unit: "grapheme", minLength: 1, maxLength: 100 }),
    fc.float({ min: -10000, max: 10000, noNaN: true }),
    fc.float({ min: -10000, max: 10000, noNaN: true }),
  )
  .map(([id, text, x, y]) => ({
    id: makeAnnotationId(String(id)),
    text,
    x,
    y,
  }));

const modulatorArbitrary = (fromId: string, targetEdgeId: string) =>
  fc
    .tuple(
      fc.integer({ min: 0, max: 99999 }),
      fc.constantFrom(1, -1 as const),
    )
    .map(([id, polarity]) => ({
      id: makeModulatorId(String(id)),
      from: makeNodeId(fromId),
      target: makeEdgeId(targetEdgeId),
      polarity,
    }));

const graphArbitrary: fc.Arbitrary<Graph> = fc
  .array(nodeArbitrary, { minLength: 0, maxLength: 10 })
  .chain((nodes) => {
    if (nodes.length === 0) {
      return fc.constant({
        nodes: [],
        edges: [],
        annotations: [],
        modulators: [],
      } as Graph);
    }

    const nodeStringIds = nodes.map((n) => String(nodes.indexOf(n)));

    const edgeArb = fc
      .tuple(
        fc.constantFrom(...nodeStringIds),
        fc.constantFrom(...nodeStringIds),
        fc.boolean(),
      )
      .chain(([fromIdx, toIdx, isCausal]) => {
        if (isCausal) {
          return causalEdgeArbitrary(fromIdx, toIdx);
        }
        return constraintEdgeArbitrary(fromIdx, toIdx);
      });

    const modulatorEdgeArb =
      fc.tuple(
        fc.constantFrom(...nodeStringIds),
        fc.constantFrom(...nodeStringIds),
        fc.constantFrom(...nodeStringIds),
      ).chain(([fromIdx, fromIdx2, toIdx]) =>
        modulatorArbitrary(fromIdx, `${fromIdx2}-${toIdx}`),
      );

    return fc.tuple(
      fc.array(edgeArb, { minLength: 0, maxLength: Math.min(nodes.length * 2, 10) }),
      fc.array(annotationArbitrary, { minLength: 0, maxLength: 5 }),
      fc.array(modulatorEdgeArb, { minLength: 0, maxLength: 3 }),
    ).map(([edges, annotations, modulators]) => ({
      nodes: nodes.map((n, i) => ({ ...n, id: makeNodeId(String(i)) })),
      edges,
      annotations,
      modulators,
    } as Graph));
  });

// --- Tests ---

describe("graphArbitrary generates valid Graph samples", () => {
  it("generates at least one sample without throwing", () => {
    const samples = fc.sample(graphArbitrary, 1);
    expect(Array.isArray(samples[0]!.nodes)).toBe(true);
    expect(Array.isArray(samples[0]!.edges)).toBe(true);
    expect(Array.isArray(samples[0]!.annotations)).toBe(true);
    expect(Array.isArray(samples[0]!.modulators)).toBe(true);
  });
});

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
