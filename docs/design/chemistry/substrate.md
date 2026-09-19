# Chemical substrate and accounting

Historical substrate/reference description from the previous chemistry implementation. Current
execution is defined by the [composed runtime](composed-runtime.md), under the
[computational foundation](computational-foundation.md). The formulas, mesh, checkpoint and
tick order below preserve earlier choices; they do not govern the fresh production World.
That World implements v5 chemical definitions, continuous installed machinery and physical checkpoint
v27. Preserve material identity, finite resources and explicit accounts without reconstructing
the old conductance, temperature or categorical machinery rules below.

Status: implemented; [numerical design](numerical-engine.md) and [current results](numerical-results.md) record selected
laws, numerical checks and limitations. The [design overview](README.md) records provenance, scope and
which decisions were added during review. [Machinery](machinery.md) defines cell capabilities;
[migration](migration.md) defines the checks needed before adoption into the observation world.

## Chemical identity and state

There are exactly 256 species. A species byte encodes `x = id >> 4`, `y = id & 15`, with each
coordinate in 0–15. Species are discrete samples of a smooth two-dimensional property manifold.
Chemical-space distance is Euclidean distance between coordinates, never byte subtraction.
Chemical space is bounded; the geographic world remains periodic. Do not wrap chemical mutations
or reaction products across an edge.

Reflect an arbitrary coordinate into the interval using `t = ((z % 30) + 30) % 30`, then
`reflect(z) = t <= 15 ? t : 30 - t`. Apply this separately to x and y. Repeated overshoots and
negative values have one unambiguous result. An integer input and offset produce an integer species.
An enzyme's offset can reflect back to its substrate; a resulting self-reaction is skipped.

| Owner | Persistent state |
| --- | --- |
| Chemistry definition | Generator/schema version, coefficients, resolved 256-entry property tables, ranges and validation report; affinity/effect/rate constants reside in the persisted world configuration |
| World | Dense float32 extracellular amounts, finite source mixtures and renewal state, independent random streams, material/energy ledgers |
| Genotype | Fixed chemical machinery genes, membrane coordinate, physical construction targets and controller genome |
| Cell | Float64 internal amounts, usable energy, actual built stocks, damage, receptor baselines and private controller state |

Use nonnegative amounts: extracellular float32, internal matter and usable energy float64. Extracellular concentration is amount
divided by raster element area in the model's unit-depth convention. Internal concentration is
amount divided by the cell's physical volume, with a positive physiological lower bound. Amount,
concentration, energy and potential must remain distinct in APIs and accounting.

## Property manifold

Each species has four finite intrinsic properties, fixed for the life of a world:

| Property | Meaning | Constraint |
| --- | --- | --- |
| `U(s)` | Stored chemical energy per material unit | Nonnegative, with a useful nonzero span |
| `D(s)` | Open-medium diffusivity, world units squared per model second | Positive bounded range |
| `I(s)` | Environmental impedance per concentration unit | Nonnegative bounded range |
| `S(s)` | Membrane-stress weight | Nonnegative bounded range |

Generate smooth surfaces from a small low-frequency basis, for example products of
`cos(n*pi*x/15)` and `cos(m*pi*y/15)` with n,m in 0–3. Persist the basis definition and coefficients.
Normalize sampled surfaces into persisted ranges; map diffusion through a log range so slow and
fast transport can differ materially. Reject degenerate, nonfinite or excessively steep surfaces.
Neighbor differences and actual physical ranges belong in the generation report.

The generator must validate combinations, not just the separate minimum and maximum of each map.
The coverage contract uses normalized sampled properties in [0,1]; the generator checks at least
eight species in every scalar/joint category. Bounded space tests additionally check continuity,
connected barrier regions, affinity-weighted neighborhoods and downhill paths:

| Requirement | Bounded physical check |
| --- | --- |
| High and low potential | At least eight species at or below 0.2 and eight at or above 0.8 |
| Fast and slow diffusion | At least eight species in each corresponding outer fifth of the log-diffusion range |
| Stressful chemistry | At least eight species with normalized stress at or above 0.8 |
| Potential barrier material | At least eight barrier species, including four edge-connected species with impedance at or above 0.8 and log-diffusion at or below 0.2 |
| Relatively unobtrusive emissions | At least eight species with stress and impedance at or below 0.2 |
| Multiple downhill opportunities | Some `a -> b -> c` has both potential drops at least 0.1 of the full potential span, expressible by allowed offsets |

These are physical coverage checks, not source assignments, organism roles or ecological pass
criteria. Also inspect affinity-weighted neighborhoods: a single useful coordinate surrounded by
unusable chemistry may not provide useful broad machinery access. High/low thresholds alone do
not establish affordable metabolism, a persistent barrier or a useful signal.

Use a deterministic chemistry-generation stream derived separately from landscape/body/genetic
streams. Construct the correlated surfaces in one deterministic attempt and fail world creation if coverage
is invalid. The initial eight-seed mathematical panel required no retries; no population selects seeds. Persist the accepted attempt and report.
Do not weaken a threshold, select an organism or substitute named species silently. Coefficients
and the resolved table must agree within declared numerical tolerance; restore uses the validated
persisted table, not a fresh draw or a newer generator's interpretation.

## Fields, sources and turnover

Store external amounts in node-major float32 arrays with 256 species per mesh node; internal
amounts use float64 vectors with an owned material reduction. Geography is continuous and
independent of mesh spacing. Default mesh 2 gives 160 × 120 nodes in the 320 × 240 world,
about 18.75 MiB for external amount storage before work buffers, organisms or history.

The September18 scaling pass rounds extracellular concentrations below
`1e-6` to zero at field substeps and retains the index of occupied groups plus their neighbor
halo. Numerical losses, including this floor, are recorded separately from physical washout
in matter and potential accounts. This local resolution does not select species by global
abundance or prune intracellular stocks. See the [current runtime](composed-runtime.md).
Shared reductions and compiled compact operators bound remaining work. Mesh allocation is limited to
80,000 nodes; organism and ancestry limits are separate. These are operating limits, not
carrying capacities. See [numerical methods and checks](numerical-engine.md).

Sources specify location, extent and a sparse species mixture with finite held inventory and
release rates. Renewal draws from the environment stream and records actual external matter
and chemical-energy additions. Source release only transfers previously held inventory. Initial
priming subtracts the released amount from that inventory. At expiry, remaining inventory is
released locally with its species identity intact in this proposal; it is not transmuted into a
special waste or resource. Finite total supply, renewal delays and local release remain tunable.

Spatial and temporal source-composition experiments use the same generic source representation.
Changing composition at fixed material supply usually changes energy supply because U differs.
Specify and record both budgets. A comparison claiming only a composition change must match both
where feasible, or identify the energy difference as an additional intervention. Existing material
never changes identity merely because a source calendar changes.

Apply one slow extracellular washout constant `lambda > 0`, in inverse model seconds, to every
species: `qAfter = qBefore * exp(-lambda * dt)`. Record `removed = qBefore - qAfter` as external
material loss and `removed * U(s)` as exported chemical energy. This applies to dissolved source
material, emissions and decomposition products alike. It does not act inside cells or unreleased
source inventories. Report its half-life `ln(2)/lambda` alongside release, travel and diffusion
times; there is no species-specific decay multiplier. Arithmetic roundoff is accounted separately from this physical turnover.

For field transport, compute local `L(p) = sum(C(s,p) * I(s))` and
`mDiff(p) = 1 / (1 + kDiff * L(p))`. Each species has local diffusivity `D(s) * mDiff(p)`.
Use symmetric face conductance, such as the harmonic mean of adjacent diffusivities, so paired
fluxes conserve matter and chemical potential even across sharp impedance changes and seams.
Choose stable transport substeps from the maximum conductance; retain nonnegative amounts.
Transport buffer ownership must prevent an earlier raster update from changing a later flux.

## Motion and stress

Use `mMove(p) = 1 / (1 + kMove * L(p)^2)` for the proposed movement capacity multiplier.
Apply it through one effective-drag calculation for translation, turning and Brownian rotation.
For the current power-limited square-root speed law, dividing drag by `mMove^2` gives that
capacity reduction; Brownian rotation must use the same increased rotational resistance.
Check the implemented mechanics rather than multiplying independently in several code paths.

Base-medium viscosity remains a separately calibrated physical coefficient. Sparse source
economics should create regional separation; changing chemistry must not restore universally
slow motion as the means of making the world look large. High local impedance can approach
wall-like resistance continuously. It does not create a solid state, movement exception for its
producer, binding capacity or a threshold wall-placement rule.

With shared affinity `a(m,s)`, use proposed susceptibility
`chi(m,s) = chiMin + (1 - chiMin) * (1 - a(m,s))`, with `0 < chiMin < 1`.
Membrane compatibility reduces stress near its coordinate, without universal or perfect immunity.
The width is fixed globally, as for the other machinery. The precise residual susceptibility is
a calibration value, not a separate evolvable defense scalar in v1.

Proposed exposure is `H = sum((Cexternal(s) + gamma * Cinternal(s)) * S(s) * chi(m,s))`.
Use the existing local sampling convention outside the body and a fixed global internal exposure
factor gamma, initially proposed as 1. This internal term is an explicit addition to the supplied
specification: internal synthesis and accumulation must not be cost-free protection from stress.
Convert H to bounded damage, for example `damageRate * H/(H + stressK)`, then apply normal
functional impairment, paid repair and death. Stress itself changes damage, not material stock.

Internal and external concentrations differ physically; their scales require a constructed
exposure check. Compatibility changes which exposures hurt, while repair consumes resources after
damage. Neither an attacker identity nor producer/relative exemption participates.

## Transport and reactions

Receptors, transporters and enzymes share `a(t,s) = max(0,1-distance(t,s)^2/R^2)^2`, with
one persisted global support radius R, initially 3. Target coordinates may be continuous; chemical identities remain bytes.
Read [machinery](machinery.md) for funded amounts and effort channels.

Import/export preserves species and transfers one material unit between compartments. Requested
flux is proportional to actual transporter stock, neural effort, rate, affinity and available
concentration, subject to a total per-slot throughput bound. Import additionally respects local
diffusive conductance and shared supply. All internal species share one storage capacity.
Charge a positive usable-energy cost per transferred unit, including export. No passive uptake,
free secretion or direct cell-to-cell transfer is implicit in this rule.

Each enzyme transforms internal substrate s into `reflect(s + offset)`. Its requested amount is
`builtEnzyme * catalyticRate * a(center,s) * internalAmount(s) * dt`.
Bound total turnover by that enzyme's funded capacity, substrate availability and energy. Several
enzymes consuming the same species share its available amount proportionally. Products are
committed after requests are resolved and become substrates at the following physiology update; array order
must not give one enzyme an immediate multi-step chain.

For actual transformed amount q and `delta = U(s) - U(product)`, conserve q exactly:

| Reaction | Usable-energy change from chemical conversion | Heat |
| --- | --- | --- |
| `delta > 0` | Gain `eta * delta * q` | `(1 - eta) * delta * q` |
| `delta < 0` | Pay `(-delta) * q / eta` | `(-delta) * q * (1/eta - 1)` |
| `delta = 0`, different species | No conversion gain | No conversion heat |

Here `0 < eta < 1`. There is no additional per-turnover operating fee. Installed machinery pays
construction, volume and maintenance; isoenergetic conversion captures no energy. Uphill costs
are reserved from available usable energy before
committing reactions; this tick's prospective downhill proceeds cannot fund another request in
the same allocation. Scale competing requests by a common affordable factor. Energy above core
storage capacity becomes accounted heat, never extra chemical matter.

Closed reaction cycles cannot create energy. A one-way downhill path spends chemical potential;
an uphill return costs more than the captured descent, with additional transport and machinery
expenses. Unary transformations do not combine substrates, bind chemicals or act extracellularly.

## Generic biomass, repair and death

Chemical identity is retained until assimilation. Any internal species can provide one unit of
generic built matter per unit consumed; there is no required biomass chemical. Built matter is
allocated to actual core, motor, storage and slot stocks by the funded construction economy.
Genetic targets do not instantiate those stocks.

Choose one decomposition species d in the world definition and set built-material energy density
`uBody = U(d)`. This is an accounting reference, not a mandatory imported ingredient. For q units
of species s assimilated, with positive assembly cost `aBuild` per unit, use:

```text
usableEnergyCost = q * (aBuild + max(0, uBody - U(s)) / eta)
builtMaterialGain = q
heat = q * U(s) + usableEnergyCost - q * uBody
```

Thus low-potential matter can be built using enough usable energy; high-potential matter loses
its excess to heat unless the cell first processes it enzymatically. Assembly never captures
usable energy directly. Select material proportionally from the internal mixture, then scale
the whole request by assembly rate, protected reserves, available energy and target deficits.
This simple physiological allocation performs no hidden best-substrate search.

Repair uses the same chemical-to-built-material conversion and its energy accounting, plus the
configured repair work cost. Release an equal amount of replaced built material locally as d;
repair does not grow the body or destroy matter silently. Do not count repair turnover twice
as new body stock and material loss. Existing inherited damage semantics remain.

On death, release internal inventory locally with species identity and amounts unchanged. Convert
each built stock one-for-one to d at the death position; its chemical potential equals the body's
book value. Dissipate remaining usable energy. V1 proposes immediate conversion, without a
separate detritus field or corpse decay timer. Its timing is a declared simplification to test for
corpse access. The prior delayed decomposition rule is removed.

Division splits actual slot/body stocks, every internal species and post-cost energy. It neither
manufactures machinery nor restores health. Failed local placement retains the funded parent.
Any future dismantling or delayed decomposition must use the same body-energy reference rather
than create a second energy source. Changing d requires a new world definition, not a live edit
that revalues all existing biomass.

## Balance and tick contract

Held matter is extracellular chemicals + source inventories + internal chemicals + built stocks.
Held energy is the sum of every held chemical amount times its U, plus built matter times uBody,
plus usable cellular energy. Initial stocks, including founders, are counted exactly once.

```text
initialMatter + externalMatterIn = heldMatter + externalMatterOut + numericalMatterRemoved
                                  + numericalMatterResidual
initialEnergy + externalEnergyIn = heldEnergy + externalEnergyOut + dissipatedHeat
                                  + numericalEnergyRemoved + numericalEnergyResidual
```

Source supply and washout carry both matter and its actual chemical energy. Motion, maintenance,
learning, transport, reactions, construction, repair, division, death and capacity overflow have
separate heat counters. Uptake, secretion, births and corpse release are internal transfers or
throughput observables; they are not additional sources or sinks. Do not multiply all matter by
the old single nutrient energy constant or retain a matter-destroying catabolic shortcut.

Implemented ordering at a physiology boundary, retaining the shared browser/harness kernel:

1. Advance finite sources, diffuse fields, apply washout, then any enabled disturbance.
2. Sample all local receptors from one snapshot; run controllers and paid private learning.
3. Pay affordable movement, reserving due maintenance, and resolve contact in chemical impedance.
4. Calculate local stress and simultaneous import/export requests at resolved positions. Cap each
   cell's requests by energy, capacity and conductance, then allocate shared field supply. Commit
   all transfers together; neither imports nor exports relay through another cell in this phase.
5. Resolve internal enzyme requests against one post-transport inventory snapshot. Commit products
   and energy changes. Pay maintenance, repair and growth using actual remaining resources.
6. Resolve footprint/contact changes, optional typed allele transfer, death and funded local births.

All competing transport requests use conservative pre-transfer headroom; planned export does not
grant speculative space to import. Neural observations cannot see another cell's same-tick action.
Movement ticks are 0.2 seconds; field, inference and physiology accumulate 0.8 seconds.
Newborns infer at the next physiology boundary. Stop reasons, independent randomness and exact checkpoint continuation
remain part of the physical contract, including any pause before exceeding a resource limit.
