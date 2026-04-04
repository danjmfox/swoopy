import { create } from "zustand";
import type {
  Graph,
  SimState,
  NodeId,
  EdgeId,
  Node,
  DelayLevel,
  ConstraintKind,
  AnnotationId,
} from "@swoopy/engine";

export type AppMode =
  | "select"
  | "add-node"
  | "add-edge"
  | "simulate"
  | "delete"
  | "add-annotation";

// previousMode is non-null while a spring-loaded sub-mode is active.
// Distinct from `transient` (which means "URL-loaded graph, not yet locally saved").

import {
  makeInitialSim,
  makeNodeId,
  makeEdgeId,
  makeAnnotationId,
  step,
  serialize,
  deserialize,
  NODE_SIZE_RADII,
  NODE_COLOURS,
} from "@swoopy/engine";

const DELAY_CYCLE: DelayLevel[] = ["none", "short", "medium", "long"];
import { seedGraph } from "./seed.ts";

const LS_KEY_PREFIX = "swoopy_graph_";

function persist(graph: Graph, id: string) {
  localStorage.setItem(
    `${LS_KEY_PREFIX}${id}`,
    JSON.stringify(serialize(graph)),
  );
}

interface StoreState {
  // graphSlice — React components subscribe to this
  graph: Graph;
  modelId: string;
  transient: boolean;
  past: Graph[];
  future: Graph[];
  simRunning: boolean;
  simSpeed: number;
  mode: AppMode;
  previousMode: AppMode | null;
  setMode: (mode: AppMode) => void;
  enterSpringMode: (mode: AppMode) => void;
  exitSpringMode: () => void;

  // simSlice — RAF reads via getState() each frame; React does NOT subscribe
  sim: SimState;
  tickSim: (dt: number) => void;

  // Edit actions
  addNode: (x: number, y: number) => void;
  addEdge: (from: NodeId, to: NodeId) => void;
  addConstraintEdge: (
    from: NodeId,
    to: NodeId,
    constraintKind: ConstraintKind,
  ) => void;
  deleteNode: (id: NodeId) => void;
  deleteEdge: (id: EdgeId) => void;
  updateNode: (
    id: NodeId,
    patch: Partial<
      Pick<
        Node,
        | "label"
        | "min"
        | "max"
        | "initial"
        | "sizeTier"
        | "colourTier"
        | "annotation"
      >
    >,
  ) => void;
  moveNode: (id: NodeId, x: number, y: number) => void;
  nudgeNode: (id: NodeId, dx: number, dy: number) => void;
  togglePolarity: (edgeId: EdgeId) => void;
  cycleDelay: (edgeId: EdgeId) => void;
  setEdgeWeight: (edgeId: EdgeId, weight: number) => void;
  toggleEdgeQuickFix: (edgeId: EdgeId) => void;
  undo: () => void;
  redo: () => void;

  // Keyboard focus
  focusedNodeId: NodeId | null;
  setFocusedNode: (id: NodeId | null) => void;
  focusNextNode: () => void;

  // Ephemeral drag state (not persisted, not in undo history)
  dragPosition: { nodeId: NodeId; x: number; y: number } | null;
  setDragPosition: (nodeId: NodeId, x: number, y: number) => void;
  annotationDragPosition: { id: AnnotationId; x: number; y: number } | null;
  setAnnotationDragPosition: (id: AnnotationId, x: number, y: number) => void;

  // Ephemeral hover state (not persisted)
  hoveredEdgeRegion: { edgeId: EdgeId; region: "delay" | "weight" } | null;
  setHoveredEdgeRegion: (
    region: { edgeId: EdgeId; region: "delay" | "weight" } | null,
  ) => void;

  // Constraint edge pending state
  pendingConstraintEdge: { from: NodeId; to: NodeId } | null;
  setPendingConstraintEdge: (from: NodeId, to: NodeId) => void;
  confirmConstraintEdge: (kind: ConstraintKind) => void;
  cancelConstraintEdge: () => void;

  // Annotation actions
  addAnnotation: (x: number, y: number) => AnnotationId;
  deleteAnnotation: (id: AnnotationId) => void;
  moveAnnotation: (id: AnnotationId, x: number, y: number) => void;
  updateAnnotation: (id: AnnotationId, text: string) => void;
  editingAnnotationId: AnnotationId | null;
  openAnnotationEditor: (id: AnnotationId) => void;
  closeAnnotationEditor: () => void;

  // Editor UI state
  editingNodeId: NodeId | null;
  openNodeEditor: (id: NodeId) => void;
  closeNodeEditor: () => void;
  editingEdgeId: EdgeId | null;
  openEdgeWeightEditor: (id: EdgeId) => void;
  closeEdgeWeightEditor: () => void;

  // Simulation controls
  pauseSim: () => void;
  resumeSim: () => void;
  resetSim: () => void;
  setSimSpeed: (speed: number) => void;

  // History overlay
  showHistory: boolean;
  toggleHistory: () => void;
  historySeq: number;
  incrementHistorySeq: () => void;

  // Persistence
  loadPersistedGraph: () => void;
  shareGraph: () => Promise<void>;
  loadFromUrl: (search: string) => void;
  newModel: () => void;
}

type Get = () => StoreState;
type Set = (partial: Partial<StoreState>) => void;

function commitGraph(
  get: Get,
  set: Set,
  next: Graph,
  extra?: Partial<StoreState>,
): void {
  const { graph: prev, past } = get();
  const modelId = forkIfTransient(get, set);
  set({ past: [...past, prev], future: [], graph: next, ...extra });
  persist(next, modelId);
}

function forkIfTransient(get: Get, set: Set): string {
  const { transient, modelId } = get();
  if (!transient) return modelId;
  const newId = crypto.randomUUID();
  set({ transient: false, modelId: newId });
  const url = new URL(window.location.href);
  url.searchParams.delete("g");
  url.searchParams.set("m", newId);
  history.replaceState(null, "", url.toString());
  return newId;
}

export const useStore = create<StoreState>((set, get) => ({
  graph: seedGraph,
  modelId: crypto.randomUUID(),
  transient: false,
  past: [],
  future: [],
  simRunning: true,
  simSpeed: 1,
  mode: "select" as AppMode,
  previousMode: null as AppMode | null,
  setMode: (m: AppMode) => set({ mode: m, previousMode: null }),
  enterSpringMode: (m: AppMode) => {
    const { mode } = get();
    set({ previousMode: mode, mode: m });
  },
  exitSpringMode: () => {
    const { previousMode } = get();
    if (previousMode === null) return;
    set({ mode: previousMode, previousMode: null });
  },
  dragPosition: null as { nodeId: NodeId; x: number; y: number } | null,
  setDragPosition: (nodeId: NodeId, x: number, y: number) =>
    set({ dragPosition: { nodeId, x, y } }),
  annotationDragPosition: null as {
    id: AnnotationId;
    x: number;
    y: number;
  } | null,
  setAnnotationDragPosition: (id: AnnotationId, x: number, y: number) =>
    set({ annotationDragPosition: { id, x, y } }),
  hoveredEdgeRegion: null as {
    edgeId: EdgeId;
    region: "delay" | "weight";
  } | null,
  setHoveredEdgeRegion: (
    region: { edgeId: EdgeId; region: "delay" | "weight" } | null,
  ) => set({ hoveredEdgeRegion: region }),
  pendingConstraintEdge: null as { from: NodeId; to: NodeId } | null,
  setPendingConstraintEdge: (from: NodeId, to: NodeId) =>
    set({ pendingConstraintEdge: { from, to } }),
  confirmConstraintEdge: (kind: ConstraintKind) => {
    const { pendingConstraintEdge } = get();
    if (!pendingConstraintEdge) return;
    get().addConstraintEdge(
      pendingConstraintEdge.from,
      pendingConstraintEdge.to,
      kind,
    );
    set({ pendingConstraintEdge: null });
  },
  cancelConstraintEdge: () => set({ pendingConstraintEdge: null }),
  focusedNodeId: null as NodeId | null,
  setFocusedNode: (id) => set({ focusedNodeId: id }),
  focusNextNode: () => {
    const { graph, focusedNodeId } = get();
    const nodes = graph.nodes;
    if (nodes.length === 0) return;
    const idx = nodes.findIndex((n) => n.id === focusedNodeId);
    set({ focusedNodeId: nodes[(idx + 1) % nodes.length]!.id });
  },
  addAnnotation: (x: number, y: number) => {
    const { graph } = get();
    const id = makeAnnotationId(crypto.randomUUID());
    const next = { ...graph, annotations: [...graph.annotations, { id, x, y, text: "" }] };
    commitGraph(get, set, next);
    return id;
  },
  deleteAnnotation: (id: AnnotationId) => {
    const { graph } = get();
    commitGraph(get, set, {
      ...graph,
      annotations: graph.annotations.filter((a) => a.id !== id),
    });
  },
  moveAnnotation: (id: AnnotationId, x: number, y: number) => {
    const { graph } = get();
    commitGraph(
      get,
      set,
      { ...graph, annotations: graph.annotations.map((a) => (a.id === id ? { ...a, x, y } : a)) },
      { annotationDragPosition: null },
    );
  },
  updateAnnotation: (id: AnnotationId, text: string) => {
    const { graph } = get();
    commitGraph(get, set, {
      ...graph,
      annotations: graph.annotations.map((a) => (a.id === id ? { ...a, text } : a)),
    });
  },
  editingAnnotationId: null as AnnotationId | null,
  openAnnotationEditor: (id: AnnotationId) => set({ editingAnnotationId: id }),
  closeAnnotationEditor: () => set({ editingAnnotationId: null }),
  editingNodeId: null,
  openNodeEditor: (id) => set({ editingNodeId: id }),
  closeNodeEditor: () => set({ editingNodeId: null }),
  editingEdgeId: null as EdgeId | null,
  openEdgeWeightEditor: (id) => set({ editingEdgeId: id }),
  closeEdgeWeightEditor: () => set({ editingEdgeId: null }),
  sim: makeInitialSim(seedGraph),
  tickSim: (dt: number) => {
    const { graph, sim } = get();
    set({ sim: step(graph, sim, dt) });
  },
  addNode: (x: number, y: number) => {
    const { graph } = get();
    const node = {
      id: makeNodeId(crypto.randomUUID()),
      label: "New Node",
      x,
      y,
      radius: NODE_SIZE_RADII.m,
      sizeTier: "m" as const,
      colourTier: "blue" as const,
      min: 0,
      max: 10,
      initial: 5,
    };
    commitGraph(get, set, { ...graph, nodes: [...graph.nodes, node] });
  },
  addEdge: (from: NodeId, to: NodeId) => {
    const { graph } = get();
    const hasNormal = graph.edges.some(
      (e) => e.kind === "causal" && e.from === from && e.to === to && !e.isQuickFix,
    );
    const hasQF = graph.edges.some(
      (e) => e.kind === "causal" && e.from === from && e.to === to && e.isQuickFix,
    );
    if (hasNormal && hasQF) return;
    const edge = {
      kind: "causal" as const,
      id: makeEdgeId(crypto.randomUUID()),
      from,
      to,
      polarity: 1 as const,
      weight: 1.0,
      delay: "none" as const,
      transferFn: "linear" as const,
      ...(hasNormal ? { isQuickFix: true as const } : {}),
    };
    commitGraph(get, set, { ...graph, edges: [...graph.edges, edge] });
  },
  addConstraintEdge: (from: NodeId, to: NodeId, constraintKind: ConstraintKind) => {
    const { graph } = get();
    const duplicate = graph.edges.some(
      (e) =>
        e.kind === "constraint" &&
        e.from === from &&
        e.to === to &&
        e.constraintKind === constraintKind,
    );
    if (duplicate) return;
    const edge = {
      kind: "constraint" as const,
      id: makeEdgeId(crypto.randomUUID()),
      from,
      to,
      constraintKind,
    };
    commitGraph(get, set, { ...graph, edges: [...graph.edges, edge] });
  },
  togglePolarity: (edgeId) => {
    const { graph } = get();
    commitGraph(get, set, {
      ...graph,
      edges: graph.edges.map((e) =>
        e.id === edgeId && e.kind === "causal"
          ? { ...e, polarity: (e.polarity === 1 ? -1 : 1) as 1 | -1 }
          : e,
      ),
    });
  },
  cycleDelay: (edgeId) => {
    const { graph } = get();
    commitGraph(get, set, {
      ...graph,
      edges: graph.edges.map((e) => {
        if (e.id !== edgeId || e.kind !== "causal") return e;
        const idx = DELAY_CYCLE.indexOf(e.delay);
        return { ...e, delay: DELAY_CYCLE[(idx + 1) % DELAY_CYCLE.length]! };
      }),
    });
  },
  setEdgeWeight: (edgeId, weight) => {
    const { graph } = get();
    const clamped = Math.min(5, Math.max(0, weight));
    commitGraph(get, set, {
      ...graph,
      edges: graph.edges.map((e) =>
        e.id === edgeId && e.kind === "causal" ? { ...e, weight: clamped } : e,
      ),
    });
  },
  toggleEdgeQuickFix: (edgeId) => {
    const { graph } = get();
    const edge = graph.edges.find((e) => e.id === edgeId && e.kind === "causal");
    if (!edge || edge.kind !== "causal") return;
    const targetQF = !edge.isQuickFix;
    const conflict = graph.edges.some(
      (e) =>
        e.kind === "causal" &&
        e.from === edge.from &&
        e.to === edge.to &&
        !!e.isQuickFix === targetQF,
    );
    if (conflict) return;
    commitGraph(get, set, {
      ...graph,
      edges: graph.edges.map((e) =>
        e.id === edgeId && e.kind === "causal" ? { ...e, isQuickFix: targetQF } : e,
      ),
    });
  },
  updateNode: (id: NodeId, patch) => {
    const { graph } = get();
    commitGraph(get, set, {
      ...graph,
      nodes: graph.nodes.map((n) => {
        if (n.id !== id) return n;
        const min = patch.min ?? n.min;
        const max = patch.max ?? n.max;
        const initial = Math.min(max, Math.max(min, patch.initial ?? n.initial));
        const radius = patch.sizeTier != null ? NODE_SIZE_RADII[patch.sizeTier] : n.radius;
        return { ...n, ...patch, min, max, initial, radius };
      }),
    });
  },
  moveNode: (id: NodeId, x: number, y: number) => {
    const { graph } = get();
    commitGraph(
      get,
      set,
      { ...graph, nodes: graph.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) },
      { dragPosition: null },
    );
  },
  nudgeNode: (id: NodeId, dx: number, dy: number) => {
    const { graph } = get();
    commitGraph(get, set, {
      ...graph,
      nodes: graph.nodes.map((n) => (n.id === id ? { ...n, x: n.x + dx, y: n.y + dy } : n)),
    });
  },
  deleteNode: (id: NodeId) => {
    const { graph } = get();
    commitGraph(get, set, {
      ...graph,
      nodes: graph.nodes.filter((n) => n.id !== id),
      edges: graph.edges.filter((e) => e.from !== id && e.to !== id),
    });
  },
  deleteEdge: (id: EdgeId) => {
    const { graph } = get();
    commitGraph(get, set, { ...graph, edges: graph.edges.filter((e) => e.id !== id) });
  },
  undo: () => {
    const { graph, past, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1]!;
    const modelId = forkIfTransient(get, set);
    set({ graph: previous, past: past.slice(0, -1), future: [graph, ...future] });
    persist(previous, modelId);
  },
  redo: () => {
    const { graph, past, future } = get();
    if (future.length === 0) return;
    const next = future[0]!;
    const modelId = forkIfTransient(get, set);
    set({ graph: next, past: [...past, graph], future: future.slice(1) });
    persist(next, modelId);
  },
  showHistory: false,
  toggleHistory: () => set({ showHistory: !get().showHistory }),
  historySeq: 0,
  incrementHistorySeq: () => set({ historySeq: get().historySeq + 1 }),
  pauseSim: () => set({ simRunning: false }),
  resumeSim: () => set({ simRunning: true }),
  resetSim: () => {
    const { graph } = get();
    set({ sim: makeInitialSim(graph) });
  },
  setSimSpeed: (speed: number) => set({ simSpeed: speed }),
  shareGraph: async () => {
    const { graph } = get();
    const json = JSON.stringify(serialize(graph));
    const bytes = new TextEncoder().encode(json);
    const encoded = btoa(String.fromCharCode(...bytes));
    const url = new URL(window.location.href);
    url.searchParams.set("g", encoded);
    await navigator.clipboard.writeText(url.toString());
  },
  loadFromUrl: (search: string) => {
    const encoded = new URLSearchParams(search).get("g");
    if (!encoded) return;
    try {
      const binary = atob(encoded);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const json = new TextDecoder().decode(bytes);
      const graph = deserialize(JSON.parse(json));
      set({ graph, past: [], future: [], transient: true });
    } catch {
      // malformed param — leave current graph intact
    }
  },
  newModel: () => {
    const newId = crypto.randomUUID();
    const emptyGraph: Graph = { nodes: [], edges: [], annotations: [] };
    persist(emptyGraph, newId);
    localStorage.setItem("swoopy_current_model", newId);
    const url = new URL(window.location.href);
    url.searchParams.delete("g");
    url.searchParams.set("m", newId);
    history.replaceState(null, "", url.toString());
    set({
      graph: emptyGraph,
      modelId: newId,
      transient: false,
      past: [],
      future: [],
      sim: makeInitialSim(emptyGraph),
    });
  },
  loadPersistedGraph: () => {
    // Legacy migration: single-slot key → scoped key
    const legacy = localStorage.getItem("swoopy_graph");
    if (legacy) {
      const newId = crypto.randomUUID();
      localStorage.setItem(`${LS_KEY_PREFIX}${newId}`, legacy);
      localStorage.removeItem("swoopy_graph");
      set({ modelId: newId });
      localStorage.setItem("swoopy_current_model", newId);
      try {
        const graph = deserialize(JSON.parse(legacy));
        set({ graph, past: [], future: [] });
      } catch {
        // corrupted legacy data — leave current graph intact
      }
      return;
    }
    const { modelId } = get();
    localStorage.setItem("swoopy_current_model", modelId);
    const raw = localStorage.getItem(`${LS_KEY_PREFIX}${modelId}`);
    if (!raw) return;
    try {
      const graph = deserialize(JSON.parse(raw));
      set({ graph, past: [], future: [] });
    } catch {
      // corrupted storage — leave current graph intact
    }
  },
}));
