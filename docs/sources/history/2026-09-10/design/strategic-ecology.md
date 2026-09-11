# Strategic microbial ecology

Approved September 10, 2026. Plan `c8d33225-63e2-4e48-960e-4ed88bbe4a87` owns this work.
The objective is inherited differentiation with explainable, context-dependent reproductive
advantages in one shared world. Variation counts and founder dominance do not establish that result.
This contract supersedes the single-food portions of bacteria.md and funded-bodies.md.

## World and resources

The periodic top-down plane remains. Two substitutable dissolved foods feed the same conserved
material/energy economy through independently built transport/processing pathways. Maintaining
both pathways costs material, maintenance and division investment. No food is a required key.
Uptake is simultaneous and supply-limited; the two requests share remaining intracellular storage.

Finite deposits have position, radius, separate A/B inventories, release rate, lifetime and arrival
delay. Seeded arrivals vary composition, size, persistence and location. Most occur near persistent
landscape clusters, with others scattered across the map. No source reads organisms or supplies
rescue food. Exhausted deposits wait before replacement. Expired inventory enters local detritus.
The patchy default includes short rich and long modest deposits; persistent/transient diagnostic
regimes change lifetime distributions, not infinite source semantics. Supply is accounted when
material arrives, not again when it leaks into the field. Initial inventories enter initial mass.
Dead bodies and decayed matrix enter detritus, which decomposes into food B. Spent metabolic fuel
remains a sink; recycling cannot restore dissipated energy.

## Body, interference and construction

Eight material stocks: core, motors, A processing, storage, B processing, defense, toxin production
and matrix production. Eight independent genetic targets control their newborn abundance. Existing
growth rules build actual machinery with material and energy; genotypes never grant capabilities.
Physical log targets are bounded, but are not a zero-sum allocation tuple.

One toxin species diffuses and decays. Dose produces scalar functional damage, reduced by actual
defense stock per core. Damage reduces propulsion and uptake and increases maintenance. At unit
damage the cell dies. Repair consumes nutrient replacement material and energy; displaced material
is recorded as waste. It restores function rather than creating structure. Damage and built stocks
are physically inherited at division. There is no free repair on birth and no lineage immunity.

Toxin and matrix synthesis require their installed machinery, precursor material and processing
energy. Signal secretion remains separate. All secretion requests share one affordable precursor
and energy budget with movement. The RNN chooses efforts independently.

Matrix is locally deposited material, without ownership. Density increases drag and reduces
diffusion. Dense matrix prevents entry by a body footprint, including during displacement and
division; embedded cells can move toward less obstructed space. There is no construction planner
or remote placement. Matrix binds a finite amount of toxin, becomes saturated, and decays. Bound
toxin remains material in the ledger; shrinking capacity releases excess toxin. Matrix blocks
builders as well as outsiders and can restrict nutrient access. Decay prevents permanent free walls.

## Sensor/action and inheritance contract

One float32 RNN has 35 inputs, 24 hidden values and eight outputs. The original nineteen input
positions remain; append B tonic/phasic/forward/left, toxin tonic/phasic/forward/left, matrix
concentration/forward/left, damage and built B/defense/toxin/matrix capacities. Four receptor
baselines belong to the individual. No coordinates, source labels, faction IDs or global state
enter inference. Matrix and toxin reads are body-local; existing contacts and task-byte remain.

Outputs retain swim, turn, signal, task value and task write, and add toxin secretion, matrix
secretion and repair effort. Repair competes with growth for resources. Passive uptake, affordable
construction and physical division remain physiology. No role dispatcher or combat target selector
runs beside the network. A documented weak founder uses ordinary mutable weights to respond to
both foods, avoid toxin, and express modest local secretion and damage-dependent repair.

Behavioral and physical mutation remain independent. The expanded genome starts near one randomly
selected behavioral locus per birth, with smaller perturbations than the previous 0.12 scale;
eight physical loci have a combined expectation of 0.2 selections per birth. This preserves a
useful starting controller while retaining variation. Acquired recurrent learning still transfers
at configurable retention, default one. Causal assays disable mutation and transfer. Their
diagnostic variants are not automatically promoted into the live population.

Checkpoint v5 and a new controller/genotype schema preserve all fields, inventories, damage,
stocks, RNG streams and histories. Earlier checkpoints are explicitly rejected, not upgraded.

## Competing predictions and bounded evidence

| Comparison | Predicted conditional advantage | Falsifier or competing explanation |
| --- | --- | --- |
| A versus B processing investment | Matching substrate repays pathway maintenance | Generalist wins regardless of composition, or throughput never limits acquisition |
| Fast versus economical movement | Short distant opportunities repay travel expense | Same speed wins everywhere; arrivals are effectively unreachable or inexhaustible |
| Toxin producer versus nonproducer | Local susceptible competitors make secretion useful | Only the producer loses resources; harm does not change resource access or reproduction |
| Defense with versus without toxin | Protection repays its maintenance only under exposure | Defense is a free advantage or fails to change damage/survival |
| Matrix with versus without exposure | Finite protection can repay construction near a persistent opportunity | Matrix never changes exposure, or blocks all food and reproduction |

Mechanics tests cover conservation, shared affordability, local causality, barriers, saturation,
damage inheritance and exact continuation. Short causal assays record acquisition, expenditures,
damage, survival and divisions in the existing ledger. A bounded combined live run checks active
reproduction and interference without certification by counts. Negative results are findings;
do not search indefinitely for favorable candidates. The initial evolutionary milestone is at
least two contrasting inherited designs with a measured reversal of advantage, not guaranteed
coexistence or spontaneous discovery in the first run.

## Delivery boundary

The combined ecology is the tick-zero paused Run default, with A/B food, toxin and matrix visible
and resource/damage/interference totals in stats. Existing controls remain. No browser assay or
development server is required. No training, contact weapon, dormancy, kin recognition, predation
rule, programmed construction shape or extra lifecycle is part of this implementation.
Modules own resources, deposit schedules, matrix transport, interference and secretion separately;
the kernel orders them and conservation/persistence span the shared durable state.

## Implementation and measured results

Implemented September 10. The initial, pre-correction panel uses injury rate 0.05, repair rate
0.08, enabled neutral secretion and solid matrix. It contains 40 cases on seeds 201/202, each bounded to
1,200 ticks (240 model seconds), with early termination on extinction. Runs 2842–2882 include
the interleaved default run 2858. Each diagnostic begins with the same reference founder stocks;
changed genetic targets must develop through paid growth. Processing fixtures keep total target
A/B machinery equal and vary its distribution. Constant-effort diagnostic controllers are ordinary
RNN genomes, stored in the complete initial checkpoint. No external action override runs per tick.
Mutation and private learning/transfer are disabled in these causal fixtures.

| Comparison | Seed 201 living at endpoint | Seed 202 living at endpoint | Interpretation |
| --- | --- | --- | --- |
| Food A: A specialist / B specialist / generalist | 33 / 29 / 31 | 34 / 26 / 32 | Matching pathway beats both alternatives |
| Food B: A specialist / B specialist / generalist | 29 / 36 / 31 | 26 / 34 / 32 | Reversing food reverses specialist ranking |
| No toxin: low / high defense | 38 / 30 | 31 / 27 | Defense delays reproduction when unnecessary |
| Toxin: low / high defense | 0 / 35 | 0 / 40 | Defense prevents extinction under the declared exposure |
| No toxin: nonbuilder / builder | 39 / 9 | 31 / 10 | Matrix production has a substantial cost |
| Toxin: nonbuilder / builder | 0 / 8 | 0 / 9 | Matrix protection permits survival; not rapid growth |
| Producer / susceptible nonproducer, together | 8 / 0 | 8 / 3 | Local toxin changes the competitive outcome |
| Producer / resistant nonproducer, together | 6 / 18 | 8 / 14 | Resistance removes the producer's advantage |
| Local food: fast / slow controller | 19 / 4 | 22 / 11 | Proposed slow-movement advantage fails |
| Distant pulse: fast / slow controller | 4 / 2 | 4 / 2 | Faster movement wins this case too |

Both competing genotypes in the producer assays start with four organisms. Other fixtures start
with eight, except travel fixtures which start with one. Defense/matrix exposure fixtures use a
finite initially distributed toxin field with decay disabled to isolate exposure; they do not
claim these are naturally generated conditions in the default population. Matrix production is
continuous in its diagnostic genotype. This establishes a cost/protection mechanism, not an
evolved ability to choose construction sites or investment timing.

The travel comparison changed controller propulsion while retaining the same initial motor
machinery. It does not establish a low-motor-body advantage. Local depletion, reproductive
crowding and failure to leave a patch remain competing explanations of the slow controller's
loss; no motor retuning or additional candidate search followed the failed prediction.

A final barrier review found that contact displacement could skip a thin matrix strip if only its
destination was checked. Swept footprint checks now cover the full displacement, with a bounded
regression test. The eight affected matrix cases were repeated as runs 2883–2890 with identical
endpoint counts to the table. The final Run default was repeated as 2891 and matches 2858.
Other causal cases produce no matrix, so their outcomes do not depend on the changed barrier path.

## Combined default and limits

**Readiness rejected by the user.** The implementation plan closed prematurely. Follow-on plan
`e04af0f4-38dd-4a84-acd5-989bf2c22b0e` requires consequences in the ordinary Run default, or an
explicit reason to disable a mechanism there. Secretion totals alone do not meet that boundary.

The initial founder repairs approximately `0.24 * damage` per model second at low damage, while
its reference defense divides incident damage by three. Even saturated toxin can therefore be
countered at about seven percent damage; actual exposure is much lower. The correction tests a
tenfold faster injury rate (0.5) and tenfold slower maximum repair rate (0.008), holding secretion,
sensing, defense, founder weights and supply fixed. At free toxin concentration 0.0019 the new
reference injury rate is about 0.0118 per second, above maximum repair; leaving exposure or
binding toxin now matters. This is a model timescale calibration, not a measured biological rate.
The prediction is sustained impaired cells and a change in survival/reproduction when injury or
matrix binding is removed. A default assay records those ablations and spatial consequences.

Dense impermeable walls are disabled in the default: ordinary production is over tenfold below
their threshold and there is no demonstrated wall-building behavior. The explicit solid-matrix
configuration remains experimental; default matrix is a porous, toxin-binding deposit with drag.
Neutral signal secretion is also disabled: no founder motor output uses its readings, and no
communication benefit has been established. Its sensor/action interface and optional configuration
remain available. Toxin and matrix remain separate chemical actions. These are simulation settings,
not merely hidden rendering layers.

Run 2891 grows 48 founders to 201 living cells through 3,000 ticks, with 155 divisions, generation
three and no original founder organisms remaining. Both processing pathways operate: 725.55 units
of A and 766.22 of B are absorbed. Cells produce 28.84 toxin units and 138.82 matrix units;
38.02 matrix units remain after decay. Repair dissipates 34.21 energy units and counters most
exposure. Two cells starve; none dies from toxin in this horizon. Seven finite deposits remain
active. No dense barrier blocks movement: maximum endpoint matrix density is 0.114 against the
1.5 barrier threshold. Default construction is porous material, not demonstrated walls.

These measurements establish active ecology and conditional advantages for constructed inherited
designs. They do not establish spontaneous specialization, stable coexistence, strategic wall
construction, a successful slow-cell niche, or long-term adaptation in the combined population.
Human trajectory review remains open. No diagnostic genotype was installed in the default.

Maximum sampled/default energy residual is below `2.83e-10`, material residual below `9.21e-11`.
All runs have matching before/after source digests. Initial panel digest:
`f255cb4dc4905cdd029f20e61213ca9ae043dc208ead0d98f9821f6f85779fdc`.
Final matrix/default digest:
`9c86fa6bb3bba6902a33a7fd9b11ec06e2cefe783dbb2fe925fd6eb64d635eb8`.
The final build and `make ci` pass, including 68 bounded tests in 14 files. No browser simulation
or development server was launched. Local artifacts are under
`frontend/harness/artifacts/strategic-ecology-2026-09-10/`; ledger rows preserve the outcomes and
initial causal checkpoints. Checkpoint v5 deliberately rejects earlier saved worlds; reload the
page for the new default rather than importing an old world.

## Corrected default: observed consequences

Runs 2892–2897 measure seeds 101/102 through 3,000 ticks (600 model seconds). Each seed starts
the ordinary Run configuration, then independently disables injury or matrix binding. Neither
control removes secretion or its costs. Environment arrivals and initial founders are identical;
subsequent motion, birth timing and mutation histories can diverge. These are whole-world causal
comparisons, not matched descendant-genotype competitions.

| Seed | Configuration | Living | Divisions | Damage deaths | Repair energy |
| --- | --- | --- | --- | --- | --- |
| 101 | Run default | 195 | 148 | 0 | 309.64 |
| 101 | Injury disabled | 205 | 163 | 0 | 0 |
| 101 | Matrix binding disabled | 138 | 140 | 35 | 760.59 |
| 102 | Run default | 188 | 145 | 0 | 246.12 |
| 102 | Injury disabled | 190 | 151 | 0 | 0 |
| 102 | Matrix binding disabled | 162 | 135 | 1 | 616.32 |

Matrix slows occupied cells by at least 20% from the tick-300 sample in both defaults, with
sampled peaks of 65 and 46 affected cells. Damage exceeding 20% first appears at sampled ticks
1,900/2,200; the sampled peaks are 16/5 impaired cells. At the requested UI rate of 30 ticks/s,
these correspond to matrix effects within ten seconds and impaired cells within approximately
one minute. Actual wall time depends on delivered throughput. Impairment is episodic rather than
permanent; endpoint counts alone would miss most of it.

The retained default matrix has a demonstrated protective consequence: removing binding raises
damage, repair expenditure and deaths in both worlds. Default toxin reduces reproduction and
causes visible impairment, but causes no deaths in these protected populations during this horizon.
It is not a demonstration of lethal combat, evolved defenses or strategic construction. Solid
walls and neutral signaling remain explicitly disabled, rather than advertised as running features.

The toxin overlay now scales brightness by injury relative to maximum reference-body repair,
instead of receptor sensitivity. This exposes harmful concentrations without changing the field
or what cells sense. Red interiors mark damage above 20%; ochre identifies porous deposits.
Stats report affected cells directly. The default remains paused at tick zero with the same
heritable founder RNN, no diagnostic genotype promotion and no extra behavioral dispatcher.

All six runs have matching before/after source digest
`34e6c23a5f93cdb2562234a4a119122193010c7dff680c832320c87bf1530098`.
Maximum energy/material residuals are below `7.20e-10`/`8.32e-11`. Spatial artifacts preserve
positions, damage, finite deposits and free/bound toxin and matrix fields under
`frontend/harness/artifacts/consequential-default-2026-09-10/`. Subsequent edits change the toxin
display scale and test fixtures only; simulation mechanics remain those measured here.
`make ci` passes 69 tests in 14 files and `make build` passes. No browser simulation or server
was started. These results establish observable mechanisms and explain the disabled scope;
they do not certify trajectories or spontaneous adaptive differentiation.
