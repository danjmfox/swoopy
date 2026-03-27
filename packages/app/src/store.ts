import { create } from 'zustand'
import type { Graph, SimState, NodeId } from '@swoopy/engine'
import { makeInitialSim, makeNodeId, makeEdgeId, step } from '@swoopy/engine'
import { seedGraph } from './seed.ts'

interface StoreState {
  // graphSlice — React components subscribe to this
  graph: Graph
  past: Graph[]
  future: Graph[]

  // simSlice — RAF reads via getState() each frame; React does NOT subscribe
  sim: SimState
  tickSim: (dt: number) => void

  // Edit actions
  addNode: (x: number, y: number) => void
  addEdge: (from: NodeId, to: NodeId) => void
  deleteNode: (id: NodeId) => void
  undo: () => void
  redo: () => void
}

export const useStore = create<StoreState>((set, get) => ({
  graph: seedGraph,
  past: [],
  future: [],
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
    set({ past: [...past, graph], future: [], graph: { ...graph, nodes: [...graph.nodes, node] } })
  },
  addEdge: (from: NodeId, to: NodeId) => {
    const { graph, past } = get()
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
    set({ past: [...past, graph], future: [], graph: { ...graph, edges: [...graph.edges, edge] } })
  },
  deleteNode: (id: NodeId) => {
    const { graph, past } = get()
    set({
      past: [...past, graph],
      future: [],
      graph: {
        nodes: graph.nodes.filter((n) => n.id !== id),
        edges: graph.edges.filter((e) => e.from !== id && e.to !== id),
      },
    })
  },
  undo: () => {
    const { graph, past, future } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    set({ graph: previous, past: past.slice(0, -1), future: [graph, ...future] })
  },
  redo: () => {
    const { graph, past, future } = get()
    if (future.length === 0) return
    const next = future[0]
    set({ graph: next, past: [...past, graph], future: future.slice(1) })
  },
}))
