import { useState } from "react";
import { useStore } from "./store.ts";
import { historyLogger } from "./App.tsx";
import { NODE_COLOURS, type Node } from "@swoopy/engine";

type ViewMode = "table" | "graph";

const SVG_W = 600;
const SVG_H = 260;
const PAD = { top: 10, right: 16, bottom: 30, left: 40 };

function HistoryGraph({
  nodes,
  histories,
}: {
  nodes: Node[];
  histories: { tick: number; value: number }[][];
}) {
  const innerW = SVG_W - PAD.left - PAD.right;
  const innerH = SVG_H - PAD.top - PAD.bottom;

  const allTicks = histories.flatMap((h) => h.map((s) => s.tick));
  const minTick = Math.min(...allTicks);
  const maxTick = Math.max(...allTicks);
  const tickRange = maxTick - minTick || 1;

  const toX = (tick: number) =>
    PAD.left + ((tick - minTick) / tickRange) * innerW;

  return (
    <svg
      width={SVG_W}
      height={SVG_H}
      style={{ display: "block", overflow: "visible" }}
    >
      {/* x-axis */}
      <line
        x1={PAD.left}
        y1={SVG_H - PAD.bottom}
        x2={SVG_W - PAD.right}
        y2={SVG_H - PAD.bottom}
        stroke="#475569"
        strokeWidth={1}
      />
      {/* x-axis tick labels */}
      {histories[0]?.map((s) => (
        <text
          key={s.tick}
          x={toX(s.tick)}
          y={SVG_H - PAD.bottom + 14}
          textAnchor="middle"
          fill="#64748b"
          fontSize={10}
        >
          {s.tick / 60}s
        </text>
      ))}
      {/* one path per node */}
      {nodes.map((node, ni) => {
        const history = histories[ni];
        if (history.length === 0) return null;
        const valueRange = node.max - node.min || 1;
        const toY = (value: number) =>
          PAD.top + innerH - ((value - node.min) / valueRange) * innerH;
        const d = history
          .map((s, i) => `${i === 0 ? "M" : "L"}${toX(s.tick)},${toY(s.value)}`)
          .join(" ");
        const colour = NODE_COLOURS[node.colourTier].swatch;
        return (
          <path
            key={node.id}
            d={d}
            fill="none"
            stroke={colour}
            strokeWidth={2}
          />
        );
      })}
    </svg>
  );
}

export function HistoryOverlay() {
  const showHistory = useStore((s) => s.showHistory);
  const graph = useStore((s) => s.graph);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  if (!showHistory) return null;

  const nodes = graph.nodes;
  const histories = nodes.map((n) => historyLogger.getHistory(n.id));
  const maxLen = Math.max(0, ...histories.map((h) => h.length));
  const ticks = histories[0]?.map((s) => s.tick) ?? [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
      }}
    >
      <div
        style={{
          background: "#1e293b",
          borderRadius: 8,
          padding: 24,
          maxWidth: "90vw",
          maxHeight: "80vh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#f1f5f9", fontWeight: 600 }}>History</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setViewMode("table")}
              style={{
                background: viewMode === "table" ? "#475569" : "#334155",
                color: "#f1f5f9",
                border: "none",
                borderRadius: 4,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("graph")}
              style={{
                background: viewMode === "graph" ? "#475569" : "#334155",
                color: "#f1f5f9",
                border: "none",
                borderRadius: 4,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              Graph
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                const csv = historyLogger.exportCSV(graph);
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "swoopy-history.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                background: "#334155",
                color: "#f1f5f9",
                border: "none",
                borderRadius: 4,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={() => useStore.getState().toggleHistory()}
              style={{
                background: "#334155",
                color: "#f1f5f9",
                border: "none",
                borderRadius: 4,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>
        {maxLen === 0 ? (
          <p style={{ color: "#94a3b8" }}>
            No data yet — run the simulation to record history.
          </p>
        ) : viewMode === "table" ? (
          <table
            style={{
              borderCollapse: "collapse",
              color: "#f1f5f9",
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: "4px 12px",
                    textAlign: "left",
                    color: "#94a3b8",
                  }}
                >
                  Node
                </th>
                {ticks.map((t) => (
                  <th
                    key={t}
                    style={{
                      padding: "4px 8px",
                      textAlign: "right",
                      color: "#94a3b8",
                    }}
                  >
                    {t / 60}s
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.map((node, ni) => (
                <tr key={node.id}>
                  <td style={{ padding: "4px 12px" }}>{node.label}</td>
                  {histories[ni].map((s, i) => (
                    <td
                      key={i}
                      style={{ padding: "4px 8px", textAlign: "right" }}
                    >
                      {s.value.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <HistoryGraph nodes={nodes} histories={histories} />
        )}
      </div>
    </div>
  );
}
