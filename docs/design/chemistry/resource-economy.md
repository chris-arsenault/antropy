# Resource economy: model, calibration and checks

Scope after the September 15 design clarification: the equations and measurements below describe
the previous runtime. The [computational foundation](computational-foundation.md) governs new
transport, processing and work rules. Preserve this budget-first method, assumptions and negative
findings, then re-derive affected delivery/lifecycle budgets in M5 from the selected discrete
operators. The spherical capture ceiling and old margins are not constraints or acceptance values
for the redesign; this document establishes no performance or viability result for that system.

Status: implemented; final verification recorded below, September 14, 2026. Plan
`fabff8fc-19a4-4ba6-ad10-6ff41aa73137` owns this work. Operational reliability and
ecological calibration are separate; the reliability plan does not certify this economy.

## Decision and scope

Calculate resource access, material requirements, energetic limits and inherited
investment costs before asking evolving populations to reveal them. Use the production
chemical table, affinities, body construction and transport laws. The analytical model
does not advance cells, select parents, search successful seeds or enter the browser loop.

The immediate questions are whether both supplied chemicals can sustain the seeded
physiology, whether increasing supply actually increases usable intake, whether renewing
sites remain localized opportunities, and whether extra machinery has conditional value.
The changes must retain all 256 chemical possibilities, including persistent impedance;
removing difficult chemistry from the manifold would defeat the experiment.

## Equations and limits

At a location with concentrations C, impedance is J = sum(I_s C_s). An importer's
rate request is its funded stock times turnover, effort and affinity-weighted
concentration, capped by the slot's turnover. Total import of each species is further
capped by 4 pi r D_s C_s / (1 + k J). Inventory headroom, transport energy and shared
field availability can reduce it further. These last constraints make the calculated
rate an upper bound, not a promise of intake by a moving cell.

For a pure species, increasing concentration cannot exceed 4 pi r D_s / (k I_s)
when I_s is positive. Potential energy alone therefore cannot identify usable supply.
The energy budget subtracts maintenance, transport, movement, learning, construction,
repair from captured reaction energy. Conversion preserves chemical matter;
construction transfers it into the bound mixture and pays assembly work without harvesting
reference value. [Checkpoint v20](../../bound-material.md) retains that value and each chemical
identity through growth, repair, division and death. The seeded terminal pathway used by the
perfect-processing calculation remains a metabolic reference, not a universal body composition.

At fixed body stocks and internal material X, a terminal unary substrate with import U
and unsaturated first-order enzyme rate e has inventory U / (e + U_total / X), if
assembly removes the internal mixture proportionally and total inventory is held fixed.
Captured power is reaction yield times e times that substrate inventory. This algebraic
closure exposes the energy lost when assembly consumes feedstock before enzymes process
it. It assumes retained terminal products, no export, no repair, no secondary reactions
and unsaturated enzymes. Report violations rather than silently treating this approximation
as a general metabolic network solver. Repair uses compatibility-weighted external and
internal exposure, the healthy injury rate, replacement matter and its extra work. It
assumes enough repair effort to balance injury and reports when maximum repair cannot.
The perfect-processing calculation bounds the seeded terminal pathway; it must not be
generalized to a genotype with additional energy-yielding downstream reactions.

Patch material satisfies dM/dt = release - washout - net cell capture + net spatial
exchange + decomposition. Global diffusion cancels. For recurring independent batches,
mean supply is batch material divided by batch release duration plus the empty gap.
Since v38 this is `r*T/(T+G)`, where r is the site's fixed release rate, T is sourceLifetime
and G is sourceGap. Initial batch variation and priming are transient; timestep quantization
is excluded from this estimate. There is no separate random lifetime or release-rate draw at
renewal. The report freezes the current composition when predicting chemical delivery.
With unchanged defaults, mean ongoing supply is 8.93% below the preceding random-batch law,
and expected initial material is 21.94% lower. These are calculated changes, not a measured
population response. No compensation multiplier has been added. V39 removes the separate
cohesion washout discount: the configured fractional sink now applies uniformly. Geographic
binding still changes local distribution, so a uniform budget does not predict local access.
Without cells the long-run mean
external material is mean release / washout. This is an inventory reference, not a local
concentration or a carrying-capacity estimate. The unimpeded diffusion/washout length
sqrt(D / washout) provides a spatial scale; concentrated impedance shortens it locally.

The companion spatial report solves the periodic discrete diffusion/washout equation
directly by Fourier division: C_hat = Q_hat / (lambda + D L_hat). It uses the production
Gaussian footprint convention and expected site release. No field timesteps are advanced.
This reference omits consumption and concentration-dependent impedance; it is not a
pointwise bound on the nonlinear field or a prediction of occupied area.

## Implemented calibration

The measurements in this section predate the v38 reservoir simplification. Their random-batch
averages are historical; the current command uses the finite-batch calculation above.

Source selection now ranks `(potential - body potential)+ * diffusion /
((1 + impedance) * (1 + stress))`. This is a property-based supply policy, not a
cell fitness estimate. It includes delivery and penalizes stress, retains chemical-space
separation of at least five units and never runs organisms to choose a world. Seed 101
selects IDs 0 and 80 instead of 0 and 15. The chemical manifold and its coverage tests
are unchanged; slow, high-impedance species remain available for ecological use.

Both new inputs have positive modeled growth margins at total concentration 0.1 for
a fully grown founder body, including half motor effort, learning, transport, assembly
and balanced repair. This holds across the eight existing chemical-generation test seeds.
At seed 101 the pure-source margins are 0.0453 and 0.0174 energy/model second. At 0.03,
both are negative. Abundance and scarcity therefore remain consequential.

Mean renewal gap changes from 120 to 1,200 model seconds; uniform washout changes from
0.0005 to 0.001 per model second. These set distinct pressures: dormant sites interrupt
supply, and washout limits the accumulated background. Batch lifetime/rate variability,
local richness, mixtures, geometry, movement and the 48 founders remain intact. Mean
batch lifetime is 1,100 seconds, so active duty falls from 90.2% to 47.8%. Expected total
release falls from 5.375 to 2.851 material/second and the no-consumer long-run field
inventory from 10,749 to 2,851 material, a 73.5% reduction. Initial priming is a separate
transient and does not change these long-run means.

For seed 101 the hypothetical uniform mean mixture changes from a positive parent
maintenance-and-half-motor margin to a negative one even with perfect processing, before
repair or construction. This is not a claim that a stationary cell cannot maintain itself
at that mean. Local concentration 0.1 remains affordable. The linear spatial reference
has median concentration 0.00751 and 90th percentile 0.1157 after calibration, versus
0.03248 and 0.2616 before. This supports the hypothesis of opportunities separated by
marginal habitat, not a prediction of future patch occupancy. The values depend on the
approximation above.

Extra machinery has conditional returns. A +0.12 importer investment adds 0.0048 built
material and at least 0.0024 construction work to the birth body. At concentration 0.1,
the chemical-0 importer raises modeled surplus by 0.00407 energy/second when 0 is present,
but lowers it by 0.0000458 when only 80 is present. The chemical-80 importer has the
opposite resource dependence: +0.00258 with 80, -0.0000462 with 0. These compare fully
funded phenotypes; birth-local expression and evolved discovery are separate.

## Registered validation

First calculate baseline and candidate budgets without advancing a world. Record source
IDs and full properties, both body stages, dilute and concentrated supply, importer and
enzyme investment contrasts, renewal duty fraction, expected release and washout scales.
Use the fixed chemical-generation test seeds only for deterministic source eligibility
and manifold invariants, not ecological seed selection.

Then test analytical import predictions in a uniform field over one exchange operation:
undamaged funded cells, frozen bodies and controllers, nonbinding internal headroom and
transport energy, with pure and mixed sources and a diffusion-limited chemical. Test
reaction/construction closure only where its assumptions hold. These are mechanics tests.

For ecological integration use the existing first and farthest isolated-source fixtures:
one stationary diagnostic founder per source, mutation and all learning frozen, at most
1,500 ticks or 30 seconds each. A 300-model-second horizon permits acquisition of the
1.32 net material needed for initial division at roughly 0.005 material/second. Stop on
extinction or the horizon and record whether descendants divide. Include one empty control.
Inspect measured import, capture, maintenance, movement, repair, construction and actual
daughter divisions. Do not extend a negative arm automatically.

Finally run one ordinary 48-founder, two-colony startup for 600 ticks/30 seconds with
mutation and learning enabled, preserving initial/final checkpoints and ordinary traces.
Compare against prior ledger 3773, whose 48 founders became 37 cells with two divisions
and 13 starvation deaths. This tests integration, not evolved advantage or coexistence.
Use the existing harness and ledger for these observations; no browser or long campaign.

### Registered follow-up after the initial checks

Rows 3774–3776: the first isolated site funded one division and two growing daughters
by tick 1,500; the weak second site starved its cell at 988; the empty control died at
380. At the weak site, local supplied concentration fell from 0.125 to 0.026 by tick
800, below the model's growing-body maintenance requirement. Its release is 0.033
material/second versus 0.167 at the first site. Making every marginal site viable is
not the design goal. The actual two-colony startup includes nearby sites and funded
26 divisions with no deaths by tick 600 (3777), with 46 and 28 living descendants
in the two starting colonies. Isolating a site removes this neighboring supply.

One follow-up is justified by the first site's measured daughter growth: restore its
tick-1,500 checkpoint, with no interventions, and advance to tick 3,000 or extinction,
30 seconds maximum. The daughters' remaining construction and uptake imply another
division can fit within that interval, before the finite batch runs out. Their stored
matter alone cannot complete the required body and daughter inventory. Record additional
import, construction and deaths so recycled siblings are not mistaken for renewed supply.
Do not repeat the failed isolated second site or expand seeds. This follow-up checks
repeated reproduction, not adaptation, coexistence or survival through every renewal gap.

Follow-up 3778 completed at tick 3,000. Both daughters reproduced, at ticks 1,939 and
1,963; four second-generation cells remained. The interval imported 7.5226 additional
material and built 5.5159, with zero deaths. This rules out sibling recycling as the
source of that construction. It demonstrates repeated funded reproduction at this
finite site, not indefinite persistence or survival through its next renewal gap.

## Reproduce the analysis

From the repository root:

```bash
cargo run --release --manifest-path engine/Cargo.toml --example economy -- /tmp/economy.json
```

An optional second argument is a JSON configuration file. Output creation refuses to
overwrite an existing report. The report includes the resolved configuration, chemical
table, actual tick-zero founder locations/readings, concentration/body cases, inherited
investment contrasts and renewal budgets. It advances zero ticks and is native/headless;
no runtime state arrays are added to the browser bridge. It currently models two fixed
source mixtures and rejects source epochs/zones rather than silently averaging them.

`python3 frontend/harness/economy_report.py baseline.json revised.json new-directory`
creates the local spatial/budget figure and numerical comparison. Matplotlib and NumPy
are the existing report dependencies. The saved [comparison](../../evidence/digital-chemistry/economy/comparison.json)
and [figure](../../evidence/digital-chemistry/economy/economy.png) preserve this calculation.
The directory also retains the exact baseline, access-only and revised model reports.

From `frontend`, `pnpm harness resource-economy-check --output new-directory` runs the
registered three small checks through the existing quick runner and ledger. The explicit
follow-up uses `--continue-first path/to/first/final.bin` with a new output directory.
Raw assay checkpoints, traces and archived WASM remain in ignored local artifacts.

## Verification record

Five new mechanics checks compare analytical imports against actual exchange, verify
the terminal reaction/assembly closure against production metabolism, preserve the
diffusion ceiling under increased investment, check unused machinery upkeep and validate
source opportunities across the established chemical seeds. `make ci` passes: 48 Rust
tests, 52 TypeScript tests, release Clippy, ESLint, formatting, typechecking, documentation
links and Terraform formatting. ESLint retains its 14 existing warnings. The ordinary
600-tick integration takes 2.386 wall seconds, about 252 ticks/second including its headless
frame samples; this is not a new browser/GPU capacity measurement. Worker data ownership
and the renderer were not changed.

An additional `cargo clippy --all-targets -- -D warnings` check surfaced four existing
test-style errors in movement, metabolism and mechanism tests. The repository's standard
release Clippy target passes; this work does not suppress or rewrite those unrelated tests.

## Acceptance and remaining uncertainty

The deliverable is a reproducible analytical command, justified production calibration,
mechanics checks, bounded ecological evidence and reconciled documentation. Positive
analytical surplus establishes a possible budget under stated assumptions. Short repeated
reproduction establishes one realized local life cycle. Neither proves that migration,
adaptation, cross-feeding or coexistence will emerge in the user's continuing world.
