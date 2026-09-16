# Bounded numerical chemistry engine

The [fresh composed runtime](composed-runtime.md) supersedes this record's numerical
formulas and implementation sequence. The body below preserves previous evidence.

The [computational foundation](computational-foundation.md) and [ADR 0022](../../adr/0022-computable-chemistry.md)
govern the next mathematical design. The body below records the September 14 runtime, clocks,
laws and measurements; it is not a requirement to preserve those formulas or an active work
sequence. M1 subsequently added v4 profiles and physical checkpoint v12. New coupled spatial
operators remain experimental. Reuse ownership and useful numerical components, then select
computable composed laws and verify their cost through the current root plan.

Approved for implementation September 14, 2026. Sulion plan
`cad67253-df16-4762-9c69-ec1a9121130b` replaces the unfinished acceptance of
`d80ddca6-d78c-4f29-ac65-1164fe8ba5a8`. This document records the replacement contract;
implementation and measurements below must distinguish completed work from targets.

September 14 reliability revision: chemistry definition version 3 and physical/browser schema 11
add validated joint property coverage and [paid installed-machinery refitting](installed-machinery.md).
[Reliability results](reliability-results.md) supersede readiness inferred from headless capacity.

## Physical and evolutionary contract

Keep the 256-sample smooth, bounded chemical manifold, potential/diffusion/impedance/stress,
four inherited receptor/transporter/unary-enzyme slots, membrane compatibility, funded bodies,
local RNNs, paid private learning and explicit birth-local assimilation. Keep one periodic
geographic plane, finite localized sources, shared washout, individual funded reproduction,
independent random streams and at least two founder colonies. No controller receives geography,
ancestry, a destination or reproductive success. Chemical roles are uses, not built-in classes.

Use compact affinity `a(d) = max(0, 1 - d*d/(R*R))^2`, initially R=3. Non-core body targets use `core * ratio * max(0,1+gene)`; core uses an
exponential positive target. The RNN uses float32 SIMD arithmetic and rational saturation
`x*(27+x²)/(27+9x²)` within [-3,3], bounded outside, with checked error below 0.024 from tanh.
These approximate laws preserve local smooth response and paid capability, not old trajectories.
Compile genotype-specific
substrates, products and coefficients once. Physical mutation changes those operators; actual
installed stock supplies capacity. Flux allocation reserves shared substrates and uphill work;
commit `n += S*q` simultaneously. Preserve inefficient energy conversion, generic paid assembly,
paid repair with replaced-material release, and decomposition without an energy-producing cycle.

Cells separately retain the genotype defining installed receptor/transporter/enzyme identities.
Birth divides existing stock and inherits that identity. A changed inherited slot retains its old
function until usable energy above the protected reserve pays assembly work on the affected stock.
Refitting changes identity without creating or discarding biomass; its expense becomes heat.
The installed genotype stays reachable during pruning and is included in exact continuation.

Chemical-space generation now validates all four fast/slow diffusion × high/low impedance
combinations. A smooth interaction mode drives log diffusion instead of exact negation of the
impedance surface. Potential, stress, neighborhood affinity and connected persistent impedance
remain validated. The generator does not inspect ecological outcomes or search for favorable seeds.

Store internal chemistry in 256-element float64 vectors and external amounts in node-major float32
arrays. Fields may skip exact zeros but capacity acceptance assumes all 256 channels are present.
No abundance truncation is needed to control object count. Account field roundoff explicitly.
Use conservative face exchanges, shared impedance conductances, explicit stable substeps and
uniform exponential washout. Compute shared impedance and stress reductions; compatibility is a
short correction to baseline stress. Keep spatial mesh independent of rendering and cell positions.

Retain fission/budding, clonal/selfing transmission, haploid/diploid expression, inherited-learning
ablations, optional typed machinery transfer with paid retooling, and conservative local disturbance.
Inherited targets never instantiate material. Acquired neural state never mutates a shared genotype.

## Execution and durability

The [immutable data-sharing contract](data-ownership.md) governs all execution and observation
work below. Later feature plans cannot waive it. Scalar tick exports, borrowed rendering,
revisioned inspection/history and bounded acknowledged publication have runtime and CI enforcement.

One Rust kernel owns every simulation rule and compiles to WebAssembly for both browser and
headless experiments. The browser worker owns the world; TypeScript owns presentation, storage I/O
and experiment orchestration. A versioned command/observation boundary replaces direct mutable
world access. There is no TypeScript physics fallback or selectable former economy.

Observation packets exclude unrequested genomes, inventories and neural arrays. Inspection is
explicit. Checkpoints include physical state, chemistry definition, source schedules, RNGs,
private learning, genotype identity and ancestry. Reject incompatible schemas. Compact ancestry records and bounded caches keep historical strings and dead genotype payloads
out of ordinary physical work. Full snapshots and ancestry queries still scale with retained history. Storage
failure pauses visibly while preserving the live world and last good save.

The September 14 clarification requires eliminating render-array copies across the WASM and
worker boundaries. Keep WebGL2 in the world-owning worker through `OffscreenCanvas`. Its typed
arrays view packed cell/source/death records and five chemical layers in WASM linear memory.
The five layers share an eight-float node record; layer toggles change GPU uniforms. Rendering
and stepping run sequentially in that worker, so no reader can race a world mutation. Renew views
after memory growth. The main thread receives small summaries and requested inspections, never
the full field or per-frame cell arrays. This achieves the shared-pointer objective without
cross-thread `SharedArrayBuffer`, additional isolation headers, a second renderer or a threaded
Rust toolchain. The existing hosting module exposes no custom response-header configuration.
GPU texture/buffer uploads still transfer data to GPU memory; this is not a claim of shared
CPU/GPU physical memory. Checkpoint encoding is separate from rendering.

Browser mechanisms: [worker canvas ownership](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen)
and [shared-memory isolation constraints](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer).

## Implementation sequence and gates

1. Establish contracts, build, tests and a consumer/removal inventory.
2. Implement the numerical chemical substrate and analytical invariant tests.
3. Implement the complete local organism cycle and all retained evolutionary mechanisms.
4. Validate capacity and physical opportunities before application cutover.
5. Integrate worker observation, recovery and current experiments with the sole engine.
6. Remove superseded executable paths, reconcile current documentation, run CI/build and
   state browser/human-review limits. Historical evidence remains explicitly historical.

The capacity target is 60 ticks/s at 2,000 varied cells, with 30 ticks/s the minimum at the
declared operating workload. It is not a population prescription or a measured result.
Pin world dimensions, model timestep, mesh, chemical occupancy, private learning, observation
cost and device. Include saturated 256-channel fields and diverse genomes; do not reduce the
workload to obtain a pass. Compare model seconds advanced as well as ticks per wall second.

Register bounded numerical loads before executing them: initially 100 measured steps after
10 warm-up steps at 48 and 2,000 cells, one seed, 60-second wall cap per load. These are
constructed computation fixtures with explicit material grants, not viable communities.
After the resting load, repeat 2,000 cells with all inventories at 0.004 per species, body
stocks at 1.8 times birth targets (every tenth cell at twice its target), and usable energy at
capacity. This explicitly funded workload exercises growth, division, mutation and birth-local
learning. Keep the same warm-up, horizon, world, field coverage and 60-second cap. Report actual
initial/final population and divisions; a resting fixture cannot certify reproductive load.
Register mechanism probes separately, normally one or two cells for at most 600 steps and
30 seconds per case. First test source-dependent energy/growth, no-source reserve exhaustion,
shared uptake, membrane compatibility/self-exposure, detoxification, cross-feeding, detectable
emission, corpse capture, impedance and degradation, and meaningful transit costs. No seed
sweep, automatic horizon extension or long evolutionary campaign is authorized by this plan.

Nutrition/sensitivity fixture: one stationary diagnostic RNN, ordinary machinery and starting
reserves, 24×24 periodic world, seed 101, mutation/private/inherited learning frozen, thermal
motion zero. Supply is either absent or 48 units of the ordinary source pair in a normalized
sigma-two patch centered on the cell. Compare physiology intervals 0.8/0.4/0.2 at mesh 2 for
300 ticks each. Then compare mesh 1 at interval 0.8, and the ordinary moving founder with and
without supply at mesh 2/interval 0.8. A separate 600-tick empty stationary control tests exhaustion
of the known initial reserve. Each case has a 30-second cap. Predictions: acquisition repays
processing/construction, finite initial reserves cannot sustain growth, and resolution refinement
preserves the direction of the supply benefit. Record fluxes, injury, costs and reproduction.

Chemical-opportunity registration uses 24×24 worlds, one or two stationary diagnostic RNNs,
seed 101, no mutation, private learning or thermal motion. Initial inventory is 0.8 of ID240
and energy 0.5 unless a dose is stated. Installed stocks use the common founder blueprint.
Set daughter inventory threshold to 100 to isolate individual chemical flows from reproduction;
ordinary nutrition probes above test funded birth separately. Stop at 300 ticks, extinction or
30 seconds per case (emission: 100 ticks). Source pulses are normalized sigma-two patches.

| Question | Constructed conditions and controls | Decisive observations |
| --- | --- | --- |
| Cross-feeding | Two cells 1.4 units apart; donor ID0→128 with 48 external ID0; receiver ID128→240. Controls disable donor export or receiver processing. | Exported intermediate, receiver uptake/conversion and growth after expenses. |
| Detectable emission | Same donor; receiver ID128 receptor drives import through one ordinary RNN hidden unit. Compare export on/off. | Local cue, receptor input and resulting action; no communication-benefit claim. |
| Compatibility | Membrane at ID120 or ID240; extracellular ID120 concentration 0.1, or 0.2 internal ID120 replacing part of a 0.8 ID0 reserve. | Exposure integral, damage and paid repair, with nonzero compatible susceptibility. |
| Detoxification | ID0 nutrition plus ID120 importer and ID120→240 enzyme; zero-offset control. External ID0 48 and ID120 2. | Actual conversion and reduced exposure/repair burden; storage is a competing explanation. |
| Corpse capture | Known second founder with ID128 inventory 0.8 dies through ordinary release at tick zero. Receiver ID128→240 with import on/off. | Captured matter and extra construction or delayed death; no predation claim. |
| Paid impedance | One ID0→15 enzyme and ID15 exporter alongside ordinary ID0→240 nutrition; external ID0 48. | Production cost, exported ID15 and changed local mobility. Stop export at tick 100 and compare swimming with/without an accounted ID15 removal. |
| Degradation | External ID15 1 in sigma-one patch plus ID0 24; ID15→0 versus zero offset, nutrition retained. | Conversion versus temporary storage; after horizon, ordinary death tests whether retained ID15 returns. |

The same paid barrier also gets a ten-step field-only tracer comparison, retaining/removing ID15,
with identical pulse/background controls. This isolates diffusion from cell motion and consumption.
No long community run or evolved-advantage claim follows from these constructed opportunities.

Startup smoke registration: one seed-101 world with the actual default 48 founders in two
colonies, ordinary finite sources, private learning and mutation enabled. Stop after 600 ticks,
extinction or 30 wall seconds. Save exact initial/final checkpoints and the engine binary, and
sample global costs/flows every 20 ticks. This checks that the implemented opportunities reach
the production population; it cannot establish endurance, adaptation or stable community structure.

Use finer spatial/temporal resolution of the same laws for short sensitivity checks. A mesh
that removes a useful gradient or barrier or reverses a conditional payoff is inadequate.
Mathematical conservation alone does not establish affordable physiology. Constructed opportunity
is not evolved exploitation, and human visual acceptance remains a separate reported observation.

The numerical clock separates movement (`dt=0.2`) from field transport, sensing, neural
inference and physiology (initial interval `0.8` model seconds). Sources, motion, contact,
disturbance and optional contact transfer advance at every movement step. Physiology integrates
its full elapsed time; actions are held between neural updates. Field stability still determines
any necessary diffusion substeps. This is a model approximation under evaluation, not permission
to advance less model time in a capacity measurement. Compare intervals 0.8, 0.4 and 0.2 over
equal model time for resource access, exposure and growth; compare physical responses rather
than expecting chaotic recurrent trajectories to match. Births occur on physiology boundaries.

## Consumer migration responsibilities

Integration storage registration: retain the existing 100,000- and 2,000,000-record synthetic
parent-chain checks, with one living descendant and no ecological interpretation. Measure insertion,
census, selected inspection, raw snapshot, gzip packaging, restore, retained observation, exact
three-step continuation and WASM memory. Also check 64×64 empty, localized 16-channel, widespread
16-channel and dense 256-channel fields, plus the default 48-founder world. Each case has a
60-second wall budget, five measured steps and three continuation steps; no population campaign.
Use the same browser package codec and archive the loaded WASM binary. Retain failures. These
cases replace the old TypeScript storage checks; binary size and field layout are allowed to change.

Carry the previous plan's remaining observation/recovery/removal obligations into phases 5–6.
Appendix questions remain: source composition and epochs, access/capability, costly interference,
compatibility, impedance/degradation, emission, metabolic chains, family chemistry, corpse access,
sharing, transfer and disturbance. Preserve placements, learning ablations, denominators, horizons
and evidence provenance. Current CLI, batches, cohorts and reports require explicit disposition;
an old report reader may remain, but it may not advance an obsolete simulation.

Preserve world/population/cell visual hierarchy, ancestry and founding uncertainty, field choices,
chemical atlas, machinery and actual flux inspection, local file export and IndexedDB recovery.
Rendering and observers cannot influence reproduction or physics. Retune source economy and
movement using short causal checks, not a required number of enduring populations.

## Status

The worker/GPU bridge, binary recovery, current experiment/report consumers and retirement are
implemented. Integrated load ledger 3666–3668 includes packed five-layer rendering preparation,
census and inspection: 217/59.9/33.4 ticks/s for 48/2000/2000-growth loads, minimum windows
192.9/59.3/31.0. The growing load passes the minimum with little margin; GPU execution is excluded.
[Numerical migration](numerical-migration.md) records consumer dispositions and unverified human gates.

### Earlier numerical iterations

During implementation, the first single-rate WASM load measured 27 ticks/s with 48 cells
and 11 with 2,000. SIMD and algebraic work reduction improved those to 66 and 17 respectively
(ledger 3616–3619). Both used all 256 field channels and distinct genomes in the 2,000-cell
fixture. That iteration failed acceptance. These fixtures do not establish survivability.

Subsequent owned reductions, sparse mutation sampling, multirate integration and packed render
buffers pass the numerical capacity gate: 65 ticks/s at 2,000 cells and 35 during the growing
load. [Measurements and limitations](numerical-results.md) record the short chemical opportunities,
ordinary startup, failed intermediate loads and exact-continuation repair. These earlier figures exclude some final observer costs; use the integrated results above.
