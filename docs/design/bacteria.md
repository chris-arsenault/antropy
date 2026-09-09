# Top-down bacteria and live RNN evolution

Status: reviewed contract implemented September 9, 2026. Initial ecological comparisons are complete;
visual review is pending. See [measurements and limits](bacteria-results.md). No offline training
was used. Sulion plan `d805a90c-31e7-4f20-8fb1-5b2c05d9b417` tracks conversion.
The subsequent architecture correction is recorded in [ADR 0018](../adr/0018-bacterial-runtime.md).
Checkpoint v2 adds isolated genetic randomness and durable interventions. Initial v1 trajectories
and mutation/control differences are historical evidence, not certification of corrected runs.
The current [funded-body and inheritable-learning extension](funded-bodies.md) owns constructed
machinery, separate material/energy accounting and acquired-weight transmission. Checkpoint v4
supersedes the first extension's allocation tuple and private-only learning model. The details below
incorporate that correction; [v3 measurements](bacterial-evolution.md) remain historical.
The user authorizes the change of direction and RNN brains, with sensors and actions designed first.
The subsequent review adds phasic chemical readings, local chemotactic contrasts and paid chemical
release, while retaining an explicit task byte for inspection. These replace the initial proposal
that required the RNN to derive all temporal and directional chemical information itself.

## Purpose and preserved baseline

Observe inherited behavioral differences changing reproductive success in a resource-limited,
spatial population. Start with individual nutrient acquisition and physical division. Nest
architecture, colony coordination and an arbitrary minimum population are not prerequisites.
This is a biologically motivated model, not a claim to simulate bacterial physiology faithfully.

The ant runtime is preserved at commit `780fa4e`, annotated tag
`ant-colony-checkpoint-2026-09-09`, pushed to origin/main. The checkpoint includes source, design
history, the SQLite experiment ledger and the archived model required by the bounded tests.
Approximately 13 GB of generated experiment dumps and Python caches remain local, outside the
commit. The ant checkpoint passed `make ci`: 242 tests in 65 files. Its documented excavation
and lifecycle measurements do not establish emergent architecture or 2,000-worker capacity.

The browser now runs bacteria from tick zero. Earlier RNN cancellation applies
to ant training campaigns, not the newly authorized bacterial RNN. Do not resume those campaigns.
The ant scale gate and construction work order are historical for this direction.

## World and body

Use one top-down XY plane with continuous body positions and a raster nutrient field. X and Y
are equivalent horizontal axes; neither is height. A periodic rectangular domain avoids special
wall-following behavior in the initial ecological experiment. Field transport, sensing, collisions,
division placement and camera rendering must agree across the periodic seam.

Organisms have circular footprints with orientation, actual core/motor/transporter/storage material,
stored nutrient, usable energy, recurrent state, an opaque memory byte, a genotype reference and
ancestry. Radius is derived from spherical reference volume, including stored food. Growth and
reserve loading consume space. Overdamped propulsion changes position without inertial coasting. Local
body contact prevents unlimited overlap; use bounded motion/contact resolution and spatial bins.
Small seeded rotational diffusion supplies environmental perturbation. Its strength follows thermal
energy divided by actual rotational drag, with no resource-location knowledge. No fluid solver is required.

One dissolved nutrient supplies usable resource. Finite, spatially localized external inputs,
diffusion, uptake and decay change its concentration. A source pulse adds accounted nutrient;
ending a pulse stops supply rather than deleting what remains. Static and transient source schedules
provide the first environmental comparison at matched integrated input. Sources do not move in
response to organisms and have no controller-visible identities, coordinates or lifetimes.

A second, initially empty scalar field carries a chemical released by organisms. It diffuses
and decays with its own persisted transport constants. Release occurs at the emitting body's
position, costs precursor material and processing energy per unit, and cannot create edible nutrient. The field contains
concentration only, not author identity, task labels, ownership or target coordinates. Organisms
sense their own emissions and those of others through the same receptor; no self-signal subtraction
uses hidden provenance. Diffusion and decay must leave a measurable local signal before experiments
can interpret the consequences of secretion. Release does not automatically attract other cells.

Choose world dimensions, field spacing, transport rates and body speed together during kernel
implementation. Record units and dimensionless ratios, including travel time versus patch lifetime,
uptake versus replenishment, and swimming cost versus obtainable nutrient. Do not tune all of them
to make one lineage win. Numerical diffusion must preserve nonnegative concentration and an
explicit external-input/decay/uptake budget; time-step subdivision handles stability bounds.

## Sensor contract: nineteen float32 inputs

All inputs describe the organism's current body or immediate physical environment. Constants used
for normalization belong to persisted configuration. There is no population-relative normalization.
Observation occurs before the current action and before its uptake; it cannot contain the result
of an action that has not happened. The same tuple drives all controllers and diagnostics.

| Index | Input | Range and physical meaning |
| ---: | --- | --- |
| 0 | Nutrient tonic | C / (C + K), in [0,1], at the body center; K is the nutrient receptor's fixed positive reference concentration |
| 1 | Nutrient phasic | Current tonic minus the receptor's previous adaptive baseline, in [-1,1] |
| 2 | Nutrient forward contrast | (Cfront - Crear) / (Cfront + Crear + 2K), in [-1,1] |
| 3 | Nutrient lateral contrast | (Cleft - Cright) / (Cleft + Cright + 2K), in [-1,1] |
| 4 | Released chemical tonic | Same tonic transform, using the released chemical's own K |
| 5 | Released chemical phasic | Same temporal contrast for the released chemical |
| 6 | Released chemical forward contrast | Same front/rear spatial contrast for the released chemical |
| 7 | Released chemical lateral contrast | Same left/right spatial contrast for the released chemical |
| 8 | Usable energy | Energy / actual core energy capacity, clamped to [0,1] |
| 9 | Core growth | Actual core / genetic newborn core target minus one, clamped to [0,1] |
| 10 | Front contact | 0 or 1: another body touched the front sector during the previous physical step |
| 11 | Left contact | Same contact fact for the left sector |
| 12 | Rear contact | Same contact fact for the rear sector |
| 13 | Right contact | Same contact fact for the right sector |
| 14 | Task byte | byte / 255; the organism's own previous explicit memory value, without kernel task semantics |
| 15 | Built motor | Actual motor material / (actual motor material + reference newborn motor material) |
| 16 | Built transporters | Same saturating transform for actual transporter material |
| 17 | Built storage | Same saturating transform for actual storage scaffold material |
| 18 | Stored nutrient | Nutrient material / actual storage capacity, clamped to [0,1] |

Contact sectors are four body-relative 90-degree arcs, with a fixed boundary tie rule. Multiple
contacts can activate multiple sectors. This is surface contact, not a radius query reporting
nearby competitors or their intentions. Newborns start with zero previous-contact inputs.

Spatial samples lie on the body's front, rear, left and right perimeter, with bilinear field
sampling and periodic wrapping. They give local concentration differences, not a direction to a
source. This explicit spatial sensing abstraction supports chemotaxis without reconstructing it
from random wandering. Field resolution must resolve body-scale differences; a flat field must
return zero contrasts. Motor choices still belong entirely to the RNN.

For each chemical, receptor memory stores an adaptive baseline m. Observation reports p = tonic - m;
after forming the observation, update m += (1 - exp(-dt / tau)) * (tonic - m), using a positive
persisted receptor time constant tau. Thus phasic means a signed response to recent change, not a
global oscillation or a supplied improvement/reward score. The reading can change through body
motion, external diffusion, depletion or self-secretion; it does not tell the network which occurred.
Persistent levels retain tonic information after the phasic response adapts toward zero.

Each newborn initializes receptor baselines from concentration at its own birth position, preventing
an artificial birth spike. Checkpoints preserve both receptor baselines exactly; they are sensory
body state, separate from the RNN and task byte. Receptor processing has a fixed maintenance charge
and does not add heritable parameters initially. Noise and heritable receptor time constants can
follow a specific experimental question, rather than entering this first implementation by default.

Own-body inputs report machinery that has physically been built and the cell's stored food.
Construction targets do not masquerade as available capacities. These are proprioceptive
readings, not world knowledge; they add no population-relative information.

No absolute position, compass bearing, world tick, patch label, nearest-food bearing, route,
remote map, lineage identity, reproductive score or hidden population demand enters the network.

## Action contract: five outputs, three physical effectors

| Output | Decoding | Effect and limit |
| --- | --- | --- |
| Propulsion | max(0, tanh(logit)), [0,1] | Forward motor effort; speed is bounded by expressed motor capacity, mass-dependent drag and contact. Quadratic motor cost depends on requested effort even when blocked. Nonpositive logits produce exact zero effort. |
| Steering | tanh(logit), [-1,1] | Signed angular motor effort; bounded rotation rate and explicit turning cost. It can turn without translating. |
| Lay chemical | max(0, tanh(logit)), [0,1] | Release effort times the maximum secretion rate and dt, limited by precursor material and paid processing energy; exact zero release is possible. Deposit locally after movement, with no broadcast or automatic following. |
| Register value | round(255 * sigmoid(logit)) | Candidate value for the private opaque byte |
| Register write | sigmoid(logit) >= 0.5 | Commit the candidate byte for the next observation; otherwise retain the old byte |

Outputs select simultaneous efforts, not an argmax over task labels. Register writes have no
environmental side effect and incur no separate arbitrary metabolic fee; all inference carries
the same fixed controller maintenance charge. Physics never interprets the byte as forage, return,
rest, divide or any other task. No programmed task dispatcher or network ensemble runs beside it.

The task byte is a named inspector field with an event history of actual writes. Diagnostics can
group actions, secretion and trajectories by byte value; optional human labels do not enter the
controller. A manual byte override is a logged diagnostic intervention, never an unrecorded change
to an evolution run. Intervention history persists separately from bounded recent inspector events
and the UI marks intervened populations as diagnostic. This retains the debugging benefit from
ants without fixing behavioral roles.

Swimming and turning share the installed motor power budget. After optional learning expenditure,
motor and secretion requests share usable energy remaining after basal maintenance is reserved.
If their combined cost is unaffordable, scale physical efforts by a common factor to fit the
quadratic-motor/linear-secretion budget; the resolved secretion amount and charged energy must agree. The chemical cannot be
released first and charged later after some other action has exhausted the cell's energy.

Eating is local passive uptake with a finite rate; growth and division are physiological processes.
Making them mandatory motor commands would introduce an unnecessary failure chain before behavior
can affect reproduction. Initial behavior controls motion and local chemical modification.
Resting reduces motor expense, not basal maintenance. Dormancy, attacks, adhesion,
multiple food metabolisms and digging are outside this first interface.

## RNN and inheritance boundary

Use one dense Elman RNN: nineteen inputs, sixteen tanh recurrent units, five output logits.

```
h_next = tanh(W_input * observation + (W_recurrent + abs(alpha)*H) * h + b_hidden)
logits = W_output * h_next + b_output
```

This has 661 inherited scalar parameters: 304 input weights, 256 recurrent weights, 16 hidden
biases, 80 output weights and five output biases. Nine additional inherited loci specify the
bounded, modulated recurrent learning rule. Weights, observations and private state use
float32; physical resource ledgers can retain higher precision. Topology is fixed initially.
Bounded initialization and mutation keep weights finite. The controller boundary owns genome
encoding, inference and variation; physics reads actions, not network internals.

The sixteen recurrent values, memory byte and 256 synaptic traces belong to the individual.
Before crossover/mutation, acquired recurrent changes are assimilated into birth-local chromosome
copies at configurable retention (default one). The parent and other cells sharing its genome are
unchanged. Fission replaces the parent with two daughters;
budding preserves the parent's identity and memory while producing one daughter. Newborn hidden
state, register and traces are zero; inherited learning already resides in the child's baseline
weights. Preserve ancestry explicitly. Registered genotypes are immutable; learning transfer,
recombination or mutation can create a new one. Per-world environment, body and genetic random streams and
stable execution order are persisted independently. Consuming genetic draws without changing a
weight must not change physical placement or headings. Controller-owned codecs define durable
genome/private-state encodings; the world and persistence modules do not interpret network layout.

No offline optimizer, imitation curriculum, reward model or old ant weights are assumed. Begin with
a documented small RNN founder initialization whose ordinary uptake can fund division in a nutrient
patch. Bounded mechanics tests supply diagnostic motor efforts; full ecological comparisons use
mutation-disabled, retention-zero founder controls. Stationary and random-swimming ecological controls remain
unmeasured, and no diagnostic policy enters the live population as a fallback.
The founder may encode a weak nutrient-contrast response in its RNN weights to establish initial
chemotaxis. Those are ordinary mutable weights, not an external steering reflex or a residual
programmed controller. A local gradient makes directed response representable; it does not guarantee
that arbitrary recurrent weights will follow it. Founder behavior must be observed on the actual
sensor tuple. No task labels or secretion convention are required for initial viability.
If this founder cannot reproduce, identify the resource/body/interface failure before increasing
network size or introducing training. Live mutation begins at division, with small bounded weight
perturbations and a persisted per-weight mutation probability. Do not screen or discard mutants
using predicted fitness. Training would require a separate decision.

## Resource-funded growth, death and division

Material and usable energy are separate quantities with explicit ledgers. Uptake removes nutrient
from the same field that sensors sample. Requests are bounded by transporter kinetics, near-body
diffusion, actual storage space and available field material. Shared requests divide limited
nutrient proportionally. Catabolism consumes stored nutrient at a finite core-dependent rate,
records waste and inefficiency, and fills usable energy. Maintenance charges actual core and each
machinery stock; propulsion, steering, secretion processing and controller operation consume energy.
Unaffordable effort is limited without negative reserves.

Four independent genes specify a newborn blueprint. Actual deficits toward twice that blueprint
drive construction, bounded by assembly rate, stored material and usable energy above protected
fractions. Construction consumes material and synthesis energy. Existing stocks survive target
mutations; a larger motor target grants no immediate power. See the
[physical equations and resource books](funded-bodies.md).

Division requires every actual stock to reach twice the parent's blueprint, enough food and usable
energy for two resulting bodies, division energy and physical placement space. After paying the
cost, every stock, stored food and remaining energy splits equally. No free newborn resources or
automatic displacement of an unrelated cell. If local
placement fails, the parent remains, pays maintenance and retries physiological division later.
Placement candidates are bounded local offsets with deterministic seeded orientation; no search
for remote free space. Crowding can therefore constrain reproduction directly.

Usable-energy exhaustion after catabolism and maintenance causes death. Remaining embodied resources enter a recorded loss
sink rather than inventing an unmodeled recycling pathway. No age timer, fixed population census,
fitness-based culling, generation boundary or automatic rescue/reseeding. Extinction remains visible.
A numerical/runtime population limit pauses with an explicit reason instead of silently killing
organisms or rejecting births as an ecological rule.

The step order is fixed: external supply/transport; observations and inference from one snapshot;
paid movement/contact and chemical release; simultaneous limited uptake; catabolism/maintenance/construction/death; local division and
mutation; diagnostics. Maintenance and action affordability reserve the due basal cost before
spending on motors. New daughters first sense and act on the next tick.
All organisms observe the same pre-release chemical snapshot; a cell cannot receive another cell's
same-step secretion merely because it appears later in iteration order. Field mass records emitted
chemical and its decay separately from nutrient and metabolic energy accounting.

## Behavior-to-mechanism traceability

| Question | Available information and action | Competing consequences |
| --- | --- | --- |
| Stay or leave a depleted patch? | Tonic/phasic nutrient and recurrent history; propulsion and turning | Nearby remaining food versus travel cost and unknown opportunity |
| Track a local chemical gradient? | Body-relative forward/lateral contrasts; steering and propulsion | Directed local search versus pursuing a weak, stale or self-generated signal |
| Explore quickly or economically? | Reserve and nutrient; continuous propulsion | Earlier patch discovery versus less energy retained for division |
| React quickly or integrate evidence? | Tonic/phasic readings and recurrent dynamics | Responsiveness versus persistence through small spatial fluctuations |
| Escape crowding or keep exploiting? | Surface contact and nutrient; steering and propulsion | Less reproductive/uptake interference versus abandoning food |
| Emit, follow or avoid a chemical? | Chemical readings, reserve and task memory; paid local release and motion | Spatial information or altered encounters versus secretion expense, competition and self-trapping |

These are explanatory hypotheses, not scripted behaviors. The initial system may favor one
strategy. Persistent diversity, complex social behavior and open-ended novelty are not promised.
The first evolutionary result is a heritable behavioral difference with an environment-dependent
effect on descendants. Simply changing colors, weights or movement variance is insufficient.

## Conversion sequence and acceptance

1. Completed: review this world, sensor/action and RNN contract before runtime edits.
2. Completed: build the top-down body/resource kernel, chemical transport and receptor adaptation, ordinary growth/death/division and bounded invariants.
   Keep the controller pluggable. Use diagnostic motors to isolate mechanics, not to certify brains.
3. Completed: integrate the reviewed RNN, private register, float32 inference and full deterministic checkpoints.
   Make top-down bacteria the tick-zero paused browser default, with Run and useful stats sufficient.
   Preserve pan/zoom and pacing controls. Verify resource-funded RNN reproduction without mutation.
4. Completed: enable genome inheritance, birth-local mutation and lineage records in the same physical loop.
   Do not defer this behind 2,000 organisms or additional ecology. Measure actual throughput.
5. Initial panel completed: compare persistent and transient nutrient schedules at matched supply, mutation-disabled controls,
   and saved ancestor/descendant competitions. These are read-only assessments of selection, never
   mechanisms that choose parents. Record failed hypotheses and extinction, not only successful runs.
   The measured descendant does not establish reliable adaptation; no candidate was promoted.

Next: review [funded bodies and inheritable learning](funded-bodies.md) on the tick-zero browser default.
Additional ecological mechanisms or training
are not automatic follow-on work. The 2,000-cell throughput limit is recorded in the results.

Reuse the deterministic scheduling, Canvas camera, pacing and resource-ledger patterns where they
fit. Replace ant-specific bodies, routes, lifecycle, terrain/support and controller contracts rather
than preserving a parallel ant runtime. The Git tag is the recovery path. Checkpoints carry an
explicit substrate/schema identity and reject incompatible ant files without an adapter. Old
ledger rows retain their original experiment and substrate identities; do not relabel them bacteria.

Default stats show living population, births/deaths, resource input and loss, embodied reserves,
lineage abundance, observed swimming/turning and chemical release. The selected organism inspector
shows tonic/phasic/contrast readings, recurrent activity and task-byte writes alongside resolved
actions. A chemical overlay must be available, with visible secretion in the review defaults.
Detailed lineage replay and controller inspection
remain available without becoming sensor inputs. The user performs visual review; no browser
simulation, server launch or training campaign was used for this implementation.

Keep deterministic tests to conservation, contact/periodic boundaries, field stability, sensor
locality/timing, receptor step-response/adaptation, paid secretion, inheritance and checkpoint continuation. Behavioral comparisons
belong in the harness ledger. If a mechanism fails its stated prediction, inspect the failing
lineage and environment before adding sensors, networks or physics. New subsystems require a
separate decision; an unsuccessful experiment is a result, not permission for unlimited scope.
