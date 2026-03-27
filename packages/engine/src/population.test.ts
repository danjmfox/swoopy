import { describe, it, expect } from 'vitest'
import { makeNodeId, makeEdgeId, makeInitialSim, inject, step, INJECT_STRENGTH } from './index.ts'
import type { Graph, Node, CausalEdge } from './types.ts'

const popId = makeNodeId('population')
const birthsId = makeNodeId('births')
const deathsId = makeNodeId('deaths')

const population: Node = {
  id: popId, label: 'Population', x: 0, y: 0, radius: 40,
  min: 0, max: 10, initial: 5,
}
const births: Node = {
  id: birthsId, label: 'Births', x: 100, y: -80, radius: 40,
  min: 0, max: 10, initial: 0,
}
const deaths: Node = {
  id: deathsId, label: 'Deaths', x: 100, y: 80, radius: 40,
  min: 0, max: 10, initial: 0,
}

const edge = (id: string, from: typeof popId, to: typeof popId, polarity: 1 | -1): CausalEdge => ({
  kind: 'causal', id: makeEdgeId(id), from, to, polarity,
  weight: 1.0, delay: 'none', transferFn: 'linear',
})

export const seedGraph: Graph = {
  nodes: [population, births, deaths],
  edges: [
    edge('pop-births', popId, birthsId, 1),   // reinforcing
    edge('births-pop', birthsId, popId, 1),   // reinforcing
    edge('pop-deaths', popId, deathsId, 1),
    edge('deaths-pop', deathsId, popId, -1),  // balancing
  ],
}

// GE-11, GE-12
describe('makeInitialSim', () => {
  it('sets each node value to its graph.initial field', () => {
    const sim = makeInitialSim(seedGraph)
    expect(sim.nodeValues.get(popId)).toBe(5)
    expect(sim.nodeValues.get(birthsId)).toBe(0)
    expect(sim.nodeValues.get(deathsId)).toBe(0)
  })
})

// SI-02, SI-03
describe('inject', () => {
  it('increments the target node value by strength', () => {
    const sim = makeInitialSim(seedGraph)
    const next = inject(sim, popId, INJECT_STRENGTH)
    expect(next.nodeValues.get(popId)).toBe(5 + INJECT_STRENGTH)
  })
})

// SI-04
describe('step', () => {
  it('emits signals on outgoing causal edges when |delta| >= EMIT_THRESHOLD', () => {
    const sim0 = makeInitialSim(seedGraph)
    const sim1 = inject(sim0, popId, INJECT_STRENGTH) // delta = 1.0, well above 0.06
    const sim2 = step(seedGraph, sim1, 1 / 60)
    expect(sim2.signals.length).toBeGreaterThan(0)
  })

  it('inverts signal polarity on a balancing (−) edge (SI-05)', () => {
    // Inject into Deaths; its signal to Population has polarity -1
    // Population should fall below its initial value (5)
    const sim0 = makeInitialSim(seedGraph)
    const sim1 = inject(sim0, deathsId, INJECT_STRENGTH)
    let sim = sim1
    for (let i = 0; i < 120; i++) sim = step(seedGraph, sim, 1 / 60)
    expect(sim.nodeValues.get(popId)).toBeLessThan(5)
  })

  it('decays node values toward initial over time without further input (SI-06)', () => {
    // Inject into Births (initial=0), run long enough for decay to dominate
    const sim0 = makeInitialSim(seedGraph)
    const sim1 = inject(sim0, birthsId, INJECT_STRENGTH)
    let sim = sim1
    for (let i = 0; i < 1200; i++) sim = step(seedGraph, sim, 1 / 60)
    // ~20s of sim time; Births should be close to its initial value (0)
    expect(sim.nodeValues.get(birthsId)).toBeLessThan(0.1)
  })

  it('applies arrived signals to destination node values', () => {
    // Run long enough for Population→Births signal to arrive (progress reaches 1)
    // At SIGNAL_SPEED=0.65, takes 1/0.65 ≈ 1.54s = ~92 frames at 60fps
    const sim0 = makeInitialSim(seedGraph)
    const sim1 = inject(sim0, popId, INJECT_STRENGTH)
    let sim = sim1
    for (let i = 0; i < 120; i++) sim = step(seedGraph, sim, 1 / 60)
    // Births should have risen above its initial value (0)
    expect(sim.nodeValues.get(birthsId)).toBeGreaterThan(0)
  })
})
