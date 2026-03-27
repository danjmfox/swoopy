import { useEffect, useRef } from 'react'
import { LoopyRenderer, hitTest } from '@swoopy/renderer'
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

    // Pointer events → hit test → inject (SI-02, SI-03)
    // Operates in CSS pixels; no DPR scaling needed (DR--20260327--renderer--dpr-css-pixel-geometry)
    function onPointerDown(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const { graph } = useStore.getState()
      const hit = hitTest(graph, x, y)
      if (hit?.kind === 'node') {
        const strength = e.shiftKey ? -INJECT_STRENGTH : INJECT_STRENGTH
        useStore.setState((s) => ({ sim: inject(s.sim, hit.id, strength) }))
      }
    }

    function onDblClick(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const { graph, togglePolarity, cycleDelay, openNodeEditor, openEdgeWeightEditor } = useStore.getState()
      const hit = hitTest(graph, x, y)
      if (hit?.kind === 'node') openNodeEditor(hit.id)
      else if (hit?.kind === 'edge-polarity') togglePolarity(hit.edgeId)
      else if (hit?.kind === 'edge-delay') cycleDelay(hit.edgeId)
      else if (hit?.kind === 'edge-weight') openEdgeWeightEditor(hit.edgeId)
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('dblclick', onDblClick)
    return () => {
      renderer.stop()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('dblclick', onDblClick)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
    />
  )
}
