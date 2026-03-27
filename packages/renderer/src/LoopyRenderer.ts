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
    throw new Error('not implemented')
  }

  stop(): void {
    throw new Error('not implemented')
  }
}
