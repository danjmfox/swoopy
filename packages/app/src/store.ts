import { create } from 'zustand'
import type { Graph, SimState, NodeId, Node } from '@swoopy/engine'
import { makeInitialSim, makeNodeId, makeEdgeId, step, serialize, deserialize } from '@swoopy/engine'
import { seedGraph } from './seed.ts'

const LS_KEY = 'swoopy_graph'

function persist(graph: Graph) {
  localStorage.setItem(LS_KEY, JSON.stringify(serialize(graph)))
}

interface StoreState {
  // graphSlice — React components subscribe to this
  graph: Graph
  past: Graph[]
  future: Graph[]
  simRunning: boolean
  simSpeed: number

  // simSlice — RAF reads via getState() each frame; React does NOT subscribe
  sim: SimState
  tickSim: (dt: number) => void

  // Edit actions
  addNode: (x: number, y: number) => void
  addEdge: (from: NodeId, to: NodeId) => void
  deleteNode: (id: NodeId) => void
  updateNode: (id: NodeId, patch: Partial<Pick<Node, 'label' | 'min' | 'max' | 'initial'>>) => void
  undo: () => void
  redo: () => void

  // Editor UI state
  editingNodeId: NodeId | null
  openNodeEditor: (id: NodeId) => void
  closeNodeEditor: () => void

  // Simulation controls
  pauseSim: () => void
  resumeSim: () => void
  resetSim: () => void
  setSimSpeed: (speed: number) => void

  // Persistence
  loadPersistedGraph: () => void
  shareGraph: () => Promise<void>
  loadFromUrl: (search: string) => void
}

export const useStore = create<StoreState>((set, get) => ({
  graph: seedGraph,
  past: [],
  future: [],
  simRunning: true,
  simSpeed: 1,
  editingNodeId: null,
  openNodeEditor: (id) => set({ editingNodeId: id }),
  closeNodeEditor: () => set({ editingNodeId: null }),
  sim: makeInitialSim(seedGraph),
  tickSim: (dt: number) => {
    const { graph, sim } = get()
    set({ sim: step(graph, sim, dt) })
  },
  addNode: (x: number, y: number) => {
    const { graph, past } = get()
    const node = {
      id: makeNodeId(crypto.randomUUID()),
      label: 'New Node',
      x,
      y,
      radius: 50,
      min: 0,
      max: 10,
      initial: 5,
    }
    const next = { ...graph, nodes: [...graph.nodes, node] }
    set({ past: [...past, graph], future: [], graph: next })
    persist(next)
  },
  addEdge: (from: NodeId, to: NodeId) => {
    const { graph, past } = get()
    const duplicate = graph.edges.some((e) => e.kind === 'causal' && e.from === from && e.to === to)
    if (duplicate) return
    const edge = {
      kind: 'causal' as const,
      id: makeEdgeId(crypto.randomUUID()),
      from,
      to,
      polarity: 1 as const,
      weight: 1.0,
      delay: 'none' as const,
      transferFn: 'linear' as const,
    }
    const next = { ...graph, edges: [...graph.edges, edge] }
    set({ past: [...past, graph], future: [], graph: next })
    persist(next)
  },
  updateNode: (id: NodeId, patch) => {
    const { graph, past } = get()
    const next = {
      ...graph,
      nodes: graph.nodes.map((n) => {
        if (n.id !== id) return n
        const min = patch.min ?? n.min
        const max = patch.max ?? n.max
        const initial = Math.min(max, Math.max(min, patch.initial ?? n.initial))
        return { ...n, ...patch, min, max, initial }
      }),
    }
    set({ past: [...past, graph], future: [], graph: next })
    persist(next)
  },
  deleteNode: (id: NodeId) => {
    const { graph, past } = get()
    const next = {
      nodes: graph.nodes.filter((n) => n.id !== id),
      edges: graph.edges.filter((e) => e.from !== id && e.to !== id),
    }
    set({ past: [...past, graph], future: [], graph: next })
    persist(next)
  },
  undo: () => {
    const { graph, past, future } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    set({ graph: previous, past: past.slice(0, -1), future: [graph, ...future] })
    persist(previous)
  },
  redo: () => {
    const { graph, past, future } = get()
    if (future.length === 0) return
    const next = future[0]
    set({ graph: next, past: [...past, graph], future: future.slice(1) })
    persist(next)
  },
  pauseSim: () => set({ simRunning: false }),
  resumeSim: () => set({ simRunning: true }),
  resetSim: () => {
    const { graph } = get()
    set({ sim: makeInitialSim(graph) })
  },
  setSimSpeed: (speed: number) => set({ simSpeed: speed }),
  shareGraph: async () => {
    const { graph } = get()
    const encoded = btoa(JSON.stringify(serialize(graph)))
    const url = new URL(window.location.href)
    url.searchParams.set('g', encoded)
    await navigator.clipboard.writeText(url.toString())
  },
  loadFromUrl: (search: string) => {
    const encoded = new URLSearchParams(search).get('g')
    if (!encoded) return
    try {
      const graph = deserialize(JSON.parse(atob(encoded)))
      set({ graph, past: [], future: [] })
    } catch {
      // malformed param — leave current graph intact
    }
  },
  loadPersistedGraph: () => {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    try {
      const graph = deserialize(JSON.parse(raw))
      set({ graph, past: [], future: [] })
    } catch {
      // corrupted storage — leave current graph intact
    }
  },
}))
