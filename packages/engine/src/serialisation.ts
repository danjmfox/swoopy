import type { Graph, Node } from "./types.ts";

const CURRENT_VERSION = 4;

export interface SerializedGraph {
  version: number;
  graph: Graph;
}

export function serialize(graph: Graph): SerializedGraph {
  return { version: CURRENT_VERSION, graph };
}

function migrateV1toV2(graph: { nodes: unknown[]; edges: unknown[] }): Graph {
  const nodes = graph.nodes.map((n) => {
    const node = n as Record<string, unknown>;
    return { ...node, sizeTier: node["sizeTier"] ?? "m" } as Node;
  });
  return { nodes, edges: graph.edges as Graph["edges"], annotations: [] };
}

function migrateV2toV3(graph: { nodes: unknown[]; edges: unknown[] }): Graph {
  const nodes = graph.nodes.map((n) => {
    const node = n as Record<string, unknown>;
    return { ...node, colourTier: node["colourTier"] ?? "blue" } as Node;
  });
  return { nodes, edges: graph.edges as Graph["edges"], annotations: [] };
}

function migrateV3toV4(graph: {
  nodes: unknown[];
  edges: unknown[];
  annotations?: unknown[];
}): Graph {
  return {
    nodes: graph.nodes as Graph["nodes"],
    edges: graph.edges as Graph["edges"],
    annotations: (graph.annotations ?? []) as Graph["annotations"],
  };
}

export function deserialize(blob: unknown): Graph {
  const { version, graph } = blob as SerializedGraph;
  if (version < 1 || version > CURRENT_VERSION) {
    throw new Error(
      `Unsupported serialisation version ${version}. Expected ${CURRENT_VERSION}.`,
    );
  }
  // Cast once at the boundary; each migration function handles its own field access.
  let g = graph as unknown as { nodes: unknown[]; edges: unknown[]; annotations?: unknown[] };
  if (version < 2) g = migrateV1toV2(g) as typeof g;
  if (version < 3) g = migrateV2toV3(g) as typeof g;
  if (version < 4) return migrateV3toV4(g);
  return graph;
}
