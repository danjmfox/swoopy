import type { Graph } from "@swoopy/engine";

type NodeBuffer = {
  values: Float32Array;
  ticks: Float32Array;
  head: number;
  count: number;
};

export class HistoryLogger {
  private readonly capacity: number;
  private readonly buffers = new Map<string, NodeBuffer>();

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  record(nodeId: string, value: number, tick: number): void {
    let buf = this.buffers.get(nodeId);
    if (buf === undefined) {
      buf = {
        values: new Float32Array(this.capacity),
        ticks: new Float32Array(this.capacity),
        head: 0,
        count: 0,
      };
      this.buffers.set(nodeId, buf);
    }
    buf.values[buf.head] = value;
    buf.ticks[buf.head] = tick;
    buf.head = (buf.head + 1) % this.capacity;
    if (buf.count < this.capacity) buf.count++;
  }

  clear(): void {
    this.buffers.clear();
  }

  exportCSV(graph: Graph): string {
    const nodes = graph.nodes;
    const header = ["Tick", ...nodes.map((n) => n.label)].join(",");
    const histories = nodes.map((n) => this.getHistory(n.id));
    const maxLen = Math.max(0, ...histories.map((h) => h.length));
    const rows: string[] = [];
    for (let i = 0; i < maxLen; i++) {
      const tick = histories.find((h) => h[i] !== undefined)?.[i].tick ?? "";
      const values = nodes.map((_, ni) => histories[ni][i]?.value ?? "");
      rows.push([tick, ...values].join(","));
    }
    return [header, ...rows].join("\n") + "\n";
  }

  getHistory(nodeId: string): { tick: number; value: number }[] {
    const buf = this.buffers.get(nodeId);
    if (buf === undefined) return [];
    const { values, ticks, head, count } = buf;
    const result: { tick: number; value: number }[] = [];
    if (count < this.capacity) {
      for (let i = 0; i < count; i++) {
        result.push({ tick: ticks[i], value: values[i] });
      }
    } else {
      for (let i = 0; i < this.capacity; i++) {
        const idx = (head + i) % this.capacity;
        result.push({ tick: ticks[idx], value: values[idx] });
      }
    }
    return result;
  }
}
