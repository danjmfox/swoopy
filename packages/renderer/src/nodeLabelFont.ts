const MIN_FONT = 9;
const MAX_FONT = 15;
const REF_RADIUS = 30; // M tier
const REF_FONT = 13;

export function nodeLabelFont(radius: number): string {
  const size = Math.round(
    Math.min(MAX_FONT, Math.max(MIN_FONT, (radius / REF_RADIUS) * REF_FONT)),
  );
  return `${size}px system-ui, sans-serif`;
}
