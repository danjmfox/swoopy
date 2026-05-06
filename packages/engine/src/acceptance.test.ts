/**
 * Acceptance scenarios for the engine's four core behaviors.
 * Each scenario tests a complete observable behavior via the public API only.
 *
 * Covers gaps in the existing unit suite:
 *   - post-arrival ceiling clamp (step-6 path, not just pre-clamp)
 *   - inject() is unclamped; step() must enforce constraint bounds
 *   - delayed edge full lifecycle: pending → release → arrive
 *   - modulator polarity reversal (switching +1 → -1 inverts suppression direction)
 *   - modulator with actual data (polarity -1) survives serialize/deserialize
 */
import { describe, it, expect } from "vitest";
import {
  makeNodeId,
  makeEdgeId,
  makeModulatorId,
  makeInitialSim,
  step,
  inject,
  computeEffectiveWeights,
  serialize,
  deserialize,
} from "./index.ts";
import type { Graph, Modulator } from "./types.ts";

// ── helpers ───────────────────────────────────────────────────────────────────

function node(id: string, initial: number, min = 0, max = 10) {
  return {
    id: makeNodeId(id),
    label: id,
    x: 0,
    y: 0,
    radius: 30,
    sizeTier: "m" as const,
    colourTier: "blue" as const,
    min,
    max,
    initial,
  };
}

function causal(
  id: string,
  from: string,
  to: string,
  polarity: 1 | -1 = 1,
  weight = 1,
  delay: "none" | "short" | "medium" | "long" = "none",
) {
  return {
    kind: "causal" as const,
    id: makeEdgeId(id),
    from: makeNodeId(from),
    to: makeNodeId(to),
    polarity,
    weight,
    delay,
    transferFn: "linear" as const,
  };
}

function ceiling(id: string, from: string, to: string) {
  return {
    kind: "constraint" as const,
    constraintKind: "ceiling" as const,
    id: makeEdgeId(id),
    from: makeNodeId(from),
    to: makeNodeId(to),
  };
}

function floor(id: string, from: string, to: string) {
  return {
    kind: "constraint" as const,
    constraintKind: "floor" as const,
    id: makeEdgeId(id),
    from: makeNodeId(from),
    to: makeNodeId(to),
  };
}

function mod(
  id: string,
  from: string,
  target: string,
  polarity: 1 | -1,
): Modulator {
  return {
    id: makeModulatorId(id),
    from: makeNodeId(from),
    target: makeEdgeId(target),
    polarity,
  };
}

function stepN(
  graph: Graph,
  sim: ReturnType<typeof makeInitialSim>,
  n: number,
) {
  let s = sim;
  for (let i = 0; i < n; i++) s = step(graph, s, 1 / 60);
  return s;
}

// ── Signal Propagation ────────────────────────────────────────────────────────

describe("signal propagation — post-arrival ceiling clamp (step-6 path)", () => {
  it("arriving signal that pushes a node above a ceiling is clamped back by the post-arrival clamp", () => {
    // Ceiling C→B caps B at C.value = 4. B starts at 3 (within ceiling).
    // inject A with strength=5 → emits signal of strength=5 on A→B.
    // When signal arrives: B = 3 + 5 = 8, above ceiling=4.
    // Step-6 post-clamp must bring B back to ≤ 4.
    // (Pre-clamp alone cannot catch this because B was within bounds when it fired.)
    const graph: Graph = {
      nodes: [node("ac-A", 5), node("ac-B", 3), node("ac-C", 4)],
      edges: [
        causal("ac-AB", "ac-A", "ac-B"),
        ceiling("ac-CB", "ac-C", "ac-B"),
      ],
      annotations: [],
      modulators: [],
    };
    const sim0 = inject(makeInitialSim(graph), graph, makeNodeId("ac-A"), 5);
    // ~200 ticks: signal transits A→B (≈92 ticks) with margin
    const sim = stepN(graph, sim0, 200);
    expect(sim.nodeValues.get(makeNodeId("ac-B"))).toBeLessThanOrEqual(4);
  });
});

describe("signal propagation — inject() is unclamped; step() enforces constraint bounds", () => {
  it("inject() leaves node above a ceiling constraint; the following step() pre-clamp corrects it", () => {
    // Architecture: inject() is explicitly unclamped — "clamped at next step()".
    // Ceiling A→B caps B at A.value = 5. inject B by +3 (B → 8).
    // inject() must NOT clamp (B = 8 after inject).
    // step() pre-clamp MUST bring B back to ≤ 5.
    const graph: Graph = {
      nodes: [node("uc-A", 5), node("uc-B", 5)],
      edges: [ceiling("uc-AB", "uc-A", "uc-B")],
      annotations: [],
      modulators: [],
    };
    const sim0 = inject(makeInitialSim(graph), graph, makeNodeId("uc-B"), 3);
    expect(sim0.nodeValues.get(makeNodeId("uc-B"))).toBe(8); // unclamped
    const sim1 = step(graph, sim0, 1 / 60);
    expect(sim1.nodeValues.get(makeNodeId("uc-B"))).toBeLessThanOrEqual(5);
  });

  it("inject() leaves node below a floor constraint; the following step() pre-clamp lifts it", () => {
    // Floor D→B pins B's minimum at 7. inject B by -4 (B → 1, below floor).
    // inject() must NOT clamp. step() must lift B to ≥ 7.
    const graph: Graph = {
      nodes: [node("fl-D", 7), node("fl-B", 5)],
      edges: [floor("fl-DB", "fl-D", "fl-B")],
      annotations: [],
      modulators: [],
    };
    const sim0 = inject(makeInitialSim(graph), graph, makeNodeId("fl-B"), -4);
    expect(sim0.nodeValues.get(makeNodeId("fl-B"))).toBe(1); // unclamped
    const sim1 = step(graph, sim0, 1 / 60);
    expect(sim1.nodeValues.get(makeNodeId("fl-B"))).toBeGreaterThanOrEqual(7);
  });
});

describe("signal propagation — delayed edge full lifecycle", () => {
  it("inject on a node with a short-delay edge produces a pending signal, not a travelling signal", () => {
    // Pending queue holds stagger-offset / delayed signals until their timer elapses.
    const graph: Graph = {
      nodes: [node("dl-A", 5), node("dl-B", 5)],
      edges: [causal("dl-AB", "dl-A", "dl-B", 1, 1, "short")],
      annotations: [],
      modulators: [],
    };
    const sim = inject(makeInitialSim(graph), graph, makeNodeId("dl-A"), 1);
    expect(sim.pending.length).toBeGreaterThan(0);
    expect(sim.signals.length).toBe(0);
  });

  it("pending signal releases into travelling after the delay elapses and eventually changes the destination value", () => {
    // DELAY_TICKS_SHORT = 30 ticks; signal transit ≈ 92 ticks. 200 ticks is ample.
    const graph: Graph = {
      nodes: [node("dlr-A", 5), node("dlr-B", 5)],
      edges: [causal("dlr-AB", "dlr-A", "dlr-B", 1, 1, "short")],
      annotations: [],
      modulators: [],
    };
    const sim0 = inject(makeInitialSim(graph), graph, makeNodeId("dlr-A"), 1);
    const sim = stepN(graph, sim0, 200);
    expect(sim.nodeValues.get(makeNodeId("dlr-B"))).toBeGreaterThan(5);
  });
});

// ── Modulator Scaling ─────────────────────────────────────────────────────────

describe("modulator scaling — polarity reversal", () => {
  it("polarity +1: source at min suppresses, source at max passes full weight", () => {
    const g: Graph = {
      nodes: [node("mp-src", 0), node("mp-tgt", 5)],
      edges: [causal("mp-e", "mp-src", "mp-tgt", 1, 3)],
      annotations: [],
      modulators: [mod("mp-m", "mp-src", "mp-e", 1)],
    };
    const atMin = computeEffectiveWeights(
      g,
      new Map([[makeNodeId("mp-src"), 0]]),
    );
    const atMax = computeEffectiveWeights(
      g,
      new Map([[makeNodeId("mp-src"), 10]]),
    );
    expect(atMin.get(makeEdgeId("mp-e"))).toBe(0);
    expect(atMax.get(makeEdgeId("mp-e"))).toBe(3);
  });

  it("polarity -1: source at max suppresses, source at min passes full weight (reversal)", () => {
    const g: Graph = {
      nodes: [node("mn-src", 0), node("mn-tgt", 5)],
      edges: [causal("mn-e", "mn-src", "mn-tgt", 1, 3)],
      annotations: [],
      modulators: [mod("mn-m", "mn-src", "mn-e", -1)],
    };
    const atMax = computeEffectiveWeights(
      g,
      new Map([[makeNodeId("mn-src"), 10]]),
    );
    const atMin = computeEffectiveWeights(
      g,
      new Map([[makeNodeId("mn-src"), 0]]),
    );
    expect(atMax.get(makeEdgeId("mn-e"))).toBe(0);
    expect(atMin.get(makeEdgeId("mn-e"))).toBe(3);
  });

  it("same source value at max: swapping polarity from +1 to -1 inverts edge weight from full to zero", () => {
    // Demonstrates that toggling polarity is a true inversion — the same source state
    // produces opposite outcomes for +1 vs -1 polarity.
    const baseNodes = [node("sw-src", 10), node("sw-tgt", 5)];
    const baseEdges = [causal("sw-e", "sw-src", "sw-tgt", 1, 2)];
    const withPos: Graph = {
      nodes: baseNodes,
      edges: baseEdges,
      annotations: [],
      modulators: [mod("sw-pos", "sw-src", "sw-e", 1)],
    };
    const withNeg: Graph = {
      nodes: baseNodes,
      edges: baseEdges,
      annotations: [],
      modulators: [mod("sw-neg", "sw-src", "sw-e", -1)],
    };
    const srcAtMax = new Map([[makeNodeId("sw-src"), 10]]);
    const posWeight = computeEffectiveWeights(withPos, srcAtMax).get(
      makeEdgeId("sw-e"),
    )!;
    const negWeight = computeEffectiveWeights(withNeg, srcAtMax).get(
      makeEdgeId("sw-e"),
    )!;
    expect(posWeight).toBe(2); // +1 polarity at max → full base weight
    expect(negWeight).toBe(0); // -1 polarity at max → suppressed
  });
});

// ── Serialization Round-trips ─────────────────────────────────────────────────

describe("serialization — modulator round-trips", () => {
  it("a graph with a modulator (polarity +1) survives serialize/deserialize intact", () => {
    const nA = makeNodeId("sr-a");
    const nB = makeNodeId("sr-b");
    const eAB = makeEdgeId("sr-ab");
    const graph: Graph = {
      nodes: [
        {
          id: nA,
          label: "A",
          x: 0,
          y: 0,
          radius: 30,
          sizeTier: "m",
          colourTier: "blue",
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nB,
          label: "B",
          x: 100,
          y: 0,
          radius: 30,
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
          id: eAB,
          from: nA,
          to: nB,
          polarity: 1,
          weight: 2,
          delay: "none",
          transferFn: "linear",
        },
      ],
      annotations: [],
      modulators: [
        { id: makeModulatorId("sr-m1"), from: nA, target: eAB, polarity: 1 },
      ],
    };
    const restored = deserialize(serialize(graph));
    expect(restored.modulators).toEqual(graph.modulators);
  });

  it("a modulator with polarity -1 preserves its polarity through a round-trip", () => {
    // The v4→v5 migration only tests modulators: [] — this verifies actual modulator data.
    const nA = makeNodeId("sn-a");
    const nB = makeNodeId("sn-b");
    const eAB = makeEdgeId("sn-ab");
    const graph: Graph = {
      nodes: [
        {
          id: nA,
          label: "A",
          x: 0,
          y: 0,
          radius: 30,
          sizeTier: "m",
          colourTier: "blue",
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nB,
          label: "B",
          x: 100,
          y: 0,
          radius: 30,
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
          id: eAB,
          from: nA,
          to: nB,
          polarity: 1,
          weight: 2,
          delay: "none",
          transferFn: "linear",
        },
      ],
      annotations: [],
      modulators: [
        { id: makeModulatorId("sn-m1"), from: nA, target: eAB, polarity: -1 },
      ],
    };
    const restored = deserialize(serialize(graph));
    expect(restored.modulators[0]?.polarity).toBe(-1);
  });

  it("multiple modulators targeting different edges all survive the round-trip", () => {
    const nA = makeNodeId("mm-a");
    const nB = makeNodeId("mm-b");
    const nC = makeNodeId("mm-c");
    const eAB = makeEdgeId("mm-ab");
    const eBC = makeEdgeId("mm-bc");
    const graph: Graph = {
      nodes: [
        {
          id: nA,
          label: "A",
          x: 0,
          y: 0,
          radius: 30,
          sizeTier: "m",
          colourTier: "blue",
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nB,
          label: "B",
          x: 100,
          y: 0,
          radius: 30,
          sizeTier: "m",
          colourTier: "blue",
          min: 0,
          max: 10,
          initial: 5,
        },
        {
          id: nC,
          label: "C",
          x: 200,
          y: 0,
          radius: 30,
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
          id: eAB,
          from: nA,
          to: nB,
          polarity: 1,
          weight: 2,
          delay: "none",
          transferFn: "linear",
        },
        {
          kind: "causal",
          id: eBC,
          from: nB,
          to: nC,
          polarity: -1,
          weight: 1,
          delay: "none",
          transferFn: "linear",
        },
      ],
      annotations: [],
      modulators: [
        { id: makeModulatorId("mm-m1"), from: nA, target: eAB, polarity: 1 },
        { id: makeModulatorId("mm-m2"), from: nB, target: eBC, polarity: -1 },
      ],
    };
    const restored = deserialize(serialize(graph));
    expect(restored.modulators).toHaveLength(2);
    expect(restored.modulators).toEqual(graph.modulators);
  });
});
