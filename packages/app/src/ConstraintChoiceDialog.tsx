import { useStore } from './store.ts'

export function ConstraintChoiceDialog() {
  const pending = useStore((s) => s.pendingConstraintEdge)
  const { confirmConstraintEdge, cancelConstraintEdge } = useStore.getState()

  if (!pending) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 10,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 200,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: 12 }}>Constraint type</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => confirmConstraintEdge('ceiling')} style={btnStyle}>
          Ceiling ⌈
        </button>
        <button onClick={() => confirmConstraintEdge('floor')} style={btnStyle}>
          Floor ⌊
        </button>
        <button onClick={cancelConstraintEdge} style={{ ...btnStyle, color: '#64748b' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 6,
  color: '#f1f5f9',
  cursor: 'pointer',
  fontSize: 14,
  padding: '6px 14px',
}
