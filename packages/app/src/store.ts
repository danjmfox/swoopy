import { create } from 'zustand'
import type { Graph, SimState } from '@swoopy/engine'

interface StoreState {
  // graphSlice — React components subscribe to this
  graph: Graph

  // simSlice — RAF reads via getState() each frame; React does NOT subscribe
  sim: SimState
  tickSim: (dt: number) => void
}

export const useStore = create<StoreState>((_set, _get) => ({
  graph: { nodes: [], edges: [] },
  sim: { signals: [], pending: [], nodeValues: new Map(), prevNodeValues: new Map(), tick: 0 },
  tickSim: (_dt: number) => {
    throw new Error('not implemented')
  },
}))
