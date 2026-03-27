import type { Graph } from './types.ts'

export function serialize(graph: Graph): unknown {
  return { version: 1, graph }
}

export function deserialize(_blob: unknown): Graph {
  throw new Error('not implemented')
}
