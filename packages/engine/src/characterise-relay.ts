/**
 * Characterisation script — relay propagation model (pre-implementation)
 * Run with: node --experimental-strip-types packages/engine/src/characterise-relay.ts
 *
 * Implements the relay model inline (engine not yet rewritten) to characterise
 * behaviour across MAX_HOPS candidates {3, 5, 8, 13} on three scenarios:
 *
 *   1. Reinforcing loop  A→B→A (+/+) — expect: both nodes saturate at max
 *   2. Balancing loop    A→B→A (+/-) — expect: system corrects, no runaway
 *   3. Diamond           A→B→D(+), A→C→D(-) — expect: D receives from BOTH paths
 *
 * Metrics reported per scenario × MAX_HOPS:
 *   - Node values at tick 60, 120, 200
 *   - Peak travelling signal count
 *   - Verdict: SATURATE / CORRECT / BOTH-PATHS / RUNAWAY / STALE
 */

import { SIGNAL_SPEED, EDGE_TRANSIT_TICKS } from "./constants.ts";

// ---------------------------------------------------------------------------
// Minimal relay-model types
// ---------------------------------------------------------------------------

interface RNode {
  id: string;
  value: number;
  min: number;
  max: number;
}

interface REdge {
  id: string;
  from: string;
  to: string;
  polarity: 1 | -1;
  weight: number; // fragment count per relay event
}

interface RSignal {
  edgeId: string;
  progress: number;
  strength: number;
  hopsRemaining: number;
}

interface RState {
  nodes: Map<string, RNode>;
  signals: RSignal[];
  tick: number;
}

// ---------------------------------------------------------------------------
// Relay engine (implements the design from the task plan)
// ---------------------------------------------------------------------------

function makeState(nodes: RNode[]): RState {
  return {
    nodes: new Map(nodes.map((n) => [n.id, { ...n }])),
    signals: [],
    tick: 0,
  };
}

function relayInject(
  state: RState,
  edges: REdge[],
  nodeId: string,
  strength: number,
  MAX_HOPS: number,
): void {
  const node = state.nodes.get(nodeId)!;
  node.value = Math.min(node.max, Math.max(node.min, node.value + strength));
  const outgoing = edges.filter((e) => e.from === nodeId);
  for (const edge of outgoing) {
    emitFragments(state.signals, edge, strength, MAX_HOPS);
  }
}

function emitFragments(
  signals: RSignal[],
  edge: REdge,
  strength: number,
  hopsRemaining: number,
): void {
  const count = Math.max(1, Math.round(edge.weight));
  const staggerTicks =
    count > 1 ? Math.max(1, Math.round(EDGE_TRANSIT_TICKS / count)) : 0;
  for (let i = 0; i < count; i++) {
    // Stagger: pre-advance progress so fragments are spread across the edge
    const preAdvance =
      staggerTicks > 0
        ? (i / count) * (SIGNAL_SPEED * (1 / 60) * EDGE_TRANSIT_TICKS)
        : 0;
    signals.push({
      edgeId: edge.id,
      progress: Math.min(preAdvance, 0.99),
      strength,
      hopsRemaining,
    });
  }
}

function relayStep(
  state: RState,
  edges: REdge[],
  dt: number,
  MAX_HOPS: number,
): void {
  const safeDt = Math.min(dt, 0.1);
  const edgeMap = new Map(edges.map((e) => [e.id, e]));
  const outgoingMap = new Map<string, REdge[]>();
  for (const e of edges) {
    const list = outgoingMap.get(e.from) ?? [];
    list.push(e);
    outgoingMap.set(e.from, list);
  }

  const stillTravelling: RSignal[] = [];
  const newSignals: RSignal[] = [];

  for (const s of state.signals) {
    const advanced = { ...s, progress: s.progress + SIGNAL_SPEED * safeDt };
    if (advanced.progress >= 1) {
      // Arrived — apply to destination node
      const edge = edgeMap.get(s.edgeId)!;
      const node = state.nodes.get(edge.to)!;
      node.value = Math.min(
        node.max,
        Math.max(node.min, node.value + s.strength * edge.polarity),
      );

      // Relay: if hops remain, fan out on all outgoing edges of destination
      if (s.hopsRemaining > 0) {
        const outgoing = outgoingMap.get(edge.to) ?? [];
        for (const outEdge of outgoing) {
          emitFragments(newSignals, outEdge, s.strength, s.hopsRemaining - 1);
        }
      }
    } else {
      stillTravelling.push(advanced);
    }
  }

  state.signals = [...stillTravelling, ...newSignals];
  state.tick++;
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

function scenarioReinforcing(MAX_HOPS: number): ScenarioResult {
  // A → B → A (both positive)
  const nodes: RNode[] = [
    { id: "A", value: 5, min: 0, max: 10 },
    { id: "B", value: 5, min: 0, max: 10 },
  ];
  const edges: REdge[] = [
    { id: "AB", from: "A", to: "B", polarity: 1, weight: 1 },
    { id: "BA", from: "B", to: "A", polarity: 1, weight: 1 },
  ];
  const state = makeState(nodes);
  relayInject(state, edges, "A", 1, MAX_HOPS);
  return runScenario(state, edges, MAX_HOPS, ["A", "B"]);
}

function scenarioBalancing(MAX_HOPS: number): ScenarioResult {
  // A → B (positive), B → A (negative)
  const nodes: RNode[] = [
    { id: "A", value: 5, min: 0, max: 10 },
    { id: "B", value: 5, min: 0, max: 10 },
  ];
  const edges: REdge[] = [
    { id: "AB", from: "A", to: "B", polarity: 1, weight: 1 },
    { id: "BA", from: "B", to: "A", polarity: -1, weight: 1 },
  ];
  const state = makeState(nodes);
  relayInject(state, edges, "A", 1, MAX_HOPS);
  return runScenario(state, edges, MAX_HOPS, ["A", "B"]);
}

function scenarioDiamond(MAX_HOPS: number): ScenarioResult {
  // A → B → D(+), A → C → D(-); inject A
  const nodes: RNode[] = [
    { id: "A", value: 5, min: 0, max: 10 },
    { id: "B", value: 5, min: 0, max: 10 },
    { id: "C", value: 5, min: 0, max: 10 },
    { id: "D", value: 5, min: 0, max: 10 },
  ];
  const edges: REdge[] = [
    { id: "AB", from: "A", to: "B", polarity: 1, weight: 1 },
    { id: "AC", from: "A", to: "C", polarity: 1, weight: 1 },
    { id: "BD", from: "B", to: "D", polarity: 1, weight: 1 },
    { id: "CD", from: "C", to: "D", polarity: -1, weight: 1 },
  ];
  const state = makeState(nodes);
  relayInject(state, edges, "A", 1, MAX_HOPS);
  return runScenario(state, edges, MAX_HOPS, ["A", "B", "C", "D"]);
}

// ---------------------------------------------------------------------------
// Run helpers
// ---------------------------------------------------------------------------

interface ScenarioResult {
  snapshots: Record<number, Record<string, number>>;
  peakSignals: number;
  finalValues: Record<string, number>;
}

function runScenario(
  state: RState,
  edges: REdge[],
  MAX_HOPS: number,
  nodeIds: string[],
): ScenarioResult {
  // Run long enough for the full relay chain to complete:
  // each hop takes ~EDGE_TRANSIT_TICKS ticks; add a 200-tick buffer for the last signal to drain.
  const runTicks = MAX_HOPS * EDGE_TRANSIT_TICKS + 200;
  const snapshots: Record<number, Record<string, number>> = {};
  const checkAt = new Set([
    EDGE_TRANSIT_TICKS,
    Math.round(runTicks / 2),
    runTicks,
  ]);
  let peakSignals = 0;

  for (let t = 0; t < runTicks; t++) {
    relayStep(state, edges, 1 / 60, MAX_HOPS);
    peakSignals = Math.max(peakSignals, state.signals.length);
    if (checkAt.has(t + 1)) {
      snapshots[t + 1] = Object.fromEntries(
        nodeIds.map((id) => [
          id,
          Math.round((state.nodes.get(id)?.value ?? 0) * 100) / 100,
        ]),
      );
    }
  }

  return {
    snapshots,
    peakSignals,
    finalValues: Object.fromEntries(
      nodeIds.map((id) => [id, state.nodes.get(id)?.value ?? 0]),
    ),
  };
}

function verdict(
  name: string,
  result: ScenarioResult,
  nodeIds: string[],
): string {
  const final = result.finalValues;
  if (name === "reinforcing") {
    const saturated = nodeIds.every((id) => final[id] >= 9.9);
    return saturated
      ? "SATURATE ✓"
      : `PARTIAL  (A=${final.A?.toFixed(2)} B=${final.B?.toFixed(2)})`;
  }
  if (name === "balancing") {
    const aFinal = final.A ?? 0;
    const bFinal = final.B ?? 0;
    // System should not have both nodes at max; values should be bounded
    const runaway = aFinal >= 9.9 && bFinal >= 9.9;
    if (runaway) return "RUNAWAY  ✗";
    return `CORRECT  ✓ (A=${aFinal.toFixed(2)} B=${bFinal.toFixed(2)})`;
  }
  if (name === "diamond") {
    // D should have been touched by both paths — net effect is 0 (+ and - cancel)
    // but both B and C should show movement
    const bMoved = Math.abs((final.B ?? 5) - 5) > 0.01;
    const cMoved = Math.abs((final.C ?? 5) - 5) > 0.01;
    return bMoved && cMoved
      ? `BOTH-PATHS ✓ (B=${final.B?.toFixed(2)} C=${final.C?.toFixed(2)} D=${final.D?.toFixed(2)})`
      : `STALE ✗ (B=${final.B?.toFixed(2)} C=${final.C?.toFixed(2)})`;
  }
  return "?";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const MAX_HOPS_CANDIDATES = [3, 5, 8, 13];

const scenarios: Array<{
  name: string;
  label: string;
  fn: (hops: number) => ScenarioResult;
  nodes: string[];
}> = [
  {
    name: "reinforcing",
    label: "Reinforcing loop  A→B→A (+/+)",
    fn: scenarioReinforcing,
    nodes: ["A", "B"],
  },
  {
    name: "balancing",
    label: "Balancing loop    A→B→A (+/-)",
    fn: scenarioBalancing,
    nodes: ["A", "B"],
  },
  {
    name: "diamond",
    label: "Diamond           A→B→D(+)/A→C→D(-)",
    fn: scenarioDiamond,
    nodes: ["A", "B", "C", "D"],
  },
];

console.log("=== Relay propagation characterisation ===");
console.log(
  `SIGNAL_SPEED=${SIGNAL_SPEED}  EDGE_TRANSIT_TICKS=${EDGE_TRANSIT_TICKS}`,
);
console.log();

for (const scenario of scenarios) {
  console.log(`--- ${scenario.label} ---`);
  console.log(
    `${"MAX_HOPS".padEnd(10)} ${"peak-sig".padEnd(10)} final vals                      verdict`,
  );
  for (const hops of MAX_HOPS_CANDIDATES) {
    const result = scenario.fn(hops);
    const finalStr = scenario.nodes
      .map((id) => `${id}=${result.finalValues[id]?.toFixed(2)}`)
      .join(" ");
    const v = verdict(scenario.name, result, scenario.nodes);
    console.log(
      `hops=${String(hops).padEnd(6)} ${String(result.peakSignals).padEnd(10)} ${finalStr.padEnd(32)} ${v}`,
    );
  }
  console.log();
}

console.log(
  "Recommendation: choose lowest MAX_HOPS where all three verdicts pass.",
);
console.log(
  "Record choice and evidence in DR--20260401--engine--relay-propagation-model.",
);
