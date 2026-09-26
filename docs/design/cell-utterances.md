# Directional cell utterances

Design specification, September 24, 2026. **Deferred and unimplemented; not the next work item.**
The user requested coarse directional hearing and implementation followed by natural observation,
without requiring prior proof of speaker return or evolutionary uptake. This revision supersedes
the initial directionless proposal and its pre-selection ecological checks. Consider this spec
alongside [light ecology](light-ecology.md), terrain/climate and the other
[backlog candidates](../backlog.md). Writing the spec does not start implementation or experiments.
The [composed runtime](chemistry/composed-runtime.md) still owns installed laws. The mechanisms
below define this future feature; dimensional calibration and implementation checks remain work
for delivery when it is selected.

## Purpose and distinction

Give a cell a way to make a brief, local statement about information available to its own
controller. Other cells may evolve responses. The carrier is a paid byte event with a coarse
listener-relative bearing and no distance input. It deposits no chemical, leaves no trail and
supplies no usable work to a recipient.
“Mouth,” “ear” and “utterance” describe artificial machinery, not a claim of acoustic realism
or an implemented language. No byte means food, danger, kinship or cooperation in physics.

Chemical export already couples information to transported material and its environmental
consequences. Proposed optical emission couples information to finite optical work, absorption
and shelter. Utterances would separate information from those material and work deliveries.
Whether this creates a conditional benefit beyond existing cues is a question for observation
after implementation, not an admission test. It is a deliberate simplification: there is no
propagation wave, attenuation, echo, occlusion or sound-powered metabolism.

The earlier [neutral-signal study](../signal-study.md) did not demonstrate communication.
Low secretion did not establish that cost alone caused failure; founder expression, accessible
variation and useful information were unresolved. A new carrier does not resolve those issues
by itself, and that old-physics result is not evidence for or against this particular design.

## Common operation

Compose funded actuation, a finite geographic incidence operator, a short vector reduction and
ordinary neural inference. Do not add a rule for each possible meaning or listener category.

For byte b, use eight signed components:

```text
phi_k(b) = 2 bit_k(b) - 1,                   k = 0,...,7
z(b) = [1, phi_0(b), ..., phi_7(b)]           nine message components
A_ji = 1 if j != i and periodic_distance(x_j, x_i) <= r_i; otherwise 0
D_ji = [1, cos(theta_hat_ji), sin(theta_hat_ji)]
incoming_j += sum_i gain_j_at_arrival * A_ji * outer(z(b_i), D_ji)
```

Every accepted event contributes equally throughout its disk. Radius decides delivery; distance
does not scale a delivered event. Use center-to-center distance on the existing periodic XY plane,
including seams. Circles and centers already have physical meaning; ears add no perimeter
quadrature. Hearing reach is omnidirectional; heading sets only the bearing's reference frame.
Self-events are excluded. The cell retains knowledge of its own neural outputs and private byte.

The leading component records received activity. Byte zero is a valid utterance and remains
distinct from silence. This byte is a signal identity, never a chemical ID or an instruction
that directly changes another cell's action, inventory, genes or private register.

## Coarse bearing without distance

For each delivered event, compute the shortest periodic displacement from the listener's center
to the emission center, then subtract the listener's heading at arrival. Quantize that relative
angle into 16 equal sectors, centered on forward at zero, left at pi/2, backward at pi and right
at 3*pi/2. Each sector spans 22.5 degrees; nearest-sector error is at most 11.25 degrees.
Round exact halfway ties toward the increasing sector index, modulo 16. Four bits suffice for
the sector code; a byte is a convenient storage representation, not 256 required angular bins.

Use the quantized direction's cosine and sine in the RNN reduction. Passing sector/15 as a
scalar would put adjacent directions on opposite sides of the wrap seam far apart numerically.
The direction describes a local sensory bearing to an actual paid event. It is not an absolute
compass, coordinate, remote destination, sender heading, identity or range estimate. Physics uses
distance only for delivery and discards it from the observation. Bearing amplitude does not
fall with distance. Rotating the world and listener together preserves the relative reading.

If centers coincide, or an exact periodic half-world tie gives multiple equally short bearings,
retain the utterance with D = [1,0,0]: sound was heard, but there is no unique direction. Do not
invent a bearing from cell identity or a preferred world axis. The same representation permits
directional cancellation during collisions; it does not report zero distance.

Freeze bearing, message and ear gain in the same arrival snapshot. Later movement or turning
does not update it or track the sender. It describes the direction when heard, which may be
stale when the next scheduled neural evaluation occurs. Neither this delay nor the bearing
grants a global clock or a distance input. Retaining or using a bearing is ordinary RNN behavior.

## Symbol geometry and simultaneous speakers

Use eight bit outputs decoded by their signs, plus one nonnegative emission-effort output.
The controller owns encoding and decoding. Keep its existing private byte private; speaking
must be an explicit neural action, not automatic disclosure of internal state.

Using b/255 would impose an ordered intensity axis on words: 127 and 128 would be close despite
every bit changing. Eight signed components instead give a clear Hamming geometry:

```text
||phi(a) - phi(b)||² = 4 * popcount(a XOR b)
```

Bit permutations and bit complements preserve this geometry. Apply the corresponding changes
to neural input columns and output rows to relabel a convention consistently. Arbitrary
permutations of all 256 symbols are not equivalent under this compact representation; it is a
compositional eight-bit alphabet, not 256 equidistant categories. That representational bias is
explicit. The existing chemical permutation algebra remains unchanged. It would be incorrect
to claim that adding another 256-value domain makes utterances chemical transformations, or that
reception and lossy mixing are invertible group actions.

Accumulate a 9-by-3 matrix T. Its first column is the original message reduction; the other two
columns retain each message component's circular directional moments. Let c = T[0,0]. Present:

```text
heard = T / (1 + c)                         27 bounded RNN inputs
heard[0,0]                                 received activity
heard[1..8,0]                              signed message components
heard[0,1..2]                              overall directional moment
heard[1..8,1..2]                           message-conditioned directional moments
```

One event preserves its signed bit pattern and quantized bearing. All channels have magnitude
at most one. The outer product is one shared operation over the same message vector, not
separate directional rules for particular bytes. Keeping message-conditioned moments avoids
assigning every word the single average direction of all speakers. This retains first moments,
not enough information to reconstruct every simultaneous byte/bearing pair.

Concurrent events superpose and may cancel individual bits or bearings. Equal identical words
from opposite directions retain message activity but cancel their directional moment; this is
ambiguous bearing, not silence or an invented third direction. Different messages can retain
different directional components. Do not round the mixture back to a byte or normalize a zero
directional vector: it can contain ambiguity without inventing a third speaker or message.
Repeated agreement strengthens a cue toward saturation;
disagreement obscures it. No nearest-speaker, loudest-speaker, lineage or iteration-order winner
is selected. Packet sequences and exact simultaneous message identities are not preserved.

This collision rule gives dense chatter a consequence without a separate interference
probability, a message queue or a bandwidth gene. The selected contract is bounded superposition
with coarse direction. Individually legible words amid arbitrary simultaneous speech are not
promised. Reconsider that limit against observed behavior after implementation if it matters.

## Funded machinery, work and reach

Add mouth and ear investment records through the existing optional-stock law. Both consume
ordinary material, assembly work, space, maintenance and repair. Zero investment is reachable
and can mutate back. Genes request capacity; only actual installed stock supplies function.
Ordinary construction allocation and retirement control both records.

Listening has no additional per-event work charge. It still needs maintained physical ears and
the existing paid learning mechanism. Reuse receptor gain, with ear stock in place of receptor
stock, scaled by actual core and the existing receptor reference ratio. Apply the selected common
damage convention consistently. Freeze this gain when an event arrives: later building an ear
cannot recover an event missed while deaf. Losing all ear function must prevent subsequent
arrivals, while an already registered input remains private experience until consumed.

Evolve reach through mouth investment and neural work allocation. A stronger mouth enables a larger paid event;
its controller can choose a smaller one. Thus range is heritable through machinery and policy,
but each utterance remains affordable at the moment it is emitted.

The work and reach law is:

```text
tau           existing physiological interval, model seconds
M             effective funded mouth stock, material units
p             shared actuator work rate, work / (material * model second)
a             neural emission effort in [0,1]
q             broadcast work per geographic area, work / area
A0            reference newborn core area, derived from core mass and body density
E0 = q*A0     minimum work to originate one event
Ecap          work remaining after the declared shared action reservations
E = min(a*p*M*tau, Ecap, q*(A0 + pi*r_max²))
r = sqrt((E/q - A0)/pi)                     only when E > E0
```

When E <= E0, emit nothing and debit nothing. Otherwise debit E once and book it entirely as
dissipation. No charge accumulator, future-work borrowing or partial unpaid packet is added.
Changing the symbol does not change its price. Extra stock is a power capacity, not an additional
per-event penalty for the same achieved radius. Doubling radius multiplies the area term by four;
the fixed origination term remains. This models work to establish a detectable broadcast over
a 2D footprint, not inverse-square attenuation of received magnitude.

Use the motor's work-per-stock rate as the common actuator scale. q is a new dimensional
conversion because no existing law converts spendable work into information-only geographic
coverage. It must be
calibrated against actual metabolic surplus and body spacing, not chosen to force cooperation.
A0 derives a finite packet overhead from existing body geometry rather than a separate knob.
These are artificial constitutive choices, not derived acoustic facts.

Require a finite maximum footprint. A periodic disk must not count the same listener through
multiple images; r_max must be at most half the shorter world dimension for the area formula
above. Bound reachable radius further by legal funded stock, action duration and work capacity.
Measure those bounds during implementation. If they permit impractical broadcasts, record that
operating limit and review the reach law; do not silently drop recipients or turn a performance
quota into biological hearing. World size is a geometry guard, not an automatically affordable range.

Action reservation order matters when work is scarce. Emission must join the ordinary frozen-work
budget for the chosen physical stage. It cannot double-spend motor, learning or growth reserves,
use prospective reaction income or reclaim its own signal. Complete that shared reservation rule
as part of implementation rather than granting mouths first access by loop order.

## An impulse across the physiological clock

The current RNN averages continuously held sensory channels and evaluates every tau, normally
0.8 model seconds. A one-base-tick pulse would otherwise be attenuated by its duration and a
zero-duration event would disappear. Use a dedicated event accumulator for the 27
communication inputs: each event contributes once, the next scheduled RNN evaluation consumes
the bounded reduction, then clears it. Existing continuous channels retain their time averages.

This is an explicit extension of the sensory contract: an event measure, not a hidden faster
controller or a large arbitrary amplitude. The pulse has a finite effect at one evaluation;
retention afterward requires ordinary recurrence or an explicit private-byte write. Reception
does not overwrite the private byte. Multiple arrivals before evaluation mix and lose ordering.
Response may wait up to tau, even though geographic delivery has no modeled travel time.

One actual controller evaluation may propose at most one utterance. A held action must not emit
again every base tick. Initialization, inspection and cache invalidation must not manufacture
additional emission opportunities. This uses the existing clock as the event-rate limit; no
separate cooldown or evolvable speech-frequency gene is needed.

Stage events after the current evaluations: freeze emission positions, listener positions and
headings, affordable work and ear gains; deliver the accepted batch only to living listeners in
that snapshot. Those events can affect a later evaluation, never another sender's decision in
the same batch. This prevents
zero-time relay cascades and dependence on cell iteration or worker order. Moving into the disk
later hears nothing; moving out after receipt does not erase an already registered event.
No lingering world sound field or physical packet lifetime is needed. The ear's pending response
lasts only to its next evaluation. Physical packet duration and propagating wavefronts would be
a different model, not implementation details to add automatically.

## Evolution, hereditary information and distance

Mouth/ear investments use the common physical mutation law and bounds. New controller weights
use the common behavioral mutation law. Rare large changes continue to come from the shared
heavy-tail distribution. No speech-specific mutation probability, semantic mutation, vocabulary
table or favorable speaker/receiver pairing is introduced. Any later independent reach allele
would need a declared physical domain and a transform of that same mutation law.

Actual mouth and ear stocks split conservatively at birth. Mutated investments change daughter
targets immediately without granting machinery; controls can build or retire stock normally.
Newborn pending hearing, hidden state and private byte reset. A budding parent retains its own
private experience under the existing lifecycle rules. A daughter cannot inherit a queued event
or a spoken byte as genetic memory. Birth-local assimilation may transmit the existing allowed
acquired recurrent-weight delta once; signaling creates no additional assimilation path.

Related cells can inherit similar encoding and interpretation through ordinary weights, so local
conventions are possible. Unrelated cells can learn or evolve similar responses too. Hearing
never uses genotype distance, chemical compatibility or ancestry to decide whom to trust.
There is no automatic kin channel, translation or requirement that relatives agree after mutation.

Keep these distinct in diagnostics:

| Distance | Meaning |
| --- | --- |
| Periodic geographic distance | Whether this event reaches this cell |
| Chemical manifold distance | Existing recognition, transformations and material response |
| Relative angular distance | Coarse direction from the listener toward an emission, never distance to it |
| Signal Hamming distance | Difference between the eight signal components |
| Controller/physical genetic distance | Differences in inherited policy and machinery, not message meaning |

Include new loci in the appropriate genetic comparisons. Existing controller RMS distance is
dimension-normalized; adding ports changes that statistic's baseline. Report component/schema
changes rather than comparing old and new values as if they measured the same representation.
Observed message frequencies are behavior, not a substitute for inherited distance or evidence
of dialect, cooperation or adaptive signaling.

## Ownership and execution budget

Rust owns the emission batch and per-cell pending reductions. Use existing persistent regional
geometry to find occupied listener regions intersecting event disks, with exact periodic distance
checks at boundary candidates. A mouth with no accepted event and an ear with no stock do no
delivery work. Silent space needs no new dense grid, acoustic solver or chemical row.

Regional jobs gather frozen events and commit only their own listeners. Retain fixed-size
reductions instead of sender/recipient histories. Storage is O(cells + accepted events + regional
membership); naive delivery still costs O(candidate encounters). Dense all-to-all speaking can
be quadratic even with bounded inputs. Saturation alone does not eliminate the work needed to
establish the reduction. Bearing is listener-dependent, so a single region-wide message sum
cannot replace the directional terms. Any shared work must preserve per-listener bearings and
gain, self-exclusion and boundary delivery. No speedup is established.

Checkpoint pending input, its consumption epoch and the once-only emission state. Rebuild derived
spatial membership on restore. The controller interface owns public input/action shapes; physics
does not inspect weight layout. With 27 sound inputs and two stock-feedback inputs, a direct
extension has 85 inputs, beyond the current u64 publication masks. Eight bit outputs, emission
effort and two stock-allocation outputs would produce 49 outputs. These are real controller,
codec, genetics, diagnostic and clock changes, not just a new field on Cell. Hidden width need
not change merely because communication ports exist.

Keep local rendering on borrowed WASM views and native-server display within the existing
[ownership contract](chemistry/data-ownership.md). Show bounded utterance counts, work spent,
hearing activity, coarse bearing/moment ambiguity and selected-cell traces. An optional visual
pulse is observational and must not retain a physical event history. No full-population inbox
messages to React or second server.

## Opportunities, failure modes and comparison with the backlog

The strongest opportunity is private information that a neighbor cannot already sense: internal
shortage, a recently experienced exposure or a change in intended activity. A receiver might
alter export, metabolism, repair or movement, changing the shared surroundings in a way that
eventually benefits the sender. Those are hypotheses, not assigned meanings or rewarded roles.

Directional hearing permits ordinary neural steering toward or away from a received utterance,
while movement still requires funded motors and interacts with ordinary contact and material
forces. It provides neither a path nor remaining travel distance. A byte can reflect a sender's
real local observations; it cannot contain coordinates or hidden environmental facts supplied
by physics. An authored diagnostic turn toward a sound checks this physical input/action path;
it does not assign attraction, alarm or recruitment to the production controller.

The major risk is an evolutionary coordination barrier: a mouth is costly before responsive
listeners exist, while ears may learn to exploit speakers without repaying them. Shared local
benefits, ecological feedback and inherited conventions might overcome that barrier; ancestry
does not guarantee they will. Silence, eavesdropping, deception and interference are permissible
outcomes. Uniform environmental cues may also make communication redundant. These are questions
to observe after implementation, not reasons to require proof of payoff or evolved behavior
before delivering the feature. Do not add subsidies, trust rules or cooperation rewards in
anticipation of those outcomes.

Compare this candidate with paid optical emission on informational purpose, sender return,
physical accounting and computational cost. Optical emission can also create shade/work niches;
utterances offer a cleaner discrete information experiment but add an independent carrier and
alphabet. Terrain/climate can first create differing local knowledge or exposure that gives
signals something useful to report. Neither dependency nor priority is established. Communication
remains eligible for the next design comparison without a demonstrated signaling advantage.

## Delivery checks and natural observation

When selected, implement the complete funded carrier, directional reception, controller ports,
inheritance, continuation and bounded observation. Calibrate q and reachable ranges against
current resource budgets, and record the shared work reservation order and founder configuration.
Founder machinery and connections are initial conditions to document, not a requirement to
demonstrate a profitable convention first. Authored diagnostic speakers/listeners must not
silently become an evolved protocol or a production founder change.

Delivery requires mechanical correctness and measured operating cost. Use bounded checks, with
mutation and private and inherited learning settings explicit:

1. One speaker/listener: zero stock, unaffordable events, equal delivered magnitude across the
   disk, periodic seams, work closure, impulse timing and exactly-once consumption. Include birth,
   death, save/restore, silence and cancelling simultaneous speakers.
2. Check all bearing sectors, angle wrapping, translated/rotated fixtures, coincident centers,
   antipodal ambiguity, fixed-bearing distance changes and listener turns after arrival. Swapping
   two different messages between directions must swap their corresponding directional moments.
   Use short ordinary-RNN fixtures to verify that received content and direction can affect
   funded action; no positive ecological return is required for this interface check.
3. Bound runtime cost for silent, sparse and dense simultaneous events, including the enlarged
   controller, membership, continuation and observations. Do not infer locality performance from
   an empty world or neural saturation.

After delivery, let the ordinary evolving world run under the user's chosen observation settings.
Do not pretrain a language, select favorable lineages, require a successful sender/receiver contest
or run a harness evolution campaign as a release gate. Observe speech use, listening, directional
responses, expenditure, inherited changes and population history through the existing bounded
observers. Speaking frequency alone does not establish meaningful communication.

Sender return and evolutionary uptake remain unresolved until that observation provides evidence.
If behavior warrants correction, first diagnose the observed failure: absent machinery, an unused
neural path, unaffordable reach, directional ambiguity, collisions, redundant information or a
cost without return. Then choose a short causal intervention that distinguishes explanations.
Matched silence, deafness, wrong-content or altered-bearing controls can help at that point;
measure sender and receiver consequences separately and retain negative findings. These are
available diagnostic tools, not mandatory prerequisites or an automatically authorized campaign.
The implementation supplies a real baseline to correct against without promising cooperation.
