import { useEffect, useRef, useState } from "react";
import { useStore } from "./store.ts";
import { NODE_COLOURS } from "@swoopy/engine";
import type { SizeTier, ColourTier } from "@swoopy/engine";

const SIZE_TIERS: SizeTier[] = ["xs", "s", "m", "l", "xl"];
const SWATCH_BASE = 10; // px diameter for XS swatch
const SWATCH_STEP = 4;

const COLOUR_TIERS: ColourTier[] = [
  "blue",
  "green",
  "red",
  "orange",
  "yellow",
  "teal",
  "purple",
  "grey",
];

export function NodePopover() {
  const editingNodeId = useStore((s) => s.editingNodeId);
  const graph = useStore((s) => s.graph);
  const { updateNode, closeNodeEditor } = useStore.getState();

  const node = editingNodeId
    ? graph.nodes.find((n) => n.id === editingNodeId)
    : null;

  const [label, setLabel] = useState("");
  const [annotation, setAnnotation] = useState("");
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(10);
  const [initial, setInitial] = useState(0);
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!node) return;
    setLabel(node.label);
    setAnnotation(node.annotation ?? "");
    setMin(node.min);
    setMax(node.max);
    setInitial(node.initial);
    setTimeout(() => labelRef.current?.select(), 0);
  }, [node?.id]);

  if (!node) return null;

  function commit() {
    if (!editingNodeId) return;
    updateNode(editingNodeId, { label, annotation: annotation || undefined, min, max, initial });
    closeNodeEditor();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") closeNodeEditor();
  }

  return (
    <div
      style={{
        position: "fixed",
        left: node.x,
        top: node.y + node.radius + 12,
        transform: "translateX(-50%)",
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 10,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        zIndex: 100,
        minWidth: 200,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
      onKeyDown={onKeyDown}
    >
      <input
        ref={labelRef}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label"
        style={inputStyle}
      />
      <input
        value={annotation}
        onChange={(e) => setAnnotation(e.target.value)}
        placeholder="Annotation"
        style={inputStyle}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={labelStyle}>Min</label>
        <input
          type="number"
          value={min}
          onChange={(e) => setMin(Number(e.target.value))}
          style={{ ...inputStyle, width: 60 }}
        />
        <label style={labelStyle}>Max</label>
        <input
          type="number"
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
          style={{ ...inputStyle, width: 60 }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={labelStyle}>Initial</label>
        <input
          type="number"
          value={initial}
          onChange={(e) => setInitial(Number(e.target.value))}
          style={{ ...inputStyle, width: 60 }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={labelStyle}>Colour</label>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {COLOUR_TIERS.map((tier) => {
            const active = node.colourTier === tier;
            return (
              <button
                key={tier}
                aria-label={tier}
                onClick={() => {
                  if (!editingNodeId) return;
                  updateNode(editingNodeId, { colourTier: tier });
                }}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: NODE_COLOURS[tier].swatch,
                  border: active
                    ? "2px solid #f1f5f9"
                    : "2px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={labelStyle}>Size</label>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {SIZE_TIERS.map((tier, i) => {
            const d = SWATCH_BASE + i * SWATCH_STEP;
            const active = node.sizeTier === tier;
            return (
              <button
                key={tier}
                aria-label={tier.toUpperCase()}
                onClick={() => {
                  if (!editingNodeId) return;
                  updateNode(editingNodeId, { sizeTier: tier });
                }}
                style={{
                  width: d,
                  height: d,
                  borderRadius: "50%",
                  background: active ? "#60a5fa" : "#334155",
                  border: active
                    ? "2px solid #93c5fd"
                    : "2px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={closeNodeEditor} style={btnStyle}>
          Cancel
        </button>
        <button onClick={commit} style={{ ...btnStyle, background: "#334155" }}>
          OK
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 6,
  color: "#f1f5f9",
  padding: "4px 8px",
  fontSize: 13,
  flex: 1,
};

const labelStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 12,
  whiteSpace: "nowrap",
};

const btnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #334155",
  borderRadius: 6,
  color: "#f1f5f9",
  cursor: "pointer",
  fontSize: 13,
  padding: "4px 12px",
};
