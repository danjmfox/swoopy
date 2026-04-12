import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useStore, listLocalModels } from "./store.ts";
import { serialize } from "@swoopy/engine";

beforeEach(() => {
  useStore.setState({
    graph: { nodes: [], edges: [], annotations: [], modulators: [] },
    past: [],
    future: [],
  });
});

// GE-34: addNode default size tier
describe("addNode", () => {
  it("creates a node with sizeTier: 'm' and radius: 30", () => {
    useStore.getState().addNode(100, 200);
    const node = useStore.getState().graph.nodes[0]!;
    expect(node.sizeTier).toBe("m");
    expect(node.radius).toBe(30);
  });

  // GE-35: addNode default colour tier
  it("creates a node with colourTier: 'blue'", () => {
    useStore.getState().addNode(100, 200);
    const node = useStore.getState().graph.nodes[0]!;
    expect(node.colourTier).toBe("blue");
  });
});

// GE-34: updateNode size tier derives radius
describe("updateNode", () => {
  it("updating sizeTier: 'xl' sets radius: 38", () => {
    useStore.getState().addNode(0, 0);
    const id = useStore.getState().graph.nodes[0]!.id;
    useStore.getState().updateNode(id, { sizeTier: "xl" });
    const node = useStore.getState().graph.nodes[0]!;
    expect(node.sizeTier).toBe("xl");
    expect(node.radius).toBe(38);
  });

  // GE-35: updateNode colour tier
  it("updating colourTier: 'red' persists on the node", () => {
    useStore.getState().addNode(0, 0);
    const id = useStore.getState().graph.nodes[0]!.id;
    useStore.getState().updateNode(id, { colourTier: "red" });
    const node = useStore.getState().graph.nodes[0]!;
    expect(node.colourTier).toBe("red");
  });
});

// deleteNode
describe("deleteNode", () => {
  it("preserves annotations after deleting a node", () => {
    useStore.getState().addNode(0, 0);
    useStore.getState().addAnnotation(50, 50);
    const nodeId = useStore.getState().graph.nodes[0]!.id;
    useStore.getState().deleteNode(nodeId);
    expect(useStore.getState().graph.annotations).toHaveLength(1);
  });
});

// modelTitle
describe("modelTitle / setModelTitle", () => {
  afterEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "?");
  });

  it("modelTitle defaults to empty string", () => {
    useStore.setState({ modelTitle: "" });
    expect(useStore.getState().modelTitle).toBe("");
  });

  it("setModelTitle updates modelTitle in state", () => {
    useStore.setState({ modelTitle: "" });
    useStore.getState().setModelTitle("My Model");
    expect(useStore.getState().modelTitle).toBe("My Model");
  });

  it("setModelTitle persists to localStorage key swoopy_title_<modelId>", () => {
    const { modelId } = useStore.getState();
    useStore.getState().setModelTitle("Causal Loop");
    expect(localStorage.getItem(`swoopy_title_${modelId}`)).toBe("Causal Loop");
  });

  it("setModelTitle pushes &title= into URL", () => {
    useStore.getState().setModelTitle("Hello World");
    const params = new URLSearchParams(window.location.search);
    expect(params.get("title")).toBe("Hello World");
  });
});

// listLocalModels
describe("listLocalModels", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("returns empty array when no models in storage", () => {
    expect(listLocalModels(localStorage)).toEqual([]);
  });

  it("returns one model with its title", () => {
    localStorage.setItem("swoopy_graph_abc123", "{}");
    localStorage.setItem("swoopy_title_abc123", "My Loop");
    expect(listLocalModels(localStorage)).toEqual([
      { id: "abc123", title: "My Loop" },
    ]);
  });

  it("returns empty title when no title key exists", () => {
    localStorage.setItem("swoopy_graph_abc123", "{}");
    expect(listLocalModels(localStorage)).toEqual([
      { id: "abc123", title: "" },
    ]);
  });

  it("sorts titled models alphabetically, untitled at end", () => {
    localStorage.setItem("swoopy_graph_z", "{}");
    localStorage.setItem("swoopy_title_z", "Zebra");
    localStorage.setItem("swoopy_graph_a", "{}");
    localStorage.setItem("swoopy_title_a", "Alpha");
    localStorage.setItem("swoopy_graph_u", "{}"); // no title
    const result = listLocalModels(localStorage);
    expect(result.map((m) => m.title)).toEqual(["Alpha", "Zebra", ""]);
  });

  it("ignores non-graph localStorage keys", () => {
    localStorage.setItem("swoopy_current_model", "abc123");
    localStorage.setItem("swoopy_welcomed", "true");
    localStorage.setItem("swoopy_title_abc123", "Orphan Title");
    expect(listLocalModels(localStorage)).toEqual([]);
  });
});

// loadModel
describe("loadModel", () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "?");
  });

  it("loads graph and title from localStorage into store state", () => {
    const graph = { nodes: [], edges: [], annotations: [], modulators: [] };
    localStorage.setItem(
      "swoopy_graph_model1",
      JSON.stringify(serialize(graph)),
    );
    localStorage.setItem("swoopy_title_model1", "My Diagram");
    useStore.getState().loadModel("model1");
    expect(useStore.getState().modelId).toBe("model1");
    expect(useStore.getState().modelTitle).toBe("My Diagram");
    expect(useStore.getState().graph.nodes).toEqual([]);
    expect(useStore.getState().transient).toBe(false);
  });

  it("clears undo/redo history when loading a model", () => {
    const graph = { nodes: [], edges: [], annotations: [], modulators: [] };
    localStorage.setItem(
      "swoopy_graph_model2",
      JSON.stringify(serialize(graph)),
    );
    useStore.setState({ past: [graph], future: [graph] });
    useStore.getState().loadModel("model2");
    expect(useStore.getState().past).toHaveLength(0);
    expect(useStore.getState().future).toHaveLength(0);
  });

  it("sets URL to ?m=<id>&title=<title> when loading", () => {
    const graph = { nodes: [], edges: [], annotations: [], modulators: [] };
    localStorage.setItem(
      "swoopy_graph_model3",
      JSON.stringify(serialize(graph)),
    );
    localStorage.setItem("swoopy_title_model3", "Feedback Loop");
    useStore.getState().loadModel("model3");
    const params = new URLSearchParams(window.location.search);
    expect(params.get("m")).toBe("model3");
    expect(params.get("title")).toBe("Feedback Loop");
  });

  it("does not mutate the previously active model's localStorage entry", () => {
    const graph = { nodes: [], edges: [], annotations: [], modulators: [] };
    localStorage.setItem("swoopy_graph_prev", JSON.stringify(serialize(graph)));
    localStorage.setItem("swoopy_graph_next", JSON.stringify(serialize(graph)));
    useStore.setState({ modelId: "prev" });
    const prevData = localStorage.getItem("swoopy_graph_prev");
    useStore.getState().loadModel("next");
    expect(localStorage.getItem("swoopy_graph_prev")).toBe(prevData);
  });
});

// deleteModel
describe("deleteModel", () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "?");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("removes swoopy_graph_<id> from localStorage", () => {
    localStorage.setItem("swoopy_graph_abc", "{}");
    useStore.setState({ modelId: "other" });
    useStore.getState().deleteModel("abc");
    expect(localStorage.getItem("swoopy_graph_abc")).toBeNull();
  });

  it("removes swoopy_title_<id> from localStorage", () => {
    localStorage.setItem("swoopy_graph_abc", "{}");
    localStorage.setItem("swoopy_title_abc", "My Model");
    useStore.setState({ modelId: "other" });
    useStore.getState().deleteModel("abc");
    expect(localStorage.getItem("swoopy_title_abc")).toBeNull();
  });

  it("does not affect other models in localStorage", () => {
    localStorage.setItem("swoopy_graph_abc", "{}");
    localStorage.setItem("swoopy_graph_xyz", "{}");
    useStore.setState({ modelId: "other" });
    useStore.getState().deleteModel("abc");
    expect(localStorage.getItem("swoopy_graph_xyz")).toBe("{}");
  });

  it("creates a new model when the deleted model is the current one", () => {
    localStorage.setItem("swoopy_graph_abc", "{}");
    useStore.setState({ modelId: "abc" });
    useStore.getState().deleteModel("abc");
    expect(useStore.getState().modelId).not.toBe("abc");
  });

  it("does not change modelId when a different model is deleted", () => {
    localStorage.setItem("swoopy_graph_abc", "{}");
    useStore.setState({ modelId: "xyz" });
    useStore.getState().deleteModel("abc");
    expect(useStore.getState().modelId).toBe("xyz");
  });
});

// GE-40: historySeq counter
describe("historySeq / incrementHistorySeq", () => {
  it("historySeq defaults to 0", () => {
    expect(useStore.getState().historySeq).toBe(0);
  });

  it("incrementHistorySeq increments historySeq by 1", () => {
    useStore.setState({ historySeq: 0 });
    useStore.getState().incrementHistorySeq();
    expect(useStore.getState().historySeq).toBe(1);
  });

  it("incrementHistorySeq is cumulative", () => {
    useStore.setState({ historySeq: 0 });
    useStore.getState().incrementHistorySeq();
    useStore.getState().incrementHistorySeq();
    expect(useStore.getState().historySeq).toBe(2);
  });
});

// GE-38: history overlay toggle
describe("showHistory / toggleHistory", () => {
  it("showHistory defaults to false", () => {
    expect(useStore.getState().showHistory).toBe(false);
  });

  it("toggleHistory flips showHistory from false to true", () => {
    useStore.setState({ showHistory: false });
    useStore.getState().toggleHistory();
    expect(useStore.getState().showHistory).toBe(true);
  });

  it("toggleHistory flips showHistory from true to false", () => {
    useStore.setState({ showHistory: true });
    useStore.getState().toggleHistory();
    expect(useStore.getState().showHistory).toBe(false);
  });
});
