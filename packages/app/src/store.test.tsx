import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { useStore } from "./store.ts";
import { seedGraph } from "./seed.ts";
import { makeInitialSim, inject } from "@swoopy/engine";

import { ConstraintChoiceDialog } from "./ConstraintChoiceDialog.tsx";

// Component subscribing to graphSlice only — must never re-render from sim ticks
function GraphView() {
  const nodeCount = useStore((s) => s.graph.nodes.length);
  return <span data-testid="count">{nodeCount}</span>;
}

// SE-09 newModel
describe("SE-09: newModel", () => {
  afterEach(() => {
    useStore.setState({
      graph: seedGraph,
      transient: false,
      sim: makeInitialSim(seedGraph),
    });
    localStorage.clear();
  });

  it("assigns a new UUID different from the current modelId", () => {
    const oldId = useStore.getState().modelId;
    useStore.getState().newModel();
    expect(useStore.getState().modelId).not.toBe(oldId);
    expect(useStore.getState().modelId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("sets graph to an empty graph with no nodes or edges", () => {
    useStore.setState({ graph: seedGraph });
    useStore.getState().newModel();
    const { graph } = useStore.getState();
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });

  it("sets transient to false", () => {
    useStore.setState({ transient: true });
    useStore.getState().newModel();
    expect(useStore.getState().transient).toBe(false);
  });

  it("clears undo/redo history", () => {
    useStore.setState({
      past: [{ nodes: [], edges: [] }],
      future: [{ nodes: [], edges: [] }],
    });
    useStore.getState().newModel();
    expect(useStore.getState().past).toHaveLength(0);
    expect(useStore.getState().future).toHaveLength(0);
  });

  it("persists the empty graph to swoopy_graph_<newId>", () => {
    useStore.getState().newModel();
    const { modelId } = useStore.getState();
    const raw = localStorage.getItem(`swoopy_graph_${modelId}`);
    expect(raw).not.toBeNull();
  });

  it("writes the new modelId to swoopy_current_model", () => {
    useStore.getState().newModel();
    const { modelId } = useStore.getState();
    expect(localStorage.getItem("swoopy_current_model")).toBe(modelId);
  });

  it("resets sim to a clean initial state for the empty graph", () => {
    useStore.setState({ graph: seedGraph });
    useStore.getState().newModel();
    const { sim, graph } = useStore.getState();
    expect(sim.nodeValues.size).toBe(graph.nodes.length);
    expect(sim.signals).toHaveLength(0);
  });

  it("updates URL to ?m=<newId> via replaceState", () => {
    useStore.getState().newModel();
    const { modelId } = useStore.getState();
    expect(window.location.search).toContain(`m=${modelId}`);
  });

  it("removes any ?g= param from the URL", () => {
    history.replaceState(null, "", "?g=abc123");
    useStore.getState().newModel();
    expect(window.location.search).not.toContain("g=");
  });
});

// GE-30 hover feedback
describe("GE-30: hover feedback", () => {
  it("store initialises hoveredEdgeRegion as null", () => {
    expect(useStore.getState().hoveredEdgeRegion).toBeNull();
  });
});

// SE-08 model identity
describe("SE-08: model identity", () => {
  afterEach(() => {
    useStore.setState({ graph: seedGraph, transient: false });
    localStorage.clear();
  });

  it("initialises with a modelId that is a valid UUID", () => {
    const { modelId } = useStore.getState();
    expect(modelId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("first mutation when transient: forks new modelId, sets transient false, updates URL to ?m=<id>", () => {
    const originalId = useStore.getState().modelId;
    useStore.setState({ transient: true });

    useStore.getState().addNode(50, 50);

    const { modelId, transient } = useStore.getState();
    expect(transient).toBe(false);
    expect(modelId).not.toBe(originalId);
    expect(modelId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(window.location.search).toContain(`m=${modelId}`);
  });

  it("all mutations fork when transient (addEdge, deleteNode, deleteEdge, updateNode, moveNode, nudgeNode, togglePolarity, cycleDelay, setEdgeWeight, undo, redo)", () => {
    // Set up a graph with nodes and edges for the mutations that need them
    const { modelId: originalId } = useStore.getState();
    useStore.setState({ graph: seedGraph, past: [], future: [] });

    const mutations: Array<() => void> = [
      // nodes[1]→nodes[0] (shortcuts→pressure) is not in seedGraph
      () => {
        useStore.setState({ transient: true });
        useStore
          .getState()
          .addEdge(seedGraph.nodes[1].id, seedGraph.nodes[0].id);
      },
      () => {
        useStore.setState({ transient: true });
        useStore.getState().deleteNode(seedGraph.nodes[2].id);
      },
      () => {
        useStore.setState({ graph: seedGraph, transient: true });
        useStore.getState().deleteEdge(seedGraph.edges[0].id);
      },
      () => {
        useStore.setState({ graph: seedGraph, transient: true });
        useStore.getState().updateNode(seedGraph.nodes[0].id, { label: "X" });
      },
      () => {
        useStore.setState({ graph: seedGraph, transient: true });
        useStore.getState().moveNode(seedGraph.nodes[0].id, 1, 2);
      },
      () => {
        useStore.setState({ graph: seedGraph, transient: true });
        useStore.getState().nudgeNode(seedGraph.nodes[0].id, 1, 1);
      },
      () => {
        useStore.setState({ graph: seedGraph, transient: true });
        useStore.getState().togglePolarity(seedGraph.edges[0].id);
      },
      () => {
        useStore.setState({ graph: seedGraph, transient: true });
        useStore.getState().cycleDelay(seedGraph.edges[0].id);
      },
      () => {
        useStore.setState({ graph: seedGraph, transient: true });
        useStore.getState().setEdgeWeight(seedGraph.edges[0].id, 2);
      },
      () => {
        useStore.setState({
          graph: seedGraph,
          past: [{ nodes: [], edges: [] }],
          transient: true,
        });
        useStore.getState().undo();
      },
      () => {
        useStore.setState({
          graph: seedGraph,
          future: [{ nodes: [], edges: [] }],
          transient: true,
        });
        useStore.getState().redo();
      },
    ];

    for (const mutate of mutations) {
      useStore.setState({ modelId: originalId, transient: false });
      mutate();
      expect(useStore.getState().transient).toBe(false);
      expect(useStore.getState().modelId).not.toBe(originalId);
    }
  });

  it("non-transient mutations preserve modelId", () => {
    const { modelId } = useStore.getState();
    useStore.setState({ graph: { nodes: [], edges: [] }, transient: false });
    useStore.getState().addNode(1, 2);
    expect(useStore.getState().modelId).toBe(modelId);
    expect(useStore.getState().transient).toBe(false);
  });

  it("loadFromUrl sets transient to true", () => {
    const encoded = btoa(
      JSON.stringify({ version: 1, graph: { nodes: [], edges: [] } }),
    );
    useStore.getState().loadFromUrl(`?g=${encoded}`);
    expect(useStore.getState().transient).toBe(true);
  });

  it("persists to swoopy_graph_<modelId> after a mutation", () => {
    useStore.setState({ graph: { nodes: [], edges: [] } });
    const { modelId } = useStore.getState();
    useStore.getState().addNode(100, 100);
    expect(localStorage.getItem(`swoopy_graph_${modelId}`)).not.toBeNull();
    expect(localStorage.getItem("swoopy_graph")).toBeNull();
  });
});

// SI-07 prerequisite
describe("store initialisation", () => {
  it("loads the seed graph with all three nodes", () => {
    const { graph } = useStore.getState();
    expect(graph.nodes).toHaveLength(3);
    expect(graph.nodes.map((n) => n.label)).toContain("Pressure");
  });

  it("initialises sim node values from graph.initial fields", () => {
    const { sim, graph } = useStore.getState();
    for (const node of graph.nodes) {
      expect(sim.nodeValues.get(node.id)).toBe(node.initial);
    }
  });
});

describe("GE-01: addNode", () => {
  beforeEach(() => {
    useStore.setState({ graph: { nodes: [], edges: [] } });
  });

  it("adds a node at the given coordinates to graph.nodes", () => {
    useStore.getState().addNode(200, 300);
    const { graph } = useStore.getState();
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].x).toBe(200);
    expect(graph.nodes[0].y).toBe(300);
    expect(graph.nodes[0].label).toBeTruthy();
  });
});

describe("GE-23 addConstraintEdge", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, past: [], future: [] });
  });

  it("adds a floor constraint edge between two nodes", () => {
    const [from, to] = seedGraph.nodes;
    useStore.getState().addConstraintEdge(from.id, to.id, "floor");
    const edges = useStore.getState().graph.edges;
    const added = edges.find((e) => e.kind === "constraint");
    expect(added).toBeDefined();
    if (added!.kind === "constraint")
      expect(added!.constraintKind).toBe("floor");
  });

  it("adds a ceiling constraint edge between two nodes", () => {
    const [from, to] = seedGraph.nodes;
    useStore.getState().addConstraintEdge(from.id, to.id, "ceiling");
    const edges = useStore.getState().graph.edges;
    const added = edges.find((e) => e.kind === "constraint");
    expect(added).toBeDefined();
    expect(added!.from).toBe(from.id);
    expect(added!.to).toBe(to.id);
    if (added!.kind === "constraint")
      expect(added!.constraintKind).toBe("ceiling");
  });
});

describe("GE-23 confirmConstraintEdge", () => {
  const [from, to] = seedGraph.nodes;

  beforeEach(() => {
    useStore.setState({
      graph: { nodes: seedGraph.nodes, edges: [] },
      past: [],
      future: [],
      pendingConstraintEdge: { from: from.id, to: to.id },
    });
  });

  it("confirmConstraintEdge ceiling — adds edge and clears pending", () => {
    useStore.getState().confirmConstraintEdge("ceiling");
    const edges = useStore.getState().graph.edges;
    const added = edges.find((e) => e.kind === "constraint");
    expect(added).toBeDefined();
    if (added!.kind === "constraint")
      expect(added!.constraintKind).toBe("ceiling");
    expect(useStore.getState().pendingConstraintEdge).toBeNull();
  });

  it("confirmConstraintEdge floor — adds floor edge and clears pending", () => {
    useStore.getState().confirmConstraintEdge("floor");
    const edges = useStore.getState().graph.edges;
    const added = edges.find((e) => e.kind === "constraint");
    expect(added).toBeDefined();
    if (added!.kind === "constraint")
      expect(added!.constraintKind).toBe("floor");
    expect(useStore.getState().pendingConstraintEdge).toBeNull();
  });
});

describe("GE-23 ConstraintChoiceDialog", () => {
  const [from, to] = seedGraph.nodes;

  beforeEach(() => {
    useStore.setState({
      graph: seedGraph,
      past: [],
      future: [],
      pendingConstraintEdge: { from: from.id, to: to.id },
    });
  });

  it("renders ceiling and floor buttons when pendingConstraintEdge is set", () => {
    const { getByRole } = render(<ConstraintChoiceDialog />);
    expect(getByRole("button", { name: /ceiling/i })).toBeTruthy();
    expect(getByRole("button", { name: /floor/i })).toBeTruthy();
  });

  it("clicking Ceiling button adds a ceiling constraint edge and clears pending", async () => {
    const { getByRole } = render(<ConstraintChoiceDialog />);
    await act(async () => {
      getByRole("button", { name: /ceiling/i }).click();
    });
    const edges = useStore.getState().graph.edges;
    const added = edges.find((e) => e.kind === "constraint");
    expect(added).toBeDefined();
    if (added?.kind === "constraint")
      expect(added.constraintKind).toBe("ceiling");
    expect(useStore.getState().pendingConstraintEdge).toBeNull();
  });
});

describe("GE-04 / GE-06 / GE-07: addEdge", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph });
  });

  it("adds a directed edge between two existing nodes with default reinforcing polarity", () => {
    const { graph } = useStore.getState();
    // Shortcuts→Pressure does not exist in seedGraph — safe to add without hitting duplicate guard
    const from = graph.nodes[1].id; // Shortcuts
    const to = graph.nodes[0].id; // Pressure
    const edgesBefore = graph.edges.length;

    useStore.getState().addEdge(from, to);

    const updated = useStore.getState().graph;
    expect(updated.edges).toHaveLength(edgesBefore + 1);
    const edge = updated.edges[updated.edges.length - 1];
    expect(edge.kind).toBe("causal");
    if (edge.kind === "causal") {
      expect(edge.from).toBe(from);
      expect(edge.to).toBe(to);
      expect(edge.polarity).toBe(1);
    }
  });
});

describe("GE-09: deleteNode", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph });
  });

  it("removes the node and all edges connected to it", () => {
    const { graph } = useStore.getState();
    const target = graph.nodes[0]; // Population — connected to all 4 edges

    useStore.getState().deleteNode(target.id);

    const updated = useStore.getState().graph;
    expect(updated.nodes.find((n) => n.id === target.id)).toBeUndefined();
    expect(
      updated.edges.every((e) => e.from !== target.id && e.to !== target.id),
    ).toBe(true);
  });
});

describe("GE-26: deleteEdge", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, past: [], future: [] });
  });

  it("removes the edge from the graph", () => {
    const edgeId = seedGraph.edges[0].id;
    useStore.getState().deleteEdge(edgeId);
    expect(
      useStore.getState().graph.edges.find((e) => e.id === edgeId),
    ).toBeUndefined();
  });

  it("deleteEdge is undoable", () => {
    const edgeId = seedGraph.edges[0].id;
    useStore.getState().deleteEdge(edgeId);
    useStore.getState().undo();
    expect(
      useStore.getState().graph.edges.find((e) => e.id === edgeId),
    ).toBeDefined();
  });
});

describe("GE-21: undo", () => {
  beforeEach(() => {
    useStore.setState({ graph: { nodes: [], edges: [] } });
  });

  it("restores the graph to its state before the last mutation", () => {
    useStore.getState().addNode(100, 100);
    useStore.getState().undo();
    expect(useStore.getState().graph.nodes).toHaveLength(0);
  });
});

describe("GE-22: redo", () => {
  beforeEach(() => {
    useStore.setState({ graph: { nodes: [], edges: [] } });
  });

  it("reapplies the last undone mutation", () => {
    useStore.getState().addNode(100, 100);
    useStore.getState().undo();
    useStore.getState().redo();
    expect(useStore.getState().graph.nodes).toHaveLength(1);
  });
});

describe("S5 — undo does not roll back sim state", () => {
  it("undo restores graph but leaves sim nodeValues unchanged", () => {
    const initialSim = makeInitialSim(seedGraph);
    useStore.setState({
      graph: seedGraph,
      past: [],
      future: [],
      sim: initialSim,
    });
    // Inject into first node via the engine function so sim state diverges from initial
    const node = seedGraph.nodes[0];
    const simAfterInject = inject(initialSim, seedGraph, node.id, 1);
    useStore.setState({ sim: simAfterInject });
    const injectedValue = useStore.getState().sim.nodeValues.get(node.id)!;
    // Make a graph mutation so undo has something to do
    useStore.getState().addNode(999, 999);
    expect(useStore.getState().graph.nodes).toHaveLength(
      seedGraph.nodes.length + 1,
    );
    // Undo the addNode — graph reverts, sim must not
    useStore.getState().undo();
    expect(useStore.getState().graph.nodes).toHaveLength(
      seedGraph.nodes.length,
    );
    expect(useStore.getState().sim.nodeValues.get(node.id)).toBe(injectedValue);
  });
});

describe("SE-07: localStorage auto-save", () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState({
      graph: { nodes: [], edges: [] },
      past: [],
      future: [],
    });
  });

  it("saves the graph to localStorage under swoopy_graph_<modelId> after each mutation", () => {
    const { modelId } = useStore.getState();
    useStore.getState().addNode(100, 200);
    const raw = localStorage.getItem(`swoopy_graph_${modelId}`);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.graph.nodes).toHaveLength(1);
  });

  it("migrates legacy swoopy_graph key: new modelId assigned, data moved, old key deleted", () => {
    const legacyGraph = {
      nodes: [
        {
          id: "n1",
          x: 1,
          y: 2,
          label: "A",
          min: 0,
          max: 10,
          initial: 5,
          radius: 50,
        },
      ],
      edges: [],
    };
    localStorage.setItem(
      "swoopy_graph",
      JSON.stringify({ version: 1, graph: legacyGraph }),
    );

    useStore.getState().loadPersistedGraph();

    const { modelId, graph } = useStore.getState();
    expect(localStorage.getItem("swoopy_graph")).toBeNull();
    expect(localStorage.getItem(`swoopy_graph_${modelId}`)).not.toBeNull();
    expect(graph.nodes[0].label).toBe("A");
  });

  it("restores graph from localStorage when loadPersistedGraph is called and no URL param is present", () => {
    useStore.getState().addNode(42, 99);
    const saved = useStore.getState().graph;

    useStore.setState({ graph: { nodes: [], edges: [] } });
    useStore.getState().loadPersistedGraph();

    const restored = useStore.getState().graph;
    expect(restored.nodes).toHaveLength(saved.nodes.length);
    expect(restored.nodes[0].x).toBe(42);
    expect(restored.nodes[0].y).toBe(99);
  });

  it("loadPersistedGraph writes swoopy_current_model pointer to localStorage", () => {
    const { modelId } = useStore.getState();
    useStore.getState().loadPersistedGraph();
    expect(localStorage.getItem("swoopy_current_model")).toBe(modelId);
  });
});

describe("SE-02 / SE-06: shareGraph", () => {
  beforeEach(() => {
    useStore.setState({
      graph: { nodes: [], edges: [] },
      past: [],
      future: [],
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });
  });

  it("encodes the current graph as base64 in a URL query param and writes it to the clipboard", async () => {
    useStore.getState().addNode(10, 20);
    await useStore.getState().shareGraph();

    expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
    const url = new URL(
      (
        navigator.clipboard.writeText as ReturnType<typeof vi.fn>
      ).mock.calls[0][0],
    );
    const encoded = url.searchParams.get("g");
    expect(encoded).not.toBeNull();
    const decoded = JSON.parse(atob(encoded!));
    expect(decoded.graph.nodes).toHaveLength(1);
    expect(decoded.graph.nodes[0].x).toBe(10);
  });
});

describe("SE-03: loadFromUrl", () => {
  beforeEach(() => {
    useStore.setState({
      graph: { nodes: [], edges: [] },
      past: [],
      future: [],
    });
  });

  it("restores graph from base64 ?g= param when present", () => {
    useStore.getState().addNode(77, 88);
    const graph = useStore.getState().graph;
    const encoded = btoa(JSON.stringify({ version: 1, graph }));

    useStore.setState({ graph: { nodes: [], edges: [] } });
    useStore.getState().loadFromUrl(`?g=${encoded}`);

    const restored = useStore.getState().graph;
    expect(restored.nodes).toHaveLength(1);
    expect(restored.nodes[0].x).toBe(77);
    expect(restored.nodes[0].y).toBe(88);
  });
});

describe("GE-10: duplicate edge prevention", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, past: [], future: [] });
  });

  it("does not add a duplicate causal edge between the same node pair", () => {
    const { graph } = useStore.getState();
    const from = graph.nodes[0].id;
    const to = graph.nodes[1].id;

    // Remove all edges first, then add one fresh causal edge
    useStore.setState({ graph: { ...graph, edges: [] } });
    useStore.getState().addEdge(from, to);
    useStore.getState().addEdge(from, to); // duplicate — should be ignored

    const updated = useStore.getState().graph;
    const between = updated.edges.filter((e) => e.from === from && e.to === to);
    expect(between).toHaveLength(1);
  });
});

describe("GE-08 togglePolarity", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, past: [], future: [] });
  });

  it("flips polarity from 1 to -1", () => {
    const edge = seedGraph.edges.find((e) => e.kind === "causal")!;
    useStore.getState().togglePolarity(edge.id);
    const updated = useStore
      .getState()
      .graph.edges.find((e) => e.id === edge.id)!;
    expect(updated.kind === "causal" && updated.polarity).toBe(-1);
  });

  it("togglePolarity is undoable", () => {
    const edge = seedGraph.edges.find((e) => e.kind === "causal")!;
    const original = (edge as import("@swoopy/engine").CausalEdge).polarity;
    useStore.getState().togglePolarity(edge.id);
    useStore.getState().undo();
    const restored = useStore
      .getState()
      .graph.edges.find((e) => e.id === edge.id)!;
    expect(restored.kind === "causal" && restored.polarity).toBe(original);
  });
});

describe("GE-14/16 cycleDelay", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, past: [], future: [] });
  });

  it("cycles delay: none → short → medium → long → none", () => {
    const edge = seedGraph.edges.find((e) => e.kind === "causal")!;
    const id = edge.id;
    const getDelay = () => {
      const e = useStore.getState().graph.edges.find((x) => x.id === id)!;
      return e.kind === "causal" ? e.delay : null;
    };
    expect(getDelay()).toBe("none");
    useStore.getState().cycleDelay(id);
    expect(getDelay()).toBe("short");
    useStore.getState().cycleDelay(id);
    expect(getDelay()).toBe("medium");
    useStore.getState().cycleDelay(id);
    expect(getDelay()).toBe("long");
    useStore.getState().cycleDelay(id);
    expect(getDelay()).toBe("none");
  });
});

describe("GE-13/19 setEdgeWeight", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, past: [], future: [] });
  });

  it("sets weight and clamps to 0–5", () => {
    const edge = seedGraph.edges.find((e) => e.kind === "causal")!;
    useStore.getState().setEdgeWeight(edge.id, 0.5);
    const updated = useStore
      .getState()
      .graph.edges.find((e) => e.id === edge.id)!;
    expect(updated.kind === "causal" && updated.weight).toBe(0.5);
  });

  it("accepts weight above 1 (up to 5)", () => {
    const edge = seedGraph.edges.find((e) => e.kind === "causal")!;
    useStore.getState().setEdgeWeight(edge.id, 3);
    const updated = useStore
      .getState()
      .graph.edges.find((e) => e.id === edge.id)!;
    expect(updated.kind === "causal" && updated.weight).toBe(3);
  });

  it("clamps weight above 5 to 5", () => {
    const edge = seedGraph.edges.find((e) => e.kind === "causal")!;
    useStore.getState().setEdgeWeight(edge.id, 10);
    const updated = useStore
      .getState()
      .graph.edges.find((e) => e.id === edge.id)!;
    expect(updated.kind === "causal" && updated.weight).toBe(5);
  });
});

describe("GE-18 updateNode", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, past: [], future: [] });
  });

  it("updates label, min, max, initial on the target node", () => {
    const { graph } = useStore.getState();
    const id = graph.nodes[0].id;
    useStore
      .getState()
      .updateNode(id, { label: "Renamed", min: 1, max: 9, initial: 3 });
    const updated = useStore.getState().graph.nodes.find((n) => n.id === id)!;
    expect(updated.label).toBe("Renamed");
    expect(updated.min).toBe(1);
    expect(updated.max).toBe(9);
    expect(updated.initial).toBe(3);
  });

  it("clamps initial to [min, max] if violated (PRD §7.1 invariant)", () => {
    const { graph } = useStore.getState();
    const id = graph.nodes[0].id;
    useStore.getState().updateNode(id, { min: 2, max: 8, initial: 12 }); // initial > max
    const updated = useStore.getState().graph.nodes.find((n) => n.id === id)!;
    expect(updated.initial).toBeLessThanOrEqual(updated.max);
    expect(updated.initial).toBeGreaterThanOrEqual(updated.min);
  });

  it("updateNode is undoable", () => {
    const { graph } = useStore.getState();
    const id = graph.nodes[0].id;
    const originalLabel = graph.nodes[0].label;
    useStore.getState().updateNode(id, { label: "Changed" });
    useStore.getState().undo();
    const restored = useStore.getState().graph.nodes.find((n) => n.id === id)!;
    expect(restored.label).toBe(originalLabel);
  });
});

describe("SI-09 pauseSim / resumeSim", () => {
  beforeEach(() => {
    useStore.setState({
      graph: seedGraph,
      sim: {
        signals: [],
        pending: [],
        nodeValues: new Map(),
        displayPrevNodeValues: new Map(),
        tick: 0,
      },
    });
  });

  it("pauseSim sets simRunning to false", () => {
    useStore.getState().pauseSim();
    expect(useStore.getState().simRunning).toBe(false);
  });

  it("resumeSim sets simRunning to true", () => {
    useStore.getState().pauseSim();
    useStore.getState().resumeSim();
    expect(useStore.getState().simRunning).toBe(true);
  });
});

describe("SI-10 resetSim", () => {
  it("restores all node values to initial without clearing graph", () => {
    const { graph } = useStore.getState();
    // Mutate sim values by ticking
    useStore.getState().tickSim(1 / 60);
    useStore.getState().resetSim();
    const { sim } = useStore.getState();
    for (const node of graph.nodes) {
      expect(sim.nodeValues.get(node.id)).toBe(node.initial);
    }
    expect(useStore.getState().graph.nodes).toHaveLength(graph.nodes.length);
  });
});

describe("GE-13/19 openEdgeWeightEditor / closeEdgeWeightEditor", () => {
  beforeEach(() => {
    useStore.setState({
      graph: seedGraph,
      past: [],
      future: [],
      editingEdgeId: null,
    });
  });

  it("sets editingEdgeId to the given EdgeId when openEdgeWeightEditor is called", () => {
    const edgeId = seedGraph.edges.find((e) => e.kind === "causal")!.id;
    useStore.getState().openEdgeWeightEditor(edgeId);
    expect(useStore.getState().editingEdgeId).toBe(edgeId);
  });

  it("sets editingEdgeId back to null when closeEdgeWeightEditor is called", () => {
    const edgeId = seedGraph.edges.find((e) => e.kind === "causal")!.id;
    useStore.getState().openEdgeWeightEditor(edgeId);
    useStore.getState().closeEdgeWeightEditor();
    expect(useStore.getState().editingEdgeId).toBeNull();
  });
});

describe("SI-17 setSimSpeed", () => {
  it("stores the speed multiplier", () => {
    useStore.getState().setSimSpeed(2);
    expect(useStore.getState().simSpeed).toBe(2);
  });
});

describe("GE-03/20 moveNode", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, past: [], future: [] });
  });

  it("moves the node to the given coordinates", () => {
    const node = seedGraph.nodes[0];
    useStore.getState().moveNode(node.id, 42, 99);
    const moved = useStore
      .getState()
      .graph.nodes.find((n) => n.id === node.id)!;
    expect(moved.x).toBe(42);
    expect(moved.y).toBe(99);
  });

  it("moveNode is undoable — undo restores original position", () => {
    const node = seedGraph.nodes[0];
    const origX = node.x;
    const origY = node.y;
    useStore.getState().moveNode(node.id, 500, 500);
    useStore.getState().undo();
    const restored = useStore
      .getState()
      .graph.nodes.find((n) => n.id === node.id)!;
    expect(restored.x).toBe(origX);
    expect(restored.y).toBe(origY);
  });
});

describe("dragPosition — ephemeral drag state", () => {
  beforeEach(() => {
    useStore.setState({
      graph: seedGraph,
      past: [],
      future: [],
      dragPosition: null,
    });
  });

  it("setDragPosition stores nodeId and coordinates", () => {
    const node = seedGraph.nodes[0];
    useStore.getState().setDragPosition(node.id, 123, 456);
    expect(useStore.getState().dragPosition).toEqual({
      nodeId: node.id,
      x: 123,
      y: 456,
    });
  });

  it("moveNode clears dragPosition", () => {
    const node = seedGraph.nodes[0];
    useStore.getState().setDragPosition(node.id, 123, 456);
    useStore.getState().moveNode(node.id, 123, 456);
    expect(useStore.getState().dragPosition).toBeNull();
  });
});

describe("GE-20 focusNextNode — Tab cycles node focus", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, focusedNodeId: null });
  });

  it("focusedNodeId starts null", () => {
    expect(useStore.getState().focusedNodeId).toBeNull();
  });

  it("focusNextNode focuses the first node when none is focused", () => {
    useStore.getState().focusNextNode();
    expect(useStore.getState().focusedNodeId).toBe(seedGraph.nodes[0].id);
  });

  it("focusNextNode advances to the next node", () => {
    useStore.setState({ focusedNodeId: seedGraph.nodes[0].id });
    useStore.getState().focusNextNode();
    expect(useStore.getState().focusedNodeId).toBe(seedGraph.nodes[1].id);
  });

  it("focusNextNode wraps from last back to first", () => {
    const last = seedGraph.nodes[seedGraph.nodes.length - 1];
    useStore.setState({ focusedNodeId: last.id });
    useStore.getState().focusNextNode();
    expect(useStore.getState().focusedNodeId).toBe(seedGraph.nodes[0].id);
  });
});

describe("GE-20 nudgeNode — arrow key repositions focused node", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, past: [], future: [] });
  });

  it("nudgeNode shifts the node by the given delta", () => {
    const node = seedGraph.nodes[0];
    useStore.getState().nudgeNode(node.id, 10, -5);
    const moved = useStore
      .getState()
      .graph.nodes.find((n) => n.id === node.id)!;
    expect(moved.x).toBe(node.x + 10);
    expect(moved.y).toBe(node.y - 5);
  });

  it("nudgeNode is undoable", () => {
    const node = seedGraph.nodes[0];
    useStore.getState().nudgeNode(node.id, 10, 0);
    useStore.getState().undo();
    const restored = useStore
      .getState()
      .graph.nodes.find((n) => n.id === node.id)!;
    expect(restored.x).toBe(node.x);
  });
});

describe("GE-20 setFocusedNode — click sets focus", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, focusedNodeId: null });
  });

  it("setFocusedNode sets focusedNodeId to the given id", () => {
    const id = seedGraph.nodes[0].id;
    useStore.getState().setFocusedNode(id);
    expect(useStore.getState().focusedNodeId).toBe(id);
  });

  it("setFocusedNode clears focus when passed null", () => {
    useStore.setState({ focusedNodeId: seedGraph.nodes[0].id });
    useStore.getState().setFocusedNode(null);
    expect(useStore.getState().focusedNodeId).toBeNull();
  });
});

describe("AppMode — mode field and setMode", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, past: [], future: [] });
  });

  it("mode defaults to select", () => {
    expect(useStore.getState().mode).toBe("select");
  });

  it("setMode changes the active mode", () => {
    useStore.getState().setMode("add-node");
    expect(useStore.getState().mode).toBe("add-node");
  });

  it("setMode accepts all five modes", () => {
    const modes = [
      "select",
      "add-node",
      "add-edge",
      "simulate",
      "delete",
    ] as const;
    for (const m of modes) {
      useStore.getState().setMode(m);
      expect(useStore.getState().mode).toBe(m);
    }
  });
});

describe("Zustand slice boundary — PRD §5.1, §6.2", () => {
  beforeEach(() => {
    useStore.setState({
      graph: { nodes: [], edges: [] },
      sim: {
        signals: [],
        pending: [],
        nodeValues: new Map(),
        displayPrevNodeValues: new Map(),
        tick: 0,
      },
    });
  });

  it("sim ticks via tickSim do not re-render React components subscribed to graphSlice", () => {
    let renders = 0;

    function Counted() {
      renders++;
      return <GraphView />;
    }

    render(<Counted />);
    expect(renders).toBe(1);

    act(() => {
      useStore.getState().tickSim(1 / 60);
      useStore.getState().tickSim(1 / 60);
      useStore.getState().tickSim(1 / 60);
    });

    expect(renders).toBe(1);
  });
});

describe("GE-22 undo scope — sim state is excluded from undo history", () => {
  beforeEach(() => {
    useStore.setState({
      graph: seedGraph,
      past: [],
      future: [],
      sim: makeInitialSim(seedGraph),
    });
  });

  it("undo after a sim tick does not restore previous node values", () => {
    // mutate graph (creates an undo entry)
    useStore.getState().addNode(50, 50);

    // advance sim — node values diverge from initial
    useStore.getState().tickSim(1 / 60);
    useStore.getState().tickSim(1 / 60);
    const simValuesAfterTick = new Map(useStore.getState().sim.nodeValues);

    // undo the graph mutation
    useStore.getState().undo();

    // sim node values must be unchanged — undo only affects graph, not sim
    const simValuesAfterUndo = useStore.getState().sim.nodeValues;
    for (const [id, value] of simValuesAfterTick) {
      expect(simValuesAfterUndo.get(id)).toBe(value);
    }
  });
});

describe("GE-32 spring-loaded mode state", () => {
  beforeEach(() => {
    useStore.setState({ mode: "select", previousMode: null } as Parameters<
      typeof useStore.setState
    >[0]);
  });

  it("previousMode is null initially", () => {
    expect(useStore.getState().previousMode).toBeNull();
  });

  it("enterSpringMode sets mode and records previousMode", () => {
    useStore.getState().enterSpringMode("add-edge");
    expect(useStore.getState().mode).toBe("add-edge");
    expect(useStore.getState().previousMode).toBe("select");
  });

  it("exitSpringMode restores previous mode and clears previousMode", () => {
    useStore.getState().enterSpringMode("add-edge");
    useStore.getState().exitSpringMode();
    expect(useStore.getState().mode).toBe("select");
    expect(useStore.getState().previousMode).toBeNull();
  });

  it("exitSpringMode is a no-op when previousMode is null", () => {
    useStore.getState().exitSpringMode();
    expect(useStore.getState().mode).toBe("select");
    expect(useStore.getState().previousMode).toBeNull();
  });
});

// GE-37: annotation store slice
describe("GE-37: annotation store slice", () => {
  beforeEach(() => {
    useStore.setState({ graph: seedGraph, past: [], future: [] });
  });

  it("add-annotation is a valid AppMode", () => {
    useStore.getState().setMode("add-annotation");
    expect(useStore.getState().mode).toBe("add-annotation");
  });

  it("addAnnotation adds an annotation to graph.annotations", () => {
    useStore.getState().addAnnotation(100, 200);
    const { annotations } = useStore.getState().graph;
    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toMatchObject({ x: 100, y: 200, text: "" });
  });

  it("addAnnotation returns the new annotation id", () => {
    const id = useStore.getState().addAnnotation(10, 20);
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("deleteAnnotation removes the annotation by id", () => {
    const id = useStore.getState().addAnnotation(50, 60);
    useStore.getState().deleteAnnotation(id);
    expect(useStore.getState().graph.annotations).toHaveLength(0);
  });

  it("moveAnnotation updates x and y of the annotation", () => {
    const id = useStore.getState().addAnnotation(10, 20);
    useStore.getState().moveAnnotation(id, 99, 88);
    expect(useStore.getState().graph.annotations[0]).toMatchObject({
      x: 99,
      y: 88,
    });
  });

  it("updateAnnotation updates the text of the annotation", () => {
    const id = useStore.getState().addAnnotation(10, 20);
    useStore.getState().updateAnnotation(id, "hello world");
    expect(useStore.getState().graph.annotations[0]).toMatchObject({
      text: "hello world",
    });
  });

  it("editingAnnotationId defaults to null", () => {
    expect(useStore.getState().editingAnnotationId).toBeNull();
  });

  it("openAnnotationEditor sets editingAnnotationId", () => {
    const id = useStore.getState().addAnnotation(10, 20);
    useStore.getState().openAnnotationEditor(id);
    expect(useStore.getState().editingAnnotationId).toBe(id);
  });

  it("closeAnnotationEditor clears editingAnnotationId", () => {
    const id = useStore.getState().addAnnotation(10, 20);
    useStore.getState().openAnnotationEditor(id);
    useStore.getState().closeAnnotationEditor();
    expect(useStore.getState().editingAnnotationId).toBeNull();
  });
});
