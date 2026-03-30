import { useState, useEffect } from "react";
import { useStore } from "./store.ts";
import type { AppMode } from "./store.ts";
import { HelpModal } from "./HelpModal.tsx";

const SPEEDS = [0.25, 0.5, 1, 2, 4];

const MODES: {
  mode: AppMode;
  label: string;
  title: string;
  shortcut: string;
}[] = [
  { mode: "select", label: "↖", title: "Select", shortcut: "S" },
  { mode: "add-node", label: "⬤", title: "Add Node", shortcut: "N" },
  { mode: "add-edge", label: "→", title: "Add Edge", shortcut: "E" },
  { mode: "simulate", label: "▷", title: "Simulate", shortcut: "R" },
  { mode: "delete", label: "✕", title: "Delete", shortcut: "D" },
];

export function Toolbar() {
  const simRunning = useStore((s) => s.simRunning);
  const simSpeed = useStore((s) => s.simSpeed);
  const mode = useStore((s) => s.mode);
  const { pauseSim, resumeSim, resetSim, setSimSpeed, setMode } =
    useStore.getState();
  const [helpOpen, setHelpOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "?" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setHelpOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  async function handleShare() {
    await useStore.getState().shareGraph();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          display: "flex",
          gap: 8,
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 10,
          padding: "6px 12px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        <button
          title="New Model"
          onClick={() => useStore.getState().newModel()}
          style={btn}
        >
          + New
        </button>
        <button title="Share" onClick={handleShare} style={btn}>
          {copied ? "Copied!" : "Share"}
        </button>
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 10,
          padding: "8px 14px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        {MODES.map(({ mode: m, label, title, shortcut }) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            title={title}
            style={{
              ...btn,
              background: mode === m ? "#334155" : "transparent",
              fontWeight: mode === m ? 700 : 400,
            }}
          >
            {label} {shortcut}
          </button>
        ))}

        {mode === "simulate" && (
          <>
            <div
              style={{
                width: 1,
                height: 20,
                background: "#334155",
                margin: "0 4px",
              }}
            />

            <button
              onClick={() => (simRunning ? pauseSim() : resumeSim())}
              title={simRunning ? "Pause" : "Resume"}
              style={btn}
            >
              {simRunning ? "⏸" : "▶"}
            </button>

            <button onClick={() => resetSim()} title="Reset" style={btn}>
              ↺
            </button>

            <div
              style={{
                width: 1,
                height: 20,
                background: "#334155",
                margin: "0 4px",
              }}
            />

            <span style={{ color: "#94a3b8", fontSize: 12 }}>Speed</span>
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                title={`${s}×`}
                style={{
                  ...btn,
                  background: simSpeed === s ? "#334155" : "transparent",
                  fontWeight: simSpeed === s ? 700 : 400,
                }}
              >
                {s}×
              </button>
            ))}
          </>
        )}

        <div
          style={{
            width: 1,
            height: 20,
            background: "#334155",
            margin: "0 4px",
          }}
        />
        <button title="Help" onClick={() => setHelpOpen((o) => !o)} style={btn}>
          ?
        </button>
      </div>
    </>
  );
}

const btn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#f1f5f9",
  cursor: "pointer",
  fontSize: 15,
  padding: "4px 8px",
  borderRadius: 6,
};
