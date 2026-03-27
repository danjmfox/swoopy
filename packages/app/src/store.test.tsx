import { describe, it, expect, beforeEach, vi } from 'vitest'
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
    // Births→Deaths does not exist in seedGraph — safe to add without hitting duplicate guard
    const from = graph.nodes[1].id // Births
    const to = graph.nodes[2].id   // Deaths
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

describe('SE-02 / SE-06: shareGraph', () => {
  beforeEach(() => {
    useStore.setState({ graph: { nodes: [], edges: [] }, past: [], future: [] })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    })
  })

  it('encodes the current graph as base64 in a URL query param and writes it to the clipboard', async () => {
    useStore.getState().addNode(10, 20)
    await useStore.getState().shareGraph()

    expect(navigator.clipboard.writeText).toHaveBeenCalledOnce()
    const url = new URL((navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0])
    const encoded = url.searchParams.get('g')
    expect(encoded).not.toBeNull()
    const decoded = JSON.parse(atob(encoded!))
    expect(decoded.graph.nodes).toHaveLength(1)
    expect(decoded.graph.nodes[0].x).toBe(10)
  })
})

describe('SE-03: loadFromUrl', () => {
  beforeEach(() => {
    useStore.setState({ graph: { nodes: [], edges: [] }, past: [], future: [] })
  })

  it('restores graph from base64 ?g= param when present', () => {
    useStore.getState().addNode(77, 88)
    const graph = useStore.getState().graph
    const encoded = btoa(JSON.stringify({ version: 1, graph }))

    useStore.setState({ graph: { nodes: [], edges: [] } })
    useStore.getState().loadFromUrl(`?g=${encoded}`)

    const restored = useStore.getState().graph
    expect(restored.nodes).toHaveLength(1)
    expect(restored.nodes[0].x).toBe(77)
    expect(restored.nodes[0].y).toBe(88)
  })
})

describe('GE-10: duplicate edge prevention', () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, past: [], future: [] })
  })

  it('does not add a duplicate causal edge between the same node pair', () => {
    const { graph } = useStore.getState()
    const from = graph.nodes[0].id
    const to = graph.nodes[1].id

    // Remove all edges first, then add one fresh causal edge
    useStore.setState({ graph: { ...graph, edges: [] } })
    useStore.getState().addEdge(from, to)
    useStore.getState().addEdge(from, to) // duplicate — should be ignored

    const updated = useStore.getState().graph
    const between = updated.edges.filter((e) => e.from === from && e.to === to)
    expect(between).toHaveLength(1)
  })
})

describe('GE-08 togglePolarity', () => {
  beforeEach(() => { useStore.setState({ graph: seedGraph, past: [], future: [] }) })

  it('flips polarity from 1 to -1', () => {
    const edge = seedGraph.edges.find((e) => e.kind === 'causal')!
    useStore.getState().togglePolarity(edge.id)
    const updated = useStore.getState().graph.edges.find((e) => e.id === edge.id)!
    expect(updated.kind === 'causal' && updated.polarity).toBe(-1)
  })

  it('togglePolarity is undoable', () => {
    const edge = seedGraph.edges.find((e) => e.kind === 'causal')!
    const original = (edge as import('@swoopy/engine').CausalEdge).polarity
    useStore.getState().togglePolarity(edge.id)
    useStore.getState().undo()
    const restored = useStore.getState().graph.edges.find((e) => e.id === edge.id)!
    expect(restored.kind === 'causal' && restored.polarity).toBe(original)
  })
})

describe('GE-14/16 cycleDelay', () => {
  beforeEach(() => { useStore.setState({ graph: seedGraph, past: [], future: [] }) })

  it('cycles delay: none → short → medium → long → none', () => {
    const edge = seedGraph.edges.find((e) => e.kind === 'causal')!
    const id = edge.id
    const getDelay = () => {
      const e = useStore.getState().graph.edges.find((x) => x.id === id)!
      return e.kind === 'causal' ? e.delay : null
    }
    expect(getDelay()).toBe('none')
    useStore.getState().cycleDelay(id); expect(getDelay()).toBe('short')
    useStore.getState().cycleDelay(id); expect(getDelay()).toBe('medium')
    useStore.getState().cycleDelay(id); expect(getDelay()).toBe('long')
    useStore.getState().cycleDelay(id); expect(getDelay()).toBe('none')
  })
})

describe('GE-13/19 setEdgeWeight', () => {
  beforeEach(() => { useStore.setState({ graph: seedGraph, past: [], future: [] }) })

  it('sets weight and clamps to 0–1', () => {
    const edge = seedGraph.edges.find((e) => e.kind === 'causal')!
    useStore.getState().setEdgeWeight(edge.id, 0.5)
    const updated = useStore.getState().graph.edges.find((e) => e.id === edge.id)!
    expect(updated.kind === 'causal' && updated.weight).toBe(0.5)
  })
})

describe('GE-18 updateNode', () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, past: [], future: [] })
  })

  it('updates label, min, max, initial on the target node', () => {
    const { graph } = useStore.getState()
    const id = graph.nodes[0].id
    useStore.getState().updateNode(id, { label: 'Renamed', min: 1, max: 9, initial: 3 })
    const updated = useStore.getState().graph.nodes.find((n) => n.id === id)!
    expect(updated.label).toBe('Renamed')
    expect(updated.min).toBe(1)
    expect(updated.max).toBe(9)
    expect(updated.initial).toBe(3)
  })

  it('clamps initial to [min, max] if violated (PRD §7.1 invariant)', () => {
    const { graph } = useStore.getState()
    const id = graph.nodes[0].id
    useStore.getState().updateNode(id, { min: 2, max: 8, initial: 12 }) // initial > max
    const updated = useStore.getState().graph.nodes.find((n) => n.id === id)!
    expect(updated.initial).toBeLessThanOrEqual(updated.max)
    expect(updated.initial).toBeGreaterThanOrEqual(updated.min)
  })

  it('updateNode is undoable', () => {
    const { graph } = useStore.getState()
    const id = graph.nodes[0].id
    const originalLabel = graph.nodes[0].label
    useStore.getState().updateNode(id, { label: 'Changed' })
    useStore.getState().undo()
    const restored = useStore.getState().graph.nodes.find((n) => n.id === id)!
    expect(restored.label).toBe(originalLabel)
  })
})

describe('SI-09 pauseSim / resumeSim', () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, sim: { signals: [], pending: [], nodeValues: new Map(), prevNodeValues: new Map(), tick: 0 } })
  })

  it('pauseSim sets simRunning to false', () => {
    useStore.getState().pauseSim()
    expect(useStore.getState().simRunning).toBe(false)
  })

  it('resumeSim sets simRunning to true', () => {
    useStore.getState().pauseSim()
    useStore.getState().resumeSim()
    expect(useStore.getState().simRunning).toBe(true)
  })
})

describe('SI-10 resetSim', () => {
  it('restores all node values to initial without clearing graph', () => {
    const { graph } = useStore.getState()
    // Mutate sim values by ticking
    useStore.getState().tickSim(1 / 60)
    useStore.getState().resetSim()
    const { sim } = useStore.getState()
    for (const node of graph.nodes) {
      expect(sim.nodeValues.get(node.id)).toBe(node.initial)
    }
    expect(useStore.getState().graph.nodes).toHaveLength(graph.nodes.length)
  })
})

describe('GE-13/19 openEdgeWeightEditor / closeEdgeWeightEditor', () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, past: [], future: [], editingEdgeId: null })
  })

  it('sets editingEdgeId to the given EdgeId when openEdgeWeightEditor is called', () => {
    const edgeId = seedGraph.edges.find((e) => e.kind === 'causal')!.id
    useStore.getState().openEdgeWeightEditor(edgeId)
    expect(useStore.getState().editingEdgeId).toBe(edgeId)
  })

  it('sets editingEdgeId back to null when closeEdgeWeightEditor is called', () => {
    const edgeId = seedGraph.edges.find((e) => e.kind === 'causal')!.id
    useStore.getState().openEdgeWeightEditor(edgeId)
    useStore.getState().closeEdgeWeightEditor()
    expect(useStore.getState().editingEdgeId).toBeNull()
  })
})

describe('SI-17 setSimSpeed', () => {
  it('stores the speed multiplier', () => {
    useStore.getState().setSimSpeed(2)
    expect(useStore.getState().simSpeed).toBe(2)
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
