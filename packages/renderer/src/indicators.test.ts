import { describe, it, expect } from 'vitest'
import { stockIndicator } from './indicators.ts'

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
