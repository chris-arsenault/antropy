# Resource binding proposal

September 19, 2026. Selected proposal, supported by the
[force investigation](resource-binding-investigation.md) and bounded diagnostics below.
Investigation plan `e82be48c-7411-4228-8ac4-83f74560a7a7`.
Implementation belongs to environmental root `5e88cd8a-1314-4622-9989-4bb02af68581`.
Implementation started September 19 after baseline commit `70ef791` was pushed.

### Integrated execution registration

B1 integrates all three mechanical consumers at length 6 and retains the length 0
identity-kernel limit for comparison. Derived buffers are rebuilt, never persisted;
the added configuration field advances the physical checkpoint to v28.

B2 runs the same seven-source irregular neighborhood using ordinary `World::step`:
one 100-tick pilot, followed by paired length 0/6 cases through 3,000 ticks, with a central
batch near depletion and one empty source 120 model seconds from ordinary refill.
Freeze mutation, transfer and learning; there are no cells in this source fixture.
Then use the existing funded role 2 diagnostic cell for 300 ticks with active versus
identity enzymes, static learning, zero mutation/transfer, and the same funded bodies.
Measure actual uptake, reaction, export, material/work accounts and the resulting
source force. This distinguishes cell-mediated chemistry from an externally supplied
product patch. Stop on extinction or 120 seconds per case. No horizon extension.

B3 uses the ordinary 48/2000/2000-growth WASM capacity panel, 100 ticks after 10 warmups,
60 seconds per case, comparing the captured v27 kernel with v28. Retain the growing
case's existing sub-30 ticks/s limitation separately from added cost. Register one
isolated browser operational check against the existing server for rendering/errors
and the new default configuration; this does not replace the user's motion review.
No new server or long population campaign.

The first capacity pair put the 2,000-cell added step cost at 1.014 ms, too close to
the 1 ms budget for a single 100-tick sample. Register two additional alternating
baseline/candidate capacity panels, with unchanged workloads and horizons, to
resolve that decision. The cell identity control died at 48 ticks; register a paired
40-tick follow-up before either cell dies, including force measured with body
contributions removed from a diagnostic field clone. This isolates extracellular
chemical feedback from the control's death and subsequent biomass release.

## Implementation results

B1 and B2 are implemented and checked. B3's automated operating checks are complete;
the user reports initial visual acceptance: "it looks mostly healthy" while continuing
observation on September 19. This closes the initial motion review, not long-run persistence.
[Retained results](../evidence/digital-chemistry/binding-v28/README.md)
record ledger 4124–4151, ordinary World probes, capacity comparisons and an isolated
browser check. The initial accumulated work was committed and pushed as `70ef791`;
the v28 binding implementation follows it locally.

- All three consumers use one derived field at the selected six-unit reach. The cache
  compares actual combined input, so mutations through intervention and diagnostic APIs
  also invalidate it. Unchanged and exactly zero inputs avoid convolution. Equal opposite
  kernel weights share output reads/writes; this is the same convolution up to roundoff.
- The ordinary seven-source run completed 3,000 ticks through depletion and a 54.46-unit
  refill. Widest separation changed from 33 to 31.61 versus 32.82 with local attraction.
  Median separation ended at 17.37 versus its initial 17: persistence is unresolved.
- At tick 40, the funded active cell imported 0.17165 units of chemical 136, converted
  0.18582 units from 136 to 8, and exported 0.17843 units of 8. The identity control
  converted zero and exported 0.16571 units from its initial inventory. Both were alive.
  Removing body contributions from the diagnostic force calculation still left a
  source-velocity difference of 2.89e-6 world units/model second. The effect is small
  against the fixture's large reservoir background; it establishes a feedback path,
  not useful colony-scale regulation. The active cell reached 300 ticks; the identity
  control exhausted usable energy at tick 48.
- After pairing the kernel weights, ordinary WASM step cost increased by 0.31 ms at
  48 cells and 0.28 ms at 2,000 cells against the captured baseline. Operating rates
  were 86.35/36.89 ticks/s versus 88.62/37.21. The growing case reached 23.54 ticks/s;
  its preexisting failure to reach 30 remains open. These fixed short workloads do not
  establish mature-world or 16-times-area performance.
- The existing-server browser check reached tick 391 with 56 cells, no runtime errors
  or alerts, a working borrowed renderer and a successful manual save. This checks
  operation and startup, not visually acceptable motion over ecological timescales.

The physical checkpoint is v28 and rejects earlier bytes. No compatibility adapter,
new climate driver, fixed wells, extra transport steps or multicore work was added.
Initial geography and other physical constants remain unchanged.

Final `make ci` passed: 140 Rust unit tests, 17 integration tests, 62 frontend tests,
formatting, clippy, ESLint, TypeScript, documentation and Terraform format checks.
The 12 existing ESLint warnings remain. Current-schema report readers and assertions
were updated after CI exposed their stale v27 expectations. B3's initial human motion
review is recorded above; the growing-capacity and long-horizon limits remain open.

## Proposition

Give the existing attractive material feature a six-world-unit spatial interaction length.
Retain local signed repulsion and nonlinear crowding pressure. Apply the same mechanical
field to reservoirs, cells and dissolved chemicals. Keep source release footprints, chemical
diffusion constants, renewal, transformation work and biology unchanged.

This supplies a neighborhood-scale restoring force generated by current material. Sources
separate when crowded and pull together when separated; changing composition and finite
stock alter that balance. No cluster center, home coordinate, geometric well, migration
driver or target population enters the law. Homeostatic equilibrium is a valid outcome.

## Registered dynamic check

Question: does the longer-range attraction retain a finite, irregular resource neighborhood
while stocks deplete and refill, and does a localized chemical change alter its balance?
Competing outcomes are maintained cohesion, collapse, or continued dispersal despite the
static restoring response. The result selects or rejects the candidate before a concrete
implementation proposal. Migration and continual motion are not objectives.

Use the ordinary source advance, projection, release, inventory processing and field operators
in `engine/examples/resource_binding_dynamics.rs`. The proposed mechanical field changes source
velocities only in this diagnostic. Chemical exposure remains unfiltered; dissolved transport
retains the existing law. There are no cells, mutation or learning. This is a resource-mechanism
probe, not evidence for a fully integrated simulation or cellular homeostasis.

Seed 27, chemistry 101, 128 by 128, seven radius-3 sources, one central and six asymmetrically
placed at radii 16 and 17. Keep default batches and renewal parameters, except the center's
initial finite batch expires after 40 model seconds (its release rate is stock/40). That
constructs a depletion event within a short horizon without accelerating continuing renewal.
No field priming. Candidate length 6; pressure strength 0.003 and other physical constants
stay at defaults. Compare current law, candidate, candidate with a chemical-8 patch, and
candidate with an equal chemical-128 patch. At tick 1000, each patch adds 12 accounted material
units through one source's existing footprint, representing local product accumulation.
It is an external diagnostic perturbation, not a claim that living cells produced that patch.

First run a 100-tick candidate pilot and inspect accounts/execution cost. If valid and fast
enough to fit the declared budget, run four cases to 3000 ticks, each capped at 120 seconds.
Total budget 12,100 ticks and 480 seconds plus the pilot; no extensions or seed sweeps.
Record positions, finite stocks, renewal, pair distances and resource accounts every 100 ticks.
Reject nonfinite state or account failure. Keep negative or wall-capped outcomes.

Measure the proposed shared filter separately on the current 160 by 120 grid and a 16-times
larger 640 by 480 grid. Use one combined attractive row, a separable normalized Gaussian
truncated at three length scales, length 6 and mesh 2: 19 weights per axis. Reuse buffers;
accumulate contiguous periodic slices without modulo in the inner arithmetic loop. Report
100 measurements after 20 warmups. Native timing is not browser/WASM whole-tick evidence.

## Selected implementation

### Shared law and defaults

Retain the existing material reductions A and B (signed features) and L (positive load),
and every chemical/owner's current profile `(a, b, i)`. Select:

```
A_ell(x) = sum_y K_ell(x - y) A(y)
F = a grad(A_ell) - b grad(B) - chi i L_other grad(L)
```

Finite owners retain exact subtraction of deposited self-load in `L_other`. Dissolved
transport retains collective pressure `P(L) = chi L²/2` and its conservative face difference.
Only the attractive difference changes from A to A_ell.

Add one shared physical control, `attractionLength = 6` world units. Retain pressure strength
0.003, source drift 4, dissolved/passive drift 0.25, mobility and velocity bounds. There is
no separate attractive amplitude or owner-specific reach. Six retained a repulsive core in
all three static circuit-mixture fixtures and restoring response at 16–24 units. Length 3
failed the repulsive-core check for 0/8. Six is a selected initial default, not an optimum
or a prescribed cluster radius.

K is a normalized separable Gaussian on the periodic grid, truncated at three lengths
on each axis. At mesh 2 use offsets -9 through 9 and weights proportional to
`exp(-(2 j)² / (2 * 6²))`. Normalize the one-dimensional weights to sum to one and use them
on both axes. These are artificial constitutive rules; no gravity, inertia, fluid solver
or thermodynamic free-energy model is introduced.

Chemical profiles continue to determine response to the shared field. Uptake, export,
transformation and embodied material change A, B and L. Empty reservoirs emit no material
field but retain their ordinary response to neighbors and renewal. Do not invent a
permanent binding contribution for an empty source.

### Numerical owner and update schedule

Rust's field owner gets one derived attractive grid with reusable input and temporary
buffers. Combine the attractive row from dissolved material, finite source projections
and funded bodies, then apply two separable passes. The diagnostic implementation in
`engine/examples/resource_binding/kernel.rs` selects contiguous periodic slices without
modulo in the inner arithmetic loop. Evaluate one scalar row, not 256 chemical fields.
The kernel preserves signed sums and constant fields.

Keep full geographic resolution. This is a mechanical field, not inventory: filtering
does not move food or grant usable work. In particular, retain the current source release
footprints. Chemical sensing, uptake, stress, weathering and transformation work continue
to read raw material reductions.

Preserve stage ordering and current inputs:

1. Refresh A_ell after current body deposition and source projection, before source responses.
2. On physiology ticks, refresh after source movement/release and before field transport.
3. Refresh after field transport (or source updates on other ticks), before cell motion.

Cache by actual attractive-input revision and skip absent consumer stages. Moving an empty
source alone does not invalidate the field. Recompute kernel weights only when dimensions,
mesh or length change. Use exact zero support and unchanged revisions for work elimination;
do not add a separate weak-force threshold or activate empty chemical groups merely because
the mechanical field reaches their nodes. Temporal decimation is not selected.

With populated changing inputs, expect at most two refreshes on non-physiology ticks and
three on physiology ticks: average 2.25 with the present four-tick physiology cadence.
One-refresh timing is not whole-tick cost.

### Integration, symmetry and ownership

- `Field::gradient` samples A_ell in the attractive component for sources and cells.
  Both retain the common profile contraction; paid cellular motors remain unchanged.
- `Field::coefficients` uses the face difference of the same A_ell and computes the
  existing drift bound from that difference. Retain donor availability, outgoing-fraction
  limits and the transport pass policy. Do not add transport substeps for filtering.
- Keep `medium_signal` and all chemical responses unfiltered. The derived mechanical
  view must not silently change the chemistry again.
- Verify periodic translation, grid rotation/reflection, chemical relabeling with all
  profile tables, zero isolated self-force and the identity-kernel limit. The even kernel
  and matched deposition/sampling supply the self-force cancellation; retain those operators.
- Rust owns these arrays. Rebuild derived buffers after restore; persist only the new
  control through ordinary configuration/checkpoint handling. Do not serialize the cache,
  copy fields into React observations or add full-field worker messages.

### Cost and acceptance budget

The native optimized filter measured 0.240 ms per refresh at 160 by 120 nodes and 4.965 ms
at 640 by 480 (16 times the area). Three f64 buffers use 460,800 and 7,372,800 bytes.
These figures exclude input gathering, gradients, revision bookkeeping and the rest of
the tick. They are not WASM measurements.

At 2.25 refreshes that is approximately 0.54 ms of filtering per tick now, or 11.17 ms at
16 times the area. This is a material scaling cost; the proposal does not complete the
10–20x world expansion. Added work is proportional to geographic nodes, independent of
chemical count and population, rather than an all-owner pair scan.

Integration targets at most 1 ms mean added whole-tick time on the current map in the
ordinary WASM 48-cell and 2000-cell cases, preserving the existing 30 ticks/s minimum.
If it misses that budget, optimize the shared evaluator and redundant refreshes before
changing force constants, resolution or reach. Report the operating limit. Native timing
does not pass the ordinary WASM gate.

## Dynamic findings and limits

Ledger 4117–4123 records the pilot, four primary cases and paired renewal follow-up.
All reached their registered endpoints with valid material/work accounts. Each 3000-tick
case took 0.67–0.98 seconds natively. These cell-free diagnostics modify source motion only;
candidate integration into dissolved and cellular motion remains untested.

The ordinary finite-stock case's widest source separation changed from 33 to 32.86;
the candidate changed it to 31.97. However, candidate median pair separation first fell
and then rose from 17 to 17.53. This is reorganization with an unresolved late trend,
not proof of a lasting bound state. The recommendation rests on the restoring force and
its composition dependence, not a claim that this short trajectory solved dispersal.

The equal local chemical-8 and chemical-128 patches produced different reorganizations:
final median pair distances were 17.01 and 17.82. This establishes response to local
composition under unchanged constants. It does not establish that evolved cells create
those patches or that either state supports a productive colony.

No source renewed in the first four cases. The follow-up began with one already empty
source whose ordinary remaining wait was 120 model seconds. Both variants received the
same 54.46-unit refill. Widest separation finished at 31.60 for the candidate versus 32.82
for the current law. Reorganization continued; equilibrium was not established.

[Retained evidence](../evidence/digital-chemistry/resource-binding-proposal/results.json)
includes sample positions, stock/renewal summaries, accounts, hashes and filter timings.
Full inventories remain in the local harness artifacts. These checks support implementing
the selected law; they do not certify prevention of the 754k diffuse outcome.

## Implementation sequence

**B1 — Shared field and all consumers.** Add the selected mechanical length, evaluator,
revision tracking and stage freshness. Wire source motion, cell passive motion and
dissolved face transport to it. Preserve raw chemistry, accounts and physical ownership.
Check bounds, self-force, symmetry and the identity-kernel limit.

**B2 — Binding under local chemical work.** Repeat a small neighborhood through finite
depletion/refill using ordinary integrated World stepping. Include an asymmetrically
displaced source and local product change. Verify restoring response outside the binding
interval, repulsion under crowding and changed balance under composition changes. Replace
the supplied product patch with a funded diagnostic cell and verify its real uptake,
transformation and export alter the forces. No prescribed evolved community or long campaign.

**B3 — Serial cost and visible review.** Compare ordinary WASM whole-tick cases against
the current baseline at full resolution, meet the budget above, run `make ci`, and present
the normal default world for user review. A coherent stationary cluster is valid; visible
collapse or breakup is not excused by pair tests. Longer ecological observation follows
these checks if it answers persistence beyond the mechanism horizon.

Keep initial source placement and all other physical constants unchanged in this pass.
Establish binding before retuning geography. Solar forcing, rotation, elevation, multicore
and wider-world scaling remain separate later work.

## Renewal follow-up registration

All four 3000-tick cases finished in under a second each with valid accounts. Sources depleted,
but none renewed before the fixed endpoint: default waiting times are longer than this probe.
Do not extend the horizon to wait for an event. Add one paired 3000-tick check initialized with
source 2 already empty and 120 model seconds of its existing wait remaining. It then refills
through ordinary `Source::advance`; later renewal settings stay unchanged. This adds 6000 ticks
and two 120-second caps, specifically to check a refill inside a bound neighborhood. Keep the
earlier no-renewal result. Compare only current versus candidate, without another patch sweep.
