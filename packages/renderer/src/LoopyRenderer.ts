import type { Graph, SimState, Signal, CausalEdge } from '@swoopy/engine'

// Max dt cap prevents simulation jumps on tab wake (PRD §9)
const MAX_DT = 0.05

export interface RendererStore {
  graph: Graph
  sim: SimState
  tickSim: (dt: number) => void
}

// Maps a node value to a fill colour interpolated between cold and hot.
// All values are in the node's designed [min, max] range (SI-07, SI-12).
function activationColour(value: number, min: number, max: number): string {
  const t = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0
  const r = Math.round(30 + t * 200)
  const g = Math.round(30 + (1 - Math.abs(t - 0.5) * 2) * 80)
  const b = Math.round(200 - t * 160)
  return `rgb(${r},${g},${b})`
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, polarity: 1 | -1) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len < 1) return
  const ux = dx / len
  const uy = dy / len

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = polarity === 1 ? '#38bdf8' : '#f87171'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Arrowhead
  const ax = x2 - ux * 10
  const ay = y2 - uy * 10
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(ax + uy * 5, ay - ux * 5)
  ctx.lineTo(ax - uy * 5, ay + ux * 5)
  ctx.closePath()
  ctx.fillStyle = polarity === 1 ? '#38bdf8' : '#f87171'
  ctx.fill()
}

export class LoopyRenderer {
  private rafId: number | null = null
  private lastTime: number | null = null

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly getState: () => RendererStore,
  ) {}

  start(): void {
    this.rafId = requestAnimationFrame(this.tick)
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
      this.lastTime = null
    }
  }

  private tick = (time: number): void => {
    const dt = this.lastTime !== null
      ? Math.min((time - this.lastTime) / 1000, MAX_DT)
      : 1 / 60
    this.lastTime = time

    const state = this.getState()
    state.tickSim(dt)
    this.draw(this.getState())

    this.rafId = requestAnimationFrame(this.tick)
  }

  private draw(state: RendererStore): void {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    const dpr = window.devicePixelRatio
    this.canvas.width = w * dpr
    this.canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.clearRect(0, 0, w, h)

    const { graph, sim } = state
    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]))

    // Edges
    for (const edge of graph.edges) {
      if (edge.kind !== 'causal') continue
      const from = nodeById.get(edge.from)
      const to = nodeById.get(edge.to)
      if (!from || !to) continue
      const dx = to.x - from.x
      const dy = to.y - from.y
      const len = Math.hypot(dx, dy)
      const ux = dx / len
      const uy = dy / len
      drawArrow(
        ctx,
        from.x + ux * from.radius,
        from.y + uy * from.radius,
        to.x - ux * to.radius,
        to.y - uy * to.radius,
        (edge as CausalEdge).polarity,
      )
    }

    // Signals as particles
    for (const signal of sim.signals) {
      const edge = graph.edges.find((e) => e.id === signal.edgeId)
      if (!edge || edge.kind !== 'causal') continue
      const from = nodeById.get(edge.from)
      const to = nodeById.get(edge.to)
      if (!from || !to) continue
      const px = from.x + (to.x - from.x) * signal.progress
      const py = from.y + (to.y - from.y) * signal.progress
      ctx.beginPath()
      ctx.arc(px, py, 5, 0, Math.PI * 2)
      ctx.fillStyle = signal.strength > 0 ? '#7dd3fc' : '#fca5a5'
      ctx.fill()
    }

    // Nodes
    for (const node of graph.nodes) {
      const value = sim.nodeValues.get(node.id) ?? node.initial
      const colour = activationColour(value, node.min, node.max)

      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
      ctx.fillStyle = colour
      ctx.fill()
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.fillStyle = '#f1f5f9'
      ctx.font = `13px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.label, node.x, node.y)
    }
  }
}
