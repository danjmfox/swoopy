// Max dt cap prevents simulation jumps on tab wake (PRD §9)
const MAX_DT = 0.05

export interface RendererStore {
  tickSim: (dt: number) => void
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

    this.getState().tickSim(dt)

    this.rafId = requestAnimationFrame(this.tick)
  }
}
