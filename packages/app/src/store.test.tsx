import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useStore } from './store.ts'
import { seedGraph } from './seed.ts'

// Component subscribing to graphSlice only — must never re-render from sim ticks
function GraphView() {
  const nodeCount = useStore((s) => s.graph.nodes.length)
  return <span data-testid="count">{nodeCount}</span>
}

// SI-07 prerequisite
describe('store initialisation', () => {
  it('loads the seed graph with all three nodes', () => {
    const { graph } = useStore.getState()
    expect(graph.nodes).toHaveLength(3)
    expect(graph.nodes.map((n) => n.label)).toContain('Population')
  })

  it('initialises sim node values from graph.initial fields', () => {
    const { sim, graph } = useStore.getState()
    for (const node of graph.nodes) {
      expect(sim.nodeValues.get(node.id)).toBe(node.initial)
    }
  })
})

describe('GE-01: addNode', () => {
  beforeEach(() => {
    useStore.setState({ graph: { nodes: [], edges: [] } })
  })

  it('adds a node at the given coordinates to graph.nodes', () => {
    useStore.getState().addNode(200, 300)
    const { graph } = useStore.getState()
    expect(graph.nodes).toHaveLength(1)
    expect(graph.nodes[0].x).toBe(200)
    expect(graph.nodes[0].y).toBe(300)
    expect(graph.nodes[0].label).toBeTruthy()
  })
})

describe('Zustand slice boundary — PRD §5.1, §6.2', () => {
  beforeEach(() => {
    useStore.setState({
      graph: { nodes: [], edges: [] },
      sim: { signals: [], pending: [], nodeValues: new Map(), prevNodeValues: new Map(), tick: 0 },
    })
  })

  it('sim ticks via tickSim do not re-render React components subscribed to graphSlice', () => {
    let renders = 0

    function Counted() {
      renders++
      return <GraphView />
    }

    render(<Counted />)
    expect(renders).toBe(1)

    act(() => {
      useStore.getState().tickSim(1 / 60)
      useStore.getState().tickSim(1 / 60)
      useStore.getState().tickSim(1 / 60)
    })

    expect(renders).toBe(1)
  })
})
