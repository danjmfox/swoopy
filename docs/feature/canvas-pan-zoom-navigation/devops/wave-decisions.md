# DEVOPS Decisions — canvas-pan-zoom-navigation

## Key Decisions

- [D1] Deployment target = static site hosting via GitHub Pages (existing, unchanged).
  No new target introduced by this feature.
- [D2] Container orchestration = none. Bare static-file deploy — no containers,
  no Kubernetes, no Docker Compose. Simplest-alternative check: N/A, this
  isn't a new choice, it's the project's existing (and only sensible) posture
  for a client-only SPA.
- [D3] CI/CD platform = GitHub Actions (existing `.github/workflows/ci.yml`,
  unchanged by this feature — see Infrastructure Summary below).
- [D4] Existing infrastructure = yes, both CI/CD and hosting infra already in
  production. This wave's job is confirmation, not creation.
- [D5] Observability/instrumentation = deferred. No new telemetry/analytics
  pipeline added for the 3 outcome KPIs. Rationale (user-provided): acceptance
  tests already verify the underlying capability; a data-collection pipeline
  for a client-only hobby app carries real cost (privacy/consent, a pipe with
  nowhere to send data) disproportionate to this feature. KPIs documented as
  measured by acceptance tests + occasional manual usability sessions only
  (see `docs/product/kpi-contracts.yaml` KPI-07/08/09).
- [D6] Deployment strategy = recreate. Not really a choice: GitHub Pages has
  no blue-green/canary primitive without extra tooling (which would violate
  the "no new tooling" constraint for this feature); every merge to main
  atomically replaces the deployed site. Stated as a platform-given fact.
- [D7] Continuous learning = no. No existing monitoring/alerting
  infrastructure, none added (follows from D5). No A/B testing, feature
  flags, or canary analysis for this feature.
- [D8] Git branching strategy = Trunk-Based Development (existing project
  standard; matches `ci.yml`'s `push: [main]` + `pull_request` trigger rules
  exactly as configured — no CI trigger changes needed).
- [D9] Mutation testing strategy = per-feature, on-demand, NOT a CI/merge gate
  — this is the existing project-wide policy already in CLAUDE.md ("Mutation
  testing: Stryker, target 85% kill rate on core modules — run via
  `/nw-mutation-test`... Per-feature, scoped to `packages/engine`... exclude
  `packages/app`... Kill rate gate: 80%"). Confirmed to apply; no new/different
  strategy invented; CLAUDE.md NOT modified.
  **Scoping gap flagged, not resolved**: this feature's new pure functions
  land in `packages/renderer/src/geometry.ts`, not `packages/engine`.
  `packages/renderer` is named in neither the "scoped to engine" clause nor
  the "exclude app" clause — its mutation-testing status under the current
  wording is genuinely ambiguous. Precedent check: the repo's existing
  per-feature Stryker configs (`stryker.config.mjs` at root,
  `packages/app/stryker.config.mjs`) both target `url-encoding.ts` — a pure
  function file physically located in `packages/app`, which CLAUDE.md's
  literal wording would seem to exclude. Actual practice therefore appears
  to be "mutate the feature's new pure-logic file(s), regardless of package,
  as long as they aren't React components" — not literally "packages/engine
  only." Under that reading, `geometry.ts`'s 5 new pure functions
  (`screenToGraph`, `graphToScreen`, `clampZoom`, `zoomAtCursor`,
  `computeFitViewport`) are a plausible per-feature Stryker target by the
  same logic as `url-encoding.ts`. This is presented as an open question for
  the user's decision — no Stryker config was created for this feature and
  CLAUDE.md's mutation-testing section is unmodified.
  **Resolved**: user confirmed the module-characteristic scoping. See
  `docs/decisions/DR--20260724--process--mutation-testing-scope.md`; CLAUDE.md's
  Mutation Testing section now states the rule explicitly. `geometry.ts`'s
  new pure functions are in scope for this feature's future `/nw-mutation-test`
  run (config to be pointed there at DELIVER, once the functions exist).

## Infrastructure Summary

- Deployment: GitHub Pages (static hosting), recreate strategy (platform-given).
- CI/CD: GitHub Actions, existing `.github/workflows/ci.yml`, **zero changes
  made or needed**. The `test` job's matrix (`[engine, renderer, app]`) will
  naturally pick up new `geometry.test.ts` (renderer leg) and new/updated
  `Canvas.test.tsx` / `store.test.ts` / `Toolbar.test.tsx` (app leg) once
  DISTILL/DELIVER write them — no new CI stage required. Coverage upload
  (`actions/upload-artifact`) needs no change — new tests roll into the
  existing per-package coverage report automatically. `dependency-review` and
  `sbom` stages are unaffected: this feature adds zero new npm dependencies
  (confirmed in DESIGN wave's Technology Stack section — "No new dependency.
  No new package. No new runtime.").
- Observability: deferred (D5/D7) — no new stack, no new instrumentation.
- Mutation testing: per-feature/on-demand, existing project policy applies;
  `packages/renderer` scoping ambiguity flagged above, unresolved by design.
- Branching: trunk-based, existing, unchanged.

## Handoff Notes

- `docs/feature/canvas-pan-zoom-navigation/devops/environments.yaml` created
  — adapted from the skill's install-lifecycle template to a browser
  input-device axis (mouse+wheel, trackpad+pinch/ctrlKey-wheel, drag-pan
  across all interaction modes), since this feature has no install/upgrade
  lifecycle to model. Rationale for the adaptation is documented inline in
  the file itself.
- `.github/workflows/ci.yml` **not modified** — analysis in this wave found
  no CI change is needed. If that analysis turns out to be wrong once real
  tests exist (e.g. a new package or a cross-browser testing need emerges),
  that is a decision for a future wave/DELIVER, not retrofitted here.
- `docs/product/kpi-contracts.yaml` extended with KPI-07/08/09 (all `soft`
  gate, all "measured by acceptance tests + manual usability session," no
  automated telemetry) — per the SSOT back-propagation contract.
- `docs/product/architecture/brief.md` **not modified** — the DEVOPS wave's
  update trigger ("deployment topology change") does not apply; deployment
  platform is unchanged (still GitHub Pages, no new managed services/regions).
- Per-wave peer review (`nw-platform-architect-reviewer`) **skipped** — none
  of the trigger conditions fired (no novel deployment target, no new CI/CD
  framework, no observability rewrite, no security posture change). Mandatory
  consolidated review remains scheduled for end of DISTILL per project
  convention.
