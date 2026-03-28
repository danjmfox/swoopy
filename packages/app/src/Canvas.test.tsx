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
