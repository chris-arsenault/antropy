# Terrain shade and organism-built light ecology

September 25, 2026. Sulion root: `ad5eb2f9-36a9-4447-b18a-6cc910c7cb46`.
Status: execution authorized September 25, including all phases and commit/push on the current
branch. M0–M5 are complete; M6 validation and publication are in progress. No new server,
destructive live-world reset or save migration is authorized.

## Outcome and first principles

Give organisms meaningful opportunities to exploit and alter optical conditions: time activity
around the existing solar cycle, seek permanent shelter, construct additional shelter, emit
paid light, and respond to other organisms' light. Colonies and mobile cells should encounter
different possible returns on their investments. Neither organization is a prescribed winner.
The purpose is ecological agency and conditional specialization, not a more elaborate light map.

Start every milestone by asking: what physical opportunity is missing, what actual state
supplies it, what shared operation changes that state, and who pays? Derive the units, bounds,
ownership, numerical update and computation together. An attractive formula, extra variation,
visible congregation or passing accounting test alone does not establish that opportunity.

The [computational foundation](../design/chemistry/computational-foundation.md),
[transformation algebra](../design/chemistry/transformation-algebra.md),
[composed runtime](../design/chemistry/composed-runtime.md) and
[ownership contract](../design/chemistry/data-ownership.md) remain authoritative.
Equations below are candidate contracts and derivation obligations. M0 must place selected
proposed laws in their existing design owners, clearly separated from installed behavior;
implementation milestones update the runtime contract when those laws actually land.
This plan must not become a competing source of governing equations.

### Boundaries that control the design

- Sunlight arrives from above as an externally prescribed, non-depleting drive. Neighboring
  exposed cells do not divide a solar allowance. A wide colony has no automatic dark center.
- Permanent geographic shade is part of the feature. It does not require organisms to evolve
  construction first. Funded cover adds environmental agency; it does not replace terrain shade.
- Keep one scalar optical stimulus. Accounting provenance is not a new chemical light channel,
  wavelength taxonomy, controller source label or hidden directional cue.
- Preserve all chemical identities, exact finite transformation actions, funded material,
  birth-fixed capabilities and ordinary local RNN decisions. Changed rates are irreversible
  kinetics, not new group elements. No assigned nocturnal, producer or consumer types.
- Cells remain on the periodic XY plane with one internal mixture. An overhead material owner
  is a proposed extracellular phase, not cell Z motion, internal compartments or a second world.
- Do not add new bonds, attachment networks, species-specific opacity, direct sunlight injury,
  colony caps, forced dispersal, dormancy or an ecological reward to manufacture differentiation.
  Computational bounds must follow finite ownership, declared resolution and operating cost.
- Reuse ordinary sparse regional owners, material/work allocation, genetic operators and the
  renderer. No general radiation framework, ray inventory, per-emitter recipient history,
  global iterative solver, new backend, compatibility runtime or save migration.
- A new state or parameter needs an identifiable physical quantity and consumer. Record its
  units, limiting case, cost and why existing quantities cannot express it. Do not equate
  impedance and opacity merely to reuse a coefficient; do not invent a property table instead.
- Complete the interacting feature. A changed sun pattern, isolated emitter demonstration or
  unused optical helper cannot substitute for shelter, emission, chemistry and observation.

## Prior decisions and current implementation

The user requested day/night activity, hiding, emitted light and responses to emitters while
retaining both colony and mobile opportunities. The September 24 correction rejects finite
solar competition and sideways sunshine. The subsequent discussion includes terrain shade,
funded overhead cover and emission, with a proposed change to public photochemical kinetics.
The September 25 request selects a detailed plan and explicitly requires first principles,
strong shared mathematics and proportionate architecture.

The completed scalar-correction plan `ed492c49-dd7e-4a73-a33b-7375d4bd5a14` delivered the
single-light correction, not this feature. The completed terrain design task
`95e0ca28-0f12-459f-9e3b-8b482c8f9488` produced a backlog proposal, not terrain code.
Neither is reopened or represented as unfinished implementation of this plan.

For this feature, the user's correction supersedes the future finite-sun requirement and
sideways-shadow assumptions in [light ecology](../design/light-ecology.md), and the dependent
finite-sun wording in [persistent geography](../design/persistent-geography.md). Their
historical evidence remains valid in its stated version. Reconcile that future-design wording
in M0; do not silently treat it as authority to restore a finite solar donor.

Source inspection for this plan used checkout `f3dec43`, physical v41. Some overview documents
still describe older versions; current source and composed laws establish the installed paths.

| Existing producer or consumer | Reuse and required change |
| --- | --- |
| `engine/src/illumination.rs` | Analytic scalar solar field, separable axis cache, footprint sampling and pure observation evaluator. Extend shared exposure; retain source cycle initially. |
| `engine/src/reaction_medium.rs`, `transformation_work.rs` | Separate kinetic signal and illuminated drive; shared transformation coefficient, potential difference and work accounting. Extend funding without changing chemical actions. |
| `engine/src/weathering.rs`, `climate.rs`, `source_medium.rs` | Shared public transformations, sheltered elapsed time and reservoir exposure. Add actual cover exposure and the selected light-dependent kinetics once per factor. |
| `engine/src/world.rs`, `reaction_execution.rs`, `execution_budget_cells.rs` | Ordinary stage order, accepted cellular reactions and scheduling estimates. Finite emitted funding must reach all three, not only a diagnostic path. |
| `engine/src/sensing.rs`, `organism.rs`, controller and genetics modules | Funded photoreception, stocks, local actions and conservative lifecycle. Add only capabilities needed for physical cover and emission. |
| `engine/src/render.rs`, frontend worker/WebGL and native display publication | One renderer and bounded projections. Display actual received conditions and actual work without copying physical fields to React. |
| Regional material, transfer, inventory and checkpoint owners | Sparse cover ownership, finite donor allocation, local invalidation, conservative continuation and explicit schema versioning. |

Current sunlight is bounded by 0.2–1.8 at default contrast, with three phase periods of
30,000/90,000/310,000 ticks. Photoreceptors provide level, recent change and body-relative
contrasts. Public conversion currently uses unilluminated kinetic engagement; light supplies
work and gates uphill affordability. Material shelter currently slows public conversion but
does not create optical shade. There is no cover stock, emitter stock or emitted-light account.

Read the negative [public-food result](../material-habitats.md) and
[photoreception probes](../photoreception.md) before choosing fixtures. Accessible transformed
food did not repay all whole-cell costs in the former; the latter demonstrated sensory steering
but ended in finite-reserve extinction. Neither is evidence of successful nocturnal adaptation.
The recent live review found distinct metabolism and substantial private recycling; visual
clusters are not proof of shared metabolism. It did not establish an anti-colony light mechanism.

## Mathematical contract to establish in M0

### State, dimensions and geographic shade

Use existing world length, model time, material and work units. Let A_n be node area, c_n the
existing dissolved concentrations, m_n=A_n*c_n their amounts, b_n proposed overhead amounts,
and e_n paid optical work if a transient carrier is needed. Inventories retain all 256 identities. Static
terrain transmission t_n is dimensionless in [0,1]; optional ceiling k_n is in the existing
mean-one light units. Neither terrain field is material or spendable work.

Preserve the terrain boundary, with an unrestricted ceiling represented explicitly:

```text
L_geo(n,t) = min(t_n * L_sun(n,t), k_n)
sigma_n = sum_s b_ns / A_n                         material / area
tau_n = kappa * sigma_n                           dimensionless
L_solar_below(n,t) = L_geo(n,t) * exp(-tau_n)
```

The exponential is the current attenuation candidate, not a mandate for a radiation solver.
Kappa has area/material units and is shared across chemicals. Select its reference column mass
from the construction and energy budget, not from a desired colony size. Any alternative must
retain nonnegative transmission, T(0)=1, decreasing exposure and a declared composition law.

Attenuation halves the whole cycle when t=.5. Clipping with t=1 and k=.5 preserves dim light
below .5 and caps brighter light. Recommend attenuation; retain clipping as a candidate only
when its distinct peak-suppression purpose warrants a separate control. No post-shade mean
normalization or compensating brightening elsewhere. Apply local transforms before footprint
averaging: averaging first does not commute with clipping or exponential attenuation.

Generate static, periodic broad and fine shade using the terrain proposal's common spatial
construction, independent of biological success and source placement. Choose resolved widths
from travel/reserve and material-spreading scales. Persist canonical values and provenance.
Do not automatically correlate low elevation, wetness, shade and food into one best habitat.

Implement the shade component here; do not silently pull the entire elevation/conductance
project into this plan. If those operators exist at execution time, consume their canonical
values. Otherwise q=1 and flat terrain are the neutral cases, not a second terrain simulator.
Maintain the documented composition with conductance q and slope-dependent travel costs.
Tectonics, catastrophes, fluid inventories and literal mountain ray shadows remain separate.

### Overhead material is a physical owner, not an opacity counter

Explain what makes material overhead, how it is deposited/recovered locally, whether it is
supported or transported, what constitutes its exposed interface, and how it leaves that
phase. Select one coherent rule before implementation. A layer label does not answer these
questions. Do not solve them by automatically constructing a bond graph or support simulator.
If the proposed phase cannot be justified within the sole-cell-plane boundary, surface that
architectural conflict rather than smuggling in depth or deleting constructed shelter.

Construction removes an actual mixture from a frozen donor and transfers the same identities
to cover while paying work. Competing construction, export, growth and uptake cannot reuse
the same inventory. Recovery/degradation transfer material through the ordinary accounts;
washout and numerical removal are explicit sinks. Cover is not free on birth, duplicable on
death, permanently anchored by an old producer ID or exempt from ordinary loss by default.

Reuse the common mixture projection and transfer algebra. For a frozen pure redistribution
stage across owners, its sparse map must be nonnegative with unit column sums; explicit sinks
account for any deficit. Chemical conversion uses the existing accepted product maps instead
of changing identity during deposition. Cover mass and chemical potential enter the global
census and ledger exactly once. Scalar opacity is derived, never a second material inventory.

Determine cover's own optical exposure separately from the plane below. For a homogeneous
column model, the candidate mean transmission is (1-exp(-tau))/tau with limit one at zero;
derive that interpretation before using it. Applying bottom-of-cover darkness to its entire
exposed upper material would create an artificial protected surface. Ordinary free material
and same-plane neighbors must not become overhead cover without an actual phase transfer.

### Paid emission, one optical response and bounded funding

Build emitter stock through the existing funded-body lifecycle. The controller chooses an
effort; emitted power is bounded by actual stock and paid work. Specify the power-per-stock
units and conversion loss. Reuse shared genetics, mutation and allocation rather than adding
an emitter-specific mutation law. A photoreceptor is not automatically a free emitter.

Sunlight remains external work supplied when accepted reactions use it. Paid emission moves
already owned cell work into optical propagation. Their provenance differs; their optical
stimulus and chemical coupling do not acquire different color channels or receptor identities.

Use a bounded local nonnegative transfer operator. For each paid optical donor, propagation,
accepted chemical delivery, dissipation and escape shares sum to at most one, with the entire
deficit booked. A column-substochastic sparse operator is a useful construction, not a demand
for matrix storage. Periodic XY boundaries must not permit indefinite unaccounted accumulation.
Select a transient carrier only if its lifetime has a physical or numerical purpose; an
accounted direct local delivery is preferable to unnecessary photon history.

```text
initial paid optical work + emitter payment
  = final paid optical work + work delivered to reactions + optical losses
```

Define the conversion from local emitted power per area to the dimensionless light stimulus.
Existing environmental_work is work per transformed material, not power per area. M0 must
justify a shared reference power density or a derived equivalent; hiding the dimensional gap
in a multiplier is unacceptable. Record this and opacity in the small parameter inventory.

All recipients together may capture no more paid work than was available. Cells, dissolved
material, reservoirs and cover compete through the same frozen-donor accounting boundary;
separate individually bounded implementations can still overspend their shared source.
Reserve optical work together with chemical substrate and cellular uphill work, then commit.
If a cap reduces delivered work, re-evaluate affordability before accepting the conversion.
Rejected substrate requests cannot consume or silently refund another owner's allocation.
Simultaneous products and returns cannot finance emission and recapture in the same stage.

Resolve the .2-second base tick and .8-second physiology boundary explicitly. Emission,
propagation, sensing and each consumer's accumulated elapsed time must spend each interval
once, including restore remainders. Do not create a global fixed-point iteration to solve it.

Photoreceptors observe one scalar incident field: solar after relevant transmission plus local
emission. Work capture additionally depends on actual absorption/allocation, as material access
already depends on finite donors. Derive both from the same optical state; do not fabricate a
separate display value or let unchanged incident brightness imply unlimited chemical funding.
An emitter under geographic cover is not attenuated by the overhead terrain factor again.
Constructed material attenuates an emitted path only where that path crosses it. Define those
paths on the chosen geometry; avoid both sideways sunshine and lateral immunity by accident.

A closed emission/recapture cycle cannot produce net work when material, potential, body and
field state are restored and solar input is off. A reaction may release additional stored
chemical potential: total reaction yield is not itself bounded by emitter payment. Bound the
emitted contribution and audit the complete work balance, not a misleading yield-only ratio.

### Shared public photochemistry and biological timing

Preserve the common reaction coefficient a_e, normalized medium B, installed exact action
and potential difference. Existing solar work per converted material has the form
epsilon * max(0, a_e dot (L * B)); scalar illumination must retain chemical relabeling
equivariance. Emission uses the same coupling with its additional finite funding boundary.

The proposed kinetic change is that received light also scales public processing. One
candidate is r_e = q * H * L_received * r_base,e, with q geographic conductance, H existing
material shelter, and r_base,e the current nonnegative engagement/kinetic rate. Work
affordability and joint substrate caps still apply. Each factor enters once. Use the common
rule for reservoirs, dissolved material and exposed cover, with their justified interfaces.
Do not apply geographic conductance to intracellular enzyme rates or turn it into a work bonus.

M0 must decide whether the selected public operator is entirely photochemical or whether a
necessary light-independent process remains. Multiplying all present weathering by L turns
it off at L=0, including downhill conversions; that is a substantive change, not an incidental
optimization. Do not add independently tuned per-chemical dark fractions to avoid this decision.
Write the selected zero-light, unit-light and high-light limits and their material/work bounds.
If biological emission can exceed the old 1+contrast bound, update possible-route analysis,
prepared scheduling and observations rather than silently clipping it at the solar maximum.

Derive a worked exposed/sheltered example from actual chemical tables, including useful
production and loss of an intermediate. Shade loses direct work and helps only when avoided
conversion, injury from actual products or competition repays that loss. No extra damage law.
Existing RNN activity, transport, storage and motors express temporal behavior. Basal costs
remain; low activity is not a new dormant state or proof of surviving a whole solar period.

### Cost and conditional-return calculations

Before advancing ticks, calculate travel work, travel time, maintenance, affordable stored
chemical returns, cover construction/replacement, emission and potential reaction income.
Distinguish requested from accepted reaction work, and current inventory from cumulative flow.
Compare departure with remaining under matched material and funded-body budgets, including
the loss of favorable neighbor chemistry and the cost of escaping adhesive contacts.

Use these calculations to choose physical scales. Do not impose an arbitrary maximum colony,
number of light patches, emitter recipients or ecological lifetime as a performance shortcut.
Keep the current sun initially; adjust its numerical scales only for a named failed opportunity,
with isolated evidence. More spatial modes alone do not deliver the requested feature.

Budget persistent and scratch memory, chemical-row visits, stencil support, sparse activation,
cache invalidation, synchronization, codecs and display. At 97,200 nodes, one f32 scalar costs
388,800 bytes; one fully occupied 256-species f32 cover row per node costs 99,532,800 bytes
before scratch or metadata. Sparse ownership helps ordinary cost but does not erase that bound.
Static shade must not wake empty chemistry. Optical-only activity must not allocate 256-species
rows unnecessarily. Measure sparse and dense cover/emission cases; no emitter-by-cell all-pairs
loop, per-worker world buffer or full-field React mirror. Target at least 30 complete ticks/s
and report workloads that miss it without lowering resolution or changing model time.

## Decisions and ownership

| Item | Disposition and owner |
| --- | --- |
| Overhead non-depleting sun, permanent shade, constructed shelter, paid emission, local response | Selected scope from this conversation. Executor preserves all of it. |
| Terrain attenuation, optional ceiling, independence from elevation and no renormalization | Preserve terrain proposal. M0 selects whether peak clipping has a needed default use; unrestricted remains the recommendation. |
| Cover as overhead extracellular material; amount-based opacity | Recommended representation. M0 derives physical support/access/lifecycle and checks cost before adopting it. |
| Emission representation, power/intensity units, attenuation operator and scheduler | M0 implementer decisions constrained by the accounts and ordinary consumers above. No routine permission gate. |
| Public light-rate law and zero-light chemistry | M0 implementer decision with a worked chemical example and explicit limiting behavior; inherited algebra is fixed. |
| Cell stacking/Z, internal compartments, direct sunlight injury, dormancy, full fluid terrain | Outside this selected design. If necessary, a user-owned scope decision becomes blocking before the affected implementation; do not silently add them. |
| Full elevation/conductance implementation, directional utterances | Separate existing design owners. Share interfaces where present; do not absorb their projects here. |
| Continuing live-world transition | A new physical schema rejects old saves. Preserve the existing server/checkpoints; the user must choose any later restart/cutover. This plan authorizes none. |

Cover and emission may strengthen colonies rather than increase dispersal. Stronger sensory
contrasts need not produce useful inherited responses. A canopy that always loses, or a mobile
strategy that cannot repay travel, is negative evidence about the proposed opportunity.
It does not authorize compensating bonuses, seed searches or a return to finite sunlight.

## Milestones and acceptance

The milestone definitions below retain their acceptance contracts. Each includes focused invariant checks and
necessary codec integration for the state it introduces; M5 is the integrated durability and
observation handoff, not permission to leave earlier physical owners unsavable. Partial internal
milestones are not a released feature. Expand only the imminent milestone through plan-phase.

### M0 — Physical purpose, shared mathematics and execution budget

Scope: resolve the contracts above against current source. Reconcile superseded future-design
wording, derive one complete update and map production consumers and dependencies. Identify
fixed laws, numerical choices and genuinely user-owned decisions. Keep the parameter inventory
short, justified by units and mechanism; prune abstractions that have no immediate consumer.

Acceptance: a worked material transfer, covered/uncovered solar example, paid emitter with
multiple consumers, mixed solar/emitted reaction, zero-light conversion and closed work cycle
have explicit owners and bounded updates. Conditional travel/cover/emission budgets and worst
case memory/work estimates identify plausible opportunities and costs. Accepted proposed laws
are in canonical design owners, not just this plan. No new simulation is required to derive them.

Evidence: source review, dimensions, algebraic invariants, actual chemical-table calculations
and a complete stage diagram. No proof by analogy to real sunlight or by vector notation alone.

### M1 — Persistent terrain shade and common optical sampling [depends on M0]

Scope: implement canonical seeded transmission and the selected ceiling policy, shared local
sampling, static cache ownership and durable generation values/provenance. Integrate cells,
public fields, reservoirs, receptors, scheduling, inspection and packed light display. Preserve
the public terrain contract without implementing unrelated terrain mechanics.

Acceptance: transparent terrain recovers the existing solar evaluator; half transmission and
peak clipping have distinct correct results. Periodic seams, scale, order of local transform
and footprint sampling, persistence and all-consumer agreement hold. Empty shade tiles do not
wake chemistry. No second renderer or duplicate physics path appears.

### M2 — Funded overhead material cover [depends on M0, M1]

Scope: implement the selected physical cover owner and local deposition/recovery capability,
ordinary genetic/body funding where required, conservative transport/loss and public exposure.
Integrate material census, optical reduction, restore and regional invalidation together.

Acceptance: building removes and pays for actual inventory; competing consumers cannot
overdraw it. Removing or moving cover changes the correct local exposure. Its upper material
is not falsely protected by its own bottom illumination. Same-plane cell density alone casts
no solar shadow. Birth, death, recovery and loss neither create material nor erase accounts.
No attachment network, hidden cell depth or permanent free cover is introduced.

### M3 — Paid emission and bounded optical work [depends on M0, M1, M2]

Scope: implement emitter investment/stock/action, paid production, the selected local optical
operator and common allocation across all consuming owners. Preserve solar provenance and
ordinary local photoreception. Integrate the existing biological mutation and lifecycle paths.

Acceptance: no stock or no payment produces no emission. With sunlight disabled, aggregate
emitted work delivered never exceeds available paid work; closed recapture cannot profit.
Many receivers and simultaneous public/private reactions share donors correctly. An emitter
under terrain shade remains locally visible without a second terrain attenuation. Occlusion,
loss, stage timing and restore obey the selected geometry and accounts. Source identity never
enters the RNN. Strong emission does not invalidate old solar-only bounds elsewhere.

### M4 — Shared photochemistry and conditional behavior [depends on M0–M3]

Scope: integrate the selected light-dependent public rate law and its shared affordability
boundary. Compose terrain conductance, material shelter and optical exposure once each.
Confirm ordinary neural control can time activity, enter/leave shelter, build cover, emit and
respond. Use existing resource-economy calculations and short diagnostic fixtures.

Acceptance: actual local cues reach ordinary actions and funded physical consequences.
Show which conditional return predictions pass or fail after all costs. A finite-budget
emitter cannot subsidize otherwise unaffordable public or private chemistry through a stale
rate estimate. A missing shelter benefit or failed movement response stays an open finding;
do not replace it with population size, color variation or a compulsory coexistence campaign.

Evidence: minimal constructed controls from the panel below, exact start configuration and
funded stocks, accepted reaction/transfer accounts, expenses and stopping reason. Successful
mechanics and failed ecological returns remain separate claims.

### M5 — Observable and durable integrated world [depends on M1–M4]

Scope: finish ordinary startup and local/native integration. Make permanent shade, constructed
cover, received light and active emission legible through the current renderer. Extend bounded
selected-cell and regional observations with relevant costs and recent accepted chemical flows.
Persist all physical owners, genotype changes and schedule remainders under one explicit schema.

Acceptance: a viewer can distinguish an uncovered colony, an actually sheltered region and a
local emitter, then inspect corresponding sensed exposure and paid work. Existing measured-flow
panels distinguish actual transfer/reaction from possible enzyme routes. Ancestry and measured
trait differences are not mislabeled as strategic species. Observers do not alter physics.
Browser and native save/restore preserve continuation; incompatible versions fail explicitly.
Borrowed local views and bounded remote projections retain their ownership/backpressure guards.
No new history database, parallel observability system or automatic live-world reset is added.

### M6 — Whole-runtime validation and human review [depends on M0–M5]

Scope: run required CI, registered integrated checks and representative sparse/dense operating
comparisons. Reconcile current docs and record actual limits. Obtain human review of visible
motion and shelter/emission legibility through an authorized workflow; never access the user's
tab or launch a server implicitly. Publication/deployment needs its own authorization.

Acceptance: all ordinary consumers use the selected laws; no prototype-only path is credited.
Report ticks/s, full model time, memory, checkpoint size and observation cost for declared
workloads, including misses of 30 ticks/s. Numerical removal is an accounted approximation,
not automatically a chemistry defect. Required checks pass or their verified failures remain
explicitly unfinished. Human review remains open until actually performed. Long-term diversity,
indefinite operation and successful evolution are not inferred from the bounded checks.

## Proportionate evidence, not an experiment fortress

Register questions, predicted chains, controls, exact stocks, mutation/learning settings,
tick/wall budgets and decision consequences before running. Use the existing harness/ledger;
do not build another testing system or execute every combination of mechanisms.

1. Bounded Rust/integration invariants cover conservation, optical allocation, transform order,
   zero/uniform limits, relevant symmetries, interval accounting and observer independence.
   Add tests for distinct failure modes, not every line or reversible documentation edit.
2. Begin with zero-tick resource calculations. Then select single-cell or emitter/receiver
   probes of a few hundred ticks with a 120-second per-case wall cap: exposed versus shaded
   chemistry, constructed versus geographic equivalent cover, paid emission versus off and
   receptor-response reversal. Use mutation and learning frozen unless the question needs them.
   Include a predicted losing condition, and separate sensing from net return.
3. Only if probes establish the missing physical/action links, use a small paired contest
   with swapped placements, one seed and at most 3,000 ticks per case. Count every case and
   total wall budget in the registration. No automatic seed expansion or horizon extension.
4. Day/night endurance across current long solar periods is a separate long-run question.
   A short local-phase assay or accelerated diagnostic cycle cannot certify that endurance.
   Longer evolution/invasion runs need a distinct justification and current authorization.
5. Reuse ordinary release capacity workloads with 10 warmup and 100 measured ticks, a
   60-second cap per workload, normal observation preparation and matched model time.
   Add only the cover/emission stress fixtures needed to test the new worst-case cost.
   Do not repeatedly run expensive panels for documentation changes.

Store raw samples, reports, plots and checkpoints only in ignored local artifacts. Commit
authored reasoning, registration and findings, not generated data. At handoff, distinguish
constructed opportunity, controller expression, evolved exploitation and continuing ecology.

## Sulion mapping and execution discipline

| Milestone | CLI position | Phase ID |
| --- | --- | --- |
| M0 | 1 | `bcf6babd-fd96-42c5-a18f-41032e565892` |
| M1 | 2 | `f25b6ae2-fe57-47f4-80aa-6bb914e2e3fd` |
| M2 | 3 | `24195124-d111-48e6-9434-db41a104f8d7` |
| M3 | 4 | `dc3c1427-b567-4c38-9479-a532d8abf532` |
| M4 | 5 | `4eed45c2-cba5-4d8c-9c1e-555bb772b10a` |
| M5 | 6 | `2538e8ab-d5d2-43f2-8321-4032898b7603` |
| M6 | 7 | `7b73fc67-b38e-4f72-baed-3f7769a7e5fd` |

At phase start, on resume and when evidence contradicts the approach, read `sulion plan current`,
this milestone and relevant source bodies. Record meaningful deviations against the purpose
and accounts. Use plan-phase to expand M0 in this document when execution is authorized;
do not pre-expand all future implementation details now. A multistep prerequisite blocks its
owning phase and gets a Sulion branch; return after verified completion. Do not create branches
for one-line fixes, permission ceremonies or hypothetical failures.

Close milestones only on their acceptance evidence, and close the root only after the complete
feature lands with required validation. Do not close this pending implementation plan because
the planning request is finished. This plan neither supersedes the separate scaling work order
nor marks its operating gates complete.

## Current state and next action

### M0 execution

Expansion `7ffd450f-da69-40e2-a67e-ab5df866e68f`:

1. Select owners and the bounded optical update (`8033ad2d-07d4-495a-b419-57ecfc896734`).
   Read the production field, source and cell stages. Select shared material allocation and
   one physiological optical-work interval; retain base-tick motion and renewal. Derive the
   fixed overhead phase and actual upward versus lateral emission paths without bonds or rays.
2. Record worked budgets and acceptance (`5a0b9c68-8174-4fed-82a2-a761525b098d`).
   Record the selected equations in the light design, correct superseded future-design text,
   calculate construction/emission/transport costs, and review ordinary consumer coverage.

The current source has per-base-tick source conversion and post-redistribution field
conversion. M0 selects separating physical transport from shared optical chemistry so all
recipients reserve against the same frozen material at one physiological boundary. This is
a necessary scheduling change to prevent repeated spending of emitted work, not an extra solver.
The emission allocator uses a conservative bound on work per material, so it needs neither
a second speculative reaction pass nor a global fixed-point solve.

M0 selected the contract in `docs/design/light-ecology.md`. The zero-tick illumination budget
at the unchanged v41 baseline gives role-1 initial reaction work of 0.02088, 0.14528 and
0.26968 at light 0.37413, 1 and 1.62587; maintenance is 0.01524 work/second.
Role 2 gives 0.01026, 0.14119 and 0.27212 under those same exposures. These are initial
inventory returns, not sustainable incomes. In particular, shade can remove the surplus of
an uphill specialist. Protecting public substrate must repay that loss before shelter helps.
The existing default motor stock consumes at most 0.016 work/second before turning; a
0.5-work reserve therefore cannot support arbitrary searches. Terrain uses resolved 32-unit
and coarser patches, while optical emission initially reaches 2 units. These scales allow
local gradients without claiming that an unfed cell can cross a terrain patch.
Raw calculation output remains ignored under `frontend/harness/artifacts/light-ecology-v42/`.

### M1 execution

1. Implement canonical seeded periodic terrain transmission and optional clipping, with
   explicit validation and persistence. Bind the same immutable map to physical and observation
   illumination; source-only illumination remains available for the solar evaluator itself.
2. Exercise uniform, shaded, clipped, seam and checkpoint cases. Confirm observation purity
   and all production light consumers share node-local composition before footprint averaging.
   Version the physical checkpoint once for the complete v42 extension.

M1 implements the canonical map, shared sampler and v42 persistence. Two terrain and six
illumination tests pass. The clipping fixture initially assumed all variable sunlight exceeded
its ceiling; it now explicitly uses uniform sunlight to isolate clipping. No physical defect
was hidden by that fixture correction. Display observation purity is checked separately.

### M2 execution

1. Add the extracellular film as a sparse regional material owner, include it in global
   accounts/checkpoints, and derive plane transmission and mean film exposure from its mass.
   Reuse ordinary geographic transport, washout and public transformations.
2. Add funded builder/emitter body slots through the common genetic/body lifecycle; wire
   signed cover effort and local stock readings. Allocate all recovery requests against a
   frozen film mixture and all deposition against each cell's existing free mixture.
3. Verify shared-node contention, identities, energy/material closure, attenuation and
   checkpoint continuation. Paid emission itself belongs to M3.

M2 has four passing focused tests: paid identity-preserving deposition and checkpoint,
shared-node recovery/headroom, prohibition on same-stage recovery of new deposits, and
transport/washout closure. Builder and emitter stocks use the ordinary physical loci,
allocation, upkeep, mutation and conservative birth/death ownership; actions default to zero.

### M3 execution

1. Debit funded emitter effort once per physiology interval. Deposit the two normalized
   optical paths into bounded local scalar maps; persist only held incident rate samples.
2. Freeze recipient material after transport and cover exchange. Reserve paid work once
   across field, cells and sources, with a separate intercepted upward account for film.
   Move reservoir chemistry to this common boundary and separate public transport/conversion.
3. Use the conservative work-per-material bound in every reaction consumer. Reclassify
   captured emission as internal work; book all other payment as loss. Verify dark recipients,
   competition, no-donor limits, no repeated spending, public/private closure and restore.

M3 now uses one optical interval and separate transport/public conversion. Four optical
tests and the full 314-test Rust suite pass. The actual chemical-table coefficient bound
is checked over all 65,536 pure input/product pairs. The dark-world test includes cells,
reservoirs and film, closes both accounts, and restores between optical boundaries.
The added input ports exposed a four-wide dense-neural assumption; native and WASM
contractions now handle remaining lanes without adding fictitious sensory inputs.

### M4 execution

1. Apply incident light once to the shared public kinetic operator, including zero-light
   suppression of downhill public conversion. Retain intracellular kinetics and update
   numerical participation estimates for the new rate. Test dark/unit/high-light limits.
2. Extend existing diagnostic-controller authoring to its full output vector. Register
   six short QuickScenario probes: opposite terrain responses, builder versus idle, and
   receiver with emitter on versus off. Each uses ordinary inference/physics, frozen
   inheritance and learning, one seed, 300 ticks and a 30-second wall limit per case.
3. Read actual input/action/movement/expense and accepted chemical-flow traces. Report
   failed payback separately from mechanism expression. Do not extend these horizons or
   infer evolved coexistence. Reuse the existing local ledger and reports.

Pre-run predictions: signed light contrast should permit opposite steering; construction
should reduce received solar intensity only by consuming stock-funded material/work;
emission should increase local received intensity while costing the emitter more total work
than recipients recapture. None predicts a net whole-cell benefit from an unfed 300-tick
probe. Competing explanations are absent cue, absent expressed action, inadequate physical
effect, and an effect whose return does not cover its cost. The six probes discriminate
these before any population campaign. Raw data remains under the ignored v42 artifact tree.

The first panel ended in finite-reserve extinction at 87–174 ticks. Opposite shade steering
was expressed. Baseline construction transferred 0.02155 material but its footprint/species
deposits were below the existing field cutoff and did not accumulate. The lamp was sensed;
the receiver lay directly on its heading axis, making left-minus-right zero in both controls.
These are retained negative results, not grounds for changing physics or extending runs.

One follow-up panel is registered: `strong-builder`/`strong-idle` use the common physical
locus value 3 for builder stock (four times baseline), funded by the same initial packet;
`lamp-on-offset`/`lamp-off-offset` move only the receiver from (8,12) to (8,10). Four cases,
same seed and 300-tick/30-second limits; no parameter sweep or further automatic escalation.
This checks whether the allowed investment range crosses the known deposition resolution
and whether an actual transverse lamp cue reaches steering. Whole-cell payback can still fail.

### M5 execution

1. Extend the existing eight-float field projection with terrain transmission, film opacity
   and received emission selections; show paid emitters through existing marker records.
   Keep viewport bounds and worker ownership. Add selected-cell optical breakdown and costs.
2. Reconcile v42 body/controller shapes, checkpoint contracts, public kinetics and the memory
   reservation for two sparse material owners. Preserve resolution; reject oversized worlds
   explicitly. Update governing runtime documentation and preserve the negative probe findings.
3. Verify observation purity, rendered physical values, native request selection and same-format
   restore with existing bounded tests. Full CI and representative cost follow in M6.

### M6 execution and operating registration

1. Run full CI on the final integrated source and audit ordinary browser/native consumers.
   Reuse bounded conservation, restore and ownership coverage. No ecological rerun is needed
   for display-only edits; preserve the M4 source/binary hashes with their original artifacts.
2. Use the existing capacity runner with ten warmup and at most 100 measured ticks per case:
   default startup (48 cells, 240 sources), distributed 2,000 cells, and 96 collocated cells
   with eight programs and diagnostic film/emission. All use default 720×540, mesh 2,
   one WASM worker, seed 101, ordinary stepping, learning and observation. Each measured loop
   has a 60-second cap, then one save/restore and three continuation ticks. The complete
   process has a 300-second wall cap, including initialization and storage. No repeats or
   population expansion without a specific fault. Generated data stays under the ignored
   `light-ecology-v42/cost` directory and the existing ledger.
3. The optical stress fixture begins with optical depth one at every node, represented by
   one ordinary chemical per node, and diagnostic output biases request deposit and emission.
   It uses ordinary finite stock and energy; setup explicitly resets initial accounts. This
   is an operating load, not an evolved habitat. Compare sparse startup with this occupied
   overhead owner to expose material/support cost. Report actual initial/final cover and
   emitted support, model time, memory, save size, timing and termination reasons.
4. Present the finished local changes and verification for human motion/legibility review.
   No browser tool or Antropy development site is available from this terminal; a cached
   Chromium exists, but the reachable development sites belong to other projects. Do not
   claim visual acceptance from projection tests. Inspect live status before publication. The server's
   existing launch policy starts a new seed when no compatible checkpoint exists, so v42
   push requires an explicit continuing-world cutover decision. Commit is independently
   authorized; leave live saves and the running world untouched while awaiting that decision.

Pre-run resource prediction: the default grid is 97,200 nodes, below the new two-owner
262,144-node admission bound. A fully occupied film adds roughly 95 MiB per dense chemical
row set before scratch, scalar metadata and checkpoint copies. The three worlds run
sequentially in one harness process; no workers, ensemble or parallel campaign is added.
The decision is whether this implementation's actual operating envelope needs a structural
repair, not whether any ecological organization wins. Report misses of 30 ticks/second.

Integrated validation: `make ci` passed on September 25: 317 engine tests, 15 server tests
(one additional benchmark ignored), 17 integration tests, 79 Vitest tests, the Python check,
formatting, clippy, type checks, documentation/storage checks and Terraform formatting.
There are 19 pre-existing ESLint warnings and the existing WASM atomics warning.

The first operating attempt stopped on the harness's unsupported exact future-replay
requirement. A prerequisite child isolated omitted derived numerical caches without any
lost physical state. The corrected harness keeps exact round-trip and continuation accounting
requirements, while reporting future byte equality. The single registered retry completed
all cases: 61.6, 27.0 and 26.8 ticks/s. The latter two miss the target. Full accounts, memory,
save/restore limits and negative findings are interpreted in the
[results](../light-ecology-results.md#operating-cost-and-continuation); raw artifacts remain
local. No physical thresholds changed to obtain a pass. Human review and live-world cutover
remain pending; neither is implied by these checks.

Scope review preserves pre-existing modifications to `docs/README.md`, `docs/backlog.md`,
`docs/design/README.md` and the existing untracked communication/terrain proposal files.
The initial planning task added this document and its plan-index entry only. Execution now
reconciles the related terrain proposal and current runtime guidance; unrelated communication
proposal edits remain outside the commit. Milestone statuses above supersede the initial
all-pending planning handoff.
