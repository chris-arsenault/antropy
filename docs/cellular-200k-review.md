# Cellular organization: 180,000-tick analysis

The [deeper cross-system analysis](cellular-180k-connections.md) connects this evidence to the
retrieved design history. It corrects a post-restore body-signal omission in the inspector's
derived work examples; recorded simulation flows, ancestry and accounts are unaffected.

## Registration — September 20, 2026

User requested publication followed by one 200,000-tick run and full-spectrum analysis.
Implementation commit `fad7fa9` is pushed to main. Sulion plan
`c30cb814-9668-468c-8735-f1ffb1c47923` tracks this observation. No simulation formulas,
founders, environmental parameters or mutation settings change during the run.

Run physical v33, default seed 27, chemistry seed 101 and the ordinary default configuration.
The [joint design](design/cellular-organization-and-exchange.md) adds retained-mixture rate
coupling, inward receptors, neural activity/construction/retirement, core-funded division,
bounded enzyme-program duplication/deletion and shared interfaces. Binding, illumination,
photoreception, source renewal, paid bodies and inheritance remain active. Enable the existing
all-cell measured-flow observer; disturbance and horizontal transfer stay disabled.

### Questions and competing explanations

1. Which inherited bodies, processing routes and behaviors spread, persist, disappear or replace
   each other? Distinguish actual funded stock, inherited targets, age and local access. A founder
   sweep can contain later differentiation; color groups and genotype counts are not strategies.
2. Do inward sensing, selective enzyme activity, construction allocation, retirement and changing
   repertoire counts become expressed? Contrast absent genes/stock, ineffective neural connections,
   constitutive requests and condition-sensitive responses. Changed genes alone are insufficient.
3. Does retained chemistry support different processing organizations or mostly the same profitable
   path? Separate uptake, intracellular conversion, exported material and material retained in bodies.
   Trace dominant intermediates and recycled routes; chemical standing abundance is not food use.
4. Do contacts materially change access or transfer food? Does transfer accompany costs, crowding,
   injury and viable descendants? Receiver return is not evidence of paid deliberate attack or
   cooperation. Public cross-feeding remains possible even with zero direct contact uptake.
5. Do distinct local communities and chemical environments persist, with gaps and exchange, or
   spread into diffuse similarity? Inspect maps, periodic nearest-neighbor RMS/distributions,
   field concentration and source renewal composition. Clustering is a context for evolution.
6. How do light/medium changes, source release and local resource depletion accompany die-offs and
   rebounds? Follow surviving branches, diets and costs instead of assigning every crash to light.
7. How do sparse field support, throughput, memory, checkpoint size and material/work accounts
   develop? Recording cost and ordinary runtime cost are separate measurements.

The horizon permits many generations and environmental changes. It covers roughly 6.7/2.2/0.65
of the three configured illumination periods; it is not a complete slow modulation cycle or
proof of indefinite diversity. The [v33 delivery checks](cellular-organization-results.md)
establish funded sensing, mixture-dependent throughput and ordinary-turnover receiver return.
The 600-tick startup ended with 60 cells and 17 divisions but no contact capture or retirement.
The [older v31 run](integrated-200k-review.md) and [v32 user review](material-habitats-review.md)
are historical context, not matched causal controls for all intervening changes. V32's failed
public-food opportunity remains negative evidence, not superseded by a different positive result.

### Budget, provenance and stopping

One continuous trajectory, seed 27, maximum 200,000 ticks. The first 1,000 ticks are the resource
pilot within that horizon; continue the same world if finite accounts pass the existing 1e-7
relative residual test and resources remain below caps. The first 1,000-tick cost projection is
reported, not treated as a reliable prediction of late population cost.

Stop on horizon, extinction, an engine limit, failed accounts, eight hours elapsed, RSS 4 GiB,
WASM 2 GiB, output 48 GiB or free disk below 20 GiB. Preserve incomplete evidence. No automatic seed
expansion, restart with altered defaults, horizon extension or parameter sweep. Initial free
disk is 319 GiB. The previous 200k study took 37 minutes, but this does not predict v33's outcome.

Use `integrated200k.ts` and `runRecorded`: full population/genotype samples every 1,000 ticks,
checkpoints every 10,000 plus initial/final, all pages of every 250-tick accepted reaction window.
Retain exact WASM, configuration, harness digests, lineage records and ordinary ledger result.
Sample accounts and process/WASM memory every 1,000 ticks. No full frames are added to browser
messaging; this is the existing headless study boundary.

Read checkpoints without advancing them. Extend `inspect_ecology.rs` to report all v33 actions,
internal mixture and stock, program occupancy, actual contact geometry and frozen-state inward/
optical responses through ordinary controller inference with private state cloned. Check that
inspection leaves its restored snapshot unchanged. Grouping remains descriptive; no inferred
role is installed into the population. Analyze the whole trajectory and survivor ancestry, with
explicit sampling limits and private-return versus adaptation distinctions.

After the main trajectory, permit two 100-tick operating checks from its final checkpoint,
10 warmup ticks and 30-second cap each: closed versus active Web/Phenotypes, same binary and
configuration. These 220 additional ticks measure execution only. No further ecological run is
registered. Keep generated evidence local; publish no data to presentation services.

Sample the existing stage profiler on every fifth measured step within those same 100 ticks.
It advances the same physical step; a scalar zero-step read obtains its status. This adds no
simulation ticks. Record its 20 phase-distributed samples separately from the complete operating
measurement; exchange preparation is a subset of exchange, not an additional stage. Load the
WASM archived beside the checkpoint for both measurements.

Command from `frontend`:

```
pnpm exec tsx harness/numerical/integrated200k.ts harness/artifacts/cellular-200k-v33 docs/cellular-200k-review.md
```

## Results

The user stopped the planned 200k run because of its cost and selected the validated 180k
checkpoint for analysis. The last census before interruption was 181k; records beyond 180k
remain local but are excluded from all endpoint comparisons and aggregate flow results below.
The continuous run was interrupted without changing its physics. Read-only inspection restored
the 180k checkpoint and verified that inspection left its physical snapshot unchanged.

The two registered short operating measurements use that same 180k checkpoint. This is an
explicitly shortened observation, not a completed 200k campaign.

### Findings at the selected endpoint

The 6,975 living cells reach maximum generation 233 after 115,213 divisions and 108,286
starvation deaths. All share one original founder, but three cells alive at 40k account for
three distinct descendant branches at 180k: 5,691 northern residents, 1,109 southern residents
and 175 peripheral/outlying cells. The northern family's share rises from 33.5% at 100k to
81.6% at 180k; the southern family falls from 64.2% to 15.9%. Continued evolution here includes
local differentiation and substantial replacement, not an unchanged equilibrium.

| Endpoint neighborhood | Cells | Leading consumed chemicals | Median motor/core | Common inherited program counts |
| --- | ---: | --- | ---: | --- |
| North, near (170,95) | 5,691 | 119/120/135/136, together 82.0% | 0.0301 | 5–6 |
| South, near (179,154) | 1,109 | 80/96/112/128, together 72.0% | 0.0224 | 6–7 |
| Periphery, near (220,107) | 98 | 0, 84.2% | 0.0517 | 2–3 |
| Periphery, near (237,63) | 64 | 0, 99.0% | 0.1520 | 2–3 |

These consumed fractions describe living cells' lifetime processing, which can repeatedly
recycle the same private material. They are not fresh-food fractions. Among 6,617 eligible
living importers, **4,583 (69.3%) obtain most imported material outside IDs 0/136**; only 341
obtain a majority from one other chemical. Combined survivor imports are 35.4% IDs 0/136.
Whole-population flow bounds during 170k–180k are wider, 46.2–83.9%, because only the leading
eight import identities and the remainder were retained in each observation window.

The eight largest reaction routes now connect 119/120/135/136, carrying 66.2% of all accepted
flow. Another four major routes connect 80/96/112; the twelve together carry 72.0%. Thus useful
local metabolic differentiation persists while population-weighted chemical activity becomes
more concentrated. The entropy-equivalent route count falls from 150.8 at 40k–50k to 41.2 at
170k–180k; 549 routes carry 99% of the latter window. The median functional enzyme breadth is
2.96, despite most genomes carrying five or six programs. This is broader than the founders'
single distinct kernel but not steadily expanding functional diversity.

The strongest four late routes form the circulation **119→120→136→135→119**, alongside
119↔136 and 120↔135 exchange. The reciprocal-pair fraction falls from 88.3% at 90k–100k
to 63.7% at 170k–180k, but that metric misses four-edge circulation. Its decline is not
evidence that cells stopped recycling. Chemical paths should be read as cycles, not only
counted as reversed pairs.

Inward sensing is funded in 4,657/6,975 cells; removing it changes an available request by
more than 0.01 in 2,037. Removing light readings changes such a request in 3,530. Only 39 cells
show substantial selective enzyme activity, and construction remains mostly constitutive.
Mixture-dependent available rate multipliers span 0.730/1.000/1.246 at the 10th/50th/90th
percentiles. Internal chemistry therefore affects throughput, and sensory connections affect
control, while conditional metabolic switching remains weak in this run.

Direct neighbor transfer provides 1.95% of cumulative uptake and 1.98% in the final 10k window.
Crowding is much more widespread: 6,709 cells have contacts, the median has 11 neighbors and
only 25.4% field-facing interface. Neighbor competition matters physically, but these records
do not show coordinated antagonism, complementary division of labor or evolved meta-organisms.
The private cycles already yield usable work without requiring a partner. In 170k–180k,
63.5% of net reaction work overflows energy capacity; uphill processing spends only 0.41% of
gross captured work. This helps explain weak pressure for finer regulation during favorable
conditions, alongside the saturated founder control biases discussed below.

The world has not become spatially uniform in these snapshots. Half the extracellular material
occupies 2.73% of the map at 180k, with clear gaps between the colonies. Source nearest-neighbor
median falls from 5.07 initially to 2.30, while RMS rises from 14.94 to 17.33 because isolated
sources remain. Both values and the maps matter: an RMS increase alone would misdescribe
the tightly packed source groups. Only 13.9% of field chemical groups are active. Mean source
renewal weight on IDs 0/136 falls to 73.4%; this unweighted mixture average is not release flux.
Chemical 186 never dominates: its largest sampled field share is 0.0747%, ending at 0.00439%.

**Recommendation:** preserve this ecology while fixing mature contact-search cost and the
save/export boundary. The later design question is what makes conditional regulation and
public exchange repay their costs alongside profitable private recycling. This observation
does not justify another wholesale chemistry redesign or assigning cooperative cell roles.

### Resource accounts and numerical resolution

All 720 accepted-flow windows through 180k reconcile after exact duplicate-route removal.
The eighteen complete 10k cellular-work balances have maximum absolute residual 3.81e-8.
Global material residual stays below 4.0e-11 of cumulative initial-plus-supplied material.
These checks include explicit numerical loss; they do not mean numerical removal is zero.

At 180k, initial material 7,361.97 plus supplied 70,075.17 balances held material 8,021.51,
washout 67,202.70 and numerical removal 2,212.92. Numerical removal is 2.86% of total input.
The existing field concentration cutoff of 1e-6 contributes to this account, alongside floating
point effects; those contributions are not separately recorded. It is an explicit resolution
loss, not a cell's transformation yield. No cutoff was changed during this study.

### Midpoint: real diversification, mostly mixed diets

At tick 100,000 there are 4,579 cells. Of 4,228 cells meeting the lifetime-uptake eligibility
rule below, 2,736 obtain more than half their imported material from chemicals other than
the initial source IDs 0/136. Only 109 obtain more than half from one particular nonseed
chemical. This is predominantly broad mixed feeding, not a collection of narrow food specialists.
Living cells' combined lifetime imports are 44.34% IDs 0/136. Whole-population interval flows
are a different denominator: the top-eight-plus-remainder observation bounds their share
at 51.04–87.45% during 90k–100k. The wide interval must not be replaced by the survivor figure.

The four identical enzyme programs within each founder have one shared conversion kernel.
At 90k the median stock-weighted functional repertoire is 3.32; 2,577/2,715 cells score at
least two. At 100k the median is 3.24, while genetic counts are primarily four, five or six
programs. Program expansion therefore includes real conversion differences, although gene
count still overstates funded functional breadth.

Two cells alive at 40k, IDs 15640 and 15406, obtained 38.3% and 34.3% of their lifetime imports
from source IDs. Their descendant families account for 2,383 and 558 cells at 100k: together
2,941/4,579, or 64.2%. These are retrospective ancestry observations, not a rare-invasion
experiment. They show that mixed-food consumers can establish lasting branches, while their
descendants continue to change. All living cells descend from founder 1 by 50k; that founder
label does not describe their later bodies, food use or enzymes.

At 100k the three main spatial neighborhoods differ:

| Approximate center | Cells | Source-ID share of survivor lifetime imports | Median motor/core stock |
| --- | ---: | ---: | ---: |
| (181,155) | 2,941 | 39.6% | 0 |
| (162,94) | 1,532 | 43.0% | 0.0500 |
| (219,116) | 75 | 98.0% | 0.0897 |

The peripheral group primarily consumes 0 and exports 97/130/129/146. Both large groups
increasingly consume and produce 119/120/135/136; the southern group also has substantial
80/112 processing. Thus differentiated bodies and mixed diets coexist with a shared internal
energy cycle. Different colony colors alone would miss this common metabolic organization.

### Turnover and local conditions

The first large sampled contraction is 957 cells at 47k to 335 at 50k. Complete ancestry records
contain 2,651 starvation deaths and 2,029 divisions during that interval. Uptake increased
during 47k–48k while gross captured work per processed material fell. The evidence does not
support a simple explanation in which all source delivery stopped.

The later contraction falls from 4,847 cells at 103k to 2,263 at 110k and 1,591 at 114k.
There are 16,459 starvation deaths and 13,875 divisions during 103k–110k. Reproduction continues
throughout the die-off. At 110k the southern neighborhood contains 1,166 cells with median
light 0.281 and usable energy/capacity 0.065. The northern neighborhood contains 1,043 cells
with median light 0.741 and energy/capacity 0.936. Local light and chemical work signals differ;
the trajectory does not isolate illumination from source access and medium feedback.

By 130k the southern neighborhood has recovered to 605 cells. Of these, 564 descend from
cell 79763, already in that neighborhood at 100k; the remaining 41 descend from cell 86419,
then an outlying cell at (206,124). All 1,583 cells in the northern neighborhood descend from
its own 100k residents. Southern recovery therefore primarily expands a surviving local
branch, with a smaller contribution from outside. Cell 79763 had an inherited motor/core
target of 0.0327 at 100k, when the southern colony's median funded motor stock was zero.
The recovered colony's median inherited ratio is 0.0353 and funded ratio 0.0352. Its leading
consumed chemicals are now 80/96/112/128, while the northern colony retains 119/120/135/136.
This is inherited and metabolic differentiation through a die-off, not simply restoration
of the same population. The observation does not isolate which changed trait caused success.

The 150k–160k contraction is spatially uneven. Total population falls from 4,622 to 3,955,
but the northern neighborhood grows from 2,463 to 3,148 while the southern neighborhood falls
from 2,097 to 755. Both retain their distinct dominant processing sets. At 150k, southern
median illumination is 0.531 versus northern 0.800, with stored-work fractions 0.793 versus
0.996. By 160k both surviving groups are near capacity again. A global endpoint count would
hide this substantial difference in local success and subsequent physiological recovery.

Later growth also adds biomass. From 100k to 180k, population rises from 4,579 to 6,975 and
funded biomass from 2,163.6 to 4,099.1. Mean funded mass rises from 0.473 to 0.588, after its
earlier fall from the founder value 1.53. The later population increase cannot be explained
solely by dividing the same material into progressively smaller bodies.

### Which new mechanisms carry activity at 100k

Funded inward sensing is present above the reporting threshold in 3,709/4,579 cells. Removing
inward readings changes an available request by more than 0.01 in 2,051 cells; a small tonic
perturbation does so in 1,591. Removing optical readings changes a request by more than 0.01
in 1,371 cells. Most response is in movement or transport, rather than enzyme activity.

Genetic repertoires vary, but activity and construction requests remain mostly near one.
Only 28/4,579 cells have a greater-than 0.25 spread among their funded enzyme activity requests
at 100k. The founder activity/construction biases start at 3, exactly the controller's saturation
boundary, which can weaken the effect of small changes. Meanwhile uphill work is less than 1%
of gross captured work in 90k–100k, so this observation also offers little evidence of a large
energy return from suppressing costly reactions. Saturated initialization and weak pressure
for regulation remain competing explanations; neither was altered during the run.

Retirement requests exceed 0.01 in 2,360 cells, but cumulative retired material is 101.0 versus
26,996.5 constructed, only 0.37%. Requests and physical remodeling are different quantities.
Likewise 4,342 cells have contact neighbors, yet direct contact accounts for only 1.27% of
cumulative uptake through 100k (2.21% in 90k–100k). Median field-facing interface is 0.536.
Crowding is substantial; direct neighbor feeding is still a minority route. Deliberate attack,
cooperation and dependence between specialists are not established by these observations.

Retained-mixture coupling is active: the substrate-weighted rate multipliers available to funded
enzymes have 10th/50th/90th percentiles 0.704/1.002/1.284 at 100k. These are available kinetic
effects, not accepted-flux weights or isolated evidence that retaining a particular chemical
caused success. Repair is also a substantial expense despite low standing damage: in 90k–100k,
cells spend 16,401 work on repair, 37,563 on maintenance and 3,323 on movement. At 130k even
the 90th percentile of remaining damage is zero, while median repair effort is 0.973.
A checkpoint showing repaired bodies must not be interpreted as absence of injury pressure.

Control differences also become spatially organized. At 170k, the 62-cell peripheral group
has 57 two-program genotypes and five three-program genotypes, median retirement request 0.529,
and effectively no remaining inactive enzyme stock. A second 27-cell peripheral group has
median retirement request 0.466 and mostly three programs. In contrast, the two large colonies
have median retirement request zero and mostly five to seven programs. The peripheral groups
still primarily consume 0 and carry relatively more motor stock. This distinguishes a simpler
processing organization from the larger private-cycle repertoires. A high retirement request
with no obsolete stock does not itself demonstrate ongoing remodeling or a fitness return.

Crowding increases with the later growth. Between 100k and 170k, population rises 14.9%
(4,579→5,262), while contact edges rise 63.8% (11,251→18,434). Median neighbor count rises
from five to seven, and median field-facing interface falls from 0.536 to 0.395. The graph
remains local: the largest observed neighbor count at 170k is 22. This is a changing workload
and access constraint, not simply more copies of the initial-cell performance fixture.

### A private recycling opportunity

Reciprocal conversions account for 88.32% of accepted reaction flow in 90k–100k. Signed
reaction work is 106,947, with 782.5 spent on energy-consuming conversions. Repeated processing
can recover external work; reciprocal flux is not evidence of a material-producing loophole.

The original algebraic example omitted the derived body signal after restore and is withdrawn.
With current body projections reconstructed, the median 100k drive in the northern and surviving
southern ancestry branches is approximately (-0.626,+0.483) and (-0.564,+0.530). A pure
119→136→119 round trip yields about +0.407 and -0.095 units of work per unit on each leg;
120→135→120 yields +4.942 and +4.887. These are reference pairs under frozen conditions, not
whole-cell yields or a claim that installed enzymes are pure pair maps. Actual accepted cyclic
flows remain measured; the profitable paths and their rankings require the complete local signal.
The [connected analysis](cellular-180k-connections.md) quantifies that dependence and distinguishes
private recycling from collective habitat effects.

More programs do not imply indefinitely broadening active chemistry. In 40k–50k, the twelve
largest routes carry 40.1% of reaction flow; in 130k–140k they carry 58.7%. The corresponding
entropy-equivalent route counts fall from 150.8 to 75.2. Although 61,358 distinct routes appear
in the latter window, 1,261 carry 99% of flow. Distinct local cycles coexist with concentration
of processing into a small portion of the available chemical web.

During 130k–140k, 88,742 of 142,550 net reaction-work units become capacity overflow: 62.3%.
The shared accounts reconcile this surplus as discarded work, not additional material.
Large favorable-period surpluses and little uphill expenditure provide a concrete reason
that finer activity control may repay little in those conditions. They do not rule out
regulation being valuable during deprivation. Falling maintenance per cell also accompanies
smaller funded bodies; it must not be reported as an isolated gain in metabolic efficiency.

### Runtime cost: contact search is the first optimization target

September 21 follow-up: [the contact optimization](contact-performance.md) retains the mature
overlap set and raises matched throughput to 8.14 ticks/s. The measurements below describe
the original v33 implementation and remain the baseline record.

Restoring the exact archived WASM and 180k checkpoint gives **2.43 ticks/s with the measured
observer disabled**, and **2.35 ticks/s with ordinary Web/Phenotypes queries enabled**. Each
measurement hit its 30-second cap, completing 74 and 71 measured ticks after ten warmup ticks.
Both collected 14 stage samples; the proposed 100 measured ticks were not reached. Ledger
4256–4257 records these costs. This is a real mature-state execution problem, not merely the
exhaustive route recorder. The tests exclude GPU painting and accumulated browser-session state.

| Sampled stage | Observer disabled, ms/tick | Active panels, ms/tick |
| --- | ---: | ---: |
| Sources | 0.19 | 0.51 |
| Fields and footprints | 9.63 | 10.28 |
| Sensing/controller, including contact graph | 71.47 | 73.52 |
| Movement, including contact resolution | 214.43 | 214.42 |
| Exchange | 82.51 | 82.66 |
| Physiology | 23.17 | 34.74 |
| Maintenance/lifecycle | 1.82 | 2.34 |

Exchange preparation accounts for 76.63/74.08 ms inside the exchange rows, not additional cost.
Fourteen samples do not balance every physiology phase perfectly, so stage fractions are
approximate. Ordinary closed-panel step time averages 380.02 ms; census and selected inspection
add 30.29 ms per measured tick. These observations do not attribute every millisecond to a line.

Code inspection and the saved geometry expose a concrete inefficient search. `movement::pairs`
sets the grid width from twice the largest radius, then scans nine bins for every cell. At 180k,
radius min/median/max is 0.092/0.213/1.628. The resulting 98×73 grid generates **5,201,125 unique
candidate pairs**, against **38,071 actual overlapping pairs**: about 137 candidates per contact.
This count reconstructs the existing bin rule at the saved positions; it is not a timing estimate.
The same pair search runs for movement each tick and separately in sensing and exchange on
physiology updates. Pair tests also repeatedly compute radii and body sums. Inventory material
already has a cached total; it is not summed over 256 chemicals for every radius lookup.
The maximum-radius search predates v33; this feature added its sensing and exchange consumers.
Larger, denser evolved populations expose that existing weakness as well as the added work.
No matched older binary was run on this v33 state, so these timings do not isolate the feature's
entire causal contribution from changes in population size, bodies and packing.

The recommended first performance change is a tighter radius-aware spatial search plus per-pass
geometry reuse. Preserve actual overlap, normalization, donor competition and update timing;
do not reduce interaction strength or cap competitors to recover speed. A single large cell
should not broaden the search for every small cell in a dense colony. Reuse across different
physical stages requires invalidation after movement and material changes. No such optimization
was applied in this observation, and its speedup remains unmeasured.

Private inventories also become nearly dense in chemical identity, but subnormal values were
absent in the inspected late snapshots. Tiny material and repeated work remain possible later
targets; this evidence does not support blaming floating-point subnormals or garbage collection.

### Demonstrated browser persistence limit

The 100k physical checkpoint is 196.51 MiB before adding observation metadata. The browser
package encoder rejects a raw snapshot plus metadata above 192 MiB, and the normal export
uses the same encoder. Consequently this state cannot be saved through either normal path.
The message suggesting export before continuing does not provide a usable escape at this
size. The headless trajectory continues independently. No recovery policy or simulation
constant was changed during this study.

Serializing the existing components separately attributes 103.77 MiB to stored genotypes,
70.89 MiB to living cells, 19.34 MiB to the field and 2.31 MiB to complete ancestry. Sources,
chemistry, events and remaining state total about 0.21 MiB. This failure is not primarily
ancestry history or the number of retained saves.

Classifying the genotype map against the existing retention rules finds 4,583 entries referenced
by living construction or installed machinery, three additional founder/catalog entries, and
4,311 unreferenced entries awaiting pruning. That last category occupies 50.28 MiB. Ordinary
pruning returns early while the map has at most `2 * living_cells + 64` entries; the checkpoint
serializes that slack. Excluding these unused entries would reduce this physical snapshot to
about 146.23 MiB without removing cells, needed machinery identities or ancestry. This is a
measured representation opportunity, not a performed repair or assurance that larger populations
will fit the same cap. Save and export should also provide a usable path when necessary live
state itself exceeds the normal recovery budget.

At 180k the raw checkpoint reaches **243.28 MiB**. Living cells occupy 107.98 MiB, genotype
records 109.71 MiB, fields 19.34 MiB and ancestry 6.05 MiB. Unreferenced genotype slack is
28.25 MiB; removing it alone would still leave approximately **215.03 MiB**, above the browser
limit. The checkpoint is valid and fully usable headlessly. Fixing cache slack alone is therefore
insufficient for browser save/export at this endpoint.

## Reduction methods and reporting defect

The live measured-web observer can put a route in its touched-key list more than once:
`Flux::reaction` appends when the accumulated value is zero, including when the new amount
is also zero. A later positive contribution then appears repeatedly in paginated output.
The analyzer requires repeated copies to have identical amounts, keeps one record per
input/output pair, excludes zero routes from diversity counts, and reconciles every resulting
window with the independent accepted-reaction total. Raw observations remain unchanged.
This corrects analysis of the recorded pages; the observer defect remains in the published
runtime. No simulation arithmetic or running binary was changed for this study.

The web report also sorts the complete touched-route list for each 64-row page. A window
with 54,000 entries requires about 844 complete sorts when recorded exhaustively. The main
trajectory's elapsed time includes that workload, checkpoint generation and observations.
Final operating checks use a freshly restored world and only the ordinary first-page queries;
they do not isolate an accumulated-session browser slowdown or include GPU painting.

Individual chemical counters cover a living cell's own lifetime and reset at birth. They
therefore describe survivors, not all historical flow. A majority-nonseed importer obtains
more than half its lifetime imported material from IDs other than 0/136, has lived at least
100 ticks and has imported at least 0.01 material. This does not identify the material's
producer or distinguish construction food from energetic food. Consumption beyond lifetime
imports can use both internally produced and inherited stores.

Spatial groups are periodic connected components with neighbors within six world units,
the existing local habitat scale. They describe neighborhoods and can connect through a
chain of cells; they are not species, cooperative organizations or selection boundaries.
Genetic program counts, actually funded programs and carried retired stock are reported
separately. The 1e-6 stock cutoff and 0.01 action-response cutoff are reporting thresholds.

Frozen controller comparisons clone private state and use ordinary inference. They remove
the inward readings, perturb inward tonic readings by 0.05 times actual receptor gain, or
remove optical readings. Counts concern funded or constructible actions. The comparison
establishes functional sensitivity at the saved state, not behavioral benefit or adaptation.
Retained-mixture modifiers are weighted by actual substrate and compiled catalytic weights;
they describe available reaction-rate changes, not the share of accepted flow or net payoff.

Functional repertoire breadth uses each installed enzyme's nonidentity linear conversion
kernel (catalytic coefficient times product weight). Let its funded stock fraction be w_i
and the cosine similarity of kernels i,j be C_ij. The descriptive breadth is
`1 / sum(w_i*w_j*C_ij)`. Identical copies score 1; equally funded disjoint kernels score their
count. This measures installed conversion differences without assuming that every available
route is currently used. Initial and 90k snapshots have supplemental read-only reductions;
later checkpoints include this measurement directly.

Signed reaction work is `sum(route_amount * (input_potential - output_potential)) +
external_work - reaction_heat`. Subtracting it from gross captured work gives work spent on
energy-consuming conversions. Each complete 10k window is checked against operating expenses,
division/overflow/death heat and the actual change in stored cellular work. This accounts for
uphill processing rather than treating all gross captured work as available surplus.

## Evidence and reproduction

The [interrupted-run record](evidence/cellular-180k/interrupted-result.json) registers the
preserved 180k endpoint as ledger **4258**, with explicit user stopping reason and original
configuration/binary digest. SIGINT prevented the runner's normal finalizer from executing;
the untouched original manifest therefore still says `running`. The separate interruption
record is authoritative for completion status. No simulation was advanced to reconstruct it.

Durable figures and measurements:

- [Population, chemistry, control and performance over time](evidence/cellular-180k/trajectory.png)
  ([PDF](evidence/cellular-180k/trajectory.pdf)).
- [Spatial changes](evidence/cellular-180k/spatial.png),
  [dominant reaction routes](evidence/cellular-180k/chemical-web.png),
  [endpoint phenotypes](evidence/cellular-180k/phenotypes.png), and
  [work budgets](evidence/cellular-180k/budgets.png).
- [Operating costs](evidence/cellular-180k/cost.json) and
  [checkpoint byte attribution](evidence/cellular-180k/storage-180000.json).

Full local observations, raw checkpoint reductions and the 25 MiB analytical summary remain
under `frontend/harness/artifacts/cellular-200k-v33/`. The validated physical state is
`trajectory/checkpoint-180000.bin`; `trajectory/engine.wasm` is the exact run binary, SHA256
`88185501b3d03182925d3ec7e01cbdc0025b26203c98f4daa756e6111568027c`.
The analysis rejects missing endpoint samples, reaction windows or mismatched ancestry ticks.

Reproduce without advancing the simulation, using a new output directory:

```
python3 frontend/harness/cellular_review.py frontend/harness/artifacts/cellular-200k-v33 NEW_OUTPUT --through 180000 --ancestry frontend/harness/artifacts/cellular-200k-v33/ancestry-180000.json
```

This study changes inspection, analysis and documentation only. Production simulation formulas
remain those in the published `fad7fa9`. No browser session or live user save was modified.
Validation: `make ci` passes 168 Rust unit tests, 17 Rust integration tests and 71 frontend
tests, plus formatting, Clippy, TypeScript, documentation and Terraform formatting checks.
ESLint retains 17 existing warnings and no errors. Python analysis modules compile, and the
completed reduction checks route totals, energy balances and ancestry/endpoint consistency.
Hosted CI/deployment status remains unverified: the intended credential broker rejected the
GitHub API lookup with HTTP 403, `secret is not unlocked for this terminal`.
