import { describe, it, expect } from 'vitest'
import { step, makeInitialSim, inject } from './sim.ts'
import { makeNodeId, makeEdgeId } from './ids.ts'
import { SIGNAL_SPEED, INJECT_STRENGTH } from './constants.ts'
import type { Graph } from './types.ts'

const nodeA = makeNodeId()
const nodeB = makeNodeId()
const edgeAB = makeEdgeId()

const graph: Graph = {
  nodes: [
    { id: nodeA, label: 'A', x: 0, y: 0, min: 0, max: 10, initial: 5 },
    { id: nodeB, label: 'B', x: 100, y: 0, min: 0, max: 10, initial: 5 },
  ],
  edges: [
    { id: edgeAB, kind: 'causal', from: nodeA, to: nodeB, polarity: 1, weight: 1, delay: 'none' },
  ],
}

describe('step() dt clamp — PRD §9 risk 5', () => {
  it('a spike dt of 500ms advances in-flight signal progress no more than SIGNAL_SPEED × 0.1', () => {
    // inject → normal step to get a signal in-flight at progress ≈ 0
    const sim0 = inject(makeInitialSim(graph), nodeA, INJECT_STRENGTH)
    const sim1 = step(graph, sim0, 0.016) // normal 60fps frame; signal emitted at progress=0
    expect(sim1.signals.length).toBeGreaterThan(0)

    const startProgress = sim1.signals[0].progress // should be 0 (newly emitted)

    // spike frame — without clamping, progress jumps by SIGNAL_SPEED * 0.5 = 0.325
    const sim2 = step(graph, sim1, 0.5)

    const maxAllowed = startProgress + SIGNAL_SPEED * 0.1
    for (const signal of sim2.signals) {
      expect(signal.progress).toBeLessThanOrEqual(maxAllowed)
    }
  })
})
