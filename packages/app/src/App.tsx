import { useEffect } from "react";
import { Canvas } from "./Canvas.tsx";
import { Toolbar } from "./Toolbar.tsx";
import { NodePopover } from "./NodePopover.tsx";
import { EdgeWeightPopover } from "./EdgeWeightPopover.tsx";
import { ConstraintChoiceDialog } from "./ConstraintChoiceDialog.tsx";
import { useStore } from "./store.ts";

export function App() {
  const loadFromUrl = useStore((s) => s.loadFromUrl);
  const loadPersistedGraph = useStore((s) => s.loadPersistedGraph);

  useEffect(() => {
    if (window.location.search.includes("g=")) {
      loadFromUrl(window.location.search);
    } else {
      loadPersistedGraph();
    }
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0f172a" }}>
      <Canvas />
      <Toolbar />
      <NodePopover />
      <EdgeWeightPopover />
      <ConstraintChoiceDialog />
    </div>
  );
}
