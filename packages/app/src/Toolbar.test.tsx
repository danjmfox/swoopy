import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { useStore } from "./store.ts";
import { seedGraph } from "./seed.ts";
import { Toolbar } from "./Toolbar.tsx";
import type { AppMode } from "./store.ts";

describe("SE-06/SE-09: model action bar (top-right)", () => {
  let shareGraph: ReturnType<typeof vi.fn>;
  let newModel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    shareGraph = vi.fn().mockResolvedValue(undefined);
    newModel = vi.fn();
    useStore.setState({
      graph: seedGraph,
      shareGraph,
      newModel,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a Share button", () => {
    const { getByTitle } = render(<Toolbar />);
    expect(getByTitle("Share")).toBeTruthy();
  });

  it("renders a New Model button", () => {
    const { getByTitle } = render(<Toolbar />);
    expect(getByTitle("New Model")).toBeTruthy();
  });

  it("clicking Share calls shareGraph", async () => {
    const { getByTitle } = render(<Toolbar />);
    await act(async () => {
      fireEvent.click(getByTitle("Share"));
    });
    expect(shareGraph).toHaveBeenCalledOnce();
  });

  it('Share button shows "Copied!" feedback after click, then reverts', async () => {
    vi.useFakeTimers();
    const { getByTitle } = render(<Toolbar />);
    await act(async () => {
      fireEvent.click(getByTitle("Share"));
    });
    expect(getByTitle("Share").textContent).toContain("Copied");
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(getByTitle("Share").textContent).not.toContain("Copied");
  });

  it("clicking New Model calls newModel", async () => {
    const { getByTitle } = render(<Toolbar />);
    await act(async () => {
      fireEvent.click(getByTitle("New Model"));
    });
    expect(newModel).toHaveBeenCalledOnce();
  });
});

describe("Toolbar mode switcher", () => {
  let setMode: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setMode = vi.fn();
    useStore.setState({
      graph: seedGraph,
      mode: "select",
      setMode,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  const modes: AppMode[] = [
    "select",
    "add-node",
    "add-edge",
    "simulate",
    "delete",
  ];

  it("renders a button for each of the five modes", () => {
    const { getByTitle } = render(<Toolbar />);
    expect(getByTitle("Select")).toBeTruthy();
    expect(getByTitle("Add Node")).toBeTruthy();
    expect(getByTitle("Add Edge")).toBeTruthy();
    expect(getByTitle("Simulate")).toBeTruthy();
    expect(getByTitle("Delete")).toBeTruthy();
  });

  it.each(modes)("clicking %s button calls setMode with %s", async (mode) => {
    const titleMap: Record<AppMode, string> = {
      select: "Select",
      "add-node": "Add Node",
      "add-edge": "Add Edge",
      simulate: "Simulate",
      delete: "Delete",
      "add-annotation": "Add Annotation",
    };
    const { getByTitle } = render(<Toolbar />);
    await act(async () => {
      fireEvent.click(getByTitle(titleMap[mode]));
    });
    expect(setMode).toHaveBeenCalledWith(mode);
  });

  it("GE-28 each mode button displays its shortcut key inline", () => {
    const { getByTitle } = render(<Toolbar />);
    expect(getByTitle("Select").textContent).toContain("S");
    expect(getByTitle("Add Node").textContent).toContain("N");
    expect(getByTitle("Add Edge").textContent).toContain("E");
    expect(getByTitle("Simulate").textContent).toContain("R");
    expect(getByTitle("Delete").textContent).toContain("D");
  });

  it("sim controls (play/pause, reset, speed) are hidden outside simulate mode", () => {
    useStore.setState({ mode: "select" } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    const { queryByTitle } = render(<Toolbar />);
    expect(queryByTitle("Pause")).toBeNull();
    expect(queryByTitle("Resume")).toBeNull();
    expect(queryByTitle("Reset")).toBeNull();
  });

  it("sim controls are visible in simulate mode", () => {
    useStore.setState({
      mode: "simulate",
      simRunning: true,
    } as unknown as Parameters<typeof useStore.setState>[0]);
    const { getByTitle } = render(<Toolbar />);
    expect(getByTitle("Pause")).toBeTruthy();
    expect(getByTitle("Reset")).toBeTruthy();
  });

  it("renders a ? button", () => {
    const { getByTitle } = render(<Toolbar />);
    expect(getByTitle("Help")).toBeTruthy();
  });

  it("pressing ? opens the help modal", () => {
    const { queryByRole } = render(<Toolbar />);
    expect(queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(document, { key: "?" });
    expect(queryByRole("dialog")).toBeTruthy();
  });

  it("pressing ? while modal is open closes it", () => {
    const { queryByRole } = render(<Toolbar />);
    fireEvent.keyDown(document, { key: "?" });
    expect(queryByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(document, { key: "?" });
    expect(queryByRole("dialog")).toBeNull();
  });

  it("active mode button has distinct styling", () => {
    useStore.setState({ mode: "simulate" } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    const { getByTitle } = render(<Toolbar />);
    const simulateBtn = getByTitle("Simulate") as HTMLButtonElement;
    const selectBtn = getByTitle("Select") as HTMLButtonElement;
    // active button should have a non-transparent background
    expect(simulateBtn.style.background).not.toBe("transparent");
    expect(selectBtn.style.background).toBe("transparent");
  });

  // GE-33 spring-loaded visual feedback
  it("GE-33: spring-loaded active button has transparent background with amber outline", () => {
    useStore.setState({
      mode: "add-edge",
      previousMode: "select",
    } as unknown as Parameters<typeof useStore.setState>[0]);
    const { getByTitle } = render(<Toolbar />);
    const addEdgeBtn = getByTitle("Add Edge") as HTMLButtonElement;
    // spring state: no fill, amber border
    expect(addEdgeBtn.style.background).toBe("transparent");
    expect(addEdgeBtn.style.outline).toContain("#f59e0b");
  });

  it("GE-33: persistent active button has filled background (not spring)", () => {
    useStore.setState({
      mode: "add-edge",
      previousMode: null,
    } as unknown as Parameters<typeof useStore.setState>[0]);
    const { getByTitle } = render(<Toolbar />);
    const addEdgeBtn = getByTitle("Add Edge") as HTMLButtonElement;
    expect(addEdgeBtn.style.background).not.toBe("transparent");
    expect(addEdgeBtn.style.outline).toBeFalsy();
  });
});

// GE-37: add-annotation toolbar button
describe("GE-37: add-annotation toolbar button", () => {
  let setMode: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setMode = vi.fn();
    useStore.setState({
      graph: seedGraph,
      mode: "select",
      setMode,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("renders an Add Annotation button", () => {
    const { getByTitle } = render(<Toolbar />);
    expect(getByTitle("Add Annotation")).toBeTruthy();
  });

  it("clicking Add Annotation calls setMode with add-annotation", () => {
    const { getByTitle } = render(<Toolbar />);
    fireEvent.click(getByTitle("Add Annotation"));
    expect(setMode).toHaveBeenCalledWith("add-annotation");
  });
});

// GE-38: History toggle button
describe("GE-38: history toolbar button", () => {
  it("renders a History button with title 'History'", () => {
    const { getByTitle } = render(<Toolbar />);
    expect(getByTitle("History")).toBeTruthy();
  });

  it("History button appears before Add Annotation button in the DOM", () => {
    const { getByTitle } = render(<Toolbar />);
    const history = getByTitle("History");
    const annotation = getByTitle("Add Annotation");
    expect(
      history.compareDocumentPosition(annotation) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("clicking History button calls toggleHistory", () => {
    const toggleHistory = vi.fn();
    useStore.setState({ toggleHistory } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    const { getByTitle } = render(<Toolbar />);
    fireEvent.click(getByTitle("History"));
    expect(toggleHistory).toHaveBeenCalledOnce();
  });
});

describe("model title input", () => {
  let setModelTitle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setModelTitle = vi.fn();
    useStore.setState({
      graph: seedGraph,
      modelTitle: "",
      setModelTitle,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  it("renders a title input with placeholder 'Untitled model'", () => {
    const { getByPlaceholderText } = render(<Toolbar />);
    expect(getByPlaceholderText("Untitled model")).toBeTruthy();
  });

  it("title input shows the current modelTitle value", () => {
    useStore.setState({ modelTitle: "My Loop" } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    const { getByDisplayValue } = render(<Toolbar />);
    expect(getByDisplayValue("My Loop")).toBeTruthy();
  });

  it("blurring the title input calls setModelTitle with the new value", () => {
    const { getByPlaceholderText } = render(<Toolbar />);
    const input = getByPlaceholderText("Untitled model");
    fireEvent.change(input, { target: { value: "New Name" } });
    fireEvent.blur(input);
    expect(setModelTitle).toHaveBeenCalledWith("New Name");
  });
});

describe("Open dropdown — delete button", () => {
  let deleteModel: ReturnType<typeof vi.fn>;
  let loadModel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    deleteModel = vi.fn();
    loadModel = vi.fn();
    localStorage.setItem("swoopy_graph_m1", "{}");
    localStorage.setItem("swoopy_title_m1", "Alpha");
    localStorage.setItem("swoopy_graph_m2", "{}");
    localStorage.setItem("swoopy_title_m2", "Beta");
    useStore.setState({
      graph: seedGraph,
      modelId: "m1",
      deleteModel,
      loadModel,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders a delete button for each model row", () => {
    const { getByTitle, getAllByTitle } = render(<Toolbar />);
    fireEvent.click(getByTitle("Open local model"));
    expect(getAllByTitle(/Delete .*/)).toHaveLength(2);
  });

  it("clicking × calls deleteModel with the row's id", async () => {
    const { getByTitle, getAllByTitle } = render(<Toolbar />);
    fireEvent.click(getByTitle("Open local model"));
    const deleteButtons = getAllByTitle(/Delete .*/);
    await act(async () => {
      fireEvent.click(deleteButtons[0]!);
    });
    expect(deleteModel).toHaveBeenCalledOnce();
    expect(deleteModel).toHaveBeenCalledWith(expect.any(String));
  });

  it("clicking × does not close the dropdown", async () => {
    const { getByTitle, getAllByTitle } = render(<Toolbar />);
    fireEvent.click(getByTitle("Open local model"));
    const deleteButtons = getAllByTitle(/Delete .*/);
    await act(async () => {
      fireEvent.click(deleteButtons[0]!);
    });
    expect(getAllByTitle(/Delete .*/)).not.toHaveLength(0);
  });

  it("clicking a model row calls loadModel and closes the dropdown", async () => {
    const { getByTitle, getByText, queryByTitle } = render(<Toolbar />);
    fireEvent.click(getByTitle("Open local model"));
    await act(async () => {
      fireEvent.click(getByText("Alpha"));
    });
    expect(loadModel).toHaveBeenCalledOnce();
    expect(queryByTitle(/Delete .*/)).toBeNull();
  });
});

describe("share with naming prompt", () => {
  let shareGraph: ReturnType<typeof vi.fn>;
  let setModelTitle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    shareGraph = vi.fn().mockResolvedValue(undefined);
    setModelTitle = vi.fn();
    useStore.setState({
      graph: seedGraph,
      shareGraph,
      setModelTitle,
      newModel: vi.fn(),
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shares immediately when modelTitle is already set", async () => {
    vi.spyOn(window, "prompt");
    useStore.setState({ modelTitle: "Named" } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    const { getByTitle } = render(<Toolbar />);
    await act(async () => {
      fireEvent.click(getByTitle("Share"));
    });
    expect(window.prompt).not.toHaveBeenCalled();
    expect(shareGraph).toHaveBeenCalledOnce();
  });

  it("prompts for a name when modelTitle is empty, then calls setModelTitle and shareGraph", async () => {
    vi.spyOn(window, "prompt").mockReturnValue("Prompted Name");
    useStore.setState({ modelTitle: "" } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    const { getByTitle } = render(<Toolbar />);
    await act(async () => {
      fireEvent.click(getByTitle("Share"));
    });
    expect(window.prompt).toHaveBeenCalled();
    expect(setModelTitle).toHaveBeenCalledWith("Prompted Name");
    expect(shareGraph).toHaveBeenCalledOnce();
  });

  it("skips setModelTitle and still shares if user dismisses the prompt (returns null)", async () => {
    vi.spyOn(window, "prompt").mockReturnValue(null);
    useStore.setState({ modelTitle: "" } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    const { getByTitle } = render(<Toolbar />);
    await act(async () => {
      fireEvent.click(getByTitle("Share"));
    });
    expect(setModelTitle).not.toHaveBeenCalled();
    expect(shareGraph).toHaveBeenCalledOnce();
  });
});
