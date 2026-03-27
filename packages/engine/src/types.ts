export type NodeId = string & { readonly __brand: 'NodeId' }
export type EdgeId = string & { readonly __brand: 'EdgeId' }

export type DelayLevel = 'none' | 'short' | 'medium' | 'long'
export type EdgeKind = 'causal' | 'constraint'
export type ConstraintKind = 'ceiling' | 'floor'

export interface Node {
  readonly id: NodeId
  readonly label: string
  readonly x: number
  readonly y: number
  readonly radius: number
  readonly min: number
  readonly max: number
  readonly initial: number
}

export interface CausalEdge {
  readonly kind: 'causal'
  readonly id: EdgeId
  readonly from: NodeId
  readonly to: NodeId
  readonly polarity: 1 | -1
  readonly weight: number
  readonly delay: DelayLevel
  readonly transferFn: 'linear'
}

export interface ConstraintEdge {
  readonly kind: 'constraint'
  readonly constraintKind: ConstraintKind
  readonly id: EdgeId
  readonly from: NodeId
  readonly to: NodeId
}

export type Edge = CausalEdge | ConstraintEdge

export interface Signal {
  readonly id: string
  readonly edgeId: EdgeId
  readonly progress: number
  readonly strength: number
}

export interface PendingSignal {
  readonly signal: Signal
  readonly ticksRemaining: number
}

export interface SimState {
  readonly signals: ReadonlyArray<Signal>
  readonly pending: ReadonlyArray<PendingSignal>
  readonly nodeValues: ReadonlyMap<NodeId, number>
  // Snapshot of nodeValues at the end of the previous step, used by the next
  // step() call to compute emit deltas — captures inject() changes that happen
  // between steps. inject() updates nodeValues only; prevNodeValues stays fixed
  // until the next step() settles it.
  readonly prevNodeValues: ReadonlyMap<NodeId, number>
  readonly tick: number
}

export interface Graph {
  readonly nodes: ReadonlyArray<Node>
  readonly edges: ReadonlyArray<Edge>
}
