import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LoopyRenderer } from './LoopyRenderer.ts'
import type { RendererStore } from './LoopyRenderer.ts'

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
