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
  const nodeValues = new Map(sim.nodeValues)

  const edgeById = new Map(graph.edges.map((e) => [e.id, e]))
  const causalEdgesFrom = new Map<string, CausalEdge[]>()
  for (const e of graph.edges) {
    if (e.kind === 'causal') {
      const list = causalEdgesFrom.get(e.from) ?? []
      list.push(e)
      causalEdgesFrom.set(e.from, list)
    }
  }

  // 1. Advance travelling signals and apply those that have arrived
  const stillTravelling: Signal[] = []
  for (const s of sim.signals) {
    const advanced = { ...s, progress: s.progress + SIGNAL_SPEED * dt }
    if (advanced.progress >= 1) {
      const edge = edgeById.get(s.edgeId)
      if (edge?.kind === 'causal') {
        const prev = nodeValues.get(edge.to) ?? 0
        nodeValues.set(edge.to, prev + s.strength * edge.polarity)
      }
    } else {
      stillTravelling.push(advanced)
    }
  }

  // 2. Decay each node toward its initial value (frame-rate independent)
  for (const node of graph.nodes) {
    const curr = nodeValues.get(node.id) ?? node.initial
    nodeValues.set(node.id, node.initial + (curr - node.initial) * Math.pow(1 - DECAY, dt))
  }

  // 3. Emit new signals for nodes where |end - prev| >= EMIT_THRESHOLD.
  //    prevNodeValues is the end of the previous step, so inject() deltas
  //    (which update nodeValues but not prevNodeValues) are captured here.
  const newSignals: Signal[] = []
  for (const node of graph.nodes) {
    const delta = (nodeValues.get(node.id) ?? node.initial) - (sim.prevNodeValues.get(node.id) ?? node.initial)
    if (Math.abs(delta) < EMIT_THRESHOLD) continue
    for (const edge of causalEdgesFrom.get(node.id) ?? []) {
      if (edge.delay !== 'none') continue
      newSignals.push({ id: nextSignalId(), edgeId: edge.id, progress: 0, strength: delta * edge.weight })
    }
  }

  return {
    ...sim,
    signals: [...stillTravelling, ...newSignals],
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
