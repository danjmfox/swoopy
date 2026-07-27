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

// ─── Viewport (canvas-pan-zoom-navigation) ──────────────────────────────────
// See docs/product/architecture/adr-003-pan-drag-vs-click-discrimination.md
// and adr-004-viewport-transform-mechanism.md for the mechanism contract.

/** Pan/zoom camera state — owned here per DDD-8, consumed by app/src/store.ts. */
export interface Viewport {
  panX: number;
  panY: number;
  zoom: number;
}

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 4;

/**
 * Lower bound for Reset View's fit zoom only (ADR-005). Unlike ZOOM_MIN
 * (a legibility floor for manual wheel-zoom), this guards only against
 * zero/negative/infinite scale (AC-03c) — Reset View may zoom out below
 * ZOOM_MIN when content genuinely requires it to keep every node visible
 * (AC-03a takes priority over legibility for the "see everything" escape
 * hatch).
 */
export const RESET_VIEW_ZOOM_FLOOR = 0.001;

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
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

// Wheel sensitivity (DDD-5): ~10% zoom change per standard wheel notch
// (deltaY of 100), applied multiplicatively so relative zoom-in/out feel
// stays consistent regardless of current zoom level.
const ZOOM_WHEEL_SENSITIVITY = 0.001;

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
  const graphPoint = screenToGraph(viewport, screenX, screenY);
  const zoomFactor = Math.exp(-deltaY * ZOOM_WHEEL_SENSITIVITY);
  const nextZoom = clampZoom(viewport.zoom * zoomFactor);
  return {
    panX: screenX - graphPoint.x * nextZoom,
    panY: screenY - graphPoint.y * nextZoom,
    zoom: nextZoom,
  };
}

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Union of two bounding boxes (smallest box containing both). */
function unionBox(a: BoundingBox, b: BoundingBox): BoundingBox {
  return {
    minX: Math.min(a.minX, b.minX),
    maxX: Math.max(a.maxX, b.maxX),
    minY: Math.min(a.minY, b.minY),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

/** Smallest box containing every box in the list, or null if the list is empty. */
function unionAll(boxes: ReadonlyArray<BoundingBox>): BoundingBox | null {
  return boxes.reduce<BoundingBox | null>(
    (acc, box) => (acc === null ? box : unionBox(acc, box)),
    null,
  );
}

/** Square box centered on a point, padded by `padding` in every direction. */
function pointBox(x: number, y: number, padding: number): BoundingBox {
  return {
    minX: x - padding,
    maxX: x + padding,
    minY: y - padding,
    maxY: y + padding,
  };
}

/**
 * Fit-to-content viewport: bounding box over all nodes (+ radius) and
 * annotations, guarded for degenerate (zero-extent) content. Zoom's lower
 * bound is RESET_VIEW_ZOOM_FLOOR, decoupled from manual zoom's ZOOM_MIN
 * (ADR-005) — the upper bound remains ZOOM_MAX, shared with clampZoom.
 *
 * Two bounding boxes are tracked, not one:
 * - `extentBounds` (node positions padded by radius, + annotation rects) —
 *   drives the ZOOM calculation, so full node circles are accounted for.
 * - `positionBounds` (node positions only, no radius padding — annotation
 *   rects are unchanged since a rect has no separate "core" point) — drives
 *   the CENTER used for panning.
 * When ZOOM_MIN/ZOOM_MAX clamps the extent-driven zoom away from its natural
 * fit value, centering on node positions (rather than the radius-inflated
 * extent) keeps node centers optimally placed instead of skewed by a single
 * large-radius outlier's padded edge.
 *
 * Minimum-extent guard: when there is no content at all, the graph-space
 * extent defaults to the canvas rect itself (0,0)-(canvasWidth,canvasHeight)
 * — the same rect the identity transform already maps 1:1 to screen space.
 * Combined with the centering + clampZoom below, this naturally yields the
 * identity viewport (zoom=1, pan=(0,0)) for a content-free diagram, matching
 * pre-feature rendering exactly — no separate 0-node/1-node code paths.
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
  const annotationBoxes: BoundingBox[] = annotations.map((a) => ({
    minX: a.x,
    maxX: a.x + a.width,
    minY: a.y,
    maxY: a.y + a.height,
  }));

  const extentBoxes: BoundingBox[] = [
    ...nodes.map((n) => pointBox(n.x, n.y, n.radius)),
    ...annotationBoxes,
  ];

  const positionBoxes: BoundingBox[] = [
    ...nodes.map((n) => pointBox(n.x, n.y, 0)),
    ...annotationBoxes,
  ];

  const extentBounds = unionAll(extentBoxes);
  const hasExtent =
    extentBounds !== null &&
    extentBounds.maxX - extentBounds.minX > 0 &&
    extentBounds.maxY - extentBounds.minY > 0;

  const defaultBounds: BoundingBox = {
    minX: 0,
    maxX: canvasWidth,
    minY: 0,
    maxY: canvasHeight,
  };

  const bounds = hasExtent ? extentBounds! : defaultBounds;
  const centerBounds = hasExtent ? unionAll(positionBoxes)! : defaultBounds;

  const boundsWidth = bounds.maxX - bounds.minX;
  const boundsHeight = bounds.maxY - bounds.minY;
  const centerX = (centerBounds.minX + centerBounds.maxX) / 2;
  const centerY = (centerBounds.minY + centerBounds.maxY) / 2;

  const naturalZoom = Math.min(
    canvasWidth / boundsWidth,
    canvasHeight / boundsHeight,
  );
  const zoom = Math.max(RESET_VIEW_ZOOM_FLOOR, Math.min(ZOOM_MAX, naturalZoom));

  return {
    panX: canvasWidth / 2 - centerX * zoom,
    panY: canvasHeight / 2 - centerY * zoom,
    zoom,
  };
}
