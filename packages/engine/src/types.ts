import type { ColourTier, SizeTier } from "./constants.js";

export type NodeId = string & { readonly __brand: "NodeId" };
export type EdgeId = string & { readonly __brand: "EdgeId" };
export type AnnotationId = string & { readonly __brand: "AnnotationId" };
export type ModulatorId = string & { readonly __brand: "ModulatorId" };

export interface Annotation {
  readonly id: AnnotationId;
  readonly x: number;
  readonly y: number;
  readonly text: string;
}

export type NodeRole = "lever" | "outcome";

export type DelayLevel = "none" | "short" | "medium" | "long";
export type EdgeKind = "causal" | "constraint";
export type ConstraintKind = "ceiling" | "floor";

export interface Node {
  readonly id: NodeId;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly sizeTier: SizeTier;
  readonly colourTier: ColourTier;
  readonly annotation?: string;
  readonly min: number;
  readonly max: number;
  readonly initial: number;
  readonly role?: NodeRole;
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
  readonly isQuickFix?: boolean;
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
  readonly sign: 1 | -1; // accumulated polarity chain — DR--20260408--engine--signal-direction
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

export interface Modulator {
  readonly id: ModulatorId;
  readonly from: NodeId;
  readonly target: EdgeId;
  readonly polarity: 1 | -1;
}

export interface Graph {
  readonly nodes: ReadonlyArray<Node>;
  readonly edges: ReadonlyArray<Edge>;
  readonly annotations: ReadonlyArray<Annotation>;
  readonly modulators: ReadonlyArray<Modulator>;
}
