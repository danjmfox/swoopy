import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

// Acceptance tests for docs/feature/swoopy-diagram-agent-authoring/feature-delta.md
// Story 1 (encode script) and Story 2 (guidance doc) AC.
// Driving Adapter Verification: exercises the script via real subprocess invocation
// (node <file>), not by importing its internals — proves the CLI actually wires up.

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(SCRIPTS_DIR, "encodeSharedModelURL.js");
const DOC = join(SCRIPTS_DIR, "..", "docs", "AGENT-GRAPH-AUTHORING.md");

function writeTempGraph(graph) {
  const dir = mkdtempSync(join(tmpdir(), "swoopy-encode-"));
  const file = join(dir, "graph.json");
  writeFileSync(file, JSON.stringify(graph));
  return file;
}

function runScript(args) {
  try {
    const stdout = execFileSync("node", [SCRIPT, ...args], {
      encoding: "utf8",
    });
    return { code: 0, stdout, stderr: "" };
  } catch (err) {
    return {
      code: err.status ?? 1,
      stdout: err.stdout?.toString() ?? "",
      stderr: err.stderr?.toString() ?? "",
    };
  }
}

// Query params live either in a full URL or a bare query string — the encode
// script's exact base/origin choice is an implementation detail DISTILL does
// not pin down (see feature-delta.md open questions). Extraction must not
// assume either shape.
function extractParams(stdout) {
  const line = stdout.trim();
  const qIndex = line.indexOf("?");
  const queryString = qIndex >= 0 ? line.slice(qIndex + 1) : line;
  return new URLSearchParams(queryString);
}

function decodeGraphFromParams(params) {
  const buf = Buffer.from(params.get("g") ?? "", "base64");
  return JSON.parse(inflateRawSync(buf).toString("utf8"));
}

const validGraph = {
  nodes: [
    {
      id: "n1",
      label: "Births",
      x: 0,
      y: 0,
      radius: 40,
      sizeTier: 1,
      colourTier: 1,
      min: 0,
      max: 100,
      initial: 10,
    },
    {
      id: "n2",
      label: "Population",
      x: 100,
      y: 0,
      radius: 40,
      sizeTier: 1,
      colourTier: 1,
      min: 0,
      max: 1000,
      initial: 50,
    },
  ],
  edges: [
    {
      kind: "causal",
      id: "e1",
      from: "n1",
      to: "n2",
      polarity: 1,
      weight: 3,
      delay: "none",
      transferFn: "linear",
    },
  ],
  annotations: [],
  modulators: [],
};

describe("scripts/encodeSharedModelURL.js — driving adapter (Story 1)", () => {
  it("given a valid graph file, prints a share URL (and only the URL) to stdout and exits 0 @walking_skeleton @driving_adapter", () => {
    const file = writeTempGraph(validGraph);
    const { code, stdout } = runScript([file]);
    expect(code).toBe(0);
    expect(stdout.trim().split("\n")).toHaveLength(1);
    expect(extractParams(stdout).has("g")).toBe(true);
  });

  it("the printed URL roundtrips back to the exact input graph @real-io AC2", () => {
    const file = writeTempGraph(validGraph);
    const { code, stdout } = runScript([file]);
    expect(code, "expected a successful encode before checking roundtrip").toBe(
      0,
    );
    const decoded = decodeGraphFromParams(extractParams(stdout));
    expect(decoded.graph).toEqual(validGraph);
  });

  it("given an edge referencing a nonexistent node id, exits non-zero with a stderr error and prints no URL @error AC3", () => {
    const badGraph = {
      ...validGraph,
      edges: [{ ...validGraph.edges[0], to: "does-not-exist" }],
    };
    const file = writeTempGraph(badGraph);
    const { code, stdout, stderr } = runScript([file]);
    expect(code).not.toBe(0);
    expect(stderr.length).toBeGreaterThan(0);
    expect(extractParams(stdout).has("g")).toBe(false);
  });

  it("given a node missing required fields, exits non-zero with a stderr error and prints no URL @error AC3", () => {
    const badGraph = {
      ...validGraph,
      nodes: [{ id: "n1", x: 0, y: 0 }, validGraph.nodes[1]],
    };
    const file = writeTempGraph(badGraph);
    const { code, stdout, stderr } = runScript([file]);
    expect(code).not.toBe(0);
    expect(stderr.length).toBeGreaterThan(0);
    expect(extractParams(stdout).has("g")).toBe(false);
  });

  it("accepts --title and includes it in the resulting title param AC4", () => {
    const file = writeTempGraph(validGraph);
    const { stdout } = runScript([file, "--title", "Population Growth"]);
    expect(extractParams(stdout).get("title")).toBe("Population Growth");
  });

  // AC5 (standalone, no dev server / browser dependency) is proven structurally
  // by every test above: each invokes plain `node <script>` with no server running.
});

describe("docs/AGENT-GRAPH-AUTHORING.md — guidance doc (Story 2)", () => {
  it("documents the Graph/Node/Edge/Modulator/Annotation shapes AC1", () => {
    const doc = readFileSync(DOC, "utf8");
    for (const shape of [
      "Graph",
      "Node",
      "CausalEdge",
      "ConstraintEdge",
      "Modulator",
      "Annotation",
    ]) {
      expect(doc).toContain(shape);
    }
  });

  it("includes a worked example graph that validates via the encode script @real-io AC2", () => {
    const doc = readFileSync(DOC, "utf8");
    const match = doc.match(/```json\n([\s\S]*?)\n```/);
    expect(match, "expected at least one ```json fenced code block").not
      .toBeNull();
    const example = JSON.parse(match[1]);
    const file = writeTempGraph(example);
    const { code } = runScript([file]);
    expect(code).toBe(0);
  });

  it("documents the exact script invocation, the g= query param, and --title AC3", () => {
    const doc = readFileSync(DOC, "utf8");
    expect(doc).toContain("node scripts/encodeSharedModelURL.js");
    expect(doc).toContain("--title");
    expect(doc).toMatch(/g=/);
  });

  it("states the edit-and-rerun iteration loop AC4", () => {
    const doc = readFileSync(DOC, "utf8").toLowerCase();
    expect(doc).toMatch(/edit|iterat|re-run|rerun/);
  });
});
