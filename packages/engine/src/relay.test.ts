/**
 * Relay propagation model — test suite
 * DR--20260401--engine--relay-propagation-model
 *
 * Tests are ordered to match the task plan: type → constants → inject → step → integration.
 * Each describe block is added one test at a time (red → green rhythm).
 */
import { describe, it, expect } from 'vitest'
import { makeNodeId, makeEdgeId } from './ids.ts'
import type { Signal, Graph } from './types.ts'
import * as constants from './constants.ts'
import { makeInitialSim, inject, step } from './sim.ts'

const nodeA = makeNodeId('A')
const nodeB = makeNodeId('B')
const edgeAB = makeEdgeId('AB')

const twoNodeGraph: Graph = {
  nodes: [
    { id: nodeA, label: 'A', x: 0,   y: 0, radius: 40, min: 0, max: 10, initial: 5 },
    { id: nodeB, label: 'B', x: 100, y: 0, radius: 40, min: 0, max: 10, initial: 5 },
  ],
  edges: [
    { id: edgeAB, kind: 'causal', from: nodeA, to: nodeB, polarity: 1, weight: 1, delay: 'none', transferFn: 'linear' },
  ],
}

// ---------------------------------------------------------------------------
// Task 4: Signal type has hopsRemaining
// ---------------------------------------------------------------------------

describe('Signal type — hopsRemaining field', () => {
  it('Signal accepts hopsRemaining: number', () => {
    // Type-level assertion: fails TS typecheck until Signal.hopsRemaining is added.
    // At runtime (strip-types) the annotation is erased — we verify the value survives.
    const s: Signal = {
      id: 's1',
      edgeId: makeEdgeId('e1'),
      progress: 0,
      strength: 1,
      hopsRemaining: 8,
    }
    expect(s.hopsRemaining).toBe(8)
  })
})

// ---------------------------------------------------------------------------
// Task 6: MAX_HOPS constant exists; EMIT_THRESHOLD is gone
// ---------------------------------------------------------------------------

describe('constants — relay model', () => {
  it('MAX_HOPS is a positive integer', () => {
    expect(constants.MAX_HOPS).toBeGreaterThan(0)
    expect(Number.isInteger(constants.MAX_HOPS)).toBe(true)
  })

  it('EMIT_THRESHOLD no longer exists', () => {
    expect((constants as Record<string, unknown>).EMIT_THRESHOLD).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Task 8: inject() emits signals on outgoing edges
// ---------------------------------------------------------------------------

describe('inject() — relay emit', () => {
  it('inject on a node with outgoing edge produces signals in the sim', () => {
    // In the relay model, inject() both changes node value AND emits signals immediately.
    // In the v1 model, inject() only changes node value; signals appear after the next step().
    // This test expects signals to be present on the sim returned by inject() itself.
    const sim0 = makeInitialSim(twoNodeGraph)
    const sim1 = inject(sim0, twoNodeGraph, nodeA, 1)
    expect(sim1.signals.length).toBeGreaterThan(0)
  })

  it('inject signal carries hopsRemaining = MAX_HOPS', () => {
    const sim1 = inject(makeInitialSim(twoNodeGraph), twoNodeGraph, nodeA, 1)
    expect(sim1.signals[0].hopsRemaining).toBe(constants.MAX_HOPS)
  })
})

// ---------------------------------------------------------------------------
// Tasks 10–12: step() arrival — value change + relay fan-out + hop termination
// ---------------------------------------------------------------------------

describe('step() — signal arrival', () => {
  it('signal arriving at B changes B.value by signal.strength × polarity', () => {
    // Inject A → signal travels A→B → B.value should increase by signal.strength
    const sim0 = inject(makeInitialSim(twoNodeGraph), twoNodeGraph, nodeA, 1)
    const initialB = sim0.nodeValues.get(nodeB) ?? 0
    // Run enough steps for signal to arrive (transit = ~92 ticks at 1/60 dt)
    let sim = sim0
    for (let i = 0; i < 120; i++) sim = step(twoNodeGraph, sim, 1 / 60)
    expect(sim.nodeValues.get(nodeB)).toBeGreaterThan(initialB)
  })

  it('signal arriving at B (hopsRemaining > 0) triggers relay signals on B outgoing edges', () => {
    // Build A→B→C chain; inject A; after B receives, C should also receive
    const nodeC = makeNodeId('C')
    const edgeBC = makeEdgeId('BC')
    const chainGraph: Graph = {
      nodes: [
        { id: nodeA, label: 'A', x: 0,   y: 0, radius: 40, min: 0, max: 10, initial: 5 },
        { id: nodeB, label: 'B', x: 100, y: 0, radius: 40, min: 0, max: 10, initial: 5 },
        { id: nodeC, label: 'C', x: 200, y: 0, radius: 40, min: 0, max: 10, initial: 5 },
      ],
      edges: [
        { id: edgeAB, kind: 'causal', from: nodeA, to: nodeB, polarity: 1, weight: 1, delay: 'none', transferFn: 'linear' },
        { id: edgeBC, kind: 'causal', from: nodeB, to: nodeC, polarity: 1, weight: 1, delay: 'none', transferFn: 'linear' },
      ],
    }
    const initialC = 5
    let sim = inject(makeInitialSim(chainGraph), chainGraph, nodeA, 1)
    // Run enough ticks for signal to reach C (2 edge transits ≈ 185 ticks)
    for (let i = 0; i < 250; i++) sim = step(chainGraph, sim, 1 / 60)
    expect(sim.nodeValues.get(nodeC)).toBeGreaterThan(initialC)
  })

  it('signal arriving at B with hopsRemaining=0 does NOT emit relay signals', () => {
    // Inject with strength=1, check that after B receives a hop=0 signal,
    // no further signals appear for C on a A→B→C chain
    const nodeC = makeNodeId('C2')
    const edgeBC = makeEdgeId('BC2')
    const chainGraph: Graph = {
      nodes: [
        { id: nodeA, label: 'A', x: 0,   y: 0, radius: 40, min: 0, max: 10, initial: 5 },
        { id: nodeB, label: 'B', x: 100, y: 0, radius: 40, min: 0, max: 10, initial: 5 },
        { id: nodeC, label: 'C', x: 200, y: 0, radius: 40, min: 0, max: 10, initial: 5 },
      ],
      edges: [
        { id: edgeAB, kind: 'causal', from: nodeA, to: nodeB, polarity: 1, weight: 1, delay: 'none', transferFn: 'linear' },
        { id: edgeBC, kind: 'causal', from: nodeB, to: nodeC, polarity: 1, weight: 1, delay: 'none', transferFn: 'linear' },
      ],
    }
    // Manually place a signal on A→B with hopsRemaining=0
    const sim0 = makeInitialSim(chainGraph)
    const simWithSignal = {
      ...sim0,
      signals: [{
        id: 's-zero',
        edgeId: edgeAB,
        progress: 0.99,   // about to arrive
        strength: 1,
        hopsRemaining: 0,
      }],
    }
    const initialC = sim0.nodeValues.get(nodeC) ?? 5
    let sim = step(chainGraph, simWithSignal, 1 / 60)
    // B should have received the signal (value change)
    expect(sim.nodeValues.get(nodeB)).toBeGreaterThan(5)
    // After enough ticks, C should NOT have changed (no relay)
    for (let i = 0; i < 200; i++) sim = step(chainGraph, sim, 1 / 60)
    expect(sim.nodeValues.get(nodeC)).toBe(initialC)
  })
})
