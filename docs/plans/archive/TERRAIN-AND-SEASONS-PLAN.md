# Full fractal terrain and local resource seasons

Historical September 30 execution record. The user's delivery-policy correction retires the
verification and human-acceptance stages below. They are provenance, not instructions to resume.
The [delivery record](TERRAIN-AND-SEASONS-DELIVERY-PLAN.md) completes the code and delivery.
Recorded results and omissions retain their original scope; no missing review is marked passed.

Created September 30, 2026. Sulion root: `0ac08ebd-3a5c-4b83-912b-f4303d4267be`.
Execution of all implementation milestones was authorized after plan creation. Publication
and a live-world reset remain separate. Dynamic terrain and live-switch scope questions were
sent while independent implementation proceeds; no answer is assumed.

Design baseline: commit `fce4671`, annotated tag `fractal-terrain-design-2026-09-30`.
The [geography proposal](../../design/persistent-geography.md) and
[local resource seasons](../../design/local-resource-seasons.md) own the proposed mechanisms.
This document owns delivery, dependencies, decisions and evidence, not additional equations.
Expand each imminent milestone here with the plan-phase workflow when execution is authorized.

## Outcome and boundaries

Deliver persistent, fractal environmental variation that changes the costs and returns of
travel, residence, material retention and resource access. Integrate elevation, conductance,
overhead cover, optional light ceilings, fractal source placement and local supply seasons
through the ordinary World. Features must be selectable through configuration, durable across
continuation, and visible through the existing local and remote observation paths.

The intended result is usable physical opportunities with observable consequences. A particular
cluster count, evolved specialization, indefinite off-reservoir survival or coexistence proof
is not acceptance. Dense colonies remain valid. Short experiments guide the design; they do
not replace complete implementation or the user's continuing observation.

Preserve the periodic XY substrate, chemical algebra, material/work accounts, genetic
capabilities and paid actions. Do not restore machinery construction or retirement. Some older
proposal prose still mentions construction; the current [physiology contract](../../design/funded-bodies.md)
and [principles](../../principles.md) control implementation. Do not introduce source homes,
biome rewards, population-based terrain generation, fluid simulation, a Z coordinate or a
second physical economy. Sunlight remains overhead and non-depleting.

Rust owns canonical maps and physical clocks. Use persistent regional execution, local cache
invalidation, borrowed same-worker rendering and bounded remote projections under the
[ownership contract](../../design/chemistry/data-ownership.md). No full physical fields or private
population state go to React. Boot may be expensive; static terrain must not add per-tick
full-map scans or wake empty chemical support. The target remains at least 30 ticks/s, with
workload and misses reported rather than hidden by lower resolution.

## Context and reuse

| Boundary | Existing owner or source | Work to carry through |
| --- | --- | --- |
| Boot maps | `engine/src/terrain_noise.rs`, `terrain.rs` | Extend installed periodic warped noise and canonical shade into shared independent geographic channels |
| Placement and lifecycle | `engine/src/sources.rs`, `world.rs`, `source_medium.rs` | Fractal density placement, existing founder policy, seasonal release/wait integration and pending accrual |
| Movement and medium | `engine/src/movement.rs`, `prepared_movement.rs`, `field_medium.rs` | All actual displacement and shared external transport/processing consumers |
| Optical consumers | `engine/src/illumination.rs` and existing optical owners | One geographic transform used by public/private physics, sensing and display |
| Sensing and genetics | `engine/src/sensing.rs`, controller boundary and current physiology contract | Physical effort/load feedback without map knowledge or machinery construction |
| Configuration and recovery | `engine/src/config.rs`, World checkpoint and ordinary native/WASM clients | Shared validated settings, canonical map persistence and explicit format change |
| Observation | `engine/src/render.rs`, existing worker renderer and remote projection path | Bounded terrain and season views, local conditions and actual flow/cost accounts |
| Evidence | Existing harness, resource-economy calculation and local artifact ledger | Bounded mechanism probes, matched performance, continuation and human review |

The installed shade generator already has multiscale noise and domain warping. Reservoir
placement still uses weighted centers and radial offsets. The source's pending release time
is currently derived on restore from a shared clock; spatially varying supply time requires
source-specific durable accrual. Reuse installed optics instead of rebuilding the v42 feature.
Refresh implementation details at phase start; these pointers are not frozen source layouts.

The older multicore root `e3517c4b-b3df-4786-bcf4-10a488a294d1` has a pending P4 terrain/climate
placeholder. Its body and [scaling plan](SCALING-PLAN.md) leave terrain separate from
performance delivery. This new root owns the full current terrain proposal; it does not close
that root's P3 operating review or claim older climate ideas are implemented. The installed
light ecology plan also retains its own unfinished review. No old plan is restarted or closed
by this planning task.

## Decisions and assumptions

Settled for tracking: full terrain plus seasons; fractal maps and placement; configuration
switches; independent environmental channels; ordinary owner integration.
The tagged proposals supply the starting mathematical candidates.

M0 resolves engineering details through derivation and source inspection: movement/contact
order, precision, anti-alias sampling, regional invalidation, supply transition semantics,
physical sensing and affordable scales. Numerical choices within the agreed semantics do not
require ceremonial user approval. Adopted laws belong in the governing design documents.

| Decision | Owner and recommendation | When it becomes blocking |
| --- | --- | --- |
| [DECISION] Slow terrain changes and catastrophes in this delivery | User; retain the static baseline and explicitly decide dynamic scope rather than silently excluding it | Resolve scope in M0 where possible; required before M8 implementation and final closeout |
| [DECISION] Live physical feature switches | User; world-start switches are required, live switching is optional and must preserve state and operator authority | Before live-control contracts in M1/M7; world-start configuration can proceed independently |
| [DECISION] Different physical semantics | User if water inventory, impassable terrain or recoverable gravity is desired; recommend the proposal's continuous conductance and constitutive resistance | Before replacing the candidate in M0/M3; no such replacement is assumed |
| [DECISION] Live publication and new-world cutover | User; prepare a reviewable implementation and state the checkpoint consequence | Before deployment/reset; this plan grants neither |

Unresolved decisions remain visible; unanswered earlier questions are not approval. M8 is a
real scope disposition milestone: it requires either the selected dynamic implementation or
an explicit recorded deferral. It cannot be marked complete merely because static terrain works.

Assumptions to challenge: slope and conductance may produce useful conditional returns, but
could instead create a uniformly worse region or one dominant sink. Fractal source placement
may offer reachable gaps, but initial settling or subsequent source movement may erase them.
The seasonal amplitude ceiling is not its typical realized amplitude; filtered maps may be
too weak, or food persistence may erase downturns. Source movement changes integrated external
income; report this rather than interpreting every population difference as a timing benefit.

## Milestones and acceptance

### M0 Physical contract and budgets

Scope: reconcile the tagged proposal with current genetic physiology and all ordinary
consumers. Derive the shared operations, units, disabled limits, crossing order, source-clock
integration and local sensory meaning. Resolve or assign the decisions above. Estimate
travel-before-reserve-exhaustion, material spreading, source cycle and moving-source input,
boot/map/cache memory, and sparse versus populated runtime work using existing budget tools.

Acceptance: a complete consumer/account table and defensible starting scales/configuration;
no duplicate geographic multiplier, free uphill displacement, hidden supply normalization or
new machinery-build cost. Record competing explanations and bounded measurement questions.
Evidence: source audit, algebra/budget calculations and updated governing contract. No long
ecological run is needed to choose the implementation shape.

### M1 Canonical terrain state and configuration

[depends on M0] Implement one substrate owner for height, conductance, transmission, optional
ceiling and circular seasonal components, plus generation provenance and required revisions.
Carry typed switches and meaningful controls through Rust, browser, native and harness config.
Provide current-behavior and integrated presets; select actual defaults from M0 budgets.

Acceptance: validated bounds and neutral operators, declared storage/precision, canonical maps
in the new checkpoint format, correct derived-cache restoration and old-format rejection
without migration. Disabled systems do not consume unrelated random streams. No compatibility
runtime is introduced. State added by later milestones must extend this same owner/schema.
Evidence: bounded validation, ownership, configuration parity and round-trip checks.

### M2 Fractal generation and reservoir placement

[depends on M1] Implement the proposal's named streams, periodic warped octaves, physical
scale hierarchy, resolution-aware sampling/filtering and map transforms. Sample exactly the
configured reservoir count from integrated fractal density, preserving attributes, supply
accounts, explicit zone conditioning and the current biological initialization. Discard boot
sampling tables; retain enough provenance to inspect generated density on demand.

Acceptance: macro and finer irregular features survive at physical mesh resolution; no tiled
interior, visible overlay grids, automatic low/wet/shaded/rich correlation or terrain anchors.
Independent toggles preserve unrelated initialization. Record actual seasonal amplitudes,
slopes, density/gap distributions and initial source overlaps, not just configured maxima.
Evidence: deterministic bounds/seams/stream tests, sampling checks, local map previews and
human map review; boot time and peak/retained memory. Visual rejection remains an open gate.

### M3 Geographic movement and material coupling

[depends on M1, M2] Integrate the shared slope/conductance operator into propulsion and all
passive/contact displacement, including adhesion, separation and reservoir translation.
Apply it consistently to dissolved exchange and q to external public processing time.
Preserve intracellular kinetics, per-conversion work, donor limits and uniform washout.
Update regional/footprint dependencies so entering new terrain refreshes local coefficients.

Acceptance: uphill, downhill, plateau and wet/dry behavior follow the declared law without
double payment/application, an overlap deadlock or free contact bypass. Flat neutral terrain
recovers ordinary operators; height offsets do nothing. Material transfers conserve accounts.
Evidence: bounded transport and displacement checks plus short paid traversal probes; audit
each actual movement consumer. No chemical-conversion redesign or favored species is in scope.

### M4 Unified optical geography

[depends on M1, M2] Complete transmission and optional peak clipping through the installed
illumination owner. Compose overhead geography with cell-made screening and finite paid
emission under their existing accounts. Include public reactions, private light-supported
metabolism, optical sensing and visible illumination; do not leave a private consumer unshaded.

Acceptance: all consumers agree on local exposure and footprint sampling; attenuation and
ceiling remain separately configurable, with no mean-light restoration or finite sun budget.
Evidence: declared shade/clipping examples, neutral recovery and local optical/accounting
checks. A useful shade-specialist payoff is a hypothesis, not an invented injury rule.

### M5 Local resource seasons

[depends on M1, M2; integrate movement from M3] Drive stocked release and empty waits with
the same circular local seasonal clock. Integrate exposure at actual moving-source positions,
carry time through lifecycle transitions exactly once, and persist source-specific accrued
release with the correct wait units. Retain finite inventory, ordinary refill and input ledgers.

Acceptance: nonnegative supply time, donor-bounded release, no drought deletion, neutral
recovery, uninterrupted save/restore and stationary long-run supply accounting. Report
path-dependent moving-source income and initial priming separately from timing benefits.
Evidence: short clock/transition/continuation tests including multiple transitions within a
coarse update, stationary analytic comparisons and controlled moving-source exposure.

### M6 Local mechanical feedback

[depends on M0, M3] Audit current body/contact inputs against paid effort and realized motion.
Reuse a sufficient cue or add the justified bounded local load signal through the normal
controller interface, publication cadence, genetics and checkpoint state. Do not inject
coordinates, heading, terrain labels, destinations or seasonal phase. If adding an input,
complete all controller codecs and observations rather than exposing only a harness cue.

Acceptance: a funded diagnostic RNN can receive the physical difference and express a response;
its movement and sensing costs remain explicit. No programmed fallback or extra construction
system. Evidence: single-cell cue/action/displacement traces and paid costs over hundreds of
ticks. Failed expression is retained and distinguished from an absent physical opportunity.

### M7 Observation and configuration controls

[depends on M1 through M6] Add readable height/slope, conductance, cover and season views,
with supply opportunity distinguished from material already present. Expose selected local
conditions, paid motion expenses and actual reservoir input/release through bounded queries.
Make effective flags, placement mode and numerical controls visible in ordinary configuration.

Acceptance: local and remote views agree with physics while preserving layer controls, usable
cell/chemical overlays, backpressure and observer noninterference. World-start controls work
without code changes. If live controls are selected, persist transitions and invalidate affected
caches through existing operator authority; seed/scale/placement changes still require a new
world. Evidence: ownership/integration tests, startup configuration inspection and human
legibility review. No new listener, backend or full physical-state display transport.

### M8 Changing geography scope and conditional delivery

[depends on M0, M1; implementation integrates M2 through M7] Record the user's disposition
of gradual terrain changes and catastrophes. If included, extend the same substrate with
independently configurable clocks and bounded affected regions. Reuse fractal morphology for
spatial variation; do not replace it with a grid of identical event footprints. Define each
selected event's physical action before implementation: changed fields, displacement/injury,
external work/material accounts, cache revision and durable event state/history.

Acceptance if included: all affected owners are accounted for, invalidation is local, clocks
and event state survive continuation, and events have no population-triggered rescue logic.
Evidence: constructed event/continuation checks, budget and motion review, and no-event
recovery. If explicitly deferred, record that decision and the remaining design boundaries;
do not describe dynamics as implemented or close unresolved scope by skipping this phase.

### M9 Integrated opportunities and operating acceptance

[depends on M2 through M8, including explicit M8 disposition] Use the existing harness and
local ledger. Register questions, controls, diagnostic genotypes, learning/mutation settings,
tick/wall budgets and stop conditions before runs. Begin with cell-free mechanics and short
single-cell probes; use small paired contests only where they answer an unresolved question.

Follow the causal chain from local terrain/food exposure through sensing and action to actual
access, paid travel/upkeep and survival or growth. Compare reachable alternatives during a
supply transition; distinguish static placement, substrate coupling and seasonal timing with
configuration interventions before interpreting the combined result. Record source settling,
moving-source total input and negative findings. No automatic seed sweep, horizon extension
or evolved-diversity gate. Any long observation needs its own question and bounded registration.

Acceptance: the complete selected feature works through production consumers and continuation,
with useful measured physical opportunities or explicit negative limits. Run full `make ci`;
measure matched current/integrated sparse and populated workloads, including about 2,000 cells,
at unchanged physical resolution. Report whole-runtime tick rate, stage costs, memory,
checkpoint size and boot cost. Fix introduced regressions; do not trade away architecture or
silently accept a miss of the 30 ticks/s target. Human terrain/trajectory review remains required.

Prepare reviewed defaults, authored findings, schema/cutover consequences and operating limits
for handoff. Generated data stays ignored and local. Commit, push, deployment monitoring and
fresh-world creation occur only within explicit publication/cutover authorization; a completed
planning artifact or local CI pass cannot stand in for deployed ecological evidence.

## Sulion mapping and current state

### M0 execution expansion

Sulion branch `fdeea4db-c89d-436e-85bb-e04d04c620e5`.

1. Resolve operators and ownership through `world_base`, `prepared_movement`, field vector
   transport, optical consumers and source lifecycle. Keep geographic state in the existing
   shared substrate object. Geographic translation acts after adhesion on motor/passive
   components, and on contact separation; turning in place remains independent of slope.
   Field faces carry separate outgoing/incoming conductance, preserving the same accepted
   transfer on each side. q scales public processing time, including film, but not intracellular
   metabolism. Per-source supply accrual and renewal randomness must survive checkpoints;
   lifecycle transitions consume the remainder once and release each actual mixture.
2. Record budgets and checks. Six f64 maps at 97,200 nodes cost 4,665,600 bytes; a pair of four
   directed f32 face factors costs 3,110,400 bytes. Use L=32, beta=1, q_min=.25, placement
   contrast=6, seasonal amplitude ceiling=1 and period=3000 seconds as starting integrated
   settings. A flat lowest-conductance patch halves motor speed at fixed power; a grade-one
   ascent there gives sqrt(.125) of baseline speed. These are resistance bounds, not promises
   of profitable travel. Analytical baseline uses the existing economy example, zero ticks,
   saved locally under `frontend/harness/artifacts/terrain-seasons/`.

Validation registration: bounded mechanics first (seams, conservation, neutral limits,
within-step source transitions and continuation), then four paired 300-tick diagnostic
travel/light/supply probes with mutation and private learning disabled. No automatic expansion
past these probes; paired populations only if their unresolved question is recorded first.
Measure map generation and matched 2,000-cell runtime separately, with a 120-second wall cap
per measurement. Preserve failures. Human map and trajectory review remains unverified until
the user supplies it. Subsequent expansions record concrete files and final measured outcomes.

### M1 execution expansion

Sulion branch `18bb6f8f-2fce-4e06-be57-843832e7d0a6`, steps
`20f4dad2-0380-40b3-855e-c496266067ac` and `e91274d3-1ff0-4190-9df2-fae0cbda495d`.
Implement `terrain_config`, `geography` and the existing `terrain::Shade` owner, Rust config,
world format v46 and checkpoint cache rebuild. The boot constructor needs valid canonical
arrays, so the shared map-generation portion of M2 is developed with this state boundary;
reservoir placement and map acceptance remain M2. Validate bounds, neutral configuration,
periodicity and restored map/cache consistency with real World checks. The browser settings
surface and integrated production preset are wired through M7, not a second config format.

M1 evidence: seven filtered release Rust checks passed, including periodic sampling, bounded
maps, neutral switches, slope direction and restored face caches. The zero-tick baseline
economy report is available locally. No live run or ecological claim follows from those checks.

### M2 execution expansion

Sulion branch `defad081-1ccc-4c57-9c96-7e4a839199bb`, steps
`9eaccd4b-50ed-4def-a057-02ec2ce18f5b` and `639dce87-dae0-43a0-9b97-40c027a76965`.
`terrain_generation`, `terrain_noise` and `terrain_placement` implement boot maps, named
streams, quadrature and density placement. `World::new` supplies an independent initialization
stream so changing placement cannot also alter the source-stock random sequence. Exact zone
intersections avoid remapped density. Four filtered terrain tests passed; source counts,
zone membership, attribute independence and periodic shade continuation are covered.
Whole-world previews, boot measurements and human acceptance are consolidated in M9 so the
review covers the integrated renderer, not a temporary visualization. This moves verification,
not the acceptance requirement or feature scope.

### M3 through M6 integration boundary

The movement, source and optical owners share the new substrate. Integrate these consumers
together before the next full compile: field SIMD and scalar transport use paired directional
face factors; prepared and ordinary cell motion retain separate motor/passive components
through adhesion; contact and reservoir displacement share the same resistance. Public field,
film and reservoir processing consume q. Existing private optical consumers already read the
same illumination owner; retain their actual physics and verify clipping and transmission.

Seasonal lifecycle work replaces the old shared-clock reconstruction with persisted local
accrual and private renewal RNG state, consuming every transition remainder once. Release
parcels preserve chemical composition through within-step refill changes. Add one bounded
motor-load input at the controller's ordinary base cadence, with no separate sensing machinery
or construction cost. Validate all these paths with real kernel tests and the shared final CI;
implementation is not marked accepted merely because individual files compile.

### M7 and M9 execution expansion

Sulion branch `1d1dc941-d187-49bd-a367-a076983a4aa1` covers M7 and the independent M9 checks.
M3–M6 used branch `1f0b00ee-2134-4373-aafb-229e8deeedd3`.

UI wiring proceeds with the consumer integration so native and WASM formats cannot drift.
`TerrainSettings`, typed `terrainConfig`, existing inspection and 18 display layers expose
the same canonical state. World-start switches are implemented; the live-switch question
remains unanswered. Rust rendering prepares bounded display lanes and neither observations
nor React acquire physical state. Validate all terrain map selectors in the existing native
projection and frontend boundary checks; retain human legibility acceptance.

Engineering workload: `engine/examples/terrain_capacity.rs` runs seed27 at 720×540, mesh2,
four native workers, eight warm-up and 40 measured ticks, 120-second wall cap. Compare the
same new kernel with new couplings disabled/current placement against the integrated preset,
first without cells, then with the existing 2,000-cell load fixture. These comparisons measure
terrain overhead, not the entire revision against the old executable. Include display
preparation, checkpoint/restore, peak RSS and map boot time.

The initial capacity fixture removes reservoirs. Retain that result as a cell/field workload;
it does not measure coupled source cost. Add one baseline/integrated pair with the same 240
sources restored after fixture installation and accounts rebased before ticking. Use the
same 8+40 ticks, four workers and 120-second wall cap; record actual source count, settling
displacement and external input. This bounded correction answers the omitted-source question,
not a new ecological campaign.

That comparison also exposed different attribute draws in the legacy placement path. All
placement modes now assign radius, richness and mixture shares from the same named attribute
stream, while preserving the legacy position algorithm. Repeat the matched source workload
and only the affected two seasonal probes after this correction. Keep earlier measurements
as superseded fixture evidence; do not attribute a changed supply budget to terrain timing.

Cell registration: `frontend/harness/numerical/terrainSeasons.ts`, seed701, 64×48, one cell,
300 ticks and 120 seconds per case, frozen mutation and static learning. Four off/on pairs
isolate movement conductance, load-to-turn feedback, overhead transmission and local seasons.
Moving probes use swim bias .6; the feedback intervention connects input58 to turning with
gain4. Other probes are stationary. The first three pairs receive an equal local food pulse.
The supply pair begins on one fixed source with T=2, G=6 and P=8 model seconds, explicitly
compressed to observe transitions, not validate the default P=3000. Competing explanations
are paid resistance versus absent cue/response, optical exposure versus food differences,
and changed supply timing versus changed total external income. Read actual inputs, actions,
displacement, uptake, motor cost and source ledgers. A response without net benefit is a
negative limit, not an evolved strategy. No sweep, extended horizon or population campaign.

### Local implementation and measured limits

All static consumers are installed in v46: persisted canonical maps/config/provenance,
derived directed faces, paid and passive translation, external transport/processing,
shared optics, exact supply lifecycle, local load feedback, creation controls and observation.
The proposed optional ceiling works independently and is off in the integrated preset.
No new material economy, live control endpoint, terrain mutation or migration was added.

The seed27 720×540 map retains full-detail wavelengths near 128, 64, 32 and 16 units,
with 3×3 quadrature; seasons retain approximately 128 and 64 units with one sample per cell.
Actual periodic lattice wavelengths are saved in `geography.sampling`. Independent maps have
chance correlations: height/conductance −.231 and conductance/season amplitude −.280 in this
seed. There is no generation condition forcing either. Median grade is .241, conductance
.519, transmission .821 and seasonal amplitude .337. Amplitude reaches .792; only 18.1% of
map area ever falls below half nominal seasonal supply. At the 90th area percentile, that
quiet interval lasts 475 of 3000 model seconds. Most of the world has weaker seasons.

Source nearest-neighbor gaps have median 9.01 and 90th percentile 34.18 world units. Initial
placement has 72 overlapping pairs involving 94 of 240 sites; ordinary separation must settle
these overlaps. Density-conditioned counts in 108 fixed 60-unit squares put four squares
outside two binomial standard deviations, maximum 2.45. This is a descriptive seed check,
not a reason to reject or regenerate a map. Height differences grow across mesh lags1–32;
sampled axis autocorrelation decays, and x/y gradient variance ratio is 1.15. Local images
show irregular broad regions with finer detail. Agent inspection does not replace human review.

At each starting source's environmental trough, its nearest neighbor has median .0079
greater supply multiplier, with a 90th percentile advantage of .121. Only 32 of 240 sources
have a nearest neighbor at least .1 better at that instant. This uses the bilinearly sampled
season vectors: the neighbor's multiplier at source i's trough is `1-dot(s_i,s_j)/|s_i|`.
It measures a fixed-map opportunity, not available food or successful travel. Coarse seasons
usually synchronize close neighbors; seasonal relocation will often require a longer trip
or another cue. This is a limitation of the selected initial scales, not evidence to secretly
strengthen seasons or relocate sources.

Eight registered WASM probes reached 300 ticks; ledger IDs 4414–4421. Maximum material/work
closure residual was below 3e-13 percent of declared initial plus supplied budgets. Each
case starts with one founder; final growth and expense figures include its descendants.
After the placement-stream correction, only the affected seasonal pair was repeated as
IDs 4422–4423 in `probes-seasons-final/`; both reached 300 ticks. Its final values replace
the earlier seasonal row below. The original runs remain intact.

| Intervention | Observed consequence | Interpretation |
| --- | --- | --- |
| Movement conductance off/on | Entry into the radius-2 food target at tick 32/45; cumulative uptake 7.13/10.08 and growth 4.71/6.01; motor work .849/.923 | Resistance slows arrival but can increase residence and food capture; it is not uniformly detrimental in this scene |
| No load response / authored load-to-turn response | Load input .141–.173 without response, .146–.172 with response; turn 0 versus .414–.476; growth 6.01/2.91 | The local cue and action path work. This policy misses the target and loses access; no steering advantage demonstrated |
| Transmission off/on | Optical level .250 versus .210–.213; public photochemical work .173/.079; growth 3.8179/3.8182 | Shared light changes, but this food-rich founder does not obtain a measurable growth benefit from that light difference |
| Seasons off/on, compressed clock | Release .92963 in both finite windows; supplied material .84712 in both; uptake .31513/.31597 and growth .38405/.38431 | Timing changes with negligible whole-cell benefit here. This does not validate default-season migration or substantial local food downturns |

The nearby food target is reachable with terrain active, but this is not evidence that the
default world's 34-unit gaps are affordable. The zero-tick budget gives newborn maintenance
.01066 and motor work .004 per model second at effort .5, before repair/transport. For a
.5 usable-work reserve with no income, that supports at most 34.1 seconds under frozen
age-zero rates. Aging and other expenses shorten it; retained chemistry and encountered food
can extend it. Default terrain scale and seasonal timing remain experimental calibrations.
Do not turn these negative/limited results into a reason to add a navigation oracle or a
dispersal reward. Regional supply-transition access and evolved exploitation remain unverified.

Evidence and reproduction: ignored `frontend/harness/artifacts/terrain-seasons/` contains
the baseline budget, versioned map previews, matched capacity reports and `probes/` exact
checkpoints, traces, manifests and archived WASM. Generate maps with the native
`terrain_preview NEW_PATH integrated` example and render them using
`python3 frontend/harness/terrain_report.py INPUT_JSON NEW_DIRECTORY`. Run the registered
cell checks from frontend with `pnpm exec tsx harness/numerical/terrainSeasons.ts NEW_DIRECTORY`.
The native `terrain_capacity baseline|integrated sparse|populated` example emits its report.
Append `sources` to retain the reservoirs in the populated workload.
Do not overwrite completed evidence or launch a new horizon merely to obtain a positive result.

### Operating acceptance and remaining decisions

The final matched source workload retains 2,000 cells and 240 reservoirs on mesh2,
four native workers. Both layouts have identical per-source attributes and summed richness
227.8269. Measurements are short operating checks, not confidence intervals or live-host
certification. No resolution or physical precision was reduced.

| Measurement | Current placement, new couplings off | Integrated terrain and seasons |
| --- | ---: | ---: |
| Whole-runtime ticks/s | 38.77 | 41.47 |
| World boot | 412 ms | 1453 ms |
| Supply-overlay preparation | 11.43 ms | 11.41 ms |
| Checkpoint size | 75.62 MB | 76.23 MB |
| Save / restore | 115 / 253 ms | 113 / 240 ms |
| Process peak RSS | 658 MiB | 660 MiB |

The initial no-reservoir 2,000-cell workload measured approximately 53 ticks/s in both
configurations. Integrated overlay preparation initially cost 18.7 ms; direct canonical-node
reads and one shared temporal factor reduced it to 10.1 ms in that workload. The final
source-present comparison stays above 30 ticks/s. Source/medium, base movement, exchange and
physiology measured 5.64, 2.74, 9.25 and 5.71 ms per tick respectively in the integrated case;
detailed timings remain in the local report. Do not interpret small single-run differences
as a terrain speedup. Static map/cache storage is approximately 7.0 MB with ceiling off and
7.8 MB with it on, excluding display buffers, other world state and boot temporaries.

During 8 warm-up plus 40 measured ticks (9.6 model seconds), the integrated sources traveled
159.90 units summed over 240 sites. Net displacement median/90th percentile/max was .024/2.219/4.650
units. Initial overlap pairs fell from 72 to 67: this short interval observes settling, not its
completion or freedom from later congestion. Release was 348.06 material versus 437.43 in the
neutral-clock comparison; there were no refills yet, hence zero new external material in
either window. Different seasonal exposure is permitted to change finite-window release;
the retained source ledger distinguishes that from a change in starting stock or rate.

`make ci` passes: 356 Rust library tests, 15 native-server tests (one pre-existing ignored),
17 chemical-definition integration tests and 82 Vitest tests in 32 files, plus format, lint,
types, ownership, experiment-storage, documentation and Terraform-format checks. The
production SPA build passes. Existing 19 ESLint warnings and the shared-WASM atomics warning
remain. Local/remote selector tests and observer noninterference pass; human map/trajectory
and browser legibility acceptance remain unverified.

M7's world-start controls are complete. Its optional live-control choice is consolidated
with M8's unresolved scope disposition. M8 awaits either explicit inclusion/design of changing
terrain and catastrophes or explicit deferral, plus the live-switch choice. M9's independent
automated work is complete; final acceptance awaits that disposition and human review.
The root and review branch remain open. Next action is the user's scope answer and review of
the local maps/ordinary motion, not an automatic ecological campaign or deployment.

| Milestone | CLI position | Phase ID | Status |
| --- | --- | --- | --- |
| M0 | 1 | `e2c59191-b8fe-4ae2-ac21-5861ed2f1d9d` | completed |
| M1 | 2 | `e05cb7ae-93e9-4432-9cad-5792806f3a7e` | completed |
| M2 | 3 | `6af021e5-cde8-4d7c-80fa-ce5bf7237e55` | completed; human map acceptance retained in M9 |
| M3 | 4 | `0829fa18-29f9-4811-b448-42438fc2f329` | completed |
| M4 | 5 | `e2127a86-6d91-4bca-ad40-80633057ed31` | completed |
| M5 | 6 | `f0b9375a-63a1-4a73-ae2b-cd1ad0011dc9` | completed |
| M6 | 7 | `a533282d-c53c-4415-a36a-c53443840881` | completed |
| M7 | 8 | `0d9bb644-3343-4a18-b0a2-d2aa72a3b160` | completed; human legibility review retained in M9 |
| M8 | 9 | `9e27cb8d-7af6-4fcb-bc2f-1569160e7a9b` | blocked on explicit scope disposition |
| M9 | 10 | `79aee6e3-2c43-4bb1-9d90-c1d7e1d5a95d` | blocked on human review and M8; automated work complete |

Final checks and operating measurements are recorded here before handoff. Earlier validation
caught stale v45 reader/header expectations, the former 35-center default assertion and a
frontend file-length excess; those were corrected. Publication, fresh-world cutover and human
trajectory acceptance remain separate. Do not close M8 or the root from a missing answer.
