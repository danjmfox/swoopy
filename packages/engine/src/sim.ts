import type { Graph, SimState, NodeId, Signal, CausalEdge } from './types.ts'
import { EMIT_THRESHOLD, SIGNAL_SPEED, DECAY } from './constants.ts'

let signalSeq = 0
function nextSignalId(): string {
  return `s${++signalSeq}`
}

export function makeInitialSim(graph: Graph): SimState {
  const nodeValues = new Map(graph.nodes.map((n) => [n.id, n.initial]))
  return {
    signals: [],
    pending: [],
    nodeValues,
    prevNodeValues: new Map(nodeValues),
    tick: 0,
  }
}

export function step(graph: Graph, sim: SimState, dt: number): SimState {
  const startValues = sim.nodeValues
  const nodeValues = new Map(startValues)

  // Advance travelling signals
  const travelling: Signal[] = sim.signals.map((s) => ({
    ...s,
    progress: s.progress + SIGNAL_SPEED * dt,
  }))

  // Apply decay toward each node's initial value
  for (const node of graph.nodes) {
    const curr = nodeValues.get(node.id) ?? node.initial
    const decayed = node.initial + (curr - node.initial) * Math.pow(1 - DECAY, dt)
    nodeValues.set(node.id, decayed)
  }

  // Emit signals for nodes where |endValue - prevValue| >= EMIT_THRESHOLD.
  // prevNodeValues reflects the end of the previous step, so inject() deltas
  // (which change nodeValues but not prevNodeValues) are visible here.
  const causalEdges = graph.edges.filter((e): e is CausalEdge => e.kind === 'causal')
  for (const node of graph.nodes) {
    const prev = sim.prevNodeValues.get(node.id) ?? node.initial
    const curr = nodeValues.get(node.id) ?? node.initial
    const delta = curr - prev
    if (Math.abs(delta) >= EMIT_THRESHOLD) {
      for (const edge of causalEdges.filter((e) => e.from === node.id && e.delay === 'none')) {
        travelling.push({
          id: nextSignalId(),
          edgeId: edge.id,
          progress: 0,
          strength: delta * edge.weight,
        })
      }
    }
  }

  return {
    ...sim,
    signals: travelling,
    nodeValues,
    prevNodeValues: new Map(nodeValues),
    tick: sim.tick + 1,
  }
}

export function inject(sim: SimState, nodeId: NodeId, strength: number): SimState {
  const nodeValues = new Map(sim.nodeValues)
  nodeValues.set(nodeId, (nodeValues.get(nodeId) ?? 0) + strength)
  return { ...sim, nodeValues }
}
