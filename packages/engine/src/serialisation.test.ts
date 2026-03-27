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

// SE-03, SE-05
describe('deserialize', () => {
  it('round-trips: deserialize(serialize(graph)) restores the graph exactly', () => {
    const restored = deserialize(serialize(seedGraph))
    expect(restored.nodes).toEqual(seedGraph.nodes)
    expect(restored.edges).toEqual(seedGraph.edges)
  })

  it('throws a descriptive error for an unknown version (SE-05)', () => {
    expect(() => deserialize({ version: 99, graph: seedGraph })).toThrow(/version 99/)
  })
})
