# Story: GE-38 — Simulation History Logger and Data Table

1. Summary
   A HistoryLogger observes the simulation state and records node values over time.
   The data is presented in a live overlay — a table of node rows × time columns —
   accessible from the Toolbar and a keyboard shortcut, and documented in the Help modal.
   The overlay includes a "Download CSV" button for external analysis.

   Sparklines are out of scope for this story.

2. User Value
   Facilitators running a causal loop model need to see how node values change over
   time — oscillations in balancing loops, the buildup of delayed effects — not just
   the current snapshot. The table lets them observe dynamics live and export the data
   for deeper analysis in external tools.

3. Technical Design

   3.1 HistoryLogger
   A standalone class in packages/app/src/HistoryLogger.ts.
   - Uses Float32Array ring buffers — one per node, fixed capacity (e.g. 300 samples).
   - record(nodeId, value, tick): writes into the buffer at the current head; head wraps.
   - getHistory(nodeId): returns a correctly-ordered array of { tick, value } samples.
   - clear(): resets all buffers (called on resetSim).
   - exportCSV(graph): returns a CSV string with headers Tick, Node A, Node B, ...

   Zero object allocations per record() call.

   3.2 Integration
   The logger is instantiated once in App.tsx and kept in a React ref.
   It subscribes to sim state via useStore.subscribe, which fires on every tickSim call.
   The subscribe handler samples at a reduced rate — approximately once per second of
   sim time (not once per tick) — to keep the table readable and the buffer meaningful.
   The exact sampling interval should be a named constant (e.g. HISTORY_SAMPLE_INTERVAL_TICKS).

   resetSim in store.ts is extended to also call logger.clear() via a callback or ref
   passed through App.

   3.3 Overlay
   A new HistoryOverlay component, shown when a "History" toggle is active in store.
   - Keyboard shortcut: H
   - Toolbar button: 📊 H, placed before 💬 A
   - Listed in HelpModal
   - The overlay is a scrollable table:
     rows = nodes (identified by label)
     columns = sampled time points (formatted as elapsed sim seconds, not raw ticks)
   - A "Download CSV" button triggers exportCSV and initiates a browser file download.
   - Closing: H key or a close button.

4. Acceptance Criteria
   [ ] sim.ts is not modified.
   [ ] record() performs zero object allocations per call.
   [ ] Sampling is per sim-second (or configurable interval), not per tick.
   [ ] Overlay renders a table: node labels as rows, time points as columns.
   [ ] Table updates live while simulation is running.
   [ ] "Download CSV" produces a file with headers: Tick, Node A Label, Node B Label, ...
   [ ] resetSim clears the logger buffers.
   [ ] H key toggles the overlay.
   [ ] 📊 H toolbar button toggles the overlay (placed before 💬 A).
   [ ] HelpModal documents H as "History overlay".

5. Open Questions (validate before implementation)
   Q1: useStore.subscribe fires on every set() — confirm it fires every tickSim tick
   and that sampling logic belongs inside the subscribe handler, not in store.ts.
   Q2: How does resetSim reach the logger? Options:
   (a) App passes a clearLogger callback into the store's resetSim action.
   (b) subscribe handler detects sim.tick === 0 and calls logger.clear().
   Option (b) is simpler — no store API change needed.
   Q3: "Sim seconds" column headers: derive from tick count and a fixed SIM_TICK_RATE
   constant, or track wall-clock time? Recommend tick-based — deterministic and
   independent of frame rate.
   Q4: What happens to the history when the graph changes (node added/removed)?
   Simplest: clear all buffers on any graph mutation (already covered by subscribe
   detecting graph identity change).
