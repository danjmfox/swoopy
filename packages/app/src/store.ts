import { create } from 'zustand'
import type { Graph, SimState, NodeId } from '@swoopy/engine'
import { makeInitialSim, makeNodeId, makeEdgeId, step } from '@swoopy/engine'
import { seedGraph } from './seed.ts'

interface StoreState {
  // graphSlice — React components subscribe to this
  graph: Graph

  // simSlice — RAF reads via getState() each frame; React does NOT subscribe
  sim: SimState
  tickSim: (dt: number) => void

  // Edit actions
  addNode: (x: number, y: number) => void
  addEdge: (from: NodeId, to: NodeId) => void
  deleteNode: (id: NodeId) => void
}

export const useStore = create<StoreState>((set, get) => ({
  graph: seedGraph,
  sim: makeInitialSim(seedGraph),
  tickSim: (dt: number) => {
    const { graph, sim } = get()
    set({ sim: step(graph, sim, dt) })
  },
  addNode: (x: number, y: number) => {
    const { graph } = get()
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
    set({ graph: { ...graph, nodes: [...graph.nodes, node] } })
  },
  addEdge: (from: NodeId, to: NodeId) => {
    const { graph } = get()
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
    set({ graph: { ...graph, edges: [...graph.edges, edge] } })
  },
  deleteNode: (id: NodeId) => {
    const { graph } = get()
    set({
      graph: {
        nodes: graph.nodes.filter((n) => n.id !== id),
        edges: graph.edges.filter((e) => e.from !== id && e.to !== id),
      },
    })
  },
}))
