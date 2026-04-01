import { describe, it, expect } from 'vitest'
import { makeNodeId, makeEdgeId, makeInitialSim, inject, step, INJECT_STRENGTH, MAX_SIGNALS } from './index.ts'
import type { Graph, Node, CausalEdge } from './types.ts'

// Characterisation fixture: 6-node fully-connected reinforcing graph (PRD §7.7)
const N = 6
const nodeIds = Array.from({ length: N }, (_, i) => makeNodeId(`n${i}`))
const nodes: Node[] = nodeIds.map((id, i) => ({
  id, label: `n${i}`, x: 0, y: 0, radius: 40, min: 0, max: 10, initial: 5,
}))
const edges: CausalEdge[] = []
for (let i = 0; i < N; i++) {
  for (let j = 0; j < N; j++) {
    if (i === j) continue
    edges.push({
      kind: 'causal', id: makeEdgeId(`e${i}-${j}`),
      from: nodeIds[i], to: nodeIds[j],
      polarity: 1, weight: 1.0, delay: 'none', transferFn: 'linear',
    })
  }
}
const capGraph: Graph = { nodes, edges }

// SI-11: signal count is capped at MAX_SIGNALS
describe('SI-11 MAX_SIGNALS constant and cap', () => {
  it('MAX_SIGNALS is a positive integer', () => {
    expect(Number.isInteger(MAX_SIGNALS)).toBe(true)
    expect(MAX_SIGNALS).toBeGreaterThan(0)
  })

  it('travelling signal count never exceeds MAX_SIGNALS in a heavily loaded graph', () => {
    let sim = makeInitialSim(capGraph)
    for (const id of nodeIds) sim = inject(sim, capGraph, id, INJECT_STRENGTH * 5)
    for (let i = 0; i < 300; i++) {
      sim = step(capGraph, sim, 1 / 60)
      expect(sim.signals.length).toBeLessThanOrEqual(MAX_SIGNALS)
    }
  })
})
