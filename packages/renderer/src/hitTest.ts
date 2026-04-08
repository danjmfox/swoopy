import type {
  Graph,
  NodeId,
  EdgeId,
  CausalEdge,
  ConstraintEdge,
  AnnotationId,
} from "@swoopy/engine";
import {
  bezierPoint,
  controlPoint,
  edgeEndpoints,
  edgeBow,
  EDGE_HIT_RADIUS,
  T_DELAY,
  T_POLARITY,
  T_WEIGHT,
  ANNOTATION_WIDTH,
  ANNOTATION_MIN_HEIGHT,
} from "./geometry.ts";

export type HitTarget =
  | { kind: "node"; id: NodeId }
  | { kind: "edge-polarity"; edgeId: EdgeId }
  | { kind: "edge-delay"; edgeId: EdgeId }
  | { kind: "edge-weight"; edgeId: EdgeId }
  | { kind: "edge-constraint"; edgeId: EdgeId }
  | { kind: "annotation"; id: AnnotationId };

// All coordinates in CSS pixels — DPR applied at draw time only (docs/decisions/DR--20260327--renderer--dpr-css-pixel-geometry.md)
export function hitTest(graph: Graph, x: number, y: number): HitTarget | null {
  // Nodes take priority — check first
  for (const node of graph.nodes) {
    const dist = Math.hypot(x - node.x, y - node.y);
    if (dist <= node.radius) return { kind: "node", id: node.id };
  }

  // Edge regions (causal edges only — constraint edges handled separately below)
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const causalEdges = graph.edges.filter(
    (e): e is CausalEdge => e.kind === "causal",
  );
  for (const edge of causalEdges) {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to) continue;
    const { x1, y1, x2, y2 } = edgeEndpoints(from, to);
    const { cx, cy } = controlPoint(x1, y1, x2, y2, edgeBow(edge, causalEdges));

    const regions: Array<[number, HitTarget]> = [
      [T_POLARITY, { kind: "edge-polarity", edgeId: edge.id }],
      [T_DELAY, { kind: "edge-delay", edgeId: edge.id }],
      [T_WEIGHT, { kind: "edge-weight", edgeId: edge.id }],
    ];

    for (const [t, target] of regions) {
      const pt = bezierPoint(x1, y1, cx, cy, x2, y2, t);
      if (Math.hypot(x - pt.x, y - pt.y) <= EDGE_HIT_RADIUS) return target;
    }
  }

  // Constraint edges — hit at the midpoint of the straight line
  const constraintEdges = graph.edges.filter(
    (e): e is ConstraintEdge => e.kind === "constraint",
  );
  for (const edge of constraintEdges) {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to) continue;
    const { x1, y1, x2, y2 } = edgeEndpoints(from, to);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    if (Math.hypot(x - mx, y - my) <= EDGE_HIT_RADIUS)
      return { kind: "edge-constraint", edgeId: edge.id };
  }

  // Annotations — rect hit (x, y, ANNOTATION_WIDTH, ANNOTATION_MIN_HEIGHT minimum)
  for (const ann of graph.annotations ?? []) {
    if (
      x >= ann.x &&
      x <= ann.x + ANNOTATION_WIDTH &&
      y >= ann.y &&
      y <= ann.y + ANNOTATION_MIN_HEIGHT
    ) {
      return { kind: "annotation", id: ann.id };
    }
  }

  return null;
}
