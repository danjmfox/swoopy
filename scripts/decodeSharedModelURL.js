import { inflateRawSync } from "zlib";

let b64 = process.argv[2];

try {
  const url = new URL(b64);
  b64 = (url.searchParams.get("g") || b64).replace(/ /g, "+");
} catch (e) {
  // Not a valid URL, assume the argument is the raw base64 string
}

const buf = Buffer.from(b64, "base64");
let d;
try {
  try {
    d = JSON.parse(inflateRawSync(buf).toString());
  } catch {
    d = JSON.parse(buf.toString());
  }
} catch (e) {
  console.error(
    'Error: Failed to decode or parse the Base64 model. Make sure you provided the full URL or the correct value from the "g" parameter.',
  );
  process.exit(1);
}

const nodes = d.graph?.nodes || [];
const edges = d.graph?.edges || [];
const annotations = d.graph?.annotations || [];
const modulators = d.graph?.modulators || [];

console.log("Nodes:");
nodes.forEach((n) =>
  console.log(
    " ",
    n.id.slice(0, 8),
    n.label,
    "| initial:",
    n.initial,
    "| colour:",
    n.colourTier,
  ),
);
console.log("\nEdges:");
edges.forEach((e) => {
  const from =
    nodes.find((n) => n.id === e.from)?.label ??
    e.from?.slice(0, 8) ??
    "unknown";
  const to =
    nodes.find((n) => n.id === e.to)?.label ?? e.to?.slice(0, 8) ?? "unknown";
  if (e.kind === "constraint") {
    console.log(" [CONSTRAINT " + e.constraintKind + "]", from, "⊣", to);
  } else {
    console.log(
      " [" +
        (e.polarity === 1 ? "+" : "-") +
        "] w=" +
        e.weight +
        " delay=" +
        e.delay +
        (e.isQuickFix ? " QF" : ""),
      from,
      "->",
      to,
    );
  }
});
console.log(
  "\nAnnotations:",
  annotations.map((a) => a.text),
);
console.log(
  "\nModulators:",
  modulators.map((m) => {
    const from =
      nodes.find((n) => n.id === m.from)?.label ??
      m.from?.slice(0, 8) ??
      "unknown";
    const edge = edges.find((e) => e.id === m.target);
    const edgeTo = edge
      ? (nodes.find((n) => n.id === edge.to)?.label ?? "unknown")
      : "unknown";
    return (
      (m.polarity === 1 ? "+" : "-") +
      " " +
      from +
      " -> (modulates edge to " +
      edgeTo +
      ")"
    );
  }),
);
