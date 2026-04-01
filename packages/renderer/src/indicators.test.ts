import { describe, it, expect } from 'vitest'
import { stockIndicator, timebombStrength, saturationAlpha, delayQueueIndicator, TrendTracker } from './indicators.ts'
import { makeNodeId, makeEdgeId } from '@swoopy/engine'

describe('SI-12 stockIndicator', () => {
  it('fill is 0 at min value', () => {
    const { fill } = stockIndicator(0, 0, 10, 0)
    expect(fill).toBe(0)
  })

  it('fill is 1 at max value', () => {
    const { fill } = stockIndicator(10, 0, 10, 0)
    expect(fill).toBe(1)
  })

  it('trend is up when value > prevValue', () => {
    expect(stockIndicator(6, 0, 10, 5).trend).toBe('up')
  })

  it('trend is down when value < prevValue', () => {
    expect(stockIndicator(4, 0, 10, 5).trend).toBe('down')
  })

  it('trend is stable when value === prevValue', () => {
    expect(stockIndicator(5, 0, 10, 5).trend).toBe('stable')
  })
})

describe('SI-15 timebombStrength', () => {
  const nodeA = makeNodeId('A')
  const nodeB = makeNodeId('B')
  const edgeAB = makeEdgeId('AB')
  const edges = [
    { kind: 'causal' as const, id: edgeAB, from: nodeA, to: nodeB, polarity: 1 as const, weight: 1, delay: 'short' as const, transferFn: 'linear' as const },
  ]

  it('returns 0 when no pending signals exist', () => {
    expect(timebombStrength([], nodeA, edges)).toBe(0)
  })

  it('sums absolute strength of pending signals on edges from the given node', () => {
    const pending = [
      { signal: { id: '1', edgeId: edgeAB, progress: 0, strength: 0.8, hopsRemaining: 8 }, ticksRemaining: 3 },
      { signal: { id: '2', edgeId: edgeAB, progress: 0, strength: -0.5, hopsRemaining: 8 }, ticksRemaining: 1 },
    ]
    expect(timebombStrength(pending, nodeA, edges)).toBeCloseTo(1.3)
  })

  it('ignores pending signals on edges not from the given node', () => {
    const pending = [
      { signal: { id: '1', edgeId: edgeAB, progress: 0, strength: 0.8, hopsRemaining: 8 }, ticksRemaining: 2 },
    ]
    // nodeB is the destination, not the source
    expect(timebombStrength(pending, nodeB, edges)).toBe(0)
  })
})

describe('SI-19 delayQueueIndicator', () => {
  const nodeA = makeNodeId('A')
  const nodeB = makeNodeId('B')
  const edgeAB = makeEdgeId('AB')
  const edges = [
    { kind: 'causal' as const, id: edgeAB, from: nodeA, to: nodeB, polarity: 1 as const, weight: 1, delay: 'short' as const, transferFn: 'linear' as const },
  ]

  it('returns fraction 0 and no overflow when no pending signals', () => {
    const result = delayQueueIndicator([], nodeA, edges, 10)
    expect(result.fraction).toBe(0)
    expect(result.overflow).toBe(false)
  })

  it('returns fraction 0.5 when mass is half of nodeMax', () => {
    const pending = [
      { signal: { id: '1', edgeId: edgeAB, progress: 0, strength: 5, hopsRemaining: 8 }, ticksRemaining: 3 },
    ]
    const result = delayQueueIndicator(pending, nodeA, edges, 10)
    expect(result.fraction).toBeCloseTo(0.5)
    expect(result.overflow).toBe(false)
  })

  it('returns fraction 1 and overflow true when mass exceeds nodeMax', () => {
    const pending = [
      { signal: { id: '1', edgeId: edgeAB, progress: 0, strength: 8, hopsRemaining: 8 }, ticksRemaining: 3 },
      { signal: { id: '2', edgeId: edgeAB, progress: 0, strength: 5, hopsRemaining: 8 }, ticksRemaining: 2 },
    ]
    const result = delayQueueIndicator(pending, nodeA, edges, 10)
    expect(result.fraction).toBe(1)
    expect(result.overflow).toBe(true)
  })
})

describe('SI-11 saturationAlpha', () => {
  it('returns 1 when signal count is 0', () => {
    expect(saturationAlpha(0, 30)).toBe(1)
  })

  it('returns 0.3 when signal count equals maxSignals', () => {
    expect(saturationAlpha(30, 30)).toBeCloseTo(0.3)
  })

  it('never drops below 0.3', () => {
    expect(saturationAlpha(100, 30)).toBeGreaterThanOrEqual(0.3)
  })
})

describe('SI-18 TrendTracker', () => {
  const nodeA = makeNodeId('A')

  it('returns the raw trend direction when active', () => {
    const tracker = new TrendTracker(2000)
    expect(tracker.update(nodeA, 'up', 1000)).toBe('up')
  })

  it('holds the last active direction after raw trend returns to stable within holdMs', () => {
    const tracker = new TrendTracker(2000)
    tracker.update(nodeA, 'up', 1000)
    expect(tracker.update(nodeA, 'stable', 1500)).toBe('up')
  })

  it('returns stable once holdMs has elapsed since the last active trend', () => {
    const tracker = new TrendTracker(2000)
    tracker.update(nodeA, 'up', 1000)
    expect(tracker.update(nodeA, 'stable', 3001)).toBe('stable')
  })
})
