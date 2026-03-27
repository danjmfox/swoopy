import type { NodeId, EdgeId } from './types.ts'

export function makeNodeId(id: string): NodeId {
  return id as NodeId
}

export function makeEdgeId(id: string): EdgeId {
  return id as EdgeId
}
