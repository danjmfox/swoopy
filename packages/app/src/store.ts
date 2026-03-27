import { create } from 'zustand'
import type { Graph, SimState } from '@swoopy/engine'
import { makeInitialSim, step } from '@swoopy/engine'
import { seedGraph } from './seed.ts'

interface StoreState {
  // graphSlice — React components subscribe to this
  graph: Graph

  // simSlice — RAF reads via getState() each frame; React does NOT subscribe
  sim: SimState
  tickSim: (dt: number) => void
}

export const useStore = create<StoreState>((set, get) => ({
  graph: seedGraph,
  sim: makeInitialSim(seedGraph),
  tickSim: (dt: number) => {
    const { graph, sim } = get()
    set({ sim: step(graph, sim, dt) })
  },
}))
