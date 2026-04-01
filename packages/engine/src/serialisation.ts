import type { Graph } from "./types.ts";

const CURRENT_VERSION = 1;

export interface SerializedGraph {
  version: number;
  graph: Graph;
}

export function serialize(graph: Graph): SerializedGraph {
  return { version: CURRENT_VERSION, graph };
}

export function deserialize(blob: unknown): Graph {
  const { version, graph } = blob as SerializedGraph;
  if (version !== CURRENT_VERSION) {
    throw new Error(
      `Unsupported serialisation version ${version}. Expected ${CURRENT_VERSION}.`,
    );
  }
  return graph;
}
