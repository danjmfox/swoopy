import { describe, it, expect } from 'vitest'
import { makeNodeId, makeEdgeId, makeInitialSim, step } from './index.ts'
import type { Graph, Node, ConstraintEdge } from './types.ts'

const node = (id: string, initial: number, min = 0, max = 10): Node => ({
  id: makeNodeId(id),
  label: id,
  x: 0,
  y: 0,
  radius: 40,
  min,
  max,
  initial,
})

const ceiling = (id: string, from: string, to: string): ConstraintEdge => ({
  kind: 'constraint',
  constraintKind: 'ceiling',
  id: makeEdgeId(id),
  from: makeNodeId(from),
  to: makeNodeId(to),
})

// GE-24: ceiling constraint
describe('GE-24 ceiling constraint', () => {
  it('sets effective_max to min(target.max, source.value) and clamps the target', () => {
    // A.initial=5 means A's value is 5. B.initial=8 starts above the ceiling.
    // effective_max = min(B.max=10, A.value=5) = 5 → B should be clamped to 5.
    const graph: Graph = {
      nodes: [node('A', 5), node('B', 8)],
      edges: [ceiling('A-B', 'A', 'B')],
    }
    const sim = makeInitialSim(graph)
    const next = step(graph, sim, 1 / 60)
    expect(next.nodeValues.get(makeNodeId('B'))).toBeLessThanOrEqual(5)
  })
})
