import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LoopyRenderer } from './LoopyRenderer.ts'
import type { RendererStore } from './LoopyRenderer.ts'
import type { Node } from '@swoopy/engine'

function makeCanvas(): HTMLCanvasElement {
  return {
    clientWidth: 800,
    clientHeight: 600,
    getContext: () => null,
  } as unknown as HTMLCanvasElement
}

function makeStore(tickSim = vi.fn()): () => RendererStore {
  return () => ({
    tickSim,
    simRunning: true,
    simSpeed: 1,
    graph: { nodes: [], edges: [] },
    sim: { signals: [], pending: [], nodeValues: new Map(), prevNodeValues: new Map(), tick: 0 },
  })
}

function makeSpyCanvas(): { canvas: HTMLCanvasElement; strokes: () => { style: string; width: number }[] } {
  const strokes: { style: string; width: number }[] = []
  const ctx = {
    setTransform: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(),
    arc: vi.fn(), fill: vi.fn(),
    stroke: vi.fn().mockImplementation(function (this: typeof ctx) {
      strokes.push({ style: ctx.strokeStyle as string, width: ctx.lineWidth as number })
    }),
    moveTo: vi.fn(), lineTo: vi.fn(), quadraticCurveTo: vi.fn(), fillText: vi.fn(),
    fillStyle: '' as string, strokeStyle: '' as string, lineWidth: 1 as number,
    font: '' as string, textAlign: '' as string, textBaseline: '' as string,
    scale: vi.fn(),
  }
  const canvas = {
    clientWidth: 800, clientHeight: 600, width: 0, height: 0,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement
  return { canvas, strokes: () => strokes }
}

describe('LoopyRenderer', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('start() calls tickSim on each RAF frame', () => {
    const tickSim = vi.fn()
    const renderer = new LoopyRenderer(makeCanvas(), makeStore(tickSim))

    renderer.start()
    vi.advanceTimersByTime(3 * (1000 / 60))
    renderer.stop()

    expect(tickSim).toHaveBeenCalled()
  })

  it('GE-20 focused node draws a white focus ring', () => {
    const { canvas, strokes } = makeSpyCanvas()
    const node: Node = { id: 'n1', label: 'A', x: 100, y: 100, radius: 40, min: 0, max: 10, initial: 5 }
    const getState = () => ({
      tickSim: vi.fn(), simRunning: false, simSpeed: 1,
      graph: { nodes: [node], edges: [] },
      sim: { signals: [], pending: [], nodeValues: new Map(), prevNodeValues: new Map(), tick: 0 },
      focusedNodeId: node.id,
    }) as unknown as RendererStore
    const renderer = new LoopyRenderer(canvas, getState)
    renderer.start()
    vi.advanceTimersByTime(1000 / 60)
    renderer.stop()
    expect(strokes().some(s => s.style === '#ffffff' && s.width === 3)).toBe(true)
  })

  it('GE-20 unfocused node does not draw a white focus ring', () => {
    const { canvas, strokes } = makeSpyCanvas()
    const node: Node = { id: 'n1', label: 'A', x: 100, y: 100, radius: 40, min: 0, max: 10, initial: 5 }
    const getState = () => ({
      tickSim: vi.fn(), simRunning: false, simSpeed: 1,
      graph: { nodes: [node], edges: [] },
      sim: { signals: [], pending: [], nodeValues: new Map(), prevNodeValues: new Map(), tick: 0 },
      focusedNodeId: null,
    }) as unknown as RendererStore
    const renderer = new LoopyRenderer(canvas, getState)
    renderer.start()
    vi.advanceTimersByTime(1000 / 60)
    renderer.stop()
    expect(strokes().some(s => s.style === '#ffffff' && s.width === 3)).toBe(false)
  })

  it('stop() halts the RAF loop', () => {
    const tickSim = vi.fn()
    const renderer = new LoopyRenderer(makeCanvas(), makeStore(tickSim))

    renderer.start()
    vi.advanceTimersByTime(1000 / 60)
    renderer.stop()
    const callsAtStop = tickSim.mock.calls.length

    vi.advanceTimersByTime(10 * (1000 / 60))
    expect(tickSim.mock.calls.length).toBe(callsAtStop)
  })
})
