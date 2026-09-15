# Integrated digital chemistry — Implementation Plan

Preserve Antropy as a spatial artificial-life experiment in which individual genome/RNN cells
live through a common digital chemistry. Implement a coherent physical system that makes
diverse ecological relationships and evolutionary adaptation plausible, then support the user's
days or weeks of continuing observation. Development establishes physical opportunities and
operational readiness through analysis and small causal tests. The population's eventual
discoveries, community composition and history remain open.

This root file is the source of truth for the feature's direction, scope and milestones.
It records the integrated proposal and the user's September 15, 2026 clarification that the
mathematics must be designed for computable manifold-based composition.
The requested detailed direction is retained here even though individual milestone expansion
belongs to `plan-phase`. Existing runtime documentation continues to describe its own version
until implementation reconciles it. This document is a plan, not an implementation report.

Feature workflow: `~/.claude/skills/feature-start/SKILL.md`, followed by
`~/.claude/skills/plan-phase/SKILL.md` when an individual milestone is authorized for execution.
Canonical verification: `make ci` from the repository root.
Governing computational foundation: [Computable chemistry](docs/design/chemistry/computational-foundation.md).
[ADR 0022](docs/adr/0022-computable-chemistry.md) amends [ADR 0021](docs/adr/0021-integrated-digital-chemistry.md).
The current direction and milestone outcomes below govern. M0 formulas and the canceled M2
expansion are reference records; their numerical prescriptions no longer constrain implementation.
Current work order: reopened M0's selected laws and M1's canonical compiler are implemented.
M1's additional composition correction implements CSR delivery, one-row field redistribution,
compiled engagement and dependency-based material/operator reuse. Full CI and source review pass.
Ordinary-world integration remains M2–M4. Earlier expansions remain version-specific evidence;
a passing timing allocation alone does not establish implementation of the intended architecture.

## Confirmed decisions

### Active implementation correction: compose operators through commitment

The user directs implementing the manifold-based computation discussed in retrieved turn
158241668 (session 01a09995-751c-7013-ae06-0abc4cd32c7e). This supersedes treating the prior
22 ms gate as completion of the computational direction. Earlier measurements remain evidence.
M1's correction runs under child `c9cd79c9-621f-479f-9bc7-b1ce9ec0eb69`.

The implementation operates on matrices C[N,256] and intracellular X[P,256], static manifold
coefficient rows, and a sparse geographic sampling matrix W[P,N] built from cell footprints.
Field signals are C times a small property basis plus W-transposed cell contributions.
Shared geographic differences produce bounded directional coefficients; chemical response is
a short vector operation through conservative diffusion-plus-drift commitment.

With C as amounts and A as node area, local delivery composes L=W*C/A, bounded signed
machinery requests R, K=positive(R)/L, D=W-transpose*K/A, donor availability
T=C/(A*max(1,D)), accepted imports=K*(W*T), and exports E=W-transpose*negative(R).
Here negative(R) means export magnitudes. Commit C*(1-min(D,1))+E once per geographic row. Zero L
gives zero K. Exports are unavailable to same-stage imports. Shared material/work constraints
remain; explicit field roundoff is booked at aggregate commitment, not hidden per-cell writes.
W is normalized and finite-range, with the same footprint for sampling and deposition.

Enzyme product occupancy is compiled as the pullback of recognition through its conservative
chemical map: o=a+F*a. Runtime occupancy is one weighted mixture reduction. Reuse canonical
maps for material redistribution, with donors/work frozen across slots; no product enumeration
is needed to reconstruct occupancy each physiology event. Installed changes rebuild these
static operators, while concentrations, stock, damage and energy remain live.

Material projection X times the shared response basis is separately owned from geographic
footprints. Movement rebuilds W geometry without re-projecting unchanged inventory/body/membrane.
The current core recomputes material after its explicit stock resets and after physiology/paid
installed changes, before the next physical use. Cold initialization is recorded separately;
all recurring invalidations stay in measured work. Radius and mass are part of that material
snapshot; position and geographic weights are not.

Execution state: operator v3 and atlas6 expose the compiled engagement pullback. The physical
transport applies one destination-row stencil with fused washout/admissibility, replacing
repeated face writes. Row commitment preserves explicit f32 roundoff; it does not promise the
same floating-point trajectory. CSR W and W-transpose share one geometry owner; field updates
commit once per touched row. Obsolete demand grids, per-cell field.add loops and the old face/
sampling primitive are removed. Chemistry v4/physical checkpoint v12 remain unchanged because
ordinary World is not yet switched to these kernels.

The first pair (ledger3803/3804) measures 7.249/17.134 ms. This is a modest improvement, not
resolution of the performance concern. Material projection was still rebuilt during every
geographic resampling. The second registered pair keeps the same workload and adds actual-state
projection reuse; report its material-projection count, cold cost and remaining stage costs.
No physics clock, cell count, chemical count or donor workload changes. Native 113 tests pass
before this final material-cache change. The release build caught a target-feature function
passed directly to array.map; wrapping that call resolved the compiler error.

The material-reuse pair (ledger3805/3806) records 7.270/16.632 ms. Source review then found
paid membrane changes recompiling unrelated receptor/transporter/enzyme maps. The same canonical
compiler will refresh only changed installed inputs, retaining unaffected operator allocations;
compare refresh with full compilation, including changed definition and invalid-input rejection.
One final identical workload pair measures this dependency correction. This changes neither laws
nor active work, and does not authorize a parameter sweep or horizon expansion.

Final pair ledger3807/3808 measures 7.165/15.728 ms mean, 7.307/15.811 ms worst 20-tick
windows, with maximum ticks 8.480/39.554 ms. All 256 channels, both populations, clocks,
physical extent and actual work are retained. The 2,000-cell workload still spends 7.474 ms
in spatial work and 7.164 ms in cellular work on average; this is not restored 200 ticks/s.
Material projection occurs 55 times per cell including cold setup over 110 ticks, rather than
once per geographic resampling. Final material/energy totals agree across the three composition
pairs; material reuse changes low-order numerical-error accumulation. Retained operator memory increases
for engagement rows; scratch decreases.
See [current evidence](docs/specs/digital-chemistry/validation.md#manifold-composition-correction).

1. Compose physical and chemical operators (`17f10d81-a5a4-40e1-ab65-476721bf6fec`, completed).
   Rework composed exchange/field/numeric/machinery and canonical operators. Add the required
   batch field-commit owner and module registration. Preserve all 256 IDs, fixed slots, local
   delivery and paid accounts. Baseline: preceding M1 full CI and saved cost pair. Independent
   donor/allocation and matrix-pullback checks supplement existing conservation/response tests.
2. Reconcile direct consumers and retained state (`30e73bb1-7233-40b0-b26b-33ab918ab65d`, completed).
   Update capacity, atlas/byte accounting and affected tests; retire displaced execution paths.
   Preserve ordinary-world/worker ownership until the separately specified live integration.
   Update current representation/numerics/validation and resume pointers to the actual result.
3. Verify implementation (`4455fd93-0495-4cf0-9cd8-7a264cc2690c`, completed). Run the same bounded
   release-WASM 48/2,000 dense-256 workload, .2/.8 clocks, 10+100 ticks, 60 s/case. Do not change
   activity, population, geography or model time to obtain a rate. Run make ci and review the
   actual algebra/owners. Measurements describe this implementation, not completion by threshold.

Closeout: `make ci` exited 0: 114 Rust and54 TypeScript tests, formatting, release Clippy,
TypeScript, docs and Terraform formatting pass; the13 existing frontend warnings remain.
The final release binary and both captured capacity/atlas binaries share SHA256
`2a8b3f9c83ff25df5a5a5b3a35be14a3a194f6fea5dbf246671930438bcb2a84`.
The atlas writer and existing Python reader generated all four local figure groups. Source
review against saved starting files confirms the changed algebra/owners and unchanged clocks,
workload, World stepping, genome and sharing boundary. Native patches made every authored edit;
the two final JSON records are copied generated evidence, with all three pairs kept in the ledger.
The child completes and returns to M1. Next work is M2's ordinary spatial integration, followed
by M3/M4's live machinery/expression retirement; this correction does not execute those milestones.

This correction implements the core computation and representation; it does not declare the
unfinished ordinary-world, evolutionary or browser integration complete. No dev server,
ecological campaign, branch in Git, publication or sharing-boundary change is authorized here.

### Retained feature decisions

1. Preserve the identity and function of discrete chemicals, individual cells, inherited
   machinery, genomes, local RNNs, funded reproduction and spatial interaction. Redesign data
   shapes, formulas and interfaces together where that produces a coherent system.
2. Design four connected responsibilities together: chemical costs/driving influences, medium
   transport, finite machinery engagement and transformation. Use the chemical manifold for
   composed reductions, shared fields and bounded mappings over common material state.
   Select computable discrete rules with consistent accounts; physics supplies conceptual
   language rather than required equations or a real-world fidelity target.
3. Retain 256 discrete chemical IDs on a smooth, bounded 16 × 16 manifold. Continuous machinery
   parameters operate on this discrete vocabulary. The geographic world is a separate periodic
   XY plane.
4. Retain small fixed heritable machinery arrays: initially four receptors, four transporters
   and four unary enzymes, plus membrane compatibility and funded investment. Evolving genome
   length is outside this implementation's scope.
5. Any internal chemical can become generic biomass through paid construction. Chemical
   identity persists in inventory and ends at assimilation. Actual material, usable energy and
   inherited construction instructions remain distinct.
6. Cells and chemicals both contribute to and respond to spatial interactions. Composition,
   membrane/interface state and material extent have physical consequences for transport and
   motion. The user's viscosity, gravity and polarity examples motivate this coupling; their
   names and particular formulas are illustrative rather than requirements.
7. Generate and validate chemical-space properties independently of organism success. Retain
   useful energetic differences, transport variation, differential stress and persistent
   high-resistance/low-diffusion possibilities.
8. Keep finite, uneven, localized resource opportunities and one slow first-order extracellular
   washout rate for all chemicals, with explicit external accounting. Large open or marginal
   spaces and variation in resource richness support geographical differentiation.
9. Retain the ordinary 48-founder workload and at least two separated starting colonies.
   Useful movement and genuine spatial extent provide the sense of scale. Geometry and rates
   remain revisable hypotheses; the stars/solar-systems analogy is not a layout specification.
10. Preserve local RNN decision-making, heritable physical variation, paid private learning,
    explicit birth-local assimilation, actual inherited bodies, damage and durable ancestry.
11. Preserve the immutable WASM/worker sharing boundary, legible genealogy and diagnostics,
    client-side recovery, and at least 30 ticks/second at the declared complete workload.
12. The implementer selects, derives, tests and tunes formulas, numerical resolution and
    parameters. Routine engineering choices are not user approval gates. Human motion review
    remains a real acceptance decision.
13. Prepare a continuing experiment using hypotheses and small proof points. Population count,
    colored clusters, founder dominance and a prescribed coexistence outcome are not acceptance
    criteria. A failed prediction remains negative.
14. Replace superseded executable laws and their consumers coherently. Historical experiments
    retain their questions, controls and evidence provenance; exact old outcomes and old-save
    compatibility are not required.
15. Make execution cost a formula-selection criterion. Preserve compact composition through
    the full update, not just field generation. Diffusion plus drift is the accepted direction;
    drift should be composed from shared directional fields and chemical response weights.
    Basis rank, functions, attributes and illustrative examples remain engineering choices.

## Integrated system direction

### Chemical identity and generated space

Each discrete element has a reference energy, baseline transport characteristics, environmental
resistance contribution, membrane-stress propensity and compact interaction profile. Smooth
deterministic functions over the manifold supply these properties. Neighboring elements have
related behavior and affinity, with reflected chemical-space boundaries.

Validate joint property coverage rather than marginal ranges alone. Include fast and slow
transport at both low and high resistance, meaningful high/low reference energies, differential
stress, and connected neighborhoods that permit persistent resistant material. Validate varied
interaction preferences and accessible transformation neighborhoods. Persist the complete
resolved chemistry definition and version.

Chemical profiles express intrinsic physical character. Food, waste, toxin, signal, barrier and
cross-feeding describe uses that organisms make of that character. Their meaning is relational.
World generation evaluates physical properties and connectivity without selecting organisms or
searching seeds for an ecological winner.

### Law 1: designed costs and driving influences

Define chemical properties and response weights through smooth functions on the 16×16 manifold.
Compose local mixture quantities through compact weighted reductions. Distinguish material,
spendable energy, stored interaction energy where used, constitutive rate signals and external
inputs/outputs. Define those meanings with the discrete update; a field named potential does
not automatically impose logarithmic thermodynamics.

One coherent accounting contract covers transport, processing, body construction, repair,
installed changes, movement and death. Closed sequences restoring the relevant state cannot
produce spendable work. External forcing and numerical error are explicit. Select affordable
discrete work/energy identities and operating bounds rather than assume a full-world functional
must be recomputed after every event. Replacing M0's protections requires explicit alternatives.

### Law 2: composed diffusion, drift and cellular response

Retain diffusion plus drift. The old conservative neighbor-exchange implementation is a useful
execution baseline. Project N×256 concentrations through small chemical property matrices;
add actual installed cell contributions; apply shared finite-range geographic operators; then
compose chemical drift as short weighted sums of shared directional vectors. Fuse this response
with local conservative redistribution where practical.

This is an architectural factorization, not a new exact formula. The chemical manifold supplies
relatedness, recognition and response; the separate geographic plane supplies direction and
local delivery. A mixture sum such as weighted impedance supplies a scalar field; a spatial
operator provides direction. Reuse compatible reductions across mechanisms without conflating
independent diffusion, stress, resistance and energy meanings.

Preserve all 256 material identities and tiny quantities. Shared effect fields summarize selected
influences, not the material inventory. Avoid rebuilding expensive species-wise nonlinear responses
after making the fields cheap. Count actual final-loop operations, temporary arrays and refreshes,
not only the nominal rank or matrix dimensions.

Cells both source and respond to the medium through actual composition, body extent and installed
membrane. Combine passive displacement and paid motor effort with defined self/contact behavior.
Material arriving at a cell remains limited by resolved local delivery and machinery capacity;
there is no remote inventory query or duplicate far-field capture ceiling.

### Law 3: finite engagement through manifold kernels

Four receptors, four transporters and four enzymes remain the initial fixed arrays. Heritable
coordinates select compact weighting kernels on chemical space. Receptors reduce local mixtures
into bounded stock-dependent signals. Transporters combine related weights with local supply,
internal conditions, installed capacity, effort and available work.

Finite engagement permits competing substrates/products and context-dependent performance.
Choose cheap normalization and feedback functions with the update, without requiring activities
to be exponentials of chemical potentials. A stored bound compound, if introduced, must have an
explicit owner; a weighting coefficient alone grants neither matter nor energy.

Keep recognition and response continuous enough for nearby mutations to change actual function
meaningfully. Broad coverage consumes funded machinery; do not install a separate specialist
bonus or claim that saturation alone guarantees niches.

### Law 4: bounded transformations on chemical space

Unary enzymes map recognized substrates through bounded inherited coordinate transformations to
weighted discrete products. Conservation and smooth reachable variation govern those mappings.
Reuse M1's reflected products and installed-cache ownership where appropriate; its exact reciprocal
channel expansion and charge interpretation remain revisable.

Compile definition/installed-only coefficients, support and product mappings. Combine them with
live substrate/product conditions, damage, funded capacity and work through short vector or
stencil operations. Products and opposing flows can affect processing without an exponential
detailed-balance requirement. Shared requests allocate actual donors and work simultaneously.

Transformation distance, intermediate handling and machinery investment should support
context-dependent pathway costs. Select and calculate these functions as artificial rules;
M0's exponential barrier and numerical direct/staged ratios are reference examples, not required
behavior. Test conditional benefits and counterexamples rather than impose a mandatory chain.

### Embodied cells, control and evolutionary accessibility

A cell owns internal chemical inventory, usable energy, actual built stocks, installed machinery,
damage, inherited instructions and private recurrent state. The genome specifies construction and
capability; the RNN regulates available physical actions from local observations. Controller
channels and codecs can change to serve these semantics coherently.

Any internal chemical can fund generic body material through paid assembly. Define affordable accounting for body
energy and work needed to assimilate different initial material states. On death, release internal
species and body-derived material locally; ordinary transport determines which neighbor captures it.

Retain an explicit injury law using chemical stress propensity, exposure and inherited membrane
compatibility, plus general paid repair. Address both external and internal exposure. Compatibility
has limited specificity; it does not grant universal resistance. Machinery interference and
physical exclusion have their own measured consequences. Energy constraints do not determine all
injury-rate constants.

Local observations include receptor levels, temporal changes, body-relative spatial differences,
body condition, contact and private state. Controllers receive no geographic coordinates, compass,
destinations, ancestry, property-table oracle or reproductive score. RNN-selected efforts are
limited by physics. Physiological viability is not a hidden fallback controller.

Small mutations must be meaningful throughout decoding, installed function and the life cycle.
Keep inherited targets distinct from installed machinery. Use gradual paid remodeling with a
bounded state representation and material recycling; retain useful operation during transition.
Birth divides actual stocks and transmits instructions. It grants neither free replacement
machinery nor a reset of damage or energetic obligations. Test nearby variants as actual offspring.

Preserve immutable registered genomes, separate environmental/body/genetic random streams,
private learning and explicit birth-local inheritance. Optional genetic transfer uses the same
funded expression/remodeling path. Existing reproductive options retain their documented function.

### Spatial resource economy

Keep finite localized sources with uneven richness, spatial extent, mixtures and replenishment.
Source inventories and release limits are explicit. Initial colonies occupy at least two separated
opportunities; many other opportunities begin unoccupied. Use the ordinary 48-founder configuration
for startup verification. These are founder organisms, not prescribed enduring populations.

Use one slow first-order washout rate for all extracellular chemicals. Persist schedules and
account source/sink material and energetic effects. Resource geometry and rate selection must
preserve substantial open or marginal habitat, local depletion and meaningful colonization.

Calculate material delivery, recoverable work, machinery capacity, maintenance, assembly, repair
and movement budgets before running organisms. Include concentration-dependent interactions and
source renewal. Positive energetic content alone does not establish usable delivery. Continuous
release must not automatically overwhelm depletion or erase organism-produced chemistry.

Tune useful travel against patch spacing, transit reserves, growth times and field persistence.
Local accumulation can change resistance and resource retention. Environmental feedback can
change which inherited capabilities repay their costs, with the actual evolutionary outcome open.

### Numerical architecture, observation and durability

Retain one Rust kernel shared by browser and harness. Rust/WASM owns cells, inventories, genomes,
RNN state, fields and parentage. The same worker renders through OffscreenCanvas/WebGL2 using
borrowed WASM views. GPU uploads transfer to device memory; intermediate CPU frame copies and
JavaScript physical-state mirrors remain excluded.

Use compact shared-field projections, matrix reductions, compiled genotype operators and
conservative spatial exchanges. Budget for all 256 chemical channels being present. Preserve
low concentrations without allowing object count or per-tick historical work to grow without
bound. Separate physical and observation clocks only with measured causal fidelity.

The complete workload includes varied genomes, growth, division, mutation, learning, field
occupancy, rendering and diagnostics. Thirty ticks/second is the minimum at the declared operating
workload, with headroom as the engineering target. Report model time per wall second alongside
ticks; reducing founders, activity or timestep does not produce an acceptable performance result.
Measure memory bandwidth and stability/substep costs before committing to expensive field solves.

Keep ecosystem → local population → cell observation. Preserve chemical prevalence by ID and
properties, a usable atlas, meaningful physical overlays, actual exchange/reaction fluxes,
genotype versus installed machinery, genealogy, ancestry continuity and retained spatial history.
Distinguish motor-driven behavior from passive drift where the display implies agency.

React receives bounded, requested and revisioned observations with backpressure. Full snapshots
belong to explicit cold save/restore paths. Recovery and retained ancestry must support continuing
observation through bounded working memory and honest storage limits. Synthetic accumulated-history
and storage tests establish operational properties independently of ecological campaigns.

## Context / reuse map

Relevant current owners are the Rust engine in `engine/src/`, the worker and UI in
`frontend/src/engine/`, reusable experiments in `frontend/harness/`, and `Makefile` verification.
The working tree already contains a substantial uncommitted runtime revision. Planning preserves
that work; execution must re-inspect its baseline and avoid treating all existing changes as its own.

The feature-start source snapshot was reviewed on September 15, 2026, including parallel physical and
runtime/observation reviews under feature-start. `sulion-code` returned missing Rust symbols and
stale TypeScript paths; direct file reads verified the owners below. Recheck these bodies before
expanding their milestone. Later expansion source maps supersede changed implementation details
in this initial snapshot. No measured throughput or ecological result is inferred from a label.

| Owner and source | Verified current responsibility | Disposition for this feature |
| --- | --- | --- |
| [chemistry.rs](engine/src/chemistry.rs): `Chemistry`, `compile_affinity`, `product` | Smooth four-property generator, joint coverage, compact affinity and integer product offsets | Reuse topology/compiler pattern; extend validated profiles and replace product/rate encoding in M1/M3. |
| [field.rs](engine/src/field.rs): `Field` | Periodic sampling/deposition, conservative Fickian exchanges, impedance and washout | Reuse geometry and accounting interfaces; build coupled chemical-potential flux and field reductions in M2. |
| [numeric.rs](engine/src/numeric.rs) | Contiguous scalar/SIMD reductions and exchange | Extend kernels under one numerical law; measure layout/bandwidth and preserve controlled rounding. |
| [transport.rs](engine/src/transport.rs): `Work`, `exchange`, `diffusive_supply` | Shared import allocation, delayed exports, independent analytical delivery ceiling | Reuse simultaneous allocation; replace engagement and reconcile the near-cell boundary with explicit field transport in M2/M3. |
| [genetics.rs](engine/src/genetics.rs): `Genotype`, `Edge` | Immutable compiled genotype operators; cached constant reaction energy/heat | Retain genotype reuse; compile static manifold weights/mappings and derive live requests/costs from the selected discrete rules. |
| [metabolism.rs](engine/src/metabolism.rs): `react`, `assemble`, `develop` | Funded unary conversion, generic assembly, maintenance and repair | Integrate common activity, reaction kinetics and full material/work accounts in M3/M4. |
| [movement.rs](engine/src/movement.rs): `motor_limits`, `move_cells`, `resolve` | Paid motor power, drag, angular noise and overlap correction | Revise with cell/interface forces, mobility and consistent displacement work in M2/M4. |
| [organism.rs](engine/src/organism.rs), [lifecycle.rs](engine/src/lifecycle.rs), [refitting.rs](engine/src/refitting.rs) | Inventory contributes to volume; birth divides actual stocks; refitting is an atomic paid identity swap | Preserve funded lifecycle; add bounded gradual installed state and membrane remodeling in M4. |
| [sensing.rs](engine/src/sensing.rs), [controller.rs](engine/src/controller.rs) | Local chemistry/body readings, private RNN state and efforts | Retain local-control boundary; revise engagement, channels and installed-interface exposure consistently. |
| [sources.rs](engine/src/sources.rs), [world.rs](engine/src/world.rs) | Finite unequal sources, renewal gaps, zones/epochs, two-colony placement, multirate step | Reuse source/placement semantics; retune economy and revise field invalidation/update ordering. |
| [economy.rs](engine/src/economy.rs), [economy_report.rs](engine/src/economy_report.rs) | Static budget calculations and a zero-tick report with stated closure assumptions | Reuse reporting structure; replace linear/terminal-path approximations and expand interaction-aware budgets. |
| [abi.rs](engine/src/abi.rs), [client.ts](frontend/src/engine/client.ts), [worker.ts](frontend/src/engine/worker.ts), [renderer.ts](frontend/src/engine/renderer.ts) | Scalar stepping, synchronous borrowed render descriptors, same-worker GPU upload and frame backpressure | Reuse ownership as-is; extend packed presentation quantities in M6 without physical-array exports. |
| [observationPublisher.ts](frontend/src/engine/observationPublisher.ts), [observationBudget.ts](frontend/src/engine/observationBudget.ts) | One unacknowledged publication, reduced schemas and byte/tree budgets | Reuse bounded revision protocol; add explicit current-law diagnostics and replacements. |
| [ancestry.rs](engine/src/ancestry.rs), [session.ts](frontend/src/engine/session.ts), [coldOperations.ts](frontend/src/engine/coldOperations.ts) | Compact parentage, thinned charts, serialized bounded saves and failure handling | Extend exact state/history schemas and recalculate accumulated-state memory/storage envelopes in M6/M7. |
| [capacity.ts](frontend/harness/numerical/capacity.ts), [performance.ts](frontend/harness/numerical/performance.ts), [continuationCheck.ts](frontend/harness/lib/continuationCheck.ts) | Bounded load fixtures, render preparation and synthetic continuation checks | Reuse fixtures; add actual GPU/browser workload and model-time throughput to acceptance. |

New responsibilities are composed chemical/cellular response operators, consistent discrete
material/work accounts, conservative diffusion-plus-drift, finite funded kinetics and bounded
gradual installed-state remodeling. They belong inside the existing Rust kernel. Existing crate and
worker directories already provide their homes; no new crate, runtime or unregistered placeholder
module is needed to start this feature.

Verification entrypoints available for milestone expansion include `make ci`, `make build`,
`pnpm harness bacteria-capacity --output NEW_PATH`, `pnpm harness chemistry-performance`, and
`pnpm harness continuation-check`, with exact flags and declared budgets read from their current
CLI bodies before execution. The `resource-economy-check` command advances organisms; the
`economy_report::report` path is the static calculation. Do not confuse the two.

Source documents to read alongside current code:

- [Principles](docs/principles.md), [current design](docs/design/README.md), and
  [sparse spatial ecology](docs/design/spatial-ecology.md).
- [Original chemistry](docs/design/chemistry/sources/chemistry-proposal.txt) and
  [migration appendix](docs/design/chemistry/sources/migration-proposal.txt).
- [Current numerical architecture](docs/design/chemistry/numerical-engine.md),
  [installed machinery](docs/design/chemistry/installed-machinery.md), and
  [resource economy](docs/design/chemistry/resource-economy.md).
- [Immutable sharing contract](docs/design/chemistry/data-ownership.md),
  [diagnostic continuity](docs/design/chemistry/diagnostic-continuity.md), and
  [continuing observation](docs/continuing-observation.md).

### Architectural risks and required resolutions

| Risk established by current code | Required resolution | Owner |
| --- | --- | --- |
| New field/processing rules may create unaccounted work cycles | Select affordable accounting with the update; define stored versus constitutive fields and cover insertion, washout, transport, conversion, construction and death. | M0 selection; M2–M4 integration |
| `Edge` stores energy and heat as genotype constants | Compile immutable reaction topology and barriers; evaluate local driving forces from current material state. | M1, M3 |
| A separate `4*pi*r*D*c` supply cap overlaps explicit spatial delivery | Select one consistent near-cell exchange approximation and validate delivery without double-counting or suppressing attraction. | M0, M2, M3 |
| Integer products, atomic refitting and immediate inherited membrane susceptibility break continuity | Carry smooth product weights and paid installed interface/machinery state through mutation, exposure, birth and restore. | M1, M4, M6 |
| Contact, division and interface changes can bypass selected costs | Define self/contact behavior, paid actions and lifecycle accounts jointly with discrete field rules. | M0 selection; M2, M4 integration |
| M2's fitted transport and global verification exceed the runtime budget | Select composed discrete operators and bounds, verify their invariants and behavioral sensitivity, and measure cost before integration. | M0 core gate; M2–M4 integration; M7 complete gate |
| Independent phenotype/resistance/signature curves can recreate unrelated tuning knobs | Inventory all constants and derived quantities; reuse a physical relationship only where its roles agree and keep justified kinetic/injury assumptions explicit. | M0, M1, M5 |
| Headless timing excludes GPU work and does not express model time per wall time | Extend measurement to complete browser presentation/diagnostics with pinned timestep and active workload. | M6, M7 |
| Finite genealogy and storage bounds do not establish indefinite operation | Test accumulated-state peak memory, thinning, capacity exhaustion and recovery; publish the actual supported envelope. | M6, M7 |

## Historical feature-start record

- S0: Read README, AGENTS, CLAUDE, docs/ADR indexes and Makefile. Verification is `make ci`;
  release build is `make build`. The existing Rust/worker/harness boundaries are recorded above.
- S1: Two independent read-only code reviews covered physics/lifecycle and runtime/observation.
  Their source-grounded reuse map and risks are incorporated here.
- S2: Research from the confirmed proposal is linked below. Direct code review identified where
  reused geometry, compilers, work accounts and throughput fixtures diverge from their new use.
  Numerical selection and derivation remain explicit M0 deliverables rather than invented results.
- S3: The user already settled core identity, fixed slots, generic paid biomass, common washout,
  field coupling, sparse resource intent, engineering ownership and immutable sharing. There is
  no unresolved architecture fork requiring another question.
- S4: The user's September 15 request, beginning “Great, write this to a detailed plan file,”
  explicitly confirms the integrated proposal. Repeating that confirmation would add no decision.
- S5: Every durable constraint is threaded through the direction, reuse map, risks and milestone
  gates. The physical-state/renderer boundary was rechecked against actual source.
- S6: [ADR 0021](docs/adr/0021-integrated-digital-chemistry.md) preserves accepted architecture and
  alternatives. This root plan preserves the requested detailed direction. Existing homes are
  sufficient; no executable scaffold is registered. The earlier user instruction to preserve old
  documentation until implementation takes precedence over generic index/backlog rewrites. M8
  owns those updates. The changelog records shipped behavior, so planning adds no release entry.
- S7: M0–M8 use feature-start milestone grammar and explicit exit gates. Per-step file/test lists
  belong to just-in-time `plan-phase` expansion.
- S8: Publish one all-pending root plan with the identical M0–M8 titles. The published plan tracks
  status; this file owns scope and detail. Stop after planning; no implementation begins here.

## Cross-cutting constraints

Every milestone carries designed material/work accounting, local causality, smooth inherited expression,
bounded computation, observation ownership and evidence provenance through its touched owners.
Physical laws and data shapes may change together; existing component boundaries are not a veto
on coherent redesign. The user-fixed data-sharing boundary remains binding.

Use native agent editing for authored files. Work on the existing branch. Start no development
server; authorized browser checks use an isolated session on the already running server with a
registered operational purpose. Keep evidence and planning artifacts local. The user has now authorized a thorough design-document revision. Distinguish the accepted
foundation from actual runtime behavior; this revision does not claim the new operators run.

Use `plan-phase` to expand one milestone just before execution. If a phase reveals a multi-step
prerequisite, mark it blocked and create a Sulion sub-plan with `sulion plan branch`; return with
`sulion plan return --completed` when resolved. Do not flatten unrelated repairs into a milestone.

## Validation policy

Compute governing budgets and limiting cases first. Then use bounded invariant tests, field-only
fixtures, single-cell probes lasting hundreds of ticks and, where needed, small paired comparisons.
Each behavioral probe records its question, competing explanations, initial state, predicted causal
chain, controls, learning/mutation settings, horizon, wall cap and decision the result can change.
Use ordinary physics and diagnostic RNN weights, not programmed oracle behavior.

Separate physical possibility, controller expression, accessible inherited variation, observed
adaptation and long-operation readiness. Report failures and denominators. No seed sweep, automatic
horizon extension or pre-evolved community is implied by this plan. Mechanical long-history tests
may use synthetic ancestry; they are not ecological evidence.

Capacity measurements pin world extent, timestep, mesh, chemistry occupancy, organism count,
genome diversity, learning, reproductive activity, observation and device. Check short refinement
comparisons for gradients, work, transport, growth and conditional payoffs. Numerical precision is
an engineering choice whose adequacy follows from those effects.

## Documentation foundation revision — September 15, 2026

Authorized scope: revise design authority, mathematical specifications, entrypoints and plan
contracts. No runtime implementation, cleanup, benchmark or ecological assay in this revision.
Use [ADR 0022](docs/adr/0022-computable-chemistry.md) and the detailed computational foundation.
The canceled expansions preserve partial work and evidence; cancellation is not completion.

Sulion documentation branch: `2b5e23a4-3596-48f2-8602-72b4e722ecf1`, under M2.

1. Audit design authority and evidence (`7888c31a-def9-456d-b5d5-9d06648b52b3`):
   read governing principles, root plan, ADR 0021, M0 specifications, M1 ownership, runtime-design
   entrypoints and retrieved user clarification. Identify equations erroneously treated as
   requirements and preserve their recorded evidence. State: completed source review.
2. Reconcile durable documents (`b48a11b1-0340-403a-9171-316155381936`):
   establish one detailed computational foundation and ADR, revise active contracts and links,
   mark old selections/expansions as reference, and record M2–M4 dependencies. State: completed.
3. Verify and hand off (`72eee75b-bf06-4fb8-84fa-1d2567d44fd8`):
   review changed text for contradictory authority, requirements lost and false runtime claims;
   run documentation checks and `make ci`, preserving actual failures. State: completed for this
   documentation scope; the full repository CI gate remains failing as recorded below.
   Before edits, `make ci` exited 2 at `cargo fmt --check` on the unfinished M2 Rust files
   (including field.rs, field_reductions.rs, interaction.rs, spatial_flux/numeric/rounding/step.rs
   and spatial_physics.rs). This is a pre-existing code-format failure for this documentation
   task; downstream CI stages did not run. No runtime repair is authorized by this pass.

At this documentation handoff, redesign was assigned to M2. The subsequent milestone reconciliation
below corrects that placement: reopen M0 for mathematical/computational selection and M1 for its
representation, then resume M2. Formula selection remains implementer-owned.

Documentation handoff: 27 Markdown files added or revised, including this plan and agent guidance.
The review checked retained identity/functions, finite source and local-control constraints,
worker ownership, whole-runtime performance, historical evidence and formula-selection authority.
Root laws and M2–M4 outcomes now follow the computational foundation; seven mathematical chapters
separate current responsibilities from the full historical M0 equation records. Older runtime
guides retain version-specific behavior and link to the new authority. No tests of prose wording,
runtime edits, development server, new benchmark or ecological assay were added by this pass.

Actual verification on September 15, 2026:

```text
make docs-check
documentation checks passed: 215 files and 68 normalized headings plus 176 source headings indexed; archived source bodies preserved outside link enforcement

git diff --check -- AGENTS.md docs
[exit 0; no output]

make ci
cargo fmt --manifest-path engine/Cargo.toml -- --check
Diff in /home/sulion/repos/antropy/engine/src/field.rs:164:
[formatting differences in eight unfinished M2 Rust files]
make: *** [Makefile:6: engine-check] Error 1
[exit 2]
```

The first documentation check found the new principles heading lacked a stable anchor; the
anchor and index link were corrected before the passing check. The final full-CI attempt repeats
the pre-edit Rust-format failure, so Rust Clippy/tests and frontend/type/build gates were not
reached by it. This pass does not mark those checks green or repair the paused implementation.
The documentation branch is completed. Its evidence remains valid; the following reconciliation
reopens the unmet prerequisite milestones rather than treating M0/M1 as currently accepted.

## Milestone reconciliation — current work order

Planning revision authorized September 15, 2026. Root Sulion plan remains
`39f64047-90fd-456f-ba09-95ca79edf549`; milestone numbers and phase IDs stay stable.
Reconciliation branch `e743e5a8-68ff-4182-9fee-557f283ca0e3` covers M0–M2.
Its evidence review step is `74c1bca9-12af-4645-8005-d5c0bb2a4aed`; plan/verification step is
`73a56c56-0f7c-4f8e-81d0-54f38d1a8d77`. Both steps and the reconciliation branch are complete;
the terminal returned to the root and M0/M1/M2 statuses are pending. This was planning work,
not execution of reopened M0.

The documentation correction changed more than M2 implementation details. The selected mathematical
contract is now inadequate, and the compiled representation embeds parts of that contract.
Therefore M0 and M1 reopen. Keep their completed expansion records and valid tests as provenance;
do not erase work, relabel an earlier passing check as failed, or count it as replacement acceptance.
The old M2/cache expansions remain canceled. The replacement M0 expansion and completion evidence
and completed M1 reconciliation are recorded below; M2 integration is next.

| Milestone | Current state | Required outcome / reason |
| --- | --- | --- |
| M0 | Completed replacement | Selected revision-4 laws, 14 new bounded checks, passing composed WASM cost and CI. Ordinary-world integration remains outside M0. |
| M1 | Completed replacement | One canonical v2 compiler serves kernels/atlas; unchanged cost pair, full CI and handoff pass. |
| M2 | Partially implemented; ready for re-expansion | Integrate the accepted spatial operators and paid motion. Its prior experimental solver failed cost acceptance and has not replaced World stepping. |
| M3 | Pending M2 | Integrate finite engagement, local exchange and unary processing under the selected rules. |
| M4 | Pending M3 | Integrate actual paid bodies, continuous installed function, RNN control and inheritance. |
| M5 | Pending M4 | Re-derive economy and establish bounded causal opportunities in the ordinary two-colony world. |
| M6 | Pending M5 | Reconcile observations, genealogy and exact supported continuation with implemented meanings. |
| M7 | Pending M6 | Validate complete runtime performance and accumulated-state reliability. |
| M8 | Pending M7 | Finish consumer audit, build/documentation and human motion/legibility handoff. |

### Reuse, unfinished code and evidence

Current-source review confirms `OperatorCompiler` stores reciprocal incident bindings, barrier
and coupling values, and a two-component membrane profile. `MachineryParameters` includes
continuous coupling values; `InstalledParameters` is a snapshot rather than live paid cell
expression. These are reasons to reopen representation acceptance, not assume M1 is wholly wasted.
`World::step` still calls `Field::advance` through its accumulated physiology clock.
The new `spatial_rounding` code still computes ideal entropy; its optimization does not implement
the newly accepted mathematics.

| Existing work | Current meaning | Next owner |
| --- | --- | --- |
| M0 equations and 22 bounded algebraic tests | Valid evidence for a superseded model; no new-law or throughput approval | M0 retains useful independent checks, replaces governing formulas and identifies reference-only tests explicitly. |
| M1 chemistry v4, physical checkpoint v12, products, validation and immutable cache identity | Implemented and tested; discrete identity, continuity and ownership are reusable | M1 revalidates only affected contracts; retains or changes basis, coupling/edges and schemas according to M0. |
| M2 actual-material disk geometry in organism/lifecycle/economy | Partial live change; old spatial pipeline still executes | M0 decides geometry conventions; M2 reconciles all geometry consumers coherently. |
| M2 interaction, kernel, disk, energy, field proposals and cache/rounding modules | Partial candidate implementation with nine focused native tests; not ordinary spatial integration | M0 evaluates reusable arithmetic and explicit dispositions; M2 reuses or retires the abandoned spatial paths and consumers. |
| Last measured M2 subset, ledger 3787/3788 | 239.88/246.93 ms per tick at 48/2,000 cells; 100 measured ticks, zero retries; excludes motion/biology/rendering | M0 uses this failure and the old diffusion execution as baselines, then measures the selected composition; M2 repeats after integration. |
| Later cache/fused-reduction edits | Native tests passed; no matching WASM cost evidence | No automatic optimization continuation. Reuse only if the new rules need them; otherwise retire with their consumers. |
| Current Rust formatting failure | Last `make ci` stops before Clippy/tests/frontend gates in eight unfinished M2 Rust files | First authorized execution establishes a clean relevant baseline. Use a nested prerequisite if needed; no unrelated repair or implementation in this planning turn. |
| Prior browser performance, source economy and population studies | Version-specific results, not replacement acceptance | M5/M7 re-derive or remeasure affected claims; preserve negative findings and provenance. |

Retirement happens with the responsible owner, not only at the final audit. M0 settles which
rules and safeguards replace the old ones; M1 removes superseded representation scaffolding as its
consumers change; M2 removes abandoned spatial execution/diagnostic paths; M3/M4 remove obsolete
kinetic and lifecycle consumers. M8 audits that these dispositions are complete. Preserve a prior
law only as an explicitly scoped reference when it has a concrete verification use, not as a
selectable runtime or compatibility adapter. No broad deletion is authorized by this plan update.

### Selection and acceptance boundaries

M0 owns the coherent mathematical design across fields, machinery and lifecycle before their
production integration. It must resolve what properties/fields mean, how drift is composed, where
nonlinearities run, how work is funded, and how allocation and numerical bounds enforce the
selected rules. M1 implements that representation. M2–M4 implement their respective live owners;
they do not each invent another competing accounting or response system.

Numerical choices, basis rank, coefficient relationships, release behavior, precision, mesh and
clock schedule are implementer-owned. Record changes and matched-time evidence. Material identity,
local/funded evolution, finite resources, 48 founders/two colonies, meaningful travel and the
immutable sharing boundary remain constraints. Human motion acceptance remains M8. No additional
user-owned decision is currently blocking planning or ordinary numerical selection.

The earliest cost gate moves into reopened M0. The proof point must execute the expensive composed
path over populated arrays, including redistribution and its runtime accounting/bounds, rather
than time only a matrix multiply or convolution. Reuse existing Rust owners and the release-WASM
harness; selected kernels have one intended production home, with independent reference checks
limited to verification. This is bounded numerical implementation when M0 is executed, not a
second simulator, live-world cutover or ecological campaign.

Retain the existing 48/2,000 fixed-workload pair, all 256 channels, 10 warmup plus 100 measured
ticks and 60-second cap per case as the initial comparison. Record full configuration, source/binary,
model time, density, installed diversity, changed-state work, timings and memory. Use the 16 ms
spatial allocation against the 33.3 ms complete-runtime budget; any revised allocation must name
the remaining work and preserve the full 30 ticks/s and model-time requirement. No gate is met
by reducing cells, species, activity, physical time or by timing a cheaper unrepresentative subset.
Select resolution/scheduling with the laws and validate their causal effects over equal model time.

M0 also needs cost evidence for representative machinery/accounting operations and the memory
bounds needed by M1; whole-population integration stays in M2–M4. M1 checks compiled layout and
changed-installed-state costs. M2–M4 retain early integrated timing so regressions are addressed
at their owner. M7 remains the complete browser/GPU, growth, observation and history gate.
These are progressively more complete checks, not repeated claims from one isolated benchmark.

Future phase expansions replace equation-specific registrations with predictions of the selected
rules while retaining useful questions, controls, budgets and negative findings. A new test per
step and a manufactured failing baseline are not requirements. Reuse relevant evidence and add
behavioral checks only where they establish a changed contract.

Planning verification: `make docs-check` passed (215 files, 68 normalized headings and 176 source
headings); `git diff --check -- AGENTS.md docs` passed. `make ci` exited 2 at
`cargo fmt --manifest-path engine/Cargo.toml -- --check` in the eight unfinished M2 files identified
above; downstream gates did not run. Reviewed this turn's ten Markdown changes against their
starting contents. No runtime code, numerical selection, benchmark or phase execution changed.
The formatting failure is not repaired by this task. Stop after plan reconciliation. Next action is
`plan-phase` on reopened M0, with its expansion saved here. The old standalone M0/M1 step files
are completed historical records and must not be replayed.

## Milestones

M0 and M1 replacement gates are complete. M2–M8 remain pending; re-expand M2 next.
Old child-plan completion records remain intact as version-specific evidence.
Each execution milestone requires `make ci`; CI alone does not establish causal opportunity,
performance or human motion acceptance. Expand only the milestone about to execute.

### M0 — Close the mathematical and numerical contracts

Status: completed, including math, core cost, CI and downstream handoff. Sulion phase
`128a9a97-0d18-4b60-ade2-f94e76b58f74`. The
[previous step plan](DIGITAL-CHEMISTRY-M0-PLAN.md) is historical, not execution-ready.

Outcome: one concrete computable discrete chemistry contract, with coherent accounts and measured
core feasibility, spanning all four responsibilities and the funded material lifecycle.

- Select manifold property/response bases, shared mixture and directional operations, diffusion
  plus drift, finite engagement and bounded unary transformations. Define actual cell/interface
  response, geometry, injury and lifecycle work using the same quantities. Resolve static versus
  live terms and every parameter's meaning rather than leave an equation-shaped placeholder.
- Design conservative allocation, donor/work limits, nonnegative and empty-state behavior,
  finite reach, bounded accumulation, self/contact treatment, paid mutation expression and
  source/sink accounts with the update. Establish closed-cycle consistency under these artificial
  rules; reproduce M0 thermodynamics only where deliberately retained as the selected law.
- Specify dimensions, data flow, invalidation, numerical precision/schedule and candidate
  persisted-state needs. Inventory useful M1/M2 code versus superseded scaffolding and provide
  clear downstream owners. Deal with the relevant interrupted-work baseline before claiming CI.
- Verify small independent limiting cases and composed event chains; use the existing harness
  for the early populated-array cost proof described above. Measure the final arithmetic and
  accounting path, representative machinery costs and memory, not only its low-rank intermediate.
- Exit: `make ci` passes; selected formulas, invariants, cost evidence, whole-runtime budget,
  downstream contracts and bounded causal registrations are explicit. The measured core fits
  its declared allocation. A failed cost gate returns to mathematical selection before M1.
  M0 does not certify live integration, supplied reproduction, evolution or browser endurance.

Historical evidence retained: 22 M0 algebraic probes and the then-current CI gate passed.
Those checks concerned the superseded formula set. Completion of child branch
`c27a3d8b-e713-4f33-aeef-b456be3e8cc7` remains accurate history.

#### M0 execution expansion — computable laws and core feasibility

Prepared September 15, 2026 with the current plan-phase skill. This replaces the old M0
execution instructions; it does not reopen or rewrite the completed historical child.

Scope: select and demonstrate one concrete, computable mathematical system across shared fields,
cellular response, machinery and funded material events. Implement its reusable arithmetic in the
existing Rust crate and exercise it through bounded tests and the existing WASM harness.
M0 does not switch ordinary World stepping, migrate persisted genomes/cells, integrate live
remodeling, retune founders, redesign displays or run population experiments. Those outcomes
remain M1–M8. No second simulator or TypeScript physical model is introduced.

Acceptance: the selected rules have explicit dimensions, accounts, bounds, meaningful limiting
cases and measured composed cost within the declared whole-runtime budget. A cheap projection
followed by expensive unmeasured redistribution does not pass. All selected event families must
share consistent material/work meanings. M1 receives concrete shapes and ownership requirements;
M2–M4 receive executable arithmetic and integration contracts, not unresolved competing laws.

Sulion root: `39f64047-90fd-456f-ba09-95ca79edf549`; M0 milestone:
`128a9a97-0d18-4b60-ade2-f94e76b58f74`; expansion:
`1a7fe97f-756b-4acb-b404-c3bc758b5136`. All six execution steps are complete.
The user authorized execution of this M0 expansion only. Baseline: 97 Rust/54 TypeScript tests.
Final: 111 Rust/54 TypeScript tests and full CI pass; measured core fits its declared allocation.
No ordinary World cutover is authorized by M0. See the completion record following the steps.

##### Current sources, predecessor evidence and reuse

Read ADR 0022 and the computational foundation before the older formula chapters. ADR 0020 and
the immutable sharing contract govern execution ownership. This expansion's source review
supersedes stale implementation details in the feature-start reuse map without deleting its
provenance. Retrieval of user turn `158223284`, session
`01a09995-751c-7013-ae06-0abc4cd32c7e`, reconfirmed computability as a rule-selection criterion.

| Current owner reviewed | Concrete reuse and limitation |
| --- | --- |
| `engine/src/field.rs`, `numeric.rs` | `Field::advance/diffuse` uses contiguous conservative neighboring exchanges, shared mobility and explicit washout/roundoff. `numeric::exchange` has scalar/WASM SIMD implementations. Reuse execution structure and ownership; neither its old schedule nor exact mobility formula is mandatory. |
| `engine/src/spatial_step.rs`, `spatial_numeric.rs`, `spatial_rounding.rs`, `field_reductions.rs` | Interrupted M2 candidate uses full proposals and ideal-entropy reductions. Existing tests protect its historical behavior. Assess individual helpers against new rules; do not keep its expensive functional as the new acceptance oracle. |
| `engine/src/chemical_operators.rs`, `machinery_parameters.rs`, `chemical_products.rs` | Fixed slot arrays, separate target/installed snapshots, exact immutable cache identity and conservative weighted products are useful. Reciprocal incidence, coupling, barrier interpretation and two-component membrane profile are revisable. Installed snapshots do not yet provide live paid expression. |
| `engine/src/study_commands.rs::spatial_capacity` | Existing diagnostic exercises 110 nominal spatial ticks on actual Rust field/cell owners, reports 100 measured ticks, windows, accounts and scratch bytes. It excludes motion/biology and hardcodes old laws and a future compiler byte estimate. Replace that measurement scope/label when measuring the new core. |
| `engine/src/commands.rs::load_fixture`, `frontend/harness/numerical/capacity.ts` | Reusable 48/2,000 varied-genome fixtures, binary capture, snapshots and ledger writer. Fixture genetics still use old live machinery encoding; new-kernel fixtures must supply explicit varied installed parameters, not a fractional-to-integer compatibility adapter. |
| `frontend/harness/numerical/performance.ts` | Existing ordinary-step measurement includes census, inspection and packed render preparation; GPU execution is excluded. Useful remaining-budget evidence, not a new-law or complete-browser result. |
| `engine/tests/chemistry_contract.rs` and its child modules; `engine/tests/spatial_physics.rs` | Existing bounded test homes. Some M0 tests only exercise test-local thermodynamic formulas; new-law checks must exercise the intended production kernels with independent expected results. Retain reference-only tests only with an explicit use. |
| `docs/specs/digital-chemistry/representation.md`, `validation.md` | M1 schema/compiler and original passing evidence remain version-specific. Reconcile affected contracts after mathematical selection; passing historical tests does not close reopened M0/M1. |

Earlier M0's 22 probes and M1's 16 tests remain historical evidence. Last measured M2 subset:
ledger 3787/3788, 239.88/246.93 ms per tick at 48/2,000 cells; later cache work is unmeasured
in WASM. Do not rerun that failed solver merely to rediscover the failure.
Current `make ci` stops at Rust formatting before downstream checks. The actual working tree,
not HEAD alone, is the execution baseline.

##### Execution steps

1. **Reconcile the interrupted baseline.**
   - Files: this plan; relevant owners in the table; `Makefile`; existing test targets.
     If unchanged on execution, formatting differences are in `engine/src/field.rs`,
     `field_reductions.rs`, `interaction.rs`, `spatial_flux.rs`, `spatial_numeric.rs`,
     `spatial_rounding.rs`, `spatial_step.rs` and `engine/tests/spatial_physics.rs`.
   - Reference/outcome: establish which unfinished changes are present, what ordinary World
     stepping executes and which checks currently protect reuse. Preserve unrelated working-tree
     changes. Record a per-owner keep/revise/retire disposition with its reason and later owner.
   - Change: during execution, resolve the relevant formatting-only baseline using native edits;
     do not resume old optimization. Diagnose any additional failure from its output.
     A multi-step authorized prerequisite gets a nested Sulion branch; an unrelated repair does
     not gain authority merely because CI found it.
   - Verify: review `World::step` and actual consumers; run `make ci` for the reconciled baseline.
     Record actual output and limits. Reuse that baseline for unchanged components; no fabricated
     red test. A failure outside the prerequisite's scope remains explicitly blocked.
   - State: completed; step `c6f3b53a-0c5e-41d4-b335-63d93441cfc1`. Baseline CI passed:
     97 Rust/54 TypeScript tests; 13 pre-existing lint warnings; documentation/Terraform checks pass.

2. **Select the composed laws and accounts.** [depends on #1]
   - Files: current sections of `docs/specs/digital-chemistry/{parameters,accounting,interactions,
     transport,machinery,lifecycle,numerics}.md`; this plan. Historical equation records remain
     labeled; the selected contract belongs in the current sections.
   - Reference/outcome: the computational foundation's complete composition and consistency
     requirements, plus confirmed decisions above. Choose one coherent numerical contract,
     not a list of possible formulas or a repetition of strategic prose.
   - Change: specify chemical property/response bases and rank, bounded chemical boundary maps,
     shared spatial vectors, diffusion-plus-drift coefficients, field/cell deposit and sample
     rules, finite extent/reach, self/contact treatment, resistance and motor response. Specify
     receptor/transport/enzyme engagement, product feedback and weighted products, internal and
     external injury, work storage, generic assembly, repair, installed changes, birth and death.
     Define source/renewal/washout accounts and the local-delivery boundary so explicit transport
     and an analytical capture cap cannot count the same limitation twice.
   - For each operation, record input/output shapes, units/conventions, static versus live terms,
     affordable nonlinearities, donor/work allocation, scheduling, rounding/error books and
     failure bounds. Distinguish stored energy from constitutive signals. Explain how every
     removed entropy/capacitor/global-energy safeguard's intended protection is supplied by the
     selected rules. No field, profile change or closed material/body cycle can mint usable work.
   - Draw the actual update dependency/data-flow diagram. Inventory independent coefficients
     and derive redundant ones where their physical meanings agree. Count final-loop arithmetic,
     passes, invalidation, persistent/scratch bytes and changed-installed-state work before coding.
     Use the step #5 workload and declare spatial, cellular and remaining-runtime allocations.
   - Verify: dimensions, limiting cases, event-account closure and boundedness derivations;
     hand-calculated examples predicting direction, capacity, conditional returns and costs.
     Review the contract across fields and bodies, including tiny/zero stock and contact/birth
     changes. Every formula and coefficient has a meaning and implementable evaluation path.
     These are source/math checks, not prose assertion tests. Selection is provisional until #5.
   - State: completed; step `fd735dcc-ad37-4c04-b672-7a60e3bb79fe`. Revision 4 is selected
     in current specifications: rank-two constitutive fields, rational drift, finite forward
     maps/product feedback and paid linear-work events. Shared math, cost and CI gates pass.

3. **Build and verify the spatial arithmetic.** [depends on #2]
   - Files: relevant existing `engine/src/{numeric,field_reductions,spatial_numeric,spatial_step,
     spatial_flux,interaction,spatial_kernel,disk,spatial_energy,spatial_rounding}.rs`;
     `engine/tests/spatial_physics.rs`, `engine/tests/chemistry_contract/` and their existing
     integration entrypoint. These are candidate homes to reconcile, not a requirement to retain
     every old module. Necessary module registration is in scope.
   - Reference/outcome: implement #2's mathematical operations once in production-intended Rust.
     Small fixtures invoke those operations directly; ordinary World cutover remains M2.
   - Change: compose chemical/cell projections, shared directional operations, chemical responses
     and conservative redistribution with their real rounding/accounts/bounds. Include actual
     cell-source/sample and passive/paid-response arithmetic needed to substantiate coupling.
     Fuse or reuse passes where appropriate; do not introduce full per-species vector fields
     or iterative global checks merely because old notation had them.
   - Verify: independent small dense or hand-computed cases for zero-drift diffusion, nonuniform
     drift, material/nonnegative allocation with competing donors, periodic geography, finite
     delivery, empty/tiny stock, accumulation bounds and intended self/contact behavior.
     Exercise cell contributions and response to changed local medium, including affordable
     movement and source/sink books. Check spatial/temporal sensitivity over equal model time
     against the selected discrete behavior, not abandoned continuum equations.
   - Reuse appropriate tests and replace formula-specific assertions deliberately. Tolerances
     follow selected precision and derived bounds. Scalar/SIMD checks exercise actual shared
     kernels; reference calculations stay test-local. Passing arithmetic is not live integration.
   - State: completed; step `92c3cce0-9f00-42b4-ad6d-42e37323e789`. Actual Rust scalar/SIMD
     arithmetic passes local drift/diffusion, donor, self/contact, medium and refinement checks.

4. **Build and verify cellular arithmetic under the same accounts.** [depends on #2] [depends on #3]
   - Files: reusable arithmetic in `engine/src/{chemical_products,chemical_operators,accounting,
     transport,metabolism,refitting,lifecycle}.rs` or a cohesive module beside its owner when
     current files cannot contain it cleanly; `engine/tests/chemistry_contract/`;
     affected current mathematical specifications. Module boundaries may change with recorded
     reasons; no new framework, crate or parallel runtime.
   - Reference/outcome: finite slot engagement, local exchange, unary processing and paid material
     events compose with #3's accounts. Genome targets, actual installed function and funded
     capacity stay distinct. All 256 IDs remain real material owners.
   - Change: implement reusable selected recognition/response, request allocation, transformation
     and event-payment arithmetic, using M1 product helpers where valid. Specify concrete
     compiled inputs for M1 and evaluate representative explicit installed sets. Do not migrate
     chromosomes or insert old-schema adapters to make this proof point runnable.
     Event calculations cover assimilation, repair, learning/remodel costs, actual-stock
     division and local death/release; biological orchestration and expression remain M3/M4.
   - Verify: shared-substrate/work/storage competition, finite engagement and product feedback,
     conservative reflected products and nearby installed-coordinate continuity. Exercise
     closed import/process/export and assemble/remodel/divide/release sequences to detect work
     creation or free stock. Include exhausted-resource controls and internal/external stress.
     One joint sequence must use #3's field operations and these cellular operations so separately
     balanced helpers cannot hide an inconsistent transfer boundary.
   - Verify positive conditional capability and a condition that removes its return through
     bounded calculations/events; do not require invented specialist bonuses or evolved outcomes.
     These checks call shared arithmetic, not a dummy organism or a second simulation loop.
   - State: completed; step `fa914b82-abf9-4eef-a13f-fe1e590a982b`. Shared exchange, finite
     processing, funded events and the joint field-to-cell cycle pass; live orchestration deferred
     to its original M3/M4 owners, not claimed here.

5. **Measure composed release-WASM feasibility.** [depends on #3] [depends on #4]
   - Files: `engine/src/study_commands.rs`, existing diagnostic routing in `commands.rs`,
     `frontend/harness/numerical/{capacity,engine,performance}.ts` as required,
     `docs/specs/digital-chemistry/{numerics,validation}.md`; existing artifact/ledger writers.
   - Reference/outcome: mathematical acceptance requires the actual expensive composition,
     not just projection/convolution. Reuse the existing release-WASM build and capacity path;
     supply small commands and Rust-owned fixtures, never physical-array round trips.
   - Change: replace the canceled spatial diagnostic's old-law work order with the new core
     measurement. Retain historical results under their original identity; label new rows and
     exclusions accurately. The measured path includes projections, shared fields, species
     redistribution, numerical/accounting safeguards, cell deposit/sample and motion arithmetic,
     finite engagement, processing and representative paid events. Record stage costs and the
     combined wall time; isolated stage sums are not the only evidence.
   - Workload: seed 101, 48 and 2,000 varied installed sets, all 256 chemical channels with
     nonuniform dense fields and nonempty intracellular mixtures. Reference extent 320×240,
     h=2 and dt=0.2; preserve world/model time when selecting different resolution/scheduling.
     Pin funded capacity and requests so depletion or inactive fixtures cannot make later ticks
     artificially cheap. Any controlled replenishment/reset is an explicit diagnostic boundary,
     with its timing reported, not a hidden ecological subsidy.
   - Include cold coefficient construction and a declared changed-installed-state segment:
     actual parameter changes exercise invalidation/recompilation and live response. Report
     one-time cold cost separately; charge recurring changed-state work to the selected schedule.
     Retain variation, nonzero coupling, full inventory and requested work through the measured
     horizon. Snapshot equality is not enough to prove that those operations ran.
   - Initial execution budget: one new-core pair and, if existing evidence is not comparable,
     one diffusion-only baseline pair using the existing kernel on matched fields/model time.
     Each case has 10 warmup and 100 measured ticks, a 60-second wall cap, mean and worst
     20-tick windows. Thus at most four initial cases/440 nominal ticks/240 timed wall seconds;
     builds and cold setup are reported separately. Do not rerun the failed old M2 solver.
   - Before any revision run, record the failed claim, causal explanation, changed operator or
     schedule and exact bounded rerun. Reuse unaffected results. No automatic seed/resolution
     sweep, horizon extension or population campaign. A failed cost gate returns to #2–#4
     within M0; it is not deferred to M7 or waived by declaring implementation complete.
   - Verify: final loaded binary and source identities, runtime/device, exact shapes/schedule,
     active counts, changed-state work, actual measured model time, allocations and memory.
     Spatial mean and worst windows fit the 16 ms comparison allocation, or a justified revised
     allocation leaves an explicit feasible share of 33.3 ms for the complete workload.
     Cellular work also fits its predeclared share; model time remains at least 6 model seconds
     per wall second for a complete 30 ticks/s workload at dt=0.2. M0 estimates remaining work
     honestly; GPU, real RNN/lifecycle orchestration, history and browser integration are excluded
     here and still require M2–M7 evidence. Cost of actual dense and changed-state work cannot be
     omitted from acceptance. Record negative or capped cases as failures, not partial passes.
   - State: completed; step `fb049097-8fb5-406a-9e4b-ca4ebd3e19a0`. Final ledger 3797/3798:
     8.82/19.24 ms mean, 9.03/20.35 worst 20-tick windows; 12/10/11.3 allocation satisfied.
     Matched diffusion-only 3799/3800 is 3.18/3.23 ms. Accounts/activity/horizon gates pass.

6. **Close contracts and verify the M0 handoff.** [depends on #5]
   - Files: this plan and current `docs/specs/digital-chemistry/` chapters, including
     `representation.md`, `validation.md` and index; affected design resume pointers only.
   - Change: reconcile final selected equations, concrete data shapes, parameters, error/budget
     evidence and owner dispositions. Update any specification altered during #5; the measured
     binary must implement the final documented rules. Preserve historical evidence with its
     original scope. Required retirement accompanies replacement, with remaining consumers
     explicitly assigned to M1–M4; do not leave two selectable runtime laws.
   - Handoff contracts: M1 receives manifold generation/coverage requirements, coefficient and
     operator shapes, target/installed/cache ownership, persistence needs and byte/work bounds.
     M2 receives spatial ordering, delivery, motion and source/sink contracts. M3 receives finite
     engagement/allocation/rate inputs. M4 receives actual-stock, injury and funded expression/
     lifecycle rules. Identify observables needed by existing M5–M7 consumers without expanding
     those milestones or editing their runtime implementations.
   - Refresh only affected bounded causal registrations: question, competing explanations,
     initial resources/installed state, predicted local chain and cost, controls, mutation/
     learning settings, horizon, wall cap and decision the result can change. Register later
     supplied lifecycle/offspring/refinement checks without running them as M0 evidence.
   - Verify: `make ci` from root, source/link review and final scoped diff review. Record actual
     output, shared checks covering #2–#5, measurement artifact/ledger identities and exclusions.
     No artificial per-step red gate or documentation wording tests. Confirm the immutable worker
     boundary and ordinary-world integration boundary remain intact.
   - Complete steps only when their shared evidence exists; finish this expansion, return to
     the parent and mark root M0 completed only when math, cost and CI acceptance all hold.
     Stop at M0. M1 remains pending and requires its own just-in-time expansion.
   - State: completed; step `77283416-d216-415c-abc6-a1cb4eb8db1c`. Selected specifications,
     consumer handoff, bounded future registrations and durable evidence reconciled; full CI
     and scoped source/diff review pass. Return to parent M0; stop before M1.

##### M0 completion and next action

Selected implementation: `engine/src/composed/{field,numeric,bodies,exchange,machinery,events}.rs`.
`capacity.rs` replaces the canceled scalar spatial diagnostic through existing Rust command and
WASM artifact/ledger owners. `World::step`, production UI/worker sharing, genome registration and
persistence semantics remain unchanged. Baseline format-only fixes include the eight named Rust
files and capacity.ts; other pre-existing repository changes are not attributed to this execution.

The [evidence record](docs/specs/digital-chemistry/validation.md) preserves final JSON reports,
binary/source identities, failed attempts, actual workload, accounts, memory and exclusions.
Final release build: 23.36 seconds. `make ci` exited 0: Rustfmt/Clippy, 111 Rust tests, ESLint
(13 existing warnings, zero errors), Prettier/TypeScript, release WASM, 54 TypeScript tests in
22 files, documentation (215 files / 68 normalized / 176 source headings), Terraform formatting.
No server or ecological simulation campaign ran. No claims of ordinary-world integration,
complete browser speed, actual offspring adaptation or unattended endurance follow from M0.

Material changes from the expansion: one cohesive composed module holds replacement arithmetic
while old consumers remain pending integration; old `spatialCapacity`/audit retired immediately.
The measured h2 candidate failed. Factored donor allocation/local sampling, h4 with matched-time
checks, .8 physiology retaining full elapsed time, and fused field/washout achieve the gate.
These implementer-owned numerical selections preserve 48/2,000 cells, 256 real IDs, extent,
concentration and model time. The selected 22 ms core allocation leaves 11.3 ms for integration.
The final 2,000-cell worst window is 20.35 ms; this is a budget proof, not a browser guarantee.

| Owner disposition | Required continuation |
| --- | --- |
| Field amount owner, numeric dot, bilinear stencil, actual body area | Reused now; M2 integrates selected face/cloud/motion laws and retires the old live diffusion/movement formula consumers together. |
| Old spatial energy/kernel/disk/flux/rounding/reduction candidate | Historical tests only for the interrupted implementation; M2 retires superseded solver and helper consumers at cutover. Keep only helpers with an identified new-law consumer. |
| Profile generation, compact affinity, reflected weighted products | Reused; M1 preserves deterministic coverage and reconciles 34-coordinate target/installed inputs and cached forward operators. |
| Old reciprocal/coupling compiler and atlas | M1 replaces affected representation/atlas consumers coherently and versions persisted semantics; no compatibility adapter. |
| Old metabolism/transport and atomic refit/lifecycle | M3/M4 integrate selected numerical kernels, signed effort, paid gradual installed changes and inherited actual stock/damage; retire old laws with those consumers. |
| Worker rendering, genealogy, snapshots and observation | Untouched; M5–M7 consume new meanings through existing bounded owners and verify exact supported continuation plus complete performance. |

No user-owned decision is unresolved. Next action is plan-phase on M1 using the
[representation handoff](docs/specs/digital-chemistry/representation.md#m0-replacement-handoff),
current selected formula sections and final evidence. Do not replay the old M1 step file or
execute M1 under this single-milestone authorization.

##### Execution development record and original planning evidence

Execution record: baseline CI passed after the named native formatting fixes. Selected revision 1
is in the seven current specification chapters. Reusable arithmetic is in `engine/src/composed/`
because the old spatial modules still serve historical tests and ordinary Field owns earlier
behavior; this avoids changing live World semantics during M0. The existing scalar capacity
command is being replaced by `composedCapacity`; its old solver audit becomes obsolete.
At the first implementation checkpoint eleven new bounded behavior checks passed (plus the
historical closure test matched by the filter); final completion above has fourteen.
They exercise actual kernels and Cell/Field owners. A drift assertion was corrected to its f32
representation bound; no physics was changed to satisfy it. Cost and final CI were then pending.

First registered measurement is the unchanged step #5 pair: 48/2,000 varied installed sets,
256 nonuniform dense channels, 10 warmup/100 measured ticks, h=2/dt=0.2, 60 seconds per case.
It measures spatial arithmetic, shared local delivery, processing, repair, assembly, paid motion,
washout and paid installed-coordinate changes in one twentieth of cells each tick. Intracellular
stock and work are reset through explicit measured diagnostic boundary accounts; this is a load
fixture, not a supplied ecological outcome. Birth/RNN/contact orchestration, GPU and observation
history remain excluded and must fit the reserved integration budget.

Revision-1 cost failed: ledger 3789/3790, 51.65/94.05 ms per tick at 48/2,000 cells.
Spatial means were 44.12/40.96 ms; cellular means 7.39/48.95 ms. All 100 measured ticks completed;
material/energy residuals were within 2.5e-9. This is insufficient throughput, not acceptance.
The next bounded revision consolidates cell-local sampling into one contiguous matrix reduction,
reuses it across sensing/exposure/transport, and allocates each shared external donor once using
factored requests and touched entries. Its h=4 candidate retains extent, density, chemical IDs,
installed activity, dt and full model time, with amounts rescaled by area. Before measuring, extend
short h/h2 sensitivity checks. Rerun only the same 48/2,000 pair, 10+100 ticks/60 seconds per case;
no seed or horizon expansion. Spatial/cellular allocations remain 16/6 ms for this attempt.

Revision-2 results: ledger 3791/3792, 12.38/48.06 ms per tick. Spatial means 11.37/10.81 ms;
cellular means 0.88/33.06 ms. The 48-cell case meets the arithmetic allocation, 2,000 does not.
Accounts still close. A Clippy check overlapped the early measurement, so final acceptance must
use an otherwise idle build/test process. Next diagnostic: the same bounded pair under V8 CPU
profiling to identify the 2,000-cell cellular cost; no formula or clock change before inspecting
that profile. Two cases, 10+100 ticks, 60-second caps; profile overhead is not acceptance evidence.

Profile rows 3793/3794 reproduce the failure. Sampled self time: exchange 1,902 ms, reactions
882 ms, field faces 751 ms, field advance 610 ms and Field::add 505 ms across the pair. Compiler
self time was only 45 ms (helpers/allocations additional). The changed-installed path is not the
dominant explanation. Revision 3 therefore selects h=4, field/motion dt=0.2 and physiology 0.8,
integrating the full elapsed physiology time. Amounts and world extent remain matched. Explicit
field/motion responses read one frozen medium; washout fuses into field commit, removing duplicate
global refreshes. Preserve processing/repair/assembly/learning/remodel rates by scaling with elapsed
time, and report pending physiology time and measured cellular model time separately.

Short .2/.4/.8 processing comparisons and fused-boundary checks gate the next pair. Allocate 12 ms
spatial, 10 ms cellular and 11.3 ms remaining complete-runtime work, keeping the same 22 ms core
budget and 33.3 ms complete budget. Rerun exactly the 48/2,000 pair, 10+100 ticks, 60-second caps,
without concurrent builds/tests. This numerical schedule is provisional until those checks and
cost pass; no slower model clock, inactive populations or ecological success claim is permitted.

Revision 3 passed the arithmetic cost allocation: ledger 3795/3796, 9.24/20.08 ms mean and
9.31/20.13 ms worst 20-tick windows. Both integrate 20 measured model seconds, including
20 physiology seconds; 0.4 physiology seconds remain pending after the complete 22-second fixture.
The final verification revision adds valid [0,1] action decoding (0 export, 0.5 hold, 1 import),
exercises both directions in the load fixture, and makes conservation and nonzero work explicit
acceptance gates. A joint field/import/process/export/assembly/release check and invalid-washout
guard pass. Rerun the same pair once on the final binary, plus the already registered matched
diffusion-only pair; 10+100 ticks and 60 seconds per case, without concurrent builds or tests.
This is revision 4, with unchanged laws, h=4, dt=0.2, physiology=0.8 and 12/10/11.3 ms allocations.

This expansion carries forward the reopened milestone's scope. It separates mathematical selection,
spatial arithmetic, cellular arithmetic and the composed cost gate so a failed gate returns to its
actual cause. Production-intended arithmetic is authorized when M0 executes; persisted/live-world
migration remains outside M0. Old standalone M0 steps are not the execution contract.

No unresolved user-owned decision blocks M0. The implementer owns equations, ranks, numerical
conventions and coherent implementation details; choosing them and testing them is the work.
Human motion acceptance remains M8, and immutable sharing remains a fixed boundary.

Planning verification: current source/reuse, milestone coverage, dependency and scoped diff
review completed. `make docs-check` passed (215 files, 68 normalized headings, 176 source headings);
`git diff --check -- AGENTS.md docs` passed. `make ci` exited 2 at the existing Rust formatting
differences recorded in #1, before Clippy, tests or frontend gates. No runtime fix was attempted.
No formula has been selected, implementation changed, benchmark run or execution step started
during this planning request. Next action, upon M0 execution: step #1 of this expansion.

### M1 — Build the validated chemical manifold and compiled operators

[depends on M0]

Status: completed; M0 prerequisite and M1 final gates complete. Sulion phase
`4fd8a839-2e7a-4243-a838-f2dedc3c7919`.
The [previous step plan](DIGITAL-CHEMISTRY-M1-PLAN.md) is historical, not execution-ready.

Outcome: the validated persisted definition and bounded compiled representation implement M0's
selected composition, with explicit actual/target/cache ownership and ready consumers.

- Reuse deterministic generation, joint coverage, continuous coordinates, conservative weighted
  products and exact cache identity. Reconcile feature bases and all formula-dependent fields,
  including current charge coupling, reciprocal incidence, barriers and interface response.
  Derive coefficient/operator shapes from M0 rather than adapt new rules to old schema details.
- Validate useful chemical combinations and nearby mutation effects without organism-success
  selection. Recheck changed compiled operators against independent dense/reference calculations;
  retain unchanged evidence instead of rebuilding everything.
- Update definition/parameter serialization, validation, cache invalidation and bounded atlas
  consumers together. Version changed persisted meanings; preserve exact supported continuation
  and reject incompatible saves, without legacy adapters or granting installed stock.
- Measure actual compiled bytes and compilation/recompilation costs at varied installed sets;
  confirm execution through these layouts retains M0's arithmetic budget. Retire superseded
  representation fields/modules as their consumers move, with live rate/expression wiring
  explicitly assigned to M3/M4.
- Exit: `make ci` passes; generation, conservation, continuity, ownership/restore and bounded
  execution evidence cover the selected representation. M2/M3/M4 receive concrete contracts.
  An unchanged component may pass by reviewed reuse; unresolved formula-specific fields cannot.

Historical evidence retained: v4 definition, physical checkpoint v12, compiler/atlas and 16 M1
tests plus boundary coverage; 88 Rust/54 TypeScript tests passed at that handoff. Completed child
`d7d29051-066d-4c40-a2d5-79e38bb4896f` stays historical evidence. It does not certify compatibility
with the replacement mathematics or live machinery integration.

#### M1 execution expansion — canonical computable representation

This records the preceding compiler-v2 consolidation. The
[composition correction](#active-implementation-correction-compose-operators-through-commitment)
supersedes its current representation/cost status; the original scope and evidence remain below.

Prepared September 15, 2026 using the current plan-phase skill; execution subsequently authorized
for M1 only. It replaces the earlier M1 work order without rewriting that completed
child or its evidence. The selected revision-4 formula sections and M0 completion above govern.

Scope: consolidate the existing versioned parameter/compiler owners and M0's measured arithmetic
into one canonical representation. Preserve the validated chemical manifold, make the actual
composed kernels and atlas consume the same compiled maps, and verify ownership, serialization,
continuity, memory and execution cost. M1 does not switch ordinary World stepping or wire new
machinery into chromosomes, living installed state, mutation, RNN actions or offspring. Those
consumers remain M2–M4. It does retire duplicate replacement compiler infrastructure now.

Acceptance: one validated fixed-slot input, separate actual/target ownership, one compiler and
one executable operator representation implement M0's selected laws. No remaining coupling or
reciprocal-edge interpretation hides in replacement consumers. The generated definition retains
its physical coverage; supported serialization is explicit; the existing M0 workload still fits
12 ms spatial, 10 ms cellular and 22 ms combined, leaving 11.3 ms of the complete-runtime budget.

Sulion root `39f64047-90fd-456f-ba09-95ca79edf549`; milestone
`4fd8a839-2e7a-4243-a838-f2dedc3c7919`; expansion
`026ac69b-78c9-4c1c-bf95-9bf045dd1a04`. All five steps are complete; shared cost, CI and scoped review pass.

##### Current context, reuse and evidence

Read [ADR 0022](docs/adr/0022-computable-chemistry.md), the
[computational foundation](docs/design/chemistry/computational-foundation.md),
[representation handoff](docs/specs/digital-chemistry/representation.md#m0-replacement-handoff)
and the selected sections of accounting, machinery, interactions, numerics and parameters.
[ADR 0020](docs/adr/0020-complete-rust-kernel.md) and the
[sharing contract](docs/design/chemistry/data-ownership.md) remain immutable boundaries.
Retrieved user turn `158241668`, session `01a09995-751c-7013-ae06-0abc4cd32c7e`, reconfirms
composition over chemical-space bases through final updates, not just cheap intermediate fields.

M0's final measured binary is `faec77ff3ce44337ed01caf2808ee48f481d38e722c99f7fab0ca0f9b2b9a7f2`.
Ledger 3797/3798 measures 8.822/19.244 ms mean and 9.030/20.352 ms worst 20-tick windows.
Compiled payloads are 889,760/37,041,712 bytes; cold compiler/kernel setup is 1.42/24.41 ms.
Those costs omit the old canonical compiler's exact-key construction because M0 used its own
numerical inputs. M1 must measure the consolidated path, including validation, key construction
and changed-installed work; a representation-only test cannot inherit that timing claim.
M0 has 14 new bounded behavior checks, full CI and a matched diffusion-only baseline. Reuse those
artifacts; no need to rerun the failed M2 solver or start another diffusion comparison.

| Reviewed source / current consumer | M1 disposition |
| --- | --- |
| `engine/src/chemistry.rs`, `chemical_profiles.rs`; definition/profile/coverage tests | Retain v4 generation, two bounded profile rows and 256 resolved u/D/I/stress/profile values. Existing eight seeds test quadrant/rank/smoothness and ten physical categories, including affinity-weighted slow barriers. Revalidate; do not regenerate for organism success. |
| `engine/src/machinery_parameters.rs` | Revise v1's 42 coordinates to the selected 34; remove transporter/enzyme coupling. Reuse `Target`, fixed arrays, explicit validation, separate installed value/revision. These types are not yet in live Cell/chromosome persistence. |
| `engine/src/chemical_operators.rs` | Keep compiler boundary and exact shared definition/parameter/revision keys. Replace per-product reciprocal channels, incident lists, side tags and barriers with M0's originating-substrate maps, static work/heat, profile and stress coefficients. |
| `engine/src/composed/machinery.rs` | Promote/reuse actual `Conversion` compilation rather than re-derive another law. Remove duplicate `Instructions`, `Operators` and compiler after consumers use canonical owners. Retain `ReactionWork` and receptor arithmetic. |
| `engine/src/composed/{exchange,bodies,field,capacity}.rs` | Consume canonical compiled coefficients directly. Reuse contiguous field rows `[D,q0,q1]` and live scratch; add no parallel definition cache or per-tick adapter. The capacity fixture supplies explicit continuous parameters and paid installed changes. |
| `engine/src/chemical_products.rs`; product tests and historical machinery probes | Retain reflected bilinear positive products. Remove old endpoint-barrier production helpers once canonical compiler drops them; keep any necessary old formula solely in its labeled historical test. Do not weaken conservative product tests. |
| `engine/src/chemistry_atlas.rs`; `engine/tests/chemical_definition/atlas.rs` | Replace old compiler examples and byte claims using canonical executable operators; preserve bounded stateless inspection and clearly labeled pre-integration curves. |
| `frontend/harness/lib/chemistryAtlas.ts`, `frontend/harness/chemistry_atlas.py` | Existing atlas artifact writer/reader. The writer preserves the Rust response in definition.json and curves in law-samples.json. Change only consumers affected by the revised example schema; no new renderer or atlas command. |
| `engine/tests/chemical_definition/{parameters,operators,persistence}.rs` | Retain ownership/round-trip/invalid-input/continuation coverage. Replace coupling, reciprocal and exponential-readout assertions with independent checks of actual new maps and their execution. |
| `engine/src/world.rs`, `genetics.rs`, frontend engine package/types/ownership tests | Ordinary v12 world still uses older live biology. No new installed state is serialized there in M1; retain supported continuation and worker boundary. Schema migration of live chemistry machinery belongs to M3/M4. |

Structural references were obtained with sulion-code; its Rust reference query reported syntactic
fallback after the language server closed stdout. Text references and source bodies were also
reviewed. This is a tooling limitation, not proof of an exhaustive semantic reference graph.
The old standalone M1 plan was reviewed for scope/reuse; its old v3/v11 baseline is historical.
The actual working tree, which contains substantial pre-existing uncommitted work, is the baseline.

##### Representation decisions within M1 authority

- Keep Chemistry v4 and physical checkpoint v12 while their data and meanings remain unchanged.
  Parameter format becomes v2 and operator version becomes 2; update atlas schema for its changed
  executable example shape. Reject old parameter versions and obsolete coupling payloads rather
  than silently accepting ignored JSON fields. Do not bump unrelated world/envelope versions
  merely to advertise a compiler change. If an actual persisted meaning must change, record it,
  version that boundary and validate its supported continuation without adding a legacy adapter.
- Canonical parameters contain four receptor centers, four transporter centers, four enzyme
  center/offset pairs and one membrane center. All centers are finite in [0,15]²; offsets are
  finite in [-15,15]². Installed state owns a separate value and revision; targets grant no stock.
- Canonical operators compile from validated definition and target/installed inputs. Preserve
  each originating substrate's compact affinity and up to four positive weighted products.
  Net work/heat use weighted product reference energy, eta=.8 and e0=.05 exactly as M0; attenuation
  is 1/(1+|offset|²/9), including reflected cases. Idle maps retain occupancy and M0's paid-event
  behavior. Do not replace this with endpoint-distance attenuation or net separate product yields.
- Cache membrane profile and 256 susceptibility-weighted stress values. Occupancy, donors, work,
  damage, funded capacity and RNN action stay live. All reaction/exchange tests and the capacity
  fixture execute the canonical operators directly; no conversions inside cell/tick loops.
- Construct the validated compiler/definition identity once per definition. Reuse shared exact
  bytes; recompile only changed installed inputs, with target/installed keys distinct. Do not
  validate/serialize the whole definition for each changed cell. Include parameter bytes and
  installed revision so an unchanged revision cannot conceal different actual parameters.
- At most 36 substrates per slot gives 144 conversion records and at most 576 weighted products
  per set, plus at most 144 receptor and 144 transporter affinities and 256 stress coefficients.
  Use deterministic compact storage and count actual allocation/capacity. Boxed slices or a
  bounded packed layout are implementation choices; there is no requirement to invent a matrix
  library, cache service or new crate. Preserve independent numerical checks if layout changes.

These are routine choices under M0's settled laws. No unresolved user-owned decision blocks M1.
A proposed change to identity, immutable sharing, M0's laws or the agreed acceptance boundary is
not authorized by this expansion; stop its dependent work for that decision. No such change is
currently necessary. Supporting edits genuinely needed to build/verify these outcomes belong
to their step; unrelated repairs do not.

##### Execution steps

1. **Reconfirm retained definition and execution baseline.**
   - Files: this expansion; `engine/src/{chemistry,chemical_profiles}.rs` and existing
     `engine/tests/chemical_definition/{coverage,profiles,persistence}.rs`; current consumers above.
   - Outcome/change: reconcile any intervening work, confirm v4 profiles and joint physical
     coverage already satisfy M0, and record kept/revised/retired owners. Reuse the existing
     definition rather than rewriting it. Only an evidenced gap justifies a scoped definition fix.
   - Verify: use the planning CI below as the baseline if execution sources remain unchanged;
     otherwise run the relevant definition/contract targets and diagnose actual failures.
     Retain eight declared seeds `[1,2,3,7,42,101,202,65535]`, rank >=.05, >=8 witnesses per
     required quadrant/category, normalized profile neighbor step <=.15 and existing barrier
     neighborhood/connectivity thresholds. No random seed sweep or ecological trial.
     Existing 17-tick exact current-world continuation is the current persistence baseline.
   - State: completed; step `4278b363-eb2f-4739-888f-210653079df1`. Current 16 definition
     and 36 chemistry-contract checks pass. Retain v4 generation and v12 continuation; no
     intervening source change invalidates the planning CI. Duplicate compilers remain the gap.

2. **Consolidate canonical machinery and executable operators.** [depends on #1]
   - Files: `engine/src/{machinery_parameters,chemical_operators,chemical_products}.rs`,
     `engine/src/composed/{machinery,exchange,bodies,capacity}.rs`; existing definition and
     composed contract tests. Necessary atlas fixture/caller adjustments and module registration
     are part of this change; avoid leaving build-breaking duplicate interfaces for a later step.
   - Outcome/change: implement the decisions above in the existing canonical owners. Replace
     M0's duplicate input/compiler types and consume canonical operators in actual receptor,
     processing, local exchange and paid-change capacity paths. Use installed snapshots in that
     fixture and advance revision only after paid actual-coordinate changes. Do not migrate live
     chromosomes or grant target changes immediate function. Preserve M0 arithmetic/schedule.
   - Retire reciprocal/side/coupling representations and production endpoint-barrier helpers
     when their last replacement consumer moves. Retain old integer/export-bit live executors
     only under their named M3/M4 retirement boundary. No new adapter or selectable runtime law.
   - Verify: update existing `chemical_definition` tests to independently enumerate dense hat
     weights, compact affinity, weighted product energy, attenuation and susceptibility for corner,
     center, fractional, reflected and idle inputs. Check positive merged products sum to one,
     byte/support bounds and static/live separation. Test nearby support/product-boundary changes
     through the actual receptor/ReactionWork path, preserving independent expected bounds rather
     than the old exponential/coupling test readout. Existing composed conservation, exhaustion,
     product-feedback, injury and joint field/body checks must pass through canonical operators.
     Shared final cost/CI gates cover this step; do not mark it complete before they exist.
   - State: completed; step `3a1cbbff-9935-428e-9b72-a6156ab682bf`. Canonical v2 types/compiler
     serve actual kernels; independent checks, exact M0 cost-state comparison and full CI pass.

3. **Reconcile atlas and serialization boundaries.** [depends on #2]
   - Files: `engine/src/chemistry_atlas.rs`; existing parameter/operator/atlas/persistence tests;
     `frontend/harness/lib/chemistryAtlas.ts` and `frontend/harness/chemistry_atlas.py` only where
     their actual consumed shape changes; `docs/specs/digital-chemistry/representation.md`.
   - Outcome/change: expose canonical parameter/operator versions, originating substrate maps,
     affinity/product weights, attenuation, static net work/heat, installed membrane profile and
     measured/bounded bytes. Preserve all five existing example contexts and 256-ID coverage.
     Mark runtime-only curves as earlier ordinary laws; do not label an old curve as selected
     arithmetic or imply live-world integration. Reuse the stateless Rust command and artifact path.
   - Verify: round-trip v2 target/installed values in JSON and postcard, with explicit validation
     after decode; reject wrong versions, nonfinite/out-of-domain values, wrong slot sizes and
     obsolete coupling payloads. Test distinct target/installed keys, changed coordinates under
     unchanged revision, changed revision, changed validated definition and identical rebuilds.
     The canonical compiler must reject invalid input without mutating funded Cell state.
     Verify actual response remains tied to installed values when targets change, then changes
     after a paid installed update. Check rebuilt operators preserve the same next numerical
     result after installed serialization; do not call this full new-world continuation.
   - Reuse unchanged current-world 17-tick restore and failed-restore/borrowed-render tests.
     Atlas assertions compare semantic numeric fields with canonical operators and independent
     expectations; no wording-only tests. During execution generate one local seed-101 atlas,
     verify the existing reader consumes its revised output and retain binary/source identity.
     No browser, server, hosted rendering or new display design is required.
   - State: completed; step `f4e1566a-cd7c-4a92-a190-f35416f64088`. Schema 5 atlas generated/read locally;
     installed ownership/serialization, next numerical result and final CI checks pass.

4. **Verify compiled layout and composed WASM cost.** [depends on #2] [depends on #3]
   - Files: `engine/src/composed/capacity.rs`, existing compiler byte reporting,
     `frontend/harness/numerical/capacity.ts`, `docs/specs/digital-chemistry/{numerics,validation}.md`.
   - Outcome/change: measure actual canonical compilation, key creation, installed invalidation
     and execution together. Reuse `composedCapacity` and the current artifact/ledger path; label
     new evidence as M1 canonical-layout validation while retaining M0's original measurements.
     Include one-time validation/shared-definition cost in cold setup and actual recurring key/
     recompile work inside measured ticks. Record fixed rows, owned payloads, shared identity,
     scratch, temporary allocations where available and WASM memory; no fake cache-byte estimate.
   - Registered workload: exactly M0's seed-101 48/2,000 pair, 320×240/h4, all 256 nonuniform
     dense channels, dt=.2, physiology=.8, 10 warmup +100 measured ticks and 60-second cap/case.
     Preserve its explicit timed material/work resets, two import/two export actions, actual
     paid changed-installed segment and nonzero operations. M0's initial coordinates repeat
     after 127 cells and complete patterns after 254; keep the same fixture and independent
     per-cell compilation so caching does not silently make this a cheaper workload.
     Record actual model time and pending physiology remainder. No new diffusion baseline,
     seed sweep, organism assay or increased horizon is authorized by this registration.
   - Verify: actual binary/source/configuration identity; full horizon, finite closed accounts,
     active processing/exchange/motion/body/refit work; spatial/cellular/core mean and worst
     20-tick windows <=12/10/22 ms. The reference complete budget remains 33.3 ms at .2 model
     seconds/tick, or >=6 model seconds per wall second after integration. Retain all 256 IDs
     and populations. Report cold cost and measured bytes beside M0's values; derive the new
     conservative storage bound from actual structures. Do not use a timing-only acceptance flag.
   - If cost fails, inspect actual stage/compilation/allocation evidence, record the cause,
     proposed representation revision and exact bounded rerun before running it. Resolve
     representation regressions here instead of deferring them to M7. Do not change M0's laws,
     clocks, activity or workload to make a representation-only milestone pass. A multi-step
     authorized prerequisite uses the shared nested-branch procedure.
   - State: completed; step `616f4a2a-b1c4-4b1a-bf80-ba9f7142590d`. Ledger 3801/3802 pass unchanged
     workload at 8.680/18.479 ms; worst windows 8.757/18.681. Exact M0 final state/accounts/operations.
     Final CI binary matches both captured binaries.

5. **Close representation handoff and verification.** [depends on #4]
   - Files: this plan, `docs/specs/digital-chemistry/{representation,machinery,parameters,numerics,
     validation,README}.md` and affected design resume pointers only.
   - Outcome/change: document the canonical shape, versions, actual/target/cache boundary,
     invalidation, measured bytes/cost and retirement disposition. Keep M0's formula selection
     and historical results intact. Record why v4/v12 stay unchanged or which evidenced persisted
     change required a version. Confirm only one replacement compiler remains and actual
     kernels/atlas use it. M2 receives validated field rows and spatial inputs, M3 finite forward
     maps, M4 installed values/revisions with funded expression/birth obligations. Full ordinary
     integration, genome adaptation, complete browser throughput and endurance remain unverified.
   - Verify: `make ci`, source/link review and scoped diff against execution's starting tree.
     Reuse shared checks where unchanged; documentation gets source review, not fabricated red
     tests. Confirm no worker physical-array publication, live-world cutover or unrelated cleanup.
     Retain final failed/unverified evidence and precise next action. Complete shared steps only
     after their outcomes and required checks pass; `sulion plan return --completed`, inspect the
     parent and mark M1 complete. Stop before M2 under a single-milestone execution request.
   - State: completed; step `6e1c6246-41bf-47cd-bc1a-1cb0296f5633`. Durable handoff and source/link
     review pass. Full make ci exits 0: 112 Rust / 54 TypeScript tests, 13 existing lint warnings.

##### Planning verification and execution record

Current sources and consumers were reviewed against M0's completed outcome and the current M1
milestone. The main adaptation is consolidation: earlier M1 must no longer be an atlas-only
compiler while the measured arithmetic bypasses it. Definition generation is accepted reuse;
versioned machinery, ownership, actual execution, serialization and cost remain M1 deliverables.
No new user decision or external access was required. The planning baseline was:
`make ci` exited 0 (111 Rust tests, 54 TypeScript tests, 13 existing lint warnings; formatting,
Clippy, types, WASM build, documentation and Terraform checks passed). Source/consumer review,
milestone coverage, dependency review and this request's scoped diff review passed. Final
`make docs-check` and `git diff --check` passed. That planning turn made no implementation or measurement changes. The execution below supersedes
its pending status.

Execution: one canonical v2 parameter/operator owner now supplies actual composed kernels and
schema 5 atlas. Definition v4/physical v12 are unchanged. Baseline 16+36 focused checks passed;
updated 17+36 checks and full 112-test native gate pass. The only fixture adaptation replaces
inconsistent manually edited energy properties with a real downhill pair in validated seed 101.
No law, workload, slot count, clock, channel or population changed. Compiler borrow scopes were
adjusted to validate/share one definition across all installed rebuilds; no new cache service.
The existing Python atlas reader required only explicit old-law figure labels. See
[execution evidence](docs/specs/digital-chemistry/validation.md#reopened-m1-canonical-execution-evidence)
for ledger 3801/3802, bytes, identities, exact M0 comparison and 44.18 ms individual-tick limitation.
Final make ci exits 0: 112 Rust and 54 TypeScript tests, Rustfmt/Clippy, ESLint (13 existing
warnings, no errors), Prettier/types, release WASM, documentation and Terraform formatting pass.
Final scoped review preserves pre-existing work and confirms no ordinary-world cutover, worker
array publication or unrelated cleanup. The final built binary matches both measured/captured
binaries. Full output excerpts and limitations are in the linked execution evidence. All five
steps are complete; the child is closed, the terminal returned to the parent and M1 is marked
completed. Next action is plan-phase on M2,
not execution of its canceled expansion. Stop at the M1 boundary.

### M2 — Implement coupled spatial transport and cellular motion

[depends on M1]

Status: partial candidate work; M0/M1 complete, re-expansion pending; Sulion phase
`ef434e67-c18c-47b7-932a-f0876ab9ade5`. Re-expand after M1; canceled steps below are reference only.

- Integrate M0's selected diffusion-plus-drift and cell-response operators using M1's definition
  and representation. Reuse verified geometry, shared reductions and conservative execution
  components where they fit. Recheck cost before extending beyond the measured core.
- Wire finite-range coupling, medium resistance, actual installed interfaces, local delivery,
  paid motors/contact, source/washout and scheduling into ordinary World stepping. Refresh or
  update dependencies according to the selected contract; maintain exact supported continuation.
- Retire abandoned spatial solvers, caches, special math routines and diagnostic commands that
  no longer serve the selected rules. Reconcile settings, economy/atlas/readout formulas and
  geometry consumers together. Keep one live spatial implementation and preserve genealogy.
- Validate conservation, nonnegative owners, finite reach, intended self response, accumulation
  bounds, work consistency, local competing donors and spatial/temporal sensitivity. Repeat the
  bounded cost pair with integrated motion/contact/local delivery and report remaining headroom.
- Exit: `make ci` passes; ordinary-world spatial behavior matches the designed rules, accounts
  and supported continuation hold, and measured spatial cost fits the complete-runtime budget.
  M3/M4 biological closure and full M7 browser performance remain separate unfinished outcomes.

The last measured candidate failed cost acceptance; later caches remain unmeasured in WASM.
Ordinary World stepping still uses earlier spatial laws despite partial geometry changes.
No further formula-preserving optimization or live cutover is scheduled ahead of M0/M1.

#### Historical M2 execution contract — canceled

All text from this heading through the end of the M2 resume record is retained provenance.
Its formulas, dependencies and future imperatives are superseded by the current M2 outcome and
ADR 0022. Statuses below describe progress before cancellation, not work to resume verbatim.
The execution branch `0fa078c9-7b83-4e8d-a2ca-5ea9d205afa5` and cache branch
`100dd3b4-f547-4f51-9c20-bfca5af69b7e` were canceled after the user changed the design basis.
Partial implementation and measured failures remain; M2 has not passed acceptance.

Expanded September 15, 2026 using the revised `plan-phase` skill. M2 execution is authorized
and step #1 is in progress. This expansion lives here; the completed M0/M1 documents remain
historical execution records. M3–M8 retain their existing scope.

Scope: replace the production spatial laws together: chemical drift/diffusion, cell-mediated
fields, physical resistance, local delivery, passive motion, motor payment and contact. One Rust
state and one energy functional serve these operations. M2 establishes spatial mechanics on
actual material; M3/M4 complete reversible machinery and paid biological transformations.

Sulion mapping:

- Root: `39f64047-90fd-456f-ba09-95ca79edf549`.
- M2 milestone: `ef434e67-c18c-47b7-932a-f0876ab9ade5`.
- M2 expansion: `0fa078c9-7b83-4e8d-a2ca-5ea9d205afa5`.
- Step UUIDs and evidence state appear below. No M2 outcome is yet certified complete.

**Context / reuse map.** Re-derive behavior from the full source bodies before their edits:

| Contract or owner | Reuse and current gap |
| --- | --- |
| [Accounting](docs/specs/digital-chemistry/accounting.md), [interactions](docs/specs/digital-chemistry/interactions.md), [transport](docs/specs/digital-chemistry/transport.md), [numerics](docs/specs/digital-chemistry/numerics.md), [parameters](docs/specs/digital-chemistry/parameters.md) | M0 selected laws, units, admissibility and budgets govern. M0 compartment tests establish algebra, not production disk/grid correctness. |
| [Representation](docs/specs/digital-chemistry/representation.md), `engine/src/chemical_profiles.rs`, `chemical_operators.rs`, `machinery_parameters.rs` | M1 supplies persisted rank-two profiles, continuous interface evaluation and bounded operators. Do not regenerate profiles or cache state-dependent potentials in genotype operators. |
| `engine/src/field.rs`, `numeric.rs`, `accounting.rs` | Reuse periodic volumes, node-major 256-channel amounts, SIMD/reduction conventions and material books. Current Fick-only exchange, raw impedance reductions and linear-energy roundoff are insufficient. |
| `engine/src/organism.rs`, `movement.rs`, `lifecycle.rs` | Reuse actual stocks/inventory, periodic geometry and contact neighborhoods. Current sphere radius, overlap projection, independent angular noise and free-space motor payment must change. Contact neighborhoods alone do not implement the wider interaction kernel. |
| `engine/src/world.rs`, `transport.rs`, `sources.rs` | Reuse ordinary world orchestration, finite reservoirs and simultaneous local donor allocation. Replace slow physical refresh and the separate spherical delivery cap. |
| `engine/src/diagnostics.rs`, `opportunities.rs`, `study_commands.rs`, `study_trace.rs`; `frontend/harness/numerical/` | Extend existing production-engine fixtures, ledger, source identity and stage timers. Reuse `performance.ts` and `capacity.ts`; do not create a second simulation or benchmark framework. |
| [ADR 0020](docs/adr/0020-complete-rust-kernel.md), [ADR 0021](docs/adr/0021-integrated-digital-chemistry.md), [data ownership](docs/design/chemistry/data-ownership.md) | Rust owns physical state and scratch; rendering borrows memory in its owning worker. Bounded scalar diagnostics may cross the bridge. No full-field JS copies, second physical implementation or old-checkpoint adapter. |

**Integration decisions.** Use `A=B_total/rho_b+N_internal/rho_i`, `r=sqrt(A/pi)` throughout.
The exposed profile uses actual installed membrane state: currently `Cell.machinery_genome`,
not the descendant's target `Cell.genome`. M4 replaces the installation mechanism; M2 must not
grant a target mutation immediate physical expression or introduce an unused parallel installed
state. Amount, position, body and installation changes invalidate dependent spatial reductions.

The full E/F evaluator includes internal mixtures, actual body material, self-subtracted interaction,
crowding and contact. M2's closed-stage accounts cover spatial transport and motion; sources and
washout have explicit boundary accounts. Existing reaction, assembly and reproduction laws remain
unvalidated against this functional until M3/M4. Keep that boundary visible in reports: never
label a legacy linear-energy residual as full thermodynamic closure, invent boundary work to
balance biological defects, or advertise M2 as a survivable integrated ecology.

#### Historical M2 execution steps — superseded

Dependencies name the implementation needed to proceed. Where a later shared check supplies
acceptance evidence, retain the earlier step's unfinished verification status while continuing
that dependent work; a pending shared check is not a circular implementation dependency.

1. **Establish shared spatial energy and effective disk geometry.**
   - Files: `engine/src/organism.rs`, `accounting.rs`, `lifecycle.rs`, `economy.rs`, `lib.rs`;
     add `engine/src/spatial_energy.rs` for the shared functional and extend existing mechanics
     coverage through `engine/tests/spatial_physics.rs` as needed.
   - Reference / outcome: accounting and interactions define material-derived area, full E/F,
     variable-area ideal/crowding terms and exact finite-event differences. Stored work remains
     separate from physical energy; mixing free energy is not automatically heat.
   - Change: replace sphere geometry, including the daughter-radius estimate and the economy
     report's independent radius calculation. Establish one evaluator with interaction/contact
     contributions supplied by the spatial operators below. Provide full-state differences for
     later membrane/lifecycle consumers. Book accepted-stage bath, dissipation, external work and
     signed material/E/F representation changes with compensated sums. Retain clearly identified
     reference-only biological books until their owners are replaced; do not add guessed subsidies.
   - Verify: first reuse the current geometry/accounting tests as baseline. Add assertions for
     actual inventory/body-derived area, daughter area scaling, empty/tiny mixtures, area-dependent
     chemical potentials and separation of E, F and W. Match independent M0 equations and finite
     differences, including nonzero internal material. Coupled terms share verification with #2/#3;
     this step is not complete while those contributions remain stubs.
   - State / evidence: in progress; `ec338e5d-dfa2-4ea9-b365-701b06837401`.
     Actual-material disk regression failed against the old sphere radius before replacement.
     Shared discrete interaction/transport evidence remains pending in #2/#3.

2. **Implement adjoint finite-range fields and their derivatives.** [depends on #1]
   - Files: `engine/src/field.rs`, `numeric.rs`, `spatial_energy.rs`, `organism.rs`;
     add `engine/src/interaction.rs` for projection, convolution and deposited-body coupling;
     register it in `lib.rs`, and extend the same spatial mechanics tests.
   - Reference / outcome: interactions defines `G=diag(-1,+1)`, physical range `l=4`, normalized
     separable cosine kernel, cubic crowding `gamma=0.4` and exposed profiles from installed
     membrane plus actual stocks. Built material contributes to interaction/contact, not dissolved
     crowding. Whole-cell self energy and its position/extent derivatives are subtracted.
   - Change: project 256 species into two fields, deposit normalized soft disks using integrated
     periodic weights and implement separable convolution, including overlapping periodic images
     in small worlds. Sampling and force response differentiate the same deposited weights.
     Derive chemical excess potentials and cell forces from the common functional; preserve
     internal amount/extent derivatives for M3/M4. Allocate reusable Rust buffers and local cell
     support records; do not allocate a 256-by-256 interaction matrix or species pair loop.
   - Verify: normalization/adjoint identities; empty and periodic-seam fixtures; finite support;
     exact discrete self cancellation; finite-difference position, inventory and extent derivatives;
     and reciprocal mixed derivatives. Use M0's epsilon sequence and derivative tolerance for
     unit-scale smooth fixtures. At grid transitions check one-sided continuity separately.
     Measure residual translation/pair-force error at fixed physical range under mesh refinement;
     do not assert exact continuum translation symmetry on a finite grid. Check cubic crowding's
     lower bound against the attractive term; no density clipping may make that test pass.
   - State / evidence: in progress; `7406a6e5-3784-46b0-97ac-2aa6f138057c`.
     Normalized periodic disk weights and position/extent derivatives pass, as do full physical
     force/internal-amount finite differences and isolated self cancellation. `disk.rs` and
     `spatial_kernel.rs` keep quadrature and separable convolution beside the energy owner.

3. **Replace field evolution with conservative, admissible transport.** [depends on #2]
   - Files: `engine/src/field.rs`, `numeric.rs`, `sources.rs`, `accounting.rs`, `spatial_energy.rs`;
     add `engine/src/spatial_step.rs` only for the production physical-step scheduling/acceptance
     shared with #5/#6; extend field/spatial tests and module registration.
   - Reference / outcome: transport selects fitted face flux with harmonic `D/R`,
     `R=1+sum(impedance_s/12)c_s/c*`, stable Bernoulli evaluation and analytical empty-donor
     limits. Numerics selects outgoing safety 0.5 and a full nonlinear free-energy acceptance test.
   - Change: replace Fick-only exchange with simultaneous conservative face proposals; evaluate
     potentials and proposed amounts in f64, commit bulk amounts in f32, and account the actual
     functional's rounding difference. Reject/halve from unchanged owners when positivity or full
     energy acceptance fails. Refresh after each accepted change. Apply finite source insertion
     and exact uniform exponential washout as separate boundary events with actual E/F differences;
     retire commuted washout. Keep source placement/inventories unchanged until M5.
   - Verify: ideal `g=gamma=0` Fick limit, chemical-potential equilibrium/sign, strong potential
     differences without overflow, zero donors, high resistance, summed donor demand, periodic
     conservation, passive F descent and rejection without partial mutation. Distinguish pure
     resistance gradients from energetic drift. Check source/washout boundary closure and f32
     rounding at the existing tiny/unit/large scales using the numerical contract's measured
     representation error plus 32-ulp book bound. Reuse M0 reference equations independently of
     production helpers. CFL compliance alone is not acceptance.
   - State / evidence: in progress; `1594438a-7e20-4135-a8a3-c3e2937e4342`.
     Fitted equilibrium/empty/extreme limits, conservative nonlinear field batches, full E/F
     books and invalid-boundary rejection pass. Production clock/source wiring remains with #6.

4. **Measure populated-field cost before adding the remaining coupled runtime.** [depends on #3]
   - Files: `engine/src/diagnostics.rs`, `study_commands.rs`, `commands.rs`;
     `frontend/harness/numerical/performance.ts`, `capacity.ts`, `frontend/harness/cli.ts`;
     `docs/specs/digital-chemistry/validation.md`, `numerics.md` for registration/results.
   - Reference / outcome: M0's buffer arithmetic and historical capacity report are estimates and
     old-model evidence. Measure the new operators in the existing release WASM harness.
   - Change: add a bounded spatial-stage measurement mode over ordinary field/cell owners with
     fixed actual bodies/inventories; this is a mechanism fixture, not the complete capacity gate.
     Use 320×240, h=2, dt=0.2, all 256 channels, 48 and 2,000 cells with varied installed interfaces.
     Reuse the populated capacity fixture without reducing active cells or replacing the world.
     Record binary/configuration identity, initial state, model time, occupancy, substeps/retries,
     stage timings and live/scratch bytes. Account for M1 operator memory alongside field buffers.
   - Verify: two cases, each 10 warmup and 100 measured nominal ticks, 60-second wall cap;
     report mean and worst 20-tick window cost. Use 16 ms/nominal tick as a provisional engineering
     allocation for this spatial-stage subset, reserving more than half the 33.3 ms complete-runtime
     budget for remaining work. It is not a measured browser guarantee. If it misses, profile and
     improve these operators within the same laws before proceeding; rerun only affected cases.
     Do not compensate with larger cells, fewer channels/cells, stale fields, reduced model time or
     relaxed energy gates. A structural inability to fit is evidence for a recorded design decision.
   - State / evidence: in progress; `3af3557f-ee0d-4889-bd0f-323581ff2f31`.
     Registered first measurement: `pnpm exec tsx harness/numerical/capacity.ts
     harness/artifacts/digital-chemistry-m2-spatial-first spatial` from `frontend` after rebuilding
     WASM. Question: does the new field/energy stage fit its 16 ms allocation with populated
     interfaces? Competing cost explanations: full-channel flux arithmetic versus repeated
     energy/projection passes versus body quadrature. Keep existing dense all-channel loadFixture
     and fixed body stocks; measure refresh/transport separately. Two cases, 10+100 ticks and
     60-second wall cap each; inspect this result before any follow-up. Motion/biology excluded.
     First results (ledger 3779/3780): 48 cells averaged 420.25 ms (100 measured ticks);
     2,000 cells averaged 609.87 ms (89 measured ticks before wall cap). Neither case rejected a
     substep. Refresh alone cost 91.33/102.57 ms; field proposals and energy checks cost
     328.91/507.30 ms. The allocation failed. Authorized follow-up preserves both fixtures and
     budgets, replacing scalar transcendental/reduction execution with f64 SIMD reductions and
     range-reduced log/Bernoulli evaluation checked against independent standard functions.
     Output: `harness/artifacts/digital-chemistry-m2-spatial-vector`. No law, channel, owner or
     model-time reduction is authorized by this optimization.
     Vector follow-up (3781/3782) still fails: 350.67/367.70 ms mean, 100 measured ticks each.
     A further diagnostic checks compilation tier: the current capacity command batches all ticks
     inside one WASM invocation, whereas the browser returns through the scalar tick export.
     Compare the same two fixtures/budgets under V8's documented `--no-liftoff --no-wasm-tier-up`
     flags; record flags and Node version, output `digital-chemistry-m2-spatial-optimized-tier`.
     This diagnoses the harness and does not establish ordinary browser performance. Reference:
     [V8 compilation pipeline](https://v8.dev/docs/wasm-compilation-pipeline).
     Forced optimized-tier results (3783/3784) remain 316.25/356.80 ms per tick: tiering does not
     explain the failure. Profile that loaded binary with Node's CPU profiler, using the same
     fixed pair and caps, before choosing another optimization. Profile artifacts stay local in
     `harness/artifacts/digital-chemistry-m2-cpu-profile`; these runs diagnose cost, not ecology.
     CPU samples put 42.6% in field proposals and 48.5% in three full energy/projection evaluations;
     convolution was about 0.5%. The next bounded comparison vectorizes conservative face arithmetic,
     uses table-assisted f64 log evaluation with an independently checked remainder bound, and reuses
     internal energy across field-only trials while actual cells are unchanged. Run the same pair
     without special V8 flags into `digital-chemistry-m2-spatial-fused-arithmetic`; do not weaken
     full-state acceptance or stop reporting the still-failed allocation.

5. **Integrate paid motion and stored contact energy.** [depends on #4]
   - Files: `engine/src/movement.rs`, `organism.rs`, `interaction.rs`, `spatial_energy.rs`,
     `spatial_step.rs`, `accounting.rs`; extend existing movement and spatial mechanics tests.
   - Reference / outcome: transport defines disk-averaged resistance, `zeta=0.1 R_b r`,
     `zeta_rot=zeta r²`, actual motor stock/damage power, the force/torque ellipse and efficiency
     0.5. Passive forces and soft contact derive from the same F used for acceptance.
   - Change: replace spherical drag/squared impedance, angular noise and overlap projection.
     Combine passive force with held RNN motor effort; debit actual positive motor work, including
     field-assisted motion, without regeneration from negative work. Solve the available-W bound
     before accepting; include the finite W change in acceptance. Implement symmetric soft contact
     with deterministic coincident-center separation and the stated curvature/travel/rim limits.
     Isotropic disks have no physical heading torque. Keep local contact sensing and use contact
     neighborhoods for contacts, while field-mediated forces come from #2's wider projection.
   - Verify: no-motor downhill relaxation and isolated zero self-force; opposite-field assisted
     and opposed motor cases with actual energy payment; zero-W motor limit with passive motion
     still available; resistance and actual-mass dependence; finite contact relaxation including
     periodic/coincident pairs. Check full energy descent/payment and displacement limits, not
     just free-space speed. Record passive displacement separately where a motor-work diagnostic
     would otherwise attribute it to agency. No evolution or visible-motion claim follows.
   - State / evidence: pending; `d0a0c708-be66-4f30-b187-0a5cee6f774b`.

6. **Wire the production spatial clock, local delivery and current consumers.** [depends on #5]
   - Files: `engine/src/world.rs`, `transport.rs`, `sources.rs`, `config.rs`, `spatial_step.rs`,
     `world_validation.rs`, `boundary_tests.rs`, `mechanism_tests.rs`; `economy.rs`, `economy_report.rs`,
     `chemistry_atlas.rs`, `render.rs`, `observation.rs`, `trace.rs`, `study_trace.rs`,
     `study_commands.rs`, `diagnostics.rs`, `opportunities.rs`;
     `frontend/src/engine/Settings.tsx`, `types.ts` and
     `frontend/harness/lib/sourceSettings.ts`. Follow actual consumers before changing an API.
   - Reference / outcome: numerics specifies dt=0.2, the physical stage order, fresh dependent
     fields, held controller actions at 0.8, 64 accepted substeps and 20 halvings per substep.
     Transport specifies one local immersed membrane and no additional far-field capture ceiling.
   - Change: make ordinary `World::step` use the new operators, refreshing after all composition,
     body, interface and position mutations. Schedule rate integration on elapsed physical time;
     controller observation/private learning retains its own exact clock. Biological rate-law
     replacement remains M3/M4. Remove `diffusive_supply` and wire simultaneous membrane demand
     to touching finite-volume weights and actual local donors; retain finite machinery demand
     until M3 supplies reversible rates. No remote inventory search or replacement capture cap.
   - Change: retire `movement_impedance`, `diffusion_impedance`, `thermal_energy` and spherical
     mobility/supply consumers. Expose the constitutive drag scale with an accurate setting name
     and units, updating its Rust/TS config consumer together. Update retained mobility/atlas/
     economy readouts to the implemented law and label calculations whose kinetics still await M3.
     Preserve diagnostics and genealogy; broad display redesign remains M6.
   - Change: preserve the last accepted state on numerical failure. Persist any partial nominal
     tick's elapsed time and scheduler stage so resume neither repeats boundaries nor skips model
     time; advance the nominal tick only on completion. Version the physical checkpoint from v12
     when this persisted contract changes, validate all owners/reductions/clocks, and rebuild only
     reproducibly derived caches. No unconditional full-world rollback copy per tick. Keep the
     outer observation package unchanged if its opaque-checkpoint contract remains sufficient.
   - Verify: ordinary-world integration, all mutation-triggered refresh paths, local competing
     donors without overdraft, no distant uptake, effort-zero closure and exact continuation across
     controller boundaries and forced substep failure. Existing observer-noninterference, borrowed
     memory and recovery tests protect ownership. Search all retired symbols/formulas and resolve
     executable consumers; historical reports retain explicit provenance. Inspect the unchanged
     startup count/two-colony configuration; do not launch a development server or browser assay.
   - State / evidence: pending; `aeb763b0-5944-472c-9ce6-693c49c12d95`.

7. **Establish bounded coupled acceptance and record the actual limits.** [depends on #6]
   - Files: existing spatial/field/movement tests and diagnostic/harness files from #1–#6;
     `docs/specs/digital-chemistry/{interactions,transport,numerics,validation,representation}.md`
     and this M2 section. Update implementation status and evidence beside the governing laws.
   - Reference / outcome: the [registered causal checks](docs/specs/digital-chemistry/validation.md#later-causal-registrations)
     distinguish physical opportunity from controller expression and evolved use. Acceptance
     covers spatial laws and work, finite reach, positivity, bounded accumulation and refinement.
   - Verify: run the passive-field registration as four cases: coupling on/off at h=2/1, identical
     physical initial data and horizon. Cover the side-swap control in bounded spatial tests to
     avoid expanding the registration into eight runs. Keep l=4, 100 ticks/20 t and 30 seconds per
     case. Inspect mass, E/F, boundary/bath/roundoff, spread and refresh counts before continuing.
   - Verify: run the four registered interface cases, two installed membranes by effort on/off,
     fixed actual body and H pulse 4 L away, at most 300 ticks/30 seconds each. Inspect one exchange
     first. Record face delivery, touching-volume readings, Q, inventory and work. M2 establishes
     spatial delivery and finite local allocation; reversible affinity, shared occupancy and closed
     membrane work cycles remain M3 acceptance and must be identified as unverified in this report.
     Reuse the serial-resistance algebra as an independent limiting check, never as a live cap.
   - Verify: use small deterministic h=2/1/0.5 and dt=0.2/0.1/0.05 fixtures at fixed physical
     extent/range/time to separate mesh and temporal errors. Measure integrated face flux, force/
     motion and surface delivery; normalization, conservation and energy acceptance must hold at
     every resolution. Successive refinements must reduce error against an analytic reference
     where available, otherwise show Cauchy convergence; report absolute/relative differences and
     remaining grid pinning. A changed qualitative response or nonconverging sequence blocks
     acceptance. Refine only these bounded fixtures, not the full ecological world.
   - Verify: repeat #4's two fixed-workload measurements with the final spatial implementation,
     now including motion/contact/local delivery, and account the remaining complete-runtime
     headroom explicitly. Preserve the 16 ms spatial allocation and report excluded work. M7
     still owns full 48/2,000/2,000-growth browser/worker/GPU and accumulated-history acceptance.
     Run `make ci`; retain actual output, assay configuration/digests, stopping reasons and negative
     results in the existing evidence workflow. Review final changes for stale executable laws and
     accidental scope. No long population campaigns, seed search or performance-by-extinction.
   - State / evidence: pending; `b51ee8ef-37ae-4077-9139-e2281d100854`.

#### Historical M2 changes and resume — superseded

##### Former prerequisite: cached spatial energy execution

The #4 gate remains blocked: ledger 3787/3788 measured 239.88/246.93 ms per tick after
vector face arithmetic and table-assisted f64 logs. This is a verified implementation cost,
not proof that the physical laws are inherently too expensive. The authorized prerequisite
reorganizes execution of the same functional, with no change to its acceptance or workload.

Sulion branch `100dd3b4-f547-4f51-9c20-bfca5af69b7e` is attached beneath M2 step #4.

1. Owned thermodynamic reductions (`c739cada-b7ac-40f0-82b0-6400c79283bc`, in progress):
   extend `field.rs`, `interaction.rs` and `spatial_numeric.rs` with per-node reductions and
   explicit dirty ownership. Reuse canonical reduction order so derived caches rebuild exactly
   from stored amounts; no stale field or chromosome-owned activity cache. Verify add, direct
   fixture refresh and restore against an independent full reduction.
2. Fused trial/rounded evaluation (`0b31f4ef-6086-423f-aa2f-e9d5adaca89d`, pending):
   update the spatial step and numeric kernels to evaluate the exact proposal and its f32
   representation together, sharing log work with a bounded small-remainder calculation.
   Retain full E/F acceptance, signed rounding and invalid-owner rejection. Verify both results
   against independent evaluation, including zero/subnormal amounts and rounding boundaries.
3. Cache fidelity and cost (`2a0389f7-4243-41d3-b35b-03fef1bf9ed4`, pending):
   run affected physics/continuation checks, then the existing 48/2,000 pair and budgets on the
   final binary with ordinary V8 settings. Record all remaining cost and memory. Return to #4
   only after this prerequisite's results exist; neither branch status nor a faster subset
   certifies the complete M2 milestone.

The expansion makes the production owner, energy-accounting boundary, early cost allocation and
retirement consumers explicit. These are implementation details of the accepted M2 outcome.
M0's passive-field registration described more combinations than its four-case ceiling permits;
the bounded side-swap check above preserves that control without extending the assay campaign.
The 16 ms allocation is a provisional engineering budget, not a new physical constant. Technical
failures first require diagnosis within these laws; an actual change to a settled law is recorded
and brought to the user before implementation.

Use existing passing coverage as a baseline. Add failing behavioral assertions for changed laws
where useful, and exercise new operators through real contracts rather than artificial missing-file
checks. Shared evidence may complete several steps; do not mark them complete early. File locations
may adapt to verified ownership without weakening acceptance or broadening this phase.

Planning validation: `make ci` exited 0 on September 15, 2026: 88 Rust tests and 54 TypeScript
tests passed, with 13 existing ESLint warnings; formatting, typechecking, documentation and
Terraform format checks passed. The first run caught an incorrect ownership-document link in this
expansion; it was corrected before the successful rerun. This validates the planning edit and
current baseline, not the unimplemented M2 physics. Only this root plan was authored in this turn.

Historical next action (superseded): execute step #1, progressing only through M2. Full thermodynamic
biological closure, viability, evolution, visible motion quality and complete browser performance
remain unestablished; they are not inferred from the M2 plan.

### M3 — Implement finite machinery and reaction kinetics

[depends on M2]

- Integrate the reconciled M1 representation under M0's selected rules. Implement shared
  engagement, local exchange, chemical/work feedback and bounded unary transformations through
  manifold kernels and composed operators; exact thermodynamic rate ratios are not required.
- Account shared substrates, products, energy, storage, interface effects and capacity together.
  Retire the old kinetic/compiler consumers as the live owners move; measure coupled execution
  against M0's budget before adding further physiology.
- Exit: `make ci` passes; short probes show finite capacity, interference, meaningful transformation
  alternatives and consistent closed work cycles through the ordinary engine, with measured cost.

### M4 — Integrate embodied growth, remodeling and evolutionary control

[depends on M3]

- Implement M0's lifecycle work/release contract through the M2/M3 owners; a stalled
  thermodynamic remnant process is not independently required. Integrate generic paid assembly,
  repair, internal/external stress, decomposition, motor/storage stocks, gradual funded remodeling
  and actual-stock inheritance. Retire atomic/free-expression and obsolete lifecycle paths as
  their consumers move, and measure the added runtime cost.
- Update RNN channels and genome/state codecs coherently; preserve local control, private learning,
  birth-local assimilation, reproductive options and optional typed transfer.
- Exit: `make ci` passes; actual offspring retain functioning inherited bodies and show continuous
  paid capability changes; supplied life cycles reproduce and depleted controls exhaust resources.

### M5 — Establish the spatial economy and conditional opportunities

[depends on M4]

- Rebuild analytical delivery/lifecycle budgets for the shared laws; tune source inventories,
  replenishment, common washout, spacing, richness variation and useful movement together.
- Validate the ordinary 48-founder/two-colony startup and a small set of appendix opportunities:
  alternate substrates, differential stress, cross-feeding, paid resistant material/degradation,
  detectable emissions and corpse capture.
- Exit: `make ci` passes; calculations and bounded causal probes support local reproduction,
  meaningful transit and contextual costs/returns. Outcomes and failures remain explicitly scoped.

### M6 — Integrate legible observation and exact continuation

[depends on M5]

- Update chemical prevalence, atlas, physical overlays, machinery/flux inspection and spatial
  population views to the new laws while preserving genealogy and uncertainty of group identity.
- Extend revisioned observations, checkpoint/recovery schemas and history through existing owners;
  retain borrowed rendering, bounded publication and independently controlled display options.
- Exit: `make ci` passes; observer noninterference, ownership, bounded transport and exact supported
  continuation pass, and every retained diagnostic meaning has a current representation.

### M7 — Validate complete performance and accumulated-state reliability

[depends on M6]

- Measure full browser/worker and headless workloads at 48 founders, 2,000 varied cells and funded
  reproductive load with all chemical channels available; report model and wall time separately.
- Exercise bounded publication, synthetic accumulated ancestry, save/restore concurrency, storage
  failure and recovery using declared budgets; identify actual operating limits.
- Exit: `make ci` passes; the declared complete workload meets at least 30 ticks/second without
  workload dilution, and working-memory/queue/storage behavior supports the documented continuation
  envelope. Days/weeks of evolved ecology is not a required test campaign.

### M8 — Complete consumer retirement, documentation and motion handoff

[depends on M7]

- Audit the per-owner retirements already required in M0–M4. Finish the consumer disposition
  inventory across current CLI, batches, reports, tests, settings
  and docs. Preserve scientific questions and historical evidence; retire superseded runtime laws,
  hidden old defaults and obsolete schema paths. Reconcile current documentation with implementation.
- Publish the selected laws, default world, short evidence, negative findings, performance envelope
  and observation limits. Verify the build and current entrypoints.
- **[DECISION]** Human motion/legibility acceptance: the user judges useful travel, cell behavior,
  population-scale readability and chemical inspection on the current implementation.
- Exit: `make ci` and `make build` pass; every retained consumer runs the sole new system or is
  explicitly historical, and the user's visual review is recorded before complete handoff.

### Decisions needing your input

| Where | Decision you own |
| --- | --- |
| M8 | Human acceptance of motion and multiscale legibility in the implemented world. |

The architecture direction was confirmed before feature-start. No additional shape-changing
question is open. Formula selection, field rank, numerical fidelity, rates, channel mapping and
coherent implementation details belong to the implementer within these decisions. A new request
to change core identity or the immutable sharing boundary would require an explicit user decision.

## Research basis

- [Rao and Esposito: reaction-network thermodynamics](https://arxiv.org/abs/1602.07257): reaction
  driving forces, reservoir work and thermodynamic consistency. Antropy must define coherent
  accounts for spatial interactions and funded bodies; the paper's equations are not requirements.
- [Gaspard and Kapral: coupled chemical and mechanical motion](https://arxiv.org/abs/1801.00766):
  physical coupling among reaction, concentrations and motion. The detailed molecular/fluid model
  is research context; the selected artificial field laws remain Antropy design hypotheses.
- [Wortel and colleagues: enzyme cost and conditional pathway value](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1006010):
  resource conditions and machinery demand change pathway economics. It supplies no universal
  rate/yield or generalist/specialist tradeoff.
- [Hickinbotham and colleagues: accessible artificial chemistry](https://eprints.whiterose.ac.uk/id/eprint/114475/1/alifej_16.pdf):
  composable operations and reachable variation inform mutation/remodeling design. Their automata
  model is distinct from Antropy's discrete elements and genome/RNN cells.
