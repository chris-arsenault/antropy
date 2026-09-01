# Backlog

Planned-but-not-built work, grouped by release. Each item is a positive assertion of
future-state behavior. Scope derives from the [design spec](design-spec.md) as amended by
[Appendix A](ant-sim-appendix-a.md) (evolutionary dynamics) and
[Appendix B](ant-sim-appendix-b.md) (bootstrap viability), both normative. Every release
honors the binding constraint of §9: no architectural decision may preclude colony
mortality/refounding, nest decay, or oscillating carrying capacity.

The MVP ("selection visible in one session") shipped in v0.1.0 and Release 2
(metapopulation and recurrent regimes) in v0.2.0 — see
[../CHANGELOG.md](../CHANGELOG.md) and [architecture.md](architecture.md).

## Release 3 — shipped residuals

Release 3 shipped (v0.3.0): viability ratios and diagnostics, the oracle ladder,
calibration and tournament measurement (harness + ledger, ADR-0012), the liability world
(microclimate, climate-keyed egg exposure, storms, famine troughs), brood-as-capital
larval rearing, physical hoarding with larder restock, interface legalization
(nest-plume homing, thermoreceptor), the heat-escape instinct, and automatic continue
with survivor genetics. Residuals carried forward:

- Derive founder seeds against in-vivo colony fitness with parallel evaluation
  (probe-suite derivation aced probes and failed in vivo five times — the recorded
  proxy-gap finding; ledger runs 23–34).
- Ship the seed portfolio (forager-forward, digger, wander-heavy, pheromone-reactive,
  unstructured minority) once derivation transfers; validate each with rung-3 assays.
- Reprice deep architecture: the vault currently buys brood protection at a net
  worker-day loss (docs/calibration.md); harsher climates or raid pressure should make
  depth pay on the master ledger.
- Add the two cheap health instruments (§A.11): live parent–offspring heritability
  regression and realized effective-population-size estimate with an alarm below 10².
- Convert the succession/merit counter to net-new-nest-energy accounting where it still
  counts events rather than energy (anti-Goodhart, §B.7.2).

## Release 4 — evolutionary machinery (Appendix A core)

The depth work that makes long-run evolution real once colonies are worth watching.

- Implement evolved synaptic plasticity with genomic reward wiring (§A.8): per-connection
  plastic traces with neuromodulated Hebbian updates and Oja decay, class-shared
  plasticity gains, evolvable reward-wiring vector, strictly positive plasticity metabolic
  cost (anti-masking), traces dying with the ant (Darwinian; Lamarckian flag default off).
- Implement convention-aligned recombination (§A.4.2 Algorithm 1): hidden-unit assignment
  matching inside `recombine` — promoted to prerequisite once plasticity lands.
- Implement σ-collapse countermeasures (§A.4.1): hard σ floor, log-normal meta-mutation,
  and hot eggs (~1% of eggs at hot σ).
- Implement invasion events (§A.5.3): periodic founding queens carrying fresh portfolio
  draws or mutated historical-checkpoint genomes.
- Reduce the nest-plume scent cost (measured ~3x on long runs: the slow-evaporation
  plume holds a large active set per colony and multiplies with founded colonies) —
  e.g. a coarser plume lattice or a lower step cadence with adjusted physics, validated
  against the homing detect-radius inequality.
- Emit colony-state scents as carriers if not landed in Release 3 M5 (Appendix C §C.8:
  stockpile-fullness at the queen, brood scent from eggs).
- Make worker-laid-male gene flux material and tune the succession weighting exponent
  against the N_e alarm (§A.3.5).
- Extend the assay protocol to naive-vs-experienced clone pairs (§A.8.3), decomposing
  competence into innate and learned components per lineage.

## Release 5 — watching at scale (§11.2, §11.3, §11.4, §A.11)

- Implement event detection with a timeline: colony founded/died, lineage share thresholds,
  gene-mean excursions, depth/spoil records, per-region r/K regime transitions, with
  optional auto-slowdown and camera moves.
- Implement headless burst mode for overnight runs and replay-from-checkpoint at 1×
  (shares infrastructure with the Release 3 sweep harness).
- Implement two-gene scatter plots colored by lineage.
- Implement offline behavioral assays: clone a genome into an isolated arena with
  controlled stimuli (controller-agnostic).
- Add the remaining Appendix instruments: distance-from-seed in weight and behavior space
  (§A.5.4), cross- vs. within-colony offspring survival ratio (§A.4.2 Design Rule 3), and
  per-lineage reward-wiring vectors as first-class charted genes.

## Release 6 — emergence layers (§8 as amended by §A.9, §13.5)

- Implement genomic developmental reaction norms (§A.9.1) in place of the authored
  feeding→size caste dial: each physical trait an evolvable function of larval feeding,
  incubation depth, and maternal signal, with evolvable developmental noise; morphs are an
  evolved outcome (sigmoidal norm variant only if linear norms measurably cannot express
  bimodality).
- Implement inter-colony contact consequences, opening selective room for raiding and
  soldier morphs.
- Add soil/water ecosystem heterogeneity (reserved `WATER` and soil material IDs, rain
  accelerating nest decay).

## Release 7 — second controller (§2.2, §2.3, §A.8.4)

- Implement the linear genetic programming controller behind the controller contract, with
  its own inheritance model, per-instruction energy cost, and architected plastic
  registers gated by the same evolvable modulation signal.
- Add a WebGPU compute path for the RNN controller.

## Performance debt (§A.10 deltas)

The active-set scent fields, bounded decay set, and noalloc hot path already satisfy the
compute discipline in spirit; the remaining named deltas:

- Move pheromone decay to lazy per-voxel evaluation (Algorithm 3) if active-set sweeps
  show up in profiles at scale.
- Move tunnel decay to an event-scheduled priority queue keyed by last-traffic time if the
  cavity sweep shows up in profiles.
- Migrate ant storage to structure-of-arrays layout when population targets exceed ~10³.

## Platform

- Add cloud-stored checkpoints (activates the Ahara ALB/database/Cognito integration steps
  for syncing overnight runs across machines).
