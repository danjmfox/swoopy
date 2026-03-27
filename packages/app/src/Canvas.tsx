import { useEffect, useRef } from 'react'

function drawScene(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height)

  const cx = width / 2
  const cy = height / 2
  const r = 48

  // Node fill
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = '#1e293b'
  ctx.fill()
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 2
  ctx.stroke()

  // Label
  ctx.fillStyle = '#f1f5f9'
  ctx.font = '14px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Population', cx, cy)
}

export function Canvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas || !ctx) return
      // DPR scaling applied here at draw time only.
      // All geometry and hit testing operate in CSS pixels.
      const dpr = window.devicePixelRatio
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawScene(ctx, w, h)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    return () => observer.disconnect()
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
