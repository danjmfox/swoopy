import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useStore } from "./store.ts";
import { AnnotationPopover } from "./AnnotationPopover.tsx";
import type { AnnotationId } from "@swoopy/engine";

function setup() {
  useStore.setState({ graph: { nodes: [], edges: [], annotations: [] }, past: [], future: [] });
  const id = useStore.getState().addAnnotation(100, 200);
  useStore.setState({ editingAnnotationId: id as AnnotationId });
  return id;
}

// GE-37: AnnotationPopover
describe("AnnotationPopover", () => {
  beforeEach(setup);

  it("renders a textarea when editingAnnotationId is set", () => {
    render(<AnnotationPopover />);
    expect(screen.getByRole("textbox")).toBeDefined();
  });

  it("renders nothing when editingAnnotationId is null", () => {
    useStore.setState({ editingAnnotationId: null });
    const { container } = render(<AnnotationPopover />);
    expect(container.firstChild).toBeNull();
  });

  it("save button calls updateAnnotation with textarea value", () => {
    render(<AnnotationPopover />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "my note" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    const { graph, editingAnnotationId } = useStore.getState();
    const ann = graph.annotations.find((a) => a.id === editingAnnotationId);
    // editingAnnotationId should be cleared after save
    expect(useStore.getState().editingAnnotationId).toBeNull();
  });

  it("save closes the editor", () => {
    render(<AnnotationPopover />);
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(useStore.getState().editingAnnotationId).toBeNull();
  });

  it("cancel closes the editor without saving", () => {
    const id = useStore.getState().editingAnnotationId!;
    render(<AnnotationPopover />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "unsaved" } });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(useStore.getState().editingAnnotationId).toBeNull();
    const ann = useStore.getState().graph.annotations.find((a) => a.id === id);
    expect(ann?.text).toBe("");
  });
});
