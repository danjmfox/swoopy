import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { WelcomeOverlay } from "./WelcomeOverlay.tsx";

describe("WelcomeOverlay", () => {
  it("renders a dialog with tagline and capability bullets", () => {
    const { getByRole, getByText } = render(
      <WelcomeOverlay onDismiss={() => {}} />,
    );
    expect(getByRole("dialog")).toBeTruthy();
    expect(getByText(/systems thinking/i)).toBeTruthy();
    expect(getByText(/nodes/i)).toBeTruthy();
    expect(getByText(/edges/i)).toBeTruthy();
    expect(getByText(/simulate/i)).toBeTruthy();
  });

  it("renders a Start building CTA button", () => {
    const { getByRole } = render(<WelcomeOverlay onDismiss={() => {}} />);
    expect(getByRole("button", { name: /start building/i })).toBeTruthy();
  });

  it("calls onDismiss when Start building is clicked", () => {
    const onDismiss = vi.fn();
    const { getByRole } = render(<WelcomeOverlay onDismiss={onDismiss} />);
    fireEvent.click(getByRole("button", { name: /start building/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("calls onDismiss when Escape is pressed", () => {
    const onDismiss = vi.fn();
    render(<WelcomeOverlay onDismiss={onDismiss} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
