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

    // Drag state machine
    let dragNodeId: import('@swoopy/engine').NodeId | null = null
    let constraintModifierHeld = false

    // Track Alt key state separately — jsdom doesn't propagate altKey via PointerEvent init
    function onDocKeyDown(e: KeyboardEvent) { if (e.key === 'Alt') constraintModifierHeld = true }
    function onDocKeyUp(e: KeyboardEvent)   { if (e.key === 'Alt') constraintModifierHeld = false }
    document.addEventListener('keydown', onDocKeyDown)
    document.addEventListener('keyup', onDocKeyUp)

    // Pointer events → hit test → inject (SI-02, SI-03) + drag (GE-03/20, GE-23)
    // Operates in CSS pixels; no DPR scaling needed (DR--20260327--renderer--dpr-css-pixel-geometry)
    function onPointerDown(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const { graph } = useStore.getState()
      const hit = hitTest(graph, x, y)
      if (hit?.kind === 'node') {
        dragNodeId = hit.id
        const strength = e.shiftKey ? -INJECT_STRENGTH : INJECT_STRENGTH
        useStore.setState((s) => ({ sim: inject(s.sim, hit.id, strength) }))
      }
    }

    function onPointerMove(_e: PointerEvent) {
      // Track in-flight position without committing to history
    }

    function onPointerUp(e: PointerEvent) {
      if (dragNodeId === null) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const { graph, setPendingConstraintEdge, moveNode } = useStore.getState()
      const releaseHit = hitTest(graph, x, y)
      const releasedOnDifferentNode = releaseHit?.kind === 'node' && releaseHit.id !== dragNodeId
      if (releasedOnDifferentNode && constraintModifierHeld) {
        setPendingConstraintEdge(dragNodeId, releaseHit!.id as import('@swoopy/engine').NodeId)
      } else {
        moveNode(dragNodeId, x, y)
      }
      dragNodeId = null
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

    const NUDGE_PX = 8

    function onKeyDown(e: KeyboardEvent) {
      const { focusedNodeId, focusNextNode, nudgeNode, deleteNode } = useStore.getState()
      if (e.key === 'Tab') { e.preventDefault(); focusNextNode(); return }
      if (focusedNodeId === null) return
      if (e.key === 'ArrowRight') nudgeNode(focusedNodeId,  NUDGE_PX, 0)
      else if (e.key === 'ArrowLeft')  nudgeNode(focusedNodeId, -NUDGE_PX, 0)
      else if (e.key === 'ArrowDown')  nudgeNode(focusedNodeId, 0,  NUDGE_PX)
      else if (e.key === 'ArrowUp')    nudgeNode(focusedNodeId, 0, -NUDGE_PX)
      else if (e.key === 'Delete' || e.key === 'Backspace') deleteNode(focusedNodeId)
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('dblclick', onDblClick)
    canvas.addEventListener('keydown', onKeyDown)
    return () => {
      renderer.stop()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('dblclick', onDblClick)
      canvas.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keydown', onDocKeyDown)
      document.removeEventListener('keyup', onDocKeyUp)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      tabIndex={0}
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair', outline: 'none' }}
    />
  )
}
