import type { NodeId, PendingSignal, Edge } from '@swoopy/engine'

export interface StockIndicator {
  readonly fill: number   // 0–1 position within [min, max]
  readonly trend: 'up' | 'down' | 'stable'
}

export function stockIndicator(value: number, min: number, max: number, prevValue: number): StockIndicator {
  const fill = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0
  const trend = value > prevValue ? 'up' : value < prevValue ? 'down' : 'stable'
  return { fill, trend }
}

export function timebombStrength(
  pending: ReadonlyArray<PendingSignal>,
  nodeId: NodeId,
  edges: ReadonlyArray<Edge>,
): number {
  const fromEdgeIds = new Set(
    edges.filter((e) => e.from === nodeId).map((e) => e.id),
  )
  return pending
    .filter((p) => fromEdgeIds.has(p.signal.edgeId))
    .reduce((sum, p) => sum + Math.abs(p.signal.strength), 0)
}
