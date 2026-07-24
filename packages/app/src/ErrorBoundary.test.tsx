import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary.tsx";

function Thrower(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <div>content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("content")).toBeTruthy();
  });

  it("renders a fallback instead of a blank page when a child throws during render", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>,
    );
    expect(screen.queryByText("content")).toBeNull();
    expect(document.body.textContent).not.toBe("");
  });
});
