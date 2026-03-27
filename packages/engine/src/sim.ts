import type { Graph, SimState, NodeId } from './types.ts'

export function makeInitialSim(graph: Graph): SimState {
  return {
    signals: [],
    pending: [],
    nodeValues: new Map(graph.nodes.map((n) => [n.id, n.initial])),
    tick: 0,
  }
}

export function step(_graph: Graph, _sim: SimState, _dt: number): SimState {
  throw new Error('not implemented')
}

export function inject(_sim: SimState, _nodeId: NodeId, _strength: number): SimState {
  throw new Error('not implemented')
}
