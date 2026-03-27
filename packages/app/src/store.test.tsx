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

describe('GE-04 / GE-06 / GE-07: addEdge', () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph })
  })

  it('adds a directed edge between two existing nodes with default reinforcing polarity', () => {
    const { graph } = useStore.getState()
    const from = graph.nodes[0].id
    const to = graph.nodes[1].id
    const edgesBefore = graph.edges.length

    useStore.getState().addEdge(from, to)

    const updated = useStore.getState().graph
    expect(updated.edges).toHaveLength(edgesBefore + 1)
    const edge = updated.edges[updated.edges.length - 1]
    expect(edge.kind).toBe('causal')
    if (edge.kind === 'causal') {
      expect(edge.from).toBe(from)
      expect(edge.to).toBe(to)
      expect(edge.polarity).toBe(1)
    }
  })
})

describe('GE-09: deleteNode', () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph })
  })

  it('removes the node and all edges connected to it', () => {
    const { graph } = useStore.getState()
    const target = graph.nodes[0] // Population — connected to all 4 edges

    useStore.getState().deleteNode(target.id)

    const updated = useStore.getState().graph
    expect(updated.nodes.find((n) => n.id === target.id)).toBeUndefined()
    expect(updated.edges.every((e) => e.from !== target.id && e.to !== target.id)).toBe(true)
  })
})

describe('GE-21: undo', () => {
  beforeEach(() => {
    useStore.setState({ graph: { nodes: [], edges: [] } })
  })

  it('restores the graph to its state before the last mutation', () => {
    useStore.getState().addNode(100, 100)
    useStore.getState().undo()
    expect(useStore.getState().graph.nodes).toHaveLength(0)
  })
})

describe('GE-22: redo', () => {
  beforeEach(() => {
    useStore.setState({ graph: { nodes: [], edges: [] } })
  })

  it('reapplies the last undone mutation', () => {
    useStore.getState().addNode(100, 100)
    useStore.getState().undo()
    useStore.getState().redo()
    expect(useStore.getState().graph.nodes).toHaveLength(1)
  })
})

describe('SE-07: localStorage auto-save', () => {
  beforeEach(() => {
    localStorage.clear()
    useStore.setState({ graph: { nodes: [], edges: [] }, past: [], future: [] })
  })

  it('saves the graph to localStorage under "swoopy_graph" after each mutation', () => {
    useStore.getState().addNode(100, 200)
    const raw = localStorage.getItem('swoopy_graph')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.graph.nodes).toHaveLength(1)
  })

  it('restores graph from localStorage when loadPersistedGraph is called and no URL param is present', () => {
    useStore.getState().addNode(42, 99)
    const saved = useStore.getState().graph

    useStore.setState({ graph: { nodes: [], edges: [] } })
    useStore.getState().loadPersistedGraph()

    const restored = useStore.getState().graph
    expect(restored.nodes).toHaveLength(saved.nodes.length)
    expect(restored.nodes[0].x).toBe(42)
    expect(restored.nodes[0].y).toBe(99)
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
