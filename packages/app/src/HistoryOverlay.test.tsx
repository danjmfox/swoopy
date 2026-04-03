import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useStore } from "./store.ts";

vi.mock("./HistoryLogger.ts", () => ({
  HistoryLogger: vi.fn(() => ({
    record: vi.fn(),
    clear: vi.fn(),
    getHistory: vi.fn(() => []),
    exportCSV: vi.fn(() => "Tick,Node A\n60,5\n"),
  })),
}));

vi.mock("./App.tsx", () => ({
  historyLogger: {
    record: vi.fn(),
    clear: vi.fn(),
    getHistory: vi.fn(() => [{ tick: 60, value: 5 }]),
    exportCSV: vi.fn(() => "Tick,Node A\n60,5\n"),
  },
}));

import { HistoryOverlay } from "./HistoryOverlay.tsx";

beforeEach(() => {
  useStore.setState({ showHistory: false });
});

describe("HistoryOverlay", () => {
  it("renders null when showHistory is false", () => {
    useStore.setState({ showHistory: false });
    const { container } = render(<HistoryOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a table when showHistory is true and history data exists", () => {
    useStore.setState({
      showHistory: true,
      graph: {
        nodes: [
          {
            id: "node-1",
            label: "Stress",
            x: 0,
            y: 0,
            radius: 30,
            sizeTier: "m",
            colourTier: "blue",
            min: 0,
            max: 10,
            initial: 5,
          },
        ],
        edges: [],
        annotations: [],
      } as unknown as typeof useStore.getState.prototype.graph,
    });
    render(<HistoryOverlay />);
    expect(screen.getByRole("table")).toBeTruthy();
  });

  it("clicking Download CSV triggers a file download with the CSV content", () => {
    const mockUrl = "blob:fake-url";
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => mockUrl),
      revokeObjectURL: vi.fn(),
    });
    const mockClick = vi.fn();
    const mockAnchor = { href: "", download: "", click: mockClick };
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") return mockAnchor as unknown as HTMLElement;
      return origCreateElement(tag);
    });

    useStore.setState({
      showHistory: true,
      graph: {
        nodes: [
          {
            id: "node-1",
            label: "Stress",
            x: 0,
            y: 0,
            radius: 30,
            sizeTier: "m",
            colourTier: "blue",
            min: 0,
            max: 10,
            initial: 5,
          },
        ],
        edges: [],
        annotations: [],
      } as unknown as typeof useStore.getState.prototype.graph,
    });
    render(<HistoryOverlay />);
    fireEvent.click(screen.getByText("Download CSV"));
    expect(mockClick).toHaveBeenCalledOnce();
    expect(mockAnchor.download).toBe("swoopy-history.csv");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders node label as a row header and sim-second column header derived from tick", () => {
    useStore.setState({
      showHistory: true,
      graph: {
        nodes: [
          {
            id: "node-1",
            label: "Stress",
            x: 0,
            y: 0,
            radius: 30,
            sizeTier: "m",
            colourTier: "blue",
            min: 0,
            max: 10,
            initial: 5,
          },
        ],
        edges: [],
        annotations: [],
      } as unknown as typeof useStore.getState.prototype.graph,
    });
    render(<HistoryOverlay />);
    // Node label appears as a row
    expect(screen.getByText("Stress")).toBeTruthy();
    // tick=60 at 60 ticks/s → "1s"
    expect(screen.getByText("1s")).toBeTruthy();
  });
});
