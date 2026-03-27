import type { Graph } from './types.ts'

export function serialize(_graph: Graph): unknown {
  throw new Error('not implemented')
}

export function deserialize(_blob: unknown): Graph {
  throw new Error('not implemented')
}
