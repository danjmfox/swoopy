import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act, screen } from "@testing-library/react";
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
    useStore.setState({
      loadFromUrl,
      loadPersistedGraph,
    } as unknown as Parameters<typeof useStore.setState>[0]);
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

describe("document.title sync", () => {
  let loadFromUrl: ReturnType<typeof vi.fn>;
  let loadPersistedGraph: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    loadFromUrl = vi.fn();
    loadPersistedGraph = vi.fn();
    useStore.setState({
      loadFromUrl,
      loadPersistedGraph,
      modelTitle: "",
    } as unknown as Parameters<typeof useStore.setState>[0]);
    vi.stubGlobal("location", { search: "" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.title = "Swoopy";
  });

  it("sets document.title to 'Swoopy' when modelTitle is empty", async () => {
    await act(async () => {
      render(<App />);
    });
    expect(document.title).toBe("Swoopy");
  });

  it("sets document.title to '<title> — Swoopy' when modelTitle is set", async () => {
    useStore.setState({ modelTitle: "My Loop" } as unknown as Parameters<
      typeof useStore.setState
    >[0]);
    await act(async () => {
      render(<App />);
    });
    expect(document.title).toBe("My Loop — Swoopy");
  });

  it("updates document.title reactively when modelTitle changes", async () => {
    await act(async () => {
      render(<App />);
    });
    act(() => {
      useStore.setState({ modelTitle: "Updated" } as unknown as Parameters<
        typeof useStore.setState
      >[0]);
    });
    expect(document.title).toBe("Updated — Swoopy");
  });
});

describe("SE-07 title: startup reads ?title= param for ?m= routes", () => {
  let loadFromUrl: ReturnType<typeof vi.fn>;
  let loadPersistedGraph: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    loadFromUrl = vi.fn();
    loadPersistedGraph = vi.fn();
    useStore.setState({
      loadFromUrl,
      loadPersistedGraph,
      modelTitle: "",
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("sets modelTitle from ?title= when ?m= route loads", async () => {
    const testId = "33333333-3333-3333-3333-333333333333";
    vi.stubGlobal("location", { search: `?m=${testId}&title=Shared+Name` });
    await act(async () => {
      render(<App />);
    });
    expect(useStore.getState().modelTitle).toBe("Shared Name");
  });
});

describe("SE-10: welcome overlay", () => {
  let loadFromUrl: ReturnType<typeof vi.fn>;
  let loadPersistedGraph: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    loadFromUrl = vi.fn();
    loadPersistedGraph = vi.fn();
    useStore.setState({
      loadFromUrl,
      loadPersistedGraph,
    } as unknown as Parameters<typeof useStore.setState>[0]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("shows overlay on bare URL with no localStorage state", async () => {
    vi.stubGlobal("location", { search: "" });
    await act(async () => {
      render(<App />);
    });
    expect(
      screen.getByRole("button", { name: /start building/i }),
    ).toBeTruthy();
  });

  it("does not show overlay when swoopy_welcomed is set", async () => {
    localStorage.setItem("swoopy_welcomed", "true");
    vi.stubGlobal("location", { search: "" });
    await act(async () => {
      render(<App />);
    });
    expect(
      screen.queryByRole("button", { name: /start building/i }),
    ).toBeNull();
  });

  it("does not show overlay when swoopy_current_model is set", async () => {
    localStorage.setItem("swoopy_current_model", "some-id");
    vi.stubGlobal("location", { search: "" });
    await act(async () => {
      render(<App />);
    });
    expect(
      screen.queryByRole("button", { name: /start building/i }),
    ).toBeNull();
  });

  it("does not show overlay when ?g= param is present", async () => {
    vi.stubGlobal("location", { search: "?g=abc123" });
    await act(async () => {
      render(<App />);
    });
    expect(
      screen.queryByRole("button", { name: /start building/i }),
    ).toBeNull();
  });

  it("does not show overlay when ?m= param is present", async () => {
    vi.stubGlobal("location", { search: "?m=some-id" });
    await act(async () => {
      render(<App />);
    });
    expect(
      screen.queryByRole("button", { name: /start building/i }),
    ).toBeNull();
  });

  it("dismissing overlay sets swoopy_welcomed and hides the overlay", async () => {
    vi.stubGlobal("location", { search: "" });
    await act(async () => {
      render(<App />);
    });
    const btn = screen.getByRole("button", { name: /start building/i });
    await act(async () => {
      btn.click();
    });
    expect(
      screen.queryByRole("button", { name: /start building/i }),
    ).toBeNull();
    expect(localStorage.getItem("swoopy_welcomed")).toBe("true");
  });
});
