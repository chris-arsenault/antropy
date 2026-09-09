# Nutritional yield, worker activity and support

The user proposed that long programmed turn sequences might reflect surplus workers in a colony
with too few useful tasks, rather than inability to forage. The September 7 experiment compares
energy per food unit while measuring individual activity. It does not assume that every worker
must forage continuously or that the workforce needed to sustain a colony is a fixed constant.

## Intervention and prediction

The matched panel uses seeds 21–23, 40,000 ticks, and densities 1, 0.75 and 0.5 energy units per
food unit. It retains the same programmed policy, founder counts, geometry, chemistry parameters,
food positions, starting food quantities, source capacities, regrowth quantities, crop capacity,
mouth throughput, maintenance costs, reproduction rules and worker lifespans.

The pressure is lower energy delivered per crop and per mouth action. To sustain a given colony
load, successful food throughput must increase sufficiently to cover its own work cost plus
worker upkeep, queen upkeep and development. This can recruit more existing workers into effective
foraging, change activity per forager, reduce reproduction and population, or cause starvation.
Total population alone is not an estimate of the necessary foraging workforce.

The surplus-worker prediction is increased effective foraging and reduced prolonged turning while
provisioning remains adequate. Long turns among hungry or loaded workers beside hungry recipients
would instead identify unmet local work during those episodes. These outcomes can coexist within
one colony. Changing nutritional density does not change the programmed decision rules or teach
workers how to rest.

## Resource contract

Food maps and worker crops now store food quantity. The independent positive `foodEnergyDensity`
converts quantity to usable energy during eating, queen feeding and larval feeding. Initial source
quantity is named `initialFoodQuantity`; regrowth and capacities remain quantities. Energy accounting
values food and crops at their density, and records regrowth as energy input. Default density 1
preserves the previous transfers and behavior. Checkpoint version 5 stores these units explicitly
and rejects earlier shapes. The inspector distinguishes crop quantity from crop energy.

All food in a world shares one density. Recycling returns the remaining reserve energy as its
equivalent food quantity, plus unconsumed cargo. Body mass is not tracked independently, so lower
density changes the volume of energy-equivalent recycled remains. This limits interpretation as
a model of natural nutritional composition. The intervention also reduces initial environmental
energy and future regrowth energy, while founder reserve energy stays fixed.

Food odor depends on quantity, not density. Initial geometry and chemical clues match; subsequent
food removal, deposition, recycling and worker traffic can make those clues diverge through ordinary
feedback. The experiment does not artificially hold fields fixed after behavior diverges.

## Measurements

Each 2,000-tick window records per-worker commands, successful translations, surface occupancy,
external pickup events and quantity, deposits, and energy fed to recipients. An active forager is
a worker with at least one successful exterior pickup in that window. A depositor need not be the
same worker that originally harvested the food; the model does not track food provenance through
mixing. Counts measure observed participation, not minimum necessary workers. Births and deaths
within a window can make its unique worker count exceed its final population.

Long-turn exposure counts the 100th and subsequent consecutive turning commands, with hunger,
carrying state, nearby hungry recipients and blockage recorded at those commands. The first 99
commands are excluded from this exposure measure. The longest episode per worker is retained,
with the twelve longest included in each result and a local frame from its start. These samples
are diagnostic contexts, not a census of every episode.

The harness observes ordinary actions after they resolve. Positions and activity records never
enter a controller. Simulation mechanics tests cover conserved transfer and recycling at reduced
density, matched source volume and chemical emission, and checkpoint continuation.

## Results

Run 2574 contains all nine worlds and completes in 370.638 seconds. Run 2573 is the preceding
200-tick mechanics smoke. At density 1, final population, harvest, queen feeding, births and
conservation residual match the previous float32 reference run 2572 exactly on all three seeds.

Across the full 40,000 ticks, pooled by density:

| Energy per food unit | Mean living workers | Mean active foragers per window | Long-turn exposure / worker ticks |
| -------------------: | ------------------: | ------------------------------: | --------------------------------: |
|                 1.00 |               15.78 |                           11.70 |                            16.92% |
|                 0.75 |               10.39 |                            8.83 |                             5.89% |
|                 0.50 |                4.70 |                            4.70 |                                0% |

Mean living workers is worker-ticks divided by simulation ticks. Active foragers are unique
participating workers per 2,000-tick window, so these two columns have different denominators;
their ratio is not a precise fraction of active workers. Zero long-turn exposure means no sequence
reached 100 consecutive turns, not absence of all turning or short oscillation.

At tick 40,000:

| Density | Seed | Workers | Adult births | Brood deaths | Queen reserve | Stored energy |
| ------: | ---: | ------: | -----------: | -----------: | ------------: | ------------: |
|    1.00 |   21 |      19 |           44 |            2 |         18.12 |         39.38 |
|    1.00 |   22 |      13 |           40 |            3 |         23.32 |         32.01 |
|    1.00 |   23 |      20 |           47 |            0 |         21.72 |        248.51 |
|    0.75 |   21 |       8 |           22 |           15 |         14.60 |         24.54 |
|    0.75 |   22 |      19 |           40 |            6 |         20.97 |        103.52 |
|    0.75 |   23 |       5 |           18 |           27 |         21.47 |         58.42 |
|    0.50 |   21 |       5 |           10 |           21 |         14.66 |         23.64 |
|    0.50 |   22 |       1 |            6 |           19 |          5.57 |         43.64 |
|    0.50 |   23 |       3 |            9 |           20 |         11.84 |         17.27 |

All queens survive this finite horizon, all founders have died, and no worker starvation death is
recorded. Final conservation residual magnitudes are below 1.4e-8. Low-density populations lose
workers through inadequate replacement relative to age deaths; surviving queens alone do not
certify demographic persistence. The half-density seed 22 ends with one worker and low queen
reserves despite stored food, showing that food availability does not guarantee delivery and care.

The response varies by world. On seed 22, lowering density to 0.75 raises mean active foragers in
the second half from 6.6 to 15.9 and reduces long-turn exposure from 51.4% to 5.0%. Seeds 21 and 23
instead have fewer active foragers and smaller populations. The panel therefore does not establish
a fixed necessary workforce N that increases when nutritional yield falls.

### Turn context

At full density, 71.56% of measured long-turn exposure occurs with all eight neighboring movement
cells blocked, and 75.03% occurs below the programmed hunger threshold. These categories overlap.
No measured long-turn exposure has a hungry queen or larva within sensing reach. All 36 retained
full-density episodes are at surface positions; 23 of 24 retained 0.75-density episodes are also
at the surface. This describes retained episode samples, not every turn in the run.

The longest full-density episode is seed 22, worker 28, at (1033, 100), from tick 25,607:
4,803 consecutive turns, 4,798 with every neighbor blocked, while reserve falls from 62.86% to
34.00%. Terrain-only navigation receptors report open cells at its start while occupancy-aware
contacts report none, identifying occupied neighboring space. The strongest episodes therefore
support a congestion interpretation rather than satisfactory resting by surplus workers.

At density 0.75, seed 21 also has a 4,788-turn episode while reserve falls from 49.87% to 21.10%.
Between ticks 16,000 and 18,000 its stored food is zero, external harvest does not increase, and
queen feeding has stopped. Surplus labor is not a sufficient explanation of that episode.

Lower yield reduces long turning alongside reduced population and poorer brood recruitment. This
supports population pressure as relevant to congestion, but the intervention changes several
downstream states and is not a population-only causal test. It does not prove resting would cure
the blockage. Do not equate replacing turn commands with idle commands with restored transport.

The predeclared three-density panel is complete. No policy fitting, parameter search or gravity
change followed it. `make ci` passes 59 tests across 18 files, documentation and Terraform checks;
the production build passes. One pre-existing optional-global-input lint advisory remains.

## Gravity and interpretation boundary

Inspection confirms the user's observation: there is no gravity resolver in any axis. Y increases
upward, but every underground AIR cell is considered walkable, regardless of wall or floor contact.
Queen placement uses the chamber's authored home point, brood is placed around her, and loose food
remains at its deposited cell. Invisible backing walls could explain worker locomotion, but that
assumption is not represented and does not explain loose objects remaining unsupported.

The yield panel holds those rules constant. It can test activity responses on this substrate;
it cannot establish that the cross-section has credible gravity or movement. Support repair should
be measured separately: settle unsupported loose food and brood toward lower Y, place the queen
and cache on supported ground, and require a local gripping contact for worker climbing. Chemicals
must diffuse through air independently of which cells a body can stand on or grip. The current
shared `isWalkable` use for movement and diffusion must be separated before that repair.

Gravity and support are not implemented by this nutritional intervention. Introducing them requires
a new baseline, local traversal and conservation checks, and human trajectory review. No neural
training is part of this experiment.
