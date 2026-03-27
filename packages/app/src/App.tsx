import { Canvas } from './Canvas.tsx'
import { Toolbar } from './Toolbar.tsx'

export function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0f172a' }}>
      <Canvas />
      <Toolbar />
    </div>
  )
}
