import { NODE_COLOURS } from "@swoopy/engine";
import type { ColourTier } from "@swoopy/engine";

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")
  );
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
