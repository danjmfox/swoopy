import type { Graph, NodeId } from '@swoopy/engine'

export type HitTarget = { kind: 'node'; id: NodeId }

// All coordinates in CSS pixels — DPR applied at draw time only (DR--20260327--renderer--dpr-css-pixel-geometry)
export function hitTest(graph: Graph, x: number, y: number): HitTarget | null {
  for (const node of graph.nodes) {
    const dist = Math.hypot(x - node.x, y - node.y)
    if (dist <= node.radius) return { kind: 'node', id: node.id }
  }
  return null
}
