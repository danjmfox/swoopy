import type { NodeId, EdgeId, AnnotationId, ModulatorId } from "./types.ts";

export function makeNodeId(id: string): NodeId {
  return id as NodeId;
}

export function makeEdgeId(id: string): EdgeId {
  return id as EdgeId;
}

export function makeAnnotationId(id: string): AnnotationId {
  return id as AnnotationId;
}

export function makeModulatorId(id: string): ModulatorId {
  return id as ModulatorId;
}
