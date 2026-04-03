import { useEffect } from "react";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 10,
        padding: "20px 24px",
        zIndex: 200,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        color: "#f1f5f9",
        minWidth: 280,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600 }}>Help</span>
        <button title="Close" onClick={onClose} style={closeBtn}>
          ✕
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={sectionLabel}>Modes</div>
        {MODES.map(({ name, shortcut, description }) => (
          <div key={name} style={row}>
            <span style={key}>{shortcut}</span>
            <span style={modeName}>{name}</span>
            <span style={desc}>{description}</span>
          </div>
        ))}
      </div>

      <div>
        <div style={sectionLabel}>Canvas shortcuts</div>
        {SHORTCUTS.map(({ label, description }) => (
          <div key={label} style={row}>
            <span style={key}>{label}</span>
            <span style={desc}>{description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MODES = [
  { name: "Select", shortcut: "S", description: "Select, drag, configure" },
  { name: "Add Node", shortcut: "N", description: "Click canvas to add" },
  { name: "Add Edge", shortcut: "E", description: "Click source then target" },
  {
    name: "Simulate",
    shortcut: "R",
    description: "Click node to inject signal",
  },
  {
    name: "Add Annotation",
    shortcut: "A",
    description: "Click canvas to place text box",
  },
  { name: "Delete", shortcut: "D", description: "Click to remove" },
];

const SHORTCUTS = [
  { label: "Tab", description: "Cycle focus through nodes" },
  { label: "Enter", description: "Open focused node config" },
  { label: "Delete", description: "Remove focused node" },
  { label: "Ctrl+Z", description: "Undo" },
  { label: "Ctrl+Shift+Z", description: "Redo" },
  { label: "H", description: "History overlay" },
  { label: "?", description: "Toggle this panel" },
];

const sectionLabel: React.CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 6,
};

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 8,
  marginBottom: 4,
  fontSize: 13,
};

const key: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 4,
  color: "#94a3b8",
  fontSize: 11,
  padding: "1px 5px",
  minWidth: 28,
  textAlign: "center",
  flexShrink: 0,
};

const modeName: React.CSSProperties = {
  minWidth: 72,
  flexShrink: 0,
};

const desc: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 12,
};

const closeBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#64748b",
  cursor: "pointer",
  fontSize: 14,
  padding: "2px 4px",
  borderRadius: 4,
};
