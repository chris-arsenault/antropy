# Enzyme correction and symmetry omissions

Scope clarification: this records the v22 correction, not completion of the user's
group-theoretic requirement. The [transformation algebra white paper](design/chemistry/transformation-algebra.md)
explains why the reflected/interpolated maps below do not represent SE(2) on the actual
chemical state, and defines the outstanding design and evidence obligations.

September 18, 2026. Execution plan: `7a658d05-7255-46a3-88c9-150b87344b7b`.
This corrects the scope of the earlier [symmetry plan](plans/archive/MATHEMATICAL-SYMMETRY-PLAN.md).
The user's request for structured enzyme transformations was narrowed into geometric cost
corrections while the transformation family and convergent founder products were retained.
Those exclusions were implementation decisions, not user requirements.

## Selected correction

An enzyme has recognition center `a`, displacement `d` and inherited angle `theta`:

`T(p) = reflect(a + d + R(theta) (p - a))`.

Rotation preserves relative distances before reflection/discretization. Reflection remains
the explicit bounded-domain operation; it need not be invertible. Each transformed point
still deposits into at most four chemical IDs with nonnegative unit-sum weights. Compile
the rotation matrix once per changed enzyme, alongside the existing sparse coefficients.
Live reaction execution and material/work allocation do not gain a new loop or trigonometry.

Angle is periodic in radians. Mutation uses the existing scalar heavy-tail law and physical
rate; its scale is the existing chemical step scale divided by recognition radius. Thus an
angular step moves a point at the recognition radius by the corresponding arc length.
Refitting pays that same radius times the shortest angular distance, in addition to the
existing recognition and displacement edits. Birth inherits installed machinery; it does
not install a mutated angle for free. Optional diploid expression uses the circular mean;
exactly antipodal alleles have no unique mean and use a declared zero-angle fallback.

Founders use a shared translation from the midpoint of their two recognized source centers
to the existing startup material/membrane center, with zero initial rotation. All four
enzyme slots receive the same displacement. Different source positions therefore retain
their separation before boundary projection, rather than being individually aimed at one
output. The midpoint construction is independent of source ordering. Source selection,
startup material and membrane choices remain explicit starting priors; export transporters
follow the two transformed source centers using the same map. This
change does not claim to remove all startup bias. No species-specific sink is introduced.

The new angle changes persisted chromosomes and installed machinery. Physical checkpoint
v22 rejects earlier schemas. Inspector, genotype distances, fixtures, analytical budgets
and the atlas must consume the same new representation.

## Registered checks

Question: does the ordinary compiler execute the richer transform and preserve distinct
founder outputs, with paid inheritance/refitting and viable conditional resource budgets?
Competing explanations for a failed startup are inadequate conversion work, product
retention/exposure or controller expression; a successful run is not evidence of a food web.

- Zero-tick algebra checks: rotation/reflection covariance, affine composition before
  projection, conservative boundary weights, distinct founder maps and source permutation.
- Bounded mechanics: circular mutation/validation, paid angular refit, unaffected-slot
  sharing, birth-local inheritance, supported snapshot continuation and old-schema rejection.
- Existing analytical economy command before advancement; report negative margins honestly.
- Existing startup runner: one v21 baseline and one v22 run, seed27, 600 ticks each,
  unchanged full mesh2, normal learning/mutation, 120 seconds maximum per run. Stop at
  horizon, terminal outcome or cap. No horizon extension or parameter sweep.
- Existing complete capacity workload once per version if the analytical/startup checks
  allow it, plus full `make ci`. Human motion review remains separate and pending.

## Omission audit

The original request was to audit all mathematics for an organizing transformation language,
without requiring reversibility. The immediately preceding enzyme discussion proposed
rotation plus translation. The implementation plan then excluded new enzyme genes and
required unchanged founders. That narrowed the requested work. A passing coordinate-frame
test did not justify describing the enzyme requirement as complete.

I reread the proposal, the entire original audit and the relevant plan decisions, then
inspected the live functions linked below. The inventory covers simulation mathematics and
its direct analytical/presentation consumers; it is not a fresh line-by-line audit of the
renderer, IndexedDB or every historical diagnostic script.

### Omissions corrected in v22

| What I left out | Earlier decision and consequence | Correction |
| --- | --- | --- |
| A richer enzyme transformation | The audit said to settle costs before more transform parameters; the plan then excluded new enzyme genes entirely. Translation remained the only operation. | Inherited rotation composed with translation, compiled into the ordinary live product operator. |
| Founder product convergence | The plan called founder alleles intentional asymmetry and explicitly kept them unchanged. Each food was individually aimed at the same product. | All founder enzymes share one midpoint-derived translation; their two exact foods have separate product centers. |
| Founder consumer consistency | Both export transporters recognized the common old product. Changing enzymes alone would leave export machinery tuned to the abandoned setup. | Export targets derive from the same transformed food centers. |
| Analytical dependence on the old product | `grossWork` and source-limit reports assumed conversion to `chemistry.decomposition`, even though installed enzymes could differ. | Both now read per-substrate work from the actual compiled enzyme conversions. Throughput-limited budgets continue using the same live coefficients. |

The new angle is included in actual/genetic state, circular mutation and diploid expression,
paid partial refitting, immutable operator sharing, genotype distance, inspector and atlas.
No angle field is silently defaulted while importing an old genotype or checkpoint.

### Decisions retained or deferred, now made explicit

These are not all defects and were not all explicit requests for individual features.
They are the places where I chose a narrower symmetry, deferred a correction, or lacked
evidence. Their reasons below are my engineering judgments, not additional user instructions.

| Decision left in place | Actual mechanism / reason given | Status and consequence |
| --- | --- | --- |
| Chemical boundary distortion | [Recognition](../engine/src/chemistry.rs) truncates a radial kernel; [products](../engine/src/chemical_products.rs) reflect and interpolate. Fewer distinct chemicals exist at corners. | Retained bounded-domain model. Recognition totals differ at corners; reflection can merge products and destroy distance preservation. Rigid-map guarantees apply before projection. |
| Approximate geographic rotation | [Body sampling](../engine/src/footprint.rs) uses four world-axis points; [source sampling](../engine/src/source_footprint.rs) and transport use a square mesh. | Retained finite-cost discretization. Quarter-turn tests do not establish arbitrary-angle accuracy; no new error budget across arbitrary angles was measured. |
| Axis-oriented chemical generation | [Property](../engine/src/chemistry.rs) and [profile](../engine/src/chemical_profiles.rs) bases emphasize particular chemical axes. Validation requires agreement with generated coefficients. | Retained landscape prior. Rotating complete resolved tables in an operator test does not prove that startup generation/validation is representation-independent. |
| Absolute startup reference and initial material | Startup selects a center near potential2; sources are ranked relative to it; [initial bodies](../engine/src/organism.rs) are granted that material. Membrane and one receptor still target that center. | Retained bootstrap choices, not derived symmetry. The v22 midpoint map removes compulsory convergence but not this central bias. Source selection still uses the startup-reference heuristic, not actual enzyme throughput. |
| Identical intrinsic reaction yield for all cells | [Reaction work](../engine/src/chemistry.rs) uses one potential table and shared efficiency; machinery changes access, rate and products. | Deferred differentiated-yield hypothesis. Rotation does not give cells different intrinsic work for the same conversion or prove a food web. |
| Different body and reservoir interfaces | [Bodies](../engine/src/footprint.rs) expose membrane profile times mass; [reservoirs](../engine/src/source_medium.rs) expose a saturating inventory projection. Bound material is sheltered from [inventory stress](../engine/src/sensing.rs). | Retained compartment/interface abstraction. These are not interchangeable owners under a shared scaling symmetry. |
| Unequal feature roles | [Weathering](../engine/src/weathering.rs) and drift use the signed pairing diag(1,-1), with L1 saturation in feature space. | Retained named chemical-feature roles. Arbitrary rotation of those two features alone is not a claimed symmetry; this is separate from the corrected geographic force norm. |
| Phenotype scaling priors | [Genetics](../engine/src/genetics.rs) uses exponential core mass and max(0,1+gene) for optional stock; [maintenance](../engine/src/organism.rs) includes fixed controller cost. | Retained nonlinear body model. The zero-stock plateau and lack of exact extensive scaling remain. |
| Optional diploid encoding and linkage | [Expression/crossover](../engine/src/genetics.rs) averages linear alleles; [one-point crossover](../engine/src/controller.rs) depends on locus order. | Deferred genotype-level redesign. Encoding means are not means of compiled maps. v22 corrects circular angle averaging but declares an antipodal zero-angle convention; that singular case has no rotation-covariant unique mean. Defaults are haploid/clonal. |
| Optional multiple contact transfers | [Transfer](../engine/src/lifecycle.rs) starts each contact from frozen original genomes, so later contacts can overwrite earlier transfers to one recipient. | Known order dependence left unresolved because transfer defaults off. This is a concrete remaining defect when enabled, not a symmetry guarantee. |
| RNG assignment and stopping-order dependence | [Inheritance](../engine/src/genetics.rs) shares a stream across neural/body/chemical draws; [division](../engine/src/lifecycle.rs) assigns draws and limit slots in cell order. | Retained execution semantics. Changing chemical mutation changes later neural/body draws even with unchanged scalar laws. Adding angles does so again. Equal seeds do not isolate the ecological effect of one formula. |
| Retired mutation selector still accepted | [Configuration](../engine/src/config.rs) accepts `mutationKind=gaussian|uniform`, but [mutation](../engine/src/genetics/mutation.rs) always uses the shared heavy-tail law. | Interface debt missed by the earlier audit. Neither choice selects its named distribution. Removing the obsolete selector is still outstanding; this correction does not add another mutation law. |
| SIMD cutoff grouping | [Climate](../engine/src/climate.rs) skips a pair only when both donors are below the threshold; a small lane can execute beside a larger lane. | Retained sparse approximation with numerical-loss accounts. Chemical regrouping can change subfloor operations; the former local cutoff tests do not establish a long-run global error bound. |
| Discrete-time ordering | [World](../engine/src/world.rs) advances sources, field, controller, motion, exchange, physiology and lifecycle in explicit stages. | Retained chosen update law. No timestep-convergence study or invariance under stage permutation was completed. Neither follows from conservation checks. |
| Coincident identical bodies | [Contact correction](../engine/src/movement.rs) uses heading differences; exactly identical headings at identical positions produce no separation vector. | Explicit retained degeneracy. Choosing a fixed compass direction would break the symmetry; this rule does not promise separation in that case. |
| Controller representation guarantees | [RNN](../engine/src/controller.rs) uses local matrix operations and body-relative inputs; action channels have different physical meanings. | Body-relative sensing was inspected. A complete hidden-unit permutation test including plastic traces and assimilation was not added; no certification is claimed. |
| Open sources and authored behavior | [Sources](../engine/src/sources.rs) retain external renewal and geographic priors; the RNN retains mutable founder weights and distinct action channels. | Intentionally retained ecological initial/boundary conditions. Symmetry does not require a closed world or every organism to behave isotropically. |

The earlier pass did correct geographic L1 speed bias, world-X overlap fallback,
taxicab refit costs, raw-offset catalytic cost, duplicate weathering edges, uphill-request
veto of downhill reactions, farthest-slot refit throttling and axis-selected chemical mutation.
Those corrections remain installed; this audit does not relabel them as omissions.

## Verification and limits

The new default map sends source #0 to an equal mixture of #138/#154 and source #80 to an equal
mixture of #218/#234. These IDs follow from the shared displacement (8.5,10), rather than
being selected individually. A mutation can still make #186, and nearby substrates can map
to other products. The retained midpoint/membrane center is #186 for chemistry seed 101.

The zero-tick resource model predicts positive processing surplus for all 48 initial cells:
0.03211–0.03865 work/model-second under its declared inventory and effort assumptions.
This omits live feedback, repair and learning costs; it justified the bounded startup check,
not a prediction of sustained population survival.

| Registered workload | v21 baseline | v22 correction |
| --- | ---: | ---: |
| Seed 27, 600 ticks, full mesh2 | 368.74 ticks/s | 381.22 ticks/s |
| Living cells at 600 | 86 | 111 |
| Funded divisions by 600 | 80 | 100 |
| Saturated 48-cell capacity | 43.70 ticks/s | 43.83 ticks/s |
| Saturated 2,000-cell capacity | 21.26 ticks/s | 21.41 ticks/s |
| Saturated 2,000-growth capacity | 16.26 ticks/s | 16.15 ticks/s |

These single measurements establish no detected material throughput regression: saturated
rates differ by less than 1%. They retain the existing below 30 ticks/s saturated operating
limit. All three capacity snapshots continue exactly after restore. Peak measured WASM
memory is 855,834,624 bytes in the v22 growth fixture. Startup material residual is 4.65e-9
and work/reference residual 3.45e-8. Changes in counts do not establish improved evolution.

Ledger 4026–4033 stores both 600-tick startups and both three-case capacity panels.
The full artifacts remain under `frontend/harness/artifacts/symmetry-v22-*`.
Preserved reports: [baseline startup](evidence/digital-chemistry/symmetry-v22/baseline-startup.json),
[corrected startup](evidence/digital-chemistry/symmetry-v22/startup.json),
[baseline capacity](evidence/digital-chemistry/symmetry-v22/baseline-capacity.json),
[corrected capacity](evidence/digital-chemistry/symmetry-v22/capacity.json), and
[zero-tick economy](evidence/digital-chemistry/symmetry-v22/economy.json).

`make ci` passes 121 Rust tests and 60 Vitest tests, including the Python current-producer
report contract, plus Rust/TypeScript formatting, Clippy, ESLint, typecheck, documentation
links and Terraform formatting. ESLint retains 13 existing warnings and no errors.
The new mechanics checks exercise nonzero-angle reflection/quarter-turn covariance,
pre-projection composition, source-order-independent founder mapping, conservation, periodic
mutation, paid partial/full angular refitting, inherited installed identity and exact restore.
The unpaid-refit check caught a floating-point rewrapping change at zero funding; interpolation
now returns the original angle exactly for zero progress or an unchanged target.

Human motion review remains pending. Historical v20/v21 evidence retains its original
executable/schema meaning. No long evolutionary campaign was run, and no decrease in
eventual #186 abundance is guaranteed.
