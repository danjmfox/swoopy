/**
 * Characterisation script — PRD §7.7
 * Run with: pnpm tsx packages/engine/src/characterise.ts
 *
 * Builds a 6-node fully-connected reinforcing graph, injects maximum strength,
 * runs 600 ticks, records signal count per tick. MAX_SIGNALS = 99th percentile
 * of the plateau (ticks 120–600), not the initial spike.
 */
import { makeNodeId, makeEdgeId, makeInitialSim, inject, step, INJECT_STRENGTH } from './index.ts'
import type { Graph, CausalEdge, Node } from './types.ts'

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
      kind: 'causal',
      id: makeEdgeId(`e${i}-${j}`),
      from: nodeIds[i],
      to: nodeIds[j],
      polarity: 1,
      weight: 1.0,
      delay: 'none',
      transferFn: 'linear',
    })
  }
}

const graph: Graph = { nodes, edges }
let sim = makeInitialSim(graph)
// Inject max into all nodes
for (const id of nodeIds) sim = inject(sim, id, INJECT_STRENGTH * 5)

const counts: number[] = []
const TICKS = 600
for (let i = 0; i < TICKS; i++) {
  sim = step(graph, sim, 1 / 60)
  counts.push(sim.signals.length)
}

// Plateau = ticks 120–600 (skip initial spike)
const plateau = counts.slice(120)
plateau.sort((a, b) => a - b)
const p99 = plateau[Math.floor(plateau.length * 0.99)]
const max = Math.max(...counts)

console.log(`Peak signal count: ${max}`)
console.log(`99th percentile (plateau ticks 120-600): ${p99}`)
console.log(`Suggested MAX_SIGNALS: ${p99}`)
