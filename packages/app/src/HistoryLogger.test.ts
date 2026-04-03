import { describe, it, expect } from "vitest";
import { HistoryLogger } from "./HistoryLogger.ts";
import type { Graph } from "@swoopy/engine";

describe("HistoryLogger", () => {
  it("returns an empty array for an unknown nodeId", () => {
    const logger = new HistoryLogger(300);
    expect(logger.getHistory("node-unknown")).toEqual([]);
  });

  it("returns a recorded sample after record() is called", () => {
    const logger = new HistoryLogger(300);
    logger.record("node-1", 7.5, 60);
    const history = logger.getHistory("node-1");
    expect(history).toHaveLength(1);
    expect(history[0]).toEqual({ tick: 60, value: 7.5 });
  });

  it("returns samples in chronological order when the buffer wraps", () => {
    const capacity = 3;
    const logger = new HistoryLogger(capacity);
    logger.record("node-1", 1, 10);
    logger.record("node-1", 2, 20);
    logger.record("node-1", 3, 30);
    // Buffer is now full: head wraps back to 0
    logger.record("node-1", 4, 40); // overwrites oldest (tick=10)
    const history = logger.getHistory("node-1");
    expect(history).toHaveLength(capacity);
    expect(history.map((s) => s.tick)).toEqual([20, 30, 40]);
    expect(history.map((s) => s.value)).toEqual([2, 3, 4]);
  });

  it("clear() resets all buffers so getHistory returns [] for previously recorded nodes", () => {
    const logger = new HistoryLogger(300);
    logger.record("node-1", 5, 60);
    logger.clear();
    expect(logger.getHistory("node-1")).toEqual([]);
  });

  it("exportCSV returns a CSV string with Tick header and one column per node label", () => {
    const logger = new HistoryLogger(300);
    logger.record("node-a", 3, 60);
    logger.record("node-b", 7, 60);
    const graph = {
      nodes: [
        { id: "node-a", label: "Stress" },
        { id: "node-b", label: "Resilience" },
      ],
      edges: [],
      annotations: [],
    } as unknown as Graph;
    const csv = logger.exportCSV(graph);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("Tick,Stress,Resilience");
    expect(lines[1]).toBe("60,3,7");
  });
});
