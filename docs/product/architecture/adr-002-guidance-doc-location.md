# ADR-002: Agent-facing guidance doc lives at docs/AGENT-GRAPH-AUTHORING.md, pointed to from CLAUDE.md

## Status
Accepted

## Context
Story 2 needs a discoverable doc describing the `Graph`/`Node`/`Edge`/`Modulator`/`Annotation` schema, a worked example, the encode script's invocation, and the edit→re-run iteration loop (AC1–AC5). This location was explicitly left open in DISCUSS (slice brief: "path decided in DESIGN").

## Decision
New file `docs/AGENT-GRAPH-AUTHORING.md`, referenced by one bullet under CLAUDE.md's existing "Key Files" section — the same "fetch when relevant" pattern already used for `docs/ARCHITECTURE.md` and `docs/PRD.md`.

## Alternatives Considered
1. **New root `AGENTS.md`** (emerging cross-tool convention, e.g. honored natively by some coding-agent tools). Rejected for now: Claude Code does not auto-load `AGENTS.md`; it would still need a `CLAUDE.md` pointer to be discoverable in this tool, so it doesn't save a discovery step, and it introduces a second top-level convention file to keep in sync with `CLAUDE.md`. Revisit if this project starts targeting multiple agent tools that honor `AGENTS.md` natively.
2. **New section inside the existing project `CLAUDE.md`.** Rejected: `CLAUDE.md` is read in full every session regardless of task. Embedding a full schema reference plus a worked JSON example here adds token cost to every unrelated session (UI work, engine work, etc.), and contradicts the project's own established pattern of keeping reference material in `docs/` with a pointer, rather than inline.
3. **(Chosen) `docs/` file + `CLAUDE.md` "Key Files" pointer.** Matches AC5's own suggested pattern verbatim ("consistent with how other reference files... are surfaced").

## Consequences
**Positive:** zero token cost on unrelated sessions; consistent with existing discoverability pattern; satisfies AC5 directly.
**Negative:** discovery depends on the agent choosing to fetch the pointer — identical trust already placed in `docs/ARCHITECTURE.md`/`docs/PRD.md` today, so this introduces no new risk class.
