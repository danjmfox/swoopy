import type { NodeId, PendingSignal, Edge } from "@swoopy/engine";

export interface StockIndicator {
  readonly fill: number; // 0–1 position within [min, max]
  readonly trend: "up" | "down" | "stable";
}

export function stockIndicator(
  value: number,
  min: number,
  max: number,
  prevValue: number,
): StockIndicator {
  const fill =
    max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  const trend =
    value > prevValue ? "up" : value < prevValue ? "down" : "stable";
  return { fill, trend };
}

/** SI-11: alpha 1→0.3 as signalCount approaches maxSignals */
export function saturationAlpha(
  signalCount: number,
  maxSignals: number,
): number {
  if (maxSignals <= 0) return 1;
  return Math.max(0.3, 1 - (signalCount / maxSignals) * 0.7);
}

export class TrendTracker {
  private readonly holdMs: number;
  private state = new Map<
    NodeId,
    { direction: "up" | "down"; expiresAt: number }
  >();

  constructor(holdMs = 2000) {
    this.holdMs = holdMs;
  }

  update(
    nodeId: NodeId,
    rawTrend: "up" | "down" | "stable",
    nowMs: number,
  ): "up" | "down" | "stable" {
    if (rawTrend !== "stable") {
      this.state.set(nodeId, {
        direction: rawTrend,
        expiresAt: nowMs + this.holdMs,
      });
      return rawTrend;
    }
    const held = this.state.get(nodeId);
    if (held && nowMs < held.expiresAt) {
      return held.direction;
    }
    return "stable";
  }
}

export interface DelayQueueIndicator {
  readonly fraction: number;
  readonly overflow: boolean;
}

export function delayQueueIndicator(
  pending: ReadonlyArray<PendingSignal>,
  nodeId: NodeId,
  edges: ReadonlyArray<Edge>,
  nodeMax: number,
): DelayQueueIndicator {
  const mass = timebombStrength(pending, nodeId, edges);
  return {
    fraction: nodeMax > 0 ? Math.min(1, mass / nodeMax) : 0,
    overflow: mass > nodeMax,
  };
}

export function timebombStrength(
  pending: ReadonlyArray<PendingSignal>,
  nodeId: NodeId,
  edges: ReadonlyArray<Edge>,
): number {
  const fromEdgeIds = new Set(
    edges.filter((e) => e.from === nodeId).map((e) => e.id),
  );
  return pending
    .filter((p) => fromEdgeIds.has(p.signal.edgeId))
    .reduce((sum, p) => sum + Math.abs(p.signal.strength), 0);
}
