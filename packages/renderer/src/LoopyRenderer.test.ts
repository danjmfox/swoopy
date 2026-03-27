import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LoopyRenderer } from './LoopyRenderer.ts'

function makeCanvas(): HTMLCanvasElement {
  return { clientWidth: 800, clientHeight: 600 } as HTMLCanvasElement
}

describe('LoopyRenderer', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('start() calls tickSim on each RAF frame', () => {
    const tickSim = vi.fn()
    const renderer = new LoopyRenderer(makeCanvas(), () => ({ tickSim }))

    renderer.start()
    vi.advanceTimersByTime(3 * (1000 / 60)) // ~3 frames
    renderer.stop()

    expect(tickSim).toHaveBeenCalled()
  })

  it('stop() halts the RAF loop', () => {
    const tickSim = vi.fn()
    const renderer = new LoopyRenderer(makeCanvas(), () => ({ tickSim }))

    renderer.start()
    vi.advanceTimersByTime(1000 / 60)
    renderer.stop()
    const callsAtStop = tickSim.mock.calls.length

    vi.advanceTimersByTime(10 * (1000 / 60)) // 10 more frames — should be silent
    expect(tickSim.mock.calls.length).toBe(callsAtStop)
  })
})
