# Bacterial implementation and initial measurements

September 9, 2026. The [reviewed contract](bacteria.md) is implemented. The browser starts paused
at tick zero with 48 RNN cells, persistent nutrient patches and live mutation. No training was used.
The initial panel establishes resource-funded reproduction, starvation and heritable variation.
It does not establish reliable adaptation, chemical cooperation or visually acceptable motion.

These are checkpoint-v1 measurements. The subsequent [architecture correction](../adr/0018-bacterial-runtime.md)
separates genetic draws from body randomness in checkpoint v2. The v1 mutation/control arms changed
unrelated physical draws as well as weights; census differences therefore do not isolate mutation.
The recorded reproduction/resource balances remain evidence for v1, and no new ecological panel
or adaptation claim is implied by the correction. Physical parameters and founder weights are unchanged.

## Default physics and founder

The periodic world measures 80 × 60 distance units, with one field cell per unit and dt = 0.2 model
seconds. Birth biomass is 1 resource unit and radius 0.45; division biomass is 2. Maximum speed
is 1.5 distance units/s. Eight Gaussian nutrient sources each supply 0.3 resource units/s with
radius parameter 3. Transient sources relocate every 60 model seconds; existing nutrient remains.
Nutrient diffusion is 0.3 distance units²/s and decay is 0.001/s. Released chemical diffusion is
0.15 and decay is 0.035/s. Receptor adaptation time is 2 s, with reference concentrations 0.3
for nutrient and 0.02 for chemical. Full parameters are in each ledger row and checkpoint.

Maximum-speed travel across one source radius takes 2 s, versus the transient lifetime of 60 s.
Maximum uptake is 0.2 resource units/s per unit biomass. Total source input is 2.4 units/s, so twelve
saturated birth-sized cells could consume all incoming supply; ordinary cells are not continuously saturated.
Per-unit-biomass motor costs are 0.015/s at full swimming effort and 0.008/s at full turning
effort, plus 0.006/s basal maintenance per unit biomass and 0.001/s controller cost per cell.
At birth mass, full swimming and turning cost
0.023/s versus maximum uptake 0.2/s. Growth and division impose additional resource costs.

The 597-parameter founder RNN encodes a nutrient-contrast turn response, reduced propulsion in
high nutrient, contact steering and weak nutrient-associated secretion. These are ordinary mutable
weights. Chemical inputs exist but the founder has no chemical steering response. The task byte
is written from network output and has no kernel semantics. No external reflex, task dispatcher,
map access or fitness scorer runs alongside the RNN.

Mutation independently perturbs each weight with probability 0.005 by a uniform value in
[-0.12, 0.12], bounded to [-16, 16]. This averages about three changed parameters per daughter,
so almost every birth can have a unique genotype. Distinct-genome count therefore does not measure
meaningful strategy diversity. Hidden state and task byte reset at birth; weight ancestry persists.

## Reproduction and inherited variation

Baseline run 2815 used mutation-disabled founders for 3,000 ticks. Population changed from 48 to
77, with 147 divisions and 118 starvation deaths. Conservation residual was below 4 × 10⁻¹⁰.

The following runs lasted 6,000 ticks, or 1,200 model seconds. Each started with 48 founders and
840 total resource units, and received 2,880 external units. A division replaces one parent with
two daughters, so final population equals 48 + divisions - starvation deaths. Birth counts include
both daughters. All four evolving runs reached generation 4 or 5 and ended with living cells.

| Regime | Seed | Mutating run | Living | Divisions | Starved | Mutant births | Mutation-off run | Living control |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Persistent | 101 | 2816 | 111 | 193 | 130 | 364 | 2820 | 104 |
| Persistent | 102 | 2819 | 100 | 186 | 134 | 354 | 2823 | 98 |
| Transient | 101 | 2817 | 91 | 203 | 160 | 382 | 2821 | 96 |
| Transient | 102 | 2818 | 96 | 222 | 174 | 419 | 2822 | 90 |

Final absolute energy residuals across these runs were below 3.2 × 10⁻⁹. Run 2816 emitted 20.70
chemical units and retained 0.275 after decay, with chemical balance residual below 5 × 10⁻¹⁴.
This establishes paid emission and transport, not useful communication. Mutation did not consistently
increase final census relative to its matched control.

## Ancestor/descendant competition

From persistent-seed-101 checkpoint 2816, genotype 47 was selected after counting descendant
clades. Five living cells descended from it, the largest non-founder clade in that sample.
This is post-hoc diagnostic selection, not proof that it was the best genotype. It was not
installed as a new browser founder.

Run 2824 compared that observed genotype against ancestor 1, with mutation disabled, 24 founders
of each, held-out seeds 201 and 202, and both assignments to the same initial positions. Each
competition lasted 3,000 ticks. Values are final living descendants.

| Regime | Seed | Assignment swapped | Ancestor | Genotype 47 |
| --- | ---: | --- | ---: | ---: |
| Persistent | 201 | No | 37 | 39 |
| Persistent | 201 | Yes | 34 | 42 |
| Persistent | 202 | No | 42 | 42 |
| Persistent | 202 | Yes | 45 | 36 |
| Transient | 201 | No | 39 | 34 |
| Transient | 201 | Yes | 34 | 41 |
| Transient | 202 | No | 38 | 41 |
| Transient | 202 | Yes | 31 | 48 |

Persistent totals were 158 ancestor versus 159 descendant; transient totals were 142 versus 164.
The descendant performed better in three of four transient placements, but not every placement.
This small panel is suggestive of an environment-dependent effect and insufficient to establish
reliable adaptation. Longer-term persistence, independent evolutionary replicates and behavioral
attribution are unmeasured. No additional tuning or training followed this result.

## Capacity and verification limits

Run 2825 initialized 2,000 cells on the standard field, mutation disabled, for 100 ticks. On an
Intel Core i5-8500 at 3 GHz it took 10,093.9 ms, approximately 100.94 ms/tick or 9.91 ticks/s.
There were no births or deaths in that short interval. Initial reserves funded this load probe;
it does not demonstrate sustainable 2,000-cell ecology. It falls below the default 30 ticks/s
target. The 6,000-tick ecological runs took roughly 15.5–17.1 seconds each while concurrent Node
processes ran. These timings are not browser frame-rate measurements.

Bounded tests cover conservation, field transport, receptor response, local sensor causality,
periodic contact, paid secretion, fair uptake, inheritance, capacity pause, exact checkpoint
continuation and tick-zero UI defaults. The user performs visual review; no browser simulation
or development server was started. Report final build/CI results at handoff separately from
ecological outcomes.

The contact solver performs four local separation passes and is not a rigid-body solver. The
distance ledger measures commanded propulsion displacement before contact correction, not net
progress. Genotype and organism ancestry archives grow with cumulative births; long-duration
memory behavior is unmeasured. The population safety cap pauses the world instead of culling.

## Evidence and next boundary

Ledger rows 2815–2825 are in `frontend/harness/ledger.db`. Local generated evidence is under
`frontend/harness/artifacts/bacteria-2026-09-09/`, grouped into baseline, evolving/control regimes,
competition and capacity directories. Run summaries include sampled body trajectories; checkpoints
preserve ancestry, genomes, receptor state, private memory, fields and resource accounts.
Each ledger row records resolved parameters and source digest. During this development panel,
formatting and module factoring continued while runs executed; no ecology parameters changed.

The implementation and initial measurement plan ends here for human visual review. The default
already exposes reproduction and mutation through Run and stats. Reliable adaptation and useful
chemical interaction remain questions, rather than claimed deliverables or reasons to add more
ecological subsystems automatically.
