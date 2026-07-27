import { useEffect, useRef, useState } from "react";
import { LoopyRenderer, hitTest, screenToGraph } from "@swoopy/renderer";
import { inject, INJECT_STRENGTH } from "@swoopy/engine";
import { ANNOTATION_WIDTH, ANNOTATION_MIN_HEIGHT } from "@swoopy/renderer";
import { useStore } from "./store.ts";

// Movement-distance threshold (CSS px) discriminating a plain-drag pan from a
// stationary click, evaluated on pointermove (ADR-003).
const PAN_THRESHOLD_PX = 4;

interface CanvasProps {
  // Reports the mounted canvas element to the caller — lets sibling
  // components (e.g. Toolbar's Reset View control) read the canvas's live
  // rendered dimensions without a DOM query (canvas-pan-zoom-navigation).
  onMount?: (canvas: HTMLCanvasElement) => void;
}

export function Canvas({ onMount }: CanvasProps = {}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [outcomeWarning, setOutcomeWarning] = useState<string | null>(null);
  const modelTitle = useStore((s) => s.modelTitle);

  useEffect(() => {
    if (!ref.current) return;
    const canvas = ref.current;
    onMount?.(canvas);

    const renderer = new LoopyRenderer(canvas, useStore.getState);
    renderer.start();

    // Drag state machine
    let dragNodeId: import("@swoopy/engine").NodeId | null = null;
    let dragAnnotationId: import("@swoopy/engine").AnnotationId | null = null;
    let dragAnnotationOffset: { dx: number; dy: number } = { dx: 0, dy: 0 };
    let hasDragged = false; // true once pointermove fires after a pointerdown
    let constraintModifierHeld = false;
    let shiftHeld = false;

    // Pan-vs-click discrimination (ADR-003): a plain-drag on empty background
    // is recorded as a pending candidate on pointerdown — it stays a pending
    // mode background action (deselect/add-node/add-annotation) until either
    // pointerup commits it (no threshold-breaching movement occurred) or
    // pointermove reclassifies the gesture as a pan for its remaining
    // lifetime, discarding the pending action.
    interface BackgroundGesture {
      readonly startScreenX: number;
      readonly startScreenY: number;
      readonly startPanX: number;
      readonly startPanY: number;
      readonly pendingMode: import("./store.ts").AppMode;
      isPanning: boolean;
    }
    let backgroundGesture: BackgroundGesture | null = null;

    function screenPoint(e: { clientX: number; clientY: number }): {
      x: number;
      y: number;
    } {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function graphPoint(screen: { x: number; y: number }): {
      x: number;
      y: number;
    } {
      return screenToGraph(useStore.getState().viewport, screen.x, screen.y);
    }

    function commitBackgroundGesture(gesture: BackgroundGesture): void {
      const { x, y } = graphPoint({
        x: gesture.startScreenX,
        y: gesture.startScreenY,
      });
      if (gesture.pendingMode === "select") {
        useStore.getState().setFocusedNode(null);
      } else if (gesture.pendingMode === "add-node") {
        useStore.getState().addNode(x, y);
      } else if (gesture.pendingMode === "add-annotation") {
        const { addAnnotation, openAnnotationEditor } = useStore.getState();
        const id = addAnnotation(
          x - ANNOTATION_WIDTH / 2,
          y - ANNOTATION_MIN_HEIGHT / 2,
        );
        openAnnotationEditor(id);
      }
      // add-edge / delete / simulate: no background action to commit (no-op)
    }

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
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.altKey) {
        const active = document.activeElement;
        const isTextEditing =
          active instanceof HTMLTextAreaElement ||
          (active instanceof HTMLInputElement &&
            ["text", "number", "search", "email", "password", "url"].includes(
              active.type,
            ));
        if (!isTextEditing) {
          e.preventDefault();
          if (e.shiftKey) useStore.getState().redo();
          else useStore.getState().undo();
        }
        return;
      }
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
        pendingModulatorTarget,
        cancelModulator,
      } = useStore.getState();
      if (e.key === "Escape") {
        e.preventDefault();
        if (pendingModulatorTarget) {
          cancelModulator();
        } else if (previousMode !== null) {
          exitSpringMode();
        } else {
          useStore.setState({ mode: "select", previousMode: null });
        }
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
      if (e.key === "a") {
        e.preventDefault();
        setMode("add-annotation");
        return;
      }
      if (e.key === "h") {
        e.preventDefault();
        useStore.getState().toggleHistory();
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
      const screen = screenPoint(e);
      const { x, y } = graphPoint(screen);
      const {
        graph,
        mode,
        previousMode,
        addNode,
        deleteNode,
        enterSpringMode,
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

      // ADR-003: plain left-drag on empty background pans in every mode.
      // Record a pending candidate here — committed as the mode's background
      // action on pointerup if no threshold-breaching movement occurred, or
      // reclassified as a pan for the gesture's remaining lifetime in
      // onPointerMove. Gated by !shiftHeld so spring-loading above is
      // unaffected.
      if (!hit && !shiftHeld) {
        const { viewport } = useStore.getState();
        backgroundGesture = {
          startScreenX: screen.x,
          startScreenY: screen.y,
          startPanX: viewport.panX,
          startPanY: viewport.panY,
          pendingMode: mode,
          isPanning: false,
        };
        return;
      }

      if (mode === "add-annotation") {
        const { addAnnotation, openAnnotationEditor } = useStore.getState();
        const id = addAnnotation(
          x - ANNOTATION_WIDTH / 2,
          y - ANNOTATION_MIN_HEIGHT / 2,
        );
        openAnnotationEditor(id);
      } else if (mode === "add-node") {
        if (!hit) addNode(x, y);
      } else if (mode === "simulate") {
        if (hit?.kind === "node") {
          const nodeId = hit.id;
          const { graph } = useStore.getState();
          const node = graph.nodes.find((n) => n.id === nodeId);
          if (node?.role === "outcome") {
            setOutcomeWarning(node.label);
            setTimeout(() => setOutcomeWarning(null), 4000);
          }
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
        else if (hit?.kind === "annotation") {
          useStore.getState().deleteAnnotation(hit.id);
        } else if (
          hit?.kind === "edge-polarity" ||
          hit?.kind === "edge-delay" ||
          hit?.kind === "edge-weight" ||
          hit?.kind === "edge-constraint"
        ) {
          useStore.getState().deleteEdge(hit.edgeId);
        } else if (hit?.kind === "modulator") {
          useStore.getState().deleteModulator(hit.id);
        }
      } else {
        // select / add-edge — track drag source; select mode also sets keyboard focus
        if (hit?.kind === "annotation" && mode === "select") {
          const ann = useStore
            .getState()
            .graph.annotations.find((a) => a.id === hit.id);
          if (ann) {
            dragAnnotationId = hit.id;
            dragAnnotationOffset = { dx: x - ann.x, dy: y - ann.y };
            hasDragged = false;
          }
        } else if (hit?.kind === "node") {
          dragNodeId = hit.id;
          hasDragged = false;
          if (mode === "select") useStore.getState().setFocusedNode(hit.id);
        } else if (
          mode === "add-edge" &&
          (hit?.kind === "edge-polarity" ||
            hit?.kind === "edge-delay" ||
            hit?.kind === "edge-weight")
        ) {
          useStore.getState().setPendingModulatorTarget(hit.edgeId);
        } else if (mode === "select") {
          useStore.getState().setFocusedNode(null);
        }
      }
    }

    function onPointerMove(e: PointerEvent) {
      const screen = screenPoint(e);

      if (backgroundGesture) {
        const gesture = backgroundGesture;
        const dx = screen.x - gesture.startScreenX;
        const dy = screen.y - gesture.startScreenY;
        if (!gesture.isPanning && Math.hypot(dx, dy) >= PAN_THRESHOLD_PX) {
          gesture.isPanning = true;
        }
        if (gesture.isPanning) {
          useStore
            .getState()
            .setViewportPan(gesture.startPanX + dx, gesture.startPanY + dy);
        }
        return;
      }

      const { x, y } = graphPoint(screen);
      if (dragAnnotationId !== null) {
        hasDragged = true;
        useStore
          .getState()
          .setAnnotationDragPosition(
            dragAnnotationId,
            x - dragAnnotationOffset.dx,
            y - dragAnnotationOffset.dy,
          );
        return;
      }
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
      if (backgroundGesture) {
        const gesture = backgroundGesture;
        backgroundGesture = null;
        if (!gesture.isPanning) commitBackgroundGesture(gesture);
        return;
      }
      if (dragAnnotationId !== null) {
        const { annotationDragPosition, moveAnnotation } = useStore.getState();
        if (annotationDragPosition && hasDragged) {
          moveAnnotation(
            dragAnnotationId,
            annotationDragPosition.x,
            annotationDragPosition.y,
          );
        } else {
          useStore.setState({ annotationDragPosition: null });
        }
        dragAnnotationId = null;
        return;
      }
      if (dragNodeId === null) return;
      const { x, y } = graphPoint(screenPoint(e));
      const {
        graph,
        mode,
        previousMode,
        addEdge,
        setPendingConstraintEdge,
        confirmModulator,
        pendingModulatorTarget,
        moveNode,
        exitSpringMode,
      } = useStore.getState();
      const releaseHit = hitTest(graph, x, y);
      const releasedOnDifferentNode =
        releaseHit?.kind === "node" && releaseHit.id !== dragNodeId;

      // Confirm pending modulator: any node click while a target edge is pending
      if (pendingModulatorTarget && releaseHit?.kind === "node") {
        confirmModulator(releaseHit.id, constraintModifierHeld ? -1 : 1);
        useStore.setState({ dragPosition: null });
        dragNodeId = null;
        return;
      }

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

    // Wheel/trackpad-pinch zoom centered on cursor (US-02). Browsers deliver
    // trackpad pinch gestures as wheel events with ctrlKey:true — no
    // separate gesture path is needed, both route through zoomAt.
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const screen = screenPoint(e);
      useStore.getState().zoomAt(screen.x, screen.y, e.deltaY);
    }

    function onDblClick(e: MouseEvent) {
      const { x, y } = graphPoint(screenPoint(e));
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
      else if (hit?.kind === "annotation")
        useStore.getState().openAnnotationEditor(hit.id);
      else if (hit?.kind === "edge-polarity") togglePolarity(hit.edgeId);
      else if (hit?.kind === "edge-delay") cycleDelay(hit.edgeId);
      else if (hit?.kind === "edge-weight") openEdgeWeightEditor(hit.edgeId);
      else if (hit?.kind === "modulator")
        useStore.getState().toggleModulatorPolarity(hit.id);
    }

    const NUDGE_PX = 8;

    function onKeyDown(e: KeyboardEvent) {
      const { focusedNodeId, focusNextNode, nudgeNode, deleteNode } =
        useStore.getState();
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
    canvas.addEventListener("wheel", onWheel, { passive: false });
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
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keydown", onDocKeyDown);
      document.removeEventListener("keyup", onDocKeyUp);
    };
  }, []);

  return (
    <>
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
      <div
        data-testid="model-title-overlay"
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          color: "#475569",
          fontSize: 13,
          fontStyle: "italic",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {modelTitle}
      </div>
      {outcomeWarning && (
        <div
          data-testid="outcome-warning"
          style={{
            position: "fixed",
            bottom: 80,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1e293b",
            border: "1px solid #f59e0b",
            borderRadius: 8,
            padding: "10px 18px",
            color: "#fbbf24",
            fontSize: 13,
            zIndex: 200,
            pointerEvents: "none",
          }}
        >
          {outcomeWarning} is a system outcome. To change it, act on its causes.
        </div>
      )}
    </>
  );
}
