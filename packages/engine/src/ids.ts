import type { NodeId, EdgeId, AnnotationId } from "./types.ts";

export function makeNodeId(id: string): NodeId {
  return id as NodeId;
}

export function makeEdgeId(id: string): EdgeId {
  return id as EdgeId;
}

export function makeAnnotationId(id: string): AnnotationId {
  return id as AnnotationId;
}
