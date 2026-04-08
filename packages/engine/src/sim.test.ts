import { describe, it, expect } from "vitest";
import {
  step,
  makeInitialSim,
  inject,
  computeEffectiveWeights,
} from "./sim.ts";
import { makeNodeId, makeEdgeId, makeModulatorId } from "./ids.ts";
import { SIGNAL_SPEED, INJECT_STRENGTH } from "./constants.ts";
import type { Graph } from "./types.ts";

const nodeA = makeNodeId("nodeA");
const nodeB = makeNodeId("nodeB");
const edgeAB = makeEdgeId("edgeAB");

const graph: Graph = {
  nodes: [
    {
      id: nodeA,
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
      id: nodeB,
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
  annotations: [],
  modulators: [],
};

describe("step() displayPrevNodeValues — SI-12 trend display", () => {
  it("equals sim.nodeValues at step entry (beginning-of-step snapshot)", () => {
    const sim0 = makeInitialSim(graph);
    const sim1 = step(graph, sim0, 0.016);
    expect(sim1.displayPrevNodeValues.get(nodeA)).toBe(
      sim0.nodeValues.get(nodeA),
    );
    expect(sim1.displayPrevNodeValues.get(nodeB)).toBe(
      sim0.nodeValues.get(nodeB),
    );
  });

  it("after inject() then step(), displayPrevNodeValues reflects the injected value", () => {
    const sim0 = makeInitialSim(graph);
    const injected = inject(sim0, graph, nodeA, 2);
    const sim1 = step(graph, injected, 0.016);
    expect(sim1.displayPrevNodeValues.get(nodeA)).toBe(
      injected.nodeValues.get(nodeA),
    );
  });
});

describe("step() dt clamp — PRD §9 risk 5", () => {
  it("a spike dt of 500ms advances in-flight signal progress no more than SIGNAL_SPEED × 0.1", () => {
    // inject → normal step to get a signal in-flight at progress ≈ 0
    const sim0 = inject(makeInitialSim(graph), graph, nodeA, INJECT_STRENGTH);
    const sim1 = step(graph, sim0, 0.016); // normal 60fps frame; signal emitted at progress=0
    expect(sim1.signals.length).toBeGreaterThan(0);

    const startProgress = sim1.signals[0]!.progress; // should be 0 (newly emitted)

    // spike frame — without clamping, progress jumps by SIGNAL_SPEED * 0.5 = 0.325
    const sim2 = step(graph, sim1, 0.5);

    const maxAllowed = startProgress + SIGNAL_SPEED * 0.1;
    for (const signal of sim2.signals) {
      expect(signal.progress).toBeLessThanOrEqual(maxAllowed);
    }
  });
});

// ─── computeEffectiveWeights ────────────────────────────────────────────────

const mSrc = makeNodeId("mSrc");
const mTgt = makeNodeId("mTgt");
const mEdge = makeEdgeId("mEdge");
const modSrcNode = {
  id: mSrc,
  label: "Src",
  x: 0,
  y: 0,
  radius: 30,
  sizeTier: "m" as const,
  colourTier: "blue" as const,
  min: 0,
  max: 10,
  initial: 5,
};
const modTgtNode = {
  id: mTgt,
  label: "Tgt",
  x: 100,
  y: 0,
  radius: 30,
  sizeTier: "m" as const,
  colourTier: "blue" as const,
  min: 0,
  max: 10,
  initial: 5,
};
const modCausalEdge = {
  id: mEdge,
  kind: "causal" as const,
  from: mSrc,
  to: mTgt,
  polarity: 1 as const,
  weight: 3,
  delay: "none" as const,
  transferFn: "linear" as const,
};

describe("computeEffectiveWeights — no modulator", () => {
  it("returns base weight for an edge with no modulator", () => {
    const g: Graph = {
      nodes: [modSrcNode, modTgtNode],
      edges: [modCausalEdge],
      annotations: [],
      modulators: [],
    };
    const weights = computeEffectiveWeights(
      g,
      new Map([
        [mSrc, 5],
        [mTgt, 5],
      ]),
    );
    expect(weights.get(mEdge)).toBe(3);
  });
});

describe("computeEffectiveWeights — polarity +1", () => {
  it("source at midpoint → base weight unchanged (factor = 1)", () => {
    const g: Graph = {
      nodes: [modSrcNode, modTgtNode],
      edges: [modCausalEdge],
      annotations: [],
      modulators: [
        { id: makeModulatorId("m1"), from: mSrc, target: mEdge, polarity: 1 },
      ],
    };
    const weights = computeEffectiveWeights(g, new Map([[mSrc, 5]]));
    expect(weights.get(mEdge)).toBe(3);
  });

  it("source at max → 2× base weight, clamped to 5", () => {
    const g: Graph = {
      nodes: [modSrcNode, modTgtNode],
      edges: [modCausalEdge],
      annotations: [],
      modulators: [
        { id: makeModulatorId("m1"), from: mSrc, target: mEdge, polarity: 1 },
      ],
    };
    const weights = computeEffectiveWeights(g, new Map([[mSrc, 10]]));
    expect(weights.get(mEdge)).toBe(5); // 3 × 2 = 6 → clamped to 5
  });

  it("source at min → 0 (fully suppressed)", () => {
    const g: Graph = {
      nodes: [modSrcNode, modTgtNode],
      edges: [modCausalEdge],
      annotations: [],
      modulators: [
        { id: makeModulatorId("m1"), from: mSrc, target: mEdge, polarity: 1 },
      ],
    };
    const weights = computeEffectiveWeights(g, new Map([[mSrc, 0]]));
    expect(weights.get(mEdge)).toBe(0);
  });
});

describe("computeEffectiveWeights — polarity -1", () => {
  it("source at midpoint → base weight unchanged (factor = 1)", () => {
    const g: Graph = {
      nodes: [modSrcNode, modTgtNode],
      edges: [modCausalEdge],
      annotations: [],
      modulators: [
        { id: makeModulatorId("m1"), from: mSrc, target: mEdge, polarity: -1 },
      ],
    };
    const weights = computeEffectiveWeights(g, new Map([[mSrc, 5]]));
    expect(weights.get(mEdge)).toBe(3);
  });

  it("source at min → 2× base weight, clamped to 5", () => {
    const g: Graph = {
      nodes: [modSrcNode, modTgtNode],
      edges: [modCausalEdge],
      annotations: [],
      modulators: [
        { id: makeModulatorId("m1"), from: mSrc, target: mEdge, polarity: -1 },
      ],
    };
    const weights = computeEffectiveWeights(g, new Map([[mSrc, 0]]));
    expect(weights.get(mEdge)).toBe(5); // 3 × 2 = 6 → clamped to 5
  });

  it("source at max → 0 (fully suppressed)", () => {
    const g: Graph = {
      nodes: [modSrcNode, modTgtNode],
      edges: [modCausalEdge],
      annotations: [],
      modulators: [
        { id: makeModulatorId("m1"), from: mSrc, target: mEdge, polarity: -1 },
      ],
    };
    const weights = computeEffectiveWeights(g, new Map([[mSrc, 10]]));
    expect(weights.get(mEdge)).toBe(0);
  });
});

describe("computeEffectiveWeights — edge cases", () => {
  it("arbitrary node range: neutral at midpoint", () => {
    const wideNode = { ...modSrcNode, min: 2, max: 8 };
    const g: Graph = {
      nodes: [wideNode, modTgtNode],
      edges: [modCausalEdge],
      annotations: [],
      modulators: [
        { id: makeModulatorId("m1"), from: mSrc, target: mEdge, polarity: 1 },
      ],
    };
    // midpoint of [2,8] is 5 → factor = 1
    const weights = computeEffectiveWeights(g, new Map([[mSrc, 5]]));
    expect(weights.get(mEdge)).toBe(3);
  });

  it("degenerate range (min === max) → factor = 1, base weight unchanged", () => {
    const fixedNode = { ...modSrcNode, min: 5, max: 5 };
    const g: Graph = {
      nodes: [fixedNode, modTgtNode],
      edges: [modCausalEdge],
      annotations: [],
      modulators: [
        { id: makeModulatorId("m1"), from: mSrc, target: mEdge, polarity: 1 },
      ],
    };
    const weights = computeEffectiveWeights(g, new Map([[mSrc, 5]]));
    expect(weights.get(mEdge)).toBe(3);
  });
});

describe("step() — modulator suppresses relay (Task 5)", () => {
  it("source at min with polarity +1 → no signals emitted on modulated edge", () => {
    // mSrc (value=0) --[polarity+1]--> modulates mEdge
    // mSrc --mEdge--> mTgt  (weight=3)
    // With source at min, effective weight = 0 → no signals should be emitted
    const modG: Graph = {
      nodes: [modSrcNode, modTgtNode],
      edges: [modCausalEdge],
      annotations: [],
      modulators: [
        { id: makeModulatorId("m1"), from: mSrc, target: mEdge, polarity: 1 },
      ],
    };
    const sim0 = makeInitialSim(modG);
    // Set source node to 0 (min) by overriding nodeValues
    const sim0AtMin = {
      ...sim0,
      nodeValues: new Map([
        [mSrc, 0],
        [mTgt, 5],
      ]),
    };
    const sim1 = inject(sim0AtMin, modG, mSrc, INJECT_STRENGTH);
    const sim2 = step(modG, sim1, 1 / 60);
    // Effective weight is 0 → emitRelayFragments should emit 0 signals on mEdge
    const onEdge = sim2.signals.filter((s) => s.edgeId === mEdge);
    expect(onEdge).toHaveLength(0);
  });
});
