# Bacterial world and lifecycle

The current runtime uses [digital chemistry](chemistry/README.md). The
[pre-chemistry contract](../sources/history/2026-09-13-pre-chemistry/design/bacteria.md)
preserves the replaced A/B economy. [Numerical evidence](chemistry/numerical-results.md) records constructed
physical opportunities and operating limits; no evolved community is supplied.

<a id="world-substrate-and-embodied-state"></a>

## Substrate and embodied state

One periodic 320 × 240 XY plane contains continuous circular organisms and a mesh-2 chemical
field. Neither axis is height. Sampling, motion, contact, offspring placement and rendering
use the same periodic geometry. There is no map oracle, compass or alternate substrate.

A cell owns position, heading, fifteen actual material stocks, a 256-element float64 intracellular chemical
mixture, usable energy, injury, four adaptive receptor baselines, contact state, private brain
state and immutable-genotype/ancestry references. Stored chemical matter contributes volume and
drag. Circular footprints use a spherical reference radius; this is an approximation, not a
resolved third dimension or fluid solver. Overdamped movement and Brownian rotation share local
impedance-dependent drag. Four bounded contact-separation passes resolve overlaps approximately.

<a id="world-fields-and-finite-deposits"></a>

## Fields and finite deposits

The world persists a constrained 16×16 chemical manifold. Every ID has potential, diffusivity,
impedance and stress. IDs have no privileged food, toxin, signal or matrix role. Dense node-major float32 arrays store all 256 species per mesh node. Conservative SIMD
face diffusion and one slow extracellular washout rate apply to all chemicals. Float32 rounding
has explicit matter/energy accounts; no concentration cutoff controls storage. See the
[selected numerical laws](chemistry/numerical-engine.md).

Forty-eight finite renewal sites occupy seven unequal abiotic neighborhoods. Their positions,
richness, radii and mixture proportions persist across localized renewal. Renewal is independent of organism demand or identity. Expired source
inventory is released with chemical identity intact. Sources supply matter and potential energy;
release from an already accounted source is an internal transfer.

The default chemistry seed is 101, independent of geography seed. Its physical source-selection
rule chooses IDs 0 and 15. This bootstrap composition is provisional. Ten percent of initial
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

1. Advance finite sources; on physiology boundaries advance conservative diffusion/washout.
   Apply optional disturbance each movement tick.
2. On physiology boundaries form local observations and run each RNN against the common field.
3. Pay affordable swimming/turning and resolve movement/contact.
4. On physiology boundaries apply membrane-dependent external and internal chemical injury.
5. On those boundaries resolve funded import/export from shared supply, storage and usable energy.
6. On those boundaries run unary enzymes, maintenance, repair and generic construction.
7. Correct contact and attempt local funded reproduction on physiology boundaries; apply optional
   contact transfer every tick. Daughters first infer on the next physiology boundary.

Transport cannot use prospective export to create import headroom; released material becomes
available in the next transport phase. Enzymes see one starting intracellular inventory, so products
cannot cascade by enzyme iteration order. Uphill reactions use energy already held. Downhill
overflow becomes heat. Movement and transport reserve basal maintenance before allocating effort.

Matter and energy close separately across fields, sources, cells, generic bodies, washout and
dissipation. There is no automatic scalar-reserve catabolism, direct prey yield, reserve sharing
or chemical-specific decay/binding pathway.

<a id="world-growth-death-and-reproduction"></a>

## Growth, death and reproduction

Any internal chemical can become generic biomass, paying assembly work and any uphill potential
gap. Growth fills deficits toward twice the inherited newborn target. Genes prescribe targets;
only installed stocks provide capability. Repair replaces actual material and pays energy before
growth. Replaced material returns as the generic decomposition chemical.

Fission requires all division stocks, daughter inventory/energy, the division charge and local
physical space. Failed placement grants no resources. Fission splits stocks, each chemical and
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

Checkpoint v11 stores complete chemistry, mixtures, actual stocks and installed identity, chemical/behavioral genes,
private state, parentage, source state, ledgers, interventions and stop reason. Earlier schemas
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
