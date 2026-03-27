import { useEffect, useRef } from 'react'
import { LoopyRenderer } from '@swoopy/renderer'
import { inject, INJECT_STRENGTH } from '@swoopy/engine'
import { useStore } from './store.ts'
import { popId } from './seed.ts'

export function Canvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    // Auto-inject a positive signal into Population to kick off the simulation
    useStore.setState((s) => ({ sim: inject(s.sim, popId, INJECT_STRENGTH) }))

    const renderer = new LoopyRenderer(canvas, useStore.getState)
    renderer.start()
    return () => renderer.stop()
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
