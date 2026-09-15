# M1 — Validated chemical manifold and compiled operators

Historical completed expansion. The [computational foundation](docs/design/chemistry/computational-foundation.md)
now governs integration. Existing definition/product/cache ownership evidence remains useful;
formula-specific charge, reciprocal-channel and basis choices are revisable. Status statements
below describe the M1 handoff, not current acceptance. Root M1 has reopened to reconcile this
representation after reopened M0 selects and measures the replacement rules. Its new expansion
belongs in the root plan; the old completed child record remains historical.

Status: completed September 15, 2026; all eight steps implemented and verified. This expands only M1 of the
[root plan](DIGITAL-CHEMISTRY-PLAN.md). Execute the eight steps in order, then stop.
Root Sulion plan: `39f64047-90fd-456f-ba09-95ca79edf549`, milestone position 2.
Expansion: `d7d29051-066d-4c40-a2d5-79e38bb4896f`.

Execution evidence: [ordered red/green checks and exit output](docs/specs/digital-chemistry/validation.md#m1-definition-and-compiler-evidence).
Implemented ownership: [representation contract](docs/specs/digital-chemistry/representation.md).
`make ci` passed 50 existing Rust tests, 16 M1 tests, 22 M0 probes and 54 TypeScript tests,
with 13 existing lint warnings. M2 has not started. Step 6 required two incidental scalar-key
type narrowings in `ChemicalAtlas.tsx` and `Inspector.tsx`, found by the full gate; their displayed
properties and behavior are unchanged.

## Outcome and boundary

M1 delivers a persisted, validated 256-element definition with two interaction components,
continuous fixed-slot machinery parameters, and a production Rust compiler for conservative
discrete transformation channels. It establishes which data are inherited instructions, actual
installed state, physical continuation state and rebuildable caches.

The new definition enters ordinary world creation and checkpoints. The new machinery compiler
is exercised through bounded tests and the existing stateless chemistry atlas. Live reactions
continue through their current owner until its coherent replacement in M3; installed expression
and birth integration belong to M4. Do not feed fractional products or charge coupling through
the existing reference-energy reaction implementation. Do not translate continuous coupling
back into an export bit or round offsets to make the old executor accept them.

This is a dependency boundary, not a second runtime or a permanent compatibility layer. M1's
handoff names the old types and consumers that their replacement owners must retire. It must
not report the new laws as active organism physics. Survival, adaptation, spatial dynamics,
browser throughput and weeks of operation are outside this phase's evidence.

## Context / reuse map

Re-read these sources before editing their owners. M0's selected contract governs the formulas:
[machinery](docs/specs/digital-chemistry/machinery.md),
[interactions](docs/specs/digital-chemistry/interactions.md),
[accounting](docs/specs/digital-chemistry/accounting.md),
[lifecycle](docs/specs/digital-chemistry/lifecycle.md),
[numerics](docs/specs/digital-chemistry/numerics.md) and
[parameter retirement](docs/specs/digital-chemistry/parameters.md).
The [root reuse map](DIGITAL-CHEMISTRY-PLAN.md#context--reuse-map),
[ADR 0021](docs/adr/0021-integrated-digital-chemistry.md),
[ADR 0020](docs/adr/0020-complete-rust-kernel.md) and
[sharing contract](docs/design/chemistry/data-ownership.md) retain authority.

Verified baseline on September 15, 2026:

| Owner | Existing behavior and M1 use |
| --- | --- |
| `engine/src/chemistry.rs` | Chemistry v3 persists four coefficient surfaces and 256 resolved property records. Reuse reflected coordinates, affinity, existing joint-coverage checks and deterministic generation. Extend the definition with independent interaction-profile coefficients and resolved values. |
| `engine/tests/chemistry_contract/machinery.rs` | M0 has test-local bilinear product and barrier formulas. Promote those two primitives to production; retain independent expected values and the other M0 algebraic probes. |
| `engine/src/genetics.rs` | `Target` is continuous; transporter direction is a boolean, enzyme offsets are integers, and `Edge` stores fixed energy/heat. Reuse `Target` and compact affinity compilation. New continuous parameter/operator types have a separate explicit name until M3/M4 replace these consumers together. |
| `engine/src/chemistry_atlas.rs` | Existing no-world atlas resolves a definition and computes analytical summaries. Extend this owner rather than adding another command or analysis engine. Its current movement and reaction curves describe old executable laws. |
| `engine/src/world.rs` | Physical checkpoint v11 uses `ANTROPY11\0`, validates chemistry and rebuilds derived state. The changed persisted definition requires a new physical version and rejection of the old one. |
| `engine/src/commands.rs`, `frontend/src/engine/types.ts` | The definition command already serializes chemistry. Extend the bounded initialization metadata types; do not introduce physical-state publication. |
| `frontend/src/engine/package.ts` | Outer package v11 wraps opaque physical bytes and observation metadata. Its version is independent of the inner physical format; unchanged envelope shape needs no version bump. |
| `frontend/src/engine/boundary.test.ts`, `ownership.test.ts` | Existing cold restore, failed-restore retention, scalar stepping and borrowed-render assertions remain integration gates. |
| `Makefile` | `make ci` runs Rust formatting, Clippy and tests, frontend checks, WASM build, Vitest, documentation links and Terraform formatting. No additional test runner is needed. |

The working tree contains extensive pre-existing changes. Preserve them. New module registrations
belong in `engine/src/lib.rs`; existing serde/postcard dependencies suffice. New files named below
are execution destinations, not claims that they exist now. Split the bounded integration test
into its listed modules to keep source files small.

## Selected representation and validation choices

These are M1 engineering selections within the accepted M0 laws, not new ecological requirements.

- Keep 256 IDs and reflected chemical coordinates in `[0,15]^2`. Geographic XY remains periodic
  and is not used by the compiler. Recognition radius remains exactly 3.
- Generate two separate low-frequency cosine surfaces for interaction profiles. For component
  `k`, use 16 coefficients in the existing `(j/4, j%4)` basis, an independent seeded random stream,
  coefficient perturbations bounded by 0.0125, and a signed unit leading mode: `(1,0)` for the
  first component and `(0,1)` for the second. Divide each evaluation by the sum of absolute
  coefficients. This bounds the entire continuous surface by one, including between IDs.
  Persist these coefficients separately from the four kinetic/reference-property surfaces.
  Do not derive profiles from resistance or stress, normalize only at sampled IDs, retry seeds
  until organisms succeed, or add user-facing profile tuning controls.
- Evaluate membrane `q(m)` from that same continuous basis. Persist each ID's two resolved values
  and validate them against the coefficients. Keep the existing four surfaces and their random
  stream unchanged in M1; their semantic retuning belongs with the laws that consume them.
- Require all four profile sign combinations with each component's magnitude at least 0.25 and
  at least eight IDs per combination. Require the smaller eigenvalue of the centered 2-by-2
  profile covariance to be at least 0.05. These exclude absent interaction preferences and a
  collapsed rank; they do not select a community. Neighbor profile differences, divided by the
  full range 2, must be at most 0.15, matching the existing normalized smoothness scale.
- Retain every existing physical-coverage requirement: energy and diffusion extremes, high stress,
  all four resistance/diffusion combinations, low-stress/low-resistance chemistry, affinity-weighted
  persistent material and a connected high-resistance/low-diffusion neighborhood. Report witnesses
  and counts, not only a single pass flag. No statistical independence of all properties is claimed.
- Use fixed arrays of four receptors, four transporters and four enzymes. Centers and the membrane
  coordinate are continuous; offsets are in `[-15,15]^2`; charge coupling is in `[-1,1]`. Genetic
  targets and installed coordinates share a parameter value type but have different owners.
  Actual funded amounts, damage and charge are not fields of an immutable target operator.
- Compile only state-independent topology, product weights, binding coefficients, symmetric
  barriers and charge stoichiometry. Keep at most 36 recognized substrates per slot, four product
  IDs per substrate, 144 channels per enzyme and 576 across four enzymes. Lists are deterministic
  and ordered by slot, originating substrate and product ID. No active-species cutoff changes
  this topology. Idle channels retain occupancy and have zero charge coupling.
- New serialized chemistry uses definition v4 and physical checkpoint v12. Parameter/compiler
  schema v1 has an explicit cache identity including definition and operator versions. Target
  caches are keyed by immutable parameter identity; installed caches by actual installed revision.
  Cache contents are derived, not physical checkpoint payloads. No old-save adapter is required.

## Ordered execution steps

### 1. Promote continuous product primitives

- **Files:** new `engine/src/chemical_products.rs`; `engine/src/lib.rs`;
  `engine/tests/chemistry_contract/machinery.rs`; new
  `engine/tests/chemical_definition.rs` and `engine/tests/chemical_definition/products.rs`.
- **Reference behavior:** M0 machinery's discrete-channel construction and symmetric endpoint
  barrier. Use `chemistry::coordinate`, `reflect` and `affinity`; no geographic wraparound.
- **Change:** implement `product_neighborhood(substrate, offset)` with positive, merged bilinear
  weights for at most four discrete IDs, and `transformation_barrier(substrate, product)` equal
  to actual endpoint distance squared divided by 9. Preserve self-products. Replace the M0
  test-local product/barrier implementations with calls to these production primitives; do not
  move occupancy or rate laws into production in this step. The old integer `product` helper
  still serves current runtime consumers until their replacement.
- **Verify:** first make the named production imports fail to resolve. Then test all 256 substrates
  at offsets `(0,0)`, `(0.25,-0.75)`, `(15,15)` and `(-15,-15)`, plus one-sided perturbations at
  grid and reflection boundaries. Assert IDs in range, nonnegative weights, sum one within
  `2e-14`, exact integer cases and barrier reciprocity. For coordinate perturbation epsilon,
  compare dense weight vectors with the M0 bound `L1 <= 4 epsilon + 1e-13`; do not compare sparse
  list lengths for continuity. Re-run all five M0 machinery probes after deleting their duplicates.

### 2. Define continuous machinery parameters [depends on #1]

- **Files:** new `engine/src/machinery_parameters.rs`; `engine/src/lib.rs`;
  new `engine/tests/chemical_definition/parameters.rs`; integration-test module registration.
- **Reference behavior:** fixed heritable slots and continuous coupling from M0 machinery;
  instructions versus actual installed state from accounting/lifecycle and the root reuse map.
- **Change:** define `MachineryParameters` using the existing `genetics::Target` coordinate value,
  fixed slot arrays, floating offsets and continuous transporter/enzyme coupling. Provide explicit
  validation and a versioned parameter record suitable for persistence. Define an installed
  parameter snapshot with a revision, without embedding a genome, RNN, funded amount, duplicate
  chemical inventory or history queue. The parameter payload may be shared by both owners;
  compilation must not grant target parameters the authority of an installed body. Do not change
  live chromosomes, seed genomes, mutation, diploid expression or refitting in this step.
- **Verify:** red is the missing parameter contract. Test fixed array lengths, finite values,
  endpoint bounds, fractional offsets and coupling across zero, plus exact serde/postcard roundtrip.
  Reject invalid input rather than silently rounding or clamping it. Confirm changing a target
  value does not mutate a separately owned installed snapshot. These tests exercise ownership,
  not the future paid-remodeling process.

### 3. Persist the interaction manifold

- **Files:** `engine/src/chemistry.rs`; new `engine/src/chemical_profiles.rs`;
  `engine/src/lib.rs`; new `engine/tests/chemical_definition/profiles.rs`; test registration.
- **Reference behavior:** M0 interactions defines bounded rank-two profiles and continuous
  membrane evaluation; the root defines reproducible persisted chemistry. The generator above
  supplies those properties without adding energetic dependence on stress or resistance.
- **Change:** add profile coefficients and two resolved values per element to Chemistry v4.
  Implement continuous profile evaluation using the selected normalized cosine basis and a
  documented independent random-stream salt. Validate coefficient shape/finiteness/nonzero
  normalization, property finiteness and resolved-value agreement. Keep the existing four
  property-generation formulas intact. Localize profile logic in the new module rather than
  growing `chemistry.rs` beyond the repository source-size convention.
- **Verify:** red is absence of the persisted profile/evaluation contract. Check deterministic
  regeneration for seeds `1,2,3,7,42,101,202,65535`; compare continuous evaluation to resolved
  ID values within `1e-12`. Verify the analytical absolute-coefficient bound and sample centers,
  edges and half-grid coordinates. Reject malformed coefficients, nonfinite values and tampered
  resolved profiles. Characterize and retain the original four property arrays for these seeds
  before/after the extension; this characterization is a preservation check, not the new red test.

### 4. Validate joint physical coverage [depends on #3]

- **Files:** `engine/src/chemistry.rs`, `engine/src/chemical_profiles.rs`;
  new `engine/tests/chemical_definition/coverage.rs`; test registration.
- **Reference behavior:** root chemical-identity/joint-coverage requirements, M0 rank-two
  interaction law and the concrete coverage selections above. Physical coverage is independent
  of organism success. Inspect the existing coverage and connected-component implementations.
- **Change:** extend generation/restore validation with profile quadrant counts, covariance rank,
  profile continuity and witness IDs. Reuse existing intrinsic-property thresholds, neighborhood
  affinity and connected-component checks. Report failures by property combination. Evaluate
  transformation connectivity on the reflected adjacent-ID graph; recognition and nonzero
  one-step product weights must make its neighboring transitions accessible.
- **Verify:** add assertions that fail for a zero-profile definition, collinear profiles and a
  missing sign combination while leaving the original four property surfaces valid. Test valid
  generation across the same eight declared seeds, all existing coverage constraints, profile
  thresholds and adjacent-ID connectivity. Where adversarial coefficients also violate resolved
  values, resolve them first so the intended coverage failure is actually exercised. No random
  seed expansion or organism runs; a failed physical predicate is evidence to fix the generator,
  not permission to choose a successful seed or loosen the predicate silently.

### 5. Compile reciprocal machinery operators [depends on #1, #2, #4]

- **Files:** new `engine/src/chemical_operators.rs`; `engine/src/lib.rs`;
  new `engine/tests/chemical_definition/operators.rs`; test registration.
- **Reference behavior:** M0 machinery's originating families, shared two-ended binding,
  idle occupancy and symmetric barriers. M0 numerics requires bounded sparse topology independent
  of the number of occupied species. The root forbids caching state-dependent thermodynamics.
- **Change:** implement a pure compiler consuming validated parameters and chemistry. Reuse
  `compile_affinity` at R=3 for receptors, transporters and the membrane. Compile enzyme product
  weights and `h = affinity * weight`, with ordered originating-family channels. Preserve both
  orientations when different originating families produce the same pair. For denominator
  reductions, sum incident binding coefficients into compact species lists; a self-channel
  contributes twice its binding coefficient. Give transporter entries outside/inside roles and
  their coupling. Include membrane profile and compatibility data derived from its coordinate.
  Provide explicit version/parameter identity and installed-revision cache keys. Keep the compiler
  independent of `World`, field concentrations, charge, action, stocks and damage. Do not include
  cached usable energy, heat, reaction affinity, activity, occupancy, rate or allocated capacity.
- **Verify:** red is the missing compiler contract. Compare compact operators to an independent
  dense enumeration on corner, center, fractional, reflected and idle fixtures. Check product
  conservation, charge neutrality of idle branches, reciprocal barriers, double-ended binding,
  and the exact denominator computed by dense versus compact lists. Perturb target centers,
  offsets and coupling through support boundaries and compare weighted operator action rather
  than exact list membership. Sweep the existing bounded 151-by-151 center grid for affinity
  support and derive/assert the 36/144/576 bounds. Report allocated entry counts and bytes for
  the declared fixtures; wall-clock speed is not a flaky unit-test assertion. Equal keys compile
  equal operators, while changed installed revisions cannot reuse a stale cache.

### 6. Wire definition and checkpoint versions [depends on #3, #4, #5]

- **Files:** `engine/src/world.rs`; `engine/src/commands.rs` only if definition wiring requires it;
  `frontend/src/engine/types.ts`; `frontend/src/engine/boundary.test.ts`;
  new `engine/tests/chemical_definition/persistence.rs`; test registration.
- **Reference behavior:** ADR 0020 and the sharing contract; the current exact cold checkpoint
  path and separate observation envelope. The full resolved chemical definition is persistent;
  field reductions and compiled operators are derived. Read current restore validation first.
- **Change:** advance physical world version/prefix to v12, serialize/validate the complete v4
  chemistry and expose its fixed-size definition metadata through the existing initialization
  command. Update TypeScript metadata types for the profile pair and coefficients. Keep the
  unchanged outer observation package version independent. Do not add new installed snapshots
  to every live cell before M4 owns their behavior, nor serialize unused operator caches.
- **Verify:** first assert the new definition/version and show the old implementation fails it.
  Roundtrip a current world with nonzero internal/external material, then run 17 ticks from the
  original and restored states and compare physical snapshots exactly. Confirm v11 rejection,
  rejection of tampered profile data, and failed restore preserving the active session. Assert
  the initialization definition stays within the existing metadata budget. Re-run existing
  ownership and boundary tests: scalar stepping and borrowed render buffers remain unchanged.

### 7. Expose stateless manifold and operator evidence [depends on #5, #6]

- **Files:** `engine/src/chemistry_atlas.rs`; new
  `engine/tests/chemical_definition/atlas.rs`; test registration;
  `frontend/harness/lib/chemistryAtlas.ts` only for schema labels/export propagation.
- **Reference behavior:** the current stateless atlas and root requirement for inspectable chemical
  identity. M1 must distinguish implemented definition/compiler contracts from old executable laws.
- **Change:** extend the existing atlas schema with profile ranges, coverage counts/witnesses,
  neighbor variation and bounded compiled-operator examples for the five fixtures in step 5.
  Include definition/compiler versions and entry/byte bounds. Label existing movement and
  reference-energy reaction curves as current pre-integration laws; do not rewrite them to pretend
  M2/M3 have landed. Export new data through the existing local artifact writer. No new simulation
  runner, browser command, plot framework or UI redesign.
- **Verify:** red is absence of the new atlas fields/version labels. Assert exact agreement between
  atlas summaries and the canonical generator/compiler and that the atlas runs without creating
  a world or advancing ticks. Use the existing artifact writer once for seed 101 into a new local
  output directory; inspect the exported JSON for complete profiles and operator summaries.
  The bounded artifact is physical-definition evidence, not an ecological experiment.

### 8. Record M1 evidence and run the exit gate [depends on #1, #2, #3, #4, #5, #6, #7]

- **Files:** new `docs/specs/digital-chemistry/representation.md`;
  `docs/specs/digital-chemistry/README.md`, `validation.md` in that directory;
  this file and `DIGITAL-CHEMISTRY-PLAN.md` for execution status only.
- **Reference behavior:** M1 exit gate, M0 separation of proof from runtime evidence, ADR 0020
  ownership and the root retirement map. Preserve the historical M0 result and its source identity.
- **Change:** document the actual v4 definition, parameter/operator schema, cache identities,
  byte/count bounds, physical checkpoint v12 and unchanged outer envelope. Include an ownership
  table for immutable targets, actual installed coordinates/revision, funded stocks/damage,
  intracellular mixture/charge, extracellular material, shared-field reductions and derived
  operators. Identify which owners exist in production and which await integration; do not create
  placeholder runtime state to make the table appear implemented. Record ordered red/green
  evidence, the eight seed results and the local atlas source digest. Explicitly assign retirement
  of integer enzymes/export bits and constant-energy `Edge` consumers to M3/M4's coherent
  integration; M0 test-local product/barrier duplicates must already be removed in step 1.
- **Verify:** this documentation step adds no runtime test. Its new contract is absent before the
  change; afterwards verify every table entry against its owner and all links with the existing
  documentation checker. Run the full `make ci` exit gate and retain the actual output and exit
  status. Report warnings and failures accurately. Mark M1 complete only after its generation,
  continuity, conservation, bounded-cost and persistence checks pass, then
  `sulion plan return --completed`. Do not begin M2.

## Execution rules and limits

Use `cargo test --manifest-path engine/Cargo.toml --test chemical_definition` with the relevant
module filter for each new test group. Existing M0 probes use
`cargo test --manifest-path engine/Cargo.toml --test chemistry_contract`. A missing new symbol
is the specified red condition; record it before implementation. Existing passing regressions
are supplementary evidence, never relabeled as a red test. Inspect source before each step.

No step is tagged `[DECISION]`: the accepted plan delegates these formula-preserving representation
choices to the implementer. A discovered contradiction with M0 is a blocker to expose, not an
invitation to invent a fifth law or widen the phase. For a multi-step prerequisite, use a nested
Sulion branch under the blocked step and return when resolved. Keep incidental build/test wiring
within the step that requires it. Use native edits and the current Git branch. No development
server, ecological run, seed campaign, commit or push is part of this phase.
