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
} from "./types.ts";

export { makeNodeId, makeEdgeId } from "./ids.ts";

export {
  SIGNAL_SPEED,
  INJECT_STRENGTH,
  MAX_SIGNALS,
  EDGE_TRANSIT_TICKS,
  DELAY_TICKS_SHORT,
  DELAY_TICKS_MEDIUM,
  DELAY_TICKS_LONG,
  NODE_SIZE_RADII,
  NODE_COLOURS,
} from "./constants.ts";
export type { SizeTier, ColourTier } from "./constants.ts";

export { makeInitialSim, step, inject } from "./sim.ts";
export { serialize, deserialize } from "./serialisation.ts";
export type { SerializedGraph } from "./serialisation.ts";
