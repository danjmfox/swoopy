import type { Graph, SimState, NodeId, Signal, PendingSignal, CausalEdge, ConstraintEdge, Node } from './types.ts'
import { EMIT_THRESHOLD, SIGNAL_SPEED, DECAY, MAX_SIGNALS, DELAY_TICKS_SHORT, DELAY_TICKS_MEDIUM, DELAY_TICKS_LONG } from './constants.ts'

const DELAY_TICKS: Record<string, number> = {
  short: DELAY_TICKS_SHORT,
  medium: DELAY_TICKS_MEDIUM,
  long: DELAY_TICKS_LONG,
}

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

function resolveConstraints(
  nodeValues: Map<NodeId, number>,
  nodes: ReadonlyArray<Node>,
  constraintEdges: ConstraintEdge[],
): void {
  for (const node of nodes) {
    // Start with designed bounds; constraint edges tighten them.
    let effectiveMax = node.max
    let effectiveMin = node.min
    for (const ce of constraintEdges) {
      if (ce.to !== node.id) continue
      const sourceVal = nodeValues.get(ce.from) ?? 0
      if (ce.constraintKind === 'ceiling') {
        effectiveMax = Math.min(effectiveMax, sourceVal)
      } else {
        effectiveMin = Math.max(effectiveMin, sourceVal)
      }
    }

    const current = nodeValues.get(node.id) ?? node.initial
    if (effectiveMin > effectiveMax) {
      nodeValues.set(node.id, effectiveMin)
    } else {
      nodeValues.set(node.id, Math.min(effectiveMax, Math.max(effectiveMin, current)))
    }
  }
}

export function step(graph: Graph, sim: SimState, dt: number): SimState {
  const nodeValues = new Map(sim.nodeValues)

  const edgeById = new Map(graph.edges.map((e) => [e.id, e]))
  const causalEdgesFrom = new Map<string, CausalEdge[]>()
  const constraintEdges: ConstraintEdge[] = []
  for (const e of graph.edges) {
    if (e.kind === 'causal') {
      const list = causalEdgesFrom.get(e.from) ?? []
      list.push(e)
      causalEdgesFrom.set(e.from, list)
    } else {
      constraintEdges.push(e)
    }
  }

  // §7.2 step 1 — pre-clamp: resolve constraints before propagation
  resolveConstraints(nodeValues, graph.nodes, constraintEdges)

  // §7.2 steps 2–4 — advance signals, collect arrivals, apply to destination nodes
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

  // §7.2 step 5 — decay each node toward its initial value (frame-rate independent)
  for (const node of graph.nodes) {
    const curr = nodeValues.get(node.id) ?? node.initial
    nodeValues.set(node.id, node.initial + (curr - node.initial) * Math.pow(1 - DECAY, dt))
  }

  // §7.2 step 6 — post-clamp: re-clamp after arrivals and decay
  resolveConstraints(nodeValues, graph.nodes, constraintEdges)

  // §7.2 steps 8–9 — emit signals for nodes where |delta| >= EMIT_THRESHOLD.
  //    prevNodeValues captures end-of-last-step, so inject() deltas (nodeValues only)
  //    are included in the delta comparison here.
  const newSignals: Signal[] = []
  const newPending: PendingSignal[] = []
  for (const node of graph.nodes) {
    const delta = (nodeValues.get(node.id) ?? node.initial) - (sim.prevNodeValues.get(node.id) ?? node.initial)
    if (Math.abs(delta) < EMIT_THRESHOLD) continue
    for (const edge of causalEdgesFrom.get(node.id) ?? []) {
      const signal: Signal = { id: nextSignalId(), edgeId: edge.id, progress: 0, strength: delta * edge.weight }
      if (edge.delay === 'none') {
        newSignals.push(signal)
      } else {
        newPending.push({ signal, ticksRemaining: DELAY_TICKS[edge.delay] })
      }
    }
  }

  // §7.2 step 10 — decrement pending counters; release those at 0 into travelling
  const stillPending: PendingSignal[] = []
  for (const p of [...sim.pending, ...newPending]) {
    const decremented = p.ticksRemaining - 1
    if (decremented <= 0) {
      newSignals.push(p.signal)
    } else {
      stillPending.push({ ...p, ticksRemaining: decremented })
    }
  }

  // §7.2 step 11 — cap total signals at MAX_SIGNALS, preferring highest progress
  const allTravelling = [...stillTravelling, ...newSignals].sort((a, b) => b.progress - a.progress)
  const cappedTravelling = allTravelling.slice(0, MAX_SIGNALS)

  return {
    ...sim,
    signals: cappedTravelling,
    pending: stillPending,
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
