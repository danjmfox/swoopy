import { deflateSync, inflateSync } from "fflate";
import type { Graph } from "@swoopy/engine";
import { serialize, deserialize } from "@swoopy/engine";

export function encodeGraphForUrl(graph: Graph): string {
  const json = JSON.stringify(serialize(graph));
  const bytes = new TextEncoder().encode(json);
  const compressed = deflateSync(bytes, { raw: true } as Parameters<typeof deflateSync>[1]);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < compressed.length; i += chunk) {
    binary += String.fromCharCode(...compressed.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function decodeGraphFromUrl(encoded: string): Graph | null {
  if (!encoded) return null;
  try {
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    try {
      const inflated = inflateSync(bytes, { raw: true } as Parameters<typeof inflateSync>[1]);
      const json = new TextDecoder().decode(inflated);
      return deserialize(JSON.parse(json));
    } catch {
      const json = new TextDecoder().decode(bytes);
      return deserialize(JSON.parse(json));
    }
  } catch {
    return null;
  }
}
