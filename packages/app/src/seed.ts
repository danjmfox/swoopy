import { makeNodeId, makeEdgeId } from '@swoopy/engine'
import type { Graph } from '@swoopy/engine'

const popId = makeNodeId('population')
const birthsId = makeNodeId('births')
const deathsId = makeNodeId('deaths')

// PRD Appendix A — Population/Births/Deaths (Limits to Growth archetype)
export const seedGraph: Graph = {
  nodes: [
    { id: popId,     label: 'Population', x: 400, y: 300, radius: 50, min: 0, max: 10, initial: 5 },
    { id: birthsId,  label: 'Births',     x: 650, y: 150, radius: 50, min: 0, max: 10, initial: 0 },
    { id: deathsId,  label: 'Deaths',     x: 650, y: 450, radius: 50, min: 0, max: 10, initial: 0 },
  ],
  edges: [
    { kind: 'causal', id: makeEdgeId('pop-births'),   from: popId,    to: birthsId, polarity:  1, weight: 1, delay: 'none', transferFn: 'linear' },
    { kind: 'causal', id: makeEdgeId('births-pop'),   from: birthsId, to: popId,    polarity:  1, weight: 1, delay: 'none', transferFn: 'linear' },
    { kind: 'causal', id: makeEdgeId('pop-deaths'),   from: popId,    to: deathsId, polarity:  1, weight: 1, delay: 'none', transferFn: 'linear' },
    { kind: 'causal', id: makeEdgeId('deaths-pop'),   from: deathsId, to: popId,    polarity: -1, weight: 1, delay: 'none', transferFn: 'linear' },
  ],
}

export { popId }
