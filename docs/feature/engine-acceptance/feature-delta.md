# Feature Delta — engine-acceptance

Brownfield DISTILL. No upstream DISCUSS/DESIGN/DEVOPS waves existed.
Architecture source: `docs/ARCHITECTURE.md` + engine decision records in `docs/decisions/engine/`.

---

## Wave: DISTILL

### [REF] Prior-wave reading

- `docs/ARCHITECTURE.md` — read; driving ports identified from engine export table
- `docs/decisions/engine/DR--20260401--engine--relay-propagation-model.md` — relay model
- `docs/decisions/engine/DR--20260405--engine--modulator-effective-weight-formula.md` — modulator formula
- `docs/product/` — not found (brownfield; no nWave product artifacts)
- `docs/feature/engine-acceptance/` — this feature; no prior waves

Degradation applied: DISCUSS missing → derived acceptance criteria from architecture doc.
DESIGN missing (driving ports) → ports identified from `index.ts` exports directly.

### [REF] Inherited commitments

| Origin | Commitment                                                                            | DDD | Impact                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| n/a    | Engine functions are pure — same inputs produce same outputs with no side effects     | n/a | All scenarios can be run in isolation with constructed Graph and SimState values; no test harness needed beyond the functions themselves |
| n/a    | inject() is explicitly unclamped — architecture comment: "clamped at next step()"     | n/a | Tests must verify the two-step contract: inject produces unclamped values, step() enforces bounds                                        |
| n/a    | Constraint resolution runs twice per tick: pre-clamp (step 1) and post-clamp (step 6) | n/a | Acceptance scenarios must test post-arrival clamp separately from pre-clamp to verify step 6 fires                                       |
| n/a    | Serialization is versioned at v5; deserialize must migrate v1–v4 blobs                | n/a | Round-trip tests must use v5 serialize output and verify all fields including new modulator data                                         |

### [REF] Scenario list

| Scenario                                                                  | Tags                                        | File               |
| ------------------------------------------------------------------------- | ------------------------------------------- | ------------------ |
| Arriving signal that pushes node above ceiling is post-clamped            | `@acceptance @constraint @post-clamp`       | acceptance.test.ts |
| inject() leaves node above ceiling; step() pre-clamp corrects it          | `@acceptance @constraint @inject-unclamped` | acceptance.test.ts |
| inject() leaves node below floor; step() pre-clamp lifts it               | `@acceptance @constraint @inject-unclamped` | acceptance.test.ts |
| inject on short-delay edge enters pending queue (not travelling)          | `@acceptance @signal-propagation @delay`    | acceptance.test.ts |
| Pending signal releases after delay and changes destination value         | `@acceptance @signal-propagation @delay`    | acceptance.test.ts |
| Modulator polarity +1: min→suppress, max→full weight                      | `@acceptance @modulator`                    | acceptance.test.ts |
| Modulator polarity -1: max→suppress, min→full weight (reversal)           | `@acceptance @modulator`                    | acceptance.test.ts |
| Switching polarity from +1 to -1 inverts suppression at same source value | `@acceptance @modulator @polarity-reversal` | acceptance.test.ts |
| Graph with modulator (polarity +1) survives serialize/deserialize         | `@acceptance @serialization`                | acceptance.test.ts |
| Modulator with polarity -1 preserves polarity through round-trip          | `@acceptance @serialization`                | acceptance.test.ts |
| Multiple modulators targeting different edges all survive round-trip      | `@acceptance @serialization`                | acceptance.test.ts |

### [REF] Walking skeleton strategy

**Strategy A (Full in-memory)** — engine is pure domain with no driven I/O ports.
All scenarios use constructed Graph and SimState values. No adapters, no filesystem, no external services.

### [REF] Adapter coverage table

No driven adapters in the engine package. All behavior is exercised through pure function calls.

| Driving port                                 | Covered by                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| `inject(sim, graph, nodeId, strength)`       | Scenarios: post-clamp via signal arrival, inject-unclamped ceiling/floor |
| `step(graph, sim, dt)`                       | All constraint and signal propagation scenarios                          |
| `computeEffectiveWeights(graph, nodeValues)` | All modulator scaling scenarios                                          |
| `serialize(graph)` / `deserialize(blob)`     | All serialization scenarios                                              |

### [REF] Test placement

`packages/engine/src/acceptance.test.ts` — co-located with unit tests per existing engine convention.
Vitest config at `packages/engine/vitest.config.ts` picks up `src/**/*.test.ts`.

### [REF] Coverage gaps addressed

These scenarios fill gaps not covered by the existing unit test suite:

| Gap                                    | Existing coverage                                | New scenario                                                |
| -------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| Post-arrival ceiling clamp (step 6)    | Pre-clamp (step 1) tested in constraints.test.ts | ✓ post-arrival ceiling clamp                                |
| inject() unclamped contract            | Implicit only                                    | ✓ explicit inject-then-step test for both ceiling and floor |
| Delayed edge full lifecycle            | tick-counting tested in delay.test.ts            | ✓ inject→pending→release→destination changes                |
| Modulator polarity reversal comparison | +1 and -1 tested independently in sim.test.ts    | ✓ same source value with both polarities compared           |
| Modulator data in serialization        | v4→v5 migration only tests `modulators: []`      | ✓ polarity +1, polarity -1, multiple modulators             |
