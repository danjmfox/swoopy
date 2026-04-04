// Shared bezier geometry — used by both LoopyRenderer (drawing) and hitTest (interaction)
// All coordinates in CSS pixels. DPR applied at draw time only.

import type { CausalEdge } from "@swoopy/engine";

export const BOW = 28; // px perpendicular offset for parallel edge pairs

/**
 * Returns the bow value for a causal edge.
 * When two causal edges share the same (from, to) pair (one QF, one normal),
 * they are offset to opposite sides: normal → +BOW, QF → -BOW.
 * A lone edge uses +BOW (existing behaviour).
 */
export function edgeBow(
  edge: CausalEdge,
  allCausal: ReadonlyArray<CausalEdge>,
): number {
  const sibling = allCausal.some(
    (e) => e.id !== edge.id && e.from === edge.from && e.to === edge.to,
  );
  if (!sibling) return BOW;
  return edge.isQuickFix ? -BOW : BOW;
}

/** Edge endpoint coordinates in CSS pixels — points where edge meets node circumference. */
export function edgeEndpoints(
  from: { x: number; y: number; radius: number },
  to: { x: number; y: number; radius: number },
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: from.x + ux * from.radius,
    y1: from.y + uy * from.radius,
    x2: to.x - ux * to.radius,
    y2: to.y - uy * to.radius,
  };
}

export const ANNOTATION_WIDTH = 180;
export const ANNOTATION_MIN_HEIGHT = 40;
export const ANNOTATION_PADDING = 10;

/** Quadratic bezier point at parameter t (0–1) */
export function bezierPoint(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  t: number,
) {
  const mt = 1 - t;
  return {
    x: mt * mt * x1 + 2 * mt * t * cx + t * t * x2,
    y: mt * mt * y1 + 2 * mt * t * cy + t * t * y2,
  };
}

/** Control point for a bowed edge. bow > 0 bows right relative to travel direction. */
export function controlPoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bow: number,
) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return { cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
  const px = (y2 - y1) / len;
  const py = -(x2 - x1) / len;
  return { cx: (x1 + x2) / 2 + px * bow, cy: (y1 + y2) / 2 + py * bow };
}

/** Hit radius for each edge badge region (CSS px). */
export const EDGE_HIT_RADIUS = 10;

/** Bezier t-parameters for the three edge interaction regions. */
export const T_DELAY = 0.2;
export const T_POLARITY = 0.5;
export const T_WEIGHT = 0.8;
