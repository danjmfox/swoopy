import type { Graph, SimState, NodeId, Signal, PendingSignal, CausalEdge, ConstraintEdge, Node } from './types.ts'
import { EMIT_THRESHOLD, SIGNAL_SPEED, MAX_SIGNALS, EDGE_TRANSIT_TICKS, DELAY_TICKS_SHORT, DELAY_TICKS_MEDIUM, DELAY_TICKS_LONG } from './constants.ts'

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
    displayPrevNodeValues: new Map(nodeValues),
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
  const safeDt = Math.min(dt, 0.1)
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
    const advanced = { ...s, progress: s.progress + SIGNAL_SPEED * safeDt }
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

  // §7.2 step 6 — post-clamp: re-clamp after arrivals
  resolveConstraints(nodeValues, graph.nodes, constraintEdges)

  // §7.2 steps 8–9 — emit signals for nodes where |delta| >= EMIT_THRESHOLD.
  //    prevNodeValues captures end-of-last-step, so inject() deltas (nodeValues only)
  //    are included in the delta comparison here.
  //    Staggered-density model (DR--20260330): weight=N emits N signals of strength
  //    delta/N, staggered evenly across EDGE_TRANSIT_TICKS so they appear as N
  //    equally-spaced particles. Total effect per emission = delta (weight-invariant).
  const newSignals: Signal[] = []
  const newPending: PendingSignal[] = []
  for (const node of graph.nodes) {
    const delta = (nodeValues.get(node.id) ?? node.initial) - (sim.prevNodeValues.get(node.id) ?? node.initial)
    if (Math.abs(delta) < EMIT_THRESHOLD) continue
    for (const edge of causalEdgesFrom.get(node.id) ?? []) {
      if (edge.delay !== 'none') {
        // Delayed edges use the existing pending queue with named delay levels.
        // Stagger is not applied to delayed edges — the delay dominates.
        const signal: Signal = { id: nextSignalId(), edgeId: edge.id, progress: 0, strength: delta }
        newPending.push({ signal, ticksRemaining: DELAY_TICKS[edge.delay] })
        continue
      }
      if (edge.weight === 0) continue
      if (edge.weight < 1) {
        // Sub-unit weight: single attenuated signal. Preserves weight-as-attenuation
        // semantics in the 0–1 range (e.g. weight=0.5 → half-strength signal).
        newSignals.push({ id: nextSignalId(), edgeId: edge.id, progress: 0, strength: delta * edge.weight })
        continue
      }
      // weight ≥ 1: staggered-density model. Emit count=round(weight) signals each of
      // strength delta/count, staggered evenly across the edge transit time.
      // Total effect = delta regardless of count (weight controls visual density only).
      const count = Math.round(edge.weight)
      const staggerTicks = Math.max(1, Math.round(EDGE_TRANSIT_TICKS / count))
      const perSignalStrength = delta / count
      for (let i = 0; i < count; i++) {
        const signal: Signal = { id: nextSignalId(), edgeId: edge.id, progress: 0, strength: perSignalStrength }
        if (i === 0) {
          newSignals.push(signal)
        } else {
          newPending.push({ signal, ticksRemaining: i * staggerTicks })
        }
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
    displayPrevNodeValues: new Map(sim.nodeValues),
    tick: sim.tick + 1,
  }
}

export function inject(sim: SimState, nodeId: NodeId, strength: number): SimState {
  const nodeValues = new Map(sim.nodeValues)
  nodeValues.set(nodeId, (nodeValues.get(nodeId) ?? 0) + strength)
  return { ...sim, nodeValues }
}
