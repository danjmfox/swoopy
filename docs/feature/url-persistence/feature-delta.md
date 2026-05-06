# Feature Delta — url-persistence

## Wave: DISCUSS

### [REF] DISCUSS commitments

| Origin | Commitment                                                                               | DDD                  | Impact                                                                                 |
| ------ | ---------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| n/a    | Persistence uses ID-scoped localStorage keys — `swoopy_graph_<uuid>` — not a single slot | DR--20260329         | Acceptance tests must assert on the keyed form; single-slot assumptions are incorrect  |
| n/a    | Opening a `?g=` shared URL loads transiently; first mutation forks a new UUID            | DR--20260329         | Tests must verify fork-on-first-edit as an explicit contract; no fork = data loss risk |
| n/a    | New model action uses `replaceState`, no confirmation dialog, old model preserved        | DR--20260330         | Tests must assert old key still exists after newModel(); no mock confirm expected      |
| n/a    | inject() and tickSim() are not in the undo stack; newModel() clears it entirely          | docs/ARCHITECTURE.md | Tests that call newModel() must assert empty undo stack                                |

---

## Wave: DESIGN

### [REF] DESIGN commitments

| Origin  | Commitment                                                                                 | DDD | Impact                                                                                   |
| ------- | ------------------------------------------------------------------------------------------ | --- | ---------------------------------------------------------------------------------------- |
| DISCUSS | `forkIfTransient` is called inside `commitGraph`, which is called by all mutations         | n/a | Auto-save and fork happen via the same path; testing addNode is sufficient to cover both |
| DISCUSS | `loadFromUrl` sets `transient: true` without persisting                                    | n/a | Test must verify transient flag AND absence of localStorage entry immediately after load |
| DISCUSS | URL-encoded graph strings must be percent-encoded for `URLSearchParams` to parse correctly | n/a | Tests must use `encodeURIComponent(encodeGraphForUrl(...))` when constructing test URLs  |

---

## Wave: DISTILL

### [REF] Prior-wave reading

- `docs/product/architecture/brief.md` — read; driving ports: store actions + localStorage
- `docs/feature/url-persistence/discuss/user-stories.md` — read; 5 stories (US-01 to US-05)
- `docs/feature/url-persistence/design/wave-decisions.md` — read; 5 DWDs all referencing existing DRs

- `docs/product/journeys/` — not found
- `docs/product/kpi-contracts.yaml` — not found
- `docs/feature/url-persistence/devops/` — not found → default env matrix applied

Reconciliation: 0 contradictions. DISCUSS and DESIGN are aligned with implemented store code.

### [REF] Walking Skeleton strategy

**Strategy C (Real local)** — jsdom provides real localStorage and history API. No mocks needed for persistence behavior. All scenarios use the real `useStore` store functions. Test isolation via `beforeEach` clears localStorage and resets URL.

### [REF] Scenario list

| Scenario                                                        | US    | Tags                            | File                               |
| --------------------------------------------------------------- | ----- | ------------------------------- | ---------------------------------- |
| addNode writes serialized graph to `swoopy_graph_<modelId>`     | US-01 | `@acceptance @auto-save @US-01` | url-persistence.acceptance.test.ts |
| addEdge updates the localStorage entry with the new edge        | US-01 | `@acceptance @auto-save @US-01` | url-persistence.acceptance.test.ts |
| deleteNode updates the localStorage entry                       | US-01 | `@acceptance @auto-save @US-01` | url-persistence.acceptance.test.ts |
| loadFromUrl with valid `?g=` URL sets `transient: true`         | US-02 | `@acceptance @transient @US-02` | url-persistence.acceptance.test.ts |
| loadFromUrl does NOT persist to localStorage (transient)        | US-02 | `@acceptance @transient @US-02` | url-persistence.acceptance.test.ts |
| loadFromUrl with invalid `?g=` value leaves state unchanged     | US-02 | `@acceptance @error @US-02`     | url-persistence.acceptance.test.ts |
| First mutation on transient model generates new UUID            | US-02 | `@acceptance @fork @US-02`      | url-persistence.acceptance.test.ts |
| First mutation persists under new ID, not original              | US-02 | `@acceptance @fork @US-02`      | url-persistence.acceptance.test.ts |
| `?g=` replaced with `?m=<newId>` after fork                     | US-02 | `@acceptance @fork @US-02`      | url-persistence.acceptance.test.ts |
| Subsequent mutations after fork keep same UUID (no double-fork) | US-02 | `@acceptance @fork @US-02`      | url-persistence.acceptance.test.ts |
| loadPersistedGraph removes legacy `swoopy_graph` key            | US-03 | `@acceptance @migration @US-03` | url-persistence.acceptance.test.ts |
| loadPersistedGraph creates new `swoopy_graph_<id>` key          | US-03 | `@acceptance @migration @US-03` | url-persistence.acceptance.test.ts |
| loadPersistedGraph sets `swoopy_current_model` to new ID        | US-03 | `@acceptance @migration @US-03` | url-persistence.acceptance.test.ts |
| loadPersistedGraph restores graph content from legacy key       | US-03 | `@acceptance @migration @US-03` | url-persistence.acceptance.test.ts |
| newModel resets graph to empty state                            | US-04 | `@acceptance @new-model @US-04` | url-persistence.acceptance.test.ts |
| newModel preserves previous model in localStorage               | US-04 | `@acceptance @new-model @US-04` | url-persistence.acceptance.test.ts |
| newModel generates a new UUID                                   | US-04 | `@acceptance @new-model @US-04` | url-persistence.acceptance.test.ts |
| newModel updates URL to `?m=<newId>`                            | US-04 | `@acceptance @new-model @US-04` | url-persistence.acceptance.test.ts |
| newModel clears undo stack                                      | US-04 | `@acceptance @new-model @US-04` | url-persistence.acceptance.test.ts |
| newModel sets `transient: false`                                | US-04 | `@acceptance @new-model @US-04` | url-persistence.acceptance.test.ts |

**US-05 (welcome overlay):** already fully tested in `App.test.tsx` — all 6 AC-05 conditions covered. No new scenarios needed.

### [REF] Coverage gaps addressed

| Gap                                                         | Prior coverage                                          | New scenario                   |
| ----------------------------------------------------------- | ------------------------------------------------------- | ------------------------------ |
| Auto-save contract (AC-01a)                                 | No test verified localStorage writes                    | ✓ 3 mutation scenarios         |
| `loadFromUrl` sets `transient: true`                        | persistence.integration.test.ts checked round-trip only | ✓ explicit transient assertion |
| Fork-on-first-edit: new UUID + old key untouched (AC-02b/c) | Not tested                                              | ✓ 4 fork scenarios             |
| Legacy key migration (AC-03)                                | Not tested                                              | ✓ 4 migration scenarios        |
| `newModel` direct contract (AC-04)                          | Only exercised via `deleteModel` indirectly             | ✓ 6 new model scenarios        |

### [REF] Adapter coverage table

| Driving port                                                                    | Scenario covered by                    |
| ------------------------------------------------------------------------------- | -------------------------------------- |
| `store.addNode()` via `commitGraph` → `persist()` → localStorage                | US-01 auto-save: addNode writes        |
| `store.loadFromUrl(search)` → `URLSearchParams.get("g")` → `decodeGraphFromUrl` | US-02 transient: loadFromUrl sets flag |
| `forkIfTransient()` inside `commitGraph`                                        | US-02 fork: first mutation forks       |
| `store.loadPersistedGraph()` legacy branch                                      | US-03 migration: removes legacy key    |
| `store.newModel()`                                                              | US-04 all scenarios                    |

### [REF] Test placement

`packages/app/src/url-persistence.acceptance.test.ts` — co-located with store.test.ts and other app tests per project convention. Vitest config at `packages/app/vitest.config.ts` picks up `src/**/*.test.ts`.

### [REF] Pre-requisites

- Store import: `useStore` from `./store.ts`
- URL encoding import: `encodeGraphForUrl` from `./url-encoding.ts`
- Engine import: `serialize` from `@swoopy/engine`
- jsdom localStorage and `history.replaceState` — provided by vitest jsdom environment
- Store state isolation: `beforeEach` clears localStorage, resets URL, and calls `useStore.setState()` with known fixed modelId
