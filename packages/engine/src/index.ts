export type {
  NodeId,
  EdgeId,
  DelayLevel,
  EdgeKind,
  ConstraintKind,
  Node,
  CausalEdge,
  ConstraintEdge,
  Edge,
  Signal,
  PendingSignal,
  SimState,
  Graph,
} from './types.ts'

export { makeNodeId, makeEdgeId } from './ids.ts'

export {
  SIGNAL_SPEED,
  EMIT_THRESHOLD,
  INJECT_STRENGTH,
  MAX_SIGNALS,
  DELAY_TICKS_SHORT,
  DELAY_TICKS_MEDIUM,
  DELAY_TICKS_LONG,
} from './constants.ts'

export { makeInitialSim, step, inject } from './sim.ts'
export { serialize, deserialize } from './serialisation.ts'
export type { SerializedGraph } from './serialisation.ts'
