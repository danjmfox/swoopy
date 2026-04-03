import fs from "node:fs";
import path from "node:path";
import { serialize } from "./packages/engine/src/serialisation.ts";
import type {
  Graph,
  Node,
  Edge,
  NodeId,
  EdgeId,
  DelayLevel,
  ConstraintKind,
} from "./packages/engine/src/types.ts";

/**
 * This script parses MODELS.md and generates Swoopy URLs for each model.
 * Usage: pnpm ts-node scripts/generate-urls.ts
 */

function generateUrl(graph: Graph): string {
  const json = JSON.stringify(serialize(graph));
  const bytes = new TextEncoder().encode(json);
  const encoded = btoa(String.fromCharCode(...bytes));
  return `http://localhost:5173/?g=${encoded}`;
}

function parseModel(content: string): Graph | null {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const nodeSection = content.match(/Nodes:\n([\s\S]*?)(?=\nEdges:|$)/);
  const edgeSection = content.match(/Edges:\n([\s\S]*?)(?=\n\n|$)/);

  if (!nodeSection) return null;

  // Parse Nodes
  const nodeLines = nodeSection[1].split("\n").filter((l) => l.trim());
  nodeLines.forEach((line, i) => {
    const label = line.trim().replace(/\s*\(.*?\)\s*/, ""); // Remove (Stock), (Lever) etc
    const id = `n${i + 1}` as NodeId;

    // Circular layout
    const angle = (i / nodeLines.length) * Math.PI * 2;
    const radius = 250;
    const x = 400 + Math.cos(angle) * radius;
    const y = 300 + Math.sin(angle) * radius;

    nodes.push({
      id,
      label,
      x,
      y,
      radius: 50,
      min: 0,
      max: 10,
      initial: 5,
    });
  });

  // Parse Edges
  if (edgeSection) {
    const edgeLines = edgeSection[1].split("\n").filter((l) => l.trim());
    edgeLines.forEach((line, i) => {
      // Detect constraint vs causal
      const isConstraint =
        line.includes("⊣") ||
        line.includes("⌊") ||
        line.toLowerCase().includes("constraint");

      const parts = line.split(/[→\->⊣⌊]/);
      if (parts.length < 2) return;

      const fromLabel = parts[0].trim();
      const toPart = parts[1].split("(");
      const toLabel = toPart[0].trim();
      const meta = toPart[1] ? toPart[1].split(")")[0] : "";

      const fromNode = nodes.find((n) => n.label === fromLabel);
      const toNode = nodes.find((n) => n.label === toLabel);

      if (!fromNode || !toNode) return;

      const id = `e${i + 1}` as EdgeId;

      if (isConstraint) {
        const kind: ConstraintKind =
          line.includes("⌊") || meta.toLowerCase().includes("floor")
            ? "floor"
            : "ceiling";
        edges.push({
          kind: "constraint",
          id,
          from: fromNode.id,
          to: toNode.id,
          constraintKind: kind,
        });
      } else {
        const polarity =
          meta.includes("-") || meta.toLowerCase().includes("balancing")
            ? -1
            : 1;

        let weight = 1.0;
        const weightMatch = meta.match(/Weight:\s*([\d.]+)/i);
        if (weightMatch) weight = parseFloat(weightMatch[1]);

        let delay: DelayLevel = "none";
        if (meta.toLowerCase().includes("delay: short")) delay = "short";
        if (meta.toLowerCase().includes("delay: medium")) delay = "medium";
        if (meta.toLowerCase().includes("delay: long")) delay = "long";

        edges.push({
          kind: "causal",
          id,
          from: fromNode.id,
          to: toNode.id,
          polarity: polarity as 1 | -1,
          weight,
          delay,
          transferFn: "linear",
        });
      }
    });
  }

  return { nodes, edges };
}

async function main() {
  const modelsPath = path.resolve(process.cwd(), "docs/MODELS.md");
  const content = fs.readFileSync(modelsPath, "utf-8");

  // Split by ## headers
  const sections = content.split(/\n##\s+/);

  console.log("# Swoopy Model URLs\n");

  sections.forEach((section) => {
    const lines = section.split("\n");
    const title = lines[0].trim();
    if (!title || title.startsWith("#")) return;

    const codeBlock = section.match(/```plaintext\n([\s\S]*?)\n```/);
    if (codeBlock) {
      const graph = parseModel(codeBlock[1]);
      if (graph) {
        const url = generateUrl(graph);
        console.log(`### ${title}`);
        console.log(`[Open in Swoopy](${url})\n`);
      }
    }
  });
}

main().catch(console.error);
