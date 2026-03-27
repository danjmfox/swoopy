import type { Graph } from './types.ts'

export function serialize(graph: Graph): unknown {
  return { version: 1, graph }
}

export function deserialize(blob: unknown): Graph {
  const { graph } = blob as { version: number; graph: Graph }
  return graph
}
