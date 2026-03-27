import { describe, it, expect } from 'vitest'
import { hitTest } from './hitTest.ts'
import { makeNodeId, makeEdgeId } from '@swoopy/engine'
import type { Graph } from '@swoopy/engine'

// Two nodes 300px apart — enough room for all three edge hit regions (GE-17)
const aId = makeNodeId('A')
const bId = makeNodeId('B')
const edgeId = makeEdgeId('e1')

const graph: Graph = {
  nodes: [
    { id: aId, label: 'A', x: 0, y: 0, radius: 50, min: 0, max: 10, initial: 0 },
    { id: bId, label: 'B', x: 300, y: 0, radius: 50, min: 0, max: 10, initial: 0 },
  ],
  edges: [{
    kind: 'causal', id: edgeId, from: aId, to: bId,
    polarity: 1, weight: 1.0, delay: 'none', transferFn: 'linear',
  }],
}

// Edge runs from (50,0) to (250,0) — a 200px straight line (no bow, no reverse)
// t=0.2 → delay region at (90,0)
// t=0.5 → polarity badge at (150,0)
// t=0.8 → weight region at (210,0)

describe('GE-08/16/17 edge hit regions', () => {
  it('returns edge-polarity when clicking near the edge midpoint (t=0.5)', () => {
    expect(hitTest(graph, 150, 0)).toMatchObject({ kind: 'edge-polarity', edgeId })
  })

  it('returns edge-delay when clicking near the t=0.2 point', () => {
    // Edge from (50,0) to (250,0). t=0.2 → x = 50 + 0.2*200 = 90
    expect(hitTest(graph, 90, 0)).toMatchObject({ kind: 'edge-delay', edgeId })
  })

  it('returns edge-weight when clicking near the t=0.8 point', () => {
    // t=0.8 → x = 50 + 0.8*200 = 210
    expect(hitTest(graph, 210, 0)).toMatchObject({ kind: 'edge-weight', edgeId })
  })

  it('GE-17 hit regions do not overlap — points between regions return null', () => {
    // Midpoint between delay (90) and polarity (150): x=120 — should miss both
    expect(hitTest(graph, 120, 0)).toBeNull()
    // Midpoint between polarity (150) and weight (210): x=180 — should miss both
    expect(hitTest(graph, 180, 0)).toBeNull()
  })

  it('nodes take priority over edge regions', () => {
    // Click inside node A (radius 50, centre 0,0)
    expect(hitTest(graph, 30, 0)).toMatchObject({ kind: 'node', id: aId })
  })
})
