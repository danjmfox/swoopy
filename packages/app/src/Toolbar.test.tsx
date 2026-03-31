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
    } as Parameters<typeof useStore.setState>[0]);
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
    } as Parameters<typeof useStore.setState>[0]);
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
    useStore.setState({ mode: "select" } as Parameters<
      typeof useStore.setState
    >[0]);
    const { queryByTitle } = render(<Toolbar />);
    expect(queryByTitle("Pause")).toBeNull();
    expect(queryByTitle("Resume")).toBeNull();
    expect(queryByTitle("Reset")).toBeNull();
  });

  it("sim controls are visible in simulate mode", () => {
    useStore.setState({ mode: "simulate", simRunning: true } as Parameters<
      typeof useStore.setState
    >[0]);
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
    useStore.setState({ mode: "simulate" } as Parameters<
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
    } as Parameters<typeof useStore.setState>[0]);
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
    } as Parameters<typeof useStore.setState>[0]);
    const { getByTitle } = render(<Toolbar />);
    const addEdgeBtn = getByTitle("Add Edge") as HTMLButtonElement;
    expect(addEdgeBtn.style.background).not.toBe("transparent");
    expect(addEdgeBtn.style.outline).toBeFalsy();
  });
});
