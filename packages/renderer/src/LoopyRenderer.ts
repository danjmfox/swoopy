import type {
  Graph,
  SimState,
  CausalEdge,
  ConstraintEdge,
  NodeId,
} from "@swoopy/engine";
import { MAX_SIGNALS } from "@swoopy/engine";
import {
  stockIndicator,
  delayQueueIndicator,
  saturationAlpha,
  TrendTracker,
} from "./indicators.ts";
import { nodeValueFill } from "./nodeValueFill.ts";
import {
  bezierPoint,
  controlPoint,
  BOW,
  T_DELAY,
  T_POLARITY,
  T_WEIGHT,
} from "./geometry.ts";
import { nodeLabelFont } from "./nodeLabelFont.ts";

const MAX_DT = 0.05;
const DELAY_MARKS: Record<string, number> = {
  none: 0,
  short: 2,
  medium: 4,
  long: 6,
};

export interface RendererStore {
  graph: Graph;
  sim: SimState;
  simRunning: boolean;
  simSpeed: number;
  tickSim: (dt: number) => void;
  focusedNodeId: NodeId | null;
  mode: string;
  dragPosition?: { nodeId: NodeId; x: number; y: number } | null;
  hoveredEdgeRegion?: { edgeId: string; region: "delay" | "weight" } | null;
}

export function arrowheadDimensions(weight: number): {
  len: number;
  half: number;
} {
  const lw = 1 + weight * 1.5;
  return { len: Math.max(10, lw * 2.5), half: Math.max(5, lw * 1.2) };
}

function drawCurvedArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  edge: CausalEdge,
  bow: number,
  alpha = 1,
) {
  const base = edge.polarity === 1 ? "#38bdf8" : "#f87171";
  const colour =
    alpha < 1
      ? `rgba(${edge.polarity === 1 ? "56,189,248" : "248,113,113"},${alpha.toFixed(2)})`
      : base;
  const { cx, cy } = controlPoint(x1, y1, x2, y2, bow);

  // Arrowhead geometry computed first so stroke can end at base, not tip.
  // This prevents the thick line cap from squaring off the arrowhead point.
  const { len: headLen, half: headHalf } = arrowheadDimensions(edge.weight);
  const tlen = Math.hypot(x2 - cx, y2 - cy);
  const ux = (x2 - cx) / tlen;
  const uy = (y2 - cy) / tlen;
  const ax = x2 - ux * headLen;
  const ay = y2 - uy * headLen;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, ax, ay);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1 + edge.weight * 1.5;
  ctx.stroke();
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

  // Weight indicator at t=0.8 — show as dim number if not at default (1.0)
  if (edge.weight !== 1.0) {
    const wp = bezierPoint(x1, y1, cx, cy, x2, y2, T_WEIGHT);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(edge.weight.toFixed(2), wp.x, wp.y - 8);
  }
}

export class LoopyRenderer {
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private readonly trendTracker = new TrendTracker(2000);

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly getState: () => RendererStore,
  ) {}

  start(): void {
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
      this.lastTime = null;
    }
  }

  private tick = (time: number): void => {
    const dt =
      this.lastTime !== null
        ? Math.min((time - this.lastTime) / 1000, MAX_DT)
        : 1 / 60;
    this.lastTime = time;

    const state = this.getState();
    if (state.simRunning) state.tickSim(dt * state.simSpeed);
    this.draw(this.getState());

    this.rafId = requestAnimationFrame(this.tick);
  };

  private draw(state: RendererStore): void {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const dpr = window.devicePixelRatio;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const { graph, sim, mode, dragPosition } = state;
    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
    const causalEdges = graph.edges.filter(
      (e): e is CausalEdge => e.kind === "causal",
    );
    const constraintEdges = graph.edges.filter(
      (e): e is ConstraintEdge => e.kind === "constraint",
    );

    const hasReverse = new Set(
      causalEdges
        .filter((e) =>
          causalEdges.some((r) => r.from === e.to && r.to === e.from),
        )
        .map((e) => e.id),
    );

    // Constraint edges — dashed lines, no arrowhead, ⌈/⌊ label
    for (const edge of constraintEdges) {
      const from = nodeById.get(edge.from);
      const to = nodeById.get(edge.to);
      if (!from || !to) continue;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);
      const ux = dx / len;
      const uy = dy / len;
      const x1 = from.x + ux * from.radius;
      const y1 = from.y + uy * from.radius;
      const x2 = to.x - ux * to.radius;
      const y2 = to.y - uy * to.radius;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(edge.constraintKind === "ceiling" ? "⌈" : "⌊", mx, my - 10);
    }

    // Causal edges
    for (const edge of causalEdges) {
      const from = nodeById.get(edge.from);
      const to = nodeById.get(edge.to);
      if (!from || !to) continue;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);
      const ux = dx / len;
      const uy = dy / len;

      // SI-11: dim edge when signal count is high
      const edgeSignalCount = sim.signals.filter(
        (s) => s.edgeId === edge.id,
      ).length;
      const alpha = saturationAlpha(edgeSignalCount, MAX_SIGNALS);

      drawCurvedArrow(
        ctx,
        from.x + ux * from.radius,
        from.y + uy * from.radius,
        to.x - ux * to.radius,
        to.y - uy * to.radius,
        edge,
        BOW,
        alpha,
      );
    }

    // GE-29/GE-30: Select mode — affordance dots at delay and weight hit regions
    if (mode === "select") {
      const hovered = state.hoveredEdgeRegion ?? null;
      for (const edge of causalEdges) {
        const from = nodeById.get(edge.from);
        const to = nodeById.get(edge.to);
        if (!from || !to) continue;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;
        const x1 = from.x + ux * from.radius;
        const y1 = from.y + uy * from.radius;
        const x2 = to.x - ux * to.radius;
        const y2 = to.y - uy * to.radius;
        const { cx, cy } = controlPoint(x1, y1, x2, y2, BOW);
        for (const [t, region] of [
          [T_DELAY, "delay"],
          [T_WEIGHT, "weight"],
        ] as [number, "delay" | "weight"][]) {
          const { x: px, y: py } = bezierPoint(x1, y1, cx, cy, x2, y2, t);
          const isHovered =
            hovered?.edgeId === edge.id && hovered?.region === region;
          ctx.beginPath();
          ctx.arc(px, py, 8, 0, Math.PI * 2);
          ctx.fillStyle = isHovered
            ? "rgba(148,163,184,0.9)"
            : "rgba(148,163,184,0.25)";
          ctx.fill();
          if (isHovered) {
            ctx.fillStyle = "rgba(148,163,184,0.9)";
            ctx.font = "11px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText(region === "delay" ? "Delay" : "Weight", px, py - 12);
          }
        }
      }
    }

    // Signal particles
    for (const signal of sim.signals) {
      const edge = causalEdges.find((e) => e.id === signal.edgeId);
      if (!edge) continue;
      const from = nodeById.get(edge.from);
      const to = nodeById.get(edge.to);
      if (!from || !to) continue;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);
      const ux = dx / len;
      const uy = dy / len;
      const x1 = from.x + ux * from.radius;
      const y1 = from.y + uy * from.radius;
      const x2 = to.x - ux * to.radius;
      const y2 = to.y - uy * to.radius;
      const bow = BOW;
      const { cx, cy } = controlPoint(x1, y1, x2, y2, bow);
      const { x: px, y: py } = bezierPoint(
        x1,
        y1,
        cx,
        cy,
        x2,
        y2,
        signal.progress,
      );

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = signal.strength > 0 ? "#7dd3fc" : "#fca5a5";
      ctx.fill();
    }

    // Nodes
    for (const node of graph.nodes) {
      const isDragging = dragPosition?.nodeId === node.id;
      const value = sim.nodeValues.get(node.id) ?? node.initial;
      const prevValue = sim.displayPrevNodeValues.get(node.id) ?? node.initial;
      const { fill, trend: rawTrend } = stockIndicator(
        value,
        node.min,
        node.max,
        prevValue,
      );
      const trend = this.trendTracker.update(
        node.id,
        rawTrend,
        performance.now(),
      );
      if (isDragging) ctx.globalAlpha = 0.3;

      // Base fill
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      const nodeFill = nodeValueFill(
        node.max > node.min ? (value - node.min) / (node.max - node.min) : 0,
        node.colourTier,
      );
      ctx.fillStyle = nodeFill;
      ctx.fill();

      // SI-12: stock fill arc — thin ring showing position in [min, max]
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

      // SI-19: delay queue arc — mirrors stock arc on the left side
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

      // GE-20: focus ring — white highlight when node is keyboard/click focused
      if (state.focusedNodeId === node.id) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // SI-12: trend arrow
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

      if (isDragging) ctx.globalAlpha = 1;
    }

    // Ghost node — follows cursor during drag in select mode
    if (dragPosition) {
      const node = graph.nodes.find((n) => n.id === dragPosition.nodeId);
      if (node) {
        const value = sim.nodeValues.get(node.id) ?? node.initial;
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.arc(dragPosition.x, dragPosition.y, node.radius, 0, Math.PI * 2);
        const dragFill = nodeValueFill(
          node.max > node.min ? (value - node.min) / (node.max - node.min) : 0,
          node.colourTier,
        );
        ctx.fillStyle = dragFill;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(dragPosition.x, dragPosition.y, node.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#f1f5f9";
        ctx.font = "13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label, dragPosition.x, dragPosition.y);
        ctx.globalAlpha = 1;
      }
    }
  }
}
