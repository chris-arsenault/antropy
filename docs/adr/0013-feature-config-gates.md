# 0013 — Feature gates so build phases are data, not code

- Status: Accepted
- Date: 2026-09-02

## Context

The design spec (§13) orders the build so failures are attributable: world core →
ecology with frozen genetics → evolution → recurrent regimes (decay, seasons) →
emergence layers (microclimate, larval castes, weather). Implementation ran that order
backwards — evolution and later-phase liabilities landed while the Phase 2 base case
("balance the ecology with ants whose behavior is known") was never established. With
every system hard-wired on, the base case could not be isolated: the founding nest
decayed onto the queen, digging was buried under stochastic evolution, and there was no
way to answer "does an ant dig and store in this world at all" without editing code.

## Decision

A `SimConfig` of boolean feature gates (`src/sim/config.ts`) is attached to each world
and checked at every later-phase system's entry point: `mortality`, `reproduction`,
`terrainDigging`, `broodTransport`, `motorJitter`, `nestDecay`, `seasons`, `weather`,
`microclimate`, `eggExposure`, `larvalRearing`, `autoContinue`, `wideEntranceShaft`, and
`spoilHauling`. Numeric constants
stay in `tunables.ts`; for example, `broodTransport` is the gate while
`BROOD_TRANSPORT.eggCapacity` is the capacity magnitude, while `motorJitter` gates the generic
per-ant turn perturbation whose amplitude lives in `MOTOR_JITTER`. Two presets ship: `FULL` (everything,
the Release 3
behavior) and `PHASE2` (the spec's base case — world core, ecology, and digging on;
every later-phase liability off, ants immortal and non-reproducing). `createWorld` takes
a config (default `FULL`) and stores a per-world copy; checkpoints serialize it. The
harness selects a preset with `--config` and toggles single flags with `--flag key=bool`.

## Alternatives

- **Hard-wired systems (status quo):** rejected — the base case was inextricable, which
  is the root cause of building the phases out of order.
- **JSON config file loaded at runtime:** deferred; a typed preset module is editable
  without touching logic and keeps the deterministic sim in TypeScript. A JSON loader can
  wrap `applyConfigOverrides` later if a UI needs it.

## Consequences

- The Phase 2 base case is runnable and observable with
  `pnpm harness run --driver rung1 --config phase2`. Its long-horizon outcomes belong in the
  harness ledger rather than a timed Vitest assertion; bounded mechanics remain unit-tested.
- Later-phase features (microclimate, weather, larval rearing, brood-as-capital) are the
  designer-added complexity from earlier releases; they remain available but are no longer
  mandatory, so work can proceed bottom-up per §13.
- Default `FULL` continues to mean every implemented system is enabled.
