import type { Graph } from './types.ts'

const CURRENT_VERSION = 1

export function serialize(graph: Graph): unknown {
  return { version: CURRENT_VERSION, graph }
}

export function deserialize(blob: unknown): Graph {
  const { version, graph } = blob as { version: number; graph: Graph }
  if (version !== CURRENT_VERSION) {
    throw new Error(`Unsupported serialisation version ${version}. Expected ${CURRENT_VERSION}.`)
  }
  return graph
}
