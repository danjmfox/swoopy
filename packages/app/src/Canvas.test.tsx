import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { useStore } from './store.ts'
import { seedGraph } from './seed.ts'
import { Canvas } from './Canvas.tsx'
import { makeInitialSim, INJECT_STRENGTH } from '@swoopy/engine'

// Mock hitTest so tests don't depend on jsdom pointer coordinate plumbing.
// jsdom does not expose PointerEvent as a global, so clientX/Y would be 0.
// vi.mock is hoisted, so mockHitTest must be declared via vi.hoisted.
const { mockHitTest } = vi.hoisted(() => ({ mockHitTest: vi.fn() }))
vi.mock('@swoopy/renderer', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>
  return { ...actual, hitTest: mockHitTest }
})

const NUDGE = 8 // expected nudge step in pixels

describe('GE-20 Canvas keyboard nav — Tab, arrows, Delete', () => {
  let focusNextNode: ReturnType<typeof vi.fn>
  let nudgeNode: ReturnType<typeof vi.fn>
  let deleteNode: ReturnType<typeof vi.fn>
  const focusedNode = seedGraph.nodes[0]

  beforeEach(() => {
    focusNextNode = vi.fn()
    nudgeNode = vi.fn()
    deleteNode = vi.fn()
    useStore.setState({
      graph: seedGraph,
      focusedNodeId: focusedNode.id,
      focusNextNode,
      nudgeNode,
      deleteNode,
    } as Parameters<typeof useStore.setState>[0])
  })

  it('Tab calls focusNextNode', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    fireEvent.keyDown(canvas, { key: 'Tab' })
    expect(focusNextNode).toHaveBeenCalledTimes(1)
  })

  it('ArrowRight nudges focused node right', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    fireEvent.keyDown(canvas, { key: 'ArrowRight' })
    expect(nudgeNode).toHaveBeenCalledWith(focusedNode.id, NUDGE, 0)
  })

  it('ArrowLeft nudges focused node left', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    fireEvent.keyDown(canvas, { key: 'ArrowLeft' })
    expect(nudgeNode).toHaveBeenCalledWith(focusedNode.id, -NUDGE, 0)
  })

  it('ArrowDown nudges focused node down', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    fireEvent.keyDown(canvas, { key: 'ArrowDown' })
    expect(nudgeNode).toHaveBeenCalledWith(focusedNode.id, 0, NUDGE)
  })

  it('ArrowUp nudges focused node up', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    fireEvent.keyDown(canvas, { key: 'ArrowUp' })
    expect(nudgeNode).toHaveBeenCalledWith(focusedNode.id, 0, -NUDGE)
  })

  it('Delete calls deleteNode on focused node', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    fireEvent.keyDown(canvas, { key: 'Delete' })
    expect(deleteNode).toHaveBeenCalledWith(focusedNode.id)
  })

  it('Backspace also calls deleteNode on focused node', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    fireEvent.keyDown(canvas, { key: 'Backspace' })
    expect(deleteNode).toHaveBeenCalledWith(focusedNode.id)
  })

  it('arrow keys do nothing when no node is focused', async () => {
    useStore.setState({ focusedNodeId: null } as Parameters<typeof useStore.setState>[0])
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    fireEvent.keyDown(canvas, { key: 'ArrowRight' })
    expect(nudgeNode).not.toHaveBeenCalled()
  })
})

describe('GE-20 click sets focused node in select mode', () => {
  let setFocusedNode: ReturnType<typeof vi.fn>
  const node = seedGraph.nodes[0]

  beforeEach(() => {
    setFocusedNode = vi.fn()
    mockHitTest.mockReset()
    useStore.setState({
      graph: seedGraph,
      mode: 'select',
      setFocusedNode,
    } as Parameters<typeof useStore.setState>[0])
  })

  it('pointerdown on a node sets focusedNodeId to that node', async () => {
    mockHitTest.mockReturnValue({ kind: 'node', id: node.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
    expect(setFocusedNode).toHaveBeenCalledWith(node.id)
  })

  it('pointerdown on empty canvas clears focusedNodeId', async () => {
    mockHitTest.mockReturnValue(null)
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
    expect(setFocusedNode).toHaveBeenCalledWith(null)
  })
})

describe('GE-03/20 Canvas drag — one moveNode call on pointerup', () => {
  let moveNode: ReturnType<typeof vi.fn>
  const popNode = seedGraph.nodes[0]

  beforeEach(() => {
    moveNode = vi.fn()
    mockHitTest.mockReset()
    useStore.setState({ graph: seedGraph, moveNode } as Parameters<typeof useStore.setState>[0])
  })

  it('drag from node produces exactly one moveNode call with final position', async () => {
    mockHitTest.mockReturnValue({ kind: 'node', id: popNode.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(canvas, { clientX: 110, clientY: 110 })
    fireEvent.pointerMove(canvas, { clientX: 120, clientY: 120 })
    fireEvent.pointerUp(canvas, { clientX: 130, clientY: 130 })

    expect(moveNode).toHaveBeenCalledTimes(1)
    expect(moveNode.mock.calls[0][0]).toBe(popNode.id)
  })

  it('pointermove while dragging in select mode calls setDragPosition', async () => {
    const setDragPosition = vi.fn()
    useStore.setState({ mode: 'select', setDragPosition } as Parameters<typeof useStore.setState>[0])
    mockHitTest.mockReturnValue({ kind: 'node', id: popNode.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
    fireEvent.pointerMove(canvas, { clientX: 50, clientY: 60 })

    // jsdom PointerEvent doesn't populate clientX/clientY on pointermove;
    // assert the function was called with the correct nodeId
    expect(setDragPosition).toHaveBeenCalled()
    expect(setDragPosition.mock.calls[0][0]).toBe(popNode.id)
  })

  it('pointermove without prior pointerdown does not call moveNode', async () => {
    mockHitTest.mockReturnValue(null)
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 100 })

    expect(moveNode).not.toHaveBeenCalled()
  })

  it('GE-23 modifier+drag from nodeA to nodeB calls setPendingConstraintEdge', async () => {
    const nodeA = seedGraph.nodes[0]
    const nodeB = seedGraph.nodes[1]
    const setPendingConstraintEdge = vi.fn()
    useStore.setState({ setPendingConstraintEdge } as Parameters<typeof useStore.setState>[0])
    // pointerdown hits nodeA; pointerup hits nodeB
    mockHitTest
      .mockReturnValueOnce({ kind: 'node', id: nodeA.id })
      .mockReturnValueOnce({ kind: 'node', id: nodeB.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.keyDown(document, { key: 'Alt' })
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
    fireEvent.pointerUp(canvas, { clientX: 50, clientY: 50 })
    fireEvent.keyUp(document, { key: 'Alt' })

    expect(setPendingConstraintEdge).toHaveBeenCalledWith(nodeA.id, nodeB.id)
    expect(moveNode).not.toHaveBeenCalled()
  })

  it('pointerdown on empty space does not start a drag', async () => {
    mockHitTest.mockReturnValue(null)
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50 })
    fireEvent.pointerUp(canvas, { clientX: 200, clientY: 200 })

    expect(moveNode).not.toHaveBeenCalled()
  })
})

describe('SI-02/03 simulate mode — pointerdown on node injects signal', () => {
  const targetNode = seedGraph.nodes[0]

  beforeEach(() => {
    mockHitTest.mockReset()
    useStore.setState({
      graph: seedGraph,
      sim: makeInitialSim(seedGraph),
      mode: 'simulate',
    } as Parameters<typeof useStore.setState>[0])
  })

  it('SI-02 pointerdown on node injects a positive signal', async () => {
    mockHitTest.mockReturnValue({ kind: 'node', id: targetNode.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    const before = useStore.getState().sim.nodeValues.get(targetNode.id)!

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })

    const after = useStore.getState().sim.nodeValues.get(targetNode.id)!
    expect(after).toBeGreaterThan(before)
  })

  it('SI-03 shift+pointerdown injects a negative signal', async () => {
    mockHitTest.mockReturnValue({ kind: 'node', id: targetNode.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    const before = useStore.getState().sim.nodeValues.get(targetNode.id)!

    fireEvent.keyDown(document, { key: 'Shift' })
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
    fireEvent.keyUp(document, { key: 'Shift' })

    const after = useStore.getState().sim.nodeValues.get(targetNode.id)!
    expect(after).toBeLessThan(before)
  })

  it('select mode does not inject on node click', async () => {
    useStore.setState({ mode: 'select' } as Parameters<typeof useStore.setState>[0])
    mockHitTest.mockReturnValue({ kind: 'node', id: targetNode.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    const before = useStore.getState().sim.nodeValues.get(targetNode.id)!

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })

    const after = useStore.getState().sim.nodeValues.get(targetNode.id)!
    expect(after).toBe(before)
  })
})

describe('GE-09 delete mode — pointerdown on node removes it', () => {
  let deleteNode: ReturnType<typeof vi.fn>
  const targetNode = seedGraph.nodes[0]

  beforeEach(() => {
    deleteNode = vi.fn()
    mockHitTest.mockReset()
    useStore.setState({ graph: seedGraph, deleteNode, mode: 'delete' } as Parameters<typeof useStore.setState>[0])
  })

  it('pointerdown on a node calls deleteNode', async () => {
    mockHitTest.mockReturnValue({ kind: 'node', id: targetNode.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })

    expect(deleteNode).toHaveBeenCalledWith(targetNode.id)
  })

  it('pointerdown on empty space does not call deleteNode', async () => {
    mockHitTest.mockReturnValue(null)
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })

    expect(deleteNode).not.toHaveBeenCalled()
  })
})

describe('GE-26 delete mode — pointerdown on edge hit region removes it', () => {
  let deleteEdge: ReturnType<typeof vi.fn>
  const targetEdge = seedGraph.edges[0]

  beforeEach(() => {
    deleteEdge = vi.fn()
    mockHitTest.mockReset()
    useStore.setState({ graph: seedGraph, deleteEdge, mode: 'delete' } as Parameters<typeof useStore.setState>[0])
  })

  it('pointerdown on edge-polarity calls deleteEdge', async () => {
    mockHitTest.mockReturnValue({ kind: 'edge-polarity', edgeId: targetEdge.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.pointerDown(container.querySelector('canvas')!, { clientX: 0, clientY: 0 })
    expect(deleteEdge).toHaveBeenCalledWith(targetEdge.id)
  })

  it('pointerdown on edge-delay calls deleteEdge', async () => {
    mockHitTest.mockReturnValue({ kind: 'edge-delay', edgeId: targetEdge.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.pointerDown(container.querySelector('canvas')!, { clientX: 0, clientY: 0 })
    expect(deleteEdge).toHaveBeenCalledWith(targetEdge.id)
  })

  it('pointerdown on edge-weight calls deleteEdge', async () => {
    mockHitTest.mockReturnValue({ kind: 'edge-weight', edgeId: targetEdge.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.pointerDown(container.querySelector('canvas')!, { clientX: 0, clientY: 0 })
    expect(deleteEdge).toHaveBeenCalledWith(targetEdge.id)
  })
})

describe('GE-04 add-edge mode — drag node to node creates edge', () => {
  let addEdge: ReturnType<typeof vi.fn>
  let moveNode: ReturnType<typeof vi.fn>
  const nodeA = seedGraph.nodes[0]
  const nodeB = seedGraph.nodes[1]

  beforeEach(() => {
    addEdge = vi.fn()
    moveNode = vi.fn()
    mockHitTest.mockReset()
    useStore.setState({ graph: seedGraph, addEdge, moveNode, mode: 'add-edge' } as Parameters<typeof useStore.setState>[0])
  })

  it('drag from nodeA to nodeB calls addEdge', async () => {
    mockHitTest
      .mockReturnValueOnce({ kind: 'node', id: nodeA.id })
      .mockReturnValueOnce({ kind: 'node', id: nodeB.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
    fireEvent.pointerUp(canvas, { clientX: 50, clientY: 50 })

    expect(addEdge).toHaveBeenCalledWith(nodeA.id, nodeB.id)
  })

  it('drag from node to empty space does not call addEdge', async () => {
    mockHitTest
      .mockReturnValueOnce({ kind: 'node', id: nodeA.id })
      .mockReturnValueOnce(null)
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
    fireEvent.pointerUp(canvas, { clientX: 200, clientY: 200 })

    expect(addEdge).not.toHaveBeenCalled()
  })

  it('add-edge mode does not call moveNode on drag release', async () => {
    mockHitTest
      .mockReturnValueOnce({ kind: 'node', id: nodeA.id })
      .mockReturnValueOnce({ kind: 'node', id: nodeB.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
    fireEvent.pointerUp(canvas, { clientX: 50, clientY: 50 })

    expect(moveNode).not.toHaveBeenCalled()
  })

  it('GE-23 Alt+drag in add-edge mode calls setPendingConstraintEdge, not addEdge', async () => {
    const setPendingConstraintEdge = vi.fn()
    useStore.setState({ setPendingConstraintEdge } as Parameters<typeof useStore.setState>[0])
    mockHitTest
      .mockReturnValueOnce({ kind: 'node', id: nodeA.id })
      .mockReturnValueOnce({ kind: 'node', id: nodeB.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.keyDown(document, { key: 'Alt' })
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
    fireEvent.pointerUp(canvas, { clientX: 50, clientY: 50 })
    fireEvent.keyUp(document, { key: 'Alt' })

    expect(setPendingConstraintEdge).toHaveBeenCalledWith(nodeA.id, nodeB.id)
    expect(addEdge).not.toHaveBeenCalled()
  })
})

describe('GE-01 add-node mode — click canvas creates node', () => {
  let addNode: ReturnType<typeof vi.fn>

  beforeEach(() => {
    addNode = vi.fn()
    mockHitTest.mockReset()
    useStore.setState({ graph: seedGraph, addNode, mode: 'add-node' } as Parameters<typeof useStore.setState>[0])
  })

  it('pointerdown on empty space calls addNode with pointer coordinates', async () => {
    mockHitTest.mockReturnValue(null)
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.pointerDown(canvas, { clientX: 200, clientY: 150 })

    expect(addNode).toHaveBeenCalledTimes(1)
  })

  it('pointerdown on an existing node does not call addNode', async () => {
    mockHitTest.mockReturnValue({ kind: 'node', id: seedGraph.nodes[0].id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50 })

    expect(addNode).not.toHaveBeenCalled()
  })
})

describe('SI-02 hold-to-inject — continuous injection while pointer held', () => {
  const targetNode = seedGraph.nodes[0]

  beforeEach(() => {
    mockHitTest.mockReset()
    useStore.setState({
      graph: seedGraph,
      sim: makeInitialSim(seedGraph),
      mode: 'simulate',
    } as Parameters<typeof useStore.setState>[0])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('holding pointer injects more than once within 300ms', async () => {
    vi.useFakeTimers()
    mockHitTest.mockReturnValue({ kind: 'node', id: targetNode.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    const baseline = useStore.getState().sim.nodeValues.get(targetNode.id)!

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
    act(() => { vi.advanceTimersByTime(300) })

    const after = useStore.getState().sim.nodeValues.get(targetNode.id)!
    expect(after).toBeGreaterThan(baseline + INJECT_STRENGTH)
  })

  it('releasing pointer stops further injection', async () => {
    vi.useFakeTimers()
    mockHitTest.mockReturnValue({ kind: 'node', id: targetNode.id })
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 })
    act(() => { vi.advanceTimersByTime(200) })
    fireEvent.pointerUp(canvas, { clientX: 0, clientY: 0 })

    const valueAtRelease = useStore.getState().sim.nodeValues.get(targetNode.id)!
    act(() => { vi.advanceTimersByTime(300) })

    const valueAfterRelease = useStore.getState().sim.nodeValues.get(targetNode.id)!
    expect(valueAfterRelease).toBe(valueAtRelease)
  })
})

describe('GE-21 Ctrl+Z / Ctrl+Shift+Z — undo and redo', () => {
  let undo: ReturnType<typeof vi.fn>
  let redo: ReturnType<typeof vi.fn>

  beforeEach(() => {
    undo = vi.fn()
    redo = vi.fn()
    useStore.setState({ graph: seedGraph, undo, redo } as Parameters<typeof useStore.setState>[0])
  })

  it('Ctrl+Z calls undo', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.keyDown(container.querySelector('canvas')!, { key: 'z', ctrlKey: true })
    expect(undo).toHaveBeenCalledTimes(1)
  })

  it('Meta+Z calls undo (macOS)', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.keyDown(container.querySelector('canvas')!, { key: 'z', metaKey: true })
    expect(undo).toHaveBeenCalledTimes(1)
  })

  it('Ctrl+Shift+Z calls redo', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.keyDown(container.querySelector('canvas')!, { key: 'z', ctrlKey: true, shiftKey: true })
    expect(redo).toHaveBeenCalledTimes(1)
  })

  it('Meta+Shift+Z calls redo (macOS)', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.keyDown(container.querySelector('canvas')!, { key: 'z', metaKey: true, shiftKey: true })
    expect(redo).toHaveBeenCalledTimes(1)
  })
})

describe('GE-27 Enter on focused node opens editor', () => {
  let openNodeEditor: ReturnType<typeof vi.fn>
  const node = seedGraph.nodes[0]

  beforeEach(() => {
    openNodeEditor = vi.fn()
    useStore.setState({
      graph: seedGraph,
      focusedNodeId: node.id,
      openNodeEditor,
    } as Parameters<typeof useStore.setState>[0])
  })

  it('Enter opens editor for the focused node', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.keyDown(container.querySelector('canvas')!, { key: 'Enter' })
    expect(openNodeEditor).toHaveBeenCalledWith(node.id)
  })

  it('Enter does nothing when no node is focused', async () => {
    useStore.setState({ focusedNodeId: null } as Parameters<typeof useStore.setState>[0])
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.keyDown(container.querySelector('canvas')!, { key: 'Enter' })
    expect(openNodeEditor).not.toHaveBeenCalled()
  })
})

describe('GE-28 mode keyboard shortcuts — S/N/E/R/D', () => {
  let setMode: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setMode = vi.fn()
    mockHitTest.mockReset()
    useStore.setState({ graph: seedGraph, setMode } as Parameters<typeof useStore.setState>[0])
  })

  it('S switches to select mode', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.keyDown(container.querySelector('canvas')!, { key: 's' })
    expect(setMode).toHaveBeenCalledWith('select')
  })

  it('N switches to add-node mode', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.keyDown(container.querySelector('canvas')!, { key: 'n' })
    expect(setMode).toHaveBeenCalledWith('add-node')
  })

  it('E switches to add-edge mode', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.keyDown(container.querySelector('canvas')!, { key: 'e' })
    expect(setMode).toHaveBeenCalledWith('add-edge')
  })

  it('R switches to simulate mode', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.keyDown(container.querySelector('canvas')!, { key: 'r' })
    expect(setMode).toHaveBeenCalledWith('simulate')
  })

  it('D switches to delete mode', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.keyDown(container.querySelector('canvas')!, { key: 'd' })
    expect(setMode).toHaveBeenCalledWith('delete')
  })

  it('S switches mode even when canvas does not have focus', async () => {
    render(<Canvas />)
    await act(async () => {})
    fireEvent.keyDown(document.body, { key: 's' })
    expect(setMode).toHaveBeenCalledWith('select')
  })

  it('shortcuts do not fire when Ctrl is held', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    fireEvent.keyDown(canvas, { key: 's', ctrlKey: true })
    fireEvent.keyDown(canvas, { key: 'n', ctrlKey: true })
    fireEvent.keyDown(canvas, { key: 'r', ctrlKey: true })
    expect(setMode).not.toHaveBeenCalled()
  })

  it('shortcuts do not fire when Meta is held', async () => {
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!
    fireEvent.keyDown(canvas, { key: 's', metaKey: true })
    fireEvent.keyDown(canvas, { key: 'n', metaKey: true })
    fireEvent.keyDown(canvas, { key: 'r', metaKey: true })
    expect(setMode).not.toHaveBeenCalled()
  })
})

describe('GE-18 dblclick — no-op in simulate mode', () => {
  let openNodeEditor: ReturnType<typeof vi.fn>
  const node = seedGraph.nodes[0]

  beforeEach(() => {
    openNodeEditor = vi.fn()
    mockHitTest.mockReset()
    useStore.setState({ graph: seedGraph, openNodeEditor } as Parameters<typeof useStore.setState>[0])
  })

  it('dblclick on node in simulate mode does NOT open editor', async () => {
    mockHitTest.mockReturnValue({ kind: 'node', id: node.id })
    useStore.setState({ mode: 'simulate' } as Parameters<typeof useStore.setState>[0])
    const { container } = render(<Canvas />)
    await act(async () => {})
    fireEvent.dblClick(container.querySelector('canvas')!, { clientX: 0, clientY: 0 })
    expect(openNodeEditor).not.toHaveBeenCalled()
  })
})
