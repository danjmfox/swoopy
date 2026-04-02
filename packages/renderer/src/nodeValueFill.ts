import { NODE_COLOURS } from "@swoopy/engine";
import type { ColourTier } from "@swoopy/engine";

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("")
  );
}

// WCAG 2.1 relative luminance (IEC 61966-2-1 sRGB)
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Returns WCAG-compliant label colour for a given fill.
// Threshold L > 0.18 is the crossover where both #0f172a and #f1f5f9
// achieve ≥ 4.5:1 contrast (WCAG AA normal text).
// NOTE: red/green tiers are indistinguishable for deuteranopes (~8% of males);
// shape/label differentiation is required for full CVD support.
export function textOnFill(fill: string): string {
  return relativeLuminance(fill) > 0.18 ? "#0f172a" : "#f1f5f9";
}

export function nodeValueFill(ratio: number, tier: ColourTier): string {
  const t = Math.max(0, Math.min(1, ratio));
  const { low, high } = NODE_COLOURS[tier];
  if (t === 0) return low;
  if (t === 1) return high;
  const [lr, lg, lb] = hexToRgb(low);
  const [hr, hg, hb] = hexToRgb(high);
  return rgbToHex(lr + t * (hr - lr), lg + t * (hg - lg), lb + t * (hb - lb));
}
