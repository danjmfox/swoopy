# Instructions for AI Agents

This document provides guidance for AI coding assistants and agents interacting with the Swoopy codebase.

Check ./CLAUDE.md

## Inspecting Shared Model URLs

When you are provided with a Swoopy shared URL (e.g., `http://localhost:5173/?g=...`), **do not manually attempt to decode the Base64 string or parse the JSON structure.**

Instead, use the existing utility script which handles URL parameter extraction, Base64 decoding, and pretty-printing of the graph state (nodes, edges, modulators, and annotations).

### Usage

Run the following command from the project root:

```bash
node scripts/decode-url.mjs "<SHARED_URL_OR_BASE64>"
```

### Why use this script?

- **Parameter Handling:** It correctly identifies the `g` parameter (the graph data) vs the `m` parameter (local ID).
- **Visual Clarity:** It provides a human-readable summary of the causal relationships, weights, polarities, and constraints.
- **Version Safety:** It displays the model version and handles schema differences (like the presence or absence of modulators).
- **Reliability:** It uses the project's internal logic for ID slicing and label resolution.
