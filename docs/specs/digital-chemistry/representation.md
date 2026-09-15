# Chemical definition and compiled machinery representation

[ADR 0022](../../adr/0022-computable-chemistry.md), the
[computational foundation](../../design/chemistry/computational-foundation.md) and the
[M1 composition correction](../../../DIGITAL-CHEMISTRY-PLAN.md#active-implementation-correction-compose-operators-through-commitment)
govern this representation. Chemistry v4 and physical checkpoint v12 are unchanged.
The canonical compiler now supplies both the composed numerical kernels and the stateless atlas.
Ordinary World integration remains M2–M4; this establishes neither viability nor evolved behavior.

## M0 replacement handoff

M1 consolidates M0's selected arithmetic into
[`MachineryParameters`](../../../engine/src/machinery_parameters.rs) v2 and
[`CompiledOperators`](../../../engine/src/chemical_operators.rs) v3. The numerical-only
`Instructions`, `Operators` and compiler are removed. There is one replacement compiler.

The parameter value contains four receptor centers, four transporter centers, four enzyme
center/offset pairs and one membrane center: 34 f64 coordinates and a version. Centers use
`Target` and lie in [0,15]²; offsets lie in [−15,15]². Fixed arrays enforce slot counts.
Validation rejects unsupported versions, nonfinite and out-of-domain coordinates without repair.
JSON rejects obsolete coupling fields. JSON/postcard decoding must be followed by validation;
compilation enforces it. No coupling coordinate or reciprocal-edge interpretation remains.

`InstalledParameters` separately owns an actual value and u64 revision. Targets grant no stock
and cannot change compiled installed response. The capacity fixture advances the revision and
rebuilds coefficients only after a paid actual-coordinate change. These values are not yet
fields in live chromosomes or Cell checkpoints. M4 owns paid expression and birth integration.

### Compiled coefficients and live inputs

Each enzyme retains one conversion per recognized originating substrate: affinity, rational
attenuation, up to four positive reflected bilinear products, and static net work/heat.
Product entries are merged and ordered; their weights sum to one. Attenuation uses
1/(1+|offset|²/9), including reflection. It does not use reflected endpoint distance.
Reference output energy is the weighted sum of product energies; eta=.8 is applied to that
sum before the .05 work price. Idle maps retain product occupancy and paid-event behavior.
These are M0's exact selected coefficients.

Operator v3 also compiles each enzyme's engagement row. If F maps originating substrates to
weighted products and a is recognition, engagement is a+F*a in a column-vector convention.
Its dot product with the current internal concentration replaces nested product occupancy
enumeration. Forward material redistribution still uses F and simultaneous donor/work limits.

Receptors and transporters have compact radius-three affinity lists. A membrane caches its
coordinate, two evaluated profile components and 256 stress coefficients
stress_s*(1−.95*affinity(membrane,s)). Actual mixtures, occupancy, requests, donors, damage,
funded capacity, work stores and RNN action remain live. `ReactionWork`, receptor arithmetic,
`Exchange` and the capacity fixture consume canonical operators directly, with no tick adapter.

`OperatorCompiler` borrows and validates one immutable Chemistry, serializing its exact identity
once. Each key includes operator v3, definition v4, shared exact definition bytes, exact v2
parameter bytes and optional installed revision. Target and installed keys differ. Changed
actual coordinates invalidate identity even if revision was unchanged. Equal inputs rebuild
equal operators. All sets from one compiler share the same `Arc<[u8]>` definition allocation;
paid changes do not revalidate or copy the full definition. `refresh_installed` compares actual
parameters and rebuilds only changed slots or membrane coefficients, retaining unaffected boxed
maps. It validates before changing the cache and falls back to full compilation when the
definition or operator version changes. A membrane change does not recompile enzymes.

Material projection and geographic placement have separate lifetimes. A material snapshot owns
the internal-mixture response, installed-membrane/body contribution, total mass and radius.
Movement rebuilds only footprint weights. Actual inventory/body/membrane changes invalidate that
snapshot before its next physical use; material reuse never permits stale installed response.

### Retained identity and continuation

The manifold still contains 256 discrete identities, four smooth property surfaces and two
bounded independent profile rows. Eight declared seeds retain physical categories, profile
rank/quadrants, smoothness and high-impedance/low-diffusion neighborhoods. No organism outcome
or seed search selects the definition. Contiguous field rows remain derived from this definition.

V2 target and installed values round-trip through JSON and postcard. Rebuilding from serialized
installed values preserves the same next processing result and accounts. This is a numerical
continuation check, not full new-world persistence. Existing v12 worlds still continue exactly
for 17 ticks after restore; failed-restore and borrowed-render ownership checks remain binding.
The physical schema stays v12 and observation envelope v11 because neither meaning changed.

Rust retains physical owners and the existing bounded scalar diagnostic boundary. No physical
array publication, browser rendering path or runtime selector is added.

### Measured bounds and inspection

Radius-three support has at most 36 species per slot: 144 conversion records, 576 product
entries, 144 receptor affinities, 144 transporter affinities and 256 stress coefficients per set.
A 151×151 center screen observes at most 32; allocation retains the conservative bound of 36.
Each of four engagement rows has at most 256 entries, including product-side support.
Deterministic boxed slices eliminate retained spare capacities. Owned-byte accounting includes
the containing struct, parameter-key bytes and all boxed payloads.

The bound is **40,941 bytes native / 39,645 bytes WASM32 per set**, plus shared definition
13,067 bytes, allocator overhead and compilation temporaries. Measured initial WASM operator
payloads are 1,019,968 / 42,454,928 bytes at 48/2,000 independently compiled sets. Engagement
precomputation adds retained coefficients; it is not free memory. Scratch and total memory are
reported separately in [evidence](validation.md#manifold-composition-correction).

Atlas schema 6 exposes v2 parameters/v3 operators, complete originating maps, product weights,
engagement rows, attenuation, work/heat, membrane profiles and byte bounds for five contexts.
The corner/center/fractional/reflected/idle fixtures retain 36/100/128/60/100 conversions.
Four repeated slots are explicit.
The existing writer and Python reader consume the report; both JSON and plotted old runtime
curves identify their pre-integration status.

### Remaining integration and retirement

M2 receives validated field rows and spatial inputs; it owns frozen medium, same-cloud
deposit/sample, selected f32 transport and persisted .2/.8 clocks. M3 receives finite forward
maps, signed transport and shared work/donor rules. M4 receives separate installed values/revisions
and the paid expression, actual-stock birth, damage inheritance and local release obligations.
Supported new-world continuation must be versioned when persisted meanings change.

Old integer/export-bit live genetics and executors remain under M3/M4's explicit retirement
boundary. Superseded spatial solvers remain under M2's boundary. Production endpoint-barrier
helpers and the old canonical reciprocal/coupling compiler are removed now; any historical
formula remains solely in its labeled test. Full browser throughput, endurance and evolved
adaptation remain unverified.

## Existing M1 implementation — version-specific record

The following sections describe the earlier v4/v12 representation, not the replacement compiler
contract. Claims about charge, reversible edges and uncached energy describe that version only.

### Persisted chemical identity

[`Chemistry`](../../../engine/src/chemistry.rs) contains version 4, seed, four existing 16-coefficient
property surfaces, 256 resolved property records, the decomposition ID and a `ProfileBasis`.
Every record has potential, diffusion, impedance, stress and `interaction: [f64; 2]`.
The original four property arrays are unchanged for all eight declared characterization seeds.
The decomposition species remains an ordinary ID; no biomass chemical or additional element exists.

[`ProfileBasis`](../../../engine/src/chemical_profiles.rs) holds exactly two arrays of 16 f64
coefficients. Its independent random stream uses `seed XOR 0x71696e7465726163`. Each array has
perturbations in ±0.0125 and a signed unit leading cosine mode: (1,0) then (0,1). Evaluation
divides the cosine sum by the absolute-coefficient sum. The triangle inequality bounds the whole
continuous surface, not only the 256 samples. The membrane evaluates this same basis at its actual
continuous coordinate. Resistance and stress remain independent physical inputs.

Generation and restore reject unsupported schema, malformed/nonfinite or zero-norm coefficients,
invalid resolved values, resolved/profile disagreement beyond 1e−12, missing profile quadrants,
minimum covariance eigenvalue below 0.05 or normalized neighbor variation above 0.15. Each of the
four sign quadrants must contain at least eight IDs with both magnitudes at least 0.25. All ten
existing physical categories retain their thresholds, with witness lists, affinity-weighted barrier
neighborhoods and the largest connected barrier component exposed in the atlas. Validation never
observes organisms or retries a seed to obtain an ecological winner.

## Parameters and operators

[`MachineryParameters`](../../../engine/src/machinery_parameters.rs) version 1 contains four
receptor centers, four transporter center/coupling triples, four enzyme center/offset/coupling
quintuples and a membrane coordinate: 42 f64 coordinates and a version. Centers use the existing
`Target` value type and lie in [0,15]², offsets in [−15,15]², coupling in [−1,1]. Validation rejects
invalid values without rounding or clamping. Serde/postcard decode must be followed by validation;
the compiler enforces that boundary. Fixed array lengths are checked by deserialization itself.

`InstalledParameters` owns a separate parameter value and u64 revision. It is a value snapshot
for integration, not an installed body, a grant of stock or a field on every current living cell.
M4 will connect its revision to actual paid remodeling. Targets and installed coordinates must
not alias mutable state. Funded amounts, damage, RNN state and work charge have separate owners.

[`chemical_products`](../../../engine/src/chemical_products.rs) supplies reflected bilinear
product weights and symmetric actual-endpoint barriers. The former returns positive, ordered,
merged entries with total weight one. It preserves idle self-products. The latter is squared
distance divided by 9, also shared with the continuous-distance M0 capacity calculation.
M0's duplicate product/barrier formulas have been removed; its rate/occupancy algebra remains
test-local until its production owner is implemented.

[`OperatorCompiler`](../../../engine/src/chemical_operators.rs) borrows one validated chemistry
definition. Recognition has fixed radius 3 and uses the existing compact affinity compiler.
Enzyme channels retain originating substrate, product, weight, binding coefficient, symmetric
barrier and coupling. Binding is `affinity * weight` at both endpoints. Distinct originating
families remain distinct even for reciprocal pairs; idle branches keep binding and have coupling
zero. Compact incident lists sum both endpoints, including twice the coefficient for a self-edge.
Transport entries explicitly orient outside to inside, share one binding coefficient between
the two compartments and carry continuous charge coupling. Membrane exposure is `0.05+0.95a`;
injury susceptibility is `1−0.95a`, where a is installed affinity.

No operator contains activity, reaction driving force, occupancy, charge, energy yield, heat,
rate, funded capacity, concentration or action. Those quantities must come from live state.
All arrays are deterministic boxed slices ordered by slot, originating substrate and product ID.

## Ownership and exact continuation

| State | Owner and persistence | M1 status |
| --- | --- | --- |
| Resolved chemical definition | Rust `World::chemistry`; full physical checkpoint | v4 implemented and validated. |
| Immutable inherited targets | Registered Rust chromosomes | Existing immutable ownership retained; continuous value schema/compiler ready, chromosome migration belongs to M3/M4. |
| Actual installed coordinates/revision | One current value per slot/interface, separately owned by cell | `InstalledParameters` snapshot type implemented; live paid expression and birth wiring belong to M4. |
| Funded stocks and damage | Rust `Cell` body/damage; physical checkpoint | Current actual-stock ownership retained; no compiler grants capacity. |
| Intracellular chemicals | Rust `Cell::inventory`; physical checkpoint | Current inventory remains the only material owner. |
| Work charge z | Actual cell energetic state; physical checkpoint when integrated | Capacitor specified by M0; current cell still uses its existing energy store. M3/M4 own migration. |
| Extracellular amounts and sources | Rust `Field` and finite sources; physical checkpoint | Current ownership retained. |
| Shared interaction-field reductions | Derived from material, installed interfaces and geometry | M2 integration pending; M1 adds no unused field buffers. |
| Compiled operators | Rebuildable immutable Rust cache values | Implemented for target and installed snapshots; never serialized into physical saves. |
| Browser observations | Bounded revisioned worker publication | Only the existing initialization definition gains fixed-size profile metadata. |

Operator keys include compiler version 1, definition version 4, exact serialized definition bytes,
exact serialized parameter bytes and an optional installed revision. Target and installed keys
are distinct. Definition bytes use one shared `Arc<[u8]>` per compiler; they are not recopied for
each machinery set. Exact bytes avoid fingerprint collisions. Revision changes invalidate an
installed key, and actual parameter bytes also prevent accidental stale reuse if a caller fails
to advance its revision. This identity is a derived cache mechanism, not additional physical state.

Physical saves begin with `ANTROPY12\0`; the payload's world version is also 12. Restore validates
the full definition and rebuilds existing field/genotype/source caches. Old physical prefixes and
tampered profiles are rejected. The outer observation package keeps version 11 because its envelope
is unchanged and its physical payload is opaque. Failed restoration retains the active session.
The test fixture has nonzero external/internal material and continues identically for 17 ticks.

Rust still owns all physical arrays. Scalar stepping, same-worker borrowed rendering, browser
command guards and observation backpressure are unchanged. Definition metadata passes the existing
2 MiB initialization ceiling. The stateless atlas uses the harness boundary, not a new browser query.

## Bounded costs and inspection

Strict radius-three support fits inside at most six integer positions on each axis, hence at most
36 species per slot. Four product neighbors give 144 channels per enzyme and 576 per set. Four
incident binding lists each have at most 256 entries. The declared 151-by-151 center screen observed
a maximum support of 32; the implementation retains the conservative 36 bound.

The byte report counts the containing struct, exact parameter bytes and owned boxed payloads;
allocator metadata, transient compilation allocations and the shared definition are excluded.
The conservative owned bound is **49,965 bytes on native 64-bit Rust**, **45,205 bytes in WASM32**.
The seed-101 definition shared by all sets occupies 13,067 serialized bytes. At 2,000 distinct
installed sets, the WASM bound is about 86.2 MiB before allocator overhead and other simulation
state. This is a budget for later integration, not a measured resident-memory or throughput claim.

| Fixture | Total enzyme channels | Native owned bytes | WASM owned bytes |
| --- | ---: | ---: | ---: |
| Corner | 36 | 4,665 | 4,225 |
| Center | 100 | 11,065 | 10,113 |
| Fractional | 512 | 32,809 | 28,561 |
| Reflected | 60 | 6,745 | 6,113 |
| Idle | 100 | 10,745 | 9,793 |

The atlas repeats each fixture's slot parameters four times and exports one representative
enzyme's complete channel list, all four channel counts, parameters, membrane profile and bytes.
`definition.json` includes profiles and witness IDs; `law-samples.json` explicitly labels old
movement/diffusion curves. The reference-only impedance-path reaction curve is labeled separately.
Neither is relabeled as integrated thermodynamics.

M3/M4 must retire `genetics::Transporter.export`, integer `Enzyme.dx/dy`, constant-energy
`genetics::Edge`, and their old compiler/executor consumers together. The old integer `product`
helper remains for those consumers and reflected adjacency inspection. No fractional-to-integer
adapter, export-bit approximation, optional compatibility mode or second physical runtime was added.
