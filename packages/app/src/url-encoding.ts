import { deflateSync, inflateSync } from "fflate/node";
import type { Graph } from "@swoopy/engine";
import { serialize, deserialize } from "@swoopy/engine";

export function encodeGraphForUrl(graph: Graph): string {
  const json = JSON.stringify(serialize(graph));
  const bytes = new TextEncoder().encode(json);
  const compressed = deflateSync(bytes, { raw: true });
  return btoa(String.fromCharCode(...compressed));
}

export function decodeGraphFromUrl(encoded: string): Graph | null {
  if (!encoded) return null;
  try {
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    try {
      const inflated = inflateSync(bytes, { raw: true });
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
