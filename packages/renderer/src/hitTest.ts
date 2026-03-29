import type { Graph, NodeId, EdgeId, CausalEdge } from '@swoopy/engine'
import { bezierPoint, controlPoint, BOW, EDGE_HIT_RADIUS, T_DELAY, T_POLARITY, T_WEIGHT } from './geometry.ts'

export type HitTarget =
  | { kind: 'node'; id: NodeId }
  | { kind: 'edge-polarity'; edgeId: EdgeId }
  | { kind: 'edge-delay'; edgeId: EdgeId }
  | { kind: 'edge-weight'; edgeId: EdgeId }

// All coordinates in CSS pixels — DPR applied at draw time only (docs/decisions/DR--20260327--renderer--dpr-css-pixel-geometry.md)
export function hitTest(graph: Graph, x: number, y: number): HitTarget | null {
  // Nodes take priority — check first
  for (const node of graph.nodes) {
    const dist = Math.hypot(x - node.x, y - node.y)
    if (dist <= node.radius) return { kind: 'node', id: node.id }
  }

  // Edge regions (causal edges only — constraint edges have no interaction badges yet)
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]))
  const causalEdges = graph.edges.filter((e): e is CausalEdge => e.kind === 'causal')
  for (const edge of causalEdges) {
    const from = nodeById.get(edge.from)
    const to = nodeById.get(edge.to)
    if (!from || !to) continue

    const dx = to.x - from.x
    const dy = to.y - from.y
    const len = Math.hypot(dx, dy)
    const ux = dx / len
    const uy = dy / len
    const x1 = from.x + ux * from.radius
    const y1 = from.y + uy * from.radius
    const x2 = to.x - ux * to.radius
    const y2 = to.y - uy * to.radius
    const bow = BOW
    const { cx, cy } = controlPoint(x1, y1, x2, y2, bow)

    const regions: Array<[number, HitTarget]> = [
      [T_POLARITY, { kind: 'edge-polarity', edgeId: edge.id }],
      [T_DELAY,    { kind: 'edge-delay',    edgeId: edge.id }],
      [T_WEIGHT,   { kind: 'edge-weight',   edgeId: edge.id }],
    ]

    for (const [t, target] of regions) {
      const pt = bezierPoint(x1, y1, cx, cy, x2, y2, t)
      if (Math.hypot(x - pt.x, y - pt.y) <= EDGE_HIT_RADIUS) return target
    }
  }

  return null
}
