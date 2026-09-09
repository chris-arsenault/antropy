# Autonomous construction from physical pressures

The September 8 approval activates this design before further population scaling. It corrects
the manual-order interpretation in construction.md. Physical construction actions remain; normal
programmed and LGP colonies must choose work without browser intervention. Manual requests are
optional diagnostic controls. Genetics, RNN training, collapse, flooding, CO2 and full airflow
remain outside this milestone. Human visual review is the final behavior gate.

The September 8 default review failed after approximately 18,000 ticks. The
[matched default audit](default-pressure-audit.md) records the subsequent reproduction, pressure
and decision findings. Seven cuts and three brood moves end by tick 3,435 in that configuration.
The subsequent [colony repair](colony-repair.md) fixes storage identity, care routing and work
coordination, and introduces the smaller founding default. That record owns current measurements;
the earlier assay successes below do not supersede the failed human integration review.
That repaired default also failed spatial review. The subsequent
[spatial correction](spatial-construction.md) governs current site selection and the normal,
unheated founding default; comfortable colonies need not relocate their queen.

## World contract

Temperature and finite moisture occupy a configurable finite-volume mesh over the cellular X/Y
terrain. Material fractions determine thermal capacity, conductivity, moisture capacity and
permeability. Foreground and backing participate explicitly; backing is finite material, not an
infinite source. Excavation changes exchange properties. No runtime surface-height or depth-based
safety function is permitted. Mesh resolution is persisted and must be checked against a finer
reference in field assays; small cuts can change material fractions without creating a full room.

Neighbor exchange conserves thermal energy and water. Outdoor temperature varies over a daily
cycle; exposed cells exchange with an atmospheric boundary and absorb light-dependent heat.
Boundary additions/removals are measured separately. Moisture remains a local reservoir when
terrain changes, representing pore water and surface films; spoil transports solid material only
in this abstraction. This simplification is explicit, not a hidden water source.

Local thermal extremes and desiccation increase maintenance expense; brood development slows
outside its tolerable thermal band. Body water exchanges with its local reservoir. Food spoilage
depends on local warmth and moisture and appears as dissipated food energy in the economy.
Cache labels confer no climate or preservation bonus. Climate transport, its biological effects,
spoilage, autonomous construction and excavation availability are independently configurable.

Natural shelters may outperform excavation. Comfortable, spacious colonies should build little.
Construction pays only through space, food/care delivery, reduced exposure or retained resources.
No chamber count, target depth, monotonic per-cell improvement or digging reward is a success gate.

## Interface and decisions

Local observations record temperature, moisture, material, supporting floor, bodies, food and
recent traffic failures. Shared site records carry observation times and expire; no hidden food,
remote live climate, ideal site score or unseen build plan enters controller input. Routing to
observed sites uses the already-authorized colony terrain pathfinder. Occupancy and work claims
are still resolved sequentially. Work reservations coordinate intent; they never choose tasks.

The programmed policy and compiled LGP seed use the same arithmetic decision rules. They prefer
existing suitable space, compare observed source/destination conditions, and pay route, digging,
spoil and relocation costs. Persistent tasks and a relocation margin discourage oscillation.
They expand constrained nursery floors or congested passages, create storage when observed
capacity is tight, and relocate occupants or food only when a known site offers sufficient value.
Digging needs physical spoil disposal; blocked work must be released or retried, not freeze care.

Brood transport carries one egg, larva or pupa as a composite cell with its worker. Feeding and
metabolism continue; emergence waits for placement. Carrier death drops the brood physically.
Queen laying uses supported free floor; transporting brood makes that floor available again.

## Work and evidence

Plan: 808c4d10-2b58-4a78-a088-1338f8cd37de.

1. Record contracts and integration design.
2. Verify material climate transport, boundary budgets, physiology and overlays independently.
3. Implement brood transport and timestamped nursery/storage/traffic observations.
4. Implement autonomous programmed/LGP work selection and physical completion.
5. Compare mild, thermal and crowded colonies, with excavation disabled as a matched control;
   repeat on surface tiers. Record negative findings, energy, water, brood replacement, hauling,
   job causes, cancellation and runtime. Run bounded mechanics/persistence checks and full CI.

Long campaigns belong in the harness ledger. A field assay cannot establish colony survival;
a completed work request cannot establish autonomous behavior. Review trajectories in the browser
before declaring this milestone behaviorally accepted or advancing to further scaling.

## Initial implementation and evidence

Checkpoint v13 stores climate fields and budgets, body water, brood loads, observed sites and
traffic, work provenance and completion times. The interface has 132 inputs and 27 request kinds;
the programmed expression compiles to 2,828 LGP instructions. Existing route and task actions remain.
Work proposals enumerate nearby and rotating samples of observed sites; they do not rank sites.
The seed scores those candidates. Source observations are reused within a decision without reading
remote fields. Completed work landmarks are removed; completed job records expire with shared
knowledge retention. Pending cache construction counts toward the seed's expected storage capacity.

The climate model uses relative material properties, finite half-volume backing, neighbor exchange,
and a sinusoidal atmospheric boundary. Body water exchanges passively with the local reservoir;
drinking, water in food and detailed insect physiology are not modeled. All initial body hydration
is withdrawn from that reservoir. Solid removal preserves pore water/films in the cell and records
the thermal energy departing with the removed material. Full thermomechanical spoil transport,
phase changes and body heat emissions are outside this abstraction.

Ledger 2748 compares an 8,000-tick day at one-, two- and four-cell resolution. Coarse sampling
differs from the one-cell reference by 6.37 and 4.15 degrees respectively at the declared probes.
The default therefore uses one cell. One-cell field stepping takes 33.6 seconds for that day on
this host. The accumulated heat residual is 0.00188 relative thermal units and water residual is
2.82e-6; budgets must use relative tolerances for these large reservoirs.

Early pressure assays, all without manual interventions:

- 2739: queen moves from an observed hot cell to existing cooler floor by tick 8; no digging.
- 2740: crowding prompts brood relocation into existing space, rather than excavation.
- 2742: a spoil destination conflicts with brood placement; digging is abandoned. The seed's
  reservation observations now include disposal cells. The fixture also exposed an accidentally buried
  cache marker; its terrain setup now preserves that physical cache.
- 2743: shelter excavation fails to start because disposal enumeration repeatedly samples the
  same near-queen cells. Disposal memory sampling now rotates. This is an enumeration repair,
  not an ideal-site sensor.
- 2744: workers complete three excavations with three deposited spoil units and two queen moves
  in a hot-room assay. 2746 disables excavation and permits relocation; compare total resource
  retention, not queen reserve alone, because feeding differs between arms.
- 2745: workers create a drier cache, physically haul its food and retire the original by tick 20.
- 2747: four workers overbuild storage while one cache is pending. The seed now accounts for
  committed capacity; bounded tests cover the second worker declining another cache request.
- 2755: the corrected storage assay completes one additional cache by tick 7, with no redundant
  requests during 1,000 ticks. All four workers and the queen remain alive.
- 2756: the current crowding assay moves brood by tick 15 and finishes one cut with deposited
  spoil by tick 24. This supersedes the earlier no-excavation result in 2740 after disposal
  sampling and work reservations were corrected.

The initial 8,000-tick full-world panel has exact programmed/LGP outcome parity on each map.
Compact runs 2752/2753 end with 11 workers, seven births, queen reserve 21.65 and 38.45 stored
food energy. Tiered runs 2749/2754 end with four workers, zero births and no queen feeding;
the queen remains alive only on her declining reserve of 8.00. Neither map triggers excavation
in this panel. No user work orders or task overrides occur. This does not certify tiered survival.

A bounded reproduction shows empty outdoor workers choosing to refresh a stale queen observation
instead of acquiring a route to nearby known food. The seed now limits such inspection to interior
care sites within 16 cells. Both controllers pass the regression case. Inspection is a mutable
policy decision, not an environment task assignment.

Corrected tiered run 2757 still has zero queen feeding and zero births at tick 8,000, with three
workers left and queen reserve 8.00. The inspection repair does not resolve the survival failure.
No further parameter tuning follows from that hypothesis. Tiered foraging/care delivery needs a
separate causal investigation; the current implementation is not a tiered survival certification.

Final compact LGP run 2761 ends at tick 8,000 with 11 workers, seven births, four remaining founders,
queen reserve 21.62, queen feeding 25.62 and stored food energy 62.34. It completes no construction
requests under those conditions. Its energy residual is -6.30e-9. Runtime is 737 seconds on this
host; corrected tiered run 2757 takes 273 seconds. These runs do not establish interactive
2,000-worker performance. The initial full-world panel proves matched controller outcomes for the
earlier seed; the final inspection correction has bounded programmed/LGP parity checks and this
additional compact LGP run, not a second complete four-arm panel.

Final mild assay 2758 starts no work in 1,000 ticks. Thermal LGP assay 2760 moves the queen to
existing cooler floor by tick 8 without excavation. Crowded control 2759 disables digging and still
places brood by tick 14, with similar feeding to 2756. This crowding assay shows no short-horizon
benefit from its extra cut. The hot-room excavation pair 2744/2746 retains about 0.375 more energy
with digging after accounting for bodies, crops and food. These are separate physical tradeoffs;
excavation count is not a fitness measure.

Bounded mechanics also verify a sealed nursery cannot accept a funded egg until a worker excavates
a supported free cell, and mature carried pupae wait for placement before emergence. This verifies
the space-to-reproduction mechanism without treating an artificial arena as a growing colony.

These are supplied-reserve mechanism assays, not sustainable colonies. Detailed results and
checkpoints are under `frontend/harness/artifacts/pressures-2026-09-08/`. Full-world runs measure
renewable food and ordinary reproduction, but 8,000 ticks do not cover full founder replacement.
Human trajectory review remains pending.

## Earlier Run-only browser defaults

Plan 29ab61c2-e5c5-4b0b-8d28-43fb01dddcf1 addresses the user's actual review workflow: Run and
the stats panel. The browser keeps the regular compact colony, renewable food, mortality and brood
development. Existing cavity cells start 16°C warmer than the surrounding material. This is a finite
initial heat load, booked into the thermal budget; it is neither a continuous heater nor a task
assignment. Excavating soil does not apply the initial warming again. Checkpoint v14 records the
initial-condition parameter and actual evolving fields; continuation does not restart the heat event.

The initial view frames the colony, shows temperature and opens Metrics. Pacing now uses an explicit
30 ticks/s target with measured throughput, replacing the former 1x frame batch. Pheromone and
route overlays start off to keep the temperature readable; their simulation mechanisms are unchanged.
All existing selectors, layer controls, camera controls and import/export controls remain available.
The new stats show local queen temperature/moisture, excavation, spoil placement/hauling, recent
queen/brood/cache moves and food spoilage without opening diagnostics.

Run 2762 uses the regular compact programmed colony, seed 101, initial cavity warming 16°C and
day/night amplitude 12°C. Workers choose a dig at tick 264 and finish with deposited spoil at tick
305. At tick 500 the queen is alive and fed, all eight workers remain, and stored food energy is
13.01. There are zero work-order interventions and no queen relocations in this interval. The browser
check reaches tick 323 with excavation and spoil counters both at one using only Run and Pause;
it changes no options, layers, camera settings or work orders. This replaces the earlier default
that produced no excavation in the long panel. Longer survival under the warm start is unmeasured.

Artifacts are under `frontend/harness/artifacts/run-default-2026-09-08/`. The earlier browser
verification below describes the superseded startup and its manually enabled overlay.

The normal browser opens the compact colony at tick zero with climate and autonomous construction
enabled. Environment controls independently toggle climate, physiology, spoilage, excavation,
autonomous work and surface tiers; changing the terrain preset retains the climate settings.
Climate parameters are editable in the same panel. Layers offers temperature and moisture views.
Manual construction is collapsed under diagnostics. The browser probe reaches tick 83 using Run
and Pause, enables the temperature overlay and exercises Fit world without issuing work orders.
The final browser repeat reaches tick 80 with the same checks; its screenshot and measurements are
in the `browser-final/` artifact directory. CI, production build and checkpoint continuation checks
pass. Existing optional-property lint and bundle-size warnings remain. The implementation is ready
for human review; tiered survival, long-term construction benefit and population scaling remain open.
