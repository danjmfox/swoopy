import { useEffect, useRef, useState } from "react";
import { useStore } from "./store.ts";

export function AnnotationPopover() {
  const editingAnnotationId = useStore((s) => s.editingAnnotationId);
  const graph = useStore((s) => s.graph);
  const { updateAnnotation, closeAnnotationEditor } = useStore.getState();

  const ann = editingAnnotationId
    ? graph.annotations.find((a) => a.id === editingAnnotationId)
    : null;

  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ann) return;
    setText(ann.text);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [ann?.id]);

  if (!ann || !editingAnnotationId) return null;

  function save() {
    updateAnnotation(editingAnnotationId!, text);
    closeAnnotationEditor();
  }

  function cancel() {
    closeAnnotationEditor();
  }

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 10,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        zIndex: 100,
        minWidth: 240,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        style={{
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: 6,
          color: "#f1f5f9",
          padding: "6px 8px",
          font: "13px system-ui, sans-serif",
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={cancel}
          style={{
            background: "transparent",
            border: "1px solid #475569",
            borderRadius: 6,
            color: "#94a3b8",
            padding: "4px 12px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={save}
          style={{
            background: "#3b82f6",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            padding: "4px 12px",
            cursor: "pointer",
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
