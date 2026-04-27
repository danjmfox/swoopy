# Journey: Share Compressed URL — Visual Narrative

**Feature:** share-url-compression  
**Type:** Cross-cutting (engine serialisation + app URL sync + share UI)  
**Research depth:** Lightweight — happy path + key error paths

---

## Mental Model

The user thinks of "Share" as: _copy a link → paste → person opens model_. They do not think about
encoding. They do notice when a link is too long to paste into Slack or a browser bar, or when a
shared model opens as blank. The compression must be invisible to the happy path; only its absence
(shorter link, larger model support) should be felt.

---

## Happy Path

| Step | User action | System response | Artifact produced |
|------|-------------|-----------------|-------------------|
| 1 | Opens Swoopy with a complex model (many nodes/edges) | Canvas renders model | `${graph}` in store |
| 2 | Clicks **Share** button in toolbar | `shareGraph()` encodes the model | — |
| 3 | Engine: JSON → UTF-8 bytes → **deflate compress** → base64 | Compressed `${encoded}` string | — |
| 4 | URL is constructed: `?g=${encoded}` | URL is shorter than before | `${shareUrl}` |
| 5 | URL is copied to clipboard | "Copied!" toast appears | `${shareUrl}` in clipboard |
| 6 | Recipient opens `${shareUrl}` | `loadFromUrl()` reads `?g=` | — |
| 7 | Engine: base64 → deflate **decompress** → UTF-8 → JSON → `deserialize()` | Model restored exactly | `${graph}` in store |
| 8 | Canvas renders recipient's view | Model visible; no blank canvas | — |

---

## Emotional Arc

```
Facilitator builds complex model      😐 (normal, in flow)
       ↓
Clicks Share                          😐
       ↓
Sees "Copied!" toast                  🙂 (quick, works)
       ↓
Pastes URL — it fits in Slack         😊 (relief — it's shorter)
       ↓
Recipient opens link — model loads    😊 (it works!)
       ↓
Model is intact, can continue session 😄 (trust established)
```

Key emotional gate: the URL **must fit** in a chat message without being wrapped or truncated. If
compression fails silently and the link breaks, trust collapses.

---

## Shared Artifacts Registry

| Artifact | Type | Source | Consumers |
|----------|------|--------|-----------|
| `graph` | `Graph` (Zustand store) | `graphSlice` | `shareGraph()` |
| `encoded` | `string` (base64 of compressed bytes) | `shareGraph()` | URL `?g=` param |
| `shareUrl` | `string` (full URL) | `shareGraph()` | Clipboard |
| Legacy `encoded` | `string` (base64 of plain JSON) | Existing `?g=` links | `loadFromUrl()` fallback |

---

## Error Paths

| Step | Failure | Recovery |
|------|---------|---------|
| Compress | `CompressionStream` / library throws | Fall through to plain base64 (same as today) — silent |
| Decompress new format | Corrupt `?g=` param | Catch + leave current graph intact (same behaviour as today) |
| Decompress legacy format | Recipient opens old uncompressed `?g=` URL | `loadFromUrl()` tries decompress → fails → falls back to plain base64 decode → success |
| `decodeSharedModelURL.js` | User runs debug script on compressed URL | Script must also try decompress → fall back to plain |

---

## Key Constraint

The `CompressionStream` / `DecompressionStream` Web API is **asynchronous**. `shareGraph()` is
already `async` (clipboard write). `loadFromUrl()` is currently **synchronous** — it will need to
become async, or we use a synchronous compression library (e.g. `fflate`) to avoid refactoring the
load path.

> This is the main technical risk — it surfaces an architectural decision that must be raised as a
> DR before implementation.
