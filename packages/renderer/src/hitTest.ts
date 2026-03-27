import type { Graph, NodeId } from '@swoopy/engine'

export type HitTarget = { kind: 'node'; id: NodeId }

export function hitTest(_graph: Graph, _x: number, _y: number): HitTarget | null {
  throw new Error('not implemented')
}
