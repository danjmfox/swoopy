import { describe, it, expect } from 'vitest'
import { makeNodeId, makeEdgeId, makeInitialSim, inject, step, INJECT_STRENGTH } from './index.ts'
// MAX_SIGNALS is not yet exported — this import will fail: RED
import { MAX_SIGNALS } from './constants.ts'
import type { Graph, Node, CausalEdge } from './types.ts'

// SI-11: signal count is capped at MAX_SIGNALS
describe('SI-11 MAX_SIGNALS constant and cap', () => {
  it('MAX_SIGNALS is a positive integer', () => {
    expect(Number.isInteger(MAX_SIGNALS)).toBe(true)
    expect(MAX_SIGNALS).toBeGreaterThan(0)
  })
})
