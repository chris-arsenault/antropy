# Mathematical symmetry audit

Date: 2026-09-18. Runtime under review: physical checkpoint v20, commit `f48943c`.
This is an audit of live simulation rules, not authorization to change them.
Existing uncommitted bound-material analysis is independent of this audit.

Follow-up: the [symmetry plan](plans/archive/MATHEMATICAL-SYMMETRY-PLAN.md) implements and measures the
v21 corrections. This audit retains the original v20 findings and evidence; remaining source links now
point to corrected live code; removed refitting code is recoverable from the audited commit. Current rules are in the
[composed runtime](design/chemistry/composed-runtime.md).

## Conclusion

The simulation has a usable shared mathematical structure, but it applies that structure
inconsistently. The main issues are the meaning of distance, chemical boundary behavior,
and which costs belong to a transformation versus its encoding. Adding an enzyme rotation
parameter would not resolve them.

Two concrete inconsistencies deserve correction first: an axis-dependent passive speed
limit and a different metric for chemical refitting than for chemical recognition/reach.
Boundary effects need one explicit interpretation before changing their equations.
Conservative transfers, shared profile interactions and frozen donor allocation already
provide the foundation to retain. None of these findings requires a thermodynamic solver,
reversible reactions, more chemical channels or a larger neighborhood.

## Question and bounded check registration

Do the rules express a consistent transformation language across chemical identity,
spatial interaction, material ownership, physical effort and inheritance? Reversibility,
thermodynamic fidelity and a homogeneous world are not requirements.

Competing explanations for apparent asymmetry are meaningful physical/chemical roles,
intentional discretization and saturation, or accidental dependence on representation.
The decision is which shared mathematical contracts need correction before adding more
enzyme parameters or ecological mechanisms.

The direct-operator example `engine/examples/symmetry_audit.rs` will use chemistry seed 101,
an empty small square field, and fixed constructed inputs, including one unadvanced cell
fixture for installed machinery. It will advance zero World ticks and invoke no mutation,
learning or gene transfer. The maximum
budget is one invocation with a 60-second execution cap after compilation; no horizon
extension or seed sweep. It will check:

- Equal-magnitude geographic forces at 0 and 45 degrees. The current L1 limiter predicts
  a 17.16% diagonal speed penalty at force magnitude one, before grid interpolation.
- Recognition weights at an interior point and a corner, and equivalent reflected
  substrate/product pairs with different raw offsets. These should expose boundary
  semantics rather than establish a universal normalization requirement.
- Chemical quarter-turn covariance of recognition, product weights and weathering when
  coordinates, offsets and resolved property tables are transformed together. Expected
  agreement is within floating-point tolerance; no claim of arbitrary-angle symmetry.
- Geographic quarter-turn covariance of a small field redistribution, with numerical
  rounding tolerance. Square-grid symmetry should hold despite arbitrary-angle limits.
- Species-wise conservation through free/bound transfers, and reaction work/reference
  accounting under an additive shift of the reference-value zero.

Results and the full rule inventory follow below. Rendering,
camera mathematics, chart estimators and persistence encoding are outside this simulation
audit. No long ecological runs are needed to establish these algebraic properties.

## What symmetry should mean here

A change of representation should not change the represented process. Rotating the world
and its gradients should rotate motion; relabeling chemicals together with their properties
and operators should relabel outcomes; exchanging otherwise equivalent cells should not
give the first array entry more food. These are different requirements from reversing time
or requiring every chemical to have the same properties.

Three spaces must remain distinct:

- **Geography:** periodic XY positions and heading-relative sensing/motion. No preferred
  compass direction belongs in a scalar mobility rule. A square mesh approximates this
  geometry and has exact quarter-turn/reflection symmetries, up to rounding, on a square
  domain. Arbitrary angles and sub-grid translations are approximate. A rectangular torus
  itself does not have quarter-turn symmetry unless its dimensions also transform.
- **Chemical coordinates:** the bounded 16 × 16 manifold. Distance, neighborhood and
  boundary rules give transformations meaning. Its fixed property landscape intentionally
  distinguishes regions. Rotating an enzyme while leaving that landscape fixed changes
  chemistry; rotating the entire representation should preserve the corresponding result.
- **Interaction profiles:** two chemical features with distinct attractive/repulsive
  roles. These are not geographic X/Y components. Rotating these features while leaving
  their coupling law fixed is not a required symmetry.

For an operation `F`, the useful requirement is `F(transformed state, transformed rules)`
equals the transformed original result, within declared numerical error. Loss, saturation,
finite capacities, membranes and local environmental variation can all respect this rule.

## Findings

### 1. Passive motion introduces a compass-dependent speed penalty

**Concrete defect in geographic covariance.**
[movement.rs](../engine/src/movement.rs) computes geographic force `f` from shared profiles,
then applies `v = drift × mobility × f / (1 + |fx| + |fy|)`.

For unit force, unit mobility and unit drift, the production function returns speed 0.5
along an axis and 0.4142135624 at 45 degrees: **17.16% slower for the same force magnitude**.
At large force the relative diagonal penalty approaches 29.29%. This happens before
interpolation, so mesh approximation is not its explanation. Both cells and reservoirs use
this function through [source_medium.rs](../engine/src/source_medium.rs).

Recommendation: price the geographic force magnitude with a rotationally invariant norm
while retaining the existing bounded response. This is a shared scalar-rule correction,
not a new movement system. Separately, exactly coincident contacts choose `[1, 0]` as their
separation direction. That degenerate fallback also privileges world X and array order;
use an embodied or explicitly isotropic tie rule when correcting motion.

### 2. Chemical distance changes meaning between consumers

**Concrete metric inconsistency; the intended metric needs to govern all consumers.**

- Recognition uses `K(a,p) = max(0, 1 - ||p-a||²/R²)²`.
- Enzyme reach attenuates turnover by `1 / (1 + ||d||²/9)`.
- `engine/src/refitting.rs` (removed in v37) prices a target move by `|dx| + |dy|`,
  and an enzyme edit by the sum of four absolute coordinate changes. The largest funded
  slot distance also limits progress of the whole refit.

An axis move and a diagonal move of Euclidean length one therefore have equal recognition
distance but refit distances 1 and 1.4142135624. With ample work, the latter takes 41.42%
more time and work for one funded coordinate pair. These numbers are algebra from the live
refit code, not a direct invocation of its private helper.

No inspected design assigns an independent edit cost to chemical X and Y that explains this
taxicab metric. Use one chemical metric, with explicit scale factors only where parameters
have different meanings. An enzyme's recognition-center change and product-map change are
different changes; treating all four numbers as interchangeable is itself an assumption.

### 3. Boundaries give the same manifold several different local meanings

**Measured structural asymmetry; boundary behavior is a design decision, not automatically
a conservation bug.**

Recognition truncates its radial neighborhood at the edge. In a uniform mixture, the sum
of affinity weights is **9.4444444444 at (7,7), versus 4.2098765432 at (0,0)**. The corner
has 44.58% of the interior's recognition weight. This is not directly a 55.42% uptake loss:
occupancy saturation and available mixtures affect actual throughput. The membrane profile
is separately normalized by its affinity sum, while sensing and binding are not.

Products instead reflect at boundaries and retain normalized total weight. Weathering's
four chemical offsets reflect too: at species 0 the destinations are `[16,16,1,1]`, giving
each inward neighbor two directional contributions. This can represent reflecting attempted
steps, but it differs from a graph with one edge per distinct chemical neighbor.

Recommendation: retain a bounded manifold and explicitly define whether its edge means
fewer distinct available chemicals or folded copies of attempted transformations. Then derive
recognition integration, product projection and weathering neighbor weights from that meaning.
Do not normalize every kernel indiscriminately: that could strengthen edge specialists and
change the intended meaning of affinity. A toroidal chemistry would be a larger design change
and is not needed to remove the current ambiguity.

### 4. Enzyme cost describes an instruction, not solely its resulting conversion

**Semantic gap, demonstrated on a shared substrate; not proof of equivalent whole enzymes.**

For substrate #231 at `(14,7)`, offsets `(3,0)` and `(-1,0)` both produce #215 at `(13,7)`
after reflection. Compiled work per unit is identical, but turnover attenuation is **0.5
versus 0.9**. These enzymes can map other substrates differently, so they are not identical
operators. The question is whether reach prices the encoded attempted displacement, the
actual per-substrate displacement, or the whole enzyme's complexity. The present rule chooses
the first without making that distinction explicit.

Reflected translations also do not compose by adding offsets: from x=14, two +3 operations
end at 14, while one +6 operation ends at 10. That is valid bounded map composition; it only
becomes a problem if we describe the genes as unrestricted translations with the usual
addition law.

Recommendation: specify the product map and its composition separately from its kinetic
cost. Keep compiling it into the existing sparse product weights. Establish this before
considering more transform parameters. Translation is already a mathematical transformation;
the missing piece is a consistent account of what it means across consumers.

### 5. Some shared limits couple unrelated capabilities

**Rule-level coupling to review, not a failure of slot permutation symmetry.**

[metabolism.rs](../engine/src/metabolism.rs) computes one funding fraction from all requested
uphill costs and applies it to every enzyme, including downhill reactions. At zero available
work, one positive uphill request can stop otherwise productive downhill reactions. Frozen
accounting correctly prevents spending newly generated work in the same event, but does not
by itself require this additional veto. Similarly, refitting uses one common progress fraction
set by the farthest funded target.

These batch limits are compact and order-independent. Their ecological meaning should be
explicit: either machinery competes for a common activity budget, or only consuming requests
share the work budget. This audit does not change that choice or claim its population impact.

## Structure that already works

### Shared chemical interaction language

Let `p_s` be a species' two interaction features, `H` the geographic mixture signal, and
`J = diag(1,-1)`. Three different operations use the same compatibility pairing:

- Field drift favors a neighboring signal according to `p_sᵀ J ΔH`.
- Body/source passive motion responds to `p_bodyᵀ J ∇H`.
- Weathering favors a product according to `max(0, (p_t-p_s)ᵀ J B(H))`, gated to
  strictly downhill reference value and allocated over four local transformations.

Here `B(H) = H / (1 + |H0| + |H1|)`. This L1 normalization acts on two distinct chemical
features, unlike the problematic geographic force limiter. It is not itself evidence of a
compass bias. The signed pairing is symmetric between profiles; the dissipative response
need not satisfy mechanical action/reaction or store potential energy.

This gives environmental change a shared meaning: material moves toward compatible context,
and exposed chemistry can change toward greater compatibility. Keep this structure.

### Conservative mixtures and frozen allocation

Chemical material is a nonnegative vector `n`. Reference value, impedance, stress and profile
signals are projections of that vector. Normalized spatial weights `W` sample local material;
the corresponding transposed weights distribute requests and deposits. Product columns are
nonnegative and sum to one. Cell exchange, enzyme reactions and weathering reserve donors
before committing changes, preventing one request from consuming another's fresh output in
the same operation.

The v20 free/bound transfer and repair exchange preserve each chemical identity. Death
releases both mixtures; it no longer turns all body material into one decomposition species.
Growth, fission, repair, loss and usable-work accounting remain explicit compartment operations.
The operator probes found zero species-account discrepancy for the constructed transfers,
and reaction reference-account errors below `9e-16`.

### Property surfaces carry meaning without requiring one universal property

[chemistry.rs](../engine/src/chemistry.rs) and
[chemical_profiles.rs](../engine/src/chemical_profiles.rs) evaluate smooth cosine bases.
The generator deliberately gives reference value a strong chemical-X mode, impedance a
strong chemical-Y mode, diffusion an interaction mode, and stress a broader symmetric shape
with perturbations. These are authored landscape priors, not 256 unrelated lookup values.
Independent smooth properties are legitimate: different diffusion and impedance at similar
reference value allow tradeoffs. Forcing all properties to derive from one scalar would remove
those opportunities.

The chemical quarter-turn check transformed the property table together with the geometry;
recognition, product maps and weathering agreed exactly for its inputs. This does not mean
the generator samples every possible orientation or every rotated table is accepted as a new
persisted definition. The generator's axis-aligned priors remain a design choice.

## Inventory of the remaining live rule families

“Consistent” below means the equations have an identifiable organizing rule. It does not mean
all ecological consequences were tested or that every coefficient is optimal.

| Rule family and source | Transformation/scaling meaning | Audit disposition |
| --- | --- | --- |
| [Field diffusion, drift, washout](../engine/src/field.rs), [vector commit](../engine/src/field_vector.rs) | Symmetric face diffusion, signed shared-profile drift, exponential washout; positive bounded donor redistribution | Consistent local operator structure. Square-grid rotation probe differs by at most `1.49e-8` in f32 amount. Arbitrary-angle accuracy is unmeasured here. |
| [Body footprint](../engine/src/footprint.rs), [source footprint](../engine/src/source_footprint.rs) | Normalized local weights; matched sample/deposit suppress isolated self-force | Consistent conservation. Four body sample points are aligned with the grid and approximate a disk; exact continuous rotation symmetry is not claimed. |
| [Source interfaces](../engine/src/source_medium.rs) | Mixture-averaged profiles with exposed reservoir amount `Q/(1+Q/interface)`; bodies expose membrane profile weighted by body mass | Shared features, intentionally different owner/interface responses. Bound composition does not itself determine the body's exposed profile. This is a membrane abstraction to document, not automatically a contradiction. |
| [Finite sources and renewal](../engine/src/sources.rs) | Proportional inventory release; local drift/weathering; externally funded renewal and optional geographic/epoch composition | Open resource input is explicit. Geography/time priors need not be translation/time invariant. Source movement inherits finding 1. |
| [Transport](../engine/src/transport.rs) | Signed effort selects import/export; same recognition and per-amount work; saturating occupancy, donor/room/work bounds | Import and export differ because field supply and intracellular capacity differ. Frozen donor allocation avoids first-cell priority. Exports do not create immediate room or donor stock for simultaneous imports. |
| [Sensing and stress](../engine/src/sensing.rs) | Same radial affinity; heading-relative front/back and left/right differences; saturating readings; linear stress with compatibility discount | Sensory directions rotate with the body. Internal concentration divides by volume. Bound body chemistry is sheltered from the free-inventory stress calculation; construction changes compartment exposure, not chemical identity. |
| [Propulsion and body geometry](../engine/src/movement.rs), [body stocks](../engine/src/organism.rs) | `radius ∝ sqrt(volume)`, motor power proportional to stock, speed from square root of power/drag, work proportional to squared effort | Coherent funded allometry. Scaling all stocks and inventory by λ gives speed ∝ λ^1/4 and turn rate ∝ λ^-1/4 at fixed medium/damage; larger is not universally slower when it also has more motor. Fixed controller upkeep breaks exact extensive scaling deliberately. |
| [Growth, repair and damage](../engine/src/metabolism.rs), [physiology](../engine/src/world.rs) | Proportional funded assembly, frozen mixture replacement, mass-scaled repair cost, saturating stress injury | Shared material/work accounts. Protective reserves and damage thresholds are intentional nonlinearities. Body capabilities are allocated stocks rather than species-specific building recipes. |
| [Reaction work](../engine/src/chemistry.rs), [accounting](../engine/src/accounting.rs) | Work plus dissipation equals reference drop; uphill work costs more, downhill recovers less; turnover has extra changed-material cost | Irreversibility is intentional. Adding a constant to every reference value leaves conversion work unchanged; the probe confirms this within rounding. No profit from a closed chemical cycle under these accounts. |
| [RNN and private plasticity](../engine/src/controller.rs) | Shared matrix operations and odd bounded activation; local inputs; recurrent trace update and paid assimilation | Hidden-unit relabeling requires permuting weights, states and traces together. One-sided swimming/repair and byte writes have distinct meanings. A cell's evolved left/right preference is allowed; isotropic individual behavior is not required. |
| [Mutation and inheritance](../engine/src/genetics/mutation.rs), [gene expression](../engine/src/genetics.rs) | One symmetric heavy-tail step law with reflection, parameter-unit scaling and separate rates; conservative inherited machinery | Good common scalar law. Independent coordinate selection/steps are axis-aligned, not an isotropic chemical-vector mutation law. Core stock is exponential; optional stocks use `max(0,1+gene)`, giving a neutral zero-stock plateau on [-3,-1]. These are evolutionary accessibility priors, not symmetric phenotype changes. |
| [Recombination](../engine/src/controller.rs), [machinery expression](../engine/src/genetics.rs) | Optional diploid means and locus crossover operate on encoded genes | Averaging encodings is not averaging compiled transformations. One-point crossover assigns meaning to locus order. Default clonal fission does not exercise these choices. |
| [Fission, death, contact transfer, disturbance](../engine/src/lifecycle.rs) | Conservatively split owned quantities; heading-relative daughter placement; release identity; optional symmetric donor selection and local mixing | Fission treats daughters equally in material. RNG draws attach to execution order, so array permutation does not imply identical stochastic trajectories. Optional multiple contact transfers can overwrite a recipient from frozen originals in pair order; not used at default transfer rate zero. Population/ancestry caps also introduce order dependence at stopping limits. |
| [Sparse activity](../engine/src/field_activity.rs), [weathering cutoffs](../engine/src/climate.rs) | Concentration floors scale with mesh area; skip negligible donors and inactive channel groups; ledger retains numerical loss | Necessary approximate treatment, not a reason to process zeros. SIMD partner lanes can cause threshold-level differences under species regrouping. Bound the error rather than require bitwise equality or remove sparsity. |
| [Tick/physiology schedule](../engine/src/world.rs) | Explicit staged updates, with faster movement/maintenance and accumulated physiology intervals | Time reversal and exact timestep equivalence are not requirements. Reordering stages changes the model. This audit does not establish step-size convergence. |
| [Founder and source selection](../engine/src/genetics.rs), [startup chemistry](../engine/src/chemistry.rs) | Founder targets species nearest reference value 2; supplied feedstock ranked by deliverable value; startup body grant uses the selected species | #186 is privileged by this chemistry's founder choice, not by an ID-186 runtime reaction exception. Startup uses an absolute reference convention; a reference-zero change would also need to transform these priors. |

## Recommended shared contract

Adopt one small operator language across the existing implementation:

1. **State and projections:** owned nonnegative mixtures; linear material/property
   projections; explicit free, bound and external compartments.
2. **Geometry:** a geographic vector norm; a chemical metric and boundary projection;
   separately named interaction features and their signed pairing.
3. **Transformations:** bounded maps compiled to sparse conservative product columns.
   With column-vector convention, a chemical conversion is `Δn = (P - I) r`, where `r`
   contains accepted donor amounts. Compose the compiled maps, rather than assuming their
   gene parameters add through reflections. Retain self-product weights consistently.
4. **Rates and constraints:** common recognition, saturation and frozen donor/work
   allocation. Separate the requested transformation from how much can be funded.
5. **Accounts:** reference change follows `U·Δn`; usable work and dissipation balance it.
   Transport, construction and repair preserve chemical identity while paying their stated
   work costs. A transformation need not have an inverse to obey these accounts.

This is chiefly a contract for the existing arrays, reductions and compiled operators, not
a proposal for another runtime framework. It should yield small metamorphic checks: transform
an input, run the same operation, and compare the transformed outcome. Cover geographic
frame changes, chemical relabeling with properties/operators, cell/slot permutation, material
scaling where applicable, and closed work accounts. Keep sparse execution and current
ownership/cache boundaries.

The next implementation should correct the geographic norm and degenerate contact direction,
then unify chemical distance and settle boundary/cost semantics before adding enzyme degrees
of freedom. Mutation's vector geometry should follow that chemical contract, using the existing
heavy-tail principle, rather than acquiring another bespoke distribution.

Symmetry alone will not establish a food web. A single reference-value landscape and shared
conversion efficiency still give every cell the same intrinsic work difference for the same
reaction. Machinery, inhibition, stress, medium and access can change its net benefit, but
this audit does not resolve the earlier hypothesis about differentiated energetic returns or
prove that waste consumption will evolve.

## Evidence and validation

The [direct-operator results](evidence/digital-chemistry/symmetry-v20/operators.json) came from
[symmetry_audit.rs](../engine/examples/symmetry_audit.rs): one invocation, 0.07 seconds after
compilation, zero World ticks. Chemical product checks covered all 256 substrate IDs with
four offset choices; weathering and recognition quarter-turn checks covered all 256 IDs.
The field check used 64 nodes and one operator interval. These are bounded counterexamples
and invariant checks, not a formal proof over every state or a browser/ecological assay.

Reproduce into a new output path:

```bash
cargo run --manifest-path engine/Cargo.toml --example symmetry_audit -- /tmp/new-symmetry-audit.json
```

The audit read live simulation rule bodies, including selectable lifecycle and inheritance
branches. It used current code rather than stale structural-index version labels.
`make ci` passed: 104 Rust tests (87 unit and 17 integration), 60 Vitest tests, formatting,
Clippy, TypeScript, documentation links and Terraform formatting. ESLint reported 13 existing
warnings and no errors. Passing tests include shared uptake under reversed cell order,
body/source self-force, reflected mutation and material accounts. These tests establish their
bounded invariants, not universal symmetry. Runtime equations and defaults remain unchanged.
