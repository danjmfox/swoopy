import type { Graph, SimState, CausalEdge } from '@swoopy/engine'

const MAX_DT = 0.05
const BOW = 28 // px perpendicular offset for parallel edge pairs

export interface RendererStore {
  graph: Graph
  sim: SimState
  tickSim: (dt: number) => void
}

function activationColour(value: number, min: number, max: number): string {
  const t = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0
  const r = Math.round(30 + t * 200)
  const g = Math.round(30 + (1 - Math.abs(t - 0.5) * 2) * 80)
  const b = Math.round(200 - t * 160)
  return `rgb(${r},${g},${b})`
}

// Quadratic bezier point at t
function bezierPoint(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, t: number) {
  const mt = 1 - t
  return {
    x: mt * mt * x1 + 2 * mt * t * cx + t * t * x2,
    y: mt * mt * y1 + 2 * mt * t * cy + t * t * y2,
  }
}

// Control point for a bowed edge. bow > 0 = bow right relative to travel direction.
function controlPoint(x1: number, y1: number, x2: number, y2: number, bow: number) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  if (len < 1) return { cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 }
  // Right perpendicular: rotate (dx,dy) 90° clockwise → (dy, -dx)
  const px = (y2 - y1) / len
  const py = -(x2 - x1) / len
  return { cx: (x1 + x2) / 2 + px * bow, cy: (y1 + y2) / 2 + py * bow }
}

function drawCurvedArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  polarity: 1 | -1,
  bow: number,
) {
  const colour = polarity === 1 ? '#38bdf8' : '#f87171'
  const { cx, cy } = controlPoint(x1, y1, x2, y2, bow)

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo(cx, cy, x2, y2)
  ctx.strokeStyle = colour
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Arrowhead tangent = direction from control point to end point
  const tlen = Math.hypot(x2 - cx, y2 - cy)
  const ux = (x2 - cx) / tlen
  const uy = (y2 - cy) / tlen
  const ax = x2 - ux * 10
  const ay = y2 - uy * 10
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(ax + uy * 5, ay - ux * 5)
  ctx.lineTo(ax - uy * 5, ay + ux * 5)
  ctx.closePath()
  ctx.fillStyle = colour
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
    const causalEdges = graph.edges.filter((e): e is CausalEdge => e.kind === 'causal')

    // Detect which edges have a parallel reverse — those get bowed apart
    const hasReverse = new Set(
      causalEdges
        .filter((e) => causalEdges.some((r) => r.from === e.to && r.to === e.from))
        .map((e) => e.id),
    )

    // Edges
    for (const edge of causalEdges) {
      const from = nodeById.get(edge.from)
      const to = nodeById.get(edge.to)
      if (!from || !to) continue

      const dx = to.x - from.x
      const dy = to.y - from.y
      const len = Math.hypot(dx, dy)
      const ux = dx / len
      const uy = dy / len

      drawCurvedArrow(
        ctx,
        from.x + ux * from.radius,
        from.y + uy * from.radius,
        to.x - ux * to.radius,
        to.y - uy * to.radius,
        edge.polarity,
        hasReverse.has(edge.id) ? BOW : 0,
      )
    }

    // Signal particles — position along the bowed curve
    for (const signal of sim.signals) {
      const edge = causalEdges.find((e) => e.id === signal.edgeId)
      if (!edge) continue
      const from = nodeById.get(edge.from)
      const to = nodeById.get(edge.to)
      if (!from || !to) continue

      const dx = to.x - from.x
      const dy = to.y - from.y
      const len = Math.hypot(dx, dy)
      const ux = dx / len
      const uy = dy / len
      const x1 = from.x + ux * from.radius
      const y1 = from.y + uy * from.radius
      const x2 = to.x - ux * to.radius
      const y2 = to.y - uy * to.radius
      const bow = hasReverse.has(edge.id) ? BOW : 0
      const { cx, cy } = controlPoint(x1, y1, x2, y2, bow)
      const { x: px, y: py } = bezierPoint(x1, y1, cx, cy, x2, y2, signal.progress)

      ctx.beginPath()
      ctx.arc(px, py, 5, 0, Math.PI * 2)
      ctx.fillStyle = signal.strength > 0 ? '#7dd3fc' : '#fca5a5'
      ctx.fill()
    }

    // Nodes
    for (const node of graph.nodes) {
      const value = sim.nodeValues.get(node.id) ?? node.initial
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
      ctx.fillStyle = activationColour(value, node.min, node.max)
      ctx.fill()
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.fillStyle = '#f1f5f9'
      ctx.font = '13px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.label, node.x, node.y)
    }
  }
}
