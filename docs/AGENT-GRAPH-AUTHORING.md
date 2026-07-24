# Agent Graph Authoring

This is a reference for an agent authoring a Swoopy causal-loop graph directly
as JSON, encoding it into a shareable URL, and iterating without touching a
browser or dev server.

## Why this exists

An agent (or a human scripting one) can build a Swoopy model as plain JSON,
turn it into a `g=` share URL with a Node script, and hand that URL to a human
to open. No dev server, no UI interaction required.

## Graph shape

A graph is:

```
Graph = {
  nodes: Node[],
  edges: (CausalEdge | ConstraintEdge)[],
  annotations: Annotation[],
  modulators: Modulator[],
}
```

`nodes`, `edges`, `annotations`, and `modulators` are all required top-level
keys (though `annotations` and `modulators` may be empty arrays).

### Node

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique node identifier. Any string works — a short literal (`"n1"`) or `crypto.randomUUID()`. Referenced by edges' `from`/`to`. |
| `label` | string | Human-readable name shown on the diagram. |
| `x`, `y` | number | Canvas position. |
| `radius` | number | Draw radius in pixels. |
| `sizeTier` | number | Visual size tier (relative importance). |
| `colourTier` | number | Visual colour tier (grouping/category). |
| `min`, `max` | number | Bounds of the node's value range. |
| `initial` | number | Starting value within `[min, max]`. |
| `role` | string (optional) | Semantic role, when the node plays a distinguished part in the model (e.g. a stock vs. a driver). |
| `annotation` | string (optional) | Free-text note attached directly to the node. |

All ten required fields (`id`, `label`, `x`, `y`, `radius`, `sizeTier`,
`colourTier`, `min`, `max`, `initial`) must be present or the encode script
rejects the graph with a `nodes[i] missing required field(s): ...` error.

### CausalEdge

| Field | Type | Description |
|---|---|---|
| `kind` | `"causal"` | Discriminates this edge from a `ConstraintEdge`. |
| `id` | string | Unique edge identifier. Referenced by modulators' `target`. |
| `from`, `to` | string | Node ids this edge connects. Both must exist in `nodes`. |
| `polarity` | `1 \| -1` | Whether the effect is reinforcing (`1`) or balancing (`-1`). |
| `weight` | number, `0`-`5` | Strength of the causal influence. |
| `delay` | `"none" \| "short" \| "medium" \| "long"` | How quickly the effect propagates. |
| `transferFn` | `"linear"` | The transfer function shape. |
| `isQuickFix` | boolean (optional) | Marks the edge as a quick-fix loop for systems-thinking annotation. |

### ConstraintEdge

| Field | Type | Description |
|---|---|---|
| `kind` | `"constraint"` | Discriminates this edge from a `CausalEdge`. |
| `constraintKind` | `"ceiling" \| "floor"` | Whether the constraint caps or floors the target. |
| `id` | string | Unique edge identifier. |
| `from`, `to` | string | Node ids this edge connects. Both must exist in `nodes`. |

Both edge kinds require `from` and `to` to reference node ids that actually
exist in `nodes` — the encode script validates this and rejects with
`edges[i] references nonexistent "from"/"to" node id: ...` otherwise.

### Modulator

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique modulator identifier. |
| `from` | string | Node id whose value modulates the edge. |
| `target` | string | The `id` of the edge (`CausalEdge` or `ConstraintEdge`) being modulated. |
| `polarity` | `1 \| -1` | Direction of the modulation effect. |

### Annotation

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique annotation identifier. |
| `x`, `y` | number | Canvas position of the annotation. |
| `text` | string | The annotation's displayed text. |

## Worked example

A complete, valid graph — three nodes, two causal edges, one constraint edge,
one modulator, one annotation. This exact JSON passes
`scripts/encodeSharedModelURL.js`'s validation (`validateGraph`):

```json
{
  "nodes": [
    {
      "id": "n1",
      "label": "Births",
      "x": 0,
      "y": 0,
      "radius": 40,
      "sizeTier": 1,
      "colourTier": 1,
      "min": 0,
      "max": 100,
      "initial": 10
    },
    {
      "id": "n2",
      "label": "Population",
      "x": 200,
      "y": 0,
      "radius": 50,
      "sizeTier": 2,
      "colourTier": 1,
      "min": 0,
      "max": 1000,
      "initial": 50
    },
    {
      "id": "n3",
      "label": "Deaths",
      "x": 400,
      "y": 0,
      "radius": 40,
      "sizeTier": 1,
      "colourTier": 2,
      "min": 0,
      "max": 100,
      "initial": 5
    }
  ],
  "edges": [
    {
      "kind": "causal",
      "id": "e1",
      "from": "n1",
      "to": "n2",
      "polarity": 1,
      "weight": 3,
      "delay": "none",
      "transferFn": "linear"
    },
    {
      "kind": "causal",
      "id": "e2",
      "from": "n2",
      "to": "n3",
      "polarity": 1,
      "weight": 2,
      "delay": "short",
      "transferFn": "linear"
    },
    {
      "kind": "constraint",
      "constraintKind": "ceiling",
      "id": "e3",
      "from": "n3",
      "to": "n2"
    }
  ],
  "annotations": [
    {
      "id": "a1",
      "x": 200,
      "y": -80,
      "text": "Population grows while births exceed deaths"
    }
  ],
  "modulators": [
    {
      "id": "m1",
      "from": "n1",
      "target": "e2",
      "polarity": 1
    }
  ]
}
```

## Running the encode script

Save a graph like the one above to a file, then run:

```bash
node scripts/encodeSharedModelURL.js <path-to-graph.json> [--title <text>]
```

- The script prints exactly one line to stdout: the share URL query string
  (nothing else — no logs, no progress output).
- `--title <text>` is optional. When given, the resulting URL carries a
  `title` param alongside `g` (plain text, not compressed).
- On an invalid graph (missing required field, or an edge referencing a
  nonexistent node id), the script exits non-zero, prints a descriptive error
  to stderr, and prints no URL to stdout.

### The `g=` query param and URL structure

The URL is a query string of the shape:

```
?g=<base64-encoded-deflate-raw-compressed-json>&title=<optional-plain-text>
```

- `g` is the payload: `{ version: 5, graph }` — JSON-stringified, compressed
  with raw DEFLATE (`node:zlib`'s `deflateRawSync`), then base64-encoded.
- `title`, when present, is the plain-text value passed via `--title`
  (URL-encoded by `URLSearchParams`, not compressed).
- This query string is appended to wherever the Swoopy app is hosted to
  produce a full shareable link, e.g.
  `https://swoopy.example.com/?g=eJyrVs...&title=Population+Growth`.

## The edit-and-rerun iteration loop

Because this is a script, not a UI, the authoring loop is:

1. Edit the graph JSON file directly (add a node, tweak a `weight`, fix an
   edge reference).
2. Re-run `node scripts/encodeSharedModelURL.js <file> [--title <text>]`.
3. Read the new `g=...` URL off stdout and hand it to whoever needs to view
   the updated model.
4. If the script exits non-zero, read the stderr message — it names exactly
   which field or edge reference is missing/invalid — fix the JSON, and
   re-run from step 2.

There is no server to restart and no build step: each edit-and-rerun cycle is
a single `node` invocation producing a single new URL.
