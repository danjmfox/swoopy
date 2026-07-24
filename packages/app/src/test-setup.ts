import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);

// jsdom does not implement the PointerEvent constructor (a long-standing
// jsdom gap — pointer events are not in its DOM support matrix). Without
// this shim, @testing-library's fireEvent.pointerDown/Move/Up fall back to
// a plain Event, silently discarding clientX/clientY from the init dict —
// breaking any test that depends on real pointer coordinates (e.g.
// canvas-pan-zoom-navigation's drag-distance/viewport-delta assertions).
// MouseEvent (which jsdom does support) already implements the clientX/Y
// init handling PointerEvent needs, so subclassing it is sufficient here.
if (typeof globalThis.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;

    constructor(
      type: string,
      params: MouseEventInit & {
        pointerId?: number;
        pointerType?: string;
        isPrimary?: boolean;
      } = {},
    ) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? "mouse";
      this.isPrimary = params.isPrimary ?? true;
    }
  }
  (globalThis as unknown as { PointerEvent: unknown }).PointerEvent =
    PointerEventPolyfill;
}
