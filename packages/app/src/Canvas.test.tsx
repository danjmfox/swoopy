import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { useStore } from './store.ts'
import { seedGraph } from './seed.ts'
import { Canvas } from './Canvas.tsx'

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

  it('pointermove without prior pointerdown does not call moveNode', async () => {
    mockHitTest.mockReturnValue(null)
    const { container } = render(<Canvas />)
    await act(async () => {})
    const canvas = container.querySelector('canvas')!

    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 100 })

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
