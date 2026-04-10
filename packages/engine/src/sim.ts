import type {
  Graph,
  SimState,
  NodeId,
  EdgeId,
  Signal,
  PendingSignal,
  CausalEdge,
  ConstraintEdge,
  Edge,
  Node,
} from "./types.ts";
import {
  SIGNAL_SPEED,
  MAX_SIGNALS,
  MAX_HOPS,
  EDGE_TRANSIT_TICKS,
  DELAY_TICKS_SHORT,
  DELAY_TICKS_MEDIUM,
  DELAY_TICKS_LONG,
} from "./constants.ts";

const DELAY_TICKS: Record<string, number> = {
  short: DELAY_TICKS_SHORT,
  medium: DELAY_TICKS_MEDIUM,
  long: DELAY_TICKS_LONG,
};

let signalSeq = 0;
function nextSignalId(): string {
  return `s${++signalSeq}`;
}

function buildCausalEdgesFrom(
  edges: ReadonlyArray<Edge>,
): Map<string, CausalEdge[]> {
  const map = new Map<string, CausalEdge[]>();
  for (const e of edges) {
    if (e.kind === "causal") {
      const list = map.get(e.from) ?? [];
      list.push(e);
      map.set(e.from, list);
    }
  }
  return map;
}

export function computeEffectiveWeights(
  graph: Graph,
  nodeValues: ReadonlyMap<NodeId, number>,
): Map<EdgeId, number> {
  const result = new Map<EdgeId, number>();
  for (const edge of graph.edges) {
    if (edge.kind !== "causal") continue;
    result.set(edge.id, edge.weight);
  }
  for (const mod of graph.modulators) {
    const edge = graph.edges.find(
      (e) => e.id === mod.target && e.kind === "causal",
    );
    if (!edge || edge.kind !== "causal") continue;
    const srcNode = graph.nodes.find((n) => n.id === mod.from);
    if (!srcNode) continue;
    const nodeValue = nodeValues.get(mod.from) ?? srcNode.initial;
    const range = srcNode.max - srcNode.min;
    const factor =
      range === 0
        ? 1
        : mod.polarity === 1
          ? (2 * (nodeValue - srcNode.min)) / range
          : (2 * (srcNode.max - nodeValue)) / range;
    const effective = Math.max(0, Math.min(5, edge.weight * factor));
    result.set(edge.id, effective);
  }
  return result;
}

export function makeInitialSim(graph: Graph): SimState {
  const nodeValues = new Map(graph.nodes.map((n) => [n.id, n.initial]));
  return {
    signals: [],
    pending: [],
    nodeValues,
    displayPrevNodeValues: new Map(nodeValues),
    tick: 0,
  };
}

function resolveConstraints(
  nodeValues: Map<NodeId, number>,
  nodes: ReadonlyArray<Node>,
  constraintEdges: ConstraintEdge[],
): void {
  for (const node of nodes) {
    // Start with designed bounds; constraint edges tighten them.
    let effectiveMax = node.max;
    let effectiveMin = node.min;
    for (const ce of constraintEdges) {
      if (ce.to !== node.id) continue;
      const sourceVal = nodeValues.get(ce.from) ?? 0;
      if (ce.constraintKind === "ceiling") {
        effectiveMax = Math.min(effectiveMax, sourceVal);
      } else {
        effectiveMin = Math.max(effectiveMin, sourceVal);
      }
    }

    const current = nodeValues.get(node.id) ?? node.initial;
    if (effectiveMin > effectiveMax) {
      nodeValues.set(node.id, effectiveMin);
    } else {
      nodeValues.set(
        node.id,
        Math.min(effectiveMax, Math.max(effectiveMin, current)),
      );
    }
  }
}

export function step(graph: Graph, sim: SimState, dt: number): SimState {
  const safeDt = Math.min(dt, 0.1);
  const nodeValues = new Map(sim.nodeValues);
  // Beginning-of-step snapshot for renderer trend arrows (SI-12 displayPrevNodeValues).
  const displayPrevNodeValues = new Map(sim.nodeValues);

  const edgeById = new Map(graph.edges.map((e) => [e.id, e]));
  const causalEdgesFrom = buildCausalEdgesFrom(graph.edges);
  const constraintEdges = graph.edges.filter(
    (e): e is ConstraintEdge => e.kind === "constraint",
  );
  const effectiveWeights = computeEffectiveWeights(graph, sim.nodeValues);

  // §7.2 step 1 — pre-clamp: resolve constraints before propagation
  resolveConstraints(nodeValues, graph.nodes, constraintEdges);

  // §7.2 steps 2–4 — advance signals, collect arrivals.
  // Relay model (DR--20260401): on arrival, apply value change then fan-out on all
  // outgoing causal edges if hopsRemaining > 0. Weight=N emits N fragments of
  // signal.strength (amplitude model). hopsRemaining decremented per edge traversal.
  //
  // Zero-net guard: arrivals are bucketed by target node. If Σ(strength × sign) = 0
  // for a node in this tick, value changes are applied (and cancel) but relay is
  // suppressed — no misleading in-flight chevrons for zero net effect.
  const stillTravelling: Signal[] = [];
  const newSignals: Signal[] = [];
  const newPending: PendingSignal[] = [];

  // Pass 1: advance signals; bucket arrivals by target node id.
  const arrivalsByTarget = new Map<NodeId, Signal[]>();
  for (const s of sim.signals) {
    const advanced = { ...s, progress: s.progress + SIGNAL_SPEED * safeDt };
    if (advanced.progress >= 1) {
      const edge = edgeById.get(s.edgeId);
      if (edge?.kind === "causal") {
        const bucket = arrivalsByTarget.get(edge.to) ?? [];
        bucket.push(s);
        arrivalsByTarget.set(edge.to, bucket);
      }
    } else {
      stillTravelling.push(advanced);
    }
  }

  // Pass 2: per target node — apply value deltas, guard relay on zero net.
  for (const [targetNodeId, arrivals] of arrivalsByTarget) {
    // Apply all value changes (they may cancel; that is correct).
    for (const s of arrivals) {
      const prev = nodeValues.get(targetNodeId) ?? 0;
      nodeValues.set(targetNodeId, prev + s.strength * s.sign);
    }
    // Guard: suppress relay entirely if net strength × sign sums to zero.
    const net = arrivals.reduce((sum, s) => sum + s.strength * s.sign, 0);
    if (net === 0) continue;
    // Non-zero net: relay each arrived signal independently (unchanged behaviour).
    for (const s of arrivals) {
      if (s.hopsRemaining > 0) {
        const relay = emitRelayFragments(
          causalEdgesFrom.get(targetNodeId) ?? [],
          s.strength,
          s.hopsRemaining - 1,
          effectiveWeights,
          s.sign,
        );
        newSignals.push(...relay.signals);
        newPending.push(...relay.pending);
      }
    }
  }

  // §7.2 step 6 — post-clamp: re-clamp after arrivals
  resolveConstraints(nodeValues, graph.nodes, constraintEdges);

  // §7.2 step 10 — decrement pending counters; release those at 0 into travelling
  const stillPending: PendingSignal[] = [];
  for (const p of [...sim.pending, ...newPending]) {
    const decremented = p.ticksRemaining - 1;
    if (decremented <= 0) {
      newSignals.push(p.signal);
    } else {
      stillPending.push({ ...p, ticksRemaining: decremented });
    }
  }

  // §7.2 step 11 — cap total signals at MAX_SIGNALS, preferring highest progress
  const allTravelling = [...stillTravelling, ...newSignals].sort(
    (a, b) => b.progress - a.progress,
  );
  const cappedTravelling = allTravelling.slice(0, MAX_SIGNALS);

  return {
    ...sim,
    signals: cappedTravelling,
    pending: stillPending,
    nodeValues,
    displayPrevNodeValues,
    tick: sim.tick + 1,
  };
}

export function inject(
  sim: SimState,
  graph: Graph,
  nodeId: NodeId,
  strength: number,
): SimState {
  const effectiveWeights = computeEffectiveWeights(graph, sim.nodeValues);
  const nodeValues = new Map(sim.nodeValues);
  nodeValues.set(nodeId, (nodeValues.get(nodeId) ?? 0) + strength);
  const causalEdgesFrom = buildCausalEdgesFrom(graph.edges);
  const { signals: newSignals, pending: newPending } = emitRelayFragments(
    causalEdgesFrom.get(nodeId) ?? [],
    strength,
    MAX_HOPS,
    effectiveWeights,
    1, // injection: positive impulse at source node — sign = edge.polarity per edge
  );
  return {
    ...sim,
    nodeValues,
    signals: [...sim.signals, ...newSignals],
    pending: [...sim.pending, ...newPending],
  };
}

function emitRelayFragments(
  outgoingEdges: CausalEdge[],
  strength: number,
  hopsRemaining: number,
  effectiveWeights: Map<EdgeId, number>,
  parentSign: 1 | -1,
): { signals: Signal[]; pending: PendingSignal[] } {
  const signals: Signal[] = [];
  const pending: PendingSignal[] = [];
  for (const edge of outgoingEdges) {
    const weight = effectiveWeights.get(edge.id) ?? edge.weight;
    if (weight === 0) continue;
    const sign = (parentSign * edge.polarity) as 1 | -1;
    // Sub-unit weight: single attenuated fragment (preserves weight-as-attenuation 0–1).
    if (weight < 1) {
      const fragment = {
        id: nextSignalId(),
        edgeId: edge.id,
        progress: 0,
        strength: strength * weight,
        hopsRemaining,
        sign,
      };
      if (edge.delay !== "none") {
        pending.push({
          signal: fragment,
          ticksRemaining: DELAY_TICKS[edge.delay] ?? DELAY_TICKS_SHORT,
        });
      } else {
        signals.push(fragment);
      }
      continue;
    }
    const count = Math.round(weight);
    const staggerTicks =
      count > 1 ? Math.max(1, Math.round(EDGE_TRANSIT_TICKS / count)) : 0;
    if (edge.delay !== "none") {
      const delayTicks = DELAY_TICKS[edge.delay] ?? DELAY_TICKS_SHORT;
      for (let i = 0; i < count; i++) {
        pending.push({
          signal: {
            id: nextSignalId(),
            edgeId: edge.id,
            progress: 0,
            strength,
            hopsRemaining,
            sign,
          },
          ticksRemaining: delayTicks + i * staggerTicks,
        });
      }
      continue;
    }
    for (let i = 0; i < count; i++) {
      signals.push({
        id: nextSignalId(),
        edgeId: edge.id,
        progress: staggerTicks > 0 ? Math.min(i / count, 0.99) : 0,
        strength,
        hopsRemaining,
        sign,
      });
    }
  }
  return { signals, pending };
}
