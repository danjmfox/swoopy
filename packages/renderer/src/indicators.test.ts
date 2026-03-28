import { describe, it, expect } from 'vitest'
import { stockIndicator } from './indicators.ts'

describe('SI-12 stockIndicator', () => {
  it('fill is 0 at min value', () => {
    const { fill } = stockIndicator(0, 0, 10, 0)
    expect(fill).toBe(0)
  })
})
