# Canonical mathematics — transformation algebra and runtime integration

<a id="regenerative-ecosystem-implementation"></a>

## Regenerative ecosystem implementation — September 18

Root `555cf223-16f7-4e8b-a10a-7160dbdeead2`. **R0–R4 implementation and automated verification complete. Human review pending.**
The user requested an implementation plan for the
[initial-ecosystem white paper](docs/design/chemistry/regenerative-ecosystem.md).
The user authorized all phases after planning. Expansions and evidence remain in this document.

### R0 execution

Branch `f2b6085c-9ce9-429f-bc5d-3534cdee3b41`.

1. Map production and preserve baseline: read compiler, metabolism, both weathering paths,
   source/body projections, accounts and initialization. Archive source and WASM under
   `frontend/harness/artifacts/regenerative-20260918/`. Run the registered capacity baseline.
2. Calculate and register: `engine/examples/regenerative_budget.rs` evaluates the full installed
   enzyme support on the paper's inventory and actual initial source medium without ticks.
   Select frozen-stage sampling, common work arithmetic and initial delivery corrections.
   R1's eight single-cell cases compare each primary converter in supplied versus absent drive;
   R2's four300tick cases cover dilute/crowded source pairs and background/unequal inventory.
   R3 reserves four remaining300tick cases for delivery interventions, then at most two1500tick
   community placements. R4 retains the single5000tick observation and capacity checks.

R0 evidence: baseline ledger4059–4061 measures40.72/19.87/14.46ticks/s, all cold
continuations exact. Full compiled recognition has9/15/25/15 substrate rows; on the paper's
two-species inventories the work rates reproduce0.07505/0.04659/0.04052/0.04052.
The existing random reservoir mixtures give the two uphill founders negative startup work
at some locations. Therefore R3 must arrange actual supporting mixtures and priming; increasing
ε cannot repair a reversed medium. Complete dynamic delivery, competing abiotic products and
body feedback remain R1/R3 checks, not established by this zero-tick source-only calculation.

Selected integration: sample the shared body/source/field medium at the frozen pre-exchange
footprints once per physiology event; reactions use that signal after paid exchange. Compile
Δu and two profile coefficients; cache local yields only for occupied enzyme rows in the
reaction scratch. Abiotic affordability masks rates before normalizing competing branches.
External work is recorded only on accepted amounts. Both scalar reservoir and SIMD field
paths use these terms. No per-cell scan of all bodies. Pressure calibration retains the actual
source interface amount and includes background; its numeric χ is selected in R2.

### Outcome and scope

Deliver a starting world where complementary cellular transformations can repay their own
costs and exchange products in productive resource neighborhoods. Implement the white paper's
shared environmental-work coupling, finite-owner pressure correction and initial ecology on
the existing runtime. Four authored founder types establish a starting opportunity; permanent
four-type coexistence, a target population and an evolved food web are not acceptance conditions.

Retain the chemical manifold, exact action algebra, heterogeneous property surfaces, kinetic
attenuation, funded machinery, transport, body accounts, mutation and RNN controller boundary.
Keep finite mobile renewing reservoirs, full mesh2, 320×240 geography, seed27, chemistry seed101,
48 founders and 48 reservoirs, with at least two separated colonies. Preserve ordinary mutation
and learning in the eventual default. Diagnostic interventions belong only in registered probes.

The only new shared control coefficients are environmental work strength ε and pressure strength χ.
No loss-matched renewal, global power allocator, new chemical property surface, separate force
kernels, source personalities, waste-specific rewards, new controller inputs or history redesign.
All authored starting alleles remain mutable and all starting material/work is accounted.
Rust retains physical ownership and the worker renders borrowed WASM views with existing bounded
observations and backpressure. No new server, publication, commit or deployment is in this plan.

### Evidence, reuse and plan boundaries

The white paper §§2–8 and Appendix A are the design basis. Its four-edge budgets are conditional
on local medium and delivery; they do not establish a geographic configuration. The existing
v26 pressure result below prevented overlap but did not establish sustained greater population
at5k, and increased active chemical coverage and runtime cost. Preserve that negative result.

| Existing owner | Planned change or reuse |
| --- | --- |
| `chemical_operators.rs`, `metabolism.rs` | Compile chemical-only potential/profile differences; evaluate local work once per frozen reaction stage and use the same result for funding and commit. Retain installed operators and donor arbitration. |
| `weathering.rs`, `climate.rs`, `source_medium.rs` | Use the same supplied-work coefficient and affordability rule for dissolved and reservoir conversion; preserve bounded product topology, sparse execution and exposure. |
| `medium_response.rs`, `footprint.rs`, `source_footprint.rs`, movement and field consumers | Subtract each finite owner's actual projected self-load; apply one pressure coefficient to finite-owner response and dissolved pressure. Reuse footprints and reductions. |
| `accounting.rs`, configuration, physical state codecs, reports | Carry accepted external work into existing balance conventions; persist new controls and cumulative accounts, reconstruct derived caches, reject incompatible physics explicitly. |
| `genetics/founder.rs`, controller seeding, World initialization, `sources.rs` | Author four ordinary genotypes, funded bodies, initial mixtures and two productive neighborhoods. Keep replenishment and source transformation ordinary. |
| Resource-economy calculation, quick scenarios, numerical capacity fixtures, ledger | Reuse these for zero-tick budgets, short causal probes and matched performance. Extend bounded observations only for evidence unavailable from existing accounts. |
| Atlas, chemical-role/web views and inspectors | Audit consumers of compiled work/topology; represent local-medium-dependent yield accurately, without presenting capability counts as actual flow. |

This section is the next work in the canonical mathematics document. The earlier pressure and
geometry sections retain their versioned evidence. Only the formulas explicitly changed here
are superseded during implementation. The environmental plan, its correction branch and human
handoff obligations remain separate and untouched. Their correction contract and the v26
pressure record were read for this planning pass; older environmental execution appendices were
not re-audited. Existing unrelated working-tree changes must be preserved.

### Decisions and remaining engineering choices

**Settled:** for each compiled row use the paper's linear profile difference, then take the
positive local contraction: `w=ε[a·B]+`. Cells use `y=fη(Δu+w)−κz`; accepted amount q records
external work `qw` and dissipation `q(Δu+w−y)`. Abiotic conversion captures no cellular work
and requires `Δu+w≥0`. Identity and absent substrate/machinery supply no work. Products and
new work cannot fund another reaction in the same stage. No hard-coded chemical-ID privileges.

**Settled:** finite-owner pressure uses `Lother=L−(S/a)ΣW²` with the actual projected amount
and matched footprint. Dissolved material retains collective `P=χL²/2`. The correction must
cover bodies and reservoirs, not just source motion. Background load remains physical.

**Provisional:** the circuit0→128→136→8→0, ε≈119.3134, reference stocks and equal founder
counts are the first construction from the paper. Validate complete compiled recognition
support, actual local medium, injury, reserves and geographic delivery before adopting them
as defaults. Do not treat the four isolated arrows or H* as the full runtime budget.

**Implementer-owned, resolved in R0–R3:** frozen medium sampling/update order; treatment of
unaffordable abiotic branches before donor allocation; schema fields; χ; source mixture,
holdings, release/renewal, priming and placement; and ordinary founder RNN weights. Resolve
these from equations and bounded evidence, changing one mechanism at a time. A failed
prediction narrows the correction; it does not authorize another architecture or parameter sweep.
If a change beyond the paper is necessary, identify that concrete blocker before expanding scope.

### R0 — Qualify equations and starting budgets

Sulion phase `8d201f42-643e-4f77-9a0e-9ee5e8ec88f5`. No dependency.

Map the selected equations to ordinary World, compiler, accounts and all scalar/vector consumers.
Archive the current source/build identity and configuration for matched cost evidence before edits.
Use the existing resource-economy path to calculate all four funded founders with complete
recognition/product support, transport competition, injury/repair, upkeep, assembly, movement,
learning and division reserves. Include abiotic competing routes and actual reservoir/body/field
contributions to the medium. Derive approach/crowding loads for the pressure interval.

Acceptance: a concrete initial candidate, explicit units and account signs, frozen update order,
compiler/cache plan and registered short checks. Reproduce the paper's reference arithmetic
and distinguish it from the complete candidate budget. No requirement to re-derive the whole
chemistry design. An infeasible common pressure interval or inaccessible funded return is a
specific unresolved finding, not a reason to fabricate an extra mechanism.

### R1 — Integrate shared transformation work

Sulion phase `87695965-afb3-4098-8b10-504306c5500f`. [depends on R0]

Execution branch `c8febb4a-d47d-4510-9e9f-9d6e1df4c3ec`:
1. Integrate common work and accounts in compiler/metabolism/weathering/climate, frozen World
   sampling, flow ledger, physical v27, economy and observation consumers.
2. Verify shared work with mixed-row/cycle/funding invariants and scalar/SIMD owner agreement.
   Run the registered eight300tick founder cases once R3's shared genotype builder is available;
   keep that acceptance pending rather than duplicate founder construction in a test-only path.

Implement the shared coefficient in ordinary cellular reactions and both abiotic owners.
Replace automatic exact uphill top-up. Evaluate local terms against frozen stage inputs;
avoid allocating fresh per-cell full-field data or recomputing all organisms to sample one cell.
Keep scalar and vectorized abiotic paths consistent. Thread actual accepted external input and
dissipation through World accounts, death/lifetime totals as applicable, reports and persistence.
Audit atlas/economy/inspection consumers that currently assume work is chemical-only.

Acceptance: material and work close for downhill, uphill, mixed-product and closed-cycle
fixtures; nonnegative dissipation; identity/zero-medium limits; donor and energy contention;
unchanged installed identity through refit; no same-stage cascade or source release double-count.
Chemical relabeling and geometric covariance retain their declared meaning. Cold-restored
continuation agrees. One-cell probes establish paid return and its loss in an unfavorable
medium for each founder, with actual uptake, repair and reserves. Positive algebra alone is
insufficient. Version the changed physical semantics across every reader; retain no old economy.

### R2 — Correct finite-owner pressure

Sulion phase `88938461-0e36-4132-b795-aef77e0e1937`. [depends on R0, R1]

Execution branch `fe75c3d9-0848-4448-9cd9-c58bf9d3b9f2`:
1. Integrate exact finite-owner self-load from actual projected amounts and one shared χ in
   field/source/body pressure. Preserve matched gradients and frozen caches.
2. Verify isolated and pair responses, background load and finite-material delivery bounds.
   For a60:40 initial0:136 mixture, signed attraction C=0.0241845 and impedance2.84980
   give the reversal load `C/(χ i²)`. Selecting χ=0.003 puts it at0.99263. Initial50:50
   through70:30 mixtures reverse at0.536–1.955; the common coefficient allows low-load
   attraction while retaining crowded opposition. Check these predictions on actual footprints.

R2 evidence: four300tick finite-source cases at two periodic placements match: dilute
pair separation4→3.98166, crowded4→4.14875. The prior all-repulsive response is avoided
without a second force kernel. Five pressure tests pass, including exact sampled self-load
for bodies and interface-limited sources, retained dissolved background, covariance and
conservative nonnegative field flow. Local concentrations and delivery in the inhabited
community remain R3's shared acceptance, not implied by pair separation.

R1 evidence: ledger4062–4069 records the eight single-cell controls. Driven uphill types
construct0.51835/0.51736 material and survive300ticks; zero-drive controls die at20/16ticks.
Downhill types are unchanged by removing drive. The8→0 specialist consumes local food
faster than diffusion replenishes it and dies at253ticks after0.51454 construction;
this is a negative delivery finding retained for R3. All130 then-current Rust unit tests pass.

Implement self-load subtraction from the already deposited impedance amount and footprint.
Derive one χ from the shared feasible interval at useful approach/crowding concentrations.
Apply χ consistently in finite-owner response and conservative field-face pressure. Preserve
interface scaling, mobility, speed bounds, donor floors and active support. Do not turn a
roundoff correction into an unaccounted physical cutoff.

Acceptance: isolated off-grid/periodic owners have zero self-force; matched scalar/vector
responses and spatial/chemical covariance pass; field material stays nonnegative and conserved.
Short source/body cases show attraction where productive overlap is sparse and opposition
where crowded, including unequal amounts, mixed compositions and dissolved background.
Check each directed response rather than assuming reciprocal pair equilibrium. Concentrations
must remain useful for budgeted uptake; separated centers alone do not pass. Record the cost
of the added footprint sum and active coverage. No pair scan or second spatial solver.

### R3 — Build the initial ecosystem

Sulion phase `f35038b3-c059-4d56-9600-a8711bdb07ad`. [depends on R1, R2]

Execution branch `d0063627-6147-4f27-bb05-3331da3a7ce1`:
1. Wire the R1-tested shared founder builder into World initialization; retain48 cells and
   two colonies. Initial source0 shares lie in0.55–0.65, with136 completing the mixture,
   so source media support the uphill circuit instead of randomly reversing it. Each source
   footprint receives finite8/128 priming at sampled concentration0.05 from the existing0.1
   priming setting; it is included in initial accounts, not renewed as a new source function.
2. Register and measure producer-on/off delivery for the8→0 starvation finding, then two
   community placements. Use full ordinary dynamics, actual local medium and funded bodies.
   Confirm growth and uptake without confusing seeded product with producer-created product.

R3 evidence: delivery controls4070–4073 start with no8 in field, bodies or inventories.
With136→8 enabled, its neighbor imports0.21107 and converts0.20719 of8; disabling that
enzyme yields exactly zero8 uptake/conversion. Swapped placements agree. Delivery helps but
does not keep that isolated recipient alive for300ticks; it is not a self-sustaining pair.
The two full community cases4074/4075 complete1500ticks with45/52 cells from8, without
mutation. Final whole-population founder-genotype counts are32/3/8/2 and28/12/9/3,
respectively, versus2/2/2/2 initially. All four paths remain active; this is a constructed
opportunity, not evolved coexistence. Work residuals are3.1e-9/3.6e-9. R4 must still test
the large ordinary default and cost, with mutation and learning active.

Construct X/Y reflection actions and independent recognition through existing genome/compiler
interfaces. Start with12 cells per type, six of each per colony. Fund the reference machinery,
inventory, bound-material mixtures and usable work explicitly. Author transport, repair and
motion as ordinary mutable RNN weights. No role identity or controller fallback enters physics.

Use ordinary renewing reservoirs initially supplying0 and136, with accounted8/128 priming.
Select geometry and supply using the qualified delivery/turnover budget; retain unoccupied
neighborhoods. Source types continue changing through ordinary chemistry. Share the resulting
startup configuration between browser and harness, paused at tick zero with the current map defaults.

Acceptance: all256 chemical identities satisfy the two-action composition, while actual
founder routes, products and funded bodies match the construction. Small community probes
demonstrate producer export, recipient uptake/conversion and paid repair/growth at the same
locations. Separate initial priming, source input, cell output and abiotic flow; if existing
traces cannot identify provenance, use a matched producer intervention before claiming transfer.
Do not require stable role shares or interpret authored founders as evolved differentiation.
Keep mutation and learning active in the production default after controlled probes.

### R4 — Verify operation and hand off

Sulion phase `efa1f4c6-e2d8-4b3f-816a-b9dd1e584e4b`. [depends on R3]

Execution branch `28512e73-7b36-40dc-8b50-8df0efcdc409`:
1. Measure the registered5,000tick default and matched capacity. Inspect complete founder
   descendant counts, actual chemical accounts, source spacing and cold continuation.
2. Reconcile current formulas, defaults, consumers and schema; run full CI and verify worker
   integration on the existing server. Preserve negative findings and human review status.

Browser registration: use `browserApplication.mjs` with cached Chromium1234 against the
existing `http://localhost:26000/` in a fresh isolated profile. Purpose: v27 startup defaults,
worker/WebGL2 rendering, bounded inspection and local save. Stop at the first observation
at/after300ticks or30seconds, outer cap120seconds; do not enable long-duration mode or faults.
This operational check cannot supply human motion acceptance. No other simulation runs concurrently.

After mechanism checks, observe one ordinary seed27 startup through at most5,000ticks.
Measure local access, all four route flows, repair/growth, divisions/deaths, source clustering,
chemical coverage and external material/work. Diagnose failures from these accounts rather
than extending the run. Compare whole-runtime cost against the archived pre-change engine
using identical workloads and ordinary census/inspection/render preparation.

Acceptance: representative full-resolution use meets at least30ticks/s; report baseline and
candidate48/2,000/2,000-growth capacity separately, including pre-existing saturated failures.
Investigate a matched-case slowdown above10% before handoff; ecological support growth and
per-operation cost must be distinguished. Do not trade resolution or ownership for a pass.
Verify exact save/restore continuation, bounded observations and memory, and run make ci.
Update the runtime/work-order/founder/account descriptions with actual constants and evidence.
Human review must judge visible clustering, motion and chemical legibility on the existing
server; automated completion does not mark that review passed. Record it as pending until
received. No claim of long-run coexistence, endurance or a completed ecosystem.

### Bounded verification envelope

R0 registers each causal question, alternative explanation, initial conditions, predicted
response and decision before execution. Read existing negatives first. Use production World
and existing fixtures/ledger. Controlled probes freeze mutation and declare private learning,
inherited learning and transfer; later default observation retains ordinary settings.

- Mechanism probes: at most16 cases of300ticks each,120seconds per case. Select only cases
  needed for work coupling, pressure and their controls; this is a ceiling, not a test quota.
- Local community: at most two1,500tick cases with swapped placement,120seconds each, after
  single-cell delivery and cost checks pass.
- Ordinary startup: one seed27 run, at most5,000ticks/180seconds, samples/checkpoints every
  1,000ticks plus initial/final. Stop on extinction, accounting failure or resource limits.
- Total ecological ceiling12,800ticks and20minutes wall time, one simulation process.
  No seed sweep, automatic retry, horizon extension or overnight campaign.
- Capacity: baseline/candidate48/2,000/2,000-growth fixtures,10warmup+100measured ticks per
  case,60seconds each. Reuse matching baseline evidence when its exact build and fixture qualify.
- Keep generated artifacts local. Before runs, bound expected output and record available
  memory/disk; ceilings3GiB RSS,1.5GiB WASM and2GiB new artifacts. Stop and retain partial
  evidence at a limit. Reuse bounded traces rather than adding persistent reaction history.
- Browser operations, if needed: register a specific integration purpose, isolated session
  on the existing server, at most300ticks/120seconds. Never touch the user's run or storage.

Bounded invariants belong in Rust/Vitest; ecological evidence belongs in the existing ledger.
Run make ci and diff checks before implementation handoff. Failed predictions remain negative;
branch a multi-step prerequisite from its blocked phase instead of hiding it in later work.

### Current state and resume

All five implementation phases are complete. Physical v27 uses shared local external work,
χ=.003 pressure with finite-owner self-load subtraction, and the four ordinary mutable
founders. Runtime documentation, atlas/reference reports, chemical-web affordability,
accounting, schema readers and default initialization are reconciled. Full mesh2, borrowed
worker rendering, mutation and funded inheritance remain intact. Earlier physical saves
are explicitly rejected; human review requires a fresh world.

R4 evidence is preserved in the [v27 report](docs/evidence/digital-chemistry/regenerative-v27/README.md),
ledger4059–4079 and the local artifact directory. The ordinary seed27 run reaches5,000ticks
in40.642seconds, ending203cells with150/18/23/12 descendants of the four initial roles.
All four inputs are consumed; no sustained-coexistence or evolved-dependence claim follows.
The separate producer-on/off control establishes actual producer-dependent uptake. The
isolated8→0 starvation and recipient eventual death remain negative delivery findings.

Source nearest-neighbor median changes5.07→6.24units; pairs within8units change44→23,
and within1unit0→2. This retains geographic neighborhoods but includes some spread and
overlap. The dilute/crowded mechanism tests establish attraction/repulsion; they do not
certify the visible pattern. Human motion and legibility review remains pending.

Matched initial capacity states yield40.31/19.88/14.42ticks/s versus40.72/19.87/14.46.
Step-time changes stay within1%; no optimization or formula change was needed after measurement.
The2,000-growth case ends1,742cells versus480, with higher WASM allocator high-water978.5MB
versus841.0MB. Saturated2,000-cell workloads remain below30ticks/s. Exact continuation passes
all six capacity cases and the5k checkpoint; the latter is26.1MB and restores in77.2ms.
Global chemical identities reach256 by3k; sparse geographic support must still be measured
in later endurance work. This run does not resolve far-run field accumulation or OOM limits.

The registered isolated browser check uses the existing server, initializes v27 paused at0,
reaches392ticks with61cells, renders48frames without skips, and reports154–182ticks/s in
active observation windows. Local manual save takes231ms; no runtime errors or alerts occur.
The first-observation stop overshoots300ticks by92 because sampling is asynchronous. The
static screenshot verifies visible fields/source outlines and inspector content, not motion.
No extra server, user-profile access, publication or deployment occurred.

`make ci` passes149Rust tests and62Vitest tests, Clippy, formatting, TypeScript, docs and
Terraform format; ESLint reports12warnings and no errors. The two initial failing fixture
tests assumed a single starting genome; they now verify actual assignments. A new startup
invariant checks six copies of each funded role per colony and exact installed circuit edges.
Generated local artifacts total950MiB, below2GiB. Measured WASM high-water remains below1.5GiB;
the default inspection/replay process ends at439MB RSS, not a measured campaign peak.

Resume with the user's visual assessment on this fresh version. Do not re-run R0–R4, extend
the ecological horizon or tune toward four-type coexistence merely to close the human gate.
Environmental plan obligations remain separate.

<a id="source-concentration-correction"></a>

## Source concentration correction — September 18

Root `b482e871-94d8-41c9-86a3-7486f13c13f3`. User reports coincident reservoirs by
tick 1,000 and asks whether restoring separated resource opportunities improves population.
Same seed27 saved evidence: v23 has zero pairs of centers within one unit at tick1k;
corrected-mutation v25 has83. All1,128 initial pair coefficients change from negative
with feedstocks0/80 to positive with0/5. Feedstock selection changed with the potential
surface; movement code did not. Keep this definition, feedstocks, founders and inheritance.

### Selected mathematical extension

The shared feature projection has two signed chemical channels A,B and a positive impedance
load L. Its bilinear attraction is `a*A - b*B`; mobility cannot change its direction.
Extend the constitutive response with the scalar `P(L)=L²/2`. At the spatial scale of an
owner, the force is `a*grad(A) - b*grad(B) - i*L*grad(L)`, where i is that owner's
ordinary impedance property (the inventory or membrane-weighted mean for finite owners).
This is the lowest-degree pressure whose slope vanishes at zero load and increases with
load. Unit load is already the reference of the existing `1/(1+scale*L)` mobility law;
there is no fitted source-spacing constant. This is an artificial constitutive law, not
a thermodynamic work store, global energy minimizer or momentum-conserving particle solver.

Use matched deposition/sampling W and the skew-adjoint periodic centered difference D.
Finite owners first gather `L_W=W^T L` and `grad(L)_W=W^T D L`, then form the local
pressure response. For an isolated profile proportional to W, `W^T D W=0`: no self motion,
including off-grid centers. Do not instead gather `D(L²/2)` through a wide footprint;
that different closure can produce discrete self force. The finite-owner closure evaluates
the same local law at its resolved footprint scale; it is not claimed to be the exact
gradient of one global many-body potential.

For a field face, use `deltaP=(L_left+L_right)*(L_right-L_left)/2`, the exact divided
difference of P. The force contracts the same three property rows. Reversing a face negates
all drift terms. Bound them together before the existing conservative nonnegative stencil;
retain the existing substep bound, donor floors and active four-species groups. The finite
body velocity retains its rotation-invariant norm bound. Embodied impedance is projected
with the existing body footprint into a derived pressure-only load, just as its signed
interaction channels are; existing viscous mobility and weathering exposure keep their
current field/reservoir load definition. No new chemical, genome or full-frame observation.

Chemical relabeling with all property rows preserves contractions. Geographic reflection,
integer mesh translation and axis exchange on a square test lattice commute with the
stencil. Arbitrary local rotations commute with the vector law, not exactly with the grid.
These are symmetries of the update; irreversible motion itself is not a group action.

### Registration and gates

First test zero/constant medium, isolated finite source/body at off-grid and periodic
positions, attraction at low load versus opposition at high load, reversed pairs,
coordinate covariance, field nonnegativity/material accounts and cold continuation.
A cell-free source pair probe uses the actual shared operators for at most300ticks per
case; mutation/controller/learning are absent. Preserve source material and check separation
before a population run. This gates the claim that the new response can oppose collapse.

Then run one ordinary seed27 candidate to5,000ticks,1,000tick samples/checkpoints and a
180second wall cap, using the existing recorded evolution runner. Baseline is ledger4051
(48→134→82→116→111→153 cells), not a rerun. Measure source nearest distances, pairs within
one unit, source availability, population, paid divisions/deaths, damage, imports and
account residuals. The intervention also changes passive field/body response, so any
population effect is attributed to the common pressure correction, not isolated source
spacing. A return to700–800 cells is a hypothesis, never a tuning criterion. Stop at the
horizon, extinction, resource limit or accounting failure; no seed/horizon expansion.

Use the standard48/2,000/2,000-growth capacity panel on archived baseline and candidate
(10 warmup+100 measured ticks,60second case caps). Check saved-state continuation. Total
new population horizon5,000ticks; at most four300tick mechanism cases; total execution wall
budget12minutes excluding build/CI. Run make ci. Record negative results rather than sweep.
Physical revision26 rejects earlier checkpoints so old bytes cannot silently resume under
new mechanical laws. Existing artifacts stay available with their own archived engines.

### Results and disposition

Implemented the selected rule without tuning its coefficient or changing chemistry,
feedstocks, founder, mutation, renewal, grid resolution or sparse floors. The pressure-only
body impedance cache is derived and does not enlarge persisted state. Rendering/observation
retain their two signed chemical channels and borrowed buffers.

The300tick production-source pair checks retain attraction at dilute inventory (distance
4→3.8381) and oppose crowded inventory (4→11.9999 on the24unit periodic fixture). A12unit
translation gives the same distances to roundoff. Isolated off-grid source/body response,
local rotations/reflections, chemical relabeling, grid reflection/axis exchange/translation,
nonnegative field material and accounting pass. These checks establish a mechanical
opportunity, not a preferred spacing or a thermodynamic equilibrium.

Matched ordinary seed27, baseline ledger4051 versus candidate4055:

| Tick | Baseline cells | Pressure cells | Baseline median nearest source | Pressure median nearest source |
| --- | ---: | ---: | ---: | ---: |
| 1,000 | 134 | 102 | 0.083 | 12.420 |
| 2,000 | 82 | 255 | 0.055 | 14.556 |
| 3,000 | 116 | 181 | 0.045 | 13.533 |
| 4,000 | 111 | 128 | 0.072 | 14.376 |
| 5,000 | 153 | 150 | 0.080 | 14.870 |

At5k, center pairs within one unit fall140→0; overlapping drawn-radius pairs fall145→2.
Renewal schedules, active source counts and released material agree (4,934.362 released).
Mean living-cell damage falls0.2716→0.2047, but divisions rise1,055→1,548 and deaths950→1,446.
All deaths in both complete ancestry records are classified as starvation: usable energy
was exhausted, rather than the direct damage threshold being reached. This does not prove
which local food, processing, exposure or allocation shortage exhausted that energy.
The source collapse is corrected; the hypothesis of sustained greater population is not
supported at this horizon. No700–800cell recovery is established. The pressure acts on
field and cells too, so this is not a source-only causal intervention.

The recorded run takes40.60→76.31seconds (123.15→65.52ticks/s including recorded observation).
Occupied four-species groups at5k increase350,689→644,712; both worlds have reached all19,200
geographic nodes. Wider chemical activity accompanies the higher dynamic workload. Matched
standard capacity workloads, baseline ledgers4052–4054 versus4056–4058, measure
43.36→38.15,20.89→19.65,15.63→14.26ticks/s at48/2,000/2,000-growth respectively:
6–12% lower throughput. The pre-existing saturated2,000cell workloads remain below30ticks/s;
no claim of intended saturated performance or later-run speed. No further tuning or horizon
extension was performed.

All six unique candidate checkpoints restore byte-exactly and paired single-step continuations
agree; final checkpoint equals the tick5k checkpoint. Capacity continuation also passes.
Candidate final material/work residuals are7.32e-8/2.62e-7. CI passes144 Rust and62 Vitest tests
with twelve existing lint warnings. Integration checks caught and corrected a three-channel
profile leaking into the two-channel observer, and updated explicit schema/report expectations.
[Comparison evidence](docs/evidence/digital-chemistry/pressure-v26/response-comparison.json)
retains measurements and binary/source digests; full checkpoints remain in local artifacts.
Human motion review remains pending. No commit, push or deployment. A freshv26 world is
required; earlier checkpoints remain paired with their earlier engines.

<a id="chemical-geometry-correction"></a>

## Chemical geometry correction — September 18 follow-up

### Reopened: user reports extinction by tick5,000

The browser default is seed27 (`Engine.create`); B0/B3 mistakenly exercised seed101 for only
600ticks. Those checks establish startup only. User observation rejects continuing viability.
Read current seed27 through5,000ticks or extinction, with1,000tick samples/checkpoints and
180second wall cap, using the existing recorded runner. Compare archivedv23 on identical
seed/default configuration. Then one targeted control through the same horizon if traces can
distinguish mutation load from food/environment effects. Maximum15,000ticks/540seconds before
a decision; no seed sweep or horizon extension. Existing600tick checks are the short pilot.
Inspect whole-population material, work, exposure/repair, imports, reactions and inherited versus
installed machinery. Reproduction followed by extinction is a finding, not run failure.
The decision is which changed mechanism needs correction; no survival quota or selected founder.
Any repair comparison gets its own explicit bounded registration after the cause is established.

Results: ledger4048 v25 has3cells at5,000ticks; archivedv23 ledger4049 has323. V25 mean
damage rises0.300→0.473→0.561→0.711 over ticks1k–4k, despite appreciable local feedstock.
The reduced-scale control (ledger4050, physicalScale0.008) retains60cells, recovering from53
at3k. This also reduces body mutation, so it does not isolate chemical magnitude by itself.
The prior normalization multiplied ordinary chemical steps by the entire domain width15.
That is five recognition radii and changes typical local mutations as well as rare jumps.

Selected correction: express chemical mutation scale in the existing recognition radius R,
the distance over which physical specificity changes, instead of the full domain width.
Keep the same heavy-tail law and event rates, body/neural scales, reflection-center/action
representation and environment. Default point scale becomes0.36 versus1.8 in v25 and0.12
before the geometry change. There remains no magnitude cutoff; this retains greater chemical
variation without redefining a local mutation in units of the entire manifold. Angular scale
uses that same arc displacement/R. No new parameter or special waste mutation.

Validate this single candidate on the actual default seed27 to5,000ticks, cadence1,000,
180second wall cap, stopping at extinction or horizon. This isolates the chemical-unit change
with body/neural parameters unchanged. Success means the measured early-collapse mechanism
is relieved with continued paid reproduction, not a prescribed population or certification
of long-run survival. Do not extend or tune if it fails. Ordinary accounts and every saved
checkpoint must validate. Before that, repair the separate negative-flow roundoff defect:
identity mixtures generated consumed flow as low as−1.3e-18, rejecting the tick3k checkpoint.
Compute changed mass from non-self products and potential from their deltas, keeping identity
exact instead of relaxing validation. Original invalid evidence stays unchanged.

#### Extinction correction result

Root `e51e7cfc-fdc6-4166-836c-141e356ec795`; prerequisite flow repair branch
`9ede45f6-400e-4e9c-9dba-28e8d362ff70`. Ledger4051, same browser seed27: population
48→134→82→116→111→153 at0/1k/2k/3k/4k/5k. Paid divisions total1,055, including279 in
the final1,000ticks; mean damage falls from0.462 at2k to0.272 at5k. The rejected width-scale
run ends at3cells with mean damage0.708 and479 total divisions. Final survivors still had
local feedstock0.25–0.77, but damage per physiology event0.00655–0.00695 exceeded actual
repair0.00606–0.00612 despite94.7–95.6% repair effort. Loss of useful specificity and processing,
combined with exposure, is supported; simple global food exhaustion is not.

The radius correction preserves chemical event frequency and the heavy-tail law. Over100,000
draws the tested recognition pair changes19,038 times at either scale. Median nonzero change
is0.251 versus0.084 before the geometry work and1.25 in the rejected width-scaled version.
Product-neighborhood hits for0→138,119→187,15→240 are78/194/7 versus20/68/4 at the older
scale. These are access counts, not claims of coordinated adaptation or statistical certainty
for the rarest route. Body and neural constants remain unchanged in the correction.

All initial and1k–5k checkpoints restore and replay exactly. Final material/work residuals are
6.0e-8/−1.31e-7. Full CI passes140 Rust and62 Vitest tests; twelve existing lint warnings remain.
The added256-case identity-mixture test requires exactly zero transformed mass/work/heat.
The read-only `checkpoint_flows` example identified the preserved invalid checkpoint records.
Summary evidence: [matched comparison](docs/evidence/digital-chemistry/geometry-v25/extinction-correction.json).
Detailed checkpoints/genomes/traces remain under `frontend/harness/artifacts/geometry-extinction-*`.

This corrects the reproduced early-collapse regression through the user's reported5k horizon.
It does not certify later survival or show that mutation was the only ecological influence.
No horizon extension, seed search, landscape retuning, environment change or deployment.
The earlier B0–B3 results below retain their original width-scaled meaning and are superseded
for continuing viability and mutation units by this correction. A fresh run uses the corrected
units; restarting a collapsed population is not an automatic runtime intervention.

User authorized planning and execution after the chemical-web review. Current canonical root
`dfb36e51-2cd4-4688-9978-bd82e9179238` supersedes the completed v23 queue below without
reinterpreting its evidence. This remains the sole mathematical working document. Existing UI
changes stay in place; no commit, push, deployment or long campaign is authorized here.

### Findings and outcome

The default definition has decreasing potential on all 240 positive-X edges. Founder enzymes
share displacement (8.5,10), while physical mutation's median selected displacement is 0.081.
Recognition participates in constructing the product transform, and weathering's strictly
downhill neighboring conversions cannot close a cycle. Common permutation-group membership
did not establish common accessible operations or funded ecological return paths.

Correct these relationships in order: chemical definition, evolutionary representation, then
environmental integration. Keep discrete IDs, bounded square geometry, local controllers,
funded installations, material/work accounting, immutable sharing, sparse thresholds and
the borrowed render path. Do not add a real-world thermodynamic solver or special waste-use rule.

### Milestones

- B0: remove the privileged chemical potential gradient, establish smooth multidirectional
  variation and retained physical-property coverage. Start with the potential surface whose
  directional bias is demonstrated; inspect the remaining surfaces before changing their laws.
  Version definitions/checkpoints deliberately, preserve reproducibility, and verify an ordinary
  founder resource opportunity. No evolutionary claim from a surface plot.
- B1 [depends on B0]: select and implement a common transformation/recognition representation
  with meaningful composition and short general mutation paths from a substrate to its product.
  Preserve paid refits and stock inheritance. Selection requires worked interior/boundary,
  mutation and inverse examples; an ambient group alone is insufficient.
- B2 [depends on B1]: use that transformation language for environmental return paths with an
  explicit bounded external work supply. Preserve the open-world direction, local-medium
  dependence and common field/reservoir implementation. Select accounting and sparse cost before
  integration; no implicit unbounded subsidy or fabricated sunlight model.
- B3 [depends on B2]: verify opportunities, accounts, continuation, integrated cost and UI.
  Reconcile specifications and state exactly what remains an ecological hypothesis.

### Evidence and budgets

Read-only definition calculations and deterministic operator tests precede any population run.
Use seed101 plus the eight existing definition seeds for geometry validation, not an ecological
seed search. Preserve the existing property-range, coverage and neighborhood bounds unless
a documented geometric argument establishes a better bound. No parameters tuned to population
counts. Surface generation and compilation are cold work; live work must remain bounded.

At most two 600-tick ordinary startups (B0/final; reuse archived v23 cost evidence), four constructed probes of at most
300 ticks, and the existing three-case capacity panel (10 warmup + 100 measured ticks each,
60-second case cap). Total headless wall cap 15 minutes excluding build/CI, principal ticks
at most 3,000, artifacts below 1 GiB. Register each probe's concrete question before execution;
these are ceilings, not required runs. Browser operational check only on the existing server,
isolated profile, at most 300 ticks/120 seconds. No new server. Run full CI and diff checks.

<a id="b0-expansion"></a>

### B0 expansion

Branch `6ed4dfdb-e01b-44fe-a892-411a380aeb37`.

1. Select and implement the landscape in `chemistry.rs` and shared definition helpers. Retain
   compact persisted coefficients, deterministic seed ownership and static property compilation.
   Measure rising/falling edges, extrema, smoothness and original coverage. Correct schema and
   definition consumers together; existing v23 evidence stays historical.
2. Verify all existing definition fixtures, property consumers and founder opportunity. Read
   zero-tick resource budgets before bounded startup; record negative results and fix a missing
   physical opportunity rather than extending the run. Shared CI closes both steps.

Current state: B0–B3 implementation and automated checks complete. Human motion judgment
and ecological outcomes remain subsequent observations, distinct from these mechanism checks.

#### B0 selected potential law

Retain the existing bounded cosine basis and normalized range. Replace the privileged (1,0)
mode with a seeded isotropic spectral band: modes with squared wavenumber 4 through 8 have
independent zero-mean normal coefficients scaled by inverse squared wavenumber. This includes
(0,2), (2,0), (1,2), (2,1), (2,2), treating axis exchange/reflection identically in distribution.
It puts structure at roughly half-domain scale, above the three-unit recognition radius, with
multiple basins instead of a single axial fall. No selected chemical ID or biological outcome
participates. Other physical surfaces and interaction profiles remain unchanged in this first
mechanism correction so their existing conditional opportunities are retained and measured.

Definition generation conditions this small random field on explicit geometry: each axis must
have at least a quarter of its edges rising and a quarter falling, at least two strict local
maxima and minima, existing low/high coverage, and the existing 0.15 normalized adjacent-step
bound. At most 256 deterministic cold candidates; failure is explicit. This is validation of
a generated definition, not simulation seed selection or population tuning. Persist the selected
coefficients and actual tables. Chemical definition v5 and physical v24 reject prior schemas.

B0 checks: all 134 Rust and 62 Vitest tests and CI pass. Three fixed-ID fixtures were revised
to use current source definitions or analytically reactive material. The historical potential
hash fixture is superseded by topology/determinism coverage; unchanged properties will be
compared between archived/current WASM directly, avoiding native/WASM trig-bit differences.
The zero-tick economy predicts processing surplus 0.03856/0.04117 at pure second/first default
feedstock, concentration0.03 and body scale1. Proceed with one seed101, 600-tick startup,
120-second cap, to check actual uptake, paid construction/divisions and account closure.
Ordinary mutation/learning remain enabled; no custom controller. This is startup operability,
not evidence of evolved recycling. Local artifacts: `chemical-geometry-b0-startup` and
`chemical-geometry-b0-atlas`; use the existing atlas exporter/plotter without advancing ticks.

B0 complete: ledger4043, seed101,600ticks in1.435s (418ticks/s),138 paid divisions,137 living
cells, material/work residuals4.1e-11/1.4e-9. Both axes have120 rising/120 falling edges and
two strict maxima/minima. Archived/current WASM confirms exact equality of diffusion,
impedance, stress and profile coefficients for all eight definition seeds. This establishes
startup opportunity, not evolved recycling. The atlas shows the retained resistance gradient;
it does not impose the universal energy ordering corrected here.

<a id="b1-expansion"></a>

### B1 — recognition-independent actions and mutation geometry

Keep the proven exact bounded interval reflections and square orientations, but remove the
recognition point from action construction. An enzyme now stores recognition a, global
reflection center c and orientation theta. Its components are `J_(2cx,2cy) Qq`, interpolating
neighboring integer reflection parameters and quarter-turn orientations (at most eight).
The center lies in the same 0–15 square as every other chemical coordinate. A zero-angle
integer component is an involution. For a,b in the square, center `(a+b)/2` exchanges them
exactly when both endpoints are discrete; the complement of each reflected interval stays
fixed. No wrapping, clamping or accidental long boundary translation is introduced.

Recognition changes only catalytic acceptance; it never changes the transformation. Thus
moving recognition from a to b can reuse the same operation on b, including its reverse for
an involution. General orientation retains exact component inverse/composition through Action;
one enzyme's bounded mixture is still not the entire group. Costs use actual changed products,
and recognition/center/angular installation changes remain funded. Rename displacement fields
to centerX/centerY throughout persisted genes, inspection and all authored fixture consumers.
The canonical between-points constructor owns deliberate diagnostic routes. Founder selection
chooses one shared reflection from chemical properties with positive processing on both supplied
substrates, then constructs matching mutable export interfaces; it never sees population success.

Use the existing common heavy-tail formula and event rates. Chemical coordinate scale becomes
`physicalMutationScale × 15`, making this control a fraction of the shared domain; angular scale
is the corresponding arc displacement divided by recognition radius. Body and neural loci keep
their existing units. No special waste mutation or separate chemical rate. One mutation can
reach any product neighborhood; quantify how often using the actual inherited-code path rather
than inferring accessibility from group membership. Compare100,000 independent target draws at
old/new scale, zero World ticks; report event rate, realized displacement and radius3 target hits.

Steps: implement compiler/representation and all consumers with independent recognition,
endpoint exchange, D4 and actual funded-reaction checks; then measure mutation accessibility,
birth/refit/restore and CI. Future environment integration retains local sparse execution and
uses the same bounded-reflection generators, with explicit work before permitting return paths.

B1 branch `6437a6f5-8a79-4857-b679-f4a2b4d11deb`: 136 Rust tests pass; TypeScript passes.
All65,536 ordered pairs exchange exactly with unchanged action when recognition moves.
In100,000 ordinary machinery-inheritance draws, the selected recognition group changed19,038
times at both scales. For0→138,119→187,15→240, radius3 product-neighborhood hits rose
20→354,68→824,4→78. Median realized change rose0.084→1.24–1.26. These count recognition
access only, not coordinated transport, affordable refits or ecological success. Independent
center/orientation mutations can also alter the action. Existing funded-refit, actual-stock
inheritance, continuation and eight-frame reaction checks pass. Physicalv25 rejects intermediate
v24 because centers and offsets occupy identical byte shapes with different meanings.
Historical displacement comparison executables now fail explicitly; recover their original
commit to repeat historical evidence. Full CI remains the integrated B3 gate.

<a id="b2-expansion"></a>

### B2 — bounded externally driven return paths

Keep four local branches and the existing medium response/rate/exposure. Author each neighbor
conversion with the same interval-reflection action as an enzyme centered halfway between its
endpoints. Recognition/kinetic selection can differ; the action and endpoint accounting cannot.
The complementary parts of a reflection are irrelevant to a selected donor, not a different
global map. Outward edges are identity and do no work.

Remove the potential-order gate from medium-selected routes. A conversion s→t dissipates
`q max(E_s-E_t,0)` or receives external work `q max(E_t-E_s,0)`. This is an explicit open-world
drive, not energy stored in geographic vectors or a claimed sunlight simulation. Book field
and reservoir work separately and include both in conservation. No new control: existing rate,
local profile strength and shielding bound conversion and work. For exposed owned material M,
elapsed rate-time h, signal norm u≤1 and potential range R=7.5, each update supplies at most
`M R min(2hu,1)`. No material or zero medium means no work. Supply can continue over time,
as appropriate for the retained open-world direction; it is not a finite lifetime energy store.

Select this minimal drive before introducing sun/terrain fields. It removes the categorical
ban on chemical recharging while preserving local environmental direction and sparse floors.
Opposite medium can reverse an environmental route; an enzyme can express its exact reverse.
Neither graph connectivity nor this constructed possibility establishes a stable ecosystem.

Steps: implement shared routes, bounded work and all runtime/account consumers; verify
field/reservoir parity, changed-medium reversals, paid environment→cell cycles and accounts.
Use zero-tick operator assays first: one uphill selected pair, reverse cell enzyme, normal
donor/work limiting; compare zero medium and reversed medium. No population run for this test.
Preserve numerical-floor accounting and measure integrated cost in B3.

B2 branch `310d8067-29c5-42ec-ae5f-db08b8c6e4cc` complete. The960 directed neighbor routes
use the same midpoint reflection as enzymes;480 uphill directions are now expressible.
Reversing the medium reverses edge engagement (donor shares still depend on other branches).
Field/reservoir parity, work bounds, no same-event cascade, sparse floors, full accounts and
checkpoint continuation pass. A constructed112→96 environmental route supplied0.00707538
work; ordinary cell reverse processing captured0.00472512, with residual4.8e-17. This is a
funded opportunity with authored installed machinery, not an evolved recycler.

### B3 expansion — integration and handoff

Complete CI, then inspect the current zero-tick economy before the remaining600-tick ordinary
seed101 startup. Run the existing48/2000/2000-growth capacity panel (10 warmup,100 measured,
60-second cap each), compare archivedv23 measurements, inspect accounts and exact restore.
Run `browserObservationUi.mjs` on the existing port26000 with a fresh Chromium profile:
purpose is current-schema startup, enzyme-center inspection, Web routes, Stats accounts,
borrowed rendering and local save/restore on desktop/mobile. At most300ticks/120seconds.
No long ecological experiment; no parameter tuning to counts. Preserve generated evidence
locally and concise measurements in this plan. Reconcile current docs and all schema consumers.
Human judgment of motion and long-run recycling remains the user's subsequent observation,
not an automated completion claim.

### B3 results

Branch `9c808ab5-7170-479c-83a7-7bb670501b31`. Full `make ci` passes:139 Rust tests,
62 Vitest tests, formatting, lint, TypeScript, docs and Terraform format. Twelve existing lint
warnings remain. The checks caught two stale schema expectations and a missed diagnostic
offset consumer; all were corrected. No mechanism was tuned to the resulting population.

The zero-tick budget predicts positive processing surplus at all48 founder positions,
range0.07357–0.21694. At concentration0.03 and body scale1, pure feedstocks give0.04497/0.04923,
and an equal mixture0.05541. Ledger4044: seed101 reached600ticks in1.570s (382ticks/s),
139 paid divisions,127 living cells,60 deaths. Material/work residuals were1.14e-8/5.99e-8.
The environment supplied2.129 field work and2.664 reservoir work; cellular captured flow628.077
mostly still consumes initially supplied chemical potential. This does not show evolved recycling.
The definition-only B0 startup measured418ticks/s; the full correction measured8.6% lower
throughput while executing different biological and source-conversion activity.

| Saturated constructed workload | Archived v23 ticks/s | v25 ticks/s | Change |
| --- | ---: | ---: | ---: |
| 48 cells | 43.54 | 43.46 | −0.18% |
| 2,000 cells | 21.38 | 20.83 | −2.55% |
| 2,000 with growth | 16.03 | 15.66 | −2.33% |

Ledger4045–4047: all100 measured ticks completed; all three checkpoint restores and continued
bytes match exactly. Peak measured WASM allocation826MB versus871MB in the earlier growth
fixture; changed growth outcomes prevent attributing this as an allocator improvement. Saturated
2,000-cell workloads still miss30ticks/s. No new dense field pass or resolution reduction.

The registered browser check passed21 desktop/mobile layouts, enzyme colors and Web modes,
current cell inspection, local save/restore and worker error checks. It advanced17ticks in a
6.65-second operational session on the existing server, using a fresh isolated profile.
This validates operation and view bounds, not motion quality or browser throughput.

Final WASM SHA256:`e9ac78a5825ad2518567cda1062e68309518389208929d9a63075e54540cdfdd`.
Preserved [startup](docs/evidence/digital-chemistry/geometry-v25/startup.json),
[capacity](docs/evidence/digital-chemistry/geometry-v25/capacity.json),
[browser](docs/evidence/digital-chemistry/geometry-v25/browser.json), and
[property surfaces](docs/evidence/digital-chemistry/geometry-v25/physical-properties.png).
Full artifacts use `frontend/harness/artifacts/chemical-geometry-*` (under400MiB), including
the B0 comparison, current checkpoints, atlas and browser screenshots. No long run, commit,
push or deployment occurred. Physicalv25 requires a new world; old bytes fail explicitly.
Diffusion/impedance/stress and profile surfaces retain their measured prior laws. In particular,
the impedance gradient remains; removing the universal potential ordering was this definition
correction's selected scope. Long-run diversity, product use and sustained loops remain open.

## Historical v23 execution record

Adopted and completed September 18, 2026. Canonical mathematical plan:
`14120639-64cd-4840-b2d4-734e0aa4e123`. The existing root is retained so its evidence and
unfinished obligations stay connected. Current phases are A0–A5 below; old M0–M6 records
are historical. Execution of A0–A5 is authorized by the subsequent user instruction;
publication was subsequently authorized and v23 deployed from `3efa2446`. A0–A5 are complete.
The user reports real differentiation and acceptable speed through 100,000 ticks, accepting
the deployed run. This closes the human gate, not the separately deferred long-run cleanup.

<a id="canonical-work-order"></a>

## Canonical work order

The [transformation algebra white paper](docs/design/chemistry/transformation-algebra.md)
owns the group-theoretic direction and completion claims. This file owns the one execution
sequence. The [computational foundation](docs/design/chemistry/computational-foundation.md),
[principles](docs/principles.md) and immutable
[data-sharing contract](docs/design/chemistry/data-ownership.md) remain constraints.

The v23 implementation uses the exact finite action and bounded kinetic mixtures selected in
A0 below. The v21 cost/covariance corrections and v22 reflected rotations remain historical
evidence. Do not resume their exclusions or substitute the white paper's adjacent-exchange
feasibility example for the selected enzyme law. Distant conversion remains expressible.

### Scope retained across adoption

Preserve 256 discrete chemicals on bounded chemical geometry, periodic geographic XY,
one Rust/WASM World, local RNN control, funded stock and work, species-preserving body
material, immutable genomes/operator sharing and deterministic supported continuation.
Keep shared heavy-tail mutation, meaningful rare changes, sparse work elimination, mesh2,
borrowed worker rendering, bounded observations and memory. Costs and exact versus approximate
symmetry claims must survive compilation and ordinary execution.

New climate mechanisms, sun/terrain expansion, intrinsic-yield experiments, history retention,
optional biological expansion and broad evolutionary campaigns are not implicit additions.
Representation changes necessary for the chosen algebra are in this math scope;
separate bespoke controls and a thermodynamic reconstruction are not.

### Current phases and acceptance

| Phase / CLI position | Scope and completion evidence | Status |
| --- | --- | --- |
| A0 / 8 — Select concrete algebra | Select state/action, generators and compact genotype map. Work through identity, composition, inverse, boundary behavior, distant conversion, mutation and partial refit. Derive invariants, accounts, support/cost bounds and exact/approximate guarantees; register bounded checks. No algebra left to ad hoc coding. | Complete |
| A1 / 9 — Discrete actions and compiler | Implement the selected representation and sparse compiler. Verify group relations on actual discrete state, geometric covariance, conservative kinetics and cache invalidation. A pre-projection helper proof cannot close this phase. | Complete |
| A2 / 10 — Funded machinery and inheritance | Integrate targets, installed operations, paid partial refit, shared mutation, actual-stock inheritance and enabled expression paths. Update versioned state and consumers together; no free capabilities or implicit checkpoint adapter. | Complete |
| A3 / 11 — Common runtime consumers | Reconcile recognition, transport, weathering/reservoir conversion, body accounts, shared features, atlas, inspection and economy with the selected algebra. Give each retained distinct operator a precise reason and guarantee. Audit geographic/controller representation claims without inventing a second mechanism. | Complete |
| A4 / 12 — Opportunities and complete cost | Establish resource budgets, bounded physical opportunities, compiled/live equivalence, accounts, complete startup/capacity cost, mature-field and changed-machinery limits, memory, ownership and exact restore. Run CI. No ecological endpoint substitutes for an algebraic claim. | Complete |
| A5 / 13 — Contracts and human review | Reconcile current contracts and evidence, run a registered isolated operational check on the existing server, and obtain actual human judgment of final motion/activity placement. Carries unfinished M6 review; no earlier version is retroactively approved. | Complete; user accepts deployed v23 through 100,000 ticks |

Stable phase IDs, in A0–A5 order: `f5e020f1-a269-4dc1-bf77-4a1653a319cd`,
`cb958f3e-636a-4a0b-83c3-f95a855d317c`, `866cbb02-a097-4a3f-8f6c-df37d07425ca`,
`2c28925a-fd31-4498-b852-074713c88282`, `388e5d6a-7536-465f-8877-8af9df163224`,
`d5104255-d53e-4deb-9936-17e1606db3e7`.

The white paper's evidence table is the acceptance contract for A0–A5. A closing report must
map each claim to an installed ordinary consumer and evidence. Unresolved failures remain
open. Algebra selection, live integration, measured opportunities and human motion acceptance
are distinct milestones; a completed earlier correction cannot stand in for any of them.

### Evidence and performance boundaries

Start with calculations and direct operator checks, then short controlled mechanism probes
only where a decision needs them. A0 records exact cases, controls, tolerances and budgets
before execution. Use the current v22 executable for a new baseline when available; earlier
v20/v21 measurements keep their original meaning. Do not replay old registrations by default.

Retain the earlier conservative ceilings: at most twelve 300-tick mechanism probes, conditional
paired follow-ups only where justified (four cases of at most 1,500 ticks), matched 600-tick
startups and the existing 48/2,000/2,000-growth capacity panel. Total ceiling is 15,000 World
ticks, 30 minutes headless execution excluding builds/CI, and 1 GiB new artifacts. Capacity
uses its bounded warmup/100-tick measurement and 60-second case cap; mechanism/startup cases
cap at 120 seconds. These are ceilings, not required runs. Register mature-state checks inside
the same budget. No seed search, horizon extension or automatic overnight campaign.

Preserve the 30 complete ticks/second minimum and matched model time/resolution. The current
saturated 2,000-cell cases miss that target; no-regression against them is not target attainment.
Investigate a repeatable greater-than-10% slowdown rather than accepting it because another
case still exceeds 30 ticks/second. No coarser field, reduced model clock, omitted observations
or ecological collapse may purchase a pass. Keep existing-server browser checks bounded and
isolated; human review remains separate. Commit, push and deployment are not closeout steps.

### Disposition of earlier plans and unfinished work

| Record | Disposition |
| --- | --- |
| Root `14120639-64cd-4840-b2d4-734e0aa4e123` | Adopted as this sole open mathematical plan. Completed M0–M5 retain their v21 scope; A0–A5 own new work. |
| M6 branch `a1ca189a-3715-494c-a115-25bb36809995` | Canceled as a superseded work queue. Its completed documentation/browser evidence remains historical; unfinished human review transfers to A5. Old root M6 is skipped with that transfer recorded, not marked complete. |
| v22 correction `7a658d05-7255-46a3-88c9-150b87344b7b` | Already completed correction; preserve its [audit and limits](docs/symmetry-completion-audit.md). Its lack of group-theoretic completion and pending motion review are owned here. |
| White paper `e25005ed-d75b-487d-8ab4-45b133e122f9` | Already completed documentation only. Its unresolved decisions and evidence obligations are adopted in A0–A5, not treated as implemented. |
| Earlier mathematical audit and #186 investigations | Already closed records retain their measured/version-specific findings. They are inputs to this plan, not parallel execution queues. |
| [Digital-chemistry rebuild](DIGITAL-CHEMISTRY-PLAN.md) and historical [M0](DIGITAL-CHEMISTRY-M0-PLAN.md)/[M1](DIGITAL-CHEMISTRY-M1-PLAN.md) | Completed rebuild and retired work orders remain historical. Their governing principles and implemented protections survive; do not restart their old phases. |
| [Environmental ecology](ENVIRONMENTAL-ECOLOGY-PLAN.md) | Separate root, correction and handoff records remain unchanged. A3 owns mathematical consistency of existing consumers; environmental expansion, past campaigns and environmental human gates stay with their owners. |

The environmental records left unchanged are root `5e88cd8a-1314-4622-9989-4bb02af68581`,
correction `cc2e9b39-5a35-4abb-9c71-2566f064f08f`, and handoff
`9380f93e-71a8-45f1-93ed-0503b73ba5e6`. A shared future observation may supply evidence to
more than one owner only when its version and scope match; this consolidation closes none
of their obligations. [Mobile sources](MOBILE-SOURCES-PLAN.md) and
[long-run reliability](LONG-RUN-RELIABILITY-PLAN.md) are also left untouched.

## A0 execution — bounded permutation algebra

Expansion `86570c3d-fdb6-4123-b95e-7ad7ee4288fe`. Steps: select equations/representation,
then register verification and preserve the v22 baseline. Owners are `chemical_products`,
the shared compiler, genetics/refitting and weathering; the installed/analytical consumers
must use the same compiler. No ecological tuning accompanies the algebra selection.

### Selected action and kinetics

Use the finite group `(S16 × S16) semidirect C2`: independent permutations of the two
bounded chemical-coordinate sets, optionally exchanging axes. Store an exact action as
two 16-entry byte permutations and one swap bit. Composition and inverse operate on this
33-byte description; application is two indexed reads. Identity, composition, inverse and
all boundary behavior are exact integer operations on all 256 actual species.

Generators are bounded interval reflections `J_k(x) = k-x` when `0 <= k-x <= 15`, and
`J_k(x)=x` otherwise, for integer k from 0 to 30, applied independently to either axis,
plus axis exchange. Each reflection is an involution: its affected interval maps onto
itself; its complement stays fixed. Prefix reflections generate adjacent transpositions
by conjugating the swap of 0/1, hence generate S16 on each axis. Axis exchange generates
the semidirect product. The group acts transitively on all species, but does not contain
all arbitrary 256-species permutations. It preserves separability of coordinate lines;
only its D4 subgroup preserves the Euclidean metric. Reaction transformations are not
claimed to be isometries or symmetries of a fixed chemical potential landscape.

An enzyme retains recognition a=(x,y), displacement d=(dx,dy) and periodic angle theta.
Its target center is b=reflect(a+d), using the existing bounded *parameter* map. The angle
now specifies continuous weights between the adjacent quarter-turn orientations of the
square, not an arbitrary rigid rotation of stored chemical amounts. For each orientation
q, let Q be the exact quarter turn q+2 about (7.5,7.5), and k=Q(a)+b. Interpolate each
k component between its two neighboring integers. Each component map is
`g = (J_kx, J_ky) composed with Q`; multiply the angular and two coordinate weights.
There are at most eight group elements. Merge equal destinations when compiling a column.
No group action is reflected, clipped, rounded or projected after application.

Within the affected rectangle, this maps a recognition neighborhood to its target with
the selected quarter-turn orientation. Outside, interval reflections fix that coordinate
before the preceding Q is accounted for; they never collapse two identities. Every component
is globally bijective. Their unit-sum nonnegative mixture P is doubly stochastic, not a
group element. The physical update remains `(P-I)r` with recognition, engagement, actual
stock and frozen donor/work allocation determining accepted amounts r. The inverse belongs
to each exact component, not to the mixed reaction. At zero displacement and zero angle,
all components reduce to identity. Smooth mixing preserves continuity across parameter bins.

Worked case: a=(0,0), d=(8.5,10), theta=0 gives Q(p)=(15-px,15-py), k=(23.5,25).
The two actions map species0 to (8,10)/(9,10), the existing v22 founder products. With
a=(5,0) and the same d, k is unchanged and species80 maps to (13,10)/(14,10).
Each component is invertible even at the boundary. A nonzero angle mixes neighboring exact
orientations. It does not promise Euclidean distance preservation between their products.

The genome describes continuous mixture coefficients, not a group element, so existing
heavy-tail coordinate/angle increments remain the mutation law. No new mutation constant,
per-edge gene or categorical reset is introduced. Existing paid interpolation describes a
path through those coefficients, including partial mixtures; its cost remains recognition
distance plus offset distance plus recognition-radius times angular distance. It pays for
the installation path, not an inverse reaction. Diploid expression averages these same
parameters with circular angle expression; its antipodal convention remains explicit.

Environmental conversions use adjacent coordinate transpositions from the same group,
gated per substrate by their existing local-medium rates. An outward edge becomes identity
with zero rate; existing inward edges keep their unique rate. No new weathering law, forcing,
control or environment plan is introduced. Affinity and physical distance remain Euclidean;
costs use the actual compiled products. Founder source/export centers remain unchanged where
their current maps are already in bounds. Physical semantics change to checkpoint v23.

### Bounds and registration

The action representation is closed under arbitrary composition. One enzyme's at-most-eight
component parameterization is not closed and is never called a group. Its constant support
replaces the former four-product bound; rotation mixtures can need eight destinations. This
is a compile-time/short-row cost change to measure, not permission for dense live matrices.
No full field or private-population buffer is added. Exact maps need no trigonometry.

Verify all species for exact identity, inverse, noncommuting composition, generators and
D4 conjugation. Verify mixed-column positivity, unit sums, uniform-mixture preservation,
continuity, and end-to-end transformed compiler/kinetic outputs at tolerance 1e-12 for
isolated f64 coefficients (1e-10 for committed short multi-operation accounts). Integer
relations have zero tolerance. Include edges/corners, distant founder conversions, paid
zero/partial/full refit, real birth installation and supported checkpoint continuation.
Use existing distribution checks rather than resampling a new mutation law. Verify local
weathering equivalence to distinct in-bounds neighbors and its shared field/reservoir path.

Reuse archived v22 startup/capacity and their exact WASM digest as baseline evidence when
the current binary matches. Run the ordinary zero-tick economy then one 600-tick v23 startup
and one existing three-case capacity panel, within the root budgets. A short registered
browser operation check belongs to A5. No long ecological run is registered. Existing CI
is the baseline mechanics check; new tests must exercise the discrete/compiled action,
not merely repeat the selected parameter formula. Document retained square-grid, stochastic,
threshold and optional-controller limitations separately from exact group claims.

### A0 evidence and baseline qualification

The current v22 WASM digest is `920121cd6d48f4ed6a5be9a615e4b3199184be1c813d1ceb7daf3c9434b8684b`;
the earlier archived measurement binary differs (`6ac61b17...`). Therefore use a fresh matched
baseline startup and capacity panel in `harness/artifacts/algebra-v23-baseline-*` before
editing production code, rather than assuming byte identity. Final outputs use
`harness/artifacts/algebra-v23-*`. Both arms fit the already declared tick/wall/artifact budget.
A0 equation review and documentation checks pass; exact implementation proofs remain A1.

## A1 execution — exact actions and compiled mixtures

Expansion `8d274055-b538-44b7-bffb-bec2117d9ea1`: (1) implement exact action and bounded
mixture compiler in `chemical_group.rs`/`chemical_products.rs`; (2) replace the old raw-plane
composition test with stored-state algebra, independent dense products and D4 covariance
checks. Production chemistry operators consume this compiler directly. Sparse row size may
rise from four to eight; live reaction allocation is unchanged. Versioning and consumer
integration follow in A2/A3 before full CI and runtime acceptance. Existing v22 baseline
mechanics passed immediately before this execution; no deliberately broken baseline is needed.

### A1 evidence

`make ci` passes 125 Rust tests and 60 Vitest tests, with 13 existing lint warnings.
The discrete generator enumeration covers all 31×31 interval pairs, four orientations and
all 256 species; inverse checks are exact. Compiled covariance and mixed-mass/continuity
checks pass. One old-schema assertion still expected v22 and was corrected after CI caught it.
Physical v23 and the report/UI readers were updated in A1 so changed laws cannot be saved
under v22. Baseline ledger4034–4037: startup600ticks in1557.97ms, capacity43.77/21.40/16.06ticks/s;
all capacity continuations match. No long run was used.

## A2 execution — funded mixture inheritance and installation

Expansion `832a5d9c-21b3-4c9a-8a48-24d112dcf8b4`.
Reuse existing paid parameter paths rather than introduce a second installation mechanism.
The five parameters define recognition and coefficients of exact actions; averaging those
parameters is optional diploid expression, not matrix averaging or a claim that mixtures
form a group. The mutation distribution and rate/scale constants remain unchanged.
Extend actual division coverage with nonzero installed orientation and a different inherited
target, asserting borrowed compiled identity survives birth. Exercise optional diploid
expression against the ordinary compiler. Retain existing zero/partial/full paid refit,
angle seam, mutation magnitude, parent immutability and checkpoint continuation checks.
The inspector now labels the periodic parameter orientation rather than rigid rotation.
Version/reader edits were pulled into A1 to keep intermediate saved semantics coherent.
126 Rust tests and formatting pass, including actual birth with nonzero installed orientation,
optional diploid coefficient expression, and the existing paid partial/full refit and restore
checks. No mutation constants or random draw order changed in this correction.

## A3 execution — shared consumers and committed covariance

Expansion `1555a50d-a239-4d38-8792-f3c510cc0d76`. One integrated step replaces weathering's
reflected destination construction with common exact adjacent transpositions, checks ordinary
funded reactions under all eight square frames, and reconciles current contracts. Outward
environmental edges select identity/zero activity; each in-bounds edge retains the same rate.
Existing field/reservoir equivalence and restored-cache tests cover their common consumer.

Audit the actual RNN representation inside the controller module: permute incoming/recurrent/
output weights, hidden state and plastic traces together; verify 32 inference/learning steps
and assimilation at5e-6 f32 tolerance. Discrete task writes are checked in the declared fixture,
not promised identical for arbitrary values at a rounding threshold. Geographic laws retain
their Euclidean vector checks; the rectangular torus and square numerical stencil do not
acquire an arbitrary-rotation symmetry. Chemical frame tests transform resolved property
tables; they do not claim the fixed landscape or its generator is isotropic.

Potential, diffusion, impedance and stress remain separate attributes. Named interaction
features keep their signed pairing; permuting chemical IDs also permutes both feature tables.
The compact profile contraction, recognition, body material/work account, transport donor
allocation, atlas and economy already consume the same definitions/compiler. Preserve these
paths and check them rather than rewriting unaffected laws. Mixture coefficients and current
potential determine the same reaction work in the compiler, analytical ceiling and live rows.
SIMD activity thresholds retain the documented local approximation; no exact long-run
permutation claim is made for subfloor tails or random draw assignment.

A3 verification: full `make ci` passes 129 Rust and 60 Vitest tests, documentation checks,
formatting, Clippy, TypeScript and Terraform formatting; 13 existing ESLint warnings remain.
Funded multi-step reaction inventories/work/heat commute with every D4 frame within 1e-10;
environmental conversion accounts within 1e-12. Controller permutation evidence covers
32 inference/plasticity steps and assimilation, within the registered 5e-6 tolerance.

## A4 execution — resource opportunities and complete runtime cost

Expansion `92e39a9c-1d92-4979-85db-572f2a6f23a7`. First calculate the ordinary zero-tick
economy with `cargo run --release --manifest-path engine/Cargo.toml --example economy --
frontend/harness/artifacts/algebra-v23-economy.json`. Inspect conditional processing and
construction budgets before advancing the startup. Then, from `frontend`, run:

- `pnpm exec tsx harness/numerical/startup.ts harness/artifacts/algebra-v23-startup 600 on MATHEMATICAL-SYMMETRY-PLAN.md`
- `pnpm harness bacteria-capacity --output harness/artifacts/algebra-v23-capacity`

Question: does the implemented algebra retain affordable ordinary processing, paid growth
and practical runtime cost? Competing explanations for a slowdown are wider compiled rows,
changed installation cost, and different endpoint populations. Compare stages, allocations,
population and accounts with the matched v22 baseline; do not infer a mechanism from total
wall time alone. Baseline and final use the same settings and normal observations. Wait for
builds to finish before timings. The existing saturated 256-channel fixtures cover occupied
fields and changed machinery, not 200,000 ticks of ancestry growth. Preserve that limitation.

Production-operator tests already isolate funded conversion, substrate/work scarcity,
partial refits, body cycles and definition/compiler agreement. They justify omitting additional
population contests. The 600-tick startup checks expression under ordinary mutation and
learning; it cannot establish evolved recycling. Check memory and exact continuation in all
three capacity cases. Stop at the registered horizons/caps and root budgets above.

### A4 results

Release-WASM SHA256 `53c6fe0c79ffddc8898d9f579dd574a5f3326d269762531d21f3843cec37f7ff`.
Ledger4038:600 ticks in1597.72ms, 375.53ticks/s versus385.12 baseline. Population115 versus111,
with100 divisions in both arms. Imports405.35, constructed stock263.95, refit work7.907;
material/work residuals4.68e-9/3.50e-8. At newborn stock/concentration0.03, the zero-tick
report gives processing surplus0.01170/0.01800 per model second for pure source0/source80.
These conditional budgets and expressed growth establish affordable initial processing, not
evolved waste use. Three installed two-reaction cycles additionally return unit material to
its starting species with no net work creation and heat closure within1e-10.

| Constructed load | Baseline ticks/s | v23 ticks/s | Step-time change | WASM allocation before/after, MB |
| --- | --- | --- | --- | --- |
| 48 | 43.77 | 43.54 | +0.54% | 331.22 / 331.15 |
| 2,000 | 21.40 | 21.38 | +0.07% | 598.87 / 601.42 |
| 2,000 with growth | 16.06 | 16.03 | +0.18% | 855.83 / 871.24 |

Ledger4039–4041 complete all100 measured ticks and exact continuation checks. Final populations
are46/1951/909 versus46/1956/861; growth includes138.35 paid refit work. This measures complete
changed trajectories, not identical per-cell work. Material/work residuals stay below3e-10.
Rendering preparation takes44.49/50.10/55.68ms per100ticks versus44.51/49.70/56.47.
Save takes18.50/81.63/72.24ms; restore74.31/228.60/455.87ms. Allocation is WASM high-water
usage including storage replay, not retained live state. The largest increase is1.80%.
The fully occupied 2,000-cell cases still miss30ticks/s. No performance rerun, parameter
change, seed expansion or long ecological campaign is justified by these measurements.

## A5 execution — contracts and motion handoff

Expansion `ef43cac6-d736-4aa4-852a-dec3a6011218`: automated contracts/operation, then actual
human motion review. Both steps are complete; the user's acceptance is recorded below.

Reconcile the current agent guide, work order, physical/body/installation contracts and
white-paper implementation status. Retain the white paper as a pure design record; this plan
owns selected laws, actual consumers and evidence. Keep previous version measurements intact.

Browser registration: existing `http://localhost:26000/` returns HTTP200. Run the ordinary
`harness/numerical/browserApplication.mjs` with cached Chromium1234, `ANTROPY_FAULTS=1`,
new isolated profile and output `harness/artifacts/algebra-v23-browser`. Stop at the first
sample at/after300ticks or30seconds, with outer180-second cap. Purpose: verify the current
v23 build starts paused and exercises real React/worker/WebGL2, inspection, manual IndexedDB
save, graphics-loss export/recovery and visible injected worker failure. Use ordinary startup,
all render layers and existing ownership guards. Do not touch the user's storage or start a
server. Builds finish before browser timing. A screenshot or fault test cannot pass human
motion/activity-placement acceptance. No additional ecological campaign is registered.

### Evidence-to-consumer mapping and limits

| White-paper obligation | Ordinary implementation and evidence |
| --- | --- |
| Group, action, closure and chemical meaning | `chemical_group::Action` uses bounded coordinate permutations plus axis exchange. A0 proves closure/transitivity and identifies D4 metric symmetries; `chemical_group_tests` checks actual IDs, inverses and composition. Interval reflections retain coordinate-line structure and allow one-enzyme distant conversion. Costs depend on actual displacement; transitivity is not universal affordability. |
| Compiler and committed kinetics | `chemical_products::Transform` compiles up to eight weighted actions into `chemical_operators`; `metabolism::react` uses those rows. Independent dense-reference, mixture conservation, continuity and eight-frame tests cover coefficients; `chemical_equivariance_tests` compares committed eight-step inventories, work and heat. |
| Work and body accounts | Three installed round trips close material/work/heat at1e-10 with no net usable-work creation. Existing `bound_material_tests` cover growth, repair, division and death without species resets. Full startup and capacity accounts close at their reported tolerances. |
| Funded evolution | Existing shared heavy-tail law and constants are unchanged. Continuous genes parameterize mixture weights, not a group-valued genome requiring a composition mutation rule. `enzyme_transform_tests`, `runtime_tests`, angle/mutation tests and checkpoint tests cover partial/full paid installation, inherited operator identity, enabled expression and deterministic continuation. |
| Common ecology | `weathering::Operators` uses exact adjacent coordinate exchanges, selected by unchanged local-medium coefficients. Field and reservoir paths share these compiled destinations and rates; source/climate tests compare consumers and account for renewal separately. Transport moves the same species between owners; it is not a catalytic permutation. |
| Other retained operators | Affinity/membrane and cost use Euclidean chemical geometry. `chemical_features`, field transport and source projections share chemical properties and interaction profiles; atlas and economy use the production compiler. Growth/repair/death are owner transfers. Geographic drift/contact uses geographic vectors, not chemical coordinates. These distinct roles do not require identical rates or a second chemical economy. |
| Controller representation | `controller/symmetry_tests` permutes hidden units, weights, state, traces and assimilation together for32 steps, at5e-6. Inputs/outputs have distinct physical roles and are not freely permutable. |
| Runtime, ownership and persistence | Ledger4034–4041 compares matched full-resolution release-WASM startup/capacity, normal observations, changed machinery and exact replay. Existing ownership/runtime guard tests remain enabled. A5 separately checks actual worker/WebGL2/storage and requires human motion review. |

Exact action identities use integer equality. Finite kinetic mixtures preserve positivity and
unit column/row sums to1e-12; physical recognition/funding can break row-sum symmetry and
are not claimed invertible. D4 coefficient/committed tests transform both definitions and
machinery, not just amounts. The full catalytic group does not preserve Euclidean distances,
so arbitrary group elements are transformations, not metric symmetries of every kinetic law.

For an omitted environmental donor with outgoing bound f, one-pass inventory L1 error is at
most2f: at most f stays with the donor and at most f is absent from products. At mesh2,
f=4e-9 material; summed over all19200×256 node/species positions the loose bound is0.0393216
per conversion pass. The reservoir bound is2×sum(f) over skipped donors using their actual
interface areas. Lane grouping can choose to process a subfloor partner; its discrepancy
is bounded by the same omitted amount. This is a local analytical bound, not a long-run
trajectory bound. f32 rounding and product culling have separate explicit numerical accounts;
measured startup residual closure does not measure error against an unfloored world.

The rectangular geographic torus and square mesh retain their existing exact/approximate
distinctions. No arbitrary-angle global grid symmetry is claimed. Fixed founders, sources and
potential landscapes intentionally choose initial/background conditions. Optional diploid
antipodal angle expression retains its documented zero-angle convention; optional contact
transfer remains off by default and no exchange-order symmetry is claimed for it. No claim
extends deterministic RNN/task-byte equality across every floating-point decision threshold
or identical random-seed trajectory across differently ordered populations.

### A5 automated results and human acceptance

The existing-server browser check passes: physical v23 starts paused at tick0 with48 founders,
advances to tick388 with80 cells and25 rendered frames, and reports no ordinary error or
skipped frame. Active observation windows measure281/306ticks/s under software WebGL2.
Manual save takes231ms. Graphics loss retains state and exports911,812bytes; recovery restores
the tick388 summary, and injected worker failure leaves a visible error with a runtime report.
The inspected screenshot shows smooth fields, cells, source outlines and chemical inspection.
A still image does not establish acceptable motion.

Browser/final WASM SHA256: `32c23fe3026e72522973769d489f357dcfffadf389d3f8247b270f2be39707ba`;
embedded source digest: `b695ef50f84573ec24b092e23902e6c32529ad5b687204625df981304b430370`.
The final added round-trip test changes the source digest after capacity measurement. Both
artifacts have the identical1,235,161-byte executable WASM prefix; only the appended81-byte
source-digest custom section differs. No runtime law changed after timing.

Preserved reports: [economy](docs/evidence/digital-chemistry/algebra-v23/economy.json),
[baseline startup](docs/evidence/digital-chemistry/algebra-v23/baseline-startup.json),
[v23 startup](docs/evidence/digital-chemistry/algebra-v23/startup.json),
[baseline capacity](docs/evidence/digital-chemistry/algebra-v23/baseline-capacity.json),
[v23 capacity](docs/evidence/digital-chemistry/algebra-v23/capacity.json),
[browser](docs/evidence/digital-chemistry/algebra-v23/browser.json), and
[browser faults](docs/evidence/digital-chemistry/algebra-v23/browser-faults.json).
Exact endpoint checkpoints, binaries and traces remain in the registered local artifact
directories. New artifacts total708.4MiB; execution uses fewer than2,500 principal World ticks
including storage continuations, within the declared budgets. No long campaign ran.

Final `make ci` passes130 Rust and60 Vitest tests, formatting, Clippy, TypeScript,
documentation links and Terraform formatting. ESLint retains13 existing warnings. Final
documentation checks and `git diff --check` pass. No publication was performed.

After commit, push and successful deployment of `3efa2446`, the user reports real
differentiation and acceptable speed through 100,000 ticks and moves on to UI cleanup.
This supplies A5's human acceptance. The A5 branch and root are complete; environmental
plan statuses remain untouched. The report does not remove the measured saturated-capacity
limits or establish days/weeks endurance. The next scoped work is the
[viewport UI reorganization](UI-OBSERVATION-PLAN.md), followed by later phenotype work.

## Historical v21 work order and evidence

Everything below records the earlier correction, including its then-current instructions and
claims. It is retained for provenance, not a second work order. The canonical section above
supersedes its execution sequence and exclusions. References below saying M6 is pending record
its historical state; A5 carried that obligation and is now complete.

Created 2026-09-18. Status: the v21 corrections and automated checks below completed;
the user identified an omitted enzyme requirement. The
[v22 correction and omission audit](docs/symmetry-completion-audit.md) supersedes the
founder-preservation and no-new-enzyme-gene exclusions below. M6 still awaits human motion review.
Sulion root: `14120639-64cd-4840-b2d4-734e0aa4e123`.
Source: [completed v20 audit](docs/mathematical-symmetry-audit.md), including its direct-operator evidence.

## Outcome and authority

Give the existing simulation a consistent transformation language: geographic vectors,
chemical neighborhoods and product maps, owned mixtures and projections, funded requests,
and inherited variation. Equivalent representations should produce corresponding outcomes;
intentional chemical, environmental and embodied differences should retain their meaning.
Reversibility, detailed balance and physical realism are not acceptance requirements.

The September 18 follow-up authorizes execution of all phases and their bounded checks.
Publication and deployment remain outside scope. Expand the imminent milestone with plan-phase in
this document and track its steps under the matching Sulion phase. Technical formula choices
belong to the implementer within the constraints below.

This is a new correction after the completed audit, not a restart of digital chemistry or
environmental ecology. Preserve the existing environmental plan and its unresolved handoff
records. Its C0–C4 and M4 bodies were inspected for overlap; historical campaigns are not
repeated or silently claimed complete by this plan. Earlier instructions to keep mutation
fixed applied to that ecology comparison. This work explicitly includes the mutation geometry
identified in the symmetry audit while preserving the corrected scalar heavy-tail principle.

## Boundaries

- Keep 256 discrete chemicals on the bounded 16 × 16 manifold, separate from periodic XY
  geography; retain the shared interaction profiles and independent property surfaces.
- Keep the sole Rust/WASM World, same-worker WebGL2 rendering of borrowed memory, scalar
  stepping, bounded observations, backpressure and existing ownership guards. The
  [data-sharing contract](docs/design/chemistry/data-ownership.md) remains immutable.
- Preserve v20 species-preserving free/bound material, work accounts, paid machinery,
  stock inheritance, genome immutability, local RNN control and parentage. No new controller
  inputs, species roles, favored lineages, automatic founder selection or replacement economy.
- Retain mesh2, 320 × 240, seed27/chemistry101, 48 founders in two colonies and the existing
  open renewal arrangement for matched comparisons. Do not buy throughput with a coarser
  field, slower model clock, fewer organisms or disabled observations.
- Keep local floors, activity masks, bounded support, compiled coefficients and separate
  material/geographic cache lifetimes. No dense species-pair loops or per-tick recompilation.
- History, save retention, terrain/sunlight expansion, differentiated energy yields, new
  enzyme genes, genome topology and optional ecological mechanisms are outside this correction.
  No new tuning controls without a named independent mechanism and measured need.

The [principles](docs/principles.md) and
[computational foundation](docs/design/chemistry/computational-foundation.md) govern choices.
Design documents express intended behavior; historical formulas are not immutable specifications.

## Contract and decisions

### Settled direction

Use the existing data shapes to express five shared operations, without introducing a generic
solver or another runtime framework:

1. Owned nonnegative mixtures and linear property projections.
2. Geographic vector geometry, chemical distance/boundaries, and separately named interaction
   features with the existing signed pairing.
3. Bounded maps compiled to sparse conservative products: `Δn = (P - I) r`, with accepted
   donor amounts `r` and unit-sum nonnegative product columns `P`.
4. Requested rates followed by frozen donor, capacity and work allocation.
5. Explicit material transfer and reference/work accounts, including dissipation and numerical loss.

Correct the geographic limiter with a Euclidean magnitude; preserve its zero response,
small-force behavior and bounded maximum. Reuse that correction for cells and sources.
Use Euclidean chemical distance for comparable two-coordinate changes. Transform recognition
centers, offsets, property tables and operator columns together in representation checks.
Do not require a fixed nonuniform chemical landscape to be invariant under moving only an enzyme.

### Recommended choices to resolve in M0

These are bounded engineering decisions, not missing user approvals. M0 records selected
equations, units, limiting cases and cost estimates before their dependent implementation.

| Choice | Recommendation and reason | Evidence trigger / affected milestone |
| --- | --- | --- |
| Coincident contacts | Use existing embodied geometry for a rotation-covariant, permutation-consistent separation rule. When no oriented distinction exists, explicitly handle that degeneracy; do not invent a global direction or require impossible deterministic symmetry breaking. | Exact overlap, near-overlap continuity, swapped cells and rotated headings; M1. |
| Chemical edge meaning | Keep a finite set of distinct chemicals and an explicit bounded product projection. Distinguish affinity to an existing species from the multiplicity of attempted mapped steps. Specify whether weathering aggregates duplicate destinations with multiplicity or unique-edge weight. Do not normalize all kernels merely to equalize corner totals. | Interior/edge/corner mixtures, product continuity, conservative weights and rate budgets; M2. |
| Product-map cost | Prefer a cost derived from the compiled transformation's chemical geometry over an unexplained penalty on its encoding. Distinguish equivalent whole maps from two maps agreeing on one substrate. Evaluate per-conversion displacement versus a recognition-weighted whole-map measure; choose the smallest consistent compiled form. | Same-product counterexample, full-map equivalence, zero/tiny offsets, boundaries and compiler cost; M2. |
| Enzyme refit distance | Apply the chemical metric separately to recognition-center change and product-map change, with a stated combination rule. Reuse existing scales where meaningful; avoid a new tuning constant for every slot. | Equal-distance rotations, paid interpolation, partial/completed refits and stock scaling; M2/M3. |
| Reaction funding | Restrict work-budget throttling to work-consuming requests. Keep all requests subject to shared frozen material donors; fresh products and newly captured work cannot fund the same event. This removes an unfunded uphill request's veto over productive reactions. | Mixed uphill/downhill, zero work, shared substrates, slot permutation and closed accounts; M3. |
| Refit funding | Let each funded slot's distance and stock determine its requested progress, then allocate shared available work without first-slot priority. Avoid one distant target throttling unrelated slots unless a common activity budget has an explicit mechanism. | One distant slot, zero-stock slots, resource scarcity, ordering and equal-cost controls; M3. |
| Vector mutation | Extend the same heavy-tail magnitude principle to geometric parameter groups using direction sampling consistent with their metric. Treat scalar neural/body parameters as scalar instances. Preserve separate justified rate/scale constants and existing funded inheritance. | Derive event units, median/tail magnitude and expected change frequency before sampling; M4. |

A different technical selection must preserve the intended outcome and record its evidence here.
M0 cannot close with these choices silently deferred to ad hoc coding. No enzyme rotation gene,
new chemical topology or thermodynamic reconstruction is needed to settle them.

### Intentional asymmetry and explicit carryover

Independent chemical properties, membrane shielding of bound material, open source renewal,
directional sensing, forward swimming, irreversible work losses, finite storage and authored
founder alleles retain their existing purposes. Their definitions and consumers must agree;
they need not become identical or reversible.

Square-grid/finite-footprint geometry and numerical floors provide approximate continuous
symmetry. Tests must distinguish that error from an extra scalar axis penalty. Optional diploid
averaging/one-point linkage and optional multi-contact transfer have representation/order
limitations; document them and preserve default clonal fission and disabled transfer. Changing
those optional biological mechanisms is deferred. Hard population/ancestry stopping limits and
RNG draw assignment also do not promise identical trajectories under arbitrary execution order.

The neutral zero-stock gene plateau and exponential core scaling remain stated phenotype priors;
changing them would be an additional evolutionary mechanism. A common intrinsic work landscape
does not establish waste use or a food web. The differentiated-yield hypothesis remains open.

## Reuse and integration map

| Owner / consumer | Required work or retained boundary |
| --- | --- |
| `movement.rs`, `source_medium.rs` | Shared geographic response and contact correction; retain local profile/gradient inputs. |
| `chemistry.rs`, `chemical_products.rs`, `chemical_operators.rs`, `weathering.rs` | Common metric/boundary semantics and compiled recognition, map and kinetic coefficients. |
| `refitting.rs`, `metabolism.rs`, `accounting.rs` | Funded progress and reaction allocation; keep frozen owners and explicit expenses. |
| `genetics/mutation.rs`, `genetics.rs`, `controller.rs` | Common mutation law with geometric grouping; scalar behavior, inheritance and RNG continuation remain coherent. |
| `field.rs`, `field_vector.rs`, `climate.rs`, `transport.rs` | Retain shared reductions, sparse commitment and donor allocation; integrate only coefficients/rules selected above. |
| `world.rs`, validation, checkpoint codecs and frontend readers | Ordinary execution consumes the corrected operators; version changed rule semantics and reject incompatible continuation. |
| Chemical atlas, inspection, economy calculation and existing harness | Read the same compiler/rates/definitions as live physics; no stale duplicate formula or parallel observability pipeline. |
| Existing tests, `engine/examples/symmetry_audit.rs`, bounded harness and ledger | Reuse audit counterexamples, mechanics fixtures, causal probes and capacity measurements. |

## Milestones and Sulion mapping

M0–M5 are complete; M6 retains human review. IDs map document M0
to CLI position 1, not position 0. Execution expansions and their step IDs follow below.

| Milestone | Sulion phase ID |
| --- | --- |
| M0 — Shared transformation contract | `75d71c2b-3ea2-4a86-b11a-882e8ab97103` |
| M1 — Geographic covariance | `33345ee7-9ba9-4f3f-a757-2f7a1211c118` |
| M2 — Chemical geometry and transformations | `8b580cfb-3871-40a6-a2d9-ab4e6e1f89c4` |
| M3 — Shared resource allocation | `8b554244-72d4-4503-88b5-d51168a7b946` |
| M4 — Mutation geometry | `9bca7474-6535-43db-995a-ab66eebed573` |
| M5 — Runtime and operating limits | `acfda362-7b88-44b8-a1ca-b24a05375efc` |
| M6 — Documentation and human handoff | `61d81f48-a3ed-479b-9820-4e5781913c7d` |

### M0 — Select the shared transformation contract

Scope: resolve the table above as one equation/owner/update-order contract. Distinguish chemical
geometry from interaction-feature space and geographical space. Identify static compiler work,
live reductions, cache invalidations, parameter units, sparse bounds and numerical error limits.
Archive the unchanged executable/configuration and capture matched performance before changing laws.

Acceptance: every audit finding has an implementation owner or an explicit retention/deferment
reason. Selected equations and costs are concrete enough to implement, including contact
degeneracy, duplicate chemical destinations, refit work and mutation event units. Baseline
measurement and short-check registrations exist; no formulas are chosen by population outcome.

Evidence: audit counterexamples, source-level dependency review, analytical resource/cost budgets,
and bounded baseline cases. Use existing valid evidence rather than repeating the audit campaign.

### M1 — Correct geographic covariance

[depends on M0]

Scope: apply the shared Euclidean passive limiter to ordinary cells and reservoirs, and correct
coincident-contact direction handling without changing paid motor work or geographic stencil width.

Acceptance: isolated force response rotates with its input at arbitrary angles, with identical
speed for equal force norms; zero/large-force limits hold. Contacts have the selected frame/order
behavior, preserve paired displacement accounting and do not use a fixed world-X fallback.
Isolated body/source deposition still creates no self-propulsion.

Evidence: direct production-operator cases, square-grid transformed worlds with error tolerance,
and short local motion checks. Continuous grid symmetry is not claimed from algebra alone.

### M2 — Unify chemical geometry and compiled transformations

[depends on M0]

Scope: implement the selected metric, edge/support and transformation-cost semantics in the
existing compiler and consumers. Refit recognition and product-map changes in that metric.
Make multiplicity, normalization and cost explicit across recognition, products and weathering.
Keep at most four product weights per unary substrate and existing local recognition support.

Acceptance: equal chemical changes have consistent geometric cost under valid frame changes;
boundaries have predictable support and continuous product weights. Whole-map equivalence and
composition obey the selected contract. Unit-sum products, zero/tiny-map limits, unchanged-slot
sharing and dependency-local recompilation hold. Ordinary World, atlas and economy use the same
compiled meaning; documenting existing contradictions alone does not complete this milestone.

Evidence: transformed chemical tables/maps, interior/edge/corner counterexamples, dense references
only in bounded tests, finite work cycles and compiler cost/cache checks.

### M3 — Align shared resource allocation

[depends on M2]

Scope: implement the selected reaction funding and per-slot refitting requests with a common
frozen-budget principle. Preserve transport's working shared-donor allocation and body reserves.

Acceptance: an unavailable uphill work request does not veto a funded downhill opportunity;
neither reaction consumes newly made material/work in the same event. Refit slots progress
according to their funded requests rather than an unexplained farthest-slot veto. Scarcity is
allocated without array/slot priority; material, energy, capacity and installed identity remain valid.

Evidence: zero/limited/ample-work cases, shared-substrate competition, permuted slots/cells,
mixed requests, zero-stock machinery, fractional/completed refits and exact accounted transfers.

### M4 — Align mutation with chemical geometry

[depends on M2]

Scope: apply the common heavy-tail magnitude law to geometric groups with metric-consistent
directions. Preserve scalar neural/body behavior unless the shared implementation requires an
equivalent representation change. Do not add small/large mutation classes or separate boutique laws.

Acceptance: declare whether rate counts coordinates or geometric groups and derive their mapping.
Measure changed groups and coordinates per birth, pre-boundary norm quantiles/tail probabilities,
and realized post-reflection changes separately. Compare to the corrected v20 baseline so a grouping
change cannot silently collapse physical mutation frequency or typical magnitude. Interior proposals
have no preferred chemical axis; boundary effects follow M2. Parent immutability, paid refitting,
inherited installed stock and deterministic save/restore hold.

Evidence: bounded distribution draws and diagnostic births, including zero rate, extreme draws,
unit rescaling and angle bins. Derive calibration from the selected event/magnitude semantics,
not a random formula or an ecological parameter sweep. No long evolution run is required here.

### M5 — Verify complete runtime and operating limits

[depends on M1, M2, M3, M4]

Scope: confirm ordinary live consumers, analytical economy, display observations and continuation
all use the corrected rules. Version incompatible physical/RNG semantics as they change; audit
every reader and derived cache. Update owners alongside each earlier milestone, not only at the end.
Never restore v20 under changed rules through an adapter for a supposedly matched comparison:
use the archived baseline executable and matched initial conditions in each schema.

Acceptance: complete-runtime accounting, ownership guards, restore and continued stepping pass.
Measured same-resolution performance preserves current headroom; at least 30 ticks/second remains
the operating minimum, not permission to regress a workload already running in the hundreds.
Explain per-stage changes, compiler/refit cost, sparse work and memory; full saturation remains an
explicit stress limit rather than a reason to lower resolution. Short assays establish selected
mechanisms and viable resource-funded behavior without requiring a chosen evolutionary outcome.

Evidence: existing capacity loads, identical default startup controls, audit/probe extensions,
supported-schema checkpoint replay, bounded reduced observations and complete `make ci`.
Measure warm steady state and changed installed operators, not only a cached mathematical core.

### M6 — Reconcile documentation and review motion

[depends on M5]

Scope: reconcile runtime, body/inheritance and chemical contracts, work order, controls, schema
versions and evidence links. State every retained asymmetry and unresolved ecological hypothesis.
Check ordinary startup and registered operational rendering/recovery on the existing server in
an isolated session. Prepare the corrected world for human review without changing the founder.

Acceptance: final CI and scoped review pass; user reviews actual motion and activity placement.
Keep human acceptance pending until supplied; earlier v18/v20 visual approval is not approval of
changed motion. Record operational limits separately from that review. Preserve earlier ecology
handoff obligations and reconcile overlapping records from their actual evidence when appropriate.
Commit, push and deployment require a later instruction; they are not hidden closeout steps.

## Bounded evidence and performance policy

Finalize exact cases and commands before execution in M0; these are ceilings, not a quota to fill.
No simulations run while preparing this plan.

- Direct algebra/compiled-operator checks: seconds, zero World ticks. Reuse the audit example.
- Distribution checks: at most 100,000 draws per declared case and a small fixed diagnostic-birth
  fixture. These measure the law, not selection or evolved diversity.
- Mechanism probes: at most twelve 300-tick single-cell/cell-free cases. Declare mutation,
  learning and transfer settings; normally freeze all three to isolate the changed mechanism.
- Conditional biological follow-ups: only when a probe leaves a decision-relevant question;
  at most two paired comparisons with swapped placements, four cases capped at 1,500 ticks each.
  Diagnostic RNNs use ordinary inference. Funded stocks and genetic targets are recorded separately.
- Matched runtime measurements: unchanged and final default 600-tick startup, plus existing
  48-cell, 2,000-cell and 2,000-cell-growth capacity loads in each arm. Reuse their declared
  warm-up/measurement windows; target 10 warm-up + 100 measured ticks with 60 seconds per case.
- Total ceiling: 15,000 World ticks and 30 minutes of headless experiment execution, excluding
  builds/CI. A mechanism case has a 120-second wall cap. Stop on ecological termination,
  invalid accounts, resource limits or declared horizon; preserve incomplete/negative results.
- Keep detailed artifacts local through the existing harness/ledger; at most 1 GiB total new
  experiment output. Prefer initial/final checkpoints and bounded traces. Store exact binary,
  configuration, revision and termination reason. No repeated full-population frame dumps.
- Compare mean and window/stage timing at the same model time and workload. Investigate a
  repeatable >10% matched slowdown before acceptance; rerun only an ambiguous timing pair,
  at most once within the total budget. Passing 30 ticks/s does not waive a large relative loss.
  If a tradeoff cannot be removed, report it explicitly rather than silently weakening the gate.
- Register browser purpose and a short operational cap separately; use the existing server only.
  Human observation and browser operational evidence cannot be replaced by native timing.

Do not extend horizons or add seeds to obtain waste use, diversity, survival or a preferred
population size. This plan contains no automatic 50k/100k/overnight campaign. A later evolutionary
question needs its own hypothesis and authorization. Small useful calculations precede testing;
performance optimizations must preserve the selected rules and their meaningful thresholds.

## Current state and next action

The selected changes execute in the ordinary v21 World. M0–M5 are complete; execution records
below retain the unchanged baseline and measured outcomes. M6's live contracts and isolated
browser checks are complete. Human motion acceptance remains pending. Existing uncommitted
audit and bound-material study files retain their original scope and evidence.

## M0 execution — selected laws and baseline registration

Expansion `3fd4b791-a9a8-4516-bcf6-ede769be1b3b`:
1. Select equations/budgets (`6119c09c-b8b9-4870-b402-5c7211c6571b`). Review live owners,
   specify the deltas below and retain the audit's bounded counterexamples.
2. Archive/measure baseline (`a6f7a15c-77fb-4cf3-9cb0-41c2124b4750`). Build unchanged v20,
   run existing capacity and 600-tick startup commands into new symmetry artifact directories.
   They retain executable hashes, checkpoints/configuration, ledger rows and stopping reasons.

Selected implementation:

- Geographic response: `v = drift * mobility * f / (1 + hypot(fx,fy))`. At coincident
  centers use the normalized difference of heading vectors; swapping cells reverses it.
  Identical heading vectors provide no distinguishing direction: use zero correction there.
  Noncoincident contacts retain their geometric separation rule. This singular tie rule cannot
  be continuous for every direction of approach; tests state that limit rather than invent it.
- Chemical affinity remains a radial kernel over distinct existing species, truncated at the
  finite domain. Products retain conservative reflected interpolation. Weathering treats each
  distinct adjacent destination once at weight 1/4; duplicate reflected directions carry zero
  additional rate. No corner normalization or chemical torus.
- Compiled per-conversion attenuation: `1/(1 + sum_t P[t,s] * ||p_t-p_s||² / R²)`, using the
  existing recognition radius R. Recognition and product engagement remain binding quantities;
  attenuation multiplies the compiled catalytic request coefficient, not occupancy. This prices
  actual discrete product displacement, including interpolation spread, once at compilation.
- Refit edit distance: Euclidean center distance for targets; for enzymes, the sum of Euclidean
  recognition-center and offset-vector edit distances. They are two distinct two-coordinate
  edits in the same units. This prices the continuous installed-parameter path, not a promise
  that two different paths with equal endpoints cost nothing. Conversion kinetics instead price
  the compiled product geometry. No additional scale parameter.
- Each funded refit slot requests fraction `min(1, dt*0.25/distance)`. Its work request is
  fraction * distance * stock * constructionEnergy. One proportional fraction of available
  surplus funds these requests. Zero-stock slots can reach their target without granting stock.
  Reuse target compiled slots as soon as each slot reaches its target.
- Reactions reserve frozen available work for negative-work conversions first, scaling only
  those requests. Then allocate each frozen substrate proportionally across the funded requests.
  No productive request is suppressed by an unfunded request's reservation; products and new
  work cannot fund this event. Allocation may leave unused reserved work rather than iterate.
- Scalar mutation is unchanged. A two-coordinate geometric group has two Bernoulli opportunities
  at existing rate p: event count is Binomial(2,p), group hit probability `2p-p²`, expected
  event count `2p`. Each event uses the existing heavy-tail absolute magnitude and an independent
  uniform angle. Reflection uses the existing stable bounded calculation per component. This
  preserves mutation opportunities and the single-event norm median/tail without selecting axes.
  Realized changed-coordinate counts increase because a vector event usually changes both;
  report that explicitly, separately from event frequency. No normalized-range rescaling.

Static work stays in the compiler: at most four product-distance contributions per conversion.
Live catalytic loops gain no square roots; refits add bounded norms only when targets differ.
Geographic drift adds one hypot per moving owner. Vector direction sampling runs only on selected
birth-local mutation events. No new field arrays, public tuning controls or stencil expansion.

Baseline commands from frontend: `pnpm harness bacteria-capacity --output
harness/artifacts/symmetry-v21-baseline-capacity` and `pnpm exec tsx harness/numerical/startup.ts
harness/artifacts/symmetry-v21-baseline-startup 600 on MATHEMATICAL-SYMMETRY-PLAN.md`.
Question: do the corrections preserve full-runtime headroom at matched settings? Both arms use
the same commands/fixtures, with final outputs in distinct directories. Capacity includes ordinary
observation/render preparation and storage replay; startup includes its existing bounded 20-tick
cell traces. No new full-field or private-population trace pipeline is added. Stop at existing
60/120-second caps. The six capacity cases plus two startups consume 1,860 principal ticks;
storage replay adds its existing short continuation checks, within the 15,000-tick total ceiling.

M0 complete: archived v20 WASM SHA256
`739783242a19ac655b69ad2f542af981cc3aeca59916bb7e6edd0a66bfe36a79`.
Ledger 4006–4008: saturated capacity 43.58 / 21.02 / 15.88 ticks/s for 48 / 2,000 /
2,000-growth; all 100 measured ticks and continuation equality pass. Ledger 4009: ordinary
600-tick startup completes in 1.462 s (410.36 ticks/s), 76 cells and 74 divisions. Saturated
loads already miss 30 ticks/s; this is a baseline limitation, not a new regression or evidence
that ordinary startup is slow. Baseline artifacts are in the two registered local directories.

## M1 execution

Expansion `44e22a1a-8292-4786-927a-a18f5e0715ac`, step
`006abd71-acad-48e4-af3a-4433bb1b6a69`: update `movement.rs` with the selected limiter/contact
law, version physical semantics to v21 in all readers, and add frame/order regression checks
through production movement. Verify zero/large force, multiple angles, coincident and identical
headings, unchanged motor accounts and existing self-force tests. No schema adapter is added.

M1 complete: two new frame/contact checks and existing isolated body/source checks pass.
CI first exposed the Python report reader's old version allowlist; coordinated v21 header,
runtime reader and report-consumer checks now pass full CI (106 Rust, 60 Vitest).

## M2 execution

Expansion `f4d782fe-c79f-4bf4-b8a8-91298cb9241f`, step
`3c8f1944-2605-4256-a0d6-4b884af2b862`: add the shared chemical squared distance; use it for
affinity, compiled per-conversion catalytic weights and Euclidean refit edits. Remove enzyme-wide
encoded-offset attenuation from live metabolism/economy and expose catalytic weights in the atlas.
Deduplicate weathering edges without widening support. Verify reflected equivalent conversions,
independent dense product geometry, edge/corner weights, transformed maps, refit work and compiler
sharing; update the executable audit example while retaining its archived v20 output.

M2 complete: full CI passes 109 Rust/60 Vitest. New direct-operator evidence in
`docs/evidence/digital-chemistry/symmetry-v21/operators.json` reports equal axis/diagonal speed
0.5, equal unit refit distance, and equal reflected-conversion attenuation 0.9. Chemical
quarter-turn errors remain zero; material/reference accounts retain rounding-level error.

## M3 execution

Expansion `7aa4d4bd-fa9c-4fd2-a8b5-29cc5e45bfc8`, step
`c75bca15-ce35-48c0-9c08-765addedcbe8`: reorder existing reaction passes to fund consuming
requests before frozen-donor allocation; profitable requests do not use the work fraction.
Compute independent per-slot refit requests and share surplus work proportionally. Borrow a
completed slot from the target compiler even when another slot remains partial. Verify mixed
uphill/downhill scarcity, no same-event funding, slots reordered, distant refit independence,
paid reserves, zero-stock cases and per-species/reference accounts through production operators.

M3 complete: full CI passes 111 Rust/60 Vitest tests. Zero-work downhill conversion,
funded uphill bounds, frozen donors and individually completed compiler-slot reuse pass.

## M4 execution

Expansion `0e2e05cc-0419-46b2-bb41-126efe26fe2a`, step
`2c1ca89e-bcd6-4a65-8d38-5553bb078c6b`: group the 17 chemical coordinate pairs into
isotropic vector events under the selected Binomial(2,p) law. Retain the 15 scalar body
loci and all neural mutation unchanged. At default p=0.1, expected physical events remain
4.9 per birth; expected changed coordinates become approximately 7.96 rather than 4.9.
Verify event frequency separately from changed coordinates, single-event median/tails,
rotation away from boundaries, square-boundary reflection, deterministic inheritance and
funded stock. Sampling uses at most 100,000 independent law draws per check and advances
no simulation ticks. Existing birth and checkpoint tests cover live integration.

M4 complete: 115 Rust/60 Vitest tests pass. In 100,000 pair draws there are 19,977 events
and 18,994 hit groups, against 20,000 and 19,000 expected. Single-event norm is below its
0.08094 median in 50,209 draws; 2,685 exceed 3 units (2,627 expected). Eight angle bins
contain 12,315–12,620 each. In 10,000 machinery mutations, 6.404 chemical coordinates
change per birth, against 6.46 expected. Scalar opportunity checks remain unchanged.
Among changed groups at the interior, realized median norm is 0.08515 versus v20 0.08590;
90th percentile is 0.78562 versus 0.77692. At a corner and an edge, new medians are
0.08539/0.08535 versus old 0.08599/0.08593. Reflection is measured separately from
unbounded proposals; no mutation-frequency or typical-magnitude collapse occurs.

## M5 execution

Expansion `2e0cdc2b-813e-469a-957c-9560b3802b16`, step
`337af0c0-70fb-49b1-a095-ee9aec4cd290`.

Run the registered final capacity/startup commands against the v21 WASM after full CI.
Archive each binary and both endpoint states; compare timing stages, active chemical groups,
accounts, work-funded births, memory and exact continuation. Existing production-operator
tests already isolate motion, chemical mapping, scarcity and refits, so no additional
population contest is justified. Compute the existing zero-tick economy report first;
its fixed-mixture processing values are conditional rates, not a frozen-work allocator or
prediction of evolved behavior. The 600-tick default startup then checks expressed uptake,
construction and division with ordinary mutation/learning active.

M5 complete: ledger 4010–4012 capacity results are 43.08/20.62/15.89 ticks/s against
43.58/21.02/15.88, with all continuations exact. Ordinary startup (ledger4013) completes
600 ticks in 1.505 s (398.54 ticks/s versus 410.36), with 86 living cells, 80 divisions,
377.63 imported material and 222.26 constructed stock. Material/work residuals are
4.86e-9/3.62e-8. Refit work is 5.402; changed installation and birth compilation are exercised.
Zero-tick economy cases at newborn stock/concentration0.03 have positive conditional
processing surplus for either raw input (0.01781/0.01447 per model second). Those conditional
rates motivate the startup check; they do not establish a general strategic advantage.

Capacity step time changes by +1.2%/+1.9%/-0.05%; rendering preparation is
44.91/51.26/58.30 ms per 100 ticks versus44.80/50.49/56.98. Initial loads/settings match,
but changed laws produce different endpoint populations (46/1956/888 versus48/1979/948),
so timings are complete-trajectory comparisons, not identical per-cell microbenchmarks.
The economy example's release compilation overlapped the capacity pass; no unexplained
>10% slowdown appears and no timing rerun is justified. Startup ran after compilation finished.
Peak WASM allocations are332.1/598.3/849.6 MB versus331.2/595.5/812.9; largest increase4.5%.
This is allocator high-water usage including storage replay, not retained live-state size.
Conversion rows now retain one catalytic coefficient; no new field allocation or stencil exists.
Saturated2,000-cell fixtures remain below30ticks/s. Do not claim the intended whole-browser
minimum under saturation, or long-run endurance, from these results.

## M6 execution

Expansion `a1ca189a-3715-494c-a115-25bb36809995`: reconcile contracts and operation
(`bcf4f4b8-bce9-44ed-a38f-684e5b4d4a5a`), then human motion review
(`f8edceac-a059-4cd4-a5d4-f5966790ee1b`). Update current runtime/body/installation/schema
owners, work order and agent guide; preserve historical measurements under their original laws.

Browser registration: run `harness/numerical/browserApplication.mjs` with `ANTROPY_FAULTS=1`
against the existing `http://localhost:26000/`, using cached Chromium1234 and a new isolated
temporary profile. Output: `harness/artifacts/symmetry-v21-browser`. Existing runner stops
ordinary advancement at its first sample at/after300ticks or30seconds; outer cap180seconds.
Purpose: verify actual v21 binary/start-paused configuration, React/worker/WebGL2 operation,
inspection, IndexedDB save/recovery, graphics-loss export/restoration and visible worker failure.
No rendering bypass, separate server or user's browser storage is used. This short software-GPU
check establishes neither human motion approval nor endurance. Prior ecology handoff obligations
remain in their existing plans and are not automatically closed by this check.

Browser operational check passes: physical v21 initializes paused at tick0 with48 founders;
the archived binary's embedded source digest matches the worker. It reaches tick416 with68
cells, 26 rendered frames, zero skipped frames and no ordinary errors. Active observation windows
measure307/350ticks/s under software WebGL2. Manual save takes241ms; graphics-loss export is
844,445bytes, recovery returns exactly tick416 and injected worker failure leaves a visible
error and available runtime report. Source digest:
`202e223c8dfafd5235b038d58a7d2245b4089fba91bccedeee97c91406a73539`;
WASM SHA256: `01d0573e28de08af73e2357e69734a883890060af59a08b76ff8547b316b76ca`.
Screenshot inspection shows chemical fields, cells, source outlines and inspector panels;
a still image cannot certify motion. Human acceptance remains pending.

The two startups, six capacity cases and browser check use fewer than2,500 principal World
ticks including short storage continuations, below15,000. New local artifact directories total
about707MiB, below1GiB. No population contests, seed sweep or long campaign ran. Existing
operator, owner, inheritance and full-runtime tests supply the bounded mechanism evidence.

Final validation: `make ci` passes115 Rust and60 Vitest tests, formatting, Clippy, TypeScript,
documentation links and Terraform formatting. ESLint retains13 pre-existing warnings and no
errors. `git diff --check` passes. No publication was performed. The remaining M6 gate is the
user's assessment of actual motion/activity placement on a fresh v21 run; the repository's
human-review rule prevents claiming that assessment from test results or the screenshot.
