import { describe, it, expect } from 'vitest'
import { makeNodeId, makeEdgeId, makeInitialSim, step, inject, serialize, deserialize } from './index.ts'
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

const floor = (id: string, from: string, to: string): ConstraintEdge => ({
  kind: 'constraint',
  constraintKind: 'floor',
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

// GE-24: floor constraint
describe('GE-24 floor constraint', () => {
  it('sets effective_min to max(target.min, source.value) and lifts the target', () => {
    // A.initial=7 means A's value is 7. B.initial=0 starts below the floor.
    // effective_min = max(B.min=0, A.value=7) = 7 → B should be lifted to at least 7.
    const graph: Graph = {
      nodes: [node('A', 7), node('B', 0)],
      edges: [floor('A-B', 'A', 'B')],
    }
    const sim = makeInitialSim(graph)
    const next = step(graph, sim, 1 / 60)
    expect(next.nodeValues.get(makeNodeId('B'))).toBeGreaterThanOrEqual(7)
  })
})

// SI-13: floor wins when floor > ceiling
describe('SI-13 floor wins when effective_min > effective_max', () => {
  it('pins the target to effective_min when floor exceeds ceiling', () => {
    // Ceiling C→B sets effective_max = 4. Floor D→B sets effective_min = 7.
    // effective_min(7) > effective_max(4) → B pins to 7 (floor wins per PRD §7.2 step 1).
    const graph: Graph = {
      nodes: [node('C', 4), node('D', 7), node('B', 0)],
      edges: [ceiling('C-B', 'C', 'B'), floor('D-B', 'D', 'B')],
    }
    const sim = makeInitialSim(graph)
    const next = step(graph, sim, 1 / 60)
    expect(next.nodeValues.get(makeNodeId('B'))).toBe(7)
  })
})

// GE-25: multiple constraints from different sources combine
describe('GE-25 multiple incoming constraints combine', () => {
  it('two ceiling constraints: effective_max is the minimum of both source values', () => {
    // C1.value=6, C2.value=3 → effective_max = min(10, 6, 3) = 3. B.initial=8 → clamp to 3.
    const graph: Graph = {
      nodes: [node('C1', 6), node('C2', 3), node('B', 8)],
      edges: [ceiling('C1-B', 'C1', 'B'), ceiling('C2-B', 'C2', 'B')],
    }
    const sim = makeInitialSim(graph)
    const next = step(graph, sim, 1 / 60)
    expect(next.nodeValues.get(makeNodeId('B'))).toBeLessThanOrEqual(3)
  })

  it('two floor constraints: effective_min is the maximum of both source values', () => {
    // F1.value=2, F2.value=6 → effective_min = max(0, 2, 6) = 6. B.initial=0 → lift to 6.
    const graph: Graph = {
      nodes: [node('F1', 2), node('F2', 6), node('B', 0)],
      edges: [floor('F1-B', 'F1', 'B'), floor('F2-B', 'F2', 'B')],
    }
    const sim = makeInitialSim(graph)
    const next = step(graph, sim, 1 / 60)
    expect(next.nodeValues.get(makeNodeId('B'))).toBeGreaterThanOrEqual(6)
  })
})

// GE-24: constraint resolves using the current (dynamic) source value, not a stale one
describe('GE-24 dynamic source variation', () => {
  it('relaxes ceiling when source value increases between steps', () => {
    // Step 1: A.value=2 → effective_max=2. B.initial=8 → clamped to 2.
    // Inject A to 7 and B to 5. effective_max is now min(10, 7) = 7.
    // Step 2: B=5 is within the new ceiling → stays at 5.
    // If step() had used the stale A.value=2, B would be clamped back to 2.
    const graph: Graph = {
      nodes: [node('A', 2), node('B', 8)],
      edges: [ceiling('A-B', 'A', 'B')],
    }
    const sim0 = makeInitialSim(graph)
    const sim1 = step(graph, sim0, 1 / 60)
    expect(sim1.nodeValues.get(makeNodeId('B'))).toBeLessThanOrEqual(2)

    const sim2 = inject(inject(sim1, graph, makeNodeId('A'), 5), graph, makeNodeId('B'), 3) // A→7, B→5
    const sim3 = step(graph, sim2, 1 / 60)
    expect(sim3.nodeValues.get(makeNodeId('B'))).toBeGreaterThan(2)
  })
})

// SE-01: constraint edges survive serialise → deserialise round-trip
describe('SE-01 serialise round-trip with constraint edges', () => {
  it('restores constraint edges with kind and constraintKind intact', () => {
    const graph: Graph = {
      nodes: [node('A', 5), node('B', 0)],
      edges: [ceiling('A-B', 'A', 'B')],
    }
    const restored = deserialize(serialize(graph))
    expect(restored.edges).toEqual(graph.edges)
  })
})
