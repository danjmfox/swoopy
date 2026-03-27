---
id: DR--20260327--renderer--dpr-css-pixel-geometry
dateCreated: '2026-03-27'
version: 1.0.0
status: draft
changeType: creation
domain: renderer
slug: dpr-css-pixel-geometry
changelog:
  - date: '2026-03-27'
    note: Initial creation — captured at canvas mount (step 5)
  - date: '2026-03-27'
    note: Marked as draft
lastEdited: '2026-03-27'
---
# All geometry and hit testing operate in CSS pixels; DPR applied at draw time only

## 🧭 Context

Canvas 2D requires explicit DPR handling to avoid blurry rendering on
high-density displays. There are two natural places to apply the DPR scale
factor: at the geometry level (all coordinates in physical pixels) or at
draw time only (coordinates stay in CSS pixels, DPR applied via
`ctx.setTransform` before drawing).

The choice affects hit testing: if geometry is in physical pixels, pointer
events (which are always in CSS pixels) must be scaled before hit testing.

## ⚖️ Options Considered

| Option | Description | Outcome | Rationale |
|--------|-------------|---------|-----------|
| A | All geometry in physical pixels; divide pointer events by DPR for hit testing | Rejected | Every hit test call site must remember to divide; easy to miss, hard to test |
| B | Geometry and hit testing in CSS pixels; multiply by DPR only in `ctx.setTransform` at draw time | Chosen | Single point of DPR application; hit testing and engine geometry stay in one coordinate space |

## 🧠 Decision

All node positions, radii, edge coordinates, and hit test regions are
expressed in **CSS pixels**. The renderer applies `ctx.setTransform(dpr, 0,
0, dpr, 0, 0)` once per frame before drawing, scaling canvas output to
physical pixels without touching the coordinate system used by the rest of
the code. Pointer event coordinates need no transformation before hit testing.

## 🪶 Principles

- **Stewardship:** One coordinate system throughout. Hit testing is testable
  without a canvas instance (PRD §5.3) because it operates on plain numbers
  with no DPR dependency.
- **Justice:** The PRD risk table (§9) calls out hit testing imprecision on
  high-DPR displays — this decision closes that risk at the source rather
  than patching at each call site.

## 🔁 Lifecycle

Status: `new` → advance to `draft` once reviewed.

## 🧩 Reasoning

`ResizeObserver` triggers the resize/redraw; the canvas backing store
dimensions are set to `clientWidth × dpr` × `clientHeight × dpr`. The
transform is reset via `setTransform` (not `scale`) to avoid compounding on
repeated calls. All downstream code — engine geometry, renderer draw, hit
testing — works in CSS pixels.

## 🔄 Next Actions

- Advance to `proposed` after review
- Carry this constraint explicitly into the renderer package (step 6) and
  hit testing implementation (step 8)

## 🧠 Confidence

High. This is an established pattern for Canvas 2D on high-DPR displays and
is consistent with PRD §9.

## 🧾 Changelog

| Date | Note |
|------|------|
| 2026-03-27 | Initial draft — captured at canvas mount implementation (feat/step-5-canvas-mount) |
