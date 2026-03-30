import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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
});
