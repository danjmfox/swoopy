import { useEffect, useRef } from "react";
import { LoopyRenderer, hitTest } from "@swoopy/renderer";
import { inject, INJECT_STRENGTH } from "@swoopy/engine";
import { useStore } from "./store.ts";

export function Canvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const renderer = new LoopyRenderer(canvas, useStore.getState);
    renderer.start();

    // Drag state machine
    let dragNodeId: import("@swoopy/engine").NodeId | null = null;
    let hasDragged = false; // true once pointermove fires after a pointerdown
    let constraintModifierHeld = false;
    let shiftHeld = false;

    // Hold-to-inject: fires every HOLD_INTERVAL_MS while pointer is held on a node in simulate mode
    const HOLD_INTERVAL_MS = 100;
    let holdInterval: ReturnType<typeof setInterval> | null = null;
    function clearHold() {
      if (holdInterval !== null) {
        clearInterval(holdInterval);
        holdInterval = null;
      }
      if (dragNodeId !== null) useStore.setState({ dragPosition: null });
    }

    // Track modifier key state via document — jsdom doesn't propagate altKey/shiftKey via PointerEvent init
    // Mode shortcuts (S/N/E/R/D) also live here so they fire regardless of canvas focus
    function onDocKeyDown(e: KeyboardEvent) {
      if (e.key === "Alt") constraintModifierHeld = true;
      if (e.key === "Shift") shiftHeld = true;
      if (e.ctrlKey || e.metaKey) return;
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement
      )
        return;
      const {
        setMode,
        previousMode,
        exitSpringMode,
        simRunning,
        pauseSim,
        resumeSim,
      } = useStore.getState();
      if (e.key === "Escape") {
        e.preventDefault();
        if (previousMode !== null) exitSpringMode();
        else useStore.setState({ mode: "select", previousMode: null });
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        const { mode: currentMode } = useStore.getState();
        if (currentMode !== "simulate")
          useStore.setState({ mode: "simulate", previousMode: null });
        if (simRunning) pauseSim();
        else resumeSim();
        return;
      }
      if (e.key === "s") {
        e.preventDefault();
        setMode("select");
        return;
      }
      if (e.key === "n") {
        e.preventDefault();
        setMode("add-node");
        return;
      }
      if (e.key === "e") {
        e.preventDefault();
        setMode("add-edge");
        return;
      }
      if (e.key === "r") {
        e.preventDefault();
        setMode("simulate");
        return;
      }
      if (e.key === "d") {
        e.preventDefault();
        setMode("delete");
        return;
      }
    }
    function onDocKeyUp(e: KeyboardEvent) {
      if (e.key === "Alt") constraintModifierHeld = false;
      if (e.key === "Shift") {
        shiftHeld = false;
        const { previousMode, exitSpringMode } = useStore.getState();
        if (previousMode !== null) exitSpringMode();
      }
    }
    document.addEventListener("keydown", onDocKeyDown);
    document.addEventListener("keyup", onDocKeyUp);

    // Pointer events → hit test → mode-gated dispatch (GE-01/04/09, SI-02/03, GE-03/20/23)
    // Operates in CSS pixels; no DPR scaling needed (docs/decisions/DR--20260327--renderer--dpr-css-pixel-geometry.md)
    function onPointerDown(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const {
        graph,
        mode,
        previousMode,
        addNode,
        deleteNode,
        enterSpringMode,
        exitSpringMode,
      } = useStore.getState();
      const hit = hitTest(graph, x, y);

      // Spring-loading: Shift held, not already in a spring, not in simulate mode
      if (shiftHeld && previousMode === null && mode !== "simulate") {
        if (hit?.kind === "node") {
          enterSpringMode("add-edge");
          dragNodeId = hit.id;
          hasDragged = false;
          return;
        }
        if (!hit) {
          addNode(x, y); // create node immediately on Shift+blank
          return;
        }
      }

      if (mode === "add-node") {
        if (!hit) addNode(x, y);
      } else if (mode === "simulate") {
        if (hit?.kind === "node") {
          const nodeId = hit.id;
          const doInject = () => {
            const strength = shiftHeld ? -INJECT_STRENGTH : INJECT_STRENGTH;
            useStore.setState((s) => ({
              sim: inject(s.sim, s.graph, nodeId, strength),
            }));
          };
          doInject();
          holdInterval = setInterval(doInject, HOLD_INTERVAL_MS);
        }
      } else if (mode === "delete") {
        if (hit?.kind === "node") deleteNode(hit.id);
        else if (
          hit?.kind === "edge-polarity" ||
          hit?.kind === "edge-delay" ||
          hit?.kind === "edge-weight"
        ) {
          useStore.getState().deleteEdge(hit.edgeId);
        }
      } else {
        // select / add-edge — track drag source; select mode also sets keyboard focus
        if (hit?.kind === "node") {
          dragNodeId = hit.id;
          hasDragged = false;
          if (mode === "select") useStore.getState().setFocusedNode(hit.id);
        } else if (mode === "select") {
          useStore.getState().setFocusedNode(null);
        }
      }
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (dragNodeId !== null) {
        hasDragged = true;
        const { mode, setDragPosition } = useStore.getState();
        if (mode === "select") setDragPosition(dragNodeId, x, y);
        return;
      }
      const { mode, graph, setHoveredEdgeRegion } = useStore.getState();
      if (mode !== "select") return;
      const hit = hitTest(graph, x, y);
      if (hit?.kind === "edge-delay")
        setHoveredEdgeRegion({ edgeId: hit.edgeId, region: "delay" });
      else if (hit?.kind === "edge-weight")
        setHoveredEdgeRegion({ edgeId: hit.edgeId, region: "weight" });
      else setHoveredEdgeRegion(null);
    }

    function onPointerUp(e: PointerEvent) {
      clearHold();
      if (dragNodeId === null) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const {
        graph,
        mode,
        previousMode,
        addEdge,
        setPendingConstraintEdge,
        moveNode,
        setDragPosition,
        exitSpringMode,
      } = useStore.getState();
      const releaseHit = hitTest(graph, x, y);
      const releasedOnDifferentNode =
        releaseHit?.kind === "node" && releaseHit.id !== dragNodeId;

      if (releasedOnDifferentNode && (constraintModifierHeld || e.altKey)) {
        setPendingConstraintEdge(
          dragNodeId,
          releaseHit!.id as import("@swoopy/engine").NodeId,
        );
        useStore.setState({ dragPosition: null });
        if (previousMode !== null) exitSpringMode();
      } else if (mode === "add-edge" && releasedOnDifferentNode) {
        addEdge(dragNodeId, releaseHit!.id as import("@swoopy/engine").NodeId);
        useStore.setState({ dragPosition: null });
        if (previousMode !== null) exitSpringMode();
      } else {
        if (hasDragged) {
          moveNode(dragNodeId, x, y); // clears dragPosition in store
        } else {
          useStore.setState({ dragPosition: null }); // click — no reposition
        }
        if (previousMode !== null) exitSpringMode(); // cancel spring if no valid target
      }
      dragNodeId = null;
    }

    function onDblClick(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const {
        graph,
        mode,
        togglePolarity,
        cycleDelay,
        openNodeEditor,
        openEdgeWeightEditor,
      } = useStore.getState();
      const hit = hitTest(graph, x, y);
      if (hit?.kind === "node" && mode !== "simulate") openNodeEditor(hit.id);
      else if (hit?.kind === "edge-polarity") togglePolarity(hit.edgeId);
      else if (hit?.kind === "edge-delay") cycleDelay(hit.edgeId);
      else if (hit?.kind === "edge-weight") openEdgeWeightEditor(hit.edgeId);
    }

    const NUDGE_PX = 8;

    function onKeyDown(e: KeyboardEvent) {
      const {
        focusedNodeId,
        focusNextNode,
        nudgeNode,
        deleteNode,
        undo,
        redo,
      } = useStore.getState();
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        focusNextNode();
        return;
      }
      if (focusedNodeId === null) return;
      if (e.key === "Enter") {
        useStore.getState().openNodeEditor(focusedNodeId);
        return;
      }
      if (e.key === "ArrowRight") nudgeNode(focusedNodeId, NUDGE_PX, 0);
      else if (e.key === "ArrowLeft") nudgeNode(focusedNodeId, -NUDGE_PX, 0);
      else if (e.key === "ArrowDown") nudgeNode(focusedNodeId, 0, NUDGE_PX);
      else if (e.key === "ArrowUp") nudgeNode(focusedNodeId, 0, -NUDGE_PX);
      else if (e.key === "Delete" || e.key === "Backspace")
        deleteNode(focusedNodeId);
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    function onPointerLeave() {
      clearHold();
      useStore.getState().setHoveredEdgeRegion(null);
    }
    canvas.addEventListener("pointercancel", clearHold);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("dblclick", onDblClick);
    canvas.addEventListener("keydown", onKeyDown);
    return () => {
      renderer.stop();
      clearHold();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", clearHold);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("dblclick", onDblClick);
      canvas.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keydown", onDocKeyDown);
      document.removeEventListener("keyup", onDocKeyUp);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      tabIndex={0}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        cursor: "crosshair",
        outline: "none",
      }}
    />
  );
}
