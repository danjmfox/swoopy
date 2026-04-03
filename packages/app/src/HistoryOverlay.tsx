import { useStore } from "./store.ts";
import { historyLogger } from "./App.tsx";

export function HistoryOverlay() {
  const showHistory = useStore((s) => s.showHistory);
  const graph = useStore((s) => s.graph);

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
        ) : (
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
        )}
      </div>
    </div>
  );
}
