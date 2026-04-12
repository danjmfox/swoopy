import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useStore } from "./store.ts";

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
