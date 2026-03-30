import { useEffect } from "react";

interface WelcomeOverlayProps {
  onDismiss: () => void;
}

export function WelcomeOverlay({ onDismiss }: WelcomeOverlayProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onDismiss]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Swoopy"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 10,
        padding: "28px 32px",
        zIndex: 300,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        color: "#f1f5f9",
        minWidth: 320,
        maxWidth: 420,
      }}
    >
      <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
        A canvas for systems thinking.
      </p>
      <ul
        style={{
          margin: "0 0 20px",
          paddingLeft: 18,
          color: "#94a3b8",
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        <li>
          Add <strong style={{ color: "#f1f5f9" }}>nodes</strong> — stocks,
          concepts, variables
        </li>
        <li>
          Connect them with <strong style={{ color: "#f1f5f9" }}>edges</strong>{" "}
          — causal links with polarity and weight
        </li>
        <li>
          <strong style={{ color: "#f1f5f9" }}>Simulate</strong> — inject
          signals and watch them propagate
        </li>
      </ul>
      <button
        onClick={onDismiss}
        style={{
          background: "#3b82f6",
          border: "none",
          borderRadius: 6,
          color: "#fff",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          padding: "9px 20px",
          width: "100%",
        }}
      >
        Start building
      </button>
    </div>
  );
}
