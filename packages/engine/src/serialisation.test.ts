import { describe, it, expect } from 'vitest'
import { serialize, deserialize } from './index.ts'
import { seedGraph } from './population.test.ts'

// SE-01, SE-04
describe('serialize', () => {
  it('returns a value with a version field', () => {
    const blob = serialize(seedGraph)
    expect(blob).toMatchObject({ version: 1 })
  })
})
