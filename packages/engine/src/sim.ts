import type { Graph, SimState, NodeId } from './types.ts'

export function makeInitialSim(_graph: Graph): SimState {
  throw new Error('not implemented')
}

export function step(_graph: Graph, _sim: SimState, _dt: number): SimState {
  throw new Error('not implemented')
}

export function inject(_sim: SimState, _nodeId: NodeId, _strength: number): SimState {
  throw new Error('not implemented')
}
