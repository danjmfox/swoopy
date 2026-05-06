/**
 * Acceptance scenarios for URL + localStorage persistence (SE-07 through SE-09).
 * Exercises the real store functions through the public store API.
 *
 * Gaps filled vs. existing test suite:
 *   - Auto-save contract: addNode/addEdge actually write to localStorage (AC-01a)
 *   - loadFromUrl sets transient: true (AC-02a) — persistence.integration.test.ts
 *     only checks the round-trip, not the transient flag
 *   - Fork-on-first-edit: first mutation on transient model generates new UUID,
 *     original key untouched (AC-02b/c) — not tested anywhere
 *   - Legacy key migration: loadPersistedGraph migrates swoopy_graph → scoped key (AC-03)
 *   - newModel: blank canvas, previous model preserved, undo cleared, URL updated (AC-04)
 *
 * Walking skeleton strategy: C (Real local). jsdom provides real localStorage
 * and a real history/URL stack. No mocks needed for these scenarios.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useStore } from "./store.ts";
import { encodeGraphForUrl } from "./url-encoding.ts";
import { serialize } from "@swoopy/engine";
import type { Graph } from "@swoopy/engine";

const FIXED_ID = "acceptance-test-fixed-id";
const emptyGraph: Graph = { nodes: [], edges: [], annotations: [], modulators: [] };

function resetStore(overrides: Partial<Parameters<typeof useStore.setState>[0]> = {}) {
  useStore.setState({
    graph: emptyGraph,
    modelId: FIXED_ID,
    modelTitle: "",
    transient: false,
    past: [],
    future: [],
    ...overrides,
  } as Parameters<typeof useStore.setState>[0]);
}

// ── US-01: Auto-save on mutation ──────────────────────────────────────────────

describe("US-01 — auto-save: every graph mutation writes to localStorage (AC-01a)", () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "?");
    resetStore();
  });

  afterEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "?");
  });

  it("addNode writes a serialized graph to localStorage under swoopy_graph_<modelId>", () => {
    useStore.getState().addNode(100, 200);
    const raw = localStorage.getItem(`swoopy_graph_${FIXED_ID}`);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(5);
    expect(parsed.graph.nodes).toHaveLength(1);
  });

  it("addEdge updates the localStorage entry with the new edge", () => {
    useStore.getState().addNode(0, 0);
    useStore.getState().addNode(100, 0);
    const { nodes } = useStore.getState().graph;
    useStore.getState().addEdge(nodes[0]!.id, nodes[1]!.id);
    const raw = localStorage.getItem(`swoopy_graph_${FIXED_ID}`);
    const parsed = JSON.parse(raw!);
    expect(parsed.graph.edges).toHaveLength(1);
  });

  it("deleteNode updates the localStorage entry — node is absent after deletion", () => {
    useStore.getState().addNode(0, 0);
    const nodeId = useStore.getState().graph.nodes[0]!.id;
    useStore.getState().deleteNode(nodeId);
    const raw = localStorage.getItem(`swoopy_graph_${FIXED_ID}`);
    const parsed = JSON.parse(raw!);
    expect(parsed.graph.nodes).toHaveLength(0);
  });
});

// ── US-02: Fork-on-first-edit ─────────────────────────────────────────────────

describe("US-02 — fork-on-first-edit: loadFromUrl sets transient state (AC-02a)", () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "?");
    resetStore();
  });

  afterEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "?");
  });

  it("loadFromUrl with a valid ?g= URL sets transient: true", () => {
    const encoded = encodeURIComponent(encodeGraphForUrl(emptyGraph));
    useStore.getState().loadFromUrl(`?g=${encoded}`);
    expect(useStore.getState().transient).toBe(true);
  });

  it("loadFromUrl does NOT persist the graph to localStorage (transient, not saved)", () => {
    const encoded = encodeURIComponent(encodeGraphForUrl(emptyGraph));
    useStore.getState().loadFromUrl(`?g=${encoded}`);
    const raw = localStorage.getItem(`swoopy_graph_${FIXED_ID}`);
    expect(raw).toBeNull();
  });

  it("loadFromUrl with an invalid ?g= value leaves state unchanged", () => {
    const before = useStore.getState().graph;
    useStore.getState().loadFromUrl(`?g=not-valid!!!`);
    expect(useStore.getState().graph).toBe(before);
    expect(useStore.getState().transient).toBe(false);
  });
});

describe("US-02 — fork-on-first-edit: first mutation forks to a new model (AC-02b/c)", () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "?");
    resetStore({ transient: true });
  });

  afterEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "?");
  });

  it("first mutation on a transient model generates a new UUID", () => {
    useStore.getState().addNode(100, 200);
    expect(useStore.getState().modelId).not.toBe(FIXED_ID);
    expect(useStore.getState().transient).toBe(false);
  });

  it("first mutation persists the graph under the NEW model ID, not the original", () => {
    useStore.getState().addNode(100, 200);
    const newId = useStore.getState().modelId;
    expect(localStorage.getItem(`swoopy_graph_${newId}`)).not.toBeNull();
    expect(localStorage.getItem(`swoopy_graph_${FIXED_ID}`)).toBeNull();
  });

  it("the ?g= param is replaced with ?m=<newId> in the URL after fork", () => {
    history.replaceState(null, "", `?g=someencoded`);
    useStore.getState().addNode(100, 200);
    const newId = useStore.getState().modelId;
    const params = new URLSearchParams(window.location.search);
    expect(params.get("m")).toBe(newId);
    expect(params.get("g")).toBeNull();
  });

  it("subsequent mutations after fork keep the same UUID (no double-fork)", () => {
    useStore.getState().addNode(100, 200);
    const firstForkId = useStore.getState().modelId;
    useStore.getState().addNode(200, 300);
    expect(useStore.getState().modelId).toBe(firstForkId);
  });
});

// ── US-03: Legacy key migration ───────────────────────────────────────────────

describe("US-03 — legacy migration: loadPersistedGraph migrates swoopy_graph → scoped key (AC-03)", () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "?");
    resetStore();
  });

  afterEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "?");
  });

  it("removes the legacy swoopy_graph key after migration", () => {
    localStorage.setItem("swoopy_graph", JSON.stringify(serialize(emptyGraph)));
    useStore.getState().loadPersistedGraph();
    expect(localStorage.getItem("swoopy_graph")).toBeNull();
  });

  it("creates a new swoopy_graph_<id> key with the migrated content", () => {
    localStorage.setItem("swoopy_graph", JSON.stringify(serialize(emptyGraph)));
    useStore.getState().loadPersistedGraph();
    const newId = useStore.getState().modelId;
    expect(newId).not.toBe(FIXED_ID);
    expect(localStorage.getItem(`swoopy_graph_${newId}`)).not.toBeNull();
  });

  it("sets swoopy_current_model to the new ID after migration", () => {
    localStorage.setItem("swoopy_graph", JSON.stringify(serialize(emptyGraph)));
    useStore.getState().loadPersistedGraph();
    const newId = useStore.getState().modelId;
    expect(localStorage.getItem("swoopy_current_model")).toBe(newId);
  });

  it("restores the graph content from the legacy key", () => {
    const graphWithNode: Graph = {
      nodes: [{ id: "n1" as never, label: "Legacy", x: 0, y: 0, radius: 30, sizeTier: "m", colourTier: "blue", min: 0, max: 10, initial: 5 }],
      edges: [],
      annotations: [],
      modulators: [],
    };
    localStorage.setItem("swoopy_graph", JSON.stringify(serialize(graphWithNode)));
    useStore.getState().loadPersistedGraph();
    expect(useStore.getState().graph.nodes).toHaveLength(1);
    expect(useStore.getState().graph.nodes[0]!.label).toBe("Legacy");
  });
});

// ── US-04: New model action ───────────────────────────────────────────────────

describe("US-04 — new model: blank canvas with previous model preserved (AC-04)", () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "?");
    resetStore();
  });

  afterEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "?");
  });

  it("newModel resets the graph to an empty state", () => {
    useStore.getState().addNode(100, 200);
    expect(useStore.getState().graph.nodes).toHaveLength(1);
    useStore.getState().newModel();
    expect(useStore.getState().graph.nodes).toHaveLength(0);
    expect(useStore.getState().graph.edges).toHaveLength(0);
  });

  it("newModel preserves the previous model in localStorage under its original key", () => {
    useStore.getState().addNode(100, 200);
    const prevRaw = localStorage.getItem(`swoopy_graph_${FIXED_ID}`);
    expect(prevRaw).not.toBeNull();
    useStore.getState().newModel();
    expect(localStorage.getItem(`swoopy_graph_${FIXED_ID}`)).toBe(prevRaw);
  });

  it("newModel generates a new UUID — modelId changes", () => {
    useStore.getState().newModel();
    expect(useStore.getState().modelId).not.toBe(FIXED_ID);
  });

  it("newModel updates URL to ?m=<newId> via replaceState", () => {
    useStore.getState().newModel();
    const newId = useStore.getState().modelId;
    const params = new URLSearchParams(window.location.search);
    expect(params.get("m")).toBe(newId);
  });

  it("newModel clears the undo stack (past and future are empty)", () => {
    useStore.getState().addNode(100, 200);
    expect(useStore.getState().past).toHaveLength(1);
    useStore.getState().newModel();
    expect(useStore.getState().past).toHaveLength(0);
    expect(useStore.getState().future).toHaveLength(0);
  });

  it("newModel sets transient: false on the new model", () => {
    resetStore({ transient: true });
    useStore.getState().newModel();
    expect(useStore.getState().transient).toBe(false);
  });
});
