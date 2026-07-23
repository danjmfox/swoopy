#!/usr/bin/env node
// Encodes a graph JSON file into a shareable URL query string.
// Standalone Node script (no dev server / browser dependency) — see AC5,
// docs/feature/swoopy-diagram-agent-authoring/feature-delta.md.
//
// Mirrors packages/app/src/url-encoding.ts's deflate+base64 pipeline via
// node:zlib (not fflate) so this script has no browser/DOM dependency, and
// does not import packages/app/src/url-encoding.ts directly (would break the
// literal `node <file>.js` invocation and the engine<-renderer<-app layering,
// per docs/decisions/adr-001).

import { readFileSync } from "node:fs";
import { deflateRawSync, inflateRawSync } from "node:zlib";

// Serialisation wrapper shape ({ version, graph }) hand-copied from
// packages/engine/src/serialisation.ts — that file is the source of truth
// for CURRENT_VERSION; keep this constant in sync if it changes there.
const SERIALISATION_VERSION = 5;

// Graph/Node/Edge/Modulator/Annotation shapes hand-copied from
// packages/engine/src/types.ts (REUSE-reference-only, not imported at runtime).
const REQUIRED_NODE_FIELDS = [
  "id",
  "label",
  "x",
  "y",
  "radius",
  "sizeTier",
  "colourTier",
  "min",
  "max",
  "initial",
];

const REQUIRED_CAUSAL_EDGE_FIELDS = [
  "id",
  "from",
  "to",
  "polarity",
  "weight",
  "delay",
  "transferFn",
];

const REQUIRED_CONSTRAINT_EDGE_FIELDS = ["id", "from", "to", "constraintKind"];

function missingFields(candidate, requiredFields) {
  return requiredFields.filter((field) => candidate[field] === undefined);
}

function validateNode(node, index) {
  const missing = missingFields(node, REQUIRED_NODE_FIELDS);
  if (missing.length === 0) return null;
  return `nodes[${index}] missing required field(s): ${missing.join(", ")}`;
}

function requiredEdgeFields(edge) {
  return edge.kind === "constraint"
    ? REQUIRED_CONSTRAINT_EDGE_FIELDS
    : REQUIRED_CAUSAL_EDGE_FIELDS;
}

function validateEdge(edge, index, knownNodeIds) {
  const missing = missingFields(edge, requiredEdgeFields(edge));
  if (missing.length > 0) {
    return `edges[${index}] missing required field(s): ${missing.join(", ")}`;
  }
  if (!knownNodeIds.has(edge.from)) {
    return `edges[${index}] references nonexistent "from" node id: ${edge.from}`;
  }
  if (!knownNodeIds.has(edge.to)) {
    return `edges[${index}] references nonexistent "to" node id: ${edge.to}`;
  }
  return null;
}

// Pure function: validates a raw parsed-JSON value against the graph schema.
// Returns { ok: true, graph } or { ok: false, error }.
export function validateGraph(raw) {
  if (raw === null || typeof raw !== "object") {
    return { ok: false, error: "graph must be a JSON object" };
  }

  const { nodes, edges, annotations = [], modulators = [] } = raw;

  if (!Array.isArray(nodes)) {
    return { ok: false, error: "graph.nodes must be an array" };
  }
  if (!Array.isArray(edges)) {
    return { ok: false, error: "graph.edges must be an array" };
  }

  for (const [index, node] of nodes.entries()) {
    const error = validateNode(node, index);
    if (error) return { ok: false, error };
  }

  const knownNodeIds = new Set(nodes.map((node) => node.id));
  for (const [index, edge] of edges.entries()) {
    const error = validateEdge(edge, index, knownNodeIds);
    if (error) return { ok: false, error };
  }

  return { ok: true, graph: { nodes, edges, annotations, modulators } };
}

// Pure function: serialises + compresses + base64-encodes a valid graph.
export function encodeGraph(graph) {
  const serialised = { version: SERIALISATION_VERSION, graph };
  const json = JSON.stringify(serialised);
  const compressed = deflateRawSync(Buffer.from(json, "utf8"));
  return compressed.toString("base64");
}

// Pure function: inverse of encodeGraph, used for the self-check before
// printing the URL (never trust an encode you haven't proven decodes back).
export function decodeForSelfCheck(encoded) {
  const compressed = Buffer.from(encoded, "base64");
  const json = inflateRawSync(compressed).toString("utf8");
  return JSON.parse(json);
}

function buildShareUrlQuery(encodedGraph, title) {
  const params = new URLSearchParams({ g: encodedGraph });
  if (title) params.set("title", title);
  return `?${params.toString()}`;
}

function parseArgs(argv) {
  const [filePath, ...rest] = argv;
  const titleIndex = rest.indexOf("--title");
  const title = titleIndex >= 0 ? rest[titleIndex + 1] : undefined;
  return { filePath, title };
}

// Imperative shell: reads argv/file, writes stdout XOR stderr, sets exit code.
function main() {
  const { filePath, title } = parseArgs(process.argv.slice(2));

  if (!filePath) {
    console.error(
      "Error: expected a graph JSON file path as the first argument",
    );
    process.exit(1);
    return;
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`Error: failed to read or parse graph file — ${err.message}`);
    process.exit(1);
    return;
  }

  const validation = validateGraph(raw);
  if (!validation.ok) {
    console.error(`Error: invalid graph — ${validation.error}`);
    process.exit(1);
    return;
  }

  const encoded = encodeGraph(validation.graph);
  const roundtripped = decodeForSelfCheck(encoded);
  if (JSON.stringify(roundtripped.graph) !== JSON.stringify(validation.graph)) {
    console.error("Error: internal roundtrip self-check failed");
    process.exit(1);
    return;
  }

  console.log(buildShareUrlQuery(encoded, title));
}

main();
