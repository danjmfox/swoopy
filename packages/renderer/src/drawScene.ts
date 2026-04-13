/**
 * drawScene — environment-agnostic static renderer.
 *
 * Draws a single frame of the Swoopy visual language onto any
 * CanvasRenderingContext2D, including the node-canvas implementation used by
 * the doc-image generation script.
 *
 * No browser globals (window, requestAnimationFrame, devicePixelRatio) are
 * used. No interactive state (drag, hover, focus, pending modulator). The
 * caller is responsible for sizing the canvas and filling the background.
 */

import type {
  Graph,
  SimState,
  CausalEdge,
  ConstraintEdge,
  Node,
  EdgeId,
} from "@swoopy/engine";
import { MAX_SIGNALS, computeEffectiveWeights } from "@swoopy/engine";
import {
  saturationAlpha,
  stockIndicator,
  delayQueueIndicator,
} from "./indicators.ts";
import { nodeValueFill } from "./nodeValueFill.ts";
import {
  bezierPoint,
  controlPoint,
  edgeEndpoints,
  edgeBow,
  T_DELAY,
  T_POLARITY,
  T_WEIGHT,
  ANNOTATION_WIDTH,
  ANNOTATION_MIN_HEIGHT,
  ANNOTATION_PADDING,
} from "./geometry.ts";
import { nodeLabelFont } from "./nodeLabelFont.ts";

// ---------------------------------------------------------------------------
// Signal chevron visual logic — pure functions, exported for testing
// (These live here to keep drawScene self-contained. LoopyRenderer re-exports
// them for backward compatibility.)
// ---------------------------------------------------------------------------

export const ANIM_START = 0.45;
export const ANIM_END = 0.55;
const BLUE = { r: 125, g: 211, b: 252 } as const; // #7dd3fc
const RED = { r: 252, g: 165, b: 165 } as const; // #fca5a5

function angleForSign(sign: 1 | -1): number {
  return sign === 1 ? -Math.PI / 2 : Math.PI / 2;
}

function colorForSign(sign: 1 | -1): { r: number; g: number; b: number } {
  return sign === 1 ? BLUE : RED;
}

/**
 * Returns angle (radians) and color for the signal chevron at a given progress.
 *
 * +ve edges: visual is constant (signal.sign throughout).
 * -ve edges: starts as the parent sign (signal.sign × −1), animates to signal.sign
 *            between progress 0.45–0.55 (both angle and color interpolate linearly).
 */
export function signalChevronVisuals(
  progress: number,
  sign: 1 | -1,
  edgePolarity: 1 | -1,
): { angle: number; color: string } {
  if (edgePolarity === 1) {
    const { r, g, b } = colorForSign(sign);
    return { angle: angleForSign(sign), color: `rgb(${r},${g},${b})` };
  }
  const startSign = (sign * -1) as 1 | -1;
  const t =
    progress < ANIM_START
      ? 0
      : progress > ANIM_END
        ? 1
        : (progress - ANIM_START) / (ANIM_END - ANIM_START);
  const frac = t * t * (3 - 2 * t);
  const angle =
    angleForSign(startSign) +
    (angleForSign(sign) - angleForSign(startSign)) * frac;
  const sc = colorForSign(startSign);
  const ec = colorForSign(sign);
  const r = Math.round(sc.r + (ec.r - sc.r) * frac);
  const g = Math.round(sc.g + (ec.g - sc.g) * frac);
  const b = Math.round(sc.b + (ec.b - sc.b) * frac);
  return { angle, color: `rgb(${r},${g},${b})` };
}

export function arrowheadDimensions(weight: number): {
  len: number;
  half: number;
} {
  const lw = 3 + weight * 2;
  return { len: Math.max(10, lw * 2.5), half: Math.max(5, lw * 1.2) };
}

// ---------------------------------------------------------------------------
// Delay mark counts
// ---------------------------------------------------------------------------

const DELAY_MARKS: Record<string, number> = {
  none: 0,
  short: 2,
  medium: 4,
  long: 6,
};

// ---------------------------------------------------------------------------
// Curved arrow (causal edge)
// ---------------------------------------------------------------------------

export function drawCurvedArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  edge: CausalEdge,
  bow: number,
  alpha = 1,
  weight = edge.weight,
): void {
  const base = edge.polarity === 1 ? "#38bdf8" : "#f87171";
  const colour =
    alpha < 1
      ? `rgba(${edge.polarity === 1 ? "56,189,248" : "248,113,113"},${alpha.toFixed(2)})`
      : base;
  const { cx, cy } = controlPoint(x1, y1, x2, y2, bow);

  const { len: headLen, half: headHalf } = arrowheadDimensions(weight);
  const tlen = Math.hypot(x2 - cx, y2 - cy);
  const ux = (x2 - cx) / tlen;
  const uy = (y2 - cy) / tlen;
  const ax = x2 - ux * headLen;
  const ay = y2 - uy * headLen;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, ax, ay);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 3 + weight * 2;
  if (edge.isQuickFix) ctx.setLineDash([6, 4]);
  ctx.stroke();
  if (edge.isQuickFix) ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(ax + uy * headHalf, ay - ux * headHalf);
  ctx.lineTo(ax - uy * headHalf, ay + ux * headHalf);
  ctx.closePath();
  ctx.fillStyle = colour;
  ctx.fill();

  // Polarity badge at t=0.5
  const mid = bezierPoint(x1, y1, cx, cy, x2, y2, T_POLARITY);
  ctx.beginPath();
  ctx.arc(mid.x, mid.y, 9, 0, Math.PI * 2);
  ctx.fillStyle = "#0f172a";
  ctx.fill();
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = colour;
  ctx.font = "bold 11px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(edge.polarity === 1 ? "+" : "−", mid.x, mid.y);

  // Delay bars at t=0.2
  const marks = DELAY_MARKS[edge.delay] ?? 0;
  if (marks > 0) {
    const dp = bezierPoint(x1, y1, cx, cy, x2, y2, T_DELAY);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < marks; i++) {
      const ox = (i - (marks - 1) / 2) * 4;
      ctx.beginPath();
      ctx.moveTo(dp.x + ox, dp.y - 5);
      ctx.lineTo(dp.x + ox, dp.y + 5);
      ctx.stroke();
    }
  }

  // Weight indicator at t=0.8
  if (edge.weight !== 1.0) {
    const wp = bezierPoint(x1, y1, cx, cy, x2, y2, T_WEIGHT);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(edge.weight.toFixed(2), wp.x, wp.y - 8);
  }

  // QF label at t=0.65
  if (edge.isQuickFix) {
    const qp = bezierPoint(x1, y1, cx, cy, x2, y2, 0.65);
    ctx.fillStyle = colour;
    ctx.font = "bold 13px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("QF", qp.x, qp.y + 14);
  }
}

// ---------------------------------------------------------------------------
// Scene sections
// ---------------------------------------------------------------------------

function drawConstraintEdges(
  ctx: CanvasRenderingContext2D,
  edges: ConstraintEdge[],
  nodeById: Map<string, { x: number; y: number; radius: number }>,
): void {
  for (const edge of edges) {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to) continue;
    const { x1, y1, x2, y2 } = edgeEndpoints(from, to);
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      edge.constraintKind === "ceiling" ? "⌈" : "⌊",
      (x1 + x2) / 2,
      (y1 + y2) / 2 - 10,
    );
  }
}

function drawCausalEdges(
  ctx: CanvasRenderingContext2D,
  edges: CausalEdge[],
  nodeById: Map<string, { x: number; y: number; radius: number }>,
  sim: SimState,
  effectiveWeights: Map<EdgeId, number>,
): void {
  for (const edge of edges) {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to) continue;
    const { x1, y1, x2, y2 } = edgeEndpoints(from, to);
    const edgeSignalCount = sim.signals.filter(
      (s) => s.edgeId === edge.id,
    ).length;
    const alpha = saturationAlpha(edgeSignalCount, MAX_SIGNALS);
    const effectiveWeight = effectiveWeights.get(edge.id) ?? edge.weight;
    if (effectiveWeight !== edge.weight) {
      drawCurvedArrow(
        ctx,
        x1,
        y1,
        x2,
        y2,
        edge,
        edgeBow(edge, edges),
        alpha * 0.5,
        edge.weight,
      );
      drawCurvedArrow(
        ctx,
        x1,
        y1,
        x2,
        y2,
        edge,
        edgeBow(edge, edges),
        alpha,
        effectiveWeight,
      );
    } else {
      drawCurvedArrow(ctx, x1, y1, x2, y2, edge, edgeBow(edge, edges), alpha);
    }
  }
}

function drawModulators(
  ctx: CanvasRenderingContext2D,
  graph: Graph,
  nodeById: Map<string, Node>,
): void {
  const edgeById = new Map(graph.edges.map((e) => [e.id, e]));
  for (const mod of graph.modulators) {
    const srcNode = nodeById.get(mod.from);
    const edge = edgeById.get(mod.target);
    if (!srcNode || !edge || edge.kind !== "causal") continue;
    const fromNode = nodeById.get(edge.from);
    const toNode = nodeById.get(edge.to);
    if (!fromNode || !toNode) continue;

    const { x1, y1, x2, y2 } = edgeEndpoints(fromNode, toNode);
    const bow = edgeBow(
      edge,
      graph.edges.filter((e): e is CausalEdge => e.kind === "causal"),
    );
    const { cx, cy } = controlPoint(x1, y1, x2, y2, bow);
    const mid = bezierPoint(x1, y1, cx, cy, x2, y2, T_POLARITY);

    const colour = mod.polarity === 1 ? "#3b82f6" : "#ef4444";

    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.5;
    ctx.moveTo(srcNode.x, srcNode.y);
    ctx.lineTo(mid.x, mid.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const bx = (srcNode.x + mid.x) / 2;
    const by = (srcNode.y + mid.y) / 2;
    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = colour;
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(mod.polarity === 1 ? "+" : "−", bx, by);
  }
}

function drawSignalParticles(
  ctx: CanvasRenderingContext2D,
  edges: CausalEdge[],
  nodeById: Map<string, { x: number; y: number; radius: number }>,
  sim: SimState,
): void {
  for (const signal of sim.signals) {
    const edge = edges.find((e) => e.id === signal.edgeId);
    if (!edge) continue;
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to) continue;
    const { x1, y1, x2, y2 } = edgeEndpoints(from, to);
    const { cx, cy } = controlPoint(x1, y1, x2, y2, edgeBow(edge, edges));
    const { x: px, y: py } = bezierPoint(
      x1,
      y1,
      cx,
      cy,
      x2,
      y2,
      signal.progress,
    );
    const { angle, color } = signalChevronVisuals(
      signal.progress,
      signal.sign,
      edge.polarity,
    );
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawNodes(
  ctx: CanvasRenderingContext2D,
  graph: Graph,
  sim: SimState,
): void {
  for (const node of graph.nodes) {
    const value = sim.nodeValues.get(node.id) ?? node.initial;
    const prevValue = sim.displayPrevNodeValues.get(node.id) ?? node.initial;
    const { fill, trend } = stockIndicator(
      value,
      node.min,
      node.max,
      prevValue,
    );

    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = nodeValueFill(
      node.max > node.min ? (value - node.min) / (node.max - node.min) : 0,
      node.colourTier,
    );
    ctx.fill();

    // Stock fill arc
    if (fill > 0) {
      ctx.beginPath();
      ctx.arc(
        node.x,
        node.y,
        node.radius - 4,
        -Math.PI / 2,
        -Math.PI / 2 + fill * Math.PI,
      );
      ctx.strokeStyle =
        fill > 0.75 ? "#f97316" : fill > 0.25 ? "#facc15" : "#4ade80";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Delay queue arc
    const { fraction: queueFraction, overflow: queueOverflow } =
      delayQueueIndicator(sim.pending, node.id, graph.edges, node.max);
    if (queueFraction > 0) {
      ctx.beginPath();
      ctx.arc(
        node.x,
        node.y,
        node.radius - 4,
        -Math.PI / 2,
        -Math.PI / 2 - queueFraction * Math.PI,
        true,
      );
      ctx.strokeStyle = queueOverflow ? "#f87171" : "#fb923c";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Outer ring
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Lever role indicator
    if (node.role === "lever") {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Label + trend arrow
    const arrow = trend === "up" ? "▲" : trend === "down" ? "▼" : "";
    ctx.fillStyle = "#f1f5f9";
    ctx.font = nodeLabelFont(node.radius);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label, node.x, node.y - 6);
    if (arrow) {
      ctx.font = "10px system-ui, sans-serif";
      ctx.fillStyle = trend === "up" ? "#4ade80" : "#f87171";
      ctx.fillText(arrow, node.x, node.y + 8);
    }

    if (node.annotation) {
      const text =
        node.annotation.length > 24
          ? node.annotation.slice(0, 24) + "…"
          : node.annotation;
      ctx.font = "10px system-ui, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(text, node.x, node.y + node.radius + 14);
    }
  }
}

function drawAnnotations(ctx: CanvasRenderingContext2D, graph: Graph): void {
  for (const ann of graph.annotations ?? []) {
    const lines = ann.text ? ann.text.split("\n") : [];
    const lineHeight = 16;
    const height = Math.max(
      ANNOTATION_MIN_HEIGHT,
      ANNOTATION_PADDING * 2 + lineHeight + lines.length * lineHeight,
    );

    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(ann.x, ann.y, ANNOTATION_WIDTH, height, 4);
    } else {
      (
        ctx as unknown as {
          rect: (x: number, y: number, w: number, h: number) => void;
        }
      ).rect(ann.x, ann.y, ANNOTATION_WIDTH, height);
    }
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#475569";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("···", ann.x + ANNOTATION_WIDTH / 2, ann.y + 10);

    if (ann.text) {
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "13px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(
          lines[i] ?? "",
          ann.x + ANNOTATION_PADDING,
          ann.y + ANNOTATION_PADDING + lineHeight + i * lineHeight,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render a static snapshot of `graph` + `sim` to `ctx`.
 *
 * @param ctx    - Any Canvas 2D context (browser or node-canvas).
 * @param width  - Logical width in pixels.
 * @param height - Logical height in pixels.
 * @param graph  - Graph to render.
 * @param sim    - Simulation snapshot.
 */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  graph: Graph,
  sim: SimState,
): void {
  ctx.clearRect(0, 0, width, height);

  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const causalEdges = graph.edges.filter(
    (e): e is CausalEdge => e.kind === "causal",
  );
  const constraintEdges = graph.edges.filter(
    (e): e is ConstraintEdge => e.kind === "constraint",
  );
  const effectiveWeights = computeEffectiveWeights(graph, sim.nodeValues);

  drawConstraintEdges(ctx, constraintEdges, nodeById);
  drawCausalEdges(ctx, causalEdges, nodeById, sim, effectiveWeights);
  drawModulators(ctx, graph, nodeById);
  drawSignalParticles(ctx, causalEdges, nodeById, sim);
  drawNodes(ctx, graph, sim);
  drawAnnotations(ctx, graph);
}
