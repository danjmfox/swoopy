import { describe, it, expect } from "vitest";
import {
  makeNodeId,
  makeEdgeId,
  makeInitialSim,
  inject,
  step,
  INJECT_STRENGTH,
  DELAY_TICKS_SHORT,
  DELAY_TICKS_MEDIUM,
  DELAY_TICKS_LONG,
} from "./index.ts";
import type { Graph, Node, CausalEdge } from "./types.ts";

const node = (id: string, initial = 0, min = 0, max = 10): Node => ({
  id: makeNodeId(id),
  label: id,
  x: 0,
  y: 0,
  radius: 40,
  sizeTier: "m",
  colourTier: "blue",
  min,
  max,
  initial,
});

const causal = (
  id: string,
  from: string,
  to: string,
  delay: CausalEdge["delay"] = "none",
): CausalEdge => ({
  kind: "causal",
  id: makeEdgeId(id),
  from: makeNodeId(from),
  to: makeNodeId(to),
  polarity: 1,
  weight: 1.0,
  delay,
  transferFn: "linear",
});

// SI-16: delay tick counts are named constants, not magic numbers
describe("SI-16 DELAY_TICKS_* are named constants", () => {
  it("short < medium < long, all positive integers", () => {
    expect(Number.isInteger(DELAY_TICKS_SHORT)).toBe(true);
    expect(Number.isInteger(DELAY_TICKS_MEDIUM)).toBe(true);
    expect(Number.isInteger(DELAY_TICKS_LONG)).toBe(true);
    expect(DELAY_TICKS_SHORT).toBeGreaterThan(0);
    expect(DELAY_TICKS_MEDIUM).toBeGreaterThan(DELAY_TICKS_SHORT);
    expect(DELAY_TICKS_LONG).toBeGreaterThan(DELAY_TICKS_MEDIUM);
  });
});

// SI-14: delayed edge holds signals in pending queue
describe("SI-14 delayed edge holds signals in pending queue", () => {
  it("puts signal in pending (not travelling) immediately after emission", () => {
    const graph: Graph = {
      nodes: [node("A"), node("B")],
      edges: [causal("A-B", "A", "B", "short")],
      annotations: [],
      modulators: [],
    };
    const sim0 = makeInitialSim(graph);
    const sim1 = inject(sim0, graph, makeNodeId("A"), INJECT_STRENGTH);
    const sim2 = step(graph, sim1, 1 / 60);
    // Signal should be pending — not yet travelling
    expect(sim2.pending.length).toBeGreaterThan(0);
    expect(sim2.signals.length).toBe(0);
  });

  it("releases the signal into travelling after DELAY_TICKS_SHORT steps", () => {
    const graph: Graph = {
      nodes: [node("A"), node("B")],
      edges: [causal("A-B", "A", "B", "short")],
      annotations: [],
      modulators: [],
    };
    let sim = makeInitialSim(graph);
    sim = inject(sim, graph, makeNodeId("A"), INJECT_STRENGTH);
    // Run exactly DELAY_TICKS_SHORT steps — signal emitted and held in step 1,
    // decremented each step, released when ticksRemaining reaches 0.
    for (let i = 0; i < DELAY_TICKS_SHORT; i++) sim = step(graph, sim, 1 / 60);
    // Signal must now be travelling (or have already arrived at B)
    const travelling = sim.signals.length > 0;
    const arrived = (sim.nodeValues.get(makeNodeId("B")) ?? 0) > 0;
    expect(travelling || arrived).toBe(true);
    expect(sim.pending.length).toBe(0);
  });
});
