/**
 * Relay propagation model — test suite
 * DR--20260401--engine--relay-propagation-model
 *
 * Tests are ordered to match the task plan: type → constants → inject → step → integration.
 * Each describe block is added one test at a time (red → green rhythm).
 */
import { describe, it, expect } from "vitest";
import { makeNodeId, makeEdgeId } from "./ids.ts";
import type { Signal, Graph } from "./types.ts";
import * as constants from "./constants.ts";
import { makeInitialSim, inject, step } from "./sim.ts";

const nodeA = makeNodeId("A");
const nodeB = makeNodeId("B");
const edgeAB = makeEdgeId("AB");

const twoNodeGraph: Graph = {
  nodes: [
    {
      id: nodeA,
      label: "A",
      x: 0,
      y: 0,
      radius: 40,
      min: 0,
      max: 10,
      initial: 5,
    },
    {
      id: nodeB,
      label: "B",
      x: 100,
      y: 0,
      radius: 40,
      min: 0,
      max: 10,
      initial: 5,
    },
  ],
  edges: [
    {
      id: edgeAB,
      kind: "causal",
      from: nodeA,
      to: nodeB,
      polarity: 1,
      weight: 1,
      delay: "none",
      transferFn: "linear",
    },
  ],
};

// ---------------------------------------------------------------------------
// Task 4: Signal type has hopsRemaining
// ---------------------------------------------------------------------------

describe("Signal type — hopsRemaining field", () => {
  it("Signal accepts hopsRemaining: number", () => {
    // Type-level assertion: fails TS typecheck until Signal.hopsRemaining is added.
    // At runtime (strip-types) the annotation is erased — we verify the value survives.
    const s: Signal = {
      id: "s1",
      edgeId: makeEdgeId("e1"),
      progress: 0,
      strength: 1,
      hopsRemaining: 8,
    };
    expect(s.hopsRemaining).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// Task 6: MAX_HOPS constant exists; EMIT_THRESHOLD is gone
// ---------------------------------------------------------------------------

describe("constants — relay model", () => {
  it("MAX_HOPS is a positive integer", () => {
    expect(constants.MAX_HOPS).toBeGreaterThan(0);
    expect(Number.isInteger(constants.MAX_HOPS)).toBe(true);
  });

  it("EMIT_THRESHOLD no longer exists", () => {
    expect(
      (constants as Record<string, unknown>).EMIT_THRESHOLD,
    ).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Task 8: inject() emits signals on outgoing edges
// ---------------------------------------------------------------------------

describe("inject() — relay emit", () => {
  it("inject on a node with outgoing edge produces signals in the sim", () => {
    // In the relay model, inject() both changes node value AND emits signals immediately.
    // In the v1 model, inject() only changes node value; signals appear after the next step().
    // This test expects signals to be present on the sim returned by inject() itself.
    const sim0 = makeInitialSim(twoNodeGraph);
    const sim1 = inject(sim0, twoNodeGraph, nodeA, 1);
    expect(sim1.signals.length).toBeGreaterThan(0);
  });

  it("inject signal carries hopsRemaining = MAX_HOPS", () => {
    const sim1 = inject(makeInitialSim(twoNodeGraph), twoNodeGraph, nodeA, 1);
    const signal = sim1.signals[0]
    expect(signal?.hopsRemaining).toBe(constants.MAX_HOPS);
  });
});

// ---------------------------------------------------------------------------
// Tasks 10–12: step() arrival — value change + relay fan-out + hop termination
// ---------------------------------------------------------------------------

describe("step() — signal arrival", () => {
  it("signal arriving at B changes B.value by signal.strength × polarity", () => {
    // Inject A → signal travels A→B → B.value should increase by signal.strength
    const sim0 = inject(makeInitialSim(twoNodeGraph), twoNodeGraph, nodeA, 1);
    const initialB = sim0.nodeValues.get(nodeB) ?? 0;
    // Run enough steps for signal to arrive (transit = ~92 ticks at 1/60 dt)
    let sim = sim0;
    for (let i = 0; i < 120; i++) sim = step(twoNodeGraph, sim, 1 / 60);
    expect(sim.nodeValues.get(nodeB)).toBeGreaterThan(initialB);
  });

  it("signal arriving at B (hopsRemaining > 0) triggers relay signals on B outgoing edges", () => {
    // Build A→B→C chain; inject A; after B receives, C should also receive
    const nodeC = makeNodeId("C");
    const edgeBC = makeEdgeId("BC");
    const chainGraph: Graph = {
      nodes: [
        {
          id: nodeA,
          label: "A",
          x: 0,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nodeB,
          label: "B",
          x: 100,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nodeC,
          label: "C",
          x: 200,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
      ],
      edges: [
        {
          id: edgeAB,
          kind: "causal",
          from: nodeA,
          to: nodeB,
          polarity: 1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
        {
          id: edgeBC,
          kind: "causal",
          from: nodeB,
          to: nodeC,
          polarity: 1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
      ],
    };
    const initialC = 5;
    let sim = inject(makeInitialSim(chainGraph), chainGraph, nodeA, 1);
    // Run enough ticks for signal to reach C (2 edge transits ≈ 185 ticks)
    for (let i = 0; i < 250; i++) sim = step(chainGraph, sim, 1 / 60);
    expect(sim.nodeValues.get(nodeC)).toBeGreaterThan(initialC);
  });

  it("signal arriving at B with hopsRemaining=0 does NOT relay to C", () => {
    // Inject with strength=1, check that after B receives a hop=0 signal,
    // no further signals appear for C on a A→B→C chain
    const nodeC = makeNodeId("C2");
    const edgeBC = makeEdgeId("BC2");
    const chainGraph: Graph = {
      nodes: [
        {
          id: nodeA,
          label: "A",
          x: 0,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nodeB,
          label: "B",
          x: 100,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nodeC,
          label: "C",
          x: 200,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
      ],
      edges: [
        {
          id: edgeAB,
          kind: "causal",
          from: nodeA,
          to: nodeB,
          polarity: 1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
        {
          id: edgeBC,
          kind: "causal",
          from: nodeB,
          to: nodeC,
          polarity: 1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
      ],
    };
    // Manually place a signal on A→B with hopsRemaining=0
    const sim0 = makeInitialSim(chainGraph);
    const simWithSignal = {
      ...sim0,
      signals: [
        {
          id: "s-zero",
          edgeId: edgeAB,
          progress: 0.99, // about to arrive
          strength: 1,
          hopsRemaining: 0,
        },
      ],
    };
    const initialC = sim0.nodeValues.get(nodeC) ?? 5;
    let sim = step(chainGraph, simWithSignal, 1 / 60);
    // B should have received the signal (value change)
    expect(sim.nodeValues.get(nodeB)).toBeGreaterThan(5);
    // After enough ticks, C should NOT have changed (no relay)
    for (let i = 0; i < 200; i++) sim = step(chainGraph, sim, 1 / 60);
    expect(sim.nodeValues.get(nodeC)).toBe(initialC);
  });
});

// ---------------------------------------------------------------------------
// Tasks 14–16: weight = fragment count (amplitude model)
// ---------------------------------------------------------------------------

describe("weight — amplitude fragments", () => {
  it("relay on edge weight=3 emits 3 fragments immediately into signals", () => {
    // inject A on a graph where A→B has weight=3
    // inject() should emit 3 fragments for that edge
    const heavyGraph: Graph = {
      nodes: [
        {
          id: nodeA,
          label: "A",
          x: 0,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nodeB,
          label: "B",
          x: 100,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
      ],
      edges: [
        {
          id: edgeAB,
          kind: "causal",
          from: nodeA,
          to: nodeB,
          polarity: 1,
          weight: 3,
          delay: "none",
          transferFn: "linear",
        },
      ],
    };
    const sim1 = inject(makeInitialSim(heavyGraph), heavyGraph, nodeA, 1);
    expect(sim1.signals.length).toBe(3);
  });

  it("each fragment on weight=3 edge carries full signal.strength (not divided)", () => {
    const heavyGraph: Graph = {
      nodes: [
        {
          id: nodeA,
          label: "A",
          x: 0,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nodeB,
          label: "B",
          x: 100,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
      ],
      edges: [
        {
          id: edgeAB,
          kind: "causal",
          from: nodeA,
          to: nodeB,
          polarity: 1,
          weight: 3,
          delay: "none",
          transferFn: "linear",
        },
      ],
    };
    const sim1 = inject(makeInitialSim(heavyGraph), heavyGraph, nodeA, 1);
    for (const s of sim1.signals) {
      expect(s.strength).toBe(1);
    }
  });

  it("weight=3 fragments are staggered (progress values are not all zero)", () => {
    const heavyGraph: Graph = {
      nodes: [
        {
          id: nodeA,
          label: "A",
          x: 0,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nodeB,
          label: "B",
          x: 100,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
      ],
      edges: [
        {
          id: edgeAB,
          kind: "causal",
          from: nodeA,
          to: nodeB,
          polarity: 1,
          weight: 3,
          delay: "none",
          transferFn: "linear",
        },
      ],
    };
    const sim1 = inject(makeInitialSim(heavyGraph), heavyGraph, nodeA, 1);
    const progressValues = sim1.signals.map((s) => s.progress);
    const uniqueProgress = new Set(progressValues);
    expect(uniqueProgress.size).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// Tasks 17–18: relay fragment carries hopsRemaining = parent − 1
// ---------------------------------------------------------------------------

describe("signal aging — hopsRemaining", () => {
  it("relay fragment has hopsRemaining = arrived signal hopsRemaining − 1", () => {
    // Place a signal on A→B with hopsRemaining=3; when it arrives, B should emit
    // relay fragments with hopsRemaining=2
    const nodeC = makeNodeId("C3");
    const edgeBC = makeEdgeId("BC3");
    const chainGraph: Graph = {
      nodes: [
        {
          id: nodeA,
          label: "A",
          x: 0,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nodeB,
          label: "B",
          x: 100,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nodeC,
          label: "C",
          x: 200,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
      ],
      edges: [
        {
          id: edgeAB,
          kind: "causal",
          from: nodeA,
          to: nodeB,
          polarity: 1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
        {
          id: edgeBC,
          kind: "causal",
          from: nodeB,
          to: nodeC,
          polarity: 1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
      ],
    };
    const sim0 = makeInitialSim(chainGraph);
    const simWithSignal = {
      ...sim0,
      signals: [
        {
          id: "s-3hops",
          edgeId: edgeAB,
          progress: 0.99,
          strength: 1,
          hopsRemaining: 3,
        },
      ],
    };
    // One step: signal arrives at B, relay emitted on B→C
    const sim1 = step(chainGraph, simWithSignal, 1 / 60);
    // A new signal should have been emitted on B→C
    expect(sim1.signals.length).toBeGreaterThan(0);
    const relaySignal = sim1.signals.find((s) => s.edgeId === edgeBC);
    expect(relaySignal).toBeDefined();
    expect(relaySignal!.hopsRemaining).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Tasks 19–20: prevNodeValues removed from SimState
// ---------------------------------------------------------------------------

describe("SimState — prevNodeValues removed", () => {
  it("SimState does not have a prevNodeValues property", () => {
    const sim = makeInitialSim(twoNodeGraph);
    expect((sim as unknown as Record<string, unknown>).prevNodeValues).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Tasks 21–24: integration scenarios
// ---------------------------------------------------------------------------

describe("integration — reinforcing loop", () => {
  it("single inject on A in A→B→A loop saturates both nodes to max after enough ticks", () => {
    const nodeLoopA = makeNodeId("LoopA");
    const nodeLoopB = makeNodeId("LoopB");
    const graph: Graph = {
      nodes: [
        {
          id: nodeLoopA,
          label: "A",
          x: 0,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nodeLoopB,
          label: "B",
          x: 100,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
      ],
      edges: [
        {
          id: makeEdgeId("la-lb"),
          kind: "causal",
          from: nodeLoopA,
          to: nodeLoopB,
          polarity: 1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
        {
          id: makeEdgeId("lb-la"),
          kind: "causal",
          from: nodeLoopB,
          to: nodeLoopA,
          polarity: 1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
      ],
    };
    let sim = inject(makeInitialSim(graph), graph, nodeLoopA, 1);
    // MAX_HOPS=8 × EDGE_TRANSIT_TICKS=92 ≈ 736 ticks to propagate full chain + buffer
    for (let i = 0; i < 900; i++) sim = step(graph, sim, 1 / 60);
    expect(sim.nodeValues.get(nodeLoopA)).toBe(10);
    expect(sim.nodeValues.get(nodeLoopB)).toBe(10);
  });
});

describe("integration — balancing loop", () => {
  it("single inject on A in A→B→A (+/-) loop corrects without runaway", () => {
    const nodeBalA = makeNodeId("BalA");
    const nodeBalB = makeNodeId("BalB");
    const graph: Graph = {
      nodes: [
        {
          id: nodeBalA,
          label: "A",
          x: 0,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nodeBalB,
          label: "B",
          x: 100,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
      ],
      edges: [
        {
          id: makeEdgeId("ba-bb"),
          kind: "causal",
          from: nodeBalA,
          to: nodeBalB,
          polarity: 1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
        {
          id: makeEdgeId("bb-ba"),
          kind: "causal",
          from: nodeBalB,
          to: nodeBalA,
          polarity: -1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
      ],
    };
    let sim = inject(makeInitialSim(graph), graph, nodeBalA, 1);
    for (let i = 0; i < 900; i++) sim = step(graph, sim, 1 / 60);
    // Balancing loop: nodes should NOT both saturate (distinguishes from reinforcing loop).
    // Characterisation showed hops=8 settles at A≈2, B≈10 — the correction pushes A down.
    const aFinal = sim.nodeValues.get(nodeBalA) ?? 0;
    const bFinal = sim.nodeValues.get(nodeBalB) ?? 0;
    expect(aFinal === 10 && bFinal === 10).toBe(false);
  });
});

describe("integration — diamond graph", () => {
  it("A→B→D(+), A→C→D(-): D receives signals from BOTH paths (B and C both move)", () => {
    const nodeDA = makeNodeId("DiamA");
    const nodeDB = makeNodeId("DiamB");
    const nodeDC = makeNodeId("DiamC");
    const nodeDD = makeNodeId("DiamD");
    const graph: Graph = {
      nodes: [
        {
          id: nodeDA,
          label: "A",
          x: 0,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nodeDB,
          label: "B",
          x: 100,
          y: 0,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nodeDC,
          label: "C",
          x: 100,
          y: 100,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nodeDD,
          label: "D",
          x: 200,
          y: 50,
          radius: 40,
          min: 0,
          max: 10,
          initial: 5,
        },
      ],
      edges: [
        {
          id: makeEdgeId("da-db"),
          kind: "causal",
          from: nodeDA,
          to: nodeDB,
          polarity: 1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
        {
          id: makeEdgeId("da-dc"),
          kind: "causal",
          from: nodeDA,
          to: nodeDC,
          polarity: 1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
        {
          id: makeEdgeId("db-dd"),
          kind: "causal",
          from: nodeDB,
          to: nodeDD,
          polarity: 1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
        {
          id: makeEdgeId("dc-dd"),
          kind: "causal",
          from: nodeDC,
          to: nodeDD,
          polarity: -1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
      ],
    };
    let sim = inject(makeInitialSim(graph), graph, nodeDA, 1);
    for (let i = 0; i < 400; i++) sim = step(graph, sim, 1 / 60);
    // Both B and C should have moved (both paths propagated)
    expect(sim.nodeValues.get(nodeDB)).toBeGreaterThan(5);
    expect(sim.nodeValues.get(nodeDC)).toBeGreaterThan(5);
    // D: +1 via B and -1 via C cancel out → should remain near 5
    expect(sim.nodeValues.get(nodeDD)).toBeCloseTo(5, 0);
  });
});
