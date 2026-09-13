# Sparse spatial ecology and long observation

Status: implemented candidate accepted after user review on September 13, 2026; all seven phases
are complete. Long-term ecological outcomes and browser endurance remain open.
Sulion plan: `5874e2d8-68cc-47f5-8e74-dd7ac873fa5c` — Build sparse spatial ecology and long observation.
This is the work design, September 13, 2026. The [runtime contract](bacteria.md) and
[calibration](../calibration.md) describe the new default. The
[plan closeout](plan-closeout.md) records how earlier unfinished work was disposed of.

<a id="spatial-intent"></a>

## Intent and preserved semantics

Prepare a genuinely large, spatially uneven world where individual cells can establish local
populations, disperse, colonize, diverge and encounter one another again. The user should be able
to follow that history directly over days or weeks. Diversity, adaptation and coexistence remain
possible outcomes of the continuing simulation, not communities to evolve and certify in advance.

Cells remain organisms: each moves, senses, pays costs, reproduces, inherits, mutates and dies.
Local populations are observer-defined groups of cells. They receive no collective controller,
resource account, reproductive privilege or membership signal. Retain one periodic XY substrate,
local fallible information, resource-funded actions, immutable registered genomes, explicit
inheritance and the controller boundary. Diagnostics never choose live parents or promote winners.

This changes the simulation as well as its display. Viscosity, food density, dimensions, source
placement, diffusion, renewal, founder placement and other numerical settings are adjustable.
Preserve physical meaning and accounting, not old trajectories or an exact parameter set across
revisions. Within a supported version, saves must still preserve the state needed for continuation.
Reject incompatible schemas explicitly; do not silently reinterpret a user's continuing world.

<a id="spatial-landscape"></a>

## First landscape hypothesis

Lower average resource density and stronger spatial variation should leave substantial poor
habitat between productive occupied regions. A rich local patch may become crowded while the
world as a whole remains sparse. A population ceiling is a safety limit, not carrying capacity.
Do not hide cells, impose population quotas or distribute resources according to desired occupancy.

The first candidate is an irregular arrangement of resource patches, some near other patches and
some separated by much larger gaps. Vary size, richness, composition and renewal. This could allow
frequent local movement alongside less frequent exchange over larger distances. It is a revisable
first iteration, not a permanent hierarchy, required geometry or metaphor to reproduce. Change or
abandon it if measurements or human observation show that it works poorly.

Replace the default two food halves with a candidate landscape whose differences occur locally.
Finite deposits and accounted environmental renewal must support both depletion and continued
opportunity. Consider initial dissolved food, diffusion and recycled material as well as source
positions: widely spread usable food could erase the intended gaps. Consider source lifetime and
relocation: opportunities that disappear before arrival could make colonization physically futile.
Temporal variability, including the previously deferred boom/bust idea, is an optional hypothesis
about local renewal, not a required synchronized global cycle.

World extent must grow relative to actual body size and local travel distances. Camera zoom or
slowing organisms cannot substitute for distance. Field resolution and storage cost must be designed
alongside extent; changing raster resolution must preserve the meaning of concentrations, diffusion,
uptake footprints and material totals. Keep one physical implementation shared by browser and harness.

Founder count and placement are part of the starting-condition design. Provide a documented viable
start without preassigning ecological factions, filling every opportunity or importing diagnostic
winners. The number of eventual occupied regions remains unconstrained.

<a id="spatial-movement"></a>

## Movement and local resource economy

The old viscosity of 0.4 and dense food supply are not accepted calibration for this design.
The [residency record](../calibration.md#calibration-residency) explains that food density increased
to sustain slower cells. Reusing one part while spacing the food farther apart could strand them.
Earlier displacement measurements describe those bodies and conditions, not travel guarantees.

Tune movement and resource geometry through physical relationships:

- Body-dependent speed, turning and directional persistence determine useful displacement.
- Motor expenditure, maintenance, usable energy and reserves determine affordable transit.
- Patch size and food residence time determine whether cells can remain and reproduce locally.
- Distances and the distribution of gaps determine reachable opportunities and isolation.
- Renewal, depletion, competition and environmental modification determine the value of staying.

Cells should be capable movers. Residence should follow local opportunity and behavior rather than
a globally thick medium used to suppress mixing. Movement into poor habitat can fail through normal
starvation, injury or inability to reach food; do not add an arbitrary death roll for crossing an
observer-defined population boundary. More motor investment need not always be better.

The relevant hypothesis is that geography allows different local histories without eliminating
dispersal. Very rapid mixing and effectively impossible transit are competing failure modes.
State candidate relationships before changing parameters; use controlled comparisons to identify
which change matters. Do not freeze all other settings forever merely because the redesign needs
several coordinated changes.

<a id="spatial-observation"></a>

## Population observation and rendering

Use the hierarchy ecosystem, local population, individual cell. At world scale, show actual
occupied regions as restrained soft shapes, resource opportunities as a distinct layer, and
isolated dispersers as visible marks. Zoom should resolve these shapes into their constituent cells.
Contours summarize occupation; they must not imply walls, adhesion, ownership or hidden organisms.

Keep three identities separate: a resource location, its current spatial population, and the
ancestries of the cells living there. One ancestry can occupy several regions; one region can
contain several ancestries and inherited phenotypes. Migration already moves inherited variants
between populations under clonal reproduction; it does not require enabling horizontal transfer
or introducing mating.

Define spatial grouping in world units with periodic seam handling, independent of zoom. Specify
how membership changes, sparse bridges, splits and mergers affect identity, and how temporary
fluctuations avoid flickering labels. Preserve connections across founding events using recorded
cell ancestry and movement. An arriving cell, reproduction at a new site and an established local
population are different observations; document the convention used to call a founding event.

Trait colors need stable meanings over time. The current requested three-way k-means partition
cannot serve as durable population identity. Use explicit trait scales and separate ancestry views,
show within-region variation, and distinguish inherited targets from grown bodies and recent actions.
Observed divergence does not by itself prove an adaptive advantage. Preserve independent field
controls, camera navigation and cell inspection while adding population selection.

<a id="spatial-continuation"></a>

## Continuation and retained history

Design population identity, ancestry retention, observation history and recovery together. Retain
enough spatial history to explain founding, dispersal, contact, splits, mergers and losses after an
absence or restore. State sampling resolution and uncertainty; missing observations cannot become
invented migration paths or claims of extinction. Retain births, deaths, population shares, inherited
trait changes and the distinction between surviving cells and surviving descendants.

Automatic recovery checkpoints, retained recovery choices, versioned observation records and
bounded working memory/storage need a client-side design. Preserve scientific parentage or explicitly
document any reviewed loss of query capability. Benchmark accumulated births and history as well as
living population size. Background execution, interruption, save latency and responsiveness need
their own checks before promising days or weeks of unattended operation.

Follow [ADR 0019](../adr/0019-single-language-kernel.md): one implementation per physical rule.
Measure the larger world's bottlenecks before selecting worker placement or acceleration. The old
shared-Wasm inference pool and COOP/COEP work are not prerequisites. An execution worker, if justified,
must have coherent ownership of the simulation. No backend or hosted storage is authorized here.

<a id="spatial-work-sequence"></a>

## Work sequence and acceptance

Initial implementation candidate: 320 × 240 world units at the existing one-unit field resolution,
48 finite renewal sites around seven irregular abiotic centers with an 18-unit spread, 3-unit
source-radius scale, 600-second lifetime scale and 120-second mean renewal wait. Richness and
composition vary by site. Ten percent of each initial finite inventory begins dissolved locally;
uniform initial food is zero. Following user review, the 48 identical founders start in at least
two separated colonies, using the first resource site and the site farthest from it by periodic
distance. This is a starting condition; subsequent persistence, contact and colony counts remain open.
Viscosity 0.004 is a provisional movement value, 100 times lower than the previous 0.4. None of
these values is a durable target. The raster is sixteen times the previous area with unchanged
body size, concentration, uptake and diffusion units; no field rescaling is proposed initially.

Phase 2 checks: seeded initialization/renewal, finite priming conservation, restart identity and
spatial concentration, plus one 100-tick default-world performance measurement with mutation and
learning disabled. This measures execution cost, not ecological viability. Phase 3 registered
and ran [residence/transit controls](../spatial-probes.md). Failure of a pilot changes the candidate,
not its success criterion. The user accepted the world after the two-colony startup and recovery
identity fixes.

| Phase | Deliverable and evidence |
| --- | --- |
| 1. Specify the world and scale contract | Choose candidate extent, resource distributions, renewal, starting conditions and physical scale relationships. Inspect affected owners and record parameter hypotheses, failure modes, storage costs and small proof points. The accepted direction permits redesign; numerical choices remain hypotheses. |
| 2. Implement the sparse resource landscape | Build the candidate landscape and any required spatial field representation in the shared runtime, with explicit persistence. Check finite inventories, renewal accounting, periodic geometry and actual spatial variation. |
| 3. Calibrate movement and local survival | Retune viscosity and the coupled body/resource economy using short residence, transit, food-access and founding probes. Measure local cues, actions, displacement, expenses, survival and resource-funded births. Revise the landscape if necessary. |
| 4. Track spatial populations | Implement observer-only grouping, identity continuity, ancestry attribution and versioned event/history shapes. Verify splits, mergers, founding, mixed ancestry and seams without feeding labels into biology. |
| 5. Render ecosystem, population and cell scales | Integrate regions, visible dispersers, stable trait meanings, population selection and zoom transitions. Preserve independent controls; correct UI language that treats chosen clusters as an intended outcome. Prepare human review of actual trajectories and spatial legibility. |
| 6. Support continuing observation | Implement recovery and retained spatial history with bounded memory/storage and explicit ancestry semantics. Check same-version continuation, accumulated-state costs and interruption behavior. |
| 7. Integrate and hand over the starting world | Make the chosen world the documented tick-zero default, record active and disabled mechanisms and remaining limits, run required CI and proportionate operational checks, and obtain human visual review before claiming visible behavior accepted. |

Use the existing short harness and ledger. First ask whether a patch supports local reproduction,
whether an organism can reach and use another opportunity, and whether depletion changes the cost
of staying. Include comparisons that distinguish physical inability from an unexpressed controller
response. Inspect actual funded bodies as well as genetic targets. Register the question, horizon,
controls and stopping decision before each assay; do not start a broad parameter or seed sweep.

Acceptance concerns credible opportunities, faithful observation and operational continuity.
It does not require a particular population count, stable species count, successful invasion pair
or long agent-run evolution campaign. Negative proof points can change the design. Observation may
later justify a focused inherited-variant comparison; it is not a standing certification task.

Implementation adds observer-only density groups sampled every 25 ticks, stable inherited-trait
color scales, zoom-dependent region/cell rendering, retained spatial samples and rolling local
recovery. [Observation](population-observation.md) defines grouping and event uncertainty;
[continuation](../continuing-observation.md) records storage bounds and operational measurements.
These remain separate from ecological claims. Sulion records all seven phases completed after
user review. Future motion and legibility changes still require human review. Start a development
server only on explicit user request.
