import type { Graph, Node } from "./types.ts";

const CURRENT_VERSION = 3;

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
  return { nodes, edges: graph.edges as Graph["edges"] };
}

function migrateV2toV3(graph: { nodes: unknown[]; edges: unknown[] }): Graph {
  const nodes = graph.nodes.map((n) => {
    const node = n as Record<string, unknown>;
    return { ...node, colourTier: node["colourTier"] ?? "blue" } as Node;
  });
  return { nodes, edges: graph.edges as Graph["edges"] };
}

export function deserialize(blob: unknown): Graph {
  const { version, graph } = blob as SerializedGraph;
  if (version === 1) {
    return migrateV2toV3(
      migrateV1toV2(
        graph as unknown as { nodes: unknown[]; edges: unknown[] },
      ) as unknown as { nodes: unknown[]; edges: unknown[] },
    );
  }
  if (version === 2) {
    return migrateV2toV3(
      graph as unknown as { nodes: unknown[]; edges: unknown[] },
    );
  }
  if (version === CURRENT_VERSION) {
    return graph;
  }
  throw new Error(
    `Unsupported serialisation version ${version}. Expected ${CURRENT_VERSION}.`,
  );
}
