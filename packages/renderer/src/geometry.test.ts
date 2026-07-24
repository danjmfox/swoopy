/**
 * Tests for bezier geometry utilities
 * DR--20260408--engine--signal-direction: bezierTangent needed for signal direction chevron
 *
 * Viewport transform tests below (canvas-pan-zoom-navigation, DISTILL wave):
 * screenToGraph/graphToScreen/clampZoom/zoomAtCursor/computeFitViewport are
 * RED scaffolds (__SCAFFOLD_VIEWPORT__ in geometry.ts) — these property
 * tests fail with the scaffold's thrown Error until DELIVER implements the
 * real transform. See docs/scenarios/canvas-pan-zoom-navigation/acceptance.feature
 * for the matching Gherkin (@contract-shape:pure-function scenarios).
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  bezierTangent,
  screenToGraph,
  graphToScreen,
  clampZoom,
  zoomAtCursor,
  computeFitViewport,
  ZOOM_MIN,
  ZOOM_MAX,
  RESET_VIEW_ZOOM_FLOOR,
  type Viewport,
} from "./geometry.ts";

describe("bezierTangent", () => {
  it("returns a unit vector for a straight horizontal bezier", () => {
    // A→B along x-axis: start=(0,0) cp=(5,0) end=(10,0)
    // Tangent should point right: {dx: 1, dy: 0} at any t
    const { dx, dy } = bezierTangent(0, 0, 5, 0, 10, 0, 0.5);
    expect(dx).toBeCloseTo(1, 5);
    expect(dy).toBeCloseTo(0, 5);
  });

  it("returns a unit vector for a straight vertical bezier", () => {
    // start=(0,0) cp=(0,5) end=(0,10)
    const { dx, dy } = bezierTangent(0, 0, 0, 5, 0, 10, 0.5);
    expect(dx).toBeCloseTo(0, 5);
    expect(dy).toBeCloseTo(1, 5);
  });

  it("returned vector has unit length", () => {
    // Any quadratic bezier tangent should be normalized
    const { dx, dy } = bezierTangent(0, 0, 10, 20, 30, 5, 0.3);
    expect(Math.hypot(dx, dy)).toBeCloseTo(1, 5);
  });
});

// ─── Viewport transform (US-01/US-02/US-03, canvas-pan-zoom-navigation) ─────

const floatIn = (min: number, max: number) =>
  fc.float({ min: Math.fround(min), max: Math.fround(max), noNaN: true });

const viewportArbitrary: fc.Arbitrary<Viewport> = fc.record({
  panX: floatIn(-2000, 2000),
  panY: floatIn(-2000, 2000),
  zoom: floatIn(ZOOM_MIN, ZOOM_MAX),
});

describe("clampZoom — AC-02b zoom clamping (@contract-shape:pure-function)", () => {
  // C1: equivalence & boundary
  it.each([
    [0.1, ZOOM_MIN],
    [ZOOM_MIN, ZOOM_MIN],
    [2, 2],
    [ZOOM_MAX, ZOOM_MAX],
    [10, ZOOM_MAX],
  ])("clamps %f to %f", (input, expected) => {
    expect(clampZoom(input)).toBeCloseTo(expected, 5);
  });

  it("property: clampZoom always returns a value within [ZOOM_MIN, ZOOM_MAX]", () => {
    fc.assert(
      fc.property(floatIn(-100000, 100000), (zoom) => {
        const result = clampZoom(zoom);
        expect(result).toBeGreaterThanOrEqual(ZOOM_MIN);
        expect(result).toBeLessThanOrEqual(ZOOM_MAX);
      }),
    );
  });

  it("property: clampZoom is idempotent — clamping a clamped value is a no-op", () => {
    fc.assert(
      fc.property(floatIn(-100000, 100000), (zoom) => {
        const once = clampZoom(zoom);
        const twice = clampZoom(once);
        expect(twice).toBeCloseTo(once, 10);
      }),
    );
  });
});

describe("screenToGraph / graphToScreen — AC-01c/AC-02d hit-test accuracy (@contract-shape:pure-function)", () => {
  it("identity viewport (pan 0,0 zoom 1) maps screen coordinates unchanged", () => {
    const identity: Viewport = { panX: 0, panY: 0, zoom: 1 };
    expect(screenToGraph(identity, 123, 456)).toEqual({ x: 123, y: 456 });
  });

  it("property: graphToScreen(screenToGraph(v, x, y)) round-trips to (x, y)", () => {
    fc.assert(
      fc.property(
        viewportArbitrary,
        floatIn(-5000, 5000),
        floatIn(-5000, 5000),
        (viewport, sx, sy) => {
          const graph = screenToGraph(viewport, sx, sy);
          const screen = graphToScreen(viewport, graph.x, graph.y);
          expect(screen.x).toBeCloseTo(sx, 3);
          expect(screen.y).toBeCloseTo(sy, 3);
        },
      ),
    );
  });
});

describe("zoomAtCursor — AC-02a cursor-centered zoom (@contract-shape:pure-function)", () => {
  it("property: the graph-space point under the cursor stays fixed after zooming", () => {
    fc.assert(
      fc.property(
        viewportArbitrary,
        floatIn(0, 1000),
        floatIn(0, 1000),
        floatIn(-500, 500),
        (viewport, cursorX, cursorY, deltaY) => {
          const before = screenToGraph(viewport, cursorX, cursorY);
          const after = zoomAtCursor(viewport, cursorX, cursorY, deltaY);
          const afterGraphPoint = screenToGraph(after, cursorX, cursorY);
          expect(afterGraphPoint.x).toBeCloseTo(before.x, 2);
          expect(afterGraphPoint.y).toBeCloseTo(before.y, 2);
        },
      ),
    );
  });

  it("property: zoomAtCursor result is always within clamped zoom bounds (AC-02b)", () => {
    fc.assert(
      fc.property(
        viewportArbitrary,
        floatIn(0, 1000),
        floatIn(0, 1000),
        floatIn(-10000, 10000),
        (viewport, cursorX, cursorY, deltaY) => {
          const after = zoomAtCursor(viewport, cursorX, cursorY, deltaY);
          expect(after.zoom).toBeGreaterThanOrEqual(ZOOM_MIN);
          expect(after.zoom).toBeLessThanOrEqual(ZOOM_MAX);
        },
      ),
    );
  });
});

describe("computeFitViewport — AC-03a/b/c reset-to-fit (@contract-shape:pure-function)", () => {
  // C3: count cardinality 0/1/many
  it("0 nodes: returns the identity viewport (zoom=1, pan=(0,0)) — DDD-6", () => {
    const result = computeFitViewport([], [], 800, 600);
    expect(result).toEqual({ panX: 0, panY: 0, zoom: 1 });
  });

  it("1 node: returns a centered, non-extreme, finite zoom", () => {
    const result = computeFitViewport(
      [{ x: 100, y: 100, radius: 30 }],
      [],
      800,
      600,
    );
    expect(result.zoom).toBeGreaterThan(0);
    expect(result.zoom).toBeLessThanOrEqual(ZOOM_MAX);
    expect(Number.isFinite(result.panX)).toBe(true);
    expect(Number.isFinite(result.panY)).toBe(true);
  });

  it("property: for any node count (0/1/many), the result is finite and within [RESET_VIEW_ZOOM_FLOOR, ZOOM_MAX] — AC-03c (ADR-005: Reset View's own floor, not manual zoom's ZOOM_MIN)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            x: floatIn(-5000, 5000),
            y: floatIn(-5000, 5000),
            radius: floatIn(1, 100),
          }),
          { minLength: 0, maxLength: 30 },
        ),
        (nodes) => {
          const result = computeFitViewport(nodes, [], 800, 600);
          expect(Number.isFinite(result.panX)).toBe(true);
          expect(Number.isFinite(result.panY)).toBe(true);
          expect(Number.isFinite(result.zoom)).toBe(true);
          expect(result.zoom).toBeGreaterThanOrEqual(RESET_VIEW_ZOOM_FLOOR);
          expect(result.zoom).toBeLessThanOrEqual(ZOOM_MAX);
        },
      ),
    );
  });

  it("property: after fitting, every node's screen position lies within the canvas bounds — AC-03a", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            x: floatIn(-2000, 2000),
            y: floatIn(-2000, 2000),
            radius: floatIn(1, 50),
          }),
          { minLength: 1, maxLength: 20 },
        ),
        (nodes) => {
          const width = 800;
          const height = 600;
          const viewport = computeFitViewport(nodes, [], width, height);
          for (const n of nodes) {
            const screen = graphToScreen(viewport, n.x, n.y);
            expect(screen.x).toBeGreaterThanOrEqual(-1);
            expect(screen.x).toBeLessThanOrEqual(width + 1);
            expect(screen.y).toBeGreaterThanOrEqual(-1);
            expect(screen.y).toBeLessThanOrEqual(height + 1);
          }
        },
      ),
    );
  });
});
