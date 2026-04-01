export type NodeId = string & { readonly __brand: "NodeId" };
export type EdgeId = string & { readonly __brand: "EdgeId" };

export type DelayLevel = "none" | "short" | "medium" | "long";
export type EdgeKind = "causal" | "constraint";
export type ConstraintKind = "ceiling" | "floor";

export interface Node {
  readonly id: NodeId;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly min: number;
  readonly max: number;
  readonly initial: number;
}

export interface CausalEdge {
  readonly kind: "causal";
  readonly id: EdgeId;
  readonly from: NodeId;
  readonly to: NodeId;
  readonly polarity: 1 | -1;
  readonly weight: number; // 0–5, see docs/decisions/DR--20260328--engine--weight-range-expansion.md
  readonly delay: DelayLevel;
  readonly transferFn: "linear";
}

export interface ConstraintEdge {
  readonly kind: "constraint";
  readonly constraintKind: ConstraintKind;
  readonly id: EdgeId;
  readonly from: NodeId;
  readonly to: NodeId;
}

export type Edge = CausalEdge | ConstraintEdge;

export interface Signal {
  readonly id: string;
  readonly edgeId: EdgeId;
  readonly progress: number;
  readonly strength: number;
  readonly hopsRemaining: number;
}

export interface PendingSignal {
  readonly signal: Signal;
  readonly ticksRemaining: number;
}

export interface SimState {
  readonly signals: ReadonlyArray<Signal>;
  readonly pending: ReadonlyArray<PendingSignal>;
  readonly nodeValues: ReadonlyMap<NodeId, number>;
  // Snapshot of nodeValues at the beginning of the current step, used by the
  // renderer for trend display (▲/▼). Captured before arrivals mutate nodeValues.
  readonly displayPrevNodeValues: ReadonlyMap<NodeId, number>;
  readonly tick: number;
}

export interface Graph {
  readonly nodes: ReadonlyArray<Node>;
  readonly edges: ReadonlyArray<Edge>;
}
