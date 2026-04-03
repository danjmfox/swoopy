import { describe, it, expect, vi } from "vitest";
import {
  createHistorySubscriber,
  HISTORY_SAMPLE_INTERVAL_TICKS,
} from "./historySubscriber.ts";
import type { HistoryLogger } from "./HistoryLogger.ts";
import type { Graph, NodeId } from "@swoopy/engine";

function makeLogger(): HistoryLogger {
  return {
    record: vi.fn(),
    clear: vi.fn(),
    getHistory: vi.fn(),
    exportCSV: vi.fn(),
  } as unknown as HistoryLogger;
}

function makeState(
  tick: number,
  nodeValues: Map<NodeId, number>,
  graph: Graph,
  simRunning = true,
) {
  return {
    sim: {
      tick,
      nodeValues,
      signals: [],
      pending: [],
      displayPrevNodeValues: nodeValues,
    },
    graph,
    simRunning,
  };
}

const emptyGraph = {
  nodes: [],
  edges: [],
  annotations: [],
} as unknown as Graph;

describe("createHistorySubscriber", () => {
  it("does not call record on ticks that are not multiples of HISTORY_SAMPLE_INTERVAL_TICKS", () => {
    const logger = makeLogger();
    const subscriber = createHistorySubscriber(logger);
    const nodeValues = new Map([["node-1" as NodeId, 3.0]]);
    subscriber(makeState(1, nodeValues, emptyGraph));
    expect(logger.record).not.toHaveBeenCalled();
  });

  it("records all node values when tick is a multiple of HISTORY_SAMPLE_INTERVAL_TICKS", () => {
    const logger = makeLogger();
    const subscriber = createHistorySubscriber(logger);
    const nodeValues = new Map([
      ["node-1" as NodeId, 3.0],
      ["node-2" as NodeId, 7.5],
    ]);
    subscriber(
      makeState(HISTORY_SAMPLE_INTERVAL_TICKS, nodeValues, emptyGraph),
    );
    expect(logger.record).toHaveBeenCalledWith(
      "node-1",
      3.0,
      HISTORY_SAMPLE_INTERVAL_TICKS,
    );
    expect(logger.record).toHaveBeenCalledWith(
      "node-2",
      7.5,
      HISTORY_SAMPLE_INTERVAL_TICKS,
    );
  });

  it("calls clear when tick is 0", () => {
    const logger = makeLogger();
    const subscriber = createHistorySubscriber(logger);
    subscriber(makeState(0, new Map(), emptyGraph));
    expect(logger.clear).toHaveBeenCalledOnce();
  });

  it("does not record when simRunning is false, even at a sample boundary", () => {
    const logger = makeLogger();
    const subscriber = createHistorySubscriber(logger);
    const nodeValues = new Map([["node-1" as NodeId, 5.0]]);
    subscriber(
      makeState(HISTORY_SAMPLE_INTERVAL_TICKS, nodeValues, emptyGraph, false),
    );
    expect(logger.record).not.toHaveBeenCalled();
  });

  it("records a final snapshot when sim transitions from running to stopped", () => {
    const logger = makeLogger();
    const subscriber = createHistorySubscriber(logger);
    const nodeValues = new Map([["node-1" as NodeId, 4.2]]);
    subscriber(makeState(1, nodeValues, emptyGraph, true));
    subscriber(makeState(2, nodeValues, emptyGraph, false));
    expect(logger.record).toHaveBeenCalledWith("node-1", 4.2, 2);
  });

  it("does not record a second final snapshot if sim remains stopped", () => {
    const logger = makeLogger();
    const subscriber = createHistorySubscriber(logger);
    const nodeValues = new Map([["node-1" as NodeId, 4.2]]);
    subscriber(makeState(1, nodeValues, emptyGraph, true));
    subscriber(makeState(2, nodeValues, emptyGraph, false));
    (logger.record as ReturnType<typeof vi.fn>).mockClear();
    subscriber(makeState(2, nodeValues, emptyGraph, false));
    expect(logger.record).not.toHaveBeenCalled();
  });

  it("calls clear when graph reference changes", () => {
    const logger = makeLogger();
    const subscriber = createHistorySubscriber(logger);
    const graphA = {
      nodes: [],
      edges: [],
      annotations: [],
    } as unknown as Graph;
    const graphB = {
      nodes: [],
      edges: [],
      annotations: [],
    } as unknown as Graph;
    subscriber(makeState(HISTORY_SAMPLE_INTERVAL_TICKS, new Map(), graphA));
    (logger.clear as ReturnType<typeof vi.fn>).mockClear();
    subscriber(makeState(HISTORY_SAMPLE_INTERVAL_TICKS * 2, new Map(), graphB));
    expect(logger.clear).toHaveBeenCalledOnce();
  });
});
