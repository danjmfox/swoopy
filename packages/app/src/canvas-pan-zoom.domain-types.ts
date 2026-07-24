/**
 * Domain types for canvas-pan-zoom-navigation acceptance tests (Mandate-12 —
 * SSOT via types; TypeScript adaptation of the Python `domain_types.py`
 * pilot convention). Every domain noun used in the acceptance Gherkin
 * (docs/scenarios/canvas-pan-zoom-navigation/acceptance.feature) that has a
 * closed, enumerable set of values is typed here — never a raw string.
 */

/** The two wheel-event shapes a browser delivers for zoom input (DEVOPS environments.yaml). */
export enum WheelInputPath {
  MouseWheelDesktop = "mouse-wheel-desktop",
  TrackpadPinchCtrlWheel = "trackpad-pinch-ctrl-wheel",
}

/** C3 (Count Cardinality) — the three diagram-size classes Reset View must handle (US-03). */
export enum DiagramSize {
  Empty = "empty",
  Single = "single",
  Many = "many",
}
