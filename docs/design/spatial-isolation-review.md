# Spatial isolation and directional ecology

September 18, 2026. Study and proposal, not authorization to change simulation mechanics.

**September 19 correction:** the user rejected the fixed geographic basins proposed below.
They are retained as a rejected proposal, not an implementation instruction. The
[resource-binding investigation](resource-binding-investigation.md) supersedes that remedy:
shared attraction and nonlinear repulsion must bind neighborhoods through current material,
with cellular work able to change the balance. Migration and perpetual turnover are not
requirements. The 754,372-tick user checkpoint establishes loss of separated neighborhoods;
the earlier use of remaining clumps to qualify that failure was misleading. The source and
cell maps are local in `frontend/harness/artifacts/diffuse-754372/geography.png`.

Sulion review: `a9aec36b-ba81-4f17-a8a5-f3f9e36314e9`.
Future implementation uses the existing environmental root
`5e88cd8a-1314-4622-9989-4bb02af68581`: CLI phases 6–9 map to E1–E4, all pending.
The original E1 fixed-basin milestone must not be executed. Earlier environmental
evidence and its unresolved review remain recorded in that same root.
This extends [spatial ecology](spatial-ecology.md) and the
[environmental ecology work](../plans/archive/ENVIRONMENTAL-ECOLOGY-PLAN.md).
Multicore implementation remains [deferred](../../SCALING-PLAN.md).

## Observation registration

**Question:** which parts of current ecology erase initially separated opportunities:
source displacement, dissolved-material spread, similar local transformations, or cell dispersal?
The user requests rich neighborhoods separated by substantial poor habitat, supporting local
communities and occasional dispersal. The solar-system analogy describes unevenness across
scales; it does not require literal orbital mechanics or a fixed number of communities.

**Predictions:** if mobile renewal erases geography, source displacement and falling spatial
contrast should precede wider food coverage. If diffusion dominates, broad coverage can grow
without comparable source movement. Similar chemical mixtures can also erase ecological
differences while total density remains visibly patchy. Population mixing and inherited
differences must be measured separately from food coverage.

**Initial conditions:** current ordinary v27 defaults, seed 27, chemistry 101, 320 × 240,
mesh 2, 48 sources and 48 founders in two starting colonies. No intervention or tuning.
The previous 5,000-tick v27 run and successful 1,000-tick optimized continuation establish
execution viability; neither establishes enduring spatial separation. Read the resource-economy
prediction before stepping. The earlier v18 50k study is historical, not a control for v27.

**Budget:** one run, 50,000 ticks, 1,800-second wall cap. Samples every 250 ticks,
checkpoints every 2,500 ticks, ordinary habitat/lineage/account observers. Stop on extinction,
nonfinite state, failed accounts, 3 GiB process memory, 1.5 GiB WASM, 3 GiB case archive,
4 GiB study archive or less than 20 GiB free disk. Retain the terminal checkpoint and all
negative or incomplete findings. No automatic horizon extension or seed sweep.

**Diagnostic correction during execution:** optional reaction tracing became expensive as its
per-lineage linear edge lists grew (31,372 pairs in one living lineage at tick 22,250).
The initial segment was interrupted and the retained tick-22,500 physical checkpoint resumed
with this optional trace disabled. The physical binary, configuration and 50k endpoint stay
the same; the continuation subtracts elapsed time from the original 1,800-second wall budget.
Ordinary population, genomes, habitat samples, accounts and source observations remain active.
Analysis replaces original post-22,500 samples with the continuation and records both segments;
late cumulative per-lineage reaction edges are unavailable. The initial manifest remains an
interrupted artifact, not a completed run. A first continuation attempt failed before advancing
because the habitat observer required tracing; making that dependency optional fixed the runner.

**Analysis:** read checkpoints without stepping. Measure periodic source displacement,
source spacing, resource concentration and coverage, chemical mixture differences, and
population/lineage geography against the same fixed initial regions. Inspect both local and
neighborhood scales. Regional labels are observer annotations, never controller inputs.
These observations can establish loss of separation and identify mechanisms; attributing a
particular share to migration versus diffusion may require a later bounded intervention.

**Decision:** recommend a staged change to shared geographic fields and external directional
forcing, with small mechanism tests and measured serial cost. Preserve chemical group actions,
funded cells, material/work accounts and Rust-owned borrowed rendering. Do not prescribe an
evolved community count, install ecological roles, or replace the existing mathematical model.

## Findings from the completed 50k observation

Completed through tick 50,000, with 201 samples and 21 checkpoint positions. Continuation ledger
**4116** records the endpoint; both segments use the same archived physical binary and config.
The study took 1,605 seconds including the interrupted diagnostic segment. Population ended at
**3,516**, with 19,875 divisions and three surviving founder lineages. These observations support
preserving the current chemistry while improving spatial separation and external opportunities.

| Measure | Tick 0 | Tick 5,000 | Tick 25,000 | Tick 50,000 |
| --- | ---: | ---: | ---: | ---: |
| Population | 48 | 342 | 311 | 3,516 |
| Median source displacement from its start | 0 | 2.99 | 10.48 | 11.04 |
| Sources outside all original radius-30 neighborhoods | 0/48 | 0/48 | 10/48 | 6/48 |
| Chemical 0 coverage at concentration ≥0.001 | 8.86% | 71.62% | 78.43% | 75.90% |
| Largest connected chemical-0 area at ≥0.003 | 2.24% | 48.02% | 27.60% | 22.83% |
| Incoming-species material outside those neighborhoods | 0.0046% | 16.86% | 39.45% | 47.09% |
| Local chemical mixture difference from global mixture | 0.122 | 0.359 | 0.455 | 0.488 |

Distances are periodic world units. Incoming-species material means ambient IDs 0 and 136, not
all potentially useful food. Radius-30 neighborhoods are fixed observer regions around the seven
initial centers; their complement covers 76.02% of the world. The evidence also reports radii
18 and 45. Chemical mixture difference is mass-weighted total variation in 20 × 20 bins; zero
means identical mixtures. Coverage/connectivity use the actual field mesh and periodic four-face
adjacency. These concentration screens are not universal cell viability thresholds.

### What explains the observed loss of isolation?

**Dissolved feedstock establishes broad connections early.** By tick 5,000 the large ≥0.003
chemical-0 region covers 48% of the world and contains 43 source positions, while median source
displacement is only three units and every source remains within an original neighborhood.
Transport therefore needs attention independently of long-distance source movement. By 50k,
47.09% of the two supplied species lies outside the radius-30 neighborhoods. Those gaps remain
poorer: their mean concentration is 28.07% of the neighborhood mean. They are not empty space.

**Sources loosen the original grouping but do not disperse uniformly across this world.** The
number of source pairs less than 20 units apart falls from 193 to 115. Nevertheless 42/48
sources remain in an original radius-30 neighborhood, and their median nearest-neighbor distance
falls from 5.07 to 2.93. Median net displacement is 11.04 units, maximum 29.47; median sampled
path length is at least 52.99. Thus considerable local motion and regrouping coexist with
limited net displacement. Freezing the sources would remove behavior that is not established
as the primary cause. A paired intervention would be needed to assign its precise contribution.

**The two starting colonies are not maintained.** All descendants of colony two disappear by
the tick-5,250 sample. It starts beside one source, with almost eight times less estimated
renewal supply than colony one. At 50k all living cells descend from colony one; 2,796/3,516
(79.52%) occupy its nearest-center region. Local descendants do colonize other regions. Tracking
individual IDs finds 63 transfers by 55 cells between disjoint radius-30 neighborhoods, including
21 transfers after tick 40k. These are sampled, incomplete counts of actual movement. Shared
founder ancestry alone would not prove ongoing exchange or rule out subsequent local adaptation.

**Chemical and population density differences remain substantial.** The regional mixture
difference increases, and 3,436/3,516 cells (97.72%) still lie within the original radius-30
neighborhoods. Chemical 0 holds 23.61% of ambient material at the endpoint and 136 holds 6.56%;
the next most abundant chemical is 127 at 3.72%. This run does not show every location converging
to the same mixture or uniformly distributed cells. The supported concern is weak and uneven
separation of productive neighborhoods, with an especially fragile second founding site.
Ancestry composition also differs locally: descendants of founder 15 are 1,956/2,796 (69.96%)
of region 0, while descendants of founder 5 are 299/429 (69.70%) of region 5. These regional
majorities are observations, not a demonstrated explanation of their adaptive advantage.

**Working hypothesis:** initial geometry and continuing transport are poorly matched. There
is no persistent abiotic geography supporting the initial arrangement, low-concentration food
halos connect parts of it quickly, and one founding site lacks the renewal of the other. Mobile
sources contribute to changing geometry, but the observations favor addressing the shared
geographic medium and initial resource budget over a source-specific restraint. External
directional forcing can add different local opportunities after the spatial arrangement works.
It should build on the regional chemistry that already develops.

### Evidence and limits

The [retained evidence](../evidence/digital-chemistry/spatial-v27/README.md) includes
[maps over time](../evidence/digital-chemistry/spatial-v27/geography.png), full reduced metrics,
observed transfers, endpoint accounts and segment provenance. Every checkpoint's geographic
reduction and binned chemical totals agree with the existing observer's field amount.
The maximum continuation residuals are 4.57e-8 material and 2.26e-6 work. The archive remained
below its registered limits. This is one seed and one trajectory, not a source-motion
counterfactual, proof of evolved niche benefits, or browser endurance certification.

The optional recorder slowdown is a measurement cost: `Trace::reactions` searches accumulated
per-lineage edge vectors linearly. Late per-lineage cumulative reaction tables are unavailable
after the no-trace continuation. Ordinary field, organism, source and global account observations
remain available. Do not compare this trace-heavy study's whole elapsed time with production
tick benchmarks. No production physics changed in this review; `make ci` passed with the
existing 12 lint warnings.

## Mechanism audit

The current landscape exists as an initial arrangement. `sources::landscape` draws seven
centers and places 48 unequal sources within radius 18. `World::patch_centers` subsequently
serves definition/observation and validation; production forces do not use these centers.
`Source::advance` moves each source through the shared medium and renews its next finite batch
at its current position. It continues moving during its empty waiting period. There is no
persistent environmental feature that retains a resource neighborhood.

This is not an absence of attraction and repulsion. `medium_response::force` already contracts
the owner's shared chemical profile against two signed medium gradients and a positive pressure
gradient. Sources, dissolved chemicals and bodies use that language. Its background is mobile
material; the initial neighborhood scale has no continuing representation. Strengthening one
force globally would change aggregation without supplying the missing geographic structure.

Current climate is a local chemical response, not an independently driven climate. Its two
coefficients come from local dissolved, source and embodied chemistry. A single external work
strength multiplies local engagement for cellular, reservoir and abiotic transformations.
There is no elevation or independently oriented/time-varying external driver. Equal local
mixtures therefore offer equal environmental opportunities anywhere on the map.

The zero-consumer renewal estimate is 1.9515 material units/model-second, with washout half-life
693.15 model-seconds (3,465.7 ticks). For incoming chemicals 0 and 136, the unimpeded diffusion/
washout lengths are 20.50 and 7.12 world units. These are analytical scales, not measured food
access radii; impedance, drift, conversion and consumption change the actual field. They are
already comparable to the initial source-cluster radius. Low-density gaps need an explicit
transport and maintenance budget, not just distant source icons.

The initialization also places colony two at the source farthest from colony one, without a
neighborhood supply criterion. In this seed the first colony's nearest-center region has 20
sources and estimated mean renewal 0.5940 material/model-second; the second has one source and
0.07563. Both start with 24 cells. One of the seven nominal regions receives no sources at all.
Two centers are only 27.6 units apart, so their radius-18 starting distributions overlap; other
centers have nearest neighbors as far as 108.4 units away. A count of seven centers therefore
does not describe seven equivalently independent, supplied communities.

## Rejected proposal: persistent basins with directional exposure

Keep the current chemical definitions, transformation group, inheritance and paid cell machinery.
Add persistent geography to the existing geographic response, then let a directional external
input modulate the existing transformation-work term. Develop and measure these separately.

### 1. Give the neighborhood scale a persistent carrier

Store one smooth periodic elevation field `h(x)` with broad basins and smaller local depressions.
Generate it from a bounded multiscale basis at initialization, using the existing landscape seed,
extent, region count and spread as geometry inputs. Cache values and face differences. Initial
sources and the two starting colonies sample productive basins of this same field; no per-source
home coordinate, spring, teleportation or hidden population destination is introduced. The
particular basis and basin arrangement remain revisable; choose their physical scales from the
observed spread and cell travel budget before implementing them.

Use the existing pressure potential as the insertion point. With positive projected load `L`,
pressure coefficient `k`, terrain strength `b`, shared profile `(a, r, i)`, and signed medium
features `H0,H1`, the proposed constitutive potential and force are:

```
P(x) = k L(x)^2 / 2 + b h(x)
F = a grad(H0) - r grad(H1) - i grad(P)
```

This retains the existing density pressure and profile contraction. In the face stencil add
`b (h_right - h_left)` to the existing pressure difference; finite owners sample the same
gradient before their existing bounded velocity update. Local crowding can still repel sources
inside a basin while the broad gradient retains a neighborhood. Reservoirs remain mobile,
composition-sensitive owners. Terrain acts on dissolved material and bodies as well, through
their existing profiles. It is not a source-only positioning rule.

Elevation is a nonconsumable boundary field, not invented chemical stock. The added potential
organizes passive geographic motion; it does not change chemical reference potential or grant
usable cellular energy. Any later coupling that extracts work from terrain requires an explicit
external work account. Avoid automatically adding height to drag: the intended isolation comes
from geography and poor habitat, while motors retain their existing paid capabilities.

Use the same donor availability and outgoing-fraction bounds as current transport. Increasing
the terrain term must not quietly force many transport passes or bypass the existing drift
bound. Precompute the terrain contribution per face and reuse it for every chemical group.
Start with one new force-strength control; do not introduce independent attraction constants
for every owner or a taxonomy of terrain types.

There is a simple organizing balance behind this choice. Ignoring diffusion and the two signed
interaction terms only for this calculation, stationary material with positive profile `i`
requires `k L²/2 + b h = C` on its occupied support. Thus `L² = 2(C - b h)/k`: a broad low
basin can hold a dense neighborhood, while density pressure resists further concentration.
`C` is set by available material, not an assigned target population. Diffusion, finite source
interfaces and chemical interactions prevent treating this simplified balance as a prediction
of exact live cluster shape; the source/cell-free probe must check it in the ordinary operator.

### 2. Budget the gaps and the distances together

Choose basin width, basin spacing and total area using three measured scales: dissolved feedstock
spread, source displacement over a renewal cycle, and paid cell transit before reserves expire.
Local patches should overlap enough to support a neighborhood; the poorest routes between
neighborhoods should require sustained transit. Motors should remain useful within a neighborhood
and make some dispersal possible. No genome is instructed to stay in a basin.

Place the starting colonies in two separated neighborhoods that pass the same local supply
budget, rather than choosing the most distant source regardless of its surroundings. Keep
unequal richness and unoccupied opportunities. This is an initial-condition criterion, not a
runtime survival guarantee, minimum population rule or balancing subsidy.

First retain current chemical diffusion and cell motion. Determine whether the shared geographic
potential actually maintains poor gaps while allowing local movement. If diffusion still joins
the basins, increase geographic separation relative to its measured spread before globally
reducing every chemical's mobility. World area and number of rich basins need not grow together:
scaling both at constant spacing would reproduce the same connectivity at greater cost.

A proposed parameter set must include a static source/maintenance/transport budget and a small
cell-free and single-cell probe. Concentration thresholds used in plots are not viability
thresholds for every evolved cell. Read installed transport/reaction costs to establish whether
a particular cell can pay for transit or remain in a gap.

### 3. Introduce anisotropy through a shared external driver

Geographic unevenness and direction are different properties. A collection of symmetric basins
supplies unequal habitat; a sun direction supplies oriented exposure. Use the slope of the same
height field as a bump-map normal, and one periodic traveling phase for the external driver:

```
n(x) = normalize((-dh/dx, -dh/dy, 1))
phi(x,t) = omega t - dot(k, x)
s(x,t) = e cos(phi) + vertical sin(phi)
I(x,t) = 1 + a dot(n(x), s(x,t)),   0 <= a < 1
epsilon(x,t) = epsilon0 I(x,t)
```

Here `e` is the horizontal unit direction of travel and `k` a nonzero periodic wave vector
`(2 pi m / width, 2 pi n / height)` with integer `m,n`. `vertical` is perpendicular to the XY
plane. Consequently `s` is a unit direction and the exposure factor lies between `1-a` and
`1+a`. The existing open work supply remains the mean background; one contrast amplitude and
one rotation timescale introduce directional variation. There are no independent regional clocks.
Choose the timescale against measured reaction, reserve and travel times: excessively fast
forcing would average away the intended difference, while slow deep troughs could remove every
funded opportunity. The paired return probe owns that decision.

These three-component normals are surface attributes of the periodic XY world, not a third
movement coordinate or a separate planet simulator. The nonzero spatial phase matters: merely
rotating one sun at fixed altitude would illuminate flat basin floors identically. The proposed
phase gives separated basins different timing; terrain orientation changes their response to it.
This is bounded artificial forcing, not a claim of solar irradiance or atmospheric physics.
Actual darkness, latitude-dependent mean input, seasons and climate transport remain subsequent
questions. A fully dark half-cycle should not be introduced before measuring reserve endurance.

Pass the same sampled `epsilon` into cellular, source and abiotic transformation work. Retain
their current group actions, recognition coefficients, branch bounds and explicit external-work
ledger. This modulates the current open energy input; it does not claim a finite photon budget
or add a new material source. Calibrate the baseline illumination against current work budgets
before any population run, since reducing energy everywhere could extinguish the existing circuit.
Do not compensate by granting cells free enzymes or by adding chemical-specific rescue rules.

Direction belongs to physical space; chemical interaction coordinates belong to the chemical
manifold. Do not identify those axes or rotate chemical IDs when the sun rotates. Illumination
is the scalar bridge: direction and terrain determine exposure, and existing chemical response
determines which transformations benefit. Ecological usefulness requires a measured change in
relative returns between capabilities, not merely brighter colors or faster growth everywhere.

### Mathematical and computational boundaries

- Material balance, donor positivity, group composition and external-work accounting remain
  invariants. The added geographic field does not redefine the chemical manifold.
- Constant height has zero geographic force; adding a constant to height changes neither force
  nor bump normals. Uniform unit exposure recovers current transformation work. These limits
  must use the ordinary operators, not a separate reference implementation.
- Translating the world and its geography together must translate the result. Spatial rotations
  or reflections must transform gradients and the external direction together. Test exact grid
  symmetries; a rectangular periodic grid does not have arbitrary exact rotational symmetry.
  A fixed sun or terrain breaks the state's symmetry intentionally, without choosing a lineage.
- Preserve the chemical relabeling/basis covariance covered by the existing action tests. Terrain
  uses existing profile values as scalar material properties; it does not assign privileged IDs.
- Keep one Rust-owned field and ordinary borrowed rendering. Cache static terrain and normals.
  Recompute illumination at bounded geographic cadence, with an error bound tied to rotation rate,
  and contract it only over active chemical support. Do not reactivate empty species for climate.
- First budget terrain and exposure storage as `O(geographic nodes)`, independent of 256 chemicals,
  and arithmetic as shared per-face/per-node work. Measure complete serial ticks on the current
  retained world. Multicore is a separate backlog item, not the performance escape route.

## Proposed implementation sequence

This sequence has not been implemented. Its fixed-basin premise was rejected on September 19;
use the resource-binding investigation above for the next scope. External directional work
remains a separate future topic. This review changes no production physics.

| Stage | Deliverable | Smallest decision test |
| --- | --- | --- |
| E1 Persistent geographic medium | Height owner, cached differences and shared pressure contribution; sources/cells/field use it | Constructed cell-free source depletion/renewal, reversed terrain drift, retained local crowding separation, and measured leakage of both incoming chemicals across a basin rim. Source retention alone is insufficient. |
| E2 Connected neighborhoods, poor inter-neighborhood routes | One geometry and resource budget for initial sources, two colonies and unoccupied opportunities | Static spread/transit calculation, then short funded-cell probes of local motion, gap crossing and local access; human motion review. Preserve negative crossing results. |
| E3 Directional external work | Bump normals, one rotating external direction, shared illumination sample in all three transformation paths | Fixed/rotated illumination at matched chemistry changes paid returns as predicted, preserves balances, and produces at least a constructed conditional advantage before any evolution claim. |
| E4 Observation and serial cost | Geographic/exposure overlays and local population/chemical comparisons through bounded existing observers | Relevant invariants, ordinary whole-tick benchmark, `make ci`, and user visual review. Register a bounded ecological continuation only if it answers a remaining timescale question. |

E1 and E2 should land before E3. E3 does not repair absent spatial retention by itself: a rotating
forcing over an otherwise homogeneous medium could simply give every location the same average
conditions. Persistent terrain lets the same external input create reproducibly different local
opportunities. Neither stage promises a prescribed number of surviving lineages or communities.

### Decisions and ownership

Settled constraints are single-threaded execution, shared constitutive math, local funded RNN
cells, open accounted inputs, meaningful geographic separation, and the existing chemical
action algebra. The implementation must preserve Rust ownership and the current observation
boundary. Multicore execution is deferred by the user.

The added height term and directional exposure above are the recommended design, not implemented
or measured behavior. E1 selects the terrain basis and strength using force/transport bounds.
E2 selects spacing and starting neighborhoods from resource and travel budgets, considering
fewer better-separated neighborhoods within the present area before enlarging every allocation.
E3 selects forcing direction, contrast and rotation timescale from conditional-return
probes. These numerical choices belong to implementation; no user question blocks the proposal.

Considered alternatives: freezing sources would remove migration but leave broad chemical
halos; source-only tethers would bypass the shared medium; uniform extra washout or reduced
diffusion could shrink halos but would not create durable geographic identity; lowering cell
speed would undermine dispersal. They are weaker first interventions than adding the missing
persistent carrier and measuring the existing transport against it.

Dynamic erosion, finite radiative-energy allocation, atmospheric circulation, anisotropic
diffusion tensors and larger-area/multicore execution remain deferred. Implementers may revisit
them only when a specific ecological opportunity or measured scaling limit requires them.
The proposed directional input already supplies anisotropy without a new climate solver.
