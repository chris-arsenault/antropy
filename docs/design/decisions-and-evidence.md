# Design decisions and evidence

This is the decision record for the current [work order](README.md), through physical v59. The
[composed runtime](chemistry/composed-runtime.md) owns equations; linked studies retain their
original versions, controls and failures. Completed implementation does not guarantee a
particular evolved community. Execution records remain in the [plan archive](../plans/README.md).
The [design directions registry](directions.md) lists every direction with its status.
Superseded entries stay in place with a dated note.

## Binding strength and secondary food — November 3

The user clarified the outcome: cells should create and exploit sustaining nonstarting inputs
through waste reuse or altered reservoir supply. Different reaction products and improved
extraction from original food do not answer that question. The prior November 3 processing
comparison remains a benefit result, but was wrongly emphasized as progress on that outcome.

The finite-site partition coupled chemical preference to total binding strength. At lambda6
and founder bias-7, reducing all eight preference magnitudes from1 to0.75 changed the total
occupied fraction from0.99753 to0.002475. A preference intermediate therefore required a
compensating bias change to preserve functional binding, in addition to sharing finite capacity
among its recognized chemicals. The design described strength and preference as separate roles
but the implemented coordinates did not separate them. This is a demonstrated access barrier,
not an established sole cause of founder-food dependence.

V59 normalizes conditional preference separately from occupied fraction. The reference partition
is derived from the unit-weight domain endpoints, preserving existing founder profiles. Bias
controls total occupied fraction; weights redistribute it. Broad recognition still divides one
finite capacity, including protection, and incurs all ordinary physical consequences. All
seventeen sites share the same law. The common heavy-tail mutation, supply, costs, exact enzyme
actions and body accounting are unchanged. The startup-only `bindingIndependentStrength=false`
ablation retains the coupled law. Compiled sharing/invalidation and all physical consumers use
the selected mode; its persisted configuration requires v59 checkpoints without migration.

In the matched constructed two-cell world, the producer converts0→136 and the recipient uses
136→128. Both have ordinary paid actions, identical role-zero bound packets, empty initial free
inventory and initial usable work0.5; only chemical0 is supplied in a finite pulse. The recipient
has preference magnitudes0.75 at unchanged bias-7. At200 model seconds, normalized recognition
leaves three recipient descendants with net biomass+6.065 and net funded work+5.775. The
coupled recipient starves at43 seconds with no growth. Producer-conversion-off and
recipient-enzyme-off controls also starve. This isolates a sustaining consequence for a
constructed preference intermediate. It does not demonstrate that ordinary evolution discovers
the complete recipient or a persistent secondary economy. Different stopping times are retained;
the sustaining claim does not come from comparing unequal lifetime uptake totals.

A frozen public-operator comparison omits only the cell-body chemical contribution to a168
reservoir's medium while preserving body material, source stock, load and light. Held inventory
and future boundary change differently, with closed physical accounts. The effect is small in
this four-founder context and establishes no sustaining beneficiary advantage. Current-world
budgets also find substantial nonstarting material already available, poorly matched by most
cells' import and enzyme capabilities. No additional reservoir law or amplified deposit feedback
is selected. The repair addresses secondary access; advantageous evolved reservoir modification
remains unestablished.

The matched ordinary seed27 comparison retains the32/168 recipe, ordinary mutation, learning,
terrain, costs and all features. After3,600 model seconds, covering two nominal batch-plus-wait
durations, the repaired arm has29 cells,74 divisions and93 deaths; the coupled arm has4 cells,
10 divisions and54 deaths. These are one pair of histories whose later random opportunities
diverge, not independent replicates or proof of long-term replacement. Neither arm goes extinct
or fails physical validation. They do not establish evolved waste feeding.
At this endpoint neither arm's living cells records any nonstarting-substrate conversion;
the observed reproduction improvement is not secondary-food adoption.

Existing phenotype and chemical-web windows now attribute accepted usable capture, uphill
spending and external transformation work to reaction substrates. Starting/nonstarting totals
use the resolved founder circuit and source species together. These are work flows, not unique
molecule provenance, fuel-only chemical potential, net profit after every expense, or proof of
cross-feeding. Existing expense, growth, overflow and descendant observations remain necessary
for a sustaining claim. The new reductions are bounded and outside physical serialization.

Reproduction uses `cargo run --release --manifest-path engine/Cargo.toml --example
secondary_economy -- probe NEW_LOCAL_DIRECTORY`, `reservoir NEW_LOCAL_DIRECTORY`, or
`ordinary config/alternative-founder-chemistry-4.json NEW_LOCAL_DIRECTORY`. A checkpoint and new
JSON path select the zero-tick local opportunity budget. Registrations, raw outputs, original
negative arms and checkpoints remain ignored under `frontend/harness/artifacts/secondary-economy-*`.
Local implementation and authorized normal-pipeline delivery are tracked in the
[repair plan](../plans/SUSTAINING-CHEMICAL-ECONOMY-PLAN.md).
Publication `238db80` completed through the normal pipeline. Live readback confirms a fresh
32/168 v59 world with the repair and ordinary features enabled, nonzero mutation and a durable
compatible checkpoint. The deployed public chemical window returns the new input-work accounts.
This operational delivery does not establish evolved secondary-food adoption.

## Alternative starting chemistry — October 31

The user requested removing identities 0 and 128 completely from initial material, with
different reservoirs and founder enzymes. V58 coordinates founder recognition, exact actions,
cellular free/bound material and finite priming through `founderCircuit`; reservoir contents
and incoming supply use `sourceSpecies`. This changes initial conditions without banning
later production of either identity or changing runtime laws.

The first seed 27 trial used circuit 17→81→85→21→17 and reservoirs 17/85. It paid for uptake,
reactions and growth but all 48 founders starved before any division; the last died at tick
14,606. At the tick 1,888 checkpoint, most survivors had nearly full usable energy but little
free inventory, and only one had reached division size. Positive analytical processing
margins therefore did not establish a founding population capable of replacement. No offspring
existed to mutate, so this result cannot describe an evolutionary preference for identities
0 or 128. Both remained absent from dissolved material at that checkpoint.

The selected replacement is circuit 1→129→137→9→1 with reservoirs 1/137. Its chemical
properties are closer to the original circuit, while recognition targets and the vertical
enzyme actions differ. It also starts with exactly zero material of identities 0 and 128.
All other operating settings, including mutation, costs, supply quantities, terrain, learning
and feature participation, remain unchanged. At tick 4,233 it had six divisions, twelve deaths
and 42 living cells, with ordinary external reservoir refills underway. This establishes
initial reproduction under the replacement chemistry, not sustained viability or a later
chemical attractor. The live run continues; raw records remain local under
`frontend/harness/artifacts/alternative-chemistry-20261031/`.

### Next matched recipe — November 3

The 1/137 world continued to tick 1,518,084 with about 12,800 cells. In the latest
completed reaction window, 137↔9 carried 76.4% of accepted conversion and 1↔129 carried
21.4%; together these pairs carried 97.8%. Naturally produced 128 supplied 4.1% of uptake,
while 128→0 carried only 0.004% of conversion. These observations support dependence on
the seeded chemical economy over an inevitable return to 0/128. A reversal between the
two seeded pairs does not establish substantial differentiation beyond that economy.

The next comparison uses `config/alternative-founder-chemistry-2.json`: circuit
255→175→164→244→255 and reservoirs 255/164, with seed 27 and chemistry seed 101.
All four identities differ from both preceding viable recipes. The recipe moves recognition
and enzyme actions farther across chemical space, including a fast-diffusing, high-impedance
source at 255. Supply amounts, terrain, costs, learning, mutation and feature participation
remain unchanged. The user explicitly does not require old-world or save preservation.

The question remains whether later chemistry follows the seeded economy or converges on
the previously dominant identities. Competing explanations are seed dependence, intrinsic
attraction to the old chemistry, and inability of the new startup to fund replacement.
Calculate zero-tick founder material/work budgets before restart, then check ordinary uptake,
growth and division with all evolution enabled. The predicted initial chain is import of
matched material, paid conversion, growth and offspring; failure before offspring remains a
startup result rather than evidence about evolved chemical preference. If startup establishes,
leave this world running for the next chemical comparison rather than extending the old trial.
Generated budgets and operator captures remain local under
`frontend/harness/artifacts/chemistry-comparison-20261103/`.

The zero-tick budget gives positive conditional processing margins for three of four founder
types and confirms no seeded material of identities 0 or 128. The operator restarted the
live world into generation 2 with only `founderCircuit` and `sourceSpecies` changed. At tick
1,532 it had 39 cells, one division, ten deaths and 42.05 material units of funded growth.
By tick 7,276 it had 17 cells, eight divisions and 39 starvation deaths, with 12,392.84
material units supplied through refills. No further divisions occurred between sampled ticks
4,500 and 7,250. This was a weak startup with reproduction, not sustained replacement.
The world subsequently went extinct at tick 27,983; the following comparison supersedes it.

### Continuing selection and evolutionary departure — November 3

The user requested continuing until a sustaining chemistry and a measured comparison with
its founding chemistry are available. Startup positivity alone and repeated requests for
more investigation do not fulfill this outcome. Preserve unsuccessful trials, replace empty
worlds and leave the selected populated world running; old-save preservation is not required.

The 255/164 trial ended at tick 27,983 after 79 divisions and 127 deaths. Late retained
255-processing cells faced little usable substrate, abundant unprocessed 164 and accumulated
175 occupying enzyme machinery. Frozen operator probes isolate product inhibition, but do
not establish a rescue through a lifetime. The optimistic import-proportional budget remained
positive for 24 of 35 retained 255-processing starvation records. This budget omits passive
exchange, actual retained products and repair; it must not select a sustaining recipe alone.

The next candidate is 255→127→119→247→255 with reservoirs 255/119. Its adjacent
identities differ by one recognition bit, preserving the previous viable recipes' immediate
recognition adjacency while changing the chemical identities and transformation locations.
All other operating settings remain unchanged. Calculate budgets first, then measure ordinary
material retention, paid growth, replacement and supply renewal. If this candidate fails,
select the next matched recipe from the measured failure rather than increasing supply or
lowering mutation to make it pass.

The competing evolutionary outcomes are confinement to the seeded reaction economy, acquisition
of additional substrates/products while retaining seed dependence, and substantial replacement
of the founding chemistry. Record accepted reaction amounts and imports over completed windows,
including ended cells, alongside birth-compiled recognition and transformation changes in
reproducing descendants. Possible routes and genotype counts alone do not establish departure.
Use observed population and biomass replacement through ordinary renewals to choose a populated
run, then continue it far enough to obtain a concrete chemical result. Bound individual offline
jobs by elapsed time and retain partial results; those bounds control investigation cost rather
than define ecological success. Generated data remains local under
`frontend/harness/artifacts/chemistry-evolution-20261103/`.

The 255/119 live trial went extinct at tick 26,467 after seven divisions and 55 deaths.
Its full one-bit adjacency therefore did not suffice for startup viability. The next matched
recipe is `config/alternative-founder-chemistry-4.json`: 32→160→168→40→32 with
reservoirs 32/168. Chemical 32 has low impedance and low stress; its founder's conditional
processing margin is larger than the failed 255 founder's. This motivates the candidate,
without treating that margin as a survival prediction. Ordinary physical laws, supply amounts,
mutation and features remain unchanged. An offline copy records every complete reaction window
and regular descendant chemistry censuses while the live world continues separately. This is
a same-start continuation, not an independent-seed replicate. A second offline recipe,
2→130→138→10→2 with reservoirs 2/138, also funds repeated replacement, but the selected
live world remains 32/168; do not attribute the second recipe's measurements to that world.

#### Result: inherited processing changes, persistent fuel dependence

The live 32/168 world reaches tick 70,518 with 528 cells, 3,224 divisions and 2,744 deaths.
Across the retained tick 61,500–70,500 interval it has 1,476 divisions versus 1,286 deaths,
with ordinary refills continuing. In the completed live tick 80,000–80,250 reaction window,
about 57.2% of accepted reaction activity makes products outside the starting four identities.
The main flows are 32→160 at 41.55%, 32→177 at 21.77% and 32→212 at 13.37%.
The returned top rows cover all but 0.0028% of reaction amount; even assigning that entire
remainder to unlisted substrates leaves at most 0.0028% processing substrates outside the
seeded identities. Neither 0 nor 128 appears in the returned rows. Thus the expressed
transformation chemistry has departed substantially while fuel remains strongly anchored.

The offline continuation first records 32→212 in the tick 21,250–21,500 window and
32→177 in the tick 22,500–22,750 window. Neither route exists in the founders. At tick
40,000, every one of 101 cells inherits a program whose strongest route is 32→212, and
98 also inherit 32→177; no founder cells remain. The whole-cell strongest-route label still
says 32→160 for all 101 cells, hiding their other programs and the measured changed flows.
By tick 60,000 the population reaches generation 50, with 309 carriers of both derived
programs. These are inherited transformation changes and accepted flows, not merely possible
new routes. Individual program funding varies with the evolved body.

A matched offline comparison starts from the same tick 60,000 neighborhood and all 309
carriers. The reference preserves their evolved transformations. The other arm restores only
the center/angle parameters of enzyme programs 1 and 2 to the 32-processing founder's values.
Bodies, bound/free material, usable work, private state, recognition and all neighbors initially
match; inference invalidation matches. Further mutation and birth assimilation are frozen
equally, while ordinary paid private learning and physical costs continue. After 800 ticks
(160 model seconds), the evolved cohort has 299 survivors, 53 divisions and 63 deaths;
the reverted cohort has 268 survivors, 25 divisions and 66 deaths. Net funded work is +65.52
versus −4.01. Net biomass change is −11.09 versus −92.56. Both arms pass physical validation.
This demonstrates a present neighborhood benefit from the two derived transformations together;
it does not assign the gain separately to each transformation or establish independent new diets.

A preceding median-energy single-carrier comparison finds no biomass or funded-work advantage
over 400 ticks: the cell is below division size but material-limited, and extra captured work
overflows. Retain this negative rather than treating all additional capture as payer benefit.
The population comparison includes growth and replacement across heterogeneous carriers and
finds consequences the one-cell sample does not. All causal arms use offline copies; the live
world retains ordinary nonzero mutation, assimilation, learning and feature participation.

The offline observation job stops at its declared 1,200-wall-second budget, tick 84,868,
with 632 cells, 5,211 divisions and 4,627 deaths; it does not reach its 100,000-tick job
target. All completed 250-tick windows and the final checkpoint remain local. The unselected
2/138 copy is stopped after the main question is answered, with its last complete sample at
tick 54,000 and 515 cells; do not label that comparison extinct or complete to its original
target. No offline job remains running.

The final live readback is generation 4, tick 95,422, with 413 cells and no stop reason.
The adjacent ecology capture has approximately 7,746 divisions and 7,384 deaths. Population
fluctuates: its latest retained tick 87,000–95,250 interval has 1,500 divisions versus
1,605 deaths, from 525 to 420 cells. This operating world remains populated through repeated
refills and replacement; no claim of indefinite stability follows from that observation.
Only the founder circuit and reservoir identities changed from the preceding operating config.

To reproduce the method, start seed 27 from the captured resolved config with
`config/alternative-founder-chemistry-4.json`, retain ordinary evolution and collect complete
phenotype observer windows every 250 ticks. Preserve the physical neighborhood when comparing
derived programs with founder transformations. The local causal registration identifies the
tick-60,000 carrier cohort and its controls; its original `latest.bin` input path was a rolling
observation checkpoint and now points to the later endpoint. Recreate the anchor from the
retained tick-zero checkpoint before repeating that comparison; do not substitute the current
endpoint and claim an identical paired result. Read all active enzyme programs and measured
flows rather than classifying cells only by their strongest route.

## Experience-dependent allocation — October 14

The v55 swarm delivery overclaimed implementation: static authored allocation and in-place
substrate switching established existing paths, not experience-driven specialization or spatial
commitment/abandonment. Generic RNN expressiveness was insufficient reason to retain the old
learning law as the complete research application.

V56 selects one bounded, paid activity-dependent output-bias operator within the existing
controller. It uses shared inherited learning rate/magnitude, signed accepted activity, the
ordinary neural row budget and explicit birth-local assimilation/reset. Chemistry owns local
demand; no task labels, group reward or extra chemical law is introduced. The
[composed runtime](chemistry/composed-runtime.md#prepared-execution-and-physical-time)
owns its equations and incremental price.

The [allocation delivery](../plans/SWARM-ALLOCATION-PLAN.md) distinguishes actual acquired
allocation from immediate reflexes, product-created responsiveness, participant-loss replacement
and inactivity relaxation. Replacement improves usable return against its reinforcement-off
comparison. Negative low-cue and outward-only conditions remain negative; unprocessed private
material requires available inward information in the selected replacement fixture. These checks
do not establish evolved roles, spatial route discovery, sustained cooperation or communication
profit. Those questions are not silently counted as delivered by this mechanism.

## Computable chemistry and mathematical structure

The replacement core composes shared chemical reductions, sparse geographic work, funded
machinery and bounded product maps. Physics supplies mathematical language, not a requirement
to reconstruct thermodynamics. The initial coarser field compromised the display and was
rejected; mesh2 and active-group thresholds restored useful resolution without processing
every empty chemical channel. The full saturated workload remains a measured limit.
See [rebuild evidence](chemistry/rebuild-results.md).

Removing forced conversion of dead bodies to #186 preserved actual chemical identities but
did not remove enzymes that continued producing it. The subsequent symmetry correction changed
early mutation history while leaving those founder paths in place. The
[#186 causal study](../186-symmetry-causality.md) found an early inherited redirection toward
#218; its reversion raised #186 again. That supports history dependence, not universal freedom
from a systematic chemical bias. The [omission audit](../symmetry-completion-audit.md) records
why geometric/cost corrections alone had not fulfilled the requested transformation change.

V23 installed exact finite permutation actions on discrete identities, with bounded smooth
kinetic mixtures. A mixture need not itself be invertible or a group element. Recognition and
transformations share chemical coordinates, while D4 expresses the geometric symmetry subgroup.
The [algebra white paper](chemistry/transformation-algebra.md) explains these guarantees and
their boundaries. V25 added nonuniform potential basins and recognition-independent action
parameters, avoiding a single broad downhill gradient or a fixed relation between recognition
and output. These extensions preserve the same algebra.

## Mutation and initial circulation

The first heavy-tail mutation implementation reduced realized physical changes too sharply.
The correction uses one signed heavy-tail formula, with rate and scale allowed to differ
between neural and physical domains. Chemical-coordinate events are isotropic vector proposals;
parameter boundaries reflect or wrap according to their domain. Scaling chemical displacement
by the full domain later destabilized the starting population. Specificity-radius scaling
restored the intended local/rare-large balance. These failures and the subsequent checks remain
in the [mathematics execution record](../plans/archive/MATHEMATICAL-SYMMETRY-PLAN.md).
The current law is in [funded inheritance](funded-bodies.md#bodies-policy-composition-and-mutation).

A downhill-only closed chemical loop cannot fund every specialist after processing costs.
Renewing material alone did not repair that restriction on useful transformations. The
[initial ecosystem design](chemistry/regenerative-ecosystem.md) therefore adds explicit local
external transformation work to the existing shared reaction formula. Cells, dissolved material
and reservoirs use the same work argument and accepted-amount accounts. There is no special
waste reward, loss-matched replenishment requirement or extra enzyme economy.

Four mutable founder types start 0→128→136→8→0 in two resource neighborhoods. Initial0/136
reservoirs and finite8/128 priming establish delivery. Paid construction, repair, transport,
mutation and local control continue normally; four permanent surviving types are not required.

## Environmental operators and habitat formation

The first mobile-source implementation attached motion/conversion rules specifically to
reservoirs. The user rejected that architecture. Subsequent work moved these effects into
shared chemical/geographic operators used by ordinary fields, cells and sources. The expensive
weathering implementation also showed that choosing a solver first and optimizing it afterward
was insufficient. The [environmental execution record](../plans/archive/ENVIRONMENTAL-ECOLOGY-PLAN.md)
retains the correction and cost failures.

Earlier shelter experiments remain mixed: expensive ID15 shelter lowered exposure but lost
construction and survival; cheaper ID245 had a small shielding-attributable construction return
without a survival advantage. In the registered overnight study, seed27 went extinct in both
arms and seed101 reached its ancestry limit. The selected genotype's proposed shelter-specific
advantage failed. These are [negative or limited findings](chemistry/environmental-results.md),
not evidence that shelter never matters.

V26 finite-owner pressure prevented source overlap but increased dispersion and did not deliver
the predicted population increase at5k. Prescribed environmental wells were rejected: local
material and cellular work should generate binding, and homeostatic clusters need not migrate.
V28 shared attraction passed short force checks and initial visual review. The later
[v31 200k run](../integrated-200k-review.md) nevertheless became diffuse and remained heavily
dependent on original feedstock. Short binding success did not establish long-term concentration.

V32 [material-supported habitats](../material-habitats.md) combine two-scale attraction with
existing local repulsion, cohesion-dependent reversible retention, persisted locally evolving
renewal mixtures, and multiscale extracellular transformations using the same algebra. Initial
chemical IDs are no longer reset at ordinary renewal. Public uphill conversion is possible,
but the constructed public-food consumer still failed: captured work0.05609 was insufficient
against repair0.17348 and other costs; it died at150 ticks versus182 for the control. Do not
describe this as a demonstrated viable public-food niche.

The newer [83,980-tick user checkpoint](../material-habitats-review.md) contains dense,
chemically differentiated colonies and broad nonseed uptake. Net material flow and reservoir
renewal still depend strongly on initial feedstocks. It is promising continuing observation,
not proof of an autonomous or indefinitely diverse ecosystem.

V39 [binding simplification](../plans/archive/MODEL-SIMPLIFICATION-PLAN.md#m2--one-range-binding-and-ordinary-loss)
removes the broad opposing field and cohesion washout discount. One normalized attraction
range remains with local chemical repulsion and nonlinear crowding. The extra range selected
deposit spacing, while the discount separately rewarded cohesive deposits with longer life;
neither is required for composition-sensitive binding. Short production checks preserve
attraction, crowded separation, chemical sensitivity and cellular influence. They do not
establish that the earlier diffuse-world failure is resolved. Coalescence and faster loss of
dense deposits remain possible outcomes; no compensating tuning was applied.

### Class-specific material coupling

September 23, 2026 evidence from the continuing v40 server world (seed27): reservoir mean
nearest-neighbour distance rose 13.9 → 16.6 → 19.8 → 20.2 units at ticks 98k/217k/412k/725k,
against about 20.1 for a random layout; Morisita on 40-unit quadrats fell 2.76 → 1.35. Every
reservoir moved each interval (median 9–16 units), with mean cosine +0.23 to +0.31 toward
moving away from nearby reservoirs and −0.16 to −0.29 relative to nearby cells. Reservoirs
were pushed apart by crowding pressure from neighbours' released material and cell bodies,
amplified by `sourceDrift = 4` against 0.25 for cells, once V39 removed the attraction gain.
Cell structure dissolved in parallel: dense-core share fell from 19% to zero and empty
32-unit quadrats approached the random expectation. Median actual swim speed (0.42 units/s)
exceeds the 0.25 passive attraction cap, and nothing holds contacting cells together.

Direction selected with the user: keep one chemical feature field and gradient response, but
couple each class to it explicitly. Dissolved material keeps crowding pressure. Reservoirs
lose it and gain the dual tension the regional design intended: short-range cohesion through
attraction, longer-range pairwise repulsion between like signed-repulsion charges, and circle
exclusion, giving finite cluster size and spacing without stored anchors. Cells lose medium
crowding and gain compatibility-weighted contact adhesion so interior cells of a compatible
group can become immobile. Rejected: retuning χ alone (patch across all classes), reservoir
anchors (persistent initial-condition attributes), and orbital/inertial motion. Execution is in
the [material coupling plan](../plans/archive/MATERIAL-COUPLING-PLAN.md).

### Contact adhesion and bonded attachment

September 23, v41: contact adhesion blends the intended displacements of overlapping cells,
weighted by membrane compatibility. It credits no work and stores no bond. Earlier records that
list "direct adhesion" as deferred refer to bonded attachment: persistent links with explicit
attachment, detachment, forces and costs. Bonded attachment remains an unselected
[backlog](../backlog.md#backlog-conditional-extensions) extension; reserve sharing alone adds none.

## Model simplification

September 22 ([plan](../plans/archive/MODEL-SIMPLIFICATION-PLAN.md), `1cc05e2`/`b224525`).
The user identified unnecessary modeled machinery in refitting, reservoir behavior and
binding/retention. M0 fixes complete chemical capabilities at birth: refitting and duplicate
installed identities are removed, and daughter mutations act immediately without granting
material. Retaining parental capabilities to protect mutants from starvation was rejected. M1
replaces duplicate reservoir mixtures and lifetime expiry with one evolving composition, a
finite amount, fixed per-site release and delayed accounted refill. M2 is the v39 binding
change above.

## Living-cell gene transfer removed

September 22, M0 (`1cc05e2`). Living-cell genetic transfer changed capabilities after birth,
contradicting birth-fixed capabilities. It was removed rather than deferred, with no
replacement queue or compatibility mode; the engine rejects a nonzero transfer setting. The
pre-chemistry [transfer study](../transfer-study.md) remains historical evidence. Private
experience transmits only through explicit birth-local assimilation.

## Illumination and observation

V29's additive fast sweep failed the user's visual/design intent: X dominated while Y barely
changed the experienced pattern. V30 composes cross-axis products with30k/90k/310k-tick periods.
The same bounded local illumination enters shared transformation work. It remains a designed
periodic external forcing, not demonstrated mathematical chaos or a planetary climate solver.
The [v30 evidence](../evidence/digital-chemistry/illumination-v30/README.md) preserves changed
work rankings and costs; v29 survival reversals are not reassigned to v30.

V34 removes independent illumination of chemical-profile components. Multiple source periods
did not justify multiple chemical light channels; their average hid relevant work conditions
from receptors and display. One scalar now multiplies the whole local chemical signal, preserving
its direction and the existing visible pattern. The [light ecology design](light-ecology.md)
separates this correction from future optical screening and paid emission. Those mechanisms need
finite shared optical-work allocation before local emitters can safely feed the same pathway.
No colony-size penalty or prescribed day/night strategy is introduced. Superseded September 25:
v42 implements shade, cover and emission under the selection below.

### Light ecology selection

September 25, v42 ([plan](../plans/archive/LIGHT-ECOLOGY-PLAN.md), `ffee2d8`). The user kept
sunlight overhead and non-depleting. This rejects the earlier finite-sun proposal and
lateral-sun screening in [light ecology](light-ecology.md) sections 3–6. Selected: permanent
geographic shade, a sparse overhead material film built by paid builder stock, and paid local
emission whose finite work is allocated once across recipients and accounted separately from
solar work. Public conversion is photochemical; private enzyme kinetics are unchanged. The
first three-cosine shade generator produced visible overlapping grids and was rejected in visual
review; warped value noise replaced it, and v46 fractal terrain later supplied the shade map.
[Constructed checks](../light-ecology-results.md) establish sensing and physical effects, not a
profitable whole-cell shelter or lamp return.

The viewport uses composited day/night shading over the world, with independent hazard patterns
and modal observation. Enzyme colors and possible routes describe installed capability;
[measured flows and phenotype windows](../phenotype-observation.md) describe recent activity.
Bounded pins/histories preserve selected observations without creating a second physical state.

V31 [paid photoreception](../photoreception.md) adds five local inputs and one funded stock.
The short finite-food probes all died, despite demonstrating controllable optical steering.
The later200k run shows inherited optical connections affecting actions; it does not establish
successful light navigation or a specific fitness advantage.

## Genetic physiology replaces machinery development

September28: the user clarified that physical tradeoffs mean consequences of drag, capacity,
geometry and conversion equations, not a requirement to construct individual capabilities.
The agent had introduced that construction requirement while replacing an attribute tuple;
it was not the intended interpretation. The user explicitly authorized its removal.

V43 derives every body component from birth genetics and current biomass. It removes neural
construction/retirement outputs and per-category ownership charges. Whole-body growth,
basal metabolism, action work and conservative division remain. Daughter mutations apply
immediately, including body proportions. The [implementation plan](../plans/archive/GENETIC-PHYSIOLOGY-PLAN.md)
records direct-expression and accounting tests. This removes a developmental coordination
failure; it does not establish that movement pays or that the live colony will disperse.

## Dispersal geography and bounded neural drive

September 28, v44 ([plan](../plans/archive/DISPERSAL-OPPORTUNITIES-PLAN.md), `f6f2a2a`).
Regional reservoir placement gains a heavy radial tail from the existing centers, weights and
spread, so shorter movements can reach outlying deposits while dense patches remain. Source
counts, supply and refill timing are unchanged. Every neural row, including effective learned
recurrence, divides its drive by a shared incoming-strength budget, bounding aggregate drive as
weights evolve. No route, reward, source anchor or separately tuned control was added. The
[live evidence](../evidence/dispersal-v43/README.md) motivated both changes.

## Birth orientation and physiological aging

September29: the user requested independent birth headings and an effective lifespan with
an inherited tradeoff. V45 randomizes newborn heading and the local division axis with the
body RNG; chemistry, genes, conservative resource splits and inherited injury retain their
own rules. The parent's spatial direction is not genetic information. Private neural state
already resets at birth and receptor baselines initialize from the daughter's surroundings.

Age now raises body maintenance through a shared core-fraction law. More core slows the rise
at the expense of functional capacity; no separate lifespan allele or birthday death rule is
introduced. Fission creates age-zero daughters, while a budding parent remains old. The
[delivery plan](../plans/archive/BIRTH-AND-AGING-PLAN.md) records mechanics evidence and the chosen
initial timescale. This does not establish improved dispersal or eventual colony turnover.

## Fractal terrain and local resource seasons

September 30, v46 (`569f1a0`). The user requested the full terrain direction with world-start
switches and concrete fractal generation. Persistent fractal elevation, conductance, overhead
transmission and optional ceilings are generated once at world creation and persisted;
reservoir placement uses independent fractal sampling; local seasonal clocks scale release and
refill waiting. Controllers gain one input, the previous paid local motor load. The fixed-basin
remedy stays rejected: terrain adds no source anchors. Slowly changing terrain, tectonics,
catastrophes and live physical switches were not selected; they remain
[backlog](../backlog.md#backlog-terrain-refinement) proposals. The
[delivery record](../plans/archive/TERRAIN-AND-SEASONS-DELIVERY-PLAN.md) holds the integration
corrections and v47 spatial hierarchy. The integrated default display (`fc016c7`) presents
ground, contours, received-light shade and seasonal reservoir markers without changing physics.

## Review corrections and actuator feedback

September 30, after a goal-referenced review of the September 23–30 directions. Four defects
failed a stated contract; each was fixed and deployed.

**Server continuity** (`20e564d`). An extinct world keeps advancing and autosaving, and retention
kept only the newest six automatic saves, so the last living state aged out within hours. A
sidecar that failed to parse caused its data file to be deleted as an orphan, and a restore
failure silently seeded a new world whose saves then pruned the old ones. Retention now always
keeps the newest checkpoint with living cells; launch deletes data only when no sidecar exists;
when current-format checkpoints exist but none restores, launch fails with the reasons.
Resetting at a format bump remains the accepted cost of no migration.

**Harness presets** (`7ab52b8`). After the ecology preset became the parsing default, harness
contests built from partial overrides silently gained terrain, seasons and fractal placement.
The harness loader now requires each world or configuration request to name `ecology` or
`diagnostic`, or to supply a complete configuration. Archived kernels without presets are exempt.

**Dissolved slope transport** (`e754743`). The per-face uphill factor `1/(1+beta*slope)` applied
by donor fixed each face's steady concentration ratio at `1+beta*slope`, so pooling compounded
with face count and drift grew as 1/Δx. Seed 27 at 240 × 180 after 1,000 s: lowest-height decile
2.6× the mean at mesh 2 and 4.0× at mesh 1; a spreading front's downhill bias −0.70 versus −1.27
height units at 200 s. A resolution-independent potential would need a new length scale and
would act as gravity, which the geography design rejects. Choosing each face's coefficient by
its net exchange direction keeps beta's grade meaning and the cell law: a uniform field stays
uniform at both meshes and the front bias became −0.007 versus −0.004. The strong ridge-to-hollow
pooling previously visible was the discretization, not the stated law.
`engine/examples/slope_pooling.rs` reproduces these measurements.

**Actuator feedback** (v48, `ff175da`). Since v43 each body-stock input
`capacity/(capacity+reference)` equalled `M/(M+B)` for every component, repeating input 29 plus a
birth-fixed presence bit, while the row budget charged gain for weights on them. Conditional
specialization needs to know whether a chosen effort pays off where the cell is. Motor load
already reported this for motors; the same reading now applies to every paid actuator: accepted
effect against full-effort capacity. Seven capacity-only slots were removed rather than zeroed,
because a constant input only costs gain under the row budget (59 → 52 inputs). Founder weights
used none of the affected slots. Interleaved single-thread WASM measurements at 2,000 loaded
cells: 15.0 → 14.4 ticks/s for this change; the slope correction cost nothing measurable. That
workload was already below the 30 ticks/s target.

Other review observations were checked against recorded decisions and not acted on: the
non-depleting overhead sun, fission age reset, contact adhesion that credits no work, the
unnormalized conductance mean, input 51 as the terrain load cue and the weaker founder turning
under the row budget are each recorded user choices or accepted measurements.

## Cellular organization and shared interfaces

V33 implements the [joint design](cellular-organization-and-exchange.md). The user withdrew internal
compartments: each cell retains access to all 256 chemicals through one free mixture. Retained
free/bound composition changes relative enzyme rates through the existing signed profiles;
work per conversion remains separate. Paid inward sensing and neural requests connect this
environment to activity, construction and retirement. One to eight enzyme templates can duplicate
or disappear without granting machinery or erasing installed material. Core-funded division
allows optional machinery expression without requiring every inherited target before birth.
Superseded September 28 (v43): construction, retirement and core-funded optional expression were
removed; genes now express capabilities directly at current biomass. Inward sensing, activity
regulation and one to eight enzyme programs remain.

Crowding divides a finite interface between the field and exposed free material in injured
neighbors. Shared donor reservation includes the donor's own export. Existing chemical injury,
repair and public export can support antagonism or assistance without prescribed roles, kin
recognition or community rewards. Living bound structure remains private.

[Bounded delivery evidence](../cellular-organization-results.md) records an ordinary-turnover
recipient return, conserved/permutable operations and functioning 600-tick startup. The latter
had no contact import or retirement. Neither profitable deliberate injury nor evolved
cooperation was established. A sparse-controller optimization was rejected after worsening
cost; exact inactive-work skips and in-place lifecycle compaction remain. Standard 2,000-cell
mean throughput is30.07 ticks/s versus31.69 before the feature; growth and the eight-program
stress case remain below30. There is no unqualified performance or meta-organism claim.

## Mature-world performance investigation

September 21, 2026 negative evidence. The single-threaded plan to reach 120 ticks/s on the
approximately 6,975-cell, 180,000-tick reference workload was canceled by user decision with
the target unmet; the M2 baseline was about 14 ticks/s. Its M3 local-execution architecture
regressed: ledger runs 4307–4310 measured about 5.6–6.1 ticks/s, corrected candidates
4311/4312, 4315/4316 and 4319/4320 reached only 8.1–10.1, and 4321/4322 fell to 7.1/6.8. Cache and validation lifetimes (neural
error checks, contact receiver revisions, reaction epochs with frequent refresh failures) cost
more than the work they skipped. The record rejects restarting receiver certificates, affine
inventory trajectories and per-cell reaction catalogs, and rejects lowering elapsed model time,
removing cells or disabling observation to reach a tick counter. Structural ownership replaced
this sequence; see the [archived investigation](../plans/archive/MATURE-PERFORMANCE-PLAN.md)
and the [scaling record](../plans/archive/SCALING-PLAN.md).

## Regional execution and multicore resumption

September 21–22 ([scaling record](../plans/archive/SCALING-PLAN.md), [regional
contract](spatial-execution.md)). The user resumed multicore execution on September 21 and
required structural replacement before acceleration. The runtime uses a persistent Rayon pool
on shared WASM memory with disjoint field and cell jobs; the owning worker still coordinates
the sole World and renders borrowed views. The multicore build requires cross-origin isolation;
other browsers use the same operators in the serial build. Persistent 8×8 material regions own
private commits, shared carrier lifetimes and locally invalidated finite convolution.
September 22: the sampled contact lattice with angular moments was rejected and deleted in
favor of perfect-circle overlap with scalar penetration, center-line separation and permeable
material access.

## Browser and native server execution

September 21–23 ([execution modes](../execution-modes.md),
[plan](../plans/archive/EXECUTION-MODES-PLAN.md)). The same UI runs a local world on one or four
threads or observes one native server World on TrueNAS/Komodo through bounded display
projections; physical and private state stay native. The scope correction rejected
cross-context run transfer, live executor replacement, server save infrastructure and
storage/recovery acceptance gates. September 23: the user separately requested volume-backed
server checkpoints, which reverses the save-infrastructure rejection for the server only, and
authorized the public spectator route `server.biotropy.ahara.io`. That route forwards only
`/stream` and `/health`; `/api` stays LAN-only, and the public site defaults to the server world.
Execution selection changes neither chemistry nor save formats.

## Ecological incentives

September 26 ([plan](../plans/archive/ECOLOGICAL-INCENTIVES-PLAN.md), `3ee29b3`/`a3a97ee`).
A profitable reservoir offered little reason to leave. Three interacting opportunities were
added through existing machinery: growth compression separates crowded neighbors, retained and
released products impose chemical costs with passive membrane exchange, and isolated cells can
support metabolism with private light work while acquiring dilute material. No spatial
reward, population limit, newborn ejection or avoidance policy was introduced. Short probes show
mobile growth in dilute material and receptor-driven reduction of harmful exposure; no evolved
dispersal outcome is claimed.

## Delivery gates retired

September 30 ([delivery policy](../plans/README.md#delivery-policy)). Plans contain
implementation and deployment only. Agents run appropriate automatic tests and bounded checks
inside the work. Verification, observation, human-acceptance and visual-review stages are
retired, not passed; historical measurements and missing experiments keep their meaning.
Unselected optional features move to the [backlog](../backlog.md).

## Mortality driven reservoir recycling

October1 local v50 delivery ([contract](mortality-recycling.md),
[findings](../mortality-recycling-results.md), [plan](../plans/MORTALITY-RECYCLING-PLAN.md)).
An independent nominal allowance keeps scheduled imports unchanged when actual corpse chemistry
enters the single source stock. One exact physical-time history subtracts funded growth from
dead bound mass; the complete death batch uses a fixed quadratic response. Installed finite
footprint overlap routes all species together, with no distant fallback, food selection,
population target, reseeding or work grant. Explicit population interventions rebase history.

The implementer selected tau60 model seconds from a45.5-second maintenance-only founder reserve
and h_star0.25 as substantial recent net loss. These are fixed scales, not an ecological optimum.
Mirrored finite-food assays showed higher growth but extinction71 ticks earlier with recovery.
The initial decision disabled recovery because of that survival result. The user rejected this
delivery standard: research directions need bounded non-breaking checks and a plausible path
to their intended effect, not proof of long-term ecological success. Recovery is now enabled
by default and sourceRate is reduced from0.2 to0.1, halving release and nominal stock, including
startup stock and its priming allocation. SourceGap600 and the priming fraction remain installed.
The conditional supply panel was not run, so a wider extinction boundary and evolved dispersal
remain unmeasured. This negative result does not authorize chemistry changes or extra rate gains.
The native/WASM/browser feature was subsequently deployed. The first v50 seed27 world starved
at tick12,412, with56 actual deaths and eight divisions. The ordinary-founder establishment check
was missing from the initial delivery. A bounded comparison at the same rate0.1 improved paid
uptake and growth when full batches were retained; sourceLifetime is now1200 rather than600.
The [startup correction](../mortality-startup-correction.md) records the evidence and limits.
The existing extinct state and earlier incompatible saves remain preserved.

### October 12–13: recovery contents cannot rewrite external supply

The [v54 correction](mortality-recycling.md#october-12-correction-finite-contents-and-external-supply),
`c8404bd`, replaces the earlier one-vector constraint with one finite inventory and an evolving
external boundary condition that owns no material. Previously, any positive corpse deposit into
an empty reservoir could replace the chemistry of every later external batch and its full
persistent interface. Conservative admission alone did not bound that future amplification.
Recovered chemistry now changes finite contents only; future imports and their potential remain
explicitly external, with nominal timing unchanged. This is a delivered ownership correction,
not a local severity mechanism, food reset, new supply control or second physical stock.

The earlier finite-food survival result involved no external refill; future-batch amplification
does not explain that negative finding. The corrected three-hour live observation shows improved
early replacement but stops before the previous collapse. [Local mortality feeding](local-mortality-feeding.md)
retains global masking, delivery and survivor-return questions against this corrected baseline.

## Chemical-key finite binding correction — October 6

The [binding correction](../key-binding-correction.md), `0e9ecee`, replaces independent sigmoids
with one competing partition per site, including an unbound state. Positive bias had allowed
near-universal full-strength recognition and protection. The old code followed its equation;
the equation failed the intended finite specialization tradeoff. Total affinity now cannot
exceed one, bias controls binding strength and weights retain relative preference. The same
operator applies to all keyed consumers without a breadth penalty or mutation-law change.

Bounded physical checks establish distinct paid access and reciprocal sign epistasis in funded
net biomass return. They do not establish evolved complementary roles. Earlier food-chain and
ordinary-neighborhood findings retain their independent-sigmoid law, even though the correction
did not change checkpoint layout. [Chemical keys and broad processing](chemical-key-specialization.md)
now separates this resolved defect from the remaining ecological investigation. The
[directions registry](directions.md#corrected-mechanisms-and-evidence-baselines--october-13)
also records the startup, actuator-feedback and experimental-condition corrections.

## Operational limits and remaining direction

The prior React development timing leak was reproduced and repaired. One injected graphics
restore timed out and remains unexplained, although the repeat passed. The recent retention
repair expires older saves within256MiB rather than demanding that all preferred counts fit.
The separate [reload slowdown investigation](../session-runtime-review.md) finds no short-test
speed benefit from forced JavaScript collection; WASM high-water allocation and save costs remain
concerns, and the reported fivefold difference remains unattributed.

Keep execution single-threaded for now. [Multicore and terrain](../plans/archive/SCALING-PLAN.md), direct
adhesion and interaction research beyond v33, useful public-food returns, and long-run performance remain backlog
work. Neither retrospective documentation cleanup nor a passing CI run resolves those questions.
Superseded: multicore execution resumed September 21 and is installed; terrain is implemented
in v46; v41 installed contact adhesion, leaving bonded attachment unselected. Useful public-food
returns and long-run performance remain open in the [backlog](../backlog.md).
