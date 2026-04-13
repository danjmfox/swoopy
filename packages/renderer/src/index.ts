// Renderer package — Canvas 2D + RAF loop. Browser environment only.
// drawScene is environment-agnostic and also works in Node.js (node-canvas).
export { LoopyRenderer } from "./LoopyRenderer.ts";
export type { RendererStore } from "./LoopyRenderer.ts";
export { drawScene } from "./drawScene.ts";
export { hitTest } from "./hitTest.ts";
export type { HitTarget } from "./hitTest.ts";
export { stockIndicator, timebombStrength } from "./indicators.ts";
export type { StockIndicator } from "./indicators.ts";
export { ANNOTATION_WIDTH, ANNOTATION_MIN_HEIGHT } from "./geometry.ts";
