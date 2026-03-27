import { useStore } from './store.ts'

const SPEEDS = [0.25, 0.5, 1, 2, 4]

export function Toolbar() {
  const simRunning = useStore((s) => s.simRunning)
  const simSpeed = useStore((s) => s.simSpeed)
  const { pauseSim, resumeSim, resetSim, setSimSpeed } = useStore.getState()

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 10,
      padding: '8px 14px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      <button
        onClick={() => simRunning ? pauseSim() : resumeSim()}
        title={simRunning ? 'Pause' : 'Resume'}
        style={btn}
      >
        {simRunning ? '⏸' : '▶'}
      </button>

      <button onClick={() => resetSim()} title="Reset" style={btn}>↺</button>

      <div style={{ width: 1, height: 20, background: '#334155', margin: '0 4px' }} />

      <span style={{ color: '#94a3b8', fontSize: 12 }}>Speed</span>
      {SPEEDS.map((s) => (
        <button
          key={s}
          onClick={() => setSimSpeed(s)}
          title={`${s}×`}
          style={{ ...btn, background: simSpeed === s ? '#334155' : 'transparent', fontWeight: simSpeed === s ? 700 : 400 }}
        >
          {s}×
        </button>
      ))}
    </div>
  )
}

const btn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#f1f5f9',
  cursor: 'pointer',
  fontSize: 15,
  padding: '4px 8px',
  borderRadius: 6,
}
