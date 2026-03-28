import { describe, it, expect } from 'vitest'
import { stockIndicator, timebombStrength, saturationAlpha } from './indicators.ts'
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
      { signal: { id: '1', edgeId: edgeAB, progress: 0, strength: 0.8 }, ticksRemaining: 3 },
      { signal: { id: '2', edgeId: edgeAB, progress: 0, strength: -0.5 }, ticksRemaining: 1 },
    ]
    expect(timebombStrength(pending, nodeA, edges)).toBeCloseTo(1.3)
  })

  it('ignores pending signals on edges not from the given node', () => {
    const pending = [
      { signal: { id: '1', edgeId: edgeAB, progress: 0, strength: 0.8 }, ticksRemaining: 2 },
    ]
    // nodeB is the destination, not the source
    expect(timebombStrength(pending, nodeB, edges)).toBe(0)
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
