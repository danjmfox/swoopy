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
  DECAY,
  EMIT_THRESHOLD,
  INJECT_STRENGTH,
  DELAY_TICKS_SHORT,
  DELAY_TICKS_MEDIUM,
  DELAY_TICKS_LONG,
} from './constants.ts'

export { makeInitialSim, step, inject } from './sim.ts'
