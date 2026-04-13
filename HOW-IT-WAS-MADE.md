# How It Was Made

This document describes how Swoopy was built and provides a retrospective effort
audit — an estimate of what it would have cost a human developer to build the
same thing from scratch, without AI assistance.

---

## Build method

Swoopy was built entirely through AI-assisted development using Claude (Anthropic).
The human author provided product direction, reviewed outputs, made editorial
decisions, and tested the running application. Code, tests, documentation, and
architecture decision records were all produced in collaboration with the AI.

---

## Manual Effort Audit

The audit answers: _what would this have cost a mid-level engineer working
manually, pre-AI?_

Two independent methods were used and then cross-checked.

### Method 1 — LOC + COCOMO II

#### Step 1: Count non-boilerplate source lines

Files were enumerated across the three packages (`app`, `engine`, `renderer`),
root scripts, and tests. Boilerplate was excluded: `main.tsx` (12 LOC),
`index.ts` re-exports (~30 LOC combined), lock files, and generated config.

| Category | Files | LOC |
| --- | --- | --- |
| `packages/app/src` — React frontend | 15 | 2,934 |
| `packages/engine/src` — simulation engine | 8 | 1,167 |
| `packages/renderer/src` — Canvas renderer | 8 | 1,519 |
| Root scripts (`gen-model`, `generate-*`, `doc-image-*`) | 5 | 1,201 |
| **Production source total** | **36** | **6,821** |
| Test files (31 `.test.ts/tsx`) | 31 | 10,164 |
| **Grand total** | **67** | **16,985** |

**Assumption:** LOC counts reflect non-blank lines. Comments are included because
they carry intent and took time to write; stripping them would undercount effort
on well-documented code like this.

#### Step 2: Apply COCOMO II models

COCOMO II is a parametric cost model from the USC Center for Software Engineering.
The input is KSLOC (thousands of source lines), applied to production code only
(6.821 KSLOC). Tests are handled separately to avoid double-counting at a
discounted rate.

**Organic model** (lower bound — small team, stable requirements):

```plaintext
PM = 2.4 × (KSLOC)^1.05
   = 2.4 × (6.821)^1.05
   ≈ 18.0 person-months
```

**Semi-Detached model** (upper bound — some novelty, mixed experience):

```plaintext
PM = 3.0 × (KSLOC)^1.12
   = 3.0 × (6.821)^1.12
   ≈ 25.7 person-months
```

**COCOMO II Post-Architecture** (central estimate):

```plaintext
PM = 2.94 × (KSLOC)^1.12
   = 2.94 × (6.821)^1.12
   ≈ 25.2 person-months
```

**Test code supplement:** Tests are real work but written faster than production
logic. A 0.4× rate multiplier is applied:

```plaintext
Extra PM ≈ 0.4 × Organic(10.164 KSLOC)
         = 0.4 × (2.4 × 10.164^1.05)
         ≈ 10.5 person-months
```

**Assumption:** The 0.4× rate for tests is a judgement call. Test-driven code
written alongside production can be slower than 0.4×; tests written after the
fact can be faster. The real ratio here is likely 0.35–0.5× given the test suite
complexity (see Method 2 below).

| Scenario | Person-Months | Hours (@ 160 hrs/PM) |
| --- | --- | --- |
| Organic — source only | 18.0 | 2,880 |
| Semi-Detached — source only | 25.7 | 4,110 |
| COCOMO II central | 25.2 | 4,030 |
| + Test supplement | +10.5 | +1,680 |
| **Full (central + tests)** | **~35.7** | **~5,710** |

**Assumption:** 160 hours per person-month (20 working days × 8 hours). Some
models use 152 (19 days). The difference is ~5% and does not materially affect
the conclusion.

#### Step 3: Discovery Tax

COCOMO models average complexity. This project contains several non-average
components where a human would have spent time reading, experimenting, and
discarding failed approaches before writing the final code. These are itemised
separately as a "Discovery Tax" on top of the COCOMO base.

| Domain | Why it's non-average | Est. hours |
| --- | --- | --- |
| Systems dynamics theory | Causal loop diagrams, polarity conventions, reinforcing vs. balancing loops — none of this is assumed knowledge; requires domain reading and internalisation | 20 |
| Custom signal relay algorithm | The relay model (bucketing arrivals, zero-net guard, polarity accumulation, `MAX_HOPS=26` calibration) is original. A human would prototype 2–3 approaches before converging on this one | 24 |
| Canvas 2D game-loop patterns | `requestAnimationFrame` with `dt`, high-DPI scaling, `save/restore` discipline, clearing strategies | 10 |
| Quadratic Bézier hit-testing | Computing tangents, perpendicular offsets, mapping pointer position to Bézier parameter `t`, choosing hit regions at `T=0.2/0.5/0.8` | 10 |
| React + Canvas hybrid architecture | Avoiding re-render thrashing (the Zustand `getState()`-in-RAF pattern is non-obvious); ref forwarding; pointer event delegation | 8 |
| Modulator semantics | Designing the modulator feature (edge-to-edge control, polarity-aware normalisation formula) from both UX and mathematical perspectives | 8 |
| Versioned serialisation with migrations | Designing a 5-version migration chain, URL-safe base64 encoding, graceful fallback on decode failure | 6 |
| Monorepo tooling | pnpm workspaces, TypeScript project references, Vite configs for cross-package imports | 5 |
| Canvas testing strategy | Mocking `requestAnimationFrame` and `CanvasRenderingContext2D` in vitest/jsdom; using node-canvas for visual tests | 5 |
| Spring-loaded interaction modes | State machine design: mode stacking, hold-to-inject interval, drag vs. click discrimination | 4 |
| Chevron animation easing | Smooth-step morphing for polarity-flip animation (`t² × (3 − 2t)`) — small surface, real thought required | 3 |
| Architecture Decision Records (×15) | Research and deliberation embedded in the ADRs is real architectural work, not post-hoc documentation | 10 |
| **Discovery Tax total** | | **113 hours** |

**Assumption:** Discovery Tax captures effort that COCOMO smears across its
multipliers but doesn't make explicit. These hours represent failed approaches,
documentation reading, and design iteration — not additional coding on top of
the COCOMO estimate. They are largely embedded in the COCOMO figure, so they
are _not_ added to the final total; they are shown to justify why the
Semi-Detached model is more appropriate than Organic for this codebase.

---

### Method 2 — Repomix token analysis

`repomix v1.13.1` was run over the repository (excluding `node_modules`, `dist`,
`.git`, `graphify-out`, `pnpm-lock.yaml`, and binary assets) to produce both a
full pack and a compressed (skeleton-only) pack.

```sh
npx repomix --style plain \
  --ignore "node_modules,dist,.git,graphify-out,pnpm-lock.yaml,*.png,*.jpg,*.svg" \
  -o repomix-output.txt

npx repomix --style plain --compress \
  --ignore "node_modules,dist,.git,graphify-out,pnpm-lock.yaml,*.png,*.jpg,*.svg" \
  -o repomix-compressed.txt
```

#### Raw repomix output

| | Full pack | Compressed (skeletons only) |
| --- | --- | --- |
| Files | 120 | 120 |
| **Tokens** | **230,866** | **111,414** |
| Characters | 850,348 | 411,151 |
| **Compression ratio** | — | **0.482** |

The compression ratio is the key signal from this method. `--compress` strips
all function bodies, retaining only signatures, interfaces, type definitions,
imports, and comments. A ratio of 0.482 means 48% of the codebase is structural
scaffolding and 52% is substantive implementation. For context:

- Boilerplate-heavy projects typically compress to 0.65–0.70
- Dense algorithmic code (game engines, numeric solvers) compresses to 0.25–0.35
- Swoopy at 0.48 sits in the well-engineered middle: purposeful TypeScript types
  plus meaningful logic bodies

#### Token distribution by category

Repomix exposed something the LOC analysis missed: the documentation corpus is
substantial and was invisible to COCOMO.

| Category | Tokens | Share |
| --- | --- | --- |
| Production source code (`packages/`) | ~46,400 | 20.1% |
| Test code (`packages/`) | ~84,800 | 36.7% |
| Documentation (`docs/`) | 81,519 | 35.3% |
| Scripts, config, root files | ~18,100 | 7.8% |
| **Total** | **230,866** | **100%** |

**Documentation breakdown:**

| File | Tokens | Notes |
| --- | --- | --- |
| `docs/MODELS.md` | 43,468 | Library of worked causal diagram examples — 18.8% of entire repo |
| `docs/PRD.md` | 10,499 | Full product requirements document |
| `docs/decisions/` (15 ADRs) | 20,537 | Architecture decision records |
| `docs/USER-GUIDE.md` | 3,653 | Facilitator guide |
| `docs/ARCHITECTURE.md` | 3,362 | Developer guide |

`docs/MODELS.md` alone rivals the combined token count of `store.ts` +
`LoopyRenderer.ts` + `drawScene.ts`. Designing, building, verifying, and
describing a library of causal diagram examples is real engineering work that
LOC-only analysis ignores entirely.

#### Test suite density

Per-file token ratios reveal which components are hardest to verify:

| Production file | Tokens | Test file | Tokens | Ratio |
| --- | --- | --- | --- | --- |
| `LoopyRenderer.ts` | 5,113 | `LoopyRenderer.test.ts` | 18,269 | 3.57× |
| `Canvas.tsx` | 3,850 | `Canvas.test.tsx` | 13,726 | 3.57× |
| `store.ts` | 6,177 | `store.test.tsx` + `store.test.ts` | 15,747 | 2.55× |
| `sim.ts` | 2,475 | `sim.test.ts` | 2,668 | 1.08× |

A 3.5× test-to-production ratio on the renderer and Canvas layer reflects
genuine testing complexity: canvas API mocking, animation frame lifecycle
management, pointer event simulation, and interaction state machine coverage.

**Assumption:** The 0.4× rate used in the COCOMO test supplement may be
conservative given these ratios. The renderer tests in particular exhibit effort
comparable to or exceeding the production code they cover.

#### Token-weighted effort estimate

Industry throughput benchmarks for mid-level engineers producing work from
scratch (not editing AI output):

| Category | Tokens | Rate (tok/day) | Person-days | Hours |
| --- | --- | --- | --- | --- |
| Production source code | 46,400 | 250 | 185 | 1,484 |
| Test code | 84,800 | 400 | 212 | 1,696 |
| Documentation (MODELS.md, PRD, ADRs, guides) | 81,519 | 500 | 163 | 1,304 |
| Scripts, config, tooling | 18,100 | 600 | 30 | 241 |
| **Total** | | | **590** | **4,725** |

**Assumption:** Token throughput rates are estimates derived from engineering
productivity research (roughly aligned with COCOMO, Putnam, and Jones models).
They are the most challengeable numbers in this analysis. A faster engineer
might double the production code rate; a more deliberate one might halve it.
The documentation rate (500 tok/day) assumes each model in MODELS.md required
non-trivial design and verification effort, not just transcription.

---

### Cross-check and convergence

| Method | Person-Months | Man-Hours |
| --- | --- | --- |
| COCOMO II Organic (source LOC only) | 18.0 | 2,880 |
| COCOMO II Semi-Detached (source LOC only) | 25.7 | 4,110 |
| COCOMO II central + test supplement | ~35.7 | ~5,710 |
| **Repomix token-weighted (all categories)** | **~29.5** | **~4,725** |

The two methods converge in the **4,400–4,750 hour range** when all work is
counted. The COCOMO upper bound of 5,710 hours is the outlier; this likely
overstates effort because COCOMO's exponents assume coordination overhead and
requirements churn that don't apply to a solo, well-scoped build.

---

### Final estimate

> **Conservative estimate: ~4,500 man-hours (~28 person-months)**
> for a mid-level engineer working manually, without AI assistance.

This represents approximately:

- 27–28 months of solo full-time work, or
- 11–12 months for a focused two-person team

#### Key cost drivers

1. **The simulation engine** — `sim.ts`, `characterise-relay.ts`, `constants.ts`.
   The relay propagation model is original: not a textbook algorithm, not a
   library, not something that can be found on Stack Overflow. Designing,
   calibrating, and verifying it (including the `MAX_HOPS=26` determination,
   zero-net guard logic, and modulator composition) would realistically consume
   3–5 months alone.

2. **The renderer** — `LoopyRenderer.ts`, `drawScene.ts`. Over 1,100 LOC of
   Canvas 2D drawing code, fully tested with a 3.57× test-to-production token
   ratio. Custom geometry (Bézier curves, hit testing, chevron animation) with
   no library dependencies.

3. **The model library** — `docs/MODELS.md` at 43,468 tokens (18.8% of the
   entire repo). Each entry represents a domain-specific causal diagram that
   needed to be designed, encoded, run, verified, and described.

4. **The test suite** — 10,164 LOC / ~84,800 tokens. Not boilerplate tests;
   the Canvas and LoopyRenderer suites are complex harnesses in their own right.

---

### What this audit does not claim

- **It is not a precise measurement.** COCOMO II is calibrated on historical
  project data with wide confidence intervals (±50% is normal). The token
  throughput rates are estimates. The figure of ~4,500 hours should be read as
  "the right order of magnitude" rather than a precise number.

- **It does not measure AI productivity gain.** The audit answers the
  counterfactual question ("what would this have cost without AI?") — it makes
  no claim about how long the actual build took with AI assistance.

- **It does not account for rework.** COCOMO includes some rework implicitly.
  The token-weighted method does not. A manual build would involve more
  dead-ends and rewrites than are visible in the final codebase.

---

## Actual build timeline

Every commit was made with Claude Code. The repository spans **14 calendar
days** (30 March – 13 April 2026), with **152 commits** grouped below into
**18 sessions** separated by gaps of more than 3 hours.

The contrast with the ~4,500-hour manual estimate is the headline figure: the
AI-assisted build compressed an estimated 28 person-months of solo work into
roughly two weeks of calendar time — approximately a **50–60× calendar
compression**.

### Session log

Diff stats show net source changes for each session (merges included); file
counts distinguish source, test, and documentation files.

---

#### Session 01 — Mon 30 Mar, 13:07–17:26 UTC `4h 19m` · 11 commits

Branches merged: `fix/trend-triangle-regression`, `fix/restore-gemini-damage`
(a prior session with a different AI model had broken things and needed
repair), `feat/share-new-model-ui`, `feat/se-10-welcome-overlay`. The opening
session re-establishing a working baseline and shipping share + welcome
features.

---

#### Session 02 — Tue 31 Mar, `4h 40m` · 9 commits · +1,662 / -427 · 16 files (6 src, 6 test, 4 doc)

Staggered-density signal emission (DR--20260330), spring-loaded mode switching
(GE-32/33), and persistent trend + delay queue arc indicator (SI-18/19). Three
distinct features shipped in one morning.

---

#### Session 03 — Wed 01 Apr, `5m` · 2 commits

A 5-minute burst: `inject()` emitting relay signals on outgoing edges, then
`step()` relay propagation fan-out. The core of the signal engine landed in
two rapid commits.

---

#### Session 04 — Wed 01 Apr, `7m` · 4 commits · +1,667 / -750 · 19 files (8 src, 8 test, 3 doc)

Seven minutes, 2,417 net lines: weight-as-amplitude fragments, `hopsRemaining`
aging, `prevNodeValues` removed, integration scenarios (reinforcing/balancing/
diamond), docs updated. The relay model completed in a single focused burst.

---

#### Session 05 — Wed 01 Apr, `<1m` · 2 commits · +10 / -10 · 4 files

Instant typecheck cleanup on the relay model (`claude/wonderful-poincare`),
then merged to main. Four files, zero net lines.

---

#### Session 06 — Thu 02 Apr, `4h 45m` · 9 commits · +958 / -451 · 29 files (11 src, 15 test, 3 doc)

V2.0 docs correction, node size tiers (XS/S/M/L/XL) across all three
packages, first pass at colour tiers and WCAG AA contrast fixes. Heavy test
investment relative to features: 15 test files changed alongside 11 source
files.

---

#### Session 07 — Thu 02 Apr, `41m` · 7 commits · +297 / -100 · 10 files (6 src, 3 test, 1 doc)

Evening sprint finishing the WCAG colour palette and landing node annotations
(free text below circle) in 41 minutes.

---

#### Session 08 — Fri 03 Apr, `6h 54m` · 12 commits · +3,687 / -460 · 67 files (23 src, 21 test, 12 doc)

The largest single-session LOC swing. Three features: free-floating box
annotations (GE-37), simulation history logger and data table (GE-38), and the
history table/graph toggle with SVG line chart (GE-39), then CI fixes. The
test suite grew almost as fast as the features.

---

#### Session 09 — Fri 03 Apr, `1h 27m` · 8 commits · +298 / -141 · 30 files (8 src, 18 test, 1 doc)

TypeScript strict-mode enforcement across all packages, then live-reactive
history overlay (GE-40). 18 of the 30 changed files were tests — a
type-tightening sweep that rippled through the whole test suite.

---

#### Session 10 — Sat 04 Apr, `5h 54m` · 19 commits · +1,108 / -390 · 23 files (8 src, 12 test, 2 doc)

The most commits in a single session. Quick-fix edge flag (GE-41), multi-edge
semantics (GE-42), then an immediate `refactor/reduce-complexity` pass:
`commitGraph` helper, `edgeEndpoints` extraction, serialisation pipeline
flatten. Feature work followed by cleanup in the same sitting.

---

#### Session 11 — Wed 08 Apr, `7h 44m` · 19 commits · +2,439 / -94 · 37 files (13 src, 21 test, 3 doc)

The longest session, and almost entirely additive (+2,439 / -94). Three major
features: the Modulator type across all three packages, modulator polarity
toggle, and signal direction (chevron animation with polarity-flip morphing).
21 of 37 files changed were tests. The low deletion count reflects clean new
concepts with minimal rework.

---

#### Session 12 — Fri 10 Apr, `7h 11m` · 18 commits · +1,953 / -413 · 44 files (10 src, 5 test, 18 doc)

Zero-net guard engine feature, then a graphify deep scan triggering updates
across all five documentation files, then Dependabot dependency bumps, then an
ESLint/README/GitLab→GitHub migration tech-debt sweep. Feature, docs, and
maintenance all in one day.

---

#### Session 13 — Fri 10 Apr, `<1m` · 1 commit · +80 / -68 · 4 files (0 src, 0 test, 4 doc)

Single commit: post-graphify docs update across ARCHITECTURE, PRD, USER-GUIDE,
and README.

---

#### Session 14 — Sat 11 Apr, `2h 21m` · 8 commits · +336 / -61 · 9 files (4 src, 2 test, 3 doc)

Saturday evening: modulated edge weight rendering (DR--20260411) worked
through the full drctl ADR lifecycle — draft → propose → implement → format —
visible as distinct commits.

---

#### Session 15 — Sun 12 Apr, `1h 48m` · 4 commits · +59 / -3 · 5 files (2 src, 2 test, 1 doc)

Sunday morning tidy: MD040 lint fix on the new DR, then node role type added
to the engine with a serialisation round-trip test.

---

#### Session 16 — Sun 12 Apr, `5h 47m` · 15 commits · +1,223 / -68 · 18 files (7 src, 8 test, 2 doc)

Node role indicators end-to-end: Role selector in NodePopover, lever/outcome
amber ring in renderer, outcome warning in simulate mode, docs updated. Then
model title (toolbar, URL, page title, canvas), undo keyboard routing fix, and
`deleteModel` action. Four distinct features on a Sunday afternoon.

---

#### Session 17 — Mon 13 Apr, `55m` · 2 commits · +1,941 / -183 · 27 files (6 src, 2 test, 2 doc)

Two PRs merged in under an hour: `drawScene` extraction and doc-image
generation (a significant renderer refactor plus new script infrastructure),
then the user guide link in the help modal. The +1,941 is dominated by the
drawScene split and generated documentation images.

---

#### Session 18 — Mon 13 Apr, `13m` · 2 commits · +302 / -0 · 1 file (0 src, 0 test, 1 doc)

This document. `HOW-IT-WAS-MADE.md` created, then markdownlint fixes applied.

---

### Session summary

| | |
| --- | --- |
| Total sessions | 18 |
| Total calendar days | 14 (30 Mar – 13 Apr 2026) |
| Total commits | 152 |
| Longest session | Session 11 — 7h 44m |
| Shortest substantive session | Session 04 — 7 minutes, 2,417 net lines |
| Most commits in a session | Sessions 10 & 11 — 19 each |
| Largest LOC swing | Session 08 — +3,687 / -460 |
| Most additive session | Session 11 — +2,439 / -94 (96% net adds) |
| Most doc files changed | Session 12 — 18 documentation files |
| Weekend sessions | 4 (Sessions 10, 14, 15, 16) |
