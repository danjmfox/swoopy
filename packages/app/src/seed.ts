import { makeNodeId, makeEdgeId } from "@swoopy/engine";
import type { Graph } from "@swoopy/engine";

// Reinforcing spiral — one click on any node cascades to all nodes saturating at max.
// Demonstrates the core mechanic: signal propagates, loops amplify, system diverges.
// Replace with your own model to explore different dynamics.
const pressureId = makeNodeId("pressure");
const shortcutsId = makeNodeId("shortcuts");
const debtId = makeNodeId("debt");

export const seedGraph: Graph = {
  nodes: [
    {
      id: pressureId,
      label: "Pressure",
      x: 400,
      y: 200,
      radius: 30,
      sizeTier: "m" as const,
      colourTier: "blue" as const,
      min: 0,
      max: 10,
      initial: 2,
    },
    {
      id: shortcutsId,
      label: "Shortcuts",
      x: 620,
      y: 380,
      radius: 30,
      sizeTier: "m" as const,
      colourTier: "blue" as const,
      min: 0,
      max: 10,
      initial: 0,
    },
    {
      id: debtId,
      label: "Debt",
      x: 180,
      y: 380,
      radius: 30,
      sizeTier: "m" as const,
      colourTier: "blue" as const,
      min: 0,
      max: 10,
      initial: 0,
    },
  ],
  edges: [
    {
      kind: "causal",
      id: makeEdgeId("pressure-shortcuts"),
      from: pressureId,
      to: shortcutsId,
      polarity: 1,
      weight: 1,
      delay: "none",
      transferFn: "linear",
    },
    {
      kind: "causal",
      id: makeEdgeId("shortcuts-debt"),
      from: shortcutsId,
      to: debtId,
      polarity: 1,
      weight: 1,
      delay: "none",
      transferFn: "linear",
    },
    {
      kind: "causal",
      id: makeEdgeId("debt-pressure"),
      from: debtId,
      to: pressureId,
      polarity: 1,
      weight: 1,
      delay: "none",
      transferFn: "linear",
    },
  ],
};
