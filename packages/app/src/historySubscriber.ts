import type { Graph, NodeId } from "@swoopy/engine";
import type { HistoryLogger } from "./HistoryLogger.ts";

export const HISTORY_SAMPLE_INTERVAL_TICKS = 60;

type SubscriberState = {
  sim: {
    tick: number;
    nodeValues: Map<NodeId, number>;
  };
  graph: Graph;
  simRunning: boolean;
};

export function createHistorySubscriber(
  logger: HistoryLogger,
  onSample?: () => void,
): (state: SubscriberState) => void {
  let prevGraph: Graph | null = null;
  let prevSimRunning = false;
  let prevSim: SubscriberState["sim"] | null = null;
  return (state) => {
    // Skip re-fires caused by unrelated store updates (e.g. incrementHistorySeq).
    // Only process when sim, graph, or simRunning actually changed.
    if (
      state.sim === prevSim &&
      state.graph === prevGraph &&
      state.simRunning === prevSimRunning
    ) {
      return;
    }
    prevSim = state.sim;

    const { tick, nodeValues } = state.sim;
    const { simRunning } = state;
    let shouldNotify = false;

    if (tick === 0 || state.graph !== prevGraph) {
      logger.clear();
      prevGraph = state.graph;
      shouldNotify = true;
    }

    if (simRunning && tick > 0 && tick % HISTORY_SAMPLE_INTERVAL_TICKS === 0) {
      for (const [nodeId, value] of nodeValues) {
        logger.record(nodeId, value, tick);
      }
      shouldNotify = true;
    } else if (!simRunning && prevSimRunning) {
      for (const [nodeId, value] of nodeValues) {
        logger.record(nodeId, value, tick);
      }
      shouldNotify = true;
    }

    prevSimRunning = simRunning;
    if (shouldNotify) onSample?.();
  };
}
