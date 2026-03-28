import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { useStore } from './store.ts'
import { seedGraph } from './seed.ts'
import { Canvas } from './Canvas.tsx'

// Population node: x=400, y=300, radius=50
// getBoundingClientRect returns { left:0, top:0 } in jsdom → clientX/Y === canvas coords

describe('GE-03/20 Canvas drag — one moveNode call on pointerup', () => {
  let moveNode: ReturnType<typeof vi.fn>

  beforeEach(() => {
    moveNode = vi.fn()
    useStore.setState({ graph: seedGraph, moveNode } as Parameters<typeof useStore.setState>[0])
  })

  it('drag from node produces exactly one moveNode call with final position', () => {
    const { container } = render(<Canvas />)
    const canvas = container.querySelector('canvas')!

    // Pointerdown on Population node (400, 300)
    fireEvent.pointerDown(canvas, { clientX: 400, clientY: 300 })
    // Move several pixels
    fireEvent.pointerMove(canvas, { clientX: 410, clientY: 305 })
    fireEvent.pointerMove(canvas, { clientX: 420, clientY: 310 })
    fireEvent.pointerMove(canvas, { clientX: 430, clientY: 320 })
    // Release
    fireEvent.pointerUp(canvas, { clientX: 430, clientY: 320 })

    expect(moveNode).toHaveBeenCalledTimes(1)
    const popNode = seedGraph.nodes[0]
    expect(moveNode).toHaveBeenCalledWith(popNode.id, 430, 320)
  })

  it('pointermove without prior pointerdown does not call moveNode', () => {
    const { container } = render(<Canvas />)
    const canvas = container.querySelector('canvas')!

    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 100 })

    expect(moveNode).not.toHaveBeenCalled()
  })
})
