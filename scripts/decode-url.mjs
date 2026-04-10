#!/usr/bin/env node
// Decode a swoopy share URL and pretty-print the graph state.
// Usage:
//   node scripts/decode-url.mjs "http://localhost:5173/?m=...&g=<base64>"
//   node scripts/decode-url.mjs "<base64>"  (just the g= value)

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/decode-url.mjs <url-or-base64>");
  process.exit(1);
}

let b64;
if (input.startsWith("http")) {
  const url = new URL(input);
  b64 = url.searchParams.get("g");
  if (!b64) {
    console.error("No ?g= param found in URL");
    process.exit(1);
  }
} else {
  b64 = input;
}

const raw = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
const { graph } = raw;
const nodeById = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));
const edgeById = Object.fromEntries(graph.edges.map((e) => [e.id, e]));

console.log(`\nVersion: ${raw.version}`);
console.log(`\nNodes (${graph.nodes.length}):`);
for (const n of graph.nodes) {
  console.log(
    `  [${n.id.slice(0, 8)}] ${n.label}  x:${Math.round(n.x)} y:${Math.round(n.y)}`,
  );
}

console.log(`\nEdges (${graph.edges.length}):`);
for (const e of graph.edges) {
  if (e.kind === "causal") {
    const from = nodeById[e.from]?.label ?? e.from.slice(0, 8);
    const to = nodeById[e.to]?.label ?? e.to.slice(0, 8);
    const pol = e.polarity === 1 ? "+" : "−";
    const qf = e.isQuickFix ? " [QF]" : "";
    console.log(
      `  [${e.id.slice(0, 8)}] ${from} -${pol}(w${e.weight})-> ${to}${qf}`,
    );
  } else {
    const from = nodeById[e.from]?.label ?? e.from.slice(0, 8);
    const to = nodeById[e.to]?.label ?? e.to.slice(0, 8);
    console.log(
      `  [${e.id.slice(0, 8)}] ${from} --[${e.constraintKind}]--> ${to}`,
    );
  }
}

if (graph.modulators?.length) {
  console.log(`\nModulators (${graph.modulators.length}):`);
  for (const m of graph.modulators) {
    const src = nodeById[m.from]?.label ?? m.from.slice(0, 8);
    const edge = edgeById[m.target];
    const edgeFrom = edge
      ? (nodeById[edge.from]?.label ?? edge.from.slice(0, 8))
      : "?";
    const edgeTo = edge
      ? (nodeById[edge.to]?.label ?? edge.to.slice(0, 8))
      : "?";
    const pol = m.polarity === 1 ? "+" : "−";
    console.log(
      `  [${m.id.slice(0, 8)}] ${src} --(${pol})--> edge(${edgeFrom} → ${edgeTo})`,
    );
  }
}

if (graph.annotations?.length) {
  console.log(`\nAnnotations (${graph.annotations.length}):`);
  for (const a of graph.annotations) {
    console.log(
      `  [${a.id.slice(0, 8)}] "${a.text.replace(/\n/g, " ")}" x:${Math.round(a.x)} y:${Math.round(a.y)}`,
    );
  }
}
