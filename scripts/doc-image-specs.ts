/**
 * Declarative specifications for documentation images.
 *
 * Each spec describes a scene (nodes, edges, signals, annotations) and canvas
 * dimensions. The gen-doc-images script renders each to docs/images/<id>.png.
 *
 * To add a new image:
 *   1. Append a DocImageSpec below.
 *   2. Run: pnpm gen-doc-images
 *   3. Reference in markdown: ![alt](../images/<id>.png)
 *
 * IDs are stable — they match the filenames already referenced in USER-GUIDE.md.
 */

import type {
  Graph,
  SimState,
  Node,
  CausalEdge,
  ConstraintEdge,
  Annotation,
  Modulator,
  NodeId,
  EdgeId,
  AnnotationId,
  ModulatorId,
} from "@swoopy/engine";
import { NODE_SIZE_RADII, makeInitialSim } from "@swoopy/engine";

// ---------------------------------------------------------------------------
// Branded ID helpers
// ---------------------------------------------------------------------------

const nid = (s: string): NodeId => s as NodeId;
const eid = (s: string): EdgeId => s as EdgeId;
const aid = (s: string): AnnotationId => s as AnnotationId;
const mid = (s: string): ModulatorId => s as ModulatorId;

// ---------------------------------------------------------------------------
// Node/edge builders
// ---------------------------------------------------------------------------

function node(
  id: string,
  label: string,
  x: number,
  y: number,
  opts: Partial<Omit<Node, "id" | "label" | "x" | "y" | "radius">> = {},
): Node {
  const sizeTier = opts.sizeTier ?? "m";
  return {
    id: nid(id),
    label,
    x,
    y,
    radius: NODE_SIZE_RADII[sizeTier],
    sizeTier,
    colourTier: opts.colourTier ?? "blue",
    min: opts.min ?? 0,
    max: opts.max ?? 10,
    initial: opts.initial ?? 5,
    ...(opts.role !== undefined && { role: opts.role }),
    ...(opts.annotation !== undefined && { annotation: opts.annotation }),
  };
}

function causal(
  id: string,
  from: string,
  to: string,
  opts: Partial<Omit<CausalEdge, "kind" | "id" | "from" | "to">> = {},
): CausalEdge {
  return {
    kind: "causal",
    id: eid(id),
    from: nid(from),
    to: nid(to),
    polarity: opts.polarity ?? 1,
    weight: opts.weight ?? 1,
    delay: opts.delay ?? "none",
    transferFn: "linear",
    ...(opts.isQuickFix !== undefined && { isQuickFix: opts.isQuickFix }),
  };
}

function constraint(
  id: string,
  from: string,
  to: string,
  kind: "ceiling" | "floor",
): ConstraintEdge {
  return {
    kind: "constraint",
    id: eid(id),
    from: nid(from),
    to: nid(to),
    constraintKind: kind,
  };
}

function emptyGraph(
  nodes: Node[],
  edges: (CausalEdge | ConstraintEdge)[],
  extras?: { annotations?: Annotation[]; modulators?: Modulator[] },
): Graph {
  return {
    nodes,
    edges,
    annotations: extras?.annotations ?? [],
    modulators: extras?.modulators ?? [],
  };
}

// ---------------------------------------------------------------------------
// Spec type
// ---------------------------------------------------------------------------

export interface DocImageSpec {
  id: string;
  width: number;
  height: number;
  graph: Graph;
  sim: SimState;
}

// ---------------------------------------------------------------------------
// Specs
// ---------------------------------------------------------------------------

export const IMAGE_SPECS: DocImageSpec[] = [
  // --- Node colour tiers ---------------------------------------------------
  (() => {
    const colours = [
      "blue",
      "green",
      "red",
      "orange",
      "yellow",
      "teal",
      "purple",
      "grey",
    ] as const;
    const spacing = 70;
    const cx = (i: number) => 40 + i * spacing;
    const nodes = colours.map((c, i) =>
      node(`n${i}`, c, cx(i), 55, { colourTier: c }),
    );
    const graph = emptyGraph(nodes, []);
    return {
      id: "node-colour-tiers",
      width: 40 + colours.length * spacing,
      height: 110,
      graph,
      sim: makeInitialSim(graph),
    };
  })(),

  // --- Node size tiers -----------------------------------------------------
  (() => {
    const sizes = ["xs", "s", "m", "l", "xl"] as const;
    const cx = [50, 110, 180, 260, 350];
    const nodes = sizes.map((s, i) =>
      node(`n${i}`, s, cx[i]!, 60, { sizeTier: s }),
    );
    const graph = emptyGraph(nodes, []);
    return {
      id: "node-size-tiers",
      width: 400,
      height: 120,
      graph,
      sim: makeInitialSim(graph),
    };
  })(),

  // --- Node value fill (low / mid / high) ----------------------------------
  (() => {
    const nodes = [
      node("n1", "low", 70, 60, { initial: 1 }),
      node("n2", "mid", 190, 60, { initial: 5 }),
      node("n3", "high", 310, 60, { initial: 9 }),
    ];
    const graph = emptyGraph(nodes, []);
    return {
      id: "node-value-fill",
      width: 380,
      height: 120,
      graph,
      sim: makeInitialSim(graph),
    };
  })(),

  // --- Node roles (default vs lever) ---------------------------------------
  (() => {
    const nodes = [
      node("n1", "default", 90, 70),
      node("n2", "lever", 250, 70, { role: "lever", colourTier: "yellow" }),
    ];
    const graph = emptyGraph(nodes, []);
    return {
      id: "node-roles",
      width: 340,
      height: 140,
      graph,
      sim: makeInitialSim(graph),
    };
  })(),

  // --- Edge polarity (+ve and −ve) -----------------------------------------
  (() => {
    const nodes = [
      node("a1", "A", 80, 80),
      node("b1", "B", 220, 80),
      node("a2", "A", 80, 200),
      node("b2", "B", 220, 200),
    ];
    const edges = [
      causal("e1", "a1", "b1", { polarity: 1 }),
      causal("e2", "a2", "b2", { polarity: -1 }),
    ];
    const graph = emptyGraph(nodes, edges);
    return {
      id: "edge-polarity",
      width: 300,
      height: 280,
      graph,
      sim: makeInitialSim(graph),
    };
  })(),

  // --- Edge weight (0.5 / 1.0 / 2.0) --------------------------------------
  (() => {
    const nodes = [
      node("a1", "A", 80, 70),
      node("b1", "B", 220, 70),
      node("a2", "A", 80, 180),
      node("b2", "B", 220, 180),
      node("a3", "A", 80, 290),
      node("b3", "B", 220, 290),
    ];
    const edges = [
      causal("e1", "a1", "b1", { weight: 0.5 }),
      causal("e2", "a2", "b2", { weight: 1.0 }),
      causal("e3", "a3", "b3", { weight: 2.0 }),
    ];
    const graph = emptyGraph(nodes, edges);
    return {
      id: "edge-weight",
      width: 300,
      height: 360,
      graph,
      sim: makeInitialSim(graph),
    };
  })(),

  // --- Edge delay (none / short / medium / long) ---------------------------
  (() => {
    const delays = ["none", "short", "medium", "long"] as const;
    const nodes = delays.flatMap((d, i) => [
      node(`a${i}`, "A", 80, 70 + i * 100),
      node(`b${i}`, "B", 220, 70 + i * 100),
    ]);
    const edges = delays.map((d, i) =>
      causal(`e${i}`, `a${i}`, `b${i}`, { delay: d }),
    );
    const graph = emptyGraph(nodes, edges);
    return {
      id: "edge-delay",
      width: 300,
      height: 440,
      graph,
      sim: makeInitialSim(graph),
    };
  })(),

  // --- Edge quick-fix ------------------------------------------------------
  (() => {
    const nodes = [node("a", "Pressure", 80, 90), node("b", "Output", 240, 90)];
    const edges = [causal("e1", "a", "b", { isQuickFix: true })];
    const graph = emptyGraph(nodes, edges);
    return {
      id: "edge-quickfix",
      width: 320,
      height: 180,
      graph,
      sim: makeInitialSim(graph),
    };
  })(),

  // --- Constraint edges (ceiling + floor) ----------------------------------
  (() => {
    const nodes = [
      node("cap", "Capacity", 170, 60, { colourTier: "orange" }),
      node("usr", "Active\nUsers", 170, 200, { colourTier: "green" }),
      node("floor", "Floor", 170, 340, { colourTier: "teal" }),
      node("val", "Value", 170, 480, { colourTier: "blue" }),
    ];
    const edges = [
      constraint("e1", "cap", "usr", "ceiling"),
      constraint("e2", "floor", "val", "floor"),
    ];
    const graph = emptyGraph(nodes, edges);
    return {
      id: "constraint-edges",
      width: 340,
      height: 540,
      graph,
      sim: makeInitialSim(graph),
    };
  })(),

  // --- Signal particles (positive signal on +ve edge) ----------------------
  (() => {
    const nodes = [node("a", "A", 80, 90), node("b", "B", 280, 90)];
    const edges = [causal("e1", "a", "b", { polarity: 1 })];
    const graph = emptyGraph(nodes, edges);
    const sim: SimState = {
      ...makeInitialSim(graph),
      signals: [
        { edgeId: eid("e1"), progress: 0.35, sign: 1, hops: 0 },
        { edgeId: eid("e1"), progress: 0.6, sign: 1, hops: 0 },
      ],
    };
    return {
      id: "signal-particles",
      width: 360,
      height: 180,
      graph,
      sim,
    };
  })(),

  // --- Signal particles on balancing (−ve) edge ----------------------------
  (() => {
    const nodes = [node("a", "A", 80, 90), node("b", "B", 280, 90)];
    const edges = [causal("e1", "a", "b", { polarity: -1 })];
    const graph = emptyGraph(nodes, edges);
    const sim: SimState = {
      ...makeInitialSim(graph),
      signals: [
        { edgeId: eid("e1"), progress: 0.35, sign: 1, hops: 0 },
        { edgeId: eid("e1"), progress: 0.6, sign: 1, hops: 0 },
      ],
    };
    return {
      id: "signal-particles-balancing",
      width: 360,
      height: 180,
      graph,
      sim,
    };
  })(),

  // --- Reinforcing feedback loop -------------------------------------------
  (() => {
    const nodes = [
      node("a", "Growth", 100, 80, { colourTier: "green" }),
      node("b", "Capacity", 260, 80, { colourTier: "blue" }),
    ];
    const edges = [
      causal("e1", "a", "b", { polarity: 1 }),
      causal("e2", "b", "a", { polarity: 1 }),
    ];
    const graph = emptyGraph(nodes, edges);
    return {
      id: "feedback-loop-reinforcing",
      width: 360,
      height: 200,
      graph,
      sim: makeInitialSim(graph),
    };
  })(),

  // --- Balancing feedback loop ---------------------------------------------
  (() => {
    const nodes = [
      node("a", "Pressure", 100, 80, { colourTier: "orange" }),
      node("b", "Relief", 260, 80, { colourTier: "blue" }),
    ];
    const edges = [
      causal("e1", "a", "b", { polarity: 1 }),
      causal("e2", "b", "a", { polarity: -1 }),
    ];
    const graph = emptyGraph(nodes, edges);
    return {
      id: "feedback-loop-balancing",
      width: 360,
      height: 200,
      graph,
      sim: makeInitialSim(graph),
    };
  })(),

  // --- Annotation ----------------------------------------------------------
  (() => {
    const nodes = [node("n1", "Node", 250, 100, { colourTier: "teal" })];
    const annotations: Annotation[] = [
      {
        id: aid("ann1"),
        x: 40,
        y: 30,
        text: "This is an annotation.\nUse it to add context.",
      },
    ];
    const graph = emptyGraph(nodes, [], { annotations });
    return {
      id: "annotation",
      width: 360,
      height: 180,
      graph,
      sim: makeInitialSim(graph),
    };
  })(),

  // --- Modulator -----------------------------------------------------------
  (() => {
    const nodes = [
      node("src", "Context", 80, 180, { colourTier: "purple" }),
      node("a", "A", 240, 80, { colourTier: "blue" }),
      node("b", "B", 400, 180, { colourTier: "green" }),
    ];
    const edges = [causal("e1", "a", "b", { polarity: 1 })];
    const modulators: Modulator[] = [
      {
        id: mid("m1"),
        from: nid("src"),
        target: eid("e1"),
        polarity: 1,
      },
    ];
    const graph = emptyGraph(nodes, edges, { modulators });
    return {
      id: "modulator",
      width: 480,
      height: 280,
      graph,
      sim: makeInitialSim(graph),
    };
  })(),
];
