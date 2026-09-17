# Bacterial world and lifecycle

The current runtime uses [digital chemistry](chemistry/README.md). The
[pre-chemistry contract](../sources/history/2026-09-13-pre-chemistry/design/bacteria.md)
preserves the replaced A/B economy. [Environmental evidence](chemistry/environmental-results.md) records constructed
physical opportunities and operating limits; no evolved community is supplied.

<a id="world-substrate-and-embodied-state"></a>

## Substrate and embodied state

One periodic 320 × 240 XY plane contains continuous circular organisms and a mesh-2 chemical
field. Neither axis is height. Sampling, motion, contact, offspring placement and rendering
use the same periodic geometry. There is no map oracle, compass or alternate substrate.

A cell owns position, heading, fifteen actual material stocks, a 256-element float64 intracellular chemical
mixture, usable energy, injury, four adaptive receptor baselines, contact state, private brain
state and immutable-genotype/ancestry references. Stored chemical matter contributes volume and
drag. Circular footprints use radius sqrt(occupied area/π). Paid movement and passive profile
response share local impedance-dependent mobility. A bounded local pair correction resolves
overlaps approximately. There is no temperature, Brownian rule or fluid solver.

<a id="world-fields-and-finite-deposits"></a>

## Fields and finite deposits

The world persists a constrained 16×16 chemical manifold. Every ID has potential, diffusivity,
impedance and stress. IDs have no privileged food, toxin, signal or matrix role. Dense node-major float32 arrays store all 256 species per mesh node. Conservative SIMD
destination-row diffusion plus shared-profile drift and one slow extracellular washout rate apply to all chemicals. Float32 rounding
has explicit matter/energy accounts. Active chemical groups skip empty stencil work; concentrations
below 1e-9 are rounded to zero with signed numerical accounts. Storage remains dense. See the
[selected numerical laws](chemistry/composed-runtime.md).

Local mixture profiles favor compatible chemical transformations through a compact compiled
operator. There is no independent weather clock or baseline conversion in neutral medium.
Unfunded transformations cannot increase reference value. The existing impedance response
attenuates conversion. Paid exports can change both product selection and exposure; deposits
remain available to neighbors and subject to transport, washout, weathering and uptake.
Controllers receive the resulting chemistry through their ordinary local sensors.

Forty-eight reservoirs start in seven unequal abiotic neighborhoods. Local chemical gradients
move them with impedance-dependent drag, including during renewal waits. Richness and radii
persist; renewal uses the current location and configured incoming mixture. Independent renewals
continue indefinitely, importing accounted matter and potential. Release is an internal transfer
whose chemical identities can change with the local medium, conserving material and dissipating
potential. Expiration uses the same processing rule. See [source laws and short evidence](chemistry/mobile-source-results.md).

The default chemistry seed is 101, independent of geography seed. Its physical source-selection
rule chooses IDs 0 and 80. This bootstrap composition is provisional. Ten percent of initial
source inventory is dissolved locally, with zero uniform background grant. Forty-eight identical
mutable founders occupy two separated source neighborhoods, 24 per colony. Their membrane
matches the primary retained metabolite; the mutable controller exports only near storage
capacity. [Small numerical probes](chemistry/numerical-results.md) support supplied growth and resource exhaustion;
the integrated capacity check retains 48 founders and tests two 2,000-cell loads.
Single-site/no-source diagnostic
worlds retain their corresponding placement behavior.

Optional `sourceEpochs = { phaseTicks, mixtures }` schedules incoming composition. Optional
`sourceZones` assigns incoming mixture shares to vertical bands. Both use share vectors indexing
`sourceSpecies`; they are alternatives. Existing mixtures retain their identity across a change.
Equal supplied matter need not have equal potential energy. Record both ledgers when comparing
compositions. No calendar, zone label or chemical ID enters the controller directly.

<a id="world-turn-order-and-resource-economy"></a>

## Turn order and resource economy

Movement ticks advance 0.2 model seconds. Field/sensing/physiology accumulate 0.8 seconds
before their updates; actions remain held between inferences. The phase order is:

1. Freeze local source responses, drift and release processed material; compose chemical/body
   signals. On physiology boundaries advance
   conservative diffusion/drift/washout through the full accumulated interval, followed by
   conservative extracellular weathering and accounted potential loss.
2. At startup and physiology boundaries form local observations and run each RNN against the common field.
3. Pay affordable swimming/turning and resolve movement/contact.
4. On physiology boundaries resolve funded import/export from shared supply, storage and usable work.
5. On those boundaries apply membrane-dependent external/internal injury, unary reactions,
   repair, paid refitting, generic construction and work overflow.
6. Pay maintenance every movement tick; resolve death, optional disturbance/contact transfer
   and funded reproduction. Daughters first infer on the next physiology boundary.

Transport cannot use prospective export to create import headroom; released material becomes
available in the next transport phase. Enzymes see one starting intracellular inventory, so products
cannot cascade by enzyme iteration order. Uphill reactions use energy already held. Downhill
overflow becomes heat. Growth/refitting protect upkeep and current motor/learning work through
the next physiology interval. Motor and transport effort otherwise compete for available work.

Matter and energy close separately across fields, sources, cells, generic bodies, washout and
dissipation. There is no automatic scalar-reserve catabolism, direct prey yield, reserve sharing
or named chemical decay/binding pathway. Weathering uses the same generic property-derived map
for every chemical, with fixed points and susceptibility determined by the chemical definition.

<a id="world-growth-death-and-reproduction"></a>

## Growth, death and reproduction

Any internal chemical can become generic biomass, paying assembly work and any uphill potential
gap. Growth fills deficits toward twice the inherited newborn target. Genes prescribe targets;
only installed stocks provide capability. Repair replaces actual material and pays energy before
growth. Replaced material returns as the generic decomposition chemical.

Fission requires all division stocks, daughter inventory/energy, the division charge and local
placement in the periodic plane. Daughters separate along the parent's heading and subsequently
participate in ordinary local overlap resolution. Fission splits stocks, each chemical and
post-cost energy equally; budding uses the same split while retaining the experienced parent.
Changed inherited machinery retains its installed function until paid refitting is affordable.
Birth splits installed stock and identity rather than granting new machinery. Damage fraction
persists. Starvation or unit injury releases inventories unchanged, converts body material to the
decomposition species and dissipates remaining usable energy. No killer receives a direct grant.

There is no age timer, remote parent selection, fitness culling or automatic reseeding. Extinction
stops the run. Population and ancestry safety limits pause with retained state.

<a id="world-determinism-and-persistence"></a>

## Determinism and persistence

Environment, body and genetic randomness have separate saved streams. The chemistry definition
has its own generation seed, persisted coefficients, ranges, resolved table and validation results.
Physical quantities use float64; field amounts and neural arithmetic use float32. Owned
reductions preserve exact continued ticks after save/restore on the tested runtime. Cross-machine
bitwise identity is not promised.

Checkpoint v19 stores complete chemistry, mixtures, actual stocks and installed coordinates/revision, chemical/behavioral genes,
private state, parentage, source state, environmental configuration, ledgers, interventions and stop reason. Earlier schemas
and retired configuration/state fields are rejected. There is no adapter supplying missing physics.
Unused non-founder genotype payloads may be pruned; complete organism parentage retains their IDs
as provenance, and unavailable genetic comparisons must be labeled.

Browser observation is a separately versioned projection. IndexedDB retains six automatic and
two manual gzip recovery points within 256 MiB; a raw checkpoint is limited to 192 MiB.
Automatic saves occur every 30 wall seconds and on pause. Failed writes pause execution and
preserve the last committed recovery. Visibility/exit saves are best effort; restoration is
explicit and starts paused. UUID generation supports browsers without `crypto.randomUUID`.
See [continuation limits](../continuing-observation.md) and the
[current load measurements](chemistry/numerical-results.md). Days/weeks browser endurance remains unverified.
