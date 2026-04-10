---
id: DR--20260327--engine--simstate-prev-node-values
dateCreated: "2026-03-27"
version: 1.0.0
status: accepted
changeType: creation
domain: engine
slug: simstate-prev-node-values
changelog:
  - date: "2026-03-27"
    note: Initial creation — captured at implementation time
  - date: "2026-03-28"
    note: Accepted — prevNodeValues pattern validated across all engine tests
lastEdited: "2026-03-28"
---

# SimState carries prevNodeValues for cross-step delta detection

## 🧭 Context

`step()` must emit signals on outgoing edges when `|delta| >= EMIT_THRESHOLD` (PRD §5.2:
"signal emission must detect deltas across the full step, including direct injections,
not only signal arrivals").

`inject()` is called between steps — it updates `nodeValues` outside of `step()`. When
`step()` runs next, it sees the post-inject value as its start. The within-step change
from decay alone (~0.005 per frame at DECAY=0.28, dt=1/60) is far below `EMIT_THRESHOLD`
(0.06), so without a baseline, `step()` cannot detect the inject delta and no signals
are ever emitted from a user click.

## ⚖️ Options Considered

| Option | Description                                                         | Outcome  | Rationale                                                                                     |
| ------ | ------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| A      | Compare against `node.initial`                                      | Rejected | Fires continuously once a node settles above initial — emits signals every frame indefinitely |
| B      | `inject()` creates explicit pending signals (requires graph access) | Rejected | Couples a value-level operation to graph structure; changes `inject()` signature              |
| C      | Add `prevNodeValues` to `SimState`, set by `step()` each tick       | Chosen   | `inject()` stays trivial; `step()` remains pure; delta comparison is in one place             |

## 🧠 Decision

Add `prevNodeValues: ReadonlyMap<NodeId, number>` to `SimState`. `step()` sets it to
the end-of-step `nodeValues` before returning. `inject()` updates `nodeValues` only.
The next `step()` compares end-of-step values against `prevNodeValues` — making inject
deltas visible for emission without coupling `inject()` to the graph.

## 🪶 Principles

- **Stewardship:** Option B couples inject to graph structure — harder to delete or
  transfer in isolation. Option C keeps each function single-responsibility.
- **Justice:** The root problem is state tracking, not inject design. Solving it at the
  state level (SimState) rather than at the function signature level is the right
  boundary.
- **Impeccability:** `step()` remains a pure function (same inputs → same outputs).
  All state transitions flow through `step()`.

## 🔁 Lifecycle

Status: `new` → advance to `draft` once reviewed.

## 🧩 Reasoning

The PRD note on `inject()` — _"clamping is applied by the next step() call, not here —
this preserves the delta signal that step() needs to detect"_ — implies step() must have
a pre-inject baseline. `prevNodeValues` is that baseline. The extra Map is a small,
bounded cost: same key set as `nodeValues`, updated once per tick.

Option A produces incorrect simulation behaviour. Option B introduces hidden coupling
(inject needing graph knowledge to locate outgoing edges). Option C is the only choice
that is both correct and architecturally clean.

## 🔄 Next Actions

- Advance to `proposed` after review
- Revisit if v2 trend overlay (SI-12) introduces a history buffer — `prevNodeValues`
  could then be derived from that buffer rather than stored separately

## 🧠 Confidence

High. The decision is driven by a concrete correctness requirement, all alternatives
were tested against the canonical integration suite, and the chosen approach is the
minimum change needed.

## 🧾 Changelog

| Date       | Note                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| 2026-03-27 | Initial draft — captured at implementation time (feat/step-3-engine-step) |
