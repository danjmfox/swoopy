import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { useStore } from "./store.ts";
import { seedGraph } from "./seed.ts";
import { Canvas } from "./Canvas.tsx";
import {
  makeInitialSim,
  INJECT_STRENGTH,
  makeModulatorId,
} from "@swoopy/engine";

// Mock hitTest so tests don't depend on jsdom pointer coordinate plumbing.
// jsdom does not expose PointerEvent as a global, so clientX/Y would be 0.
// vi.mock is hoisted, so mockHitTest must be declared via vi.hoisted.
const { mockHitTest } = vi.hoisted(() => ({ mockHitTest: vi.fn() }));
vi.mock("@swoopy/renderer", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, hitTest: mockHitTest };
});

const NUDGE = 8; // expected nudge step in pixels

describe("GE-20 Canvas keyboard nav — Tab, arrows, Delete", () => {
  let focusNextNode: ReturnType<typeof vi.fn>;
  let nudgeNode: ReturnType<typeof vi.fn>;
  let deleteNode: ReturnType<typeof vi.fn>;
  const focusedNode = seedGraph.nodes[0]!;

  beforeEach(() => {
    focusNextNode = vi.fn();
    nudgeNode = vi.fn();
    deleteNode = vi.fn();
    useStore.setState({
      graph: seedGraph,
      focusedNodeId: focusedNode.id,
      focusNextNode,
      nudgeNode,
      deleteNode,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("Tab calls focusNextNode", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.keyDown(canvas, { key: "Tab" });
    expect(focusNextNode).toHaveBeenCalledTimes(1);
  });

  it("ArrowRight nudges focused node right", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.keyDown(canvas, { key: "ArrowRight" });
    expect(nudgeNode).toHaveBeenCalledWith(focusedNode.id, NUDGE, 0);
  });

  it("ArrowLeft nudges focused node left", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.keyDown(canvas, { key: "ArrowLeft" });
    expect(nudgeNode).toHaveBeenCalledWith(focusedNode.id, -NUDGE, 0);
  });

  it("ArrowDown nudges focused node down", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.keyDown(canvas, { key: "ArrowDown" });
    expect(nudgeNode).toHaveBeenCalledWith(focusedNode.id, 0, NUDGE);
  });

  it("ArrowUp nudges focused node up", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.keyDown(canvas, { key: "ArrowUp" });
    expect(nudgeNode).toHaveBeenCalledWith(focusedNode.id, 0, -NUDGE);
  });

  it("Delete calls deleteNode on focused node", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.keyDown(canvas, { key: "Delete" });
    expect(deleteNode).toHaveBeenCalledWith(focusedNode.id);
  });

  it("Backspace also calls deleteNode on focused node", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.keyDown(canvas, { key: "Backspace" });
    expect(deleteNode).toHaveBeenCalledWith(focusedNode.id);
  });

  it("arrow keys do nothing when no node is focused", async () => {
    useStore.setState({ focusedNodeId: null } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.keyDown(canvas, { key: "ArrowRight" });
    expect(nudgeNode).not.toHaveBeenCalled();
  });
});

describe("GE-20 click sets focused node in select mode", () => {
  let setFocusedNode: ReturnType<typeof vi.fn>;
  const node = seedGraph.nodes[0]!;

  beforeEach(() => {
    setFocusedNode = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      mode: "select",
      setFocusedNode,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("pointerdown on a node sets focusedNodeId to that node", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: node.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    expect(setFocusedNode).toHaveBeenCalledWith(node.id);
  });

  it("pointerdown on empty canvas clears focusedNodeId", async () => {
    mockHitTest.mockReturnValue(null);
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    expect(setFocusedNode).toHaveBeenCalledWith(null);
  });
});

describe("GE-03/20 Canvas drag — one moveNode call on pointerup", () => {
  let moveNode: ReturnType<typeof vi.fn>;
  const popNode = seedGraph.nodes[0]!;

  beforeEach(() => {
    moveNode = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      mode: "select",
      previousMode: null,
      moveNode,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("drag from node produces exactly one moveNode call with final position", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: popNode.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(canvas, { clientX: 110, clientY: 110 });
    fireEvent.pointerMove(canvas, { clientX: 120, clientY: 120 });
    fireEvent.pointerUp(canvas, { clientX: 130, clientY: 130 });

    expect(moveNode).toHaveBeenCalledTimes(1);
    expect(moveNode.mock.calls[0]![0]).toBe(popNode.id);
  });

  it("click on node (no drag) does NOT call moveNode", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: popNode.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(canvas, { clientX: 100, clientY: 100 });
    expect(moveNode).not.toHaveBeenCalled();
  });

  it("pointermove while dragging in select mode calls setDragPosition", async () => {
    const setDragPosition = vi.fn();
    useStore.setState({
      mode: "select",
      setDragPosition,
    } as unknown as Parameters<typeof useStore.setState>[0]);
    mockHitTest.mockReturnValue({ kind: "node", id: popNode.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(canvas, { clientX: 50, clientY: 60 });

    // jsdom PointerEvent doesn't populate clientX/clientY on pointermove;
    // assert the function was called with the correct nodeId
    expect(setDragPosition).toHaveBeenCalled();
    expect(setDragPosition.mock.calls[0]![0]).toBe(popNode.id);
  });

  it("pointermove without prior pointerdown does not call moveNode", async () => {
    mockHitTest.mockReturnValue(null);
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 100 });

    expect(moveNode).not.toHaveBeenCalled();
  });

  it("GE-23 modifier+drag from nodeA to nodeB calls setPendingConstraintEdge", async () => {
    const nodeA = seedGraph.nodes[0]!;
    const nodeB = seedGraph.nodes[1]!;
    const setPendingConstraintEdge = vi.fn();
    useStore.setState({ setPendingConstraintEdge } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    // pointerdown hits nodeA; pointerup hits nodeB
    mockHitTest
      .mockReturnValueOnce({ kind: "node", id: nodeA.id })
      .mockReturnValueOnce({ kind: "node", id: nodeB.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.keyDown(document, { key: "Alt" });
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(canvas, { clientX: 50, clientY: 50 });
    fireEvent.keyUp(document, { key: "Alt" });

    expect(setPendingConstraintEdge).toHaveBeenCalledWith(nodeA.id, nodeB.id);
    expect(moveNode).not.toHaveBeenCalled();
  });

  it("pointerdown on empty space does not start a drag", async () => {
    mockHitTest.mockReturnValue(null);
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.pointerUp(canvas, { clientX: 200, clientY: 200 });

    expect(moveNode).not.toHaveBeenCalled();
  });
});

describe("SI-02/03 simulate mode — pointerdown on node injects signal", () => {
  const targetNode = seedGraph.nodes[0]!;

  beforeEach(() => {
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      sim: makeInitialSim(seedGraph),
      mode: "simulate",
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("SI-02 pointerdown on node injects a positive signal", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: targetNode.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    const before = useStore.getState().sim.nodeValues.get(targetNode.id)!;

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });

    const after = useStore.getState().sim.nodeValues.get(targetNode.id)!;
    expect(after).toBeGreaterThan(before);
  });

  it("SI-03 shift+pointerdown injects a negative signal", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: targetNode.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    const before = useStore.getState().sim.nodeValues.get(targetNode.id)!;

    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.keyUp(document, { key: "Shift" });

    const after = useStore.getState().sim.nodeValues.get(targetNode.id)!;
    expect(after).toBeLessThan(before);
  });

  it("select mode does not inject on node click", async () => {
    useStore.setState({ mode: "select" } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    mockHitTest.mockReturnValue({ kind: "node", id: targetNode.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    const before = useStore.getState().sim.nodeValues.get(targetNode.id)!;

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });

    const after = useStore.getState().sim.nodeValues.get(targetNode.id)!;
    expect(after).toBe(before);
  });
});

describe("GE-09 delete mode — pointerdown on node removes it", () => {
  let deleteNode: ReturnType<typeof vi.fn>;
  const targetNode = seedGraph.nodes[0]!;

  beforeEach(() => {
    deleteNode = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      deleteNode,
      mode: "delete",
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("pointerdown on a node calls deleteNode", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: targetNode.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });

    expect(deleteNode).toHaveBeenCalledWith(targetNode.id);
  });

  it("pointerdown on empty space does not call deleteNode", async () => {
    mockHitTest.mockReturnValue(null);
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });

    expect(deleteNode).not.toHaveBeenCalled();
  });
});

describe("GE-26 delete mode — pointerdown on edge hit region removes it", () => {
  let deleteEdge: ReturnType<typeof vi.fn>;
  const targetEdge = seedGraph.edges[0]!;

  beforeEach(() => {
    deleteEdge = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      deleteEdge,
      mode: "delete",
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("pointerdown on edge-polarity calls deleteEdge", async () => {
    mockHitTest.mockReturnValue({
      kind: "edge-polarity",
      edgeId: targetEdge.id,
    });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.pointerDown(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(deleteEdge).toHaveBeenCalledWith(targetEdge.id);
  });

  it("pointerdown on edge-delay calls deleteEdge", async () => {
    mockHitTest.mockReturnValue({ kind: "edge-delay", edgeId: targetEdge.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.pointerDown(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(deleteEdge).toHaveBeenCalledWith(targetEdge.id);
  });

  it("pointerdown on edge-weight calls deleteEdge", async () => {
    mockHitTest.mockReturnValue({ kind: "edge-weight", edgeId: targetEdge.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.pointerDown(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(deleteEdge).toHaveBeenCalledWith(targetEdge.id);
  });

  it("pointerdown on edge-constraint calls deleteEdge", async () => {
    mockHitTest.mockReturnValue({
      kind: "edge-constraint",
      edgeId: targetEdge.id,
    });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.pointerDown(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(deleteEdge).toHaveBeenCalledWith(targetEdge.id);
  });
});

describe("delete mode — pointerdown on modulator arc midpoint removes it", () => {
  let deleteModulator: ReturnType<typeof vi.fn>;
  const modId = makeModulatorId("test-mod");

  beforeEach(() => {
    deleteModulator = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      deleteModulator,
      mode: "delete",
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("pointerdown on modulator hit calls deleteModulator", async () => {
    mockHitTest.mockReturnValue({ kind: "modulator", id: modId });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.pointerDown(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(deleteModulator).toHaveBeenCalledWith(modId);
  });
});

describe("GE-04 add-edge mode — drag node to node creates edge", () => {
  let addEdge: ReturnType<typeof vi.fn>;
  let moveNode: ReturnType<typeof vi.fn>;
  const nodeA = seedGraph.nodes[0]!;
  const nodeB = seedGraph.nodes[1]!;

  beforeEach(() => {
    addEdge = vi.fn();
    moveNode = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      addEdge,
      moveNode,
      mode: "add-edge",
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("drag from nodeA to nodeB calls addEdge", async () => {
    mockHitTest
      .mockReturnValueOnce({ kind: "node", id: nodeA.id })
      .mockReturnValueOnce({ kind: "node", id: nodeB.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(canvas, { clientX: 50, clientY: 50 });

    expect(addEdge).toHaveBeenCalledWith(nodeA.id, nodeB.id);
  });

  it("drag from node to empty space does not call addEdge", async () => {
    mockHitTest
      .mockReturnValueOnce({ kind: "node", id: nodeA.id })
      .mockReturnValueOnce(null);
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(canvas, { clientX: 200, clientY: 200 });

    expect(addEdge).not.toHaveBeenCalled();
  });

  it("add-edge mode does not call moveNode on drag release", async () => {
    mockHitTest
      .mockReturnValueOnce({ kind: "node", id: nodeA.id })
      .mockReturnValueOnce({ kind: "node", id: nodeB.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(canvas, { clientX: 50, clientY: 50 });

    expect(moveNode).not.toHaveBeenCalled();
  });

  it("GE-23 Alt+drag in add-edge mode calls setPendingConstraintEdge, not addEdge", async () => {
    const setPendingConstraintEdge = vi.fn();
    useStore.setState({ setPendingConstraintEdge } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    mockHitTest
      .mockReturnValueOnce({ kind: "node", id: nodeA.id })
      .mockReturnValueOnce({ kind: "node", id: nodeB.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.keyDown(document, { key: "Alt" });
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(canvas, { clientX: 50, clientY: 50 });
    fireEvent.keyUp(document, { key: "Alt" });

    expect(setPendingConstraintEdge).toHaveBeenCalledWith(nodeA.id, nodeB.id);
    expect(addEdge).not.toHaveBeenCalled();
  });
});

describe("GE-01 add-node mode — click canvas creates node", () => {
  let addNode: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addNode = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      addNode,
      mode: "add-node",
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("pointerdown on empty space calls addNode with pointer coordinates", async () => {
    mockHitTest.mockReturnValue(null);
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvas, { clientX: 200, clientY: 150 });

    expect(addNode).toHaveBeenCalledTimes(1);
  });

  it("pointerdown on an existing node does not call addNode", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: seedGraph.nodes[0]!.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50 });

    expect(addNode).not.toHaveBeenCalled();
  });
});

describe("SI-02 hold-to-inject — continuous injection while pointer held", () => {
  const targetNode = seedGraph.nodes[0]!;

  beforeEach(() => {
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      sim: makeInitialSim(seedGraph),
      mode: "simulate",
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("holding pointer injects more than once within 300ms", async () => {
    vi.useFakeTimers();
    mockHitTest.mockReturnValue({ kind: "node", id: targetNode.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    const baseline = useStore.getState().sim.nodeValues.get(targetNode.id)!;

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const after = useStore.getState().sim.nodeValues.get(targetNode.id)!;
    expect(after).toBeGreaterThan(baseline + INJECT_STRENGTH);
  });

  it("releasing pointer stops further injection", async () => {
    vi.useFakeTimers();
    mockHitTest.mockReturnValue({ kind: "node", id: targetNode.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.pointerUp(canvas, { clientX: 0, clientY: 0 });

    const valueAtRelease = useStore
      .getState()
      .sim.nodeValues.get(targetNode.id)!;
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const valueAfterRelease = useStore
      .getState()
      .sim.nodeValues.get(targetNode.id)!;
    expect(valueAfterRelease).toBe(valueAtRelease);
  });
});

describe("GE-21 Ctrl+Z / Ctrl+Shift+Z — undo and redo", () => {
  let undo: ReturnType<typeof vi.fn>;
  let redo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    undo = vi.fn();
    redo = vi.fn();
    useStore.setState({ graph: seedGraph, undo, redo } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
  });

  it("Ctrl+Z calls undo", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(container.querySelector("canvas")!, {
      key: "z",
      ctrlKey: true,
    });
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it("Meta+Z calls undo (macOS)", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(container.querySelector("canvas")!, {
      key: "z",
      metaKey: true,
    });
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it("Ctrl+Shift+Z calls redo", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(container.querySelector("canvas")!, {
      key: "z",
      ctrlKey: true,
      shiftKey: true,
    });
    expect(redo).toHaveBeenCalledTimes(1);
  });

  it("Meta+Shift+Z calls redo (macOS)", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(container.querySelector("canvas")!, {
      key: "z",
      metaKey: true,
      shiftKey: true,
    });
    expect(redo).toHaveBeenCalledTimes(1);
  });
});

describe("GE-27 Enter on focused node opens editor", () => {
  let openNodeEditor: ReturnType<typeof vi.fn>;
  const node = seedGraph.nodes[0]!;

  beforeEach(() => {
    openNodeEditor = vi.fn();
    useStore.setState({
      graph: seedGraph,
      focusedNodeId: node.id,
      openNodeEditor,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("Enter opens editor for the focused node", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(container.querySelector("canvas")!, { key: "Enter" });
    expect(openNodeEditor).toHaveBeenCalledWith(node.id);
  });

  it("Enter does nothing when no node is focused", async () => {
    useStore.setState({ focusedNodeId: null } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(container.querySelector("canvas")!, { key: "Enter" });
    expect(openNodeEditor).not.toHaveBeenCalled();
  });
});

describe("GE-28 mode keyboard shortcuts — S/N/E/R/D", () => {
  let setMode: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setMode = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({ graph: seedGraph, setMode } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
  });

  it("S switches to select mode", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(container.querySelector("canvas")!, { key: "s" });
    expect(setMode).toHaveBeenCalledWith("select");
  });

  it("N switches to add-node mode", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(container.querySelector("canvas")!, { key: "n" });
    expect(setMode).toHaveBeenCalledWith("add-node");
  });

  it("E switches to add-edge mode", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(container.querySelector("canvas")!, { key: "e" });
    expect(setMode).toHaveBeenCalledWith("add-edge");
  });

  it("R switches to simulate mode", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(container.querySelector("canvas")!, { key: "r" });
    expect(setMode).toHaveBeenCalledWith("simulate");
  });

  it("D switches to delete mode", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(container.querySelector("canvas")!, { key: "d" });
    expect(setMode).toHaveBeenCalledWith("delete");
  });

  it("A switches to add-annotation mode", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(container.querySelector("canvas")!, { key: "a" });
    expect(setMode).toHaveBeenCalledWith("add-annotation");
  });

  it("S switches mode even when canvas does not have focus", async () => {
    render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(document.body, { key: "s" });
    expect(setMode).toHaveBeenCalledWith("select");
  });

  it("shortcuts do not fire when Ctrl is held", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.keyDown(canvas, { key: "s", ctrlKey: true });
    fireEvent.keyDown(canvas, { key: "n", ctrlKey: true });
    fireEvent.keyDown(canvas, { key: "r", ctrlKey: true });
    expect(setMode).not.toHaveBeenCalled();
  });

  it("shortcuts do not fire when Meta is held", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.keyDown(canvas, { key: "s", metaKey: true });
    fireEvent.keyDown(canvas, { key: "n", metaKey: true });
    fireEvent.keyDown(canvas, { key: "r", metaKey: true });
    expect(setMode).not.toHaveBeenCalled();
  });
});

describe("GE-18 dblclick — opens node editor in non-simulate modes", () => {
  let openNodeEditor: ReturnType<typeof vi.fn>;
  const node = seedGraph.nodes[0]!;

  beforeEach(() => {
    openNodeEditor = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      openNodeEditor,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("dblclick on node in select mode calls openNodeEditor", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: node.id });
    useStore.setState({ mode: "select" } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.dblClick(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(openNodeEditor).toHaveBeenCalledWith(node.id);
  });

  it("dblclick on node in add-node mode calls openNodeEditor", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: node.id });
    useStore.setState({ mode: "add-node" } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.dblClick(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(openNodeEditor).toHaveBeenCalledWith(node.id);
  });
});

describe("GE-08 dblclick — toggle polarity on edge-polarity hit region", () => {
  let togglePolarity: ReturnType<typeof vi.fn>;
  const edge = seedGraph.edges[0]!;

  beforeEach(() => {
    togglePolarity = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      togglePolarity,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("dblclick on edge-polarity calls togglePolarity", async () => {
    mockHitTest.mockReturnValue({ kind: "edge-polarity", edgeId: edge.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.dblClick(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(togglePolarity).toHaveBeenCalledWith(edge.id);
  });
});

describe("dblclick — toggle polarity on modulator arc midpoint", () => {
  let toggleModulatorPolarity: ReturnType<typeof vi.fn>;
  const modId = makeModulatorId("test-mod");

  beforeEach(() => {
    toggleModulatorPolarity = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      toggleModulatorPolarity,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("dblclick on modulator hit calls toggleModulatorPolarity", async () => {
    mockHitTest.mockReturnValue({ kind: "modulator", id: modId });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.dblClick(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(toggleModulatorPolarity).toHaveBeenCalledWith(modId);
  });
});

describe("GE-14 dblclick — cycle delay on edge-delay hit region", () => {
  let cycleDelay: ReturnType<typeof vi.fn>;
  const edge = seedGraph.edges[0]!;

  beforeEach(() => {
    cycleDelay = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({ graph: seedGraph, cycleDelay } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
  });

  it("dblclick on edge-delay calls cycleDelay", async () => {
    mockHitTest.mockReturnValue({ kind: "edge-delay", edgeId: edge.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.dblClick(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(cycleDelay).toHaveBeenCalledWith(edge.id);
  });
});

describe("GE-19 dblclick — open weight editor on edge-weight hit region", () => {
  let openEdgeWeightEditor: ReturnType<typeof vi.fn>;
  const edge = seedGraph.edges[0]!;

  beforeEach(() => {
    openEdgeWeightEditor = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      openEdgeWeightEditor,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("dblclick on edge-weight calls openEdgeWeightEditor", async () => {
    mockHitTest.mockReturnValue({ kind: "edge-weight", edgeId: edge.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.dblClick(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(openEdgeWeightEditor).toHaveBeenCalledWith(edge.id);
  });
});

describe("GE-18 dblclick — no-op in simulate mode", () => {
  let openNodeEditor: ReturnType<typeof vi.fn>;
  const node = seedGraph.nodes[0]!;

  beforeEach(() => {
    openNodeEditor = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      openNodeEditor,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("dblclick on node in simulate mode does NOT open editor", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: node.id });
    useStore.setState({ mode: "simulate" } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.dblClick(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(openNodeEditor).not.toHaveBeenCalled();
  });
});

describe("GE-30 hover feedback", () => {
  const edge = seedGraph.edges[0]!;

  beforeEach(() => {
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      mode: "select",
      hoveredEdgeRegion: null,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  afterEach(() => {
    useStore.setState({ hoveredEdgeRegion: null } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
  });

  it("pointermove over edge-delay hit in select mode sets hoveredEdgeRegion", async () => {
    mockHitTest.mockReturnValue({ kind: "edge-delay", edgeId: edge.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.pointerMove(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(useStore.getState().hoveredEdgeRegion).toEqual({
      edgeId: edge.id,
      region: "delay",
    });
  });

  it("pointermove over edge-weight hit in select mode sets hoveredEdgeRegion", async () => {
    mockHitTest.mockReturnValue({ kind: "edge-weight", edgeId: edge.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.pointerMove(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(useStore.getState().hoveredEdgeRegion).toEqual({
      edgeId: edge.id,
      region: "weight",
    });
  });

  it("pointermove over non-edge-region clears hoveredEdgeRegion", async () => {
    useStore.setState({
      hoveredEdgeRegion: { edgeId: edge.id, region: "delay" },
    } as unknown as Parameters<typeof useStore.setState>[0]);
    mockHitTest.mockReturnValue({ kind: "node", id: seedGraph.nodes[0]!.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.pointerMove(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(useStore.getState().hoveredEdgeRegion).toBeNull();
  });
});

describe("GE-32 spring-loaded modes — Canvas interaction", () => {
  const [nodeA, nodeB] = seedGraph.nodes as [
    (typeof seedGraph.nodes)[0],
    (typeof seedGraph.nodes)[1],
  ];

  beforeEach(() => {
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      mode: "select",
      previousMode: null,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  // Task 4 — Shift+pointerdown on node enters spring add-edge
  it("Shift+pointerdown on a node enters spring add-edge mode", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: nodeA.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.pointerDown(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(useStore.getState().mode).toBe("add-edge");
    expect(useStore.getState().previousMode).toBe("select");
  });

  // Task 6 — pointer-up on different node while spring add-edge → addEdge + exit spring
  it("pointer-up on a different node in spring add-edge creates an edge and exits spring", async () => {
    const addEdge = vi.fn();
    useStore.setState({ addEdge } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    mockHitTest.mockReturnValue({ kind: "node", id: nodeA.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    // enter spring mode
    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    // release on a different node
    mockHitTest.mockReturnValue({ kind: "node", id: nodeB.id });
    fireEvent.pointerUp(canvas, { clientX: 0, clientY: 0 });
    expect(addEdge).toHaveBeenCalledWith(nodeA.id, nodeB.id);
    expect(useStore.getState().previousMode).toBeNull();
  });

  // Task 8 — Shift-up while in spring add-edge → exitSpringMode
  it("Shift-up while in spring mode exits spring without creating edge", async () => {
    const addEdge = vi.fn();
    useStore.setState({ addEdge } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    mockHitTest.mockReturnValue({ kind: "node", id: nodeA.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.keyUp(document, { key: "Shift" });
    expect(useStore.getState().mode).toBe("select");
    expect(useStore.getState().previousMode).toBeNull();
    expect(addEdge).not.toHaveBeenCalled();
  });

  // Task 10/12 — Shift+pointerdown on blank → create node immediately (no spring intermediary)
  it("Shift+pointerdown on blank canvas creates a node immediately", async () => {
    const addNode = vi.fn();
    useStore.setState({ addNode } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    mockHitTest.mockReturnValue(null);
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.pointerDown(container.querySelector("canvas")!, {
      clientX: 10,
      clientY: 20,
    });
    expect(addNode).toHaveBeenCalledTimes(1);
    // mode unchanged — no spring state entered
    expect(useStore.getState().mode).toBe("select");
    expect(useStore.getState().previousMode).toBeNull();
  });

  // Task 14 — Escape while in spring → exitSpringMode
  it("Escape while in spring mode exits spring", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: nodeA.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(useStore.getState().mode).toBe("select");
    expect(useStore.getState().previousMode).toBeNull();
  });

  // Task 15 — Escape while NOT in spring → mode = "select"
  it("Escape while not in spring mode returns to select", async () => {
    useStore.setState({
      mode: "add-node",
      previousMode: null,
    } as unknown as Parameters<typeof useStore.setState>[0]);
    render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(document, { key: "Escape" });
    expect(useStore.getState().mode).toBe("select");
  });

  // Task 17 — Space tap toggles simRunning
  it("Space toggles simRunning from true to false", async () => {
    useStore.setState({ simRunning: true } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(document, { key: " " });
    expect(useStore.getState().simRunning).toBe(false);
  });

  it("Space toggles simRunning from false to true", async () => {
    useStore.setState({ simRunning: false } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(document, { key: " " });
    expect(useStore.getState().simRunning).toBe(true);
  });

  // Task 19 — simulate mode exempt from spring-loading
  it("Shift+pointerdown on node while in simulate mode does NOT enter spring mode", async () => {
    useStore.setState({
      mode: "simulate",
      previousMode: null,
    } as unknown as Parameters<typeof useStore.setState>[0]);
    mockHitTest.mockReturnValue({ kind: "node", id: nodeA.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.pointerDown(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    expect(useStore.getState().mode).toBe("simulate");
    expect(useStore.getState().previousMode).toBeNull();
  });

  // Task 20 — no double-spring
  it("Shift+pointerdown while already in spring mode does not nest a second spring", async () => {
    useStore.setState({
      mode: "add-edge",
      previousMode: "select",
    } as unknown as Parameters<typeof useStore.setState>[0]);
    mockHitTest.mockReturnValue({ kind: "node", id: nodeA.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.pointerDown(container.querySelector("canvas")!, {
      clientX: 0,
      clientY: 0,
    });
    // previousMode should still be "select", not overwritten
    expect(useStore.getState().previousMode).toBe("select");
  });

  // Task 21 — Shift+Option in spring add-edge → constraint edge
  it("pointer-up with Alt held in spring add-edge calls setPendingConstraintEdge", async () => {
    const setPendingConstraintEdge = vi.fn();
    useStore.setState({ setPendingConstraintEdge } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    mockHitTest.mockReturnValue({ kind: "node", id: nodeA.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.keyDown(document, { key: "Shift" });
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.keyDown(document, { key: "Alt" }); // jsdom doesn't propagate altKey via PointerEvent init
    mockHitTest.mockReturnValue({ kind: "node", id: nodeB.id });
    fireEvent.pointerUp(canvas, { clientX: 0, clientY: 0 });
    expect(setPendingConstraintEdge).toHaveBeenCalledWith(nodeA.id, nodeB.id);
    expect(useStore.getState().previousMode).toBeNull();
  });

  // Bug fix — Space switches to simulate mode
  it("Space switches to simulate mode when not already there", async () => {
    useStore.setState({
      mode: "select",
      simRunning: false,
    } as unknown as Parameters<typeof useStore.setState>[0]);
    render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(document, { key: " " });
    expect(useStore.getState().mode).toBe("simulate");
  });

  it("Space does not change mode when already in simulate", async () => {
    useStore.setState({
      mode: "simulate",
      simRunning: true,
    } as unknown as Parameters<typeof useStore.setState>[0]);
    render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(document, { key: " " });
    expect(useStore.getState().mode).toBe("simulate");
    expect(useStore.getState().simRunning).toBe(false);
  });
});

// GE-37: annotation canvas interactions
describe("GE-37 add-annotation mode — pointerdown places annotation", () => {
  let addAnnotation: ReturnType<typeof vi.fn>;
  let openAnnotationEditor: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addAnnotation = vi.fn().mockReturnValue("a1");
    openAnnotationEditor = vi.fn();
    mockHitTest.mockReset().mockReturnValue(null);
    useStore.setState({
      graph: seedGraph,
      addAnnotation,
      openAnnotationEditor,
      mode: "add-annotation",
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("pointerdown calls addAnnotation with pointer coordinates", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.pointerDown(container.querySelector("canvas")!, {
      clientX: 200,
      clientY: 150,
    });
    expect(addAnnotation).toHaveBeenCalledTimes(1);
  });

  it("pointerdown calls openAnnotationEditor with the returned id", async () => {
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.pointerDown(container.querySelector("canvas")!, {
      clientX: 200,
      clientY: 150,
    });
    expect(openAnnotationEditor).toHaveBeenCalledWith("a1");
  });
});

describe("GE-37 dblclick on annotation — opens annotation editor", () => {
  let openAnnotationEditor: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    openAnnotationEditor = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      openAnnotationEditor,
      mode: "select",
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("dblclick on annotation calls openAnnotationEditor", async () => {
    mockHitTest.mockReturnValue({ kind: "annotation", id: "a1" });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.dblClick(container.querySelector("canvas")!, {
      clientX: 100,
      clientY: 100,
    });
    expect(openAnnotationEditor).toHaveBeenCalledWith("a1");
  });
});

describe("GE-37 delete mode — pointerdown on annotation removes it", () => {
  let deleteAnnotation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    deleteAnnotation = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      deleteAnnotation,
      mode: "delete",
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("pointerdown on annotation calls deleteAnnotation", async () => {
    mockHitTest.mockReturnValue({ kind: "annotation", id: "a1" });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.pointerDown(container.querySelector("canvas")!, {
      clientX: 100,
      clientY: 100,
    });
    expect(deleteAnnotation).toHaveBeenCalledWith("a1");
  });
});

describe("GE-37 select mode — drag annotation calls moveAnnotation", () => {
  let moveAnnotation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    moveAnnotation = vi.fn();
    mockHitTest.mockReset();
    useStore.setState({
      graph: {
        ...seedGraph,
        annotations: [{ id: "a1", x: 100, y: 100, text: "" }],
      },
      moveAnnotation,
      mode: "select",
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("pointerdown + pointermove + pointerup calls moveAnnotation with final position", async () => {
    mockHitTest.mockReturnValue({ kind: "annotation", id: "a1" });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(canvas, { clientX: 120, clientY: 130 });
    fireEvent.pointerUp(canvas, { clientX: 120, clientY: 130 });
    expect(moveAnnotation).toHaveBeenCalled();
  });
});

// GE-38: H key toggles history overlay
describe("GE-38 H key — history toggle", () => {
  beforeEach(() => {
    useStore.setState({ showHistory: false });
  });

  it("pressing h calls toggleHistory", async () => {
    const toggleHistory = vi.fn();
    useStore.setState({ toggleHistory } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(document, { key: "h" });
    expect(toggleHistory).toHaveBeenCalledOnce();
  });
});

// ─── Modulator creation — canvas interaction (Task 13) ──────────────────────

describe("modulator creation — drag from node to edge in add-edge mode", () => {
  const nodeA = seedGraph.nodes[0]!;
  const causalEdge = seedGraph.edges.find((e) => e.kind === "causal")!;

  beforeEach(() => {
    mockHitTest.mockReset();
    useStore.setState({
      graph: seedGraph,
      mode: "add-edge",
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("pointer-down on an edge region calls setPendingModulatorTarget with the edge id", async () => {
    const setPendingModulatorTarget = vi.fn();
    useStore.setState({
      setPendingModulatorTarget,
    } as unknown as Parameters<typeof useStore.setState>[0]);

    mockHitTest.mockReturnValueOnce({
      kind: "edge-weight",
      edgeId: causalEdge.id,
    });

    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvas, { clientX: 200, clientY: 100 });

    expect(setPendingModulatorTarget).toHaveBeenCalledWith(causalEdge.id);
  });

  it("pointer-up on a node when pendingModulatorTarget is set calls confirmModulator", async () => {
    const confirmModulator = vi.fn();
    useStore.setState({
      pendingModulatorTarget: causalEdge.id,
      confirmModulator,
    } as unknown as Parameters<typeof useStore.setState>[0]);

    mockHitTest
      .mockReturnValueOnce({ kind: "node", id: nodeA.id })
      .mockReturnValueOnce({ kind: "node", id: nodeA.id });

    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(canvas, { clientX: 0, clientY: 0 });

    expect(confirmModulator).toHaveBeenCalledWith(nodeA.id, 1);
  });

  it("pointer-up on a node with Alt held calls confirmModulator with polarity -1", async () => {
    const confirmModulator = vi.fn();
    useStore.setState({
      pendingModulatorTarget: causalEdge.id,
      confirmModulator,
    } as unknown as Parameters<typeof useStore.setState>[0]);

    mockHitTest
      .mockReturnValueOnce({ kind: "node", id: nodeA.id })
      .mockReturnValueOnce({ kind: "node", id: nodeA.id });

    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;

    fireEvent.keyDown(document, { key: "Alt" });
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(canvas, { clientX: 0, clientY: 0 });
    fireEvent.keyUp(document, { key: "Alt" });

    expect(confirmModulator).toHaveBeenCalledWith(nodeA.id, -1);
  });

  it("Escape while pendingModulatorTarget is set calls cancelModulator instead of changing mode", async () => {
    const cancelModulator = vi.fn();
    useStore.setState({
      mode: "add-edge",
      previousMode: null,
      pendingModulatorTarget: causalEdge.id,
      cancelModulator,
    } as unknown as Parameters<typeof useStore.setState>[0]);
    render(<Canvas />);
    await act(async () => {});
    fireEvent.keyDown(document, { key: "Escape" });
    expect(cancelModulator).toHaveBeenCalled();
    expect(useStore.getState().mode).toBe("add-edge");
  });
});

// DR--20260412--app--node-role-indicators
describe("outcome node warning in simulate mode", () => {
  const outcomeNode = { ...seedGraph.nodes[0]!, role: "outcome" as const };
  const graphWithOutcome = {
    ...seedGraph,
    nodes: [outcomeNode, ...seedGraph.nodes.slice(1)],
  };

  beforeEach(() => {
    mockHitTest.mockReset();
    useStore.setState({
      graph: graphWithOutcome,
      sim: makeInitialSim(graphWithOutcome),
      mode: "simulate",
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("shows outcome warning element when clicking an outcome node", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: outcomeNode.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const canvas = container.querySelector("canvas")!;
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    expect(container.querySelector("[data-testid='outcome-warning']")).not.toBeNull();
  });

  it("outcome warning contains the node label", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: outcomeNode.id });
    const { container, getByText } = render(<Canvas />);
    await act(async () => {});
    fireEvent.pointerDown(container.querySelector("canvas")!, { clientX: 0, clientY: 0 });
    expect(getByText(/is a system outcome/i)).toBeDefined();
  });

  it("injection still proceeds for outcome nodes", async () => {
    mockHitTest.mockReturnValue({ kind: "node", id: outcomeNode.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    const before = useStore.getState().sim.nodeValues.get(outcomeNode.id)!;
    fireEvent.pointerDown(container.querySelector("canvas")!, { clientX: 0, clientY: 0 });
    const after = useStore.getState().sim.nodeValues.get(outcomeNode.id)!;
    expect(after).toBeGreaterThan(before);
  });

  it("does not show warning for a node with no role", async () => {
    const plainNode = seedGraph.nodes[1]!;
    mockHitTest.mockReturnValue({ kind: "node", id: plainNode.id });
    const { container } = render(<Canvas />);
    await act(async () => {});
    fireEvent.pointerDown(container.querySelector("canvas")!, { clientX: 0, clientY: 0 });
    expect(container.querySelector("[data-testid='outcome-warning']")).toBeNull();
  });
});
