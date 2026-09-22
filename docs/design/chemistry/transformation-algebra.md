# A transformation algebra for Biotropy

## Status and purpose

White paper, September 18, 2026. **Pure design record.** Its original publication did not
implement or validate these ideas. Subsequent execution selected and implemented the v23
finite action and bounded kinetic mixtures; see the canonical plan's
[selected law](../../plans/archive/MATHEMATICAL-SYMMETRY-PLAN.md#a0-execution--bounded-permutation-algebra)
and [evidence](../../plans/archive/MATHEMATICAL-SYMMETRY-PLAN.md#a4-results). Human review passed on the
deployed v23 run through 100,000 ticks. Proposals, open choices and references to the current runtime below describe the
v22 design starting point; the execution record owns their disposition.
This paper records the user's requirement for an organizing mathematical language based on
groups and their actions. It defines what future work must demonstrate before claiming that
requirement is complete. Completing this document does not complete the simulation work.

Execution is tracked only in the [canonical mathematical plan](../../plans/archive/MATHEMATICAL-SYMMETRY-PLAN.md#chemical-geometry-correction),
current root `dfb36e51-2cd4-4688-9978-bd82e9179238`, phases B0–B3. Completed A0–A5 remain
historical evidence. The follow-up corrects a privileged potential slope, recognition/action
coupling, mutation units and missing funded environmental returns. Exact group membership
alone did not establish those ecological opportunities. This paper supplies design and
evidence obligations; it is not a parallel plan. Environmental plans remain separate.

The [computational foundation](computational-foundation.md), [principles](../../principles.md)
and [data-sharing contract](data-ownership.md) remain governing constraints. The physical
analogy supplies mathematical discipline, not a requirement to reproduce thermodynamics,
relativity or quantum dynamics. Preserve the artificial ecosystem, its discrete chemicals,
local evolving controllers, funded bodies, shared vector calculations and bounded execution.

The central recommendation is to use **exact finite actions on discrete chemical identities,
with irreversible dynamics constructed from those actions and shared local coefficients**.
Continuous parameters may control recognition, rates and mixtures without being mislabeled
as an exact continuous group action on 256 chemical bins. This is a recommended direction,
not approval of a particular generator set, new genome schema or kinetic formula.

## Abstract

Biotropy's earlier symmetry work corrected directional biases and added rotations to enzyme
product maps. It did not establish a coherent group action on the chemical state actually
executed by the simulation. Reflection at the chemical boundary and interpolation between
chemical identities invalidate the unrestricted rigid-motion composition law. Tests of the
formula before those operations cannot certify the compiled operator after them.

The remedy begins with a state space, transformations acting on that space, preserved
quantities, and composition rules. It then derives compatible sensing, transport, conversion,
costs and inheritance. Exact symmetry operations and irreversible physical updates have
different obligations. A reaction may consume work and lose information while still obeying
the same transformation law as every other reaction.

This paper supplies that distinction, a finite-state construction demonstrating feasibility,
the decisions still required to select useful enzyme transformations, and an evidence contract.
Symmetry should reduce independent choices and expose hidden preferences. It does not by
itself guarantee recycling, equal chemical abundance, ecological diversity or evolution.

## 1. The failure this design must prevent

The [v22 audit](../../symmetry-completion-audit.md) records three different accomplishments:
geometric cost corrections, a rotation parameter in enzyme maps, and founder changes removing
deliberate convergence of two foods onto one product. Each has a useful but limited meaning.
None establishes an end-to-end group representation.

Before projection, the enzyme map is a planar rigid motion, expressible as

\[
T(p)=Rp+t.
\]

Rotations and translations on the unrestricted plane form the Lie group SE(2). The current
runtime instead reflects the result into the square and interpolates among discrete products.
Even an integer translation fails: on coordinates 0 through 15, translation by +3 sends 14
to 17, which reflects to 13; translation by -3 then gives 10, not 14. Two +3 operations give
14, whereas one +6 operation gives 10. The projected maps do not represent translation
addition. Function composition remains associative; the claimed group correspondence fails.

Bounds on representable displacements also mean that the gene family is not closed under
arbitrary rigid-motion composition. Adding an angle does not resolve either problem.

Future work must not narrow the requirement to cheaper costs, visually balanced movement,
conservative interpolation or a rotation test around a helper function. It must identify the
actual algebra and show that ordinary runtime consumers implement the stated relationships.

## 2. What group theory contributes

A group is a family of operations closed under associative composition, containing an
identity and an inverse for every operation. Closure means a sequence has a meaning within
the same family. Inverses concern the transformation; they do not promise that an organism
can afford the reverse reaction or that the world can run backward.

An action specifies how the abstract operations affect an actual state. If `rho(g)` is the
operation on state corresponding to group element `g`, the central obligation is

\[
\rho(e)=I,\qquad \rho(gh)=\rho(g)\rho(h).
\]

The second equation says that composing the descriptions agrees with successively acting on
the state. It must hold at the representation where the claim is made. A correct equation
on continuous coordinates does not transfer automatically to a projected chemical inventory.

A transformation is a symmetry of a law when the law respects its action. For an update `F`,
state `x` and environmental/definition data `b`, the relevant statement is

\[
F(\rho(g)x,\sigma(g)b)=\rho(g)F(x,b).
\]

This is equivariance: transform the complete situation and then update, or update and then
transform, and obtain corresponding results. Invariance is the scalar case, such as unchanged
total material or a cost independent of an arbitrary coordinate orientation.

Background data matter. A chemical potential landscape, a directional medium or a particular
founder can break a symmetry of a specific world. Transforming the inventory while keeping
its property table fixed generally describes a different experiment. Transforming both tests
the law's consistency. Relabeling everything consistently is necessary but weak evidence;
it does not establish a useful chemical geometry or a meaningful catalytic transformation.

## 3. The relevant lesson from relativity and quantum mechanics

In general relativity, geometric and matter fields transform together. Covariant equations
describe their relationships independently of a coordinate chart. This differs from an
isometry, which preserves the geometry of a particular spacetime. The useful lesson here is
to specify how every participating object transforms, including the background, rather than
rotate one vector and leave the rest implicit. [Tong, General Relativity, chapter 4](https://davidtong.org/pdfs/teaching/general-relativity/gr4.pdf)

Quantum mechanics gives a second example of structure constraining transformations. Symmetries
preserve transition probabilities between states; Wigner's theorem relates these symmetries
to unitary or antiunitary operators on the underlying Hilbert space. The representation is
restricted by what must be preserved. Biotropy's nonnegative material inventories have
different structure and therefore admit different transformations. [Simon et al., Wigner theorem](https://arxiv.org/abs/0808.0779)

Neither example licenses importing a famous group by name. A Lie group is appropriate when
its smooth action fits the chosen state space. Affine transformations are appropriate when
their treatment of distances, boundaries and measures fits the model. Conservation requires
its own accounting argument; invoking symmetry or Noether's theorem without the necessary
variational assumptions does not supply one.

## 4. The finite-state constraint

At one material owner, represent the 256 chemical amounts by a nonnegative column vector
`c`. Total material is `1^T c`. A linear, amount-independent redistribution is a matrix `P`
with nonnegative entries and columns summing to one.

Suppose both `P` and its inverse must map every nonnegative inventory to a nonnegative
inventory and preserve total material. Then `P` must be a permutation matrix. One short
argument restricts the map to the unit-mass simplex: an invertible linear map preserving
that simplex in both directions must permute its extreme points, the pure-chemical states.

Consequently, a nontrivial continuous rotation group cannot act continuously through exact
linear positive mass-preserving transformations on these 256 amounts. The permitted exact
operations form a finite permutation group; a continuous action of a connected group into
that finite set is trivial. This conclusion assumes linear, amount-independent actions.
It does not prohibit nonlinear invertible maps of mixtures or richer hidden state, but those
would be different semantic and computational commitments requiring separate justification.

Interpolation is a valid physical mixing operation. Its positive inverse generally does
not exist. It must be named and tested as mixing, not presented as a group operation whose
algebra survives discretization. Likewise, padding, clipping or reflection is not an inverse.

This leaves a real design choice. The recommendation here preserves the existing discrete
state and uses exact finite actions. A future continuous-action proposal would need an
explicit richer representation or quantified approximation contract. It cannot silently
change chemical topology to a torus, allow negative amounts, or add hidden sub-bin state.

## 5. Recommended structure: geometry, transformations, dynamics

These three layers share definitions but make different claims.

### 5.1 Chemical geometry and its symmetries

The chemical domain remains a bounded 16 by 16 square with 256 distinct identities. Its
neighbor relation, metric and boundary are explicit mathematical data. The square has an
exact geometric symmetry group D4: four rotations and four reflections. These operations
permute the actual bins while preserving square adjacency and Euclidean distances.

D4 is the recommended exact geometric baseline. Its small size is a consequence of this
domain, not a reason to pretend that arbitrary rotations also preserve the grid. Boundaries
distinguish corners from interiors; D4 does not erase that distinction. Chemical-property
tables and machinery parameters transform with the bins. A particular generated landscape
need not itself be D4-invariant.

D4 alone is insufficient as the repertoire of enzyme chemistry: it preserves distance from
the square's center and would restrict each substrate to a small orbit. Certifying eight
coordinate changes must not become another substitute for structured product transformations.

### 5.2 Chemical transformations and generators

Specify a transformation group `G` through a small structural rule generating permutations
of chemical identities. The rule must derive from the common geometry, not from favored
chemical IDs, separate food/waste roles or tables fitted to a desired ecological outcome.
Geometric symmetries must carry allowed generators to allowed generators by conjugation.

A constructive feasibility example uses exchanges of neighboring chemical identities. For
an edge joining `i` and `j`, let `P_e` exchange those two identities and leave the others
unchanged. It has an exact inverse, itself. Products of these exchanges are permutations;
the connected square graph generates the full symmetric group on 256 identities. Thus there
is no algebraically privileged terminal chemical and no topology change is required.

This establishes a possible exact algebra, not a selected enzyme mechanism. The ambient
group is enormous, and most of its elements distort chemical neighborhoods. Merely observing
that every bijection belongs to a symmetric group supplies no chemical meaning. Meaning must
come from locality, generator costs, compact parameterization and which operations an
installed enzyme can express. It would be unacceptable to introduce one heritable rate per
edge or enumerate group elements during stepping.

The next design must select the compact generator family and its expression through the
existing machinery slots. It must explain whether a distant conversion is one installed
map or requires successive reactions, and what that means for intermediate material and work.
Replacing present long-distance enzyme products with nearest-neighbor steps would materially
change the economy; the feasibility example does not authorize that replacement.

The full transformation algebra must be closed. A bounded genome may express only a subset
of it, but that subset must not be advertised as a closed group. Composing reactions across
enzymes is not equivalent to funding a single enzyme with their combined capability. Closure
of descriptions and biological expressibility are separate obligations, both to be documented.

### 5.3 Irreversible reaction dynamics

An exact transformation can underlie a one-way, selectively expressed reaction. For a
permutation `P_g` and nonnegative per-substrate rates `r`, an illustrative local generator is

\[
L_g=(P_g-I)\operatorname{diag}(r).
\]

Its columns sum to zero and its off-diagonal entries are nonnegative. It therefore describes
material-conserving conversion. Recognition, available work, funded stock and local conditions
determine which rates are expressed. Unequal forward and reverse rates are allowed even if
the underlying permutation exchanges two identities. Rates are derived from shared machinery
and medium rules, not independent per-chemical controls.

For frozen rates, a bounded discrete step `I + dt L_g` is nonnegative when its outgoing
fractions do not exceed one. With several operators the bound applies to their total outgoing
requests; the production allocator must still enforce shared donor and work limits. Writing
an exponential of `L` is not a requirement to implement matrix exponentials or a new solver.

Such updates form irreversible dynamics, generally nonlinear once the rates depend on state.
For a frozen linear generator, continuous-time evolution is a forward-time semigroup. Neither
claim makes the finite-step reaction a group action or grants a physical inverse. The design
must show how the actual bounded update derives from the chosen operators.

Under geometric relabeling `U`, consistency requires `P` to become `U P U^-1` and `r` to
become `U r`. Then `L` becomes `U L U^-1`. This provides an explicit bridge between the
group action, substrate recognition and irreversible kinetics. A common derivation can serve
enzymes and environmental conversions while their physically different funding and exposure
remain explicit. Shared mathematics does not require identical rates in different compartments.

## 6. Consequences for the rest of the simulation

### Recognition, transport and shared fields

Recognition kernels and installed membrane response must use the same chemical geometry.
A sensor contraction `w^T c` is unchanged when both `w` and `c` undergo the same permutation.
For shared features `h = B^T c`, chemical relabeling gives `B' = U B` and `c' = U c`,
preserving the feature values. Product maps, potentials, stress and impedance tables must
follow the same convention. Transforming one cached operator without its dependencies fails
the contract even when its isolated arithmetic is correct.

Chemical coordinates are not geographic directions. The physical world remains a periodic
320 by 240 rectangle. Its exact global isometries differ from those of the chemical square:
a quarter-turn is not a symmetry of that fixed rectangular torus. Local vector laws may be
rotation-covariant, while a square numerical stencil approximates those laws. Integer mesh
translations provide a separate exact discrete check. Arbitrary translations relative to
the mesh and arbitrary local rotations require approximation evidence, not exact claims.

### Material, work and conditional advantages

Every internal transfer must conserve material; external renewal, washout and numerical loss
remain explicit accounts. Chemical potential and usable work retain their artificial meaning.
For a conversion `i` to `j`, the potential difference transforms consistently when the table
and both endpoints transform together. Cost terms must be scalars built from the declared
geometry and actual operations, not an axis-dependent offset or a favored product number.

An inverse transformation need not have the same usable work yield. A closed sequence restoring
all material, body and relevant field state must not produce net usable work without an
accounted external contribution. Nonnegative dissipation can coexist with exact symmetry.
This is an accounting requirement, not a commitment to detailed balance or real chemistry.

The same reasoning must reach construction, repair, death and reservoirs. Moving material
between owners must not change its identity by an unacknowledged reset. Different interfaces
are legitimate when their physical role explains the distinction. A separate formula invented
for one owner solely to obtain an outcome is not justified by calling it intentional asymmetry.

### Mutation, inheritance and funded refitting

September 22 disposition: [birth-fixed capabilities](installed-machinery.md) supersede the
installed-target and partial-refitting assumptions in this historical section. Mutation and
chemical transformation algebra remain unchanged; daughter capabilities apply at birth without
additional stock. Living capabilities do not change during life.

The established shared heavy-tail mutation principle remains. A group-valued operation has
an intrinsic way to change: compose it with an increment. Left composition and right composition
generally mean different things; the design must select and explain which is used. Rate and
magnitude distributions must follow the shared mutation rule through an explicit representation
map, with rare large changes retained. Do not add a special mutation path for waste use.

Continuous recognition or rate parameters may vary smoothly even when exact identity maps
are discrete. Their distributional symmetry requires increments to transform with the state.
An identical pseudorandom seed alone does not establish that property, especially if edits
change draw order. Pathwise comparisons need coupled transformed increments; otherwise state
the weaker equality-in-distribution claim and its evidence.

Genetic targets and installed machinery remain different states. Mutation does not install a
new operation for free. Birth, partial refitting, genotype distance and optional recombination
must have meanings in the selected representation. Partial refitting may produce a funded
mixture of operations; that mixture is not automatically a new group element. Averaging matrix
entries or angles without establishing the result's meaning is not an inheritance design.

### Controllers and representation changes

Hidden-unit permutations are a potential representation symmetry of the RNN, provided weights,
private recurrent state, plastic traces and assimilation transform together. Action channels
with different physical meanings are not freely interchangeable. Controller input remains local;
neither the algebra nor its implementation may expose global chemical tables or coordinates.

## 7. What this can and cannot say about #186

Group structure can remove an arbitrary rule that merges different inputs into one privileged
output. It can expose a boundary projection that creates convergence or a body cycle that
silently resets identity. It also supplies reachability questions: which chemical identities
lie in the same transformation orbit, and which apparent endpoints are structural restrictions?

It cannot require equal abundance or prevent ecological convergence. Two different transformations
can map different substrates to the same product even though each is individually bijective.
Unequal source renewal, work yields, recognition and consumption can favor a product under
fully coherent laws. Group reachability does not establish an affordable reaction path, controller
expression or a successful recycling strategy.

The [causal investigation](../../186-symmetry-causality.md) and
[v22 findings](../../symmetry-completion-audit.md) remain version-specific evidence. A lower
#186 share is not a symmetry test; a higher share is not proof of broken algebra. Inspect
actual production and consumption paths after the structural claims have been established.
Do not tune a species-specific sink or demand a food web to make this design appear successful.

## 8. Computation is part of the mathematical choice

Exact finite actions are attractive because permutations can be represented as indices and
composed without floating-point geometry. This observation is not a performance measurement.
The chosen generator family must compile into sparse bounded product maps and compact shared
reductions, with costs for changed installed state and mature occupied fields included.

Retain one Rust/WASM owner, immutable installed-operator sharing, scalar stepping and same-worker
rendering of borrowed views. A mathematical matrix does not justify a dense 256 by 256 live
allocation, a species-pair scan, extra full-field copies or a second solver. Compile static
chemical relationships when their dependencies change; evaluate live amounts and funding once
through the shared allocation path. Use the existing activity limits and loss accounts.

Sparsification must itself respect the declared transformation. Grouping SIMD lanes differently
must not silently change which material is processed under an exact relabeling claim. If a
threshold introduces approximation, bound and report it at the full operator boundary. A local
per-step bound is not automatically a bound on a long evolving trajectory.

The minimum remains 30 complete ticks per second, with full mesh2, declared model time, normal
observations and supported persistence. The v22 saturated 2,000-cell workloads already miss
that minimum; their accepted operating limit stays visible. Matching that baseline establishes
no additional regression, not achievement of the target. No resolution reduction, fewer
chemicals, extra freezing of dynamics or early extinction may purchase a reported pass.

## 9. Evidence required before implementation can be called complete

The implementer owns the following evidence. Missing evidence means an open claim, not an
invitation to replace it with a visually interesting run or a completed plan status.

| Claim | Required evidence at the actual boundary |
| --- | --- |
| A transformation group exists | State space, generators, relations, identity, inverses and closure argument; distinguish all group elements from the subset expressible by one enzyme. |
| It acts on stored chemistry | Composition and inverse checks on the discrete representation, including boundaries; no proof confined to unprojected coordinates. |
| The algebra has chemical meaning | Locality/cost rationale, substrate orbits and affordable-path analysis; show why the selected generators are more than arbitrary permutations. |
| Compiler and live reactions agree | Derive the compiled operator from the action and kinetics; check transformed recognition, product feedback, donor/work allocation and committed inventories together. |
| Costs and accounts are coherent | Conservation, nonnegative owners, closed-cycle work checks and transformed-table equivalence across reactions and the body lifecycle. |
| Evolution uses the representation | Mutation law, rare-change support, inherited installed identity, paid partial refit and all enabled expression/recombination paths. |
| The common algebra reaches ecology | Trace ordinary enzymes, environmental conversion and reservoir consumers; name every retained distinct operator and justify its role. |
| Approximation is controlled | A norm, workload, horizon and numerical tolerance declared before measuring; exact and approximate claims reported separately. |
| The runtime remains usable | Matched release-WASM full workloads, occupied-field/machinery-change costs, bounded memory, restore equality, ordinary startup and separate human motion review. |

Exact integer permutation identities should be exact. Floating-point arithmetic downstream
needs declared tolerances and accumulation accounts. If a continuous candidate is later
selected, quantify its composition defect, for example the worst unit-mass difference between
the compiled product of two actions and the compiled composed action. Testing only quarter-turns
cannot establish arbitrary-angle accuracy. Tolerances must follow the model's resolution and
funding sensitivity, not be enlarged after seeing failures.

Bounded mechanics checks precede ecological experiments. Analytical resource budgets precede
startup advancement. A short constructed assay establishes whether a newly expressible reaction
can actually be funded and used. Long runs require a separate question needing evolutionary
time; neither this paper nor the word symmetry authorizes another broad campaign.

## 10. Decisions and future work order

The recommended finite-action direction has not yet selected a compact catalytic generator
family or the genotype-to-operator map. Those are substantive open design decisions. In
particular, the adjacent-exchange example proves feasibility but does not establish adequate
long-distance conversion, useful mutation, bounded refitting or acceptable production cost.
Continuous rate interpolation must not reintroduce an unacknowledged group-action claim.

Future implementation begins by resolving those decisions in one worked mathematical design:
an actual substrate, a composed transformation, its inverse, an ordinary and boundary case,
the funded reaction update, a mutation and a partial refit. Derive dimensions, accounts,
support size and execution cost. Compare the candidate with the positive opportunities of
the current world. A generator selection that cannot meet these requirements is rejected
before integration; a second attractive formula is not an excuse to postpone the decision.

Then establish the discrete representation and compiler obligations in bounded proofs/tests,
integrate every ordinary consumer, and validate resource opportunities and complete cost.
Version state deliberately if the representation changes. Preserve historical measurements
under their original version; do not silently reinterpret saved genomes or previous outcomes.
This sequence revises the relevant transformation machinery, not the entire mathematical
foundation or unrelated simulation systems.

The accountability rule is explicit: **do not report “symmetry complete” while the algebra is
only a pre-projection helper, a cost correction, an unused compiler, or an untested proposal.**
The closing report must connect each claim above to the installed ordinary path and its evidence,
and state unresolved failures. A reason for retaining an asymmetry must identify the object that
breaks the symmetry, its physical or computational purpose, and the precise guarantee retained.
“Out of scope,” “performance,” or “intentional” alone is not a mathematical justification.

## References and provenance

The physical references in section 3 motivate the distinction between state, transformation
and invariant law. The finite-simplex argument and neighbor-exchange construction are derived
in this paper; they are not claims that GR or QM prescribes Biotropy's chemistry.

Project sources read for this design include the [principles](../../principles.md),
[computational foundation](computational-foundation.md), [ADR 0022](../../adr/0022-computable-chemistry.md),
[current work order](../README.md), [chemistry overview](README.md), and complete
[v22 correction and omission audit](../../symmetry-completion-audit.md). The opening scope and
boundaries of the [earlier symmetry plan](../../plans/archive/MATHEMATICAL-SYMMETRY-PLAN.md) were reviewed;
its detailed historical phases were not re-audited for this paper. Their measurements remain
historical evidence, not completion of this group-theoretic design.
