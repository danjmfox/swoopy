import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas.tsx";
import { Toolbar } from "./Toolbar.tsx";
import { NodePopover } from "./NodePopover.tsx";
import { AnnotationPopover } from "./AnnotationPopover.tsx";
import { EdgeWeightPopover } from "./EdgeWeightPopover.tsx";
import { ConstraintChoiceDialog } from "./ConstraintChoiceDialog.tsx";
import { WelcomeOverlay } from "./WelcomeOverlay.tsx";
import { useStore } from "./store.ts";
import { HistoryLogger } from "./HistoryLogger.ts";
import { createHistorySubscriber } from "./historySubscriber.ts";
import { HistoryOverlay } from "./HistoryOverlay.tsx";

function shouldShowWelcome(): boolean {
  const params = new URLSearchParams(window.location.search);
  return (
    !params.has("g") &&
    !params.has("m") &&
    !localStorage.getItem("swoopy_current_model") &&
    !localStorage.getItem("swoopy_welcomed")
  );
}

export const historyLogger = new HistoryLogger(300);

export function App() {
  const loadFromUrl = useStore((s) => s.loadFromUrl);
  const loadPersistedGraph = useStore((s) => s.loadPersistedGraph);
  const [showWelcome, setShowWelcome] = useState(shouldShowWelcome);
  const loggerRef = useRef(historyLogger);

  useEffect(() => {
    const subscriber = createHistorySubscriber(loggerRef.current);
    const unsubscribe = useStore.subscribe(subscriber);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("g")) {
      loadFromUrl(window.location.search);
    } else {
      const m = params.get("m");
      if (m) {
        useStore.setState({ modelId: m });
      } else {
        const saved = localStorage.getItem("swoopy_current_model");
        if (saved) useStore.setState({ modelId: saved });
      }
      loadPersistedGraph();
      if (!m) {
        const { modelId } = useStore.getState();
        const search = new URLSearchParams(window.location.search);
        search.set("m", modelId);
        history.replaceState(null, "", `?${search.toString()}`);
      }
    }
  }, []);

  function dismissWelcome() {
    localStorage.setItem("swoopy_welcomed", "true");
    setShowWelcome(false);
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0f172a" }}>
      <Canvas />
      <Toolbar />
      <NodePopover />
      <AnnotationPopover />
      <EdgeWeightPopover />
      <ConstraintChoiceDialog />
      {showWelcome && <WelcomeOverlay onDismiss={dismissWelcome} />}
      <HistoryOverlay />
    </div>
  );
}
