import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";
import { render, act } from "@testing-library/react";
import { useStore } from "./store.ts";

vi.mock("./Canvas.tsx", () => ({ Canvas: () => null }));
vi.mock("./Toolbar.tsx", () => ({ Toolbar: () => null }));
vi.mock("./NodePopover.tsx", () => ({ NodePopover: () => null }));
vi.mock("./EdgeWeightPopover.tsx", () => ({ EdgeWeightPopover: () => null }));
vi.mock("./ConstraintChoiceDialog.tsx", () => ({
  ConstraintChoiceDialog: () => null,
}));

import { App } from "./App.tsx";

describe("SE-07: startup restore", () => {
  let loadFromUrl: ReturnType<typeof vi.fn>;
  let loadPersistedGraph: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    loadFromUrl = vi.fn();
    loadPersistedGraph = vi.fn();
    useStore.setState({ loadFromUrl, loadPersistedGraph } as Parameters<
      typeof useStore.setState
    >[0]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("calls loadFromUrl with search string when ?g= param is present", async () => {
    vi.stubGlobal("location", { search: "?g=abc123" });
    await act(async () => {
      render(<App />);
    });
    expect(loadFromUrl).toHaveBeenCalledWith("?g=abc123");
    expect(loadPersistedGraph).not.toHaveBeenCalled();
  });

  it("calls loadPersistedGraph when no ?g= param is present", async () => {
    vi.stubGlobal("location", { search: "" });
    await act(async () => {
      render(<App />);
    });
    expect(loadPersistedGraph).toHaveBeenCalledOnce();
    expect(loadFromUrl).not.toHaveBeenCalled();
  });

  it("sets modelId from ?m= param and calls loadPersistedGraph (not loadFromUrl)", async () => {
    const testId = "11111111-1111-1111-1111-111111111111";
    vi.stubGlobal("location", { search: `?m=${testId}` });
    await act(async () => {
      render(<App />);
    });
    expect(useStore.getState().modelId).toBe(testId);
    expect(loadPersistedGraph).toHaveBeenCalledOnce();
    expect(loadFromUrl).not.toHaveBeenCalled();
  });

  it("sets ?m=<modelId> in URL via replaceState when no ?m= param is present", async () => {
    const replaceState = vi.fn();
    vi.stubGlobal("history", { replaceState });
    vi.stubGlobal("location", { search: "" });
    await act(async () => {
      render(<App />);
    });
    const { modelId } = useStore.getState();
    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      expect.stringContaining(`m=${modelId}`),
    );
  });

  it("restores modelId from swoopy_current_model when no ?m= param is present", async () => {
    const savedId = "22222222-2222-2222-2222-222222222222";
    localStorage.setItem("swoopy_current_model", savedId);
    vi.stubGlobal("location", { search: "" });
    await act(async () => {
      render(<App />);
    });
    expect(useStore.getState().modelId).toBe(savedId);
    expect(loadPersistedGraph).toHaveBeenCalledOnce();
  });
});
