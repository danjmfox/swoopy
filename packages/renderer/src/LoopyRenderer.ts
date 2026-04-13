import type {
  Graph,
  SimState,
  CausalEdge,
  ConstraintEdge,
  NodeId,
  AnnotationId,
  Node,
  EdgeId,
} from "@swoopy/engine";
import { MAX_SIGNALS, computeEffectiveWeights } from "@swoopy/engine";
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
import {
  drawCurvedArrow,
  signalChevronVisuals,
  arrowheadDimensions,
  ANIM_START,
  ANIM_END,
} from "./drawScene.ts";

// Re-export for backward compatibility (tests import these from LoopyRenderer)
export { signalChevronVisuals, arrowheadDimensions, ANIM_START, ANIM_END };

const MAX_DT = 0.05;

export interface RendererStore {
  graph: Graph;
  sim: SimState;
  simRunning: boolean;
  simSpeed: number;
  tickSim: (dt: number) => void;
  focusedNodeId: NodeId | null;
  mode: string;
  dragPosition?: { nodeId: NodeId; x: number; y: number } | null;
  annotationDragPosition?: { id: AnnotationId; x: number; y: number } | null;
  hoveredEdgeRegion?: { edgeId: string; region: "delay" | "weight" } | null;
  pendingModulatorTarget?: EdgeId | null;
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

    const {
      graph,
      sim,
      mode,
      dragPosition,
      annotationDragPosition,
      pendingModulatorTarget,
    } = state;
    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
    const causalEdges = graph.edges.filter(
      (e): e is CausalEdge => e.kind === "causal",
    );
    const constraintEdges = graph.edges.filter(
      (e): e is ConstraintEdge => e.kind === "constraint",
    );

    this.drawConstraintEdges(ctx, constraintEdges, nodeById);
    const effectiveWeights = computeEffectiveWeights(graph, sim.nodeValues);
    this.drawCausalEdges(
      ctx,
      causalEdges,
      nodeById,
      sim,
      pendingModulatorTarget ?? null,
      effectiveWeights,
    );
    this.drawModulators(ctx, graph, nodeById);
    if (pendingModulatorTarget) {
      const edge = causalEdges.find((e) => e.id === pendingModulatorTarget);
      const fromLabel = edge ? (nodeById.get(edge.from)?.label ?? "") : "";
      const toLabel = edge ? (nodeById.get(edge.to)?.label ?? "") : "";
      this.drawPendingModulatorHint(ctx, w, fromLabel, toLabel);
    }
    if (mode === "select")
      this.drawAffordanceDots(ctx, causalEdges, nodeById, state);
    this.drawSignalParticles(ctx, causalEdges, nodeById, sim);
    this.drawNodes(ctx, graph, sim, dragPosition ?? null, state);
    this.drawAnnotations(ctx, graph, annotationDragPosition ?? null);
    if (dragPosition) this.drawGhostNode(ctx, graph, sim, dragPosition);
  }

  private drawConstraintEdges(
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

  private drawCausalEdges(
    ctx: CanvasRenderingContext2D,
    edges: CausalEdge[],
    nodeById: Map<string, { x: number; y: number; radius: number }>,
    sim: SimState,
    pendingModulatorTarget: EdgeId | null,
    effectiveWeights: Map<EdgeId, number>,
  ): void {
    for (const edge of edges) {
      const from = nodeById.get(edge.from);
      const to = nodeById.get(edge.to);
      if (!from || !to) continue;
      const { x1, y1, x2, y2 } = edgeEndpoints(from, to);
      // SI-11: dim edge when signal count is high
      const edgeSignalCount = sim.signals.filter(
        (s) => s.edgeId === edge.id,
      ).length;
      const alpha = saturationAlpha(edgeSignalCount, MAX_SIGNALS);
      const effectiveWeight = effectiveWeights.get(edge.id) ?? edge.weight;
      if (effectiveWeight !== edge.weight) {
        // Ghost pass: base weight at 50% opacity (shows relationship potential)
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
        // Fill pass: effective weight at full opacity (shows current activation)
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

      if (pendingModulatorTarget === edge.id) {
        const bow = edgeBow(edge, edges);
        const { cx, cy } = controlPoint(x1, y1, x2, y2, bow);
        const mid = bezierPoint(x1, y1, cx, cy, x2, y2, T_POLARITY);
        ctx.beginPath();
        ctx.arc(mid.x, mid.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }
  }

  private drawPendingModulatorHint(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    fromLabel: string,
    toLabel: string,
  ): void {
    const label =
      fromLabel && toLabel ? `${fromLabel} → ${toLabel}` : "selected edge";
    const text = `Modulating: ${label} — click source node`;
    ctx.font = "13px system-ui, sans-serif";
    const measured = ctx.measureText(text);
    const pad = 10;
    const bw = measured.width + pad * 2;
    const bh = 28;
    const bx = (canvasWidth - bw) / 2;
    const by = 12;
    ctx.fillStyle = "rgba(245,158,11,0.15)";
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 6);
    ctx.fill();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#92400e";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvasWidth / 2, by + bh / 2);
  }

  private drawModulators(
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

      // Polarity badge at arc midpoint (mirrors causal edge badge, r=7 for lighter weight)
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

  private drawAffordanceDots(
    ctx: CanvasRenderingContext2D,
    edges: CausalEdge[],
    nodeById: Map<string, { x: number; y: number; radius: number }>,
    state: RendererStore,
  ): void {
    const hovered = state.hoveredEdgeRegion ?? null;
    for (const edge of edges) {
      const from = nodeById.get(edge.from);
      const to = nodeById.get(edge.to);
      if (!from || !to) continue;
      const { x1, y1, x2, y2 } = edgeEndpoints(from, to);
      const { cx, cy } = controlPoint(x1, y1, x2, y2, edgeBow(edge, edges));
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

  private drawSignalParticles(
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

  private drawNodes(
    ctx: CanvasRenderingContext2D,
    graph: Graph,
    sim: SimState,
    dragPosition: { nodeId: NodeId; x: number; y: number } | null,
    state: RendererStore,
  ): void {
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

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = nodeValueFill(
        node.max > node.min ? (value - node.min) / (node.max - node.min) : 0,
        node.colourTier,
      );
      ctx.fill();

      // SI-12: stock fill arc
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

      // SI-19: delay queue arc
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

      // GE-20: focus ring
      if (state.focusedNodeId === node.id) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // DR--20260412: lever role indicator
      if (node.role === "lever") {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // SI-12: label + trend arrow
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

      if (isDragging) ctx.globalAlpha = 1;
    }
  }

  private drawAnnotations(
    ctx: CanvasRenderingContext2D,
    graph: Graph,
    annotationDragPosition: { id: AnnotationId; x: number; y: number } | null,
  ): void {
    for (const ann of graph.annotations ?? []) {
      const ax =
        annotationDragPosition?.id === ann.id
          ? annotationDragPosition.x
          : ann.x;
      const ay =
        annotationDragPosition?.id === ann.id
          ? annotationDragPosition.y
          : ann.y;
      const lines = ann.text ? ann.text.split("\n") : [];
      const lineHeight = 16;
      const height = Math.max(
        ANNOTATION_MIN_HEIGHT,
        ANNOTATION_PADDING * 2 + lineHeight + lines.length * lineHeight,
      );

      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(ax, ay, ANNOTATION_WIDTH, height, 4);
      } else {
        ctx.rect(ax, ay, ANNOTATION_WIDTH, height);
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
      ctx.fillText("···", ax + ANNOTATION_WIDTH / 2, ay + 10);

      if (ann.text) {
        ctx.fillStyle = "#f1f5f9";
        ctx.font = "13px system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(
            lines[i] ?? "",
            ax + ANNOTATION_PADDING,
            ay + ANNOTATION_PADDING + lineHeight + i * lineHeight,
          );
        }
      }
    }
  }

  private drawGhostNode(
    ctx: CanvasRenderingContext2D,
    graph: Graph,
    sim: SimState,
    dragPosition: { nodeId: NodeId; x: number; y: number },
  ): void {
    const node = graph.nodes.find((n) => n.id === dragPosition.nodeId);
    if (!node) return;
    const value = sim.nodeValues.get(node.id) ?? node.initial;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(dragPosition.x, dragPosition.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = nodeValueFill(
      node.max > node.min ? (value - node.min) / (node.max - node.min) : 0,
      node.colourTier,
    );
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
