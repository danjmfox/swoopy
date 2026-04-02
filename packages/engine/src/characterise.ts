/**
 * Characterisation script — PRD §7.7
 * Run with: node --experimental-strip-types packages/engine/src/characterise.ts
 *
 * Builds fully-connected reinforcing graphs at realistic sizes and weights, injects
 * maximum strength, runs 600 ticks. MAX_SIGNALS = peak count across all scenarios
 * (staggered signals occupy both sim.signals and sim.pending — both are counted).
 *
 * Scenarios:
 *   - 6-node  weight=1  (baseline — mirrors original characterisation)
 *   - 12-node weight=1  (larger graph, single signals)
 *   - 12-node weight=3  (larger graph, staggered density — realistic worst case)
 */
import {
  makeNodeId,
  makeEdgeId,
  makeInitialSim,
  inject,
  step,
  INJECT_STRENGTH,
} from "./index.ts";
import type { Graph, CausalEdge, Node } from "./types.ts";

function characterise(
  nodeCount: number,
  weight: number,
): { travelPeak: number; totalPeak: number } {
  const nodeIds = Array.from({ length: nodeCount }, (_, i) =>
    makeNodeId(`n${i}`),
  );
  const nodes: Node[] = nodeIds.map((id, i) => ({
    id,
    label: `n${i}`,
    x: 0,
    y: 0,
    radius: 40,
    sizeTier: "m" as const,
    colourTier: "blue" as const,
    min: 0,
    max: 10,
    initial: 5,
  }));
  const edges: CausalEdge[] = [];
  for (let i = 0; i < nodeCount; i++) {
    for (let j = 0; j < nodeCount; j++) {
      if (i === j) continue;
      edges.push({
        kind: "causal",
        id: makeEdgeId(`e${i}-${j}`),
        from: nodeIds[i],
        to: nodeIds[j],
        polarity: 1,
        weight,
        delay: "none",
        transferFn: "linear",
      });
    }
  }
  const graph: Graph = { nodes, edges };
  let sim = makeInitialSim(graph);
  for (const id of nodeIds) sim = inject(sim, graph, id, INJECT_STRENGTH * 5);

  let travelPeak = 0;
  let totalPeak = 0;
  for (let i = 0; i < 600; i++) {
    sim = step(graph, sim, 1 / 60);
    // travelling is capped by MAX_SIGNALS; pending holds staggered signals awaiting dispatch
    travelPeak = Math.max(travelPeak, sim.signals.length);
    totalPeak = Math.max(totalPeak, sim.signals.length + sim.pending.length);
  }
  return { travelPeak, totalPeak };
}

const scenarios = [
  { nodes: 6, weight: 1, label: "6-node  w=1 (baseline)" },
  { nodes: 12, weight: 1, label: "12-node w=1" },
  { nodes: 12, weight: 3, label: "12-node w=3 (worst case)" },
];

console.log("Scenario                      travel-peak  total-peak");
for (const s of scenarios) {
  const { travelPeak, totalPeak } = characterise(s.nodes, s.weight);
  console.log(
    `${s.label.padEnd(30)}  ${String(travelPeak).padStart(11)}  ${String(totalPeak).padStart(10)}`,
  );
}
console.log(
  "\nNote: travel-peak drives MAX_SIGNALS; total-peak includes stagger-pending buffer.",
);
