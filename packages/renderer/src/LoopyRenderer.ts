import type { Graph, SimState, CausalEdge, ConstraintEdge } from '@swoopy/engine'
import { bezierPoint, controlPoint, BOW, T_DELAY, T_POLARITY, T_WEIGHT } from './geometry.ts'

const MAX_DT = 0.05
const DELAY_MARKS: Record<string, number> = { none: 0, short: 2, medium: 4, long: 6 }

export interface RendererStore {
  graph: Graph
  sim: SimState
  simRunning: boolean
  simSpeed: number
  tickSim: (dt: number) => void
}

function activationColour(value: number, min: number, max: number): string {
  const t = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0
  const r = Math.round(30 + t * 200)
  const g = Math.round(30 + (1 - Math.abs(t - 0.5) * 2) * 80)
  const b = Math.round(200 - t * 160)
  return `rgb(${r},${g},${b})`
}

function drawCurvedArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  edge: CausalEdge,
  bow: number,
) {
  const colour = edge.polarity === 1 ? '#38bdf8' : '#f87171'
  const { cx, cy } = controlPoint(x1, y1, x2, y2, bow)

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo(cx, cy, x2, y2)
  ctx.strokeStyle = colour
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Arrowhead
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

  // Polarity badge at t=0.5
  const mid = bezierPoint(x1, y1, cx, cy, x2, y2, T_POLARITY)
  ctx.beginPath()
  ctx.arc(mid.x, mid.y, 9, 0, Math.PI * 2)
  ctx.fillStyle = '#0f172a'
  ctx.fill()
  ctx.strokeStyle = colour
  ctx.lineWidth = 1.2
  ctx.stroke()
  ctx.fillStyle = colour
  ctx.font = 'bold 11px system-ui'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(edge.polarity === 1 ? '+' : '−', mid.x, mid.y)

  // Delay bars at t=0.2
  const marks = DELAY_MARKS[edge.delay] ?? 0
  if (marks > 0) {
    const dp = bezierPoint(x1, y1, cx, cy, x2, y2, T_DELAY)
    ctx.strokeStyle = colour
    ctx.lineWidth = 1.5
    for (let i = 0; i < marks; i++) {
      const ox = (i - (marks - 1) / 2) * 4
      ctx.beginPath()
      ctx.moveTo(dp.x + ox, dp.y - 5)
      ctx.lineTo(dp.x + ox, dp.y + 5)
      ctx.stroke()
    }
  }

  // Weight indicator at t=0.8 — show as dim number if < 1.0
  if (edge.weight < 1.0) {
    const wp = bezierPoint(x1, y1, cx, cy, x2, y2, T_WEIGHT)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(edge.weight.toFixed(2), wp.x, wp.y - 8)
  }
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
    if (state.simRunning) state.tickSim(dt * state.simSpeed)
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
    const constraintEdges = graph.edges.filter((e): e is ConstraintEdge => e.kind === 'constraint')

    const hasReverse = new Set(
      causalEdges
        .filter((e) => causalEdges.some((r) => r.from === e.to && r.to === e.from))
        .map((e) => e.id),
    )

    // Constraint edges — dashed lines, no arrowhead, ⌈/⌊ label
    for (const edge of constraintEdges) {
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
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.setLineDash([])
      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2
      ctx.fillStyle = '#94a3b8'
      ctx.font = '14px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(edge.constraintKind === 'ceiling' ? '⌈' : '⌊', mx, my - 10)
    }

    // Causal edges
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
        edge,
        hasReverse.has(edge.id) ? BOW : 0,
      )
    }

    // Signal particles
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
