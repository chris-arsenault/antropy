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

## Release 3 — bootstrap viability and the living colony (Appendix B)

Goal: a colony that boots, persists, and looks like a colony — trunk trails, role
differentiation, brood tended in chambers, digging that pays — built bottom-up through
Appendix B's diagnostic order (world → interface → seed → incentives) rather than by
hand-tuned instinct weights. This subsumes the earlier ad-hoc calibration/sweep items.
Evolutionary-machinery depth is deliberately deferred to Release 4.

### Viability ratios and diagnostics (§B.3, §B.6)

- Express the world economy as the seven viability ratios (trip profitability, satiation,
  scent horizon, foraging radius, trail persistence, dig economics, ecosystem closure),
  derive their bands, set defaults at band centers, and log every ratio live so
  out-of-band drift is glance-visible. (Known violations to fix on arrival: satiation
  R2 is ~0.8 against a 0.1–0.3 band; scent horizon R3 is far below 1.)
- Add the circling-checklist instruments (§B.6): sensor histograms and the
  gradient-visibility map (fraction of map area with a resolvable scent gradient).

### Oracle ladder and calibration harness (§B.4, §B.5)

- Implement the oracle ladder: omniscient, sensor-limited, seed-assay, and degraded
  scripted cheat-agents driving the real body/world API, so faults bisect between world,
  interface, seed, and evolvability.
- Build the headless calibration harness: Latin-hypercube batches over ratio vectors with
  rung-2 oracle colonies, viability-polytope characterization, defaults at its Chebyshev
  center — then the identical harness with seeded-RNN ants, so the oracle-vs-seeded gap
  quantifies the behavioral shortfall (subsumes long-horizon persistence calibration).

### Liabilities and construction economics (§B.7, §B.8)

- Add microclimate stratification (metabolic cost by depth × season/diurnal phase) and
  weather events (rain destroys surface stockpiles and washes surface pheromone); egg
  exposure exists. Raid pressure stays staged with inter-colony contact (Release 6).
- Convert the succession/merit counter to net-new-nest-energy, conservation-accounted
  (anti-Goodhart, §B.7.2).
- Implement the strategy-spectrum oracle tournament (O-surface ≺ O-shelter ≺ O-architect,
  every season phase, with margin; surface survivable-but-inferior — Design Rule 6),
  with ablation worlds per liability and the increment series verifying concave
  construction payoff from the first voxel (Design Rule 7).

### Seeded-construction pipeline and portfolio (§B.9, §A.5.1)

- Derive founder seeds by CMA-ES against the probe ladder and oracle-targeted assay
  episodes instead of hand-written weights ("the run has no fitness function;
  initialization is allowed to be smart"); validate every seed with the rung-3 assay.
- Ship the seed portfolio from derived seeds: forager-forward, digger (reflexive dig
  triggers + stigmergic dig-site bias), wander-heavy, pheromone-reactive
  (trail-recruitment: deposit while homing fed, follow while seeking), plus a minority of
  unstructured draws — behavioral-hypothesis diversity and visible division of labor.
- Add colony-state sensory inputs (§A.9.2): stockpile scent, larval-hunger scent, and
  congestion — the demand signals seeds and oracles condition on.

### Run continuity and health

- Add automatic-continue mode: when the last colony dies or the ant count drops below a
  threshold, increment the seed and force-spawn a new colony whose queen and sperm draw
  from the genome pool of the pre-trigger population (survivor genetics carry forward),
  so long runs never end in a dead world.
- Enforce Design Rule 1 (§A.3.3): season period at least 10× genome-generation time,
  asserted at world creation.
- Add the two cheap health instruments (§A.11): live parent–offspring heritability
  regression and realized effective-population-size estimate with an alarm below 10².

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
