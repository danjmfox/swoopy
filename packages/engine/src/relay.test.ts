/**
 * Relay propagation model — test suite
 * DR--20260401--engine--relay-propagation-model
 *
 * Tests are ordered to match the task plan: type → constants → inject → step → integration.
 * Each describe block is added one test at a time (red → green rhythm).
 */
import { describe, it, expect } from 'vitest'
import { makeNodeId, makeEdgeId } from './ids.ts'
import type { Signal } from './types.ts'
import * as constants from './constants.ts'

// ---------------------------------------------------------------------------
// Task 4: Signal type has hopsRemaining
// ---------------------------------------------------------------------------

describe('Signal type — hopsRemaining field', () => {
  it('Signal accepts hopsRemaining: number', () => {
    // Type-level assertion: fails TS typecheck until Signal.hopsRemaining is added.
    // At runtime (strip-types) the annotation is erased — we verify the value survives.
    const s: Signal = {
      id: 's1',
      edgeId: makeEdgeId('e1'),
      progress: 0,
      strength: 1,
      hopsRemaining: 8,
    }
    expect(s.hopsRemaining).toBe(8)
  })
})

// ---------------------------------------------------------------------------
// Task 6: MAX_HOPS constant exists; EMIT_THRESHOLD is gone
// ---------------------------------------------------------------------------

describe('constants — relay model', () => {
  it('MAX_HOPS is a positive integer', () => {
    expect(constants.MAX_HOPS).toBeGreaterThan(0)
    expect(Number.isInteger(constants.MAX_HOPS)).toBe(true)
  })

  it('EMIT_THRESHOLD no longer exists', () => {
    expect((constants as Record<string, unknown>).EMIT_THRESHOLD).toBeUndefined()
  })
})
