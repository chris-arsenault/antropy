# Computable chemistry over a shared manifold

Accepted design direction, September 15, 2026. This document governs mathematical design for
the integrated chemistry revision, under [ADR 0022](../../adr/0022-computable-chemistry.md) and
the [root plan](../../plans/archive/DIGITAL-CHEMISTRY-PLAN.md). It records the user's clarification after
M2's failed spatial cost measurements. The replacement equations and runtime are not implemented
by this documentation revision.

## Design the rules for their computation

Antropy is a purpose-built artificial ecosystem. Physics supplies a shared language for material,
transport, resistance, interaction, work and dissipation. We design the actual rules to produce
coherent consequences for organisms while running efficiently in the declared environment.
Agreement with a known physical process is not the objective or the default correctness oracle.

Choose the discrete update, its data shapes, accounts and operating bounds together. Favor
compositions of compact matrix products, weighted reductions, bounded neighborhood mappings and
short vector operations. Measure their cost before accepting the formulas. Adding SIMD to an
expensive physical solver after selecting its laws does not fulfill this design requirement.

The target remains a world where diverse ecological relationships and evolutionary adaptation
are plausible. Finite uneven resources, meaningful travel, depletion and environmental feedback
create opportunities. Development establishes those opportunities through calculations and small
causal tests; the user's days or weeks of observation reveal the actual evolutionary history.
No community composition, population count or lineage outcome is a design success criterion.

## Identity and authority

Preserve these functions through coherent implementation changes:

- 256 discrete chemical IDs on a smooth bounded 16×16 chemical manifold; deterministic,
  validated property coverage independent of organism success.
- Individual cells with internal mixtures, usable energy, actual built stocks, damage and
  inherited machinery. Initially four receptor, transporter and unary-enzyme slots each,
  plus an installed membrane coordinate. Any internal chemical can fund paid generic biomass.
- Local genome/RNN control, mutation, paid private learning, birth-local assimilation,
  actual-stock inheritance and durable genealogy. Instructions do not grant functioning stock.
- A separate periodic geographic XY world with finite local delivery, shared fields that cells
  both affect and experience, uneven finite sources and one slow extracellular washout rate.
- A usable ordinary startup with 48 founders in at least two colonies, useful movement and
  multiscale observation. Resource geometry and rates remain revisable hypotheses.
- One Rust/WASM owner and same-worker borrowed rendering, bounded observations and exact
  supported continuation under the [immutable sharing contract](data-ownership.md).

The implementer owns equations, property composition, basis rank, discretization, precision,
scheduling and tuning within these constraints. Earlier selected formulas are revisable; they
are not user-owned architectural boundaries. Human motion review and changes to the immutable
sharing boundary remain explicit user decisions. Examples such as gravity, polarity,
impedance×viscosity and stars/solar systems motivate reasoning, not mandatory features or formulas.

## Two domains with different jobs

The chemical manifold is a computational domain, not just an atlas used at world generation.
Nearby coordinates support related properties, recognition and transformations. The geographic
plane locates material, cells and sources. Chemical-space differences determine relatedness and
response; geographic differences determine direction, delivery and encounter. A chemical-space
axis is neither a geographic compass nor an additional spatial dimension.

Use smooth basis functions, compact neighborhood kernels and weighted coordinate mappings over
chemical space throughout the system. Preserve all 256 material identities. A small feature basis
summarizes selected effects; it does not replace inventories with a few anonymous substances or
discard rare compounds. Chemical boundary handling remains explicit and distinct from periodic
geographic wrapping. Existing reflected coordinates are reusable, not an excuse for byte-distance
or accidental chemical torus behavior.

The two-dimensional structure supports reusable separable filters, coordinate transforms and
local product stencils where their assumptions fit the mechanism. Evaluate static property
surfaces at definition creation and installed weighting kernels when installed parameters change.
Then combine their coefficients with live mixtures. Choose the operation for its useful behavior
and full cost; neither arbitrary species-pair enumeration nor a new dense matrix is required.

## Compose the calculation end to end

The following is an architectural sketch, not a selected numerical law. Let C be geographic
concentrations with shape N×256, P a chemical property basis with shape 256×k, and Q a chemical
response basis of the same shape, for small bounded k. Properties and responses are generated
or derived consistently from the chemical manifold; P and Q need not be identical.

```text
H = C P + deposited cell contributions        shared mixture fields, N×k
Vx, Vy = spatial_operators(H)                  shared directional fields, N×k each
chemical_drift_s = sum_a Q[s,a] (Vx_a, Vy_a)    short weighted vector sum
chemical_flux = diffusion + concentration-weighted drift
next_amounts = conservative allocation and redistribution of those fluxes
```

Mixture resistance, stress and processing signals can reuse compatible reductions. For example,
a sum of concentration times two chemical attributes can use their precomputed elementwise
product as one column of P. That sum supplies a scalar mixture quantity; a geographic difference
or shared vector operator supplies direction. It does not require a new per-species force solver.

Use the factored form directly in the neighbor exchange loop where practical. Do not materialize
two full N×256 velocity arrays merely because the notation permits them. Nor should the design
first build cheap fields and then apply expensive nonlinear functions separately to every
species/face, losing the computational benefit downstream. Nonlinearities remain available where
their mechanism is useful and their cost is justified, particularly on the small shared fields.

Matrix notation is not a performance result or a requirement to add BLAS, GPU physics or dense
256×256 operators. Sparse support, fusion, contiguous SIMD loops and precompiled weights may be
the best execution of the same algebra. Count actual traversals, arithmetic, temporary storage,
cache invalidations and synchronization across the whole update.

Composition must reach the material commitment. For local exchange, one sparse geographic W
samples mixtures and its transpose distributes bounded requests; allocate each geographic donor
once and commit its chemical vector once. Compile enzyme product-feedback coefficients from
recognition and the product map, so occupancy is a weighted mixture reduction. Give material
projections and geographic footprints separate lifetimes: motion changes geography, while
inventory/body/membrane changes invalidate material response. Rebuild only installed operators
whose inputs changed. Repeatedly reconstructing these same relationships defeats the design.

For N geographic nodes, S=256 species, k shared features and stencil width w, projecting mixtures
costs O(NSk), shared spatial work costs roughly O(Nkw) for a separable stencil, and response plus
redistribution still visits O(NSk) values in the general case. These counts expose the remaining
work rather than promise that low rank eliminates it. The design must keep each visit inexpensive
and reuse/fuse compatible passes. It must also budget changed cells and machinery, not only the
cheap convolution. Measure arithmetic throughput and memory traffic in the actual WASM execution.

## Diffusion, drift and embodied response

Diffusion plus drift is the accepted transport direction. The previous conservative diffusion
implementation is a useful computational baseline: simple neighboring exchanges, shared medium
coefficients and contiguous chemical vectors. Field-driven drift adds preferential movement,
accumulation and exclusion through composition of shared vectors and chemical response weights.
Zero drift must recover the selected diffusion rule. A resistance gradient changes mobility;
it supplies directional bias only if an explicitly chosen rule gives it that role.

Cells source and sample the same medium using actual material and installed interfaces. Their
inventory can project through the chemical basis; their membrane can supply compact exposure or
response weights. Body extent, damage, motor investment and local resistance affect affordable
movement. Keep funded agency distinguishable from passive displacement in diagnostics.

Select finite-range geographic operators and compatible deposit/sample stencils with bounded
cost. Establish the intended treatment of self influence, contact and cell extent; isolated
deposition must not accidentally propel a cell or generate work. Reciprocity, a potential
functional or discrete energy descent can be useful constructions, but neither a continuum
derivative nor a particular quadrature is mandatory. Test the properties the chosen rule claims.
Local arrival remains finite: fields alter transport, not instantaneous access to distant stock.

## Machinery is computation on chemical space

Receptors are heritable weighting kernels applied to local mixtures, with actual funded stock
and bounded response. Transporters use related kernels to select local internal/external exchange,
with finite engagement, shared donors, storage and work constraints. Cells obtain local sensory
results through these mechanisms; an optimized basis does not expose a property-table oracle to
the RNN.

Unary enzymes apply bounded inherited transformations on the chemical manifold. Weighted product
maps conserve material across discrete IDs and allow nearby mutations to change function smoothly.
Compact matrix or stencil operations combine recognition, substrate/product conditions, installed
capacity and chemical costs. Shared occupancy can model competition for a slot; product feedback
and opposing flows should be expressible without requiring exponential detailed balance.

Precompute chemical-only relationships and installed-parameter operators. Current concentrations,
available work, funded capacity, damage and resulting requests remain live state. Reuse existing
M1 conservative products and cache ownership where valid. Its charge-coupling schema, reciprocal
edge expansion and exact rate interpretation must be assessed against the new rules, not preserved
by adapters solely because they were already implemented.

One composed system should cover sensing, transport, processing, injury, construction, remodeling
and death. Reuse a reduction where it represents the same quantity; do not force diffusion,
stress and energy to become the same attribute merely to eliminate a column. Each remaining
independent coefficient needs a mechanism, range and cost explanation.

## Consistency belongs to the designed system

Material has explicit owners. Neighbor exchange, membrane transfer, conversion, assembly,
repair, birth and death conserve it except for declared external sources/sinks and measured
representation error. Competing requests cannot overdraw donors or reuse prospective products
through incidental iteration order. Zero and tiny amounts need defined behavior without a
global abundance deletion threshold.

The September15 processing-threshold correction introduced a local extracellular concentration
floor, revised to `1e-9` by the September17 weathering work, with numerical-loss accounting and active-region execution in the
[current runtime](composed-runtime.md). It does not remove a chemical identity based on its
total abundance or grant replacement material. This user-authorized numerical resolution
supersedes earlier implementation text that required processing every positive diffusion tail.

Usable energy is funded and bounded. Motors, processing, construction, repair, learning and
remodeling have consistent consequences under the selected accounting rules. A closed sequence
that restores material, body and relevant field state must not manufacture spendable work.
Changing a profile, installing a mutation or deleting a cell must not conceal a subsidy. Define
which fields represent stored energy and which are constitutive transport signals, how external
forcing is booked, and how actual movement is paid. A scalar diagnostic is not automatically
physical energy, and every attenuation is not automatically heat.

An affordable discrete potential or work function may enforce consistency. Local identities,
conservative allocation and justified operator bounds may establish other invariants directly.
Choose that structure with the update. A fixed-temperature bath, logarithmic mixing entropy,
capacitor charge, exponential forward/reverse ratio, cubic crowding and a full global F test after
every event are the previous M0 selection, not requirements of this foundation. Removing them
requires replacing their intended protection explicitly, not simply dropping accounts or checks.

## Acceptance before integration

For the replacement mathematical design, provide:

1. A discrete update and ownership diagram with dimensions, units/conventions, dependency order,
   static versus live terms, and every material/work boundary. State meaningful limiting cases.
2. An execution budget covering the complete composition: chemical reductions, geographic
   operators, species redistribution, cells/machinery, validation, rendering and retained history.
   Include worst-case dense chemistry and changed installed state, not only cached steady state.
3. Small independent checks of conservation, nonnegative owners, work cycles, finite delivery,
   self response, bounded accumulation, mutation continuity and the selected update's limits.
   Compare implementations against these designed rules; agreement with the abandoned M0
   equations is not a fidelity gate. Resolution checks test retained behavior and measured error.
4. A measured release-WASM kernel at the declared workload before expanding integration. Keep
   48 and 2,000 varied-cell cases, all 256 chemicals, configuration/binary identity, 10 warmup and
   100 measured ticks with a 60-second cap per case. Report exclusions and actual model time.
   Re-register only changed predictions and operations; no automatic ecological campaign.
5. Complete-runtime acceptance at at least 30 ticks/s, with headroom sought rather than stopping
   at the minimum. At the comparison dt=0.2, require at least 6 model seconds per wall second.
   A changed clock, mesh or schedule needs matched-time causal evidence and honest workload
   comparison. Fewer founders, missing chemicals, extinction or slowed model time cannot buy a pass.

The current 320×240, h=2 workload and 16 ms spatial allocation are comparison settings and an
engineering budget, not physical laws. Select resolution and scheduling with the formulas;
record any revised allocation against the whole 33.3 ms budget rather than silently waiving it.
Full browser/GPU, growth, diagnostics and accumulated-history acceptance still belongs to M7.

## Evidence and next design work

The earlier M0 established algebraic properties of its reference model, not computational feasibility.
M1 implemented v4 chemical profiles, continuous parameter/compiler structures and physical
checkpoint v12. Ordinary World stepping still uses the earlier diffusion/motion/biology pipeline;
M2's new spatial operators have not replaced it.

The latest measured M2 spatial subset took 239.88/246.93 ms per tick at 48/2,000 cells, excluding
motion, biology and rendering (ledger 3787/3788). Both completed 100 measured ticks with no rejected
substeps. An earlier profile attributed about 43% of samples to field proposals and 49% to full
energy/projection evaluation, while shared-field convolution used about 0.5%. The old diffusion
already traversed all chemicals; nonlinear per-face arithmetic, extra passes, precision and update
frequency distinguish the new cost. Later cache/fused-reduction edits pass nine focused native
tests but remain unmeasured in WASM. None of this certifies the proposed replacement.

Reopened M0 now implements composed diffusion/drift, shared local allocation, finite forward maps
and paid material arithmetic in Rust. Its selected h=4, dt=.2, physiology=.8 schedule retains full
model time. Release WASM takes 8.82/19.24 ms per tick at 48/2,000 cells, within a 22 ms core budget;
14 new bounded checks and full CI pass. [Evidence](../../specs/digital-chemistry/validation.md)
records failed revisions, final binary, actual work, accounts, memory and remaining 11.3 ms budget.

The [root plan](../../plans/archive/DIGITAL-CHEMISTRY-PLAN.md) preserves those results and the concrete
downstream contracts. M1 now supplies one canonical compiler and the subsequent composition
correction: one-row conservative field transport, CSR W/W-transpose local allocation, compiled
enzyme engagement, material projection reuse and dependency-local installed refresh. Final
core measurements are 7.165/15.728 ms at 48/2,000 cells, with a 39.554 ms maximum tick at 2,000.
The preceding timing-allocation pass was insufficient evidence of architectural completion.
M2–M4 still integrate ordinary spatial and biological execution. Earlier completed child records
remain version-specific evidence. This core work has not changed ordinary World stepping or
established complete browser speed, ecological opportunity or adaptation.
