import { describe, it, expect } from 'vitest'
import { makeNodeId, makeEdgeId, makeInitialSim, inject, step, INJECT_STRENGTH, DELAY_TICKS_SHORT } from './index.ts'
import type { Graph, Node, CausalEdge } from './types.ts'

const node = (id: string, initial = 0, min = 0, max = 10): Node => ({
  id: makeNodeId(id),
  label: id,
  x: 0,
  y: 0,
  radius: 40,
  min,
  max,
  initial,
})

const causal = (id: string, from: string, to: string, delay: CausalEdge['delay'] = 'none'): CausalEdge => ({
  kind: 'causal',
  id: makeEdgeId(id),
  from: makeNodeId(from),
  to: makeNodeId(to),
  polarity: 1,
  weight: 1.0,
  delay,
  transferFn: 'linear',
})

// SI-14: delayed edge holds signals in pending queue
describe('SI-14 delayed edge holds signals in pending queue', () => {
  it('puts signal in pending (not travelling) immediately after emission', () => {
    const graph: Graph = {
      nodes: [node('A'), node('B')],
      edges: [causal('A-B', 'A', 'B', 'short')],
    }
    const sim0 = makeInitialSim(graph)
    const sim1 = inject(sim0, makeNodeId('A'), INJECT_STRENGTH)
    const sim2 = step(graph, sim1, 1 / 60)
    // Signal should be pending — not yet travelling
    expect(sim2.pending.length).toBeGreaterThan(0)
    expect(sim2.signals.length).toBe(0)
  })
})
