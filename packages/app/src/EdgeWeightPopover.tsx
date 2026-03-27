import { useState, useEffect } from 'react'
import { useStore } from './store.ts'

export function EdgeWeightPopover() {
  const editingEdgeId = useStore((s) => s.editingEdgeId)
  const graph = useStore((s) => s.graph)
  const { setEdgeWeight, closeEdgeWeightEditor } = useStore.getState()

  const edge = editingEdgeId
    ? graph.edges.find((e) => e.kind === 'causal' && e.id === editingEdgeId)
    : null

  const [weight, setWeight] = useState(1)

  useEffect(() => {
    if (edge?.kind === 'causal') setWeight(edge.weight)
  }, [editingEdgeId])

  if (!edge || edge.kind !== 'causal') return null

  const from = graph.nodes.find((n) => n.id === edge.from)
  const to = graph.nodes.find((n) => n.id === edge.to)
  if (!from || !to) return null

  // Approximate t=0.8 position along the straight edge (good enough for popover placement)
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  const x1 = from.x + ux * from.radius
  const y1 = from.y + uy * from.radius
  const x2 = to.x - ux * to.radius
  const y2 = to.y - uy * to.radius
  const px = x1 + 0.8 * (x2 - x1)
  const py = y1 + 0.8 * (y2 - y1)

  function commit() {
    if (!editingEdgeId) return
    setEdgeWeight(editingEdgeId, weight)
    closeEdgeWeightEditor()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') closeEdgeWeightEditor()
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: px,
        top: py + 16,
        transform: 'translateX(-50%)',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 100,
        minWidth: 180,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
      onKeyDown={onKeyDown}
    >
      <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 2 }}>Edge weight</div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={weight}
        onChange={(e) => setWeight(Number(e.target.value))}
        style={{ accentColor: '#38bdf8', width: '100%' }}
        autoFocus
      />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={weight.toFixed(2)}
          onChange={(e) => setWeight(Math.min(1, Math.max(0, Number(e.target.value))))}
          style={inputStyle}
        />
        <button onClick={closeEdgeWeightEditor} style={btnStyle}>Cancel</button>
        <button onClick={commit} style={{ ...btnStyle, background: '#334155' }}>OK</button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 6,
  color: '#f1f5f9',
  padding: '4px 8px',
  fontSize: 13,
  width: 56,
}

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #334155',
  borderRadius: 6,
  color: '#f1f5f9',
  cursor: 'pointer',
  fontSize: 13,
  padding: '4px 10px',
}
