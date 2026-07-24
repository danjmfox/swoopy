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

/**
 * Quadratic bezier tangent (unit vector) at parameter t.
 * B'(t) = 2(1−t)(cp − start) + 2t(end − cp), then normalized.
 */
export function bezierTangent(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  t: number,
): { dx: number; dy: number } {
  const mt = 1 - t;
  const rawDx = 2 * mt * (cx - x1) + 2 * t * (x2 - cx);
  const rawDy = 2 * mt * (cy - y1) + 2 * t * (y2 - cy);
  const len = Math.hypot(rawDx, rawDy);
  if (len < 1e-6) return { dx: 1, dy: 0 };
  return { dx: rawDx / len, dy: rawDy / len };
}

/** Hit radius for each edge badge region (CSS px). */
export const EDGE_HIT_RADIUS = 10;

/** Bezier t-parameters for the three edge interaction regions. */
export const T_DELAY = 0.2;
export const T_POLARITY = 0.5;
export const T_WEIGHT = 0.8;

// ─── Viewport (canvas-pan-zoom-navigation, DISTILL wave RED scaffold) ───────
// __SCAFFOLD_VIEWPORT__: these 5 functions + the Viewport type are RED
// scaffolds created by DISTILL (docs/feature/canvas-pan-zoom-navigation).
// Real implementation lands during DELIVER, one scenario at a time.
// See docs/product/architecture/adr-003-pan-drag-vs-click-discrimination.md
// and adr-004-viewport-transform-mechanism.md for the mechanism contract
// these functions must satisfy once implemented.
export const __SCAFFOLD_VIEWPORT__ = true;

/** Pan/zoom camera state — owned here per DDD-8, consumed by app/src/store.ts. */
export interface Viewport {
  panX: number;
  panY: number;
  zoom: number;
}

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 4;

/**
 * Screen (CSS px) → graph-space coordinate, given the current viewport.
 * Inverse of graphToScreen — the draw-time matrix is `translate(pan) then
 * scale(zoom)`, so screen = graph * zoom + pan (ADR-004).
 */
export function screenToGraph(
  viewport: Viewport,
  screenX: number,
  screenY: number,
): { x: number; y: number } {
  return {
    x: (screenX - viewport.panX) / viewport.zoom,
    y: (screenY - viewport.panY) / viewport.zoom,
  };
}

/** Graph-space → screen (CSS px) coordinate, given the current viewport. */
export function graphToScreen(
  viewport: Viewport,
  graphX: number,
  graphY: number,
): { x: number; y: number } {
  return {
    x: graphX * viewport.zoom + viewport.panX,
    y: graphY * viewport.zoom + viewport.panY,
  };
}

/** Clamps a requested zoom level to [ZOOM_MIN, ZOOM_MAX]. */
export function clampZoom(zoom: number): number {
  void zoom;
  throw new Error(
    "Not yet implemented — RED scaffold (__SCAFFOLD_VIEWPORT__)",
  );
}

/**
 * Zoom centered on a screen-space cursor position: the graph-space point
 * under the cursor stays fixed under the new scale (DDD-5).
 */
export function zoomAtCursor(
  viewport: Viewport,
  screenX: number,
  screenY: number,
  deltaY: number,
): Viewport {
  void viewport;
  void screenX;
  void screenY;
  void deltaY;
  throw new Error(
    "Not yet implemented — RED scaffold (__SCAFFOLD_VIEWPORT__)",
  );
}

/**
 * Fit-to-content viewport: bounding box over all nodes (+ radius) and
 * annotations, guarded for degenerate (0/1-node) extents, result passed
 * through clampZoom (DDD-6).
 */
export function computeFitViewport(
  nodes: ReadonlyArray<{ x: number; y: number; radius: number }>,
  annotations: ReadonlyArray<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>,
  canvasWidth: number,
  canvasHeight: number,
): Viewport {
  void nodes;
  void annotations;
  void canvasWidth;
  void canvasHeight;
  throw new Error(
    "Not yet implemented — RED scaffold (__SCAFFOLD_VIEWPORT__)",
  );
}
