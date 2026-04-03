import { describe, it, expect } from "vitest";
import {
  makeNodeId,
  makeEdgeId,
  makeInitialSim,
  inject,
  step,
  INJECT_STRENGTH,
} from "./index.ts";
import type { Graph, Node, CausalEdge } from "./types.ts";

const popId = makeNodeId("population");
const birthsId = makeNodeId("births");
const deathsId = makeNodeId("deaths");

const population: Node = {
  id: popId,
  label: "Population",
  x: 0,
  y: 0,
  radius: 40,
  sizeTier: "m",
  colourTier: "blue",
  min: 0,
  max: 10,
  initial: 5,
};
const births: Node = {
  id: birthsId,
  label: "Births",
  x: 100,
  y: -80,
  radius: 40,
  sizeTier: "m",
  colourTier: "blue",
  min: 0,
  max: 10,
  initial: 0,
};
const deaths: Node = {
  id: deathsId,
  label: "Deaths",
  x: 100,
  y: 80,
  radius: 40,
  sizeTier: "m",
  colourTier: "blue",
  min: 0,
  max: 10,
  initial: 0,
};

const edge = (
  id: string,
  from: typeof popId,
  to: typeof popId,
  polarity: 1 | -1,
): CausalEdge => ({
  kind: "causal",
  id: makeEdgeId(id),
  from,
  to,
  polarity,
  weight: 1.0,
  delay: "none",
  transferFn: "linear",
});

export const seedGraph: Graph = {
  nodes: [population, births, deaths],
  edges: [
    edge("pop-births", popId, birthsId, 1), // reinforcing
    edge("births-pop", birthsId, popId, 1), // reinforcing
    edge("pop-deaths", popId, deathsId, 1),
    edge("deaths-pop", deathsId, popId, -1), // balancing
  ],
  annotations: [],
};

// GE-11, GE-12
describe("makeInitialSim", () => {
  it("sets each node value to its graph.initial field", () => {
    const sim = makeInitialSim(seedGraph);
    expect(sim.nodeValues.get(popId)).toBe(5);
    expect(sim.nodeValues.get(birthsId)).toBe(0);
    expect(sim.nodeValues.get(deathsId)).toBe(0);
  });
});

// SI-02, SI-03
describe("inject", () => {
  it("increments the target node value by strength", () => {
    const sim = makeInitialSim(seedGraph);
    const next = inject(sim, seedGraph, popId, INJECT_STRENGTH);
    expect(next.nodeValues.get(popId)).toBe(5 + INJECT_STRENGTH);
  });
});

// SI-04
describe("step", () => {
  it("emits signals on outgoing causal edges when |delta| >= EMIT_THRESHOLD", () => {
    const sim0 = makeInitialSim(seedGraph);
    const sim1 = inject(sim0, seedGraph, popId, INJECT_STRENGTH); // delta = 1.0, well above 0.06
    const sim2 = step(seedGraph, sim1, 1 / 60);
    expect(sim2.signals.length).toBeGreaterThan(0);
  });

  it("inverts signal polarity on a balancing (−) edge (SI-05)", () => {
    // Inject into Deaths; its signal to Population has polarity -1
    // Population should fall below its initial value (5)
    const sim0 = makeInitialSim(seedGraph);
    const sim1 = inject(sim0, seedGraph, deathsId, INJECT_STRENGTH);
    let sim = sim1;
    for (let i = 0; i < 120; i++) sim = step(seedGraph, sim, 1 / 60);
    expect(sim.nodeValues.get(popId)).toBeLessThan(5);
  });

  it("node stays elevated after injection with no balancing loop (SI-06 — signal-driven model)", () => {
    // An isolated node has no incoming signals — only intrinsic decay would reduce it.
    // In the signal-driven model there is no decay: the node stays wherever injection left it.
    const isolatedGraph: Graph = { nodes: [births], edges: [] };
    const sim0 = makeInitialSim(isolatedGraph);
    const sim1 = inject(sim0, isolatedGraph, birthsId, INJECT_STRENGTH);
    let sim = sim1;
    for (let i = 0; i < 600; i++) sim = step(isolatedGraph, sim, 1 / 60);
    expect(sim.nodeValues.get(birthsId)).toBeGreaterThanOrEqual(
      INJECT_STRENGTH * 0.9,
    );
  });

  it("positive injection: balancing loop prevents Population diverging to max (Appendix A)", () => {
    const sim0 = makeInitialSim(seedGraph);
    const sim1 = inject(sim0, seedGraph, popId, INJECT_STRENGTH);
    let sim = sim1;
    for (let i = 0; i < 600; i++) sim = step(seedGraph, sim, 1 / 60);
    expect(sim.nodeValues.get(popId)).toBeLessThan(10);
  });

  it("positive injection: reinforcing loop raises Population above initial (Appendix A)", () => {
    const sim0 = makeInitialSim(seedGraph);
    const sim1 = inject(sim0, seedGraph, popId, INJECT_STRENGTH);
    let sim = sim1;
    for (let i = 0; i < 300; i++) sim = step(seedGraph, sim, 1 / 60);
    expect(sim.nodeValues.get(popId)).toBeGreaterThan(5.1);
  });

  it("negative injection: reinforcing loop amplifies the drop below initial (Appendix A)", () => {
    const sim0 = makeInitialSim(seedGraph);
    const sim1 = inject(sim0, seedGraph, popId, -INJECT_STRENGTH);
    let sim = sim1;
    for (let i = 0; i < 300; i++) sim = step(seedGraph, sim, 1 / 60);
    expect(sim.nodeValues.get(popId)).toBeLessThan(4.9);
  });

  it("negative injection: system stabilises above min — balancing limits collapse (Appendix A)", () => {
    const sim0 = makeInitialSim(seedGraph);
    const sim1 = inject(sim0, seedGraph, popId, -INJECT_STRENGTH);
    let sim = sim1;
    for (let i = 0; i < 600; i++) sim = step(seedGraph, sim, 1 / 60);
    expect(sim.nodeValues.get(popId)).toBeGreaterThan(0);
  });

  it("applies arrived signals to destination node values", () => {
    // Run long enough for Population→Births signal to arrive (progress reaches 1)
    // At SIGNAL_SPEED=0.65, takes 1/0.65 ≈ 1.54s = ~92 frames at 60fps
    const sim0 = makeInitialSim(seedGraph);
    const sim1 = inject(sim0, seedGraph, popId, INJECT_STRENGTH);
    let sim = sim1;
    for (let i = 0; i < 120; i++) sim = step(seedGraph, sim, 1 / 60);
    // Births should have risen above its initial value (0)
    expect(sim.nodeValues.get(birthsId)).toBeGreaterThan(0);
  });
});

// GE-13: edge weight scales signal strength
describe("GE-13 edge weight", () => {
  it("weight 0.5 halves the signal reaching the destination vs weight 1.0", () => {
    // Two identical graphs except one has weight=0.5 on pop→births
    const makeGraph = (weight: number) => ({
      ...seedGraph,
      edges: seedGraph.edges.map((e) => {
        if (e.kind === "causal" && e.from === popId && e.to === birthsId) {
          return { ...e, weight };
        }
        return e;
      }),
    });
    const run = (g: typeof seedGraph) => {
      let sim = makeInitialSim(g);
      sim = inject(sim, g, popId, INJECT_STRENGTH);
      for (let i = 0; i < 120; i++) sim = step(g, sim, 1 / 60);
      return sim.nodeValues.get(birthsId) ?? 0;
    };
    const full = run(makeGraph(1.0));
    const half = run(makeGraph(0.5));
    expect(half).toBeLessThan(full);
  });

  it("weight 0.0 prevents signal reaching the destination", () => {
    const noWeightGraph = {
      ...seedGraph,
      edges: seedGraph.edges.map((e) => {
        if (e.kind === "causal" && e.from === popId && e.to === birthsId) {
          return { ...e, weight: 0 };
        }
        return e;
      }),
    };
    let sim = makeInitialSim(noWeightGraph);
    sim = inject(sim, noWeightGraph, popId, INJECT_STRENGTH);
    for (let i = 0; i < 120; i++) sim = step(noWeightGraph, sim, 1 / 60);
    // Births should stay at 0 — no signal arrives, no decay
    expect(sim.nodeValues.get(birthsId)).toBeLessThan(0.1);
  });
});

// GE-SD-01, GE-SD-02: staggered-density model (DR--20260330--engine--staggered-density-signals)
describe("GE-SD staggered-density signals", () => {
  it.skip("GE-SD-01: weight=3 balancing loop — node does not crash to floor after 300 ticks — superseded by relay model (amplitude semantics; weight=3 does saturate)", () => {
    const aId = makeNodeId("A");
    const bId = makeNodeId("B");
    const graph: Graph = {
      nodes: [
        {
          id: aId,
          label: "A",
          x: 0,
          y: 0,
          radius: 40,
          sizeTier: "m",
          colourTier: "blue",
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: bId,
          label: "B",
          x: 100,
          y: 0,
          radius: 40,
          sizeTier: "m",
          colourTier: "blue",
          min: 0,
          max: 10,
          initial: 5,
        },
      ],
      edges: [
        {
          kind: "causal",
          id: makeEdgeId("a-b"),
          from: aId,
          to: bId,
          polarity: 1,
          weight: 3,
          delay: "none",
          transferFn: "linear",
        },
        {
          kind: "causal",
          id: makeEdgeId("b-a"),
          from: bId,
          to: aId,
          polarity: -1,
          weight: 3,
          delay: "none",
          transferFn: "linear",
        },
      ],
    };
    let sim = makeInitialSim(graph);
    sim = inject(sim, graph, aId, INJECT_STRENGTH);
    for (let i = 0; i < 300; i++) sim = step(graph, sim, 1 / 60);
    expect(sim.nodeValues.get(aId)).toBeGreaterThan(0);
  });

  it.skip("GE-SD-02: weight=5 edge emits 5 signals (1 travelling + 4 staggered-pending) after injection — superseded by relay model (DR--20260401)", () => {
    const aId = makeNodeId("A");
    const bId = makeNodeId("B");
    const graph: Graph = {
      nodes: [
        {
          id: aId,
          label: "A",
          x: 0,
          y: 0,
          radius: 40,
          sizeTier: "m",
          colourTier: "blue",
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: bId,
          label: "B",
          x: 100,
          y: 0,
          radius: 40,
          sizeTier: "m",
          colourTier: "blue",
          min: 0,
          max: 10,
          initial: 5,
        },
      ],
      edges: [
        {
          kind: "causal",
          id: makeEdgeId("a-b"),
          from: aId,
          to: bId,
          polarity: 1,
          weight: 5,
          delay: "none",
          transferFn: "linear",
        },
      ],
    };
    let sim = makeInitialSim(graph);
    sim = inject(sim, graph, aId, INJECT_STRENGTH);
    sim = step(graph, sim, 1 / 60);
    expect(sim.signals.length + sim.pending.length).toBe(5);
  });

  it.skip("GE-SD-03: weight=5 delayed edge emits 5 signals (all pending) after injection — superseded by relay model (DR--20260401)", () => {
    const aId = makeNodeId("A");
    const bId = makeNodeId("B");
    const graph: Graph = {
      nodes: [
        {
          id: aId,
          label: "A",
          x: 0,
          y: 0,
          radius: 40,
          sizeTier: "m",
          colourTier: "blue",
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: bId,
          label: "B",
          x: 100,
          y: 0,
          radius: 40,
          sizeTier: "m",
          colourTier: "blue",
          min: 0,
          max: 10,
          initial: 5,
        },
      ],
      edges: [
        {
          kind: "causal",
          id: makeEdgeId("a-b"),
          from: aId,
          to: bId,
          polarity: -1,
          weight: 5,
          delay: "short",
          transferFn: "linear",
        },
      ],
    };
    let sim = makeInitialSim(graph);
    sim = inject(sim, graph, aId, INJECT_STRENGTH);
    sim = step(graph, sim, 1 / 60);
    expect(sim.signals.length + sim.pending.length).toBe(5);
  });
});
