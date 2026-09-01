# Antropy Release 3 — Implementation Plan

> **Status: complete — shipped as v0.3.0 (2026-09-02).** M0–M4.75 delivered as amended
> below; M5 closed on the recorded proxy-gap finding (seeds revert to the hand-derived
> backbone + heat reflex; derivation against in-vivo fitness carried to the backlog);
> M6 delivered auto-continue with survivor genetics (h²/N_e instruments carried to the
> backlog). Rule 6 holds on the master ledger for surface ≺ shelter; the vault's
> repricing is a recorded residual. See CHANGELOG v0.3.0, ADR-0011/0012, and
> docs/calibration.md for the measured record.

Build Release 3 from [docs/backlog.md](docs/backlog.md) ("bootstrap viability and the
living colony", Appendix B normative): a colony that boots, persists, and looks like a
colony — attacked bottom-up per §B.1 (world → interface → seed → incentives). Out of
scope: Appendix A's evolutionary machinery (Release 4), event detection/assay UI
(Release 5), reaction norms and inter-colony contact (Release 6).

## Confirmed decisions

- Follow Appendix B's spirit over its letter where they diverge; deviations recorded here
  and in ADRs. Design Rules 4–7 bind.
- Oracles are a diagnostic driver layer outside the controller contract (ADR-0009), with a
  per-ant policy override hook in the step loop used only by harnesses.
- Seeds are derived by an in-house diagonal-covariance ES against probe tasks and baked as
  a committed generated artifact; constructive seeds allowed only with rung-3 assays
  (ADR-0010). The derivation harness doubles as the §B.2.4 capacity probe.
- Viability ratios are computed from tunables + live world state in a sim-side module;
  hard preconditions (R7 closure, Design Rule 1) are asserted at world creation; the rest
  are logged live and charted in a compact readout.
- Known band violations fixed by recentering, not new mechanics: satiation R2 (smaller
  meals), scent horizon R3 (denser food + stronger beacon reach), rechecked against R1/R7.
- Liabilities: microclimate as a depth-attenuated surface-stress multiplier on basal
  metabolism (seasonal + diurnal phases); rain events destroy surface FOOD and wash
  surface-layer pheromone actives. Egg exposure exists; raids stay in Release 6.
- Merit accounting is audited for net-new-energy (B.7.2); today's credits (world-food
  delivery, trophallaxis surplus) are conservation-backed — gate with a fraud test
  (shuttle/re-deposit earns nothing) rather than rebuilding.
- Colony-state senses (§A.9.2): two inputs — own-colony stockpile fullness (gated by nest
  proximity) and nearby-brood fraction; INPUT_COUNT 24 → 26; checkpoint v3 refuses v2.
- Automatic continue is sim-side and deterministic: when colonies = 0 or ants < threshold,
  refound from the survivor genome pool (living ants + eggs), continuation counter
  tracked; the UI surfaces it.
- Tournament oracles: O-surface, O-shelter, O-architect (fixed chamber+gallery dig plan,
  navigation may cheat per ADR-0009); O-fortress as a deeper O-architect variant if cheap,
  else recorded as deferred. Rule 6 ordering and Rule 7 increment series are slow gates.
- h² regression and N_e estimation live in the stats module with rolling windows; charts
  minimal (values in the readout, full charting in Release 5).

## Context / reuse map

- Everything extends existing modules: `tunables.ts` (ratios inputs), `stats.ts`
  (instruments), `world.ts` (policy override, auto-continue), `senses.ts` (new inputs),
  `rnn.ts` (seed loading; backbone becomes one portfolio member), `energy.ts`
  (microclimate), `foodSpawner.ts`/`scent.ts` (rain), `colony.ts` (refounding),
  `checkpoint.ts` (v3). New homes: `src/sim/ratios.ts`, `src/sim/oracles/`,
  `src/sim/derive/` (ES + probes, dev-time), harnesses in the slow test tier.
- Sources of truth: Appendix B §B.2–B.9 tables and Design Rules; Appendix A §A.5.1/§A.9.2
  for portfolio and senses; ADR-0009/0010.
- Verify: `make test` per phase; slow gates for harness/tournament/acceptance; `make ci`
  + `make test-slow` at release close.

## Cross-cutting constraints

- Bottom-up order is load-bearing (§B.1): no phase blames a layer above one that hasn't
  passed its gate.
- Determinism and checkpoint coverage for every new world field (weather state,
  continuation counters, instrument windows are derivable/transient — decide per field,
  serialize what iteration order depends on).
- No hot-path allocation in per-tick additions (microclimate multiplier, ratio sampling).
- Reflexive bootstrap (Rule 4): every seeded bootstrap competence must be expressible with
  zero hidden state against the shipped sensors; probe tasks verify.
- Lint limits bind; harnesses and oracles decompose like sim systems.

## Milestones

### M0 — Viability ratios and diagnostics
The world becomes measurable before it is tuned.
- Ratios module computing R1–R7 from tunables and live state; bands; world-creation
  asserts for R7 and Design Rule 1; live readout in the UI (compact table) and stats.
- Circling instruments: per-input sensor histograms (sampled) and the gradient-visibility
  fraction.
- Recenter R2 and R3 (meal size, food density, beacon reach), rechecking R1/R4/R7.
- Exit: `make test` green; all ratios in-band at defaults and logged; ecology gates
  recalibrated to the new economy.

### M1 — Oracle ladder [depends on M0]
Fault bisection becomes possible.
- Policy-override hook in the ant step path (ADR-0009); rung-1 omniscient and rung-2
  sensor-limited oracles; rung-4 degradation wrapper (sensor noise, actuation lag).
- Exit: `make test` green; slow gates — a rung-1 oracle colony survives and delivers
  (world generosity), a rung-2 colony does the same through sensors alone (interface
  sufficiency).

### M2 — Calibration harness [depends on M1]
Tuning becomes measurement.
- Headless batch harness: sampled ratio vectors → short rung-2-oracle colony runs →
  survival/delivery ledgers; viable-region summary; identical run with seeded ants
  reporting the oracle-vs-seeded gap.
- Apply: defaults moved to the viable region's interior; persistence numbers recorded.
- Exit: harness runs as a slow-tier tool with a small in-CI smoke; defaults updated with
  measured justification.

### M3 — Liabilities and honest accounting [depends on M0]
The world charges for absence (Rule 5).
- Microclimate multiplier (depth × season/diurnal surface stress) in basal metabolism.
- Rain events: scheduled by rng seasonally; destroy surface FOOD, wash surface pheromone
  actives; egg exposure multiplier during rain.
- Merit fraud gate: shuttling/re-deposit earns nothing net (test), counter semantics
  documented.
- Exit: `make test` green; liability unit tests; ecology gates hold under liabilities.

### M4 — Strategy tournament [depends on M1, M3]
The world is tuned so building wins (Rules 6–7).
- O-surface / O-shelter / O-architect (+fortress variant if cheap) on the oracle layer;
  tournament harness scoring colony ledgers over a full seasonal cycle; ablation runs per
  liability; increment series O-dig(1/5/20/chamber).
- Tune liability shapes until the dominance ordering holds with margin in every phase and
  the increment series is monotone.
- Exit: slow gates — strict O-surface ≺ O-shelter ≺ O-architect each season phase;
  monotone increment series; ablations collapse their edges.

### M4.5 — Interface legalization and homing carrier [depends on M4]
The interface passes Appendix C's litmus tests.
- Fix the checkpoint determinism gate (divergence probe committed; infrastructure, not
  tuning).
- Remove HOME_ANGLE/HOME_DISTANCE (§C.8: nest-bearing sensor is illegal — no carrier,
  answer-shaped). Rename STRESS → TEMPERATURE (legal thermoreceptor, question-shaped name).
- World-side homing (Rule 10): write the governing inequality first (nest-scent detect
  radius ≥ typical forage trip distance), then author the nest field to satisfy it
  (emission strength/physics); backbone homing tether returns to nest-scent chemotaxis
  (ADR-0006 original form). Oracles keep cheating navigation (O-layer quarantine).
- Exit: `make test` green; rung-2 oracle homes and delivers via the scent carrier alone;
  ladder + ecology gates recalibrated; checkpoint gate green.

### M4.75 — Brood as capital [depends on M4.5]
The master ledger starts favoring underground living (ADR-0011 minimal fix; W-layer
lifecycle). Governing inequality (Rule 11): replacement cost of a worker (egg endowment +
larval feedings + rearing time) must exceed the insurance cost of shelter and stores, so
famine and exposure losses bind on worker-days.
- Larval stage between egg and adult: immobile at the nest, consumes stockpile feedings
  over a rearing period, dies (into FOOD, at a loss) if starved past a grace window;
  climate-keyed exposure applies to larvae as to eggs. Checkpoint bump.
- Recalibrate: R7/ecology gates, metapopulation assists, calibration sweep re-measured.
- Re-pin the tournament on the master ledger: worker-days ordering surface ≺ shelter with
  the sub-ledger gates retained; increment series re-measured.
- Exit: `make test` + slow tier green; tournament master-ledger gate holds;
  docs/calibration.md updated with the new economy.

### M5 — Derived seed portfolio and colony-state carriers [depends on M2, M4.75]
Initialization gets smart (ADR-0010); all authored behavior lives in seeds (S-layer).
- ES optimizer + probe tasks (gradient-follow, scent-homing, satiation-gated pickup,
  reflexive dig on temperature, trail deposit/follow); derivation harness baking the
  portfolio artifact (forager, digger, pheromone-reactive, wander, minority unstructured).
- Colony state as carriers, not scalars (§C.8): stockpile-fullness scent emitted at the
  queen, brood scent from eggs — world fields sensed like any scent; checkpoint bump.
- `seed()` draws from the portfolio (queen and each sperm independently); rung-3 assays
  per seed; chemotaxis and transport assays re-pointed at portfolio members.
- Exit: `make test` green; every portfolio seed passes its assay; in-world smoke shows
  differentiated behavior by patriline.

### M6 — Automatic continue, instruments, release close [depends on M5]
- Automatic continue (survivor-pool refounding, threshold + cooldown tunables,
  continuation counter, UI surface); h² regression and N_e estimate in stats with readout.
- R3 acceptance slow gate: one watchable seeded session with trails, digging, deliveries,
  differentiated patrilines, and no dead-world state (auto-continue engaged if needed);
  persistence re-measured by the harness.
- Docs: CHANGELOG v0.3.0, backlog retire, architecture update, plan completion note.
- Exit: `make ci` + `make test-slow` green; commit and push; CI green.

### Decisions needing your input

| Where | Decision you own |
| ----- | ---------------- |
| Brood-as-capital timing | Decided: pulled into R3 as M4.75 (user, 2026-09-02). |
| — | Resolved by Appendix C: HOME_ANGLE/HOME_DISTANCE are removed (nest-bearing ruled illegal, §C.8); O-fortress recorded as deferred. The M4 tournament gates are provisional sub-ledger gates (§C.4.1 sig. 4) until brood-as-capital lands. |
