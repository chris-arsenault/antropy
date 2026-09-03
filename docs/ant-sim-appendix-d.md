# Appendix D: From Shaft to Nest — The Micro-Step Ladder, the Actuation Contract, and Staged Morphogenesis

*Supplement to the Ant Evolution Simulation Design Specification — September 2026, Rev. A.
Appendices A–C are frozen; this appendix does not amend them. Design Rules continue their
numbering.*

> **Abstract.** This appendix converts the open question — *"how do we get from a scripted oracle
> digging a shaft to an RNN ant digging a colony?"* — into an ordered ladder of micro-steps, each
> with one deliverable, one pass condition, and an explicit **config-gate state**, using **only
> mechanisms that already exist**. The ladder executes on the `SimConfig` gate system: every
> later-phase system (mortality, decay, seasons, weather, microclimate, brood rearing…) is a
> named gate, the ladder starts from the `PHASE2` preset (all gates off), and climbs toward
> `FULL` by re-admitting **one gate at a time**, measuring what each costs. The appendix then
> freezes the actuation contract the ladder depends on, headlined by the oracle-parity
> requirement: oracles and RNN ants must drive the identical world resolution through the
> identical output tuple, so that every oracle-hour hardens the exact pipeline the RNN inherits.
> The full morphogenesis program (carrier audit, rule tournaments, morphometrics, function
> coupling) is recorded last, explicitly staged **behind** the ladder: none of it is authorized
> until the ladder's shape gate passes, and none of it authorizes new world features by default.

---

## D.1 Scope, Fence, Gates, and Current State

**Spec/status separation.** This document specifies; it does not track. Certification status
(which steps are green, which findings are open) lives in a repo status ledger
(`docs/certifications.md`), updated per run — embedding status here has already gone stale twice
and will always. **Ladder target:** an RNN ant, through the real controller and shipped sensors,
digging a branched nest with structure that earns ledgers, on a live energy economy — reached by
re-admitting gates one at a time from `PHASE2` toward `FULL`.

### D.1.1 The config-gate system (the ladder's execution mechanism)

The project was built in the wrong order — evolution and late-phase liabilities landed before
the Phase 2 base case existed — which made failures unattributable: founding nests decayed onto
queens, digging drowned under stochastic evolution, and "does an ant dig at all?" required
editing source. `SimConfig` repairs this by making each later-phase system a **gate** checked at
its own entry point. Its design rules are adopted here as binding on the ladder:

- **A flag is never a magnitude.** Gates turn whole systems on/off; numeric constants live in
  the tunables layer (P-layer, App. C) and are tuned via the harness, never via flags.
- **Per-world config.** Each world clones its config; one run's flags cannot corrupt a preset.
- **Checkpoints serialize the config.** A saved run reloads under the world it was actually run
  in — without this, ledger comparisons across checkpoints are meaningless.
- **`spoilCapacity: null` = genome-derived** is the template for every gene-adjacent override:
  carry capacity belongs to evolution (Rule 9, genome territory); the override exists for
  experiments, not as a global constant that outranks selection.

Two findings the gate system has already produced — recorded because they validate the method:
the founding nest "collapsing onto the queen" was `nestDecay` (a Phase-4 system running during a
Phase-2 question), not broken nest mechanics; and `spoilHauling`'s choreography was consuming
most ant-time, which is why digging *looked* nonexistent. Both are exactly the class of
misattribution the spec's §13 phasing was designed to prevent, recovered after the fact.

> **Design Rule 17 (One gate at a time).** The ladder starts at `PHASE2` (all gates off) and
> climbs toward `FULL` by re-admitting **one named gate per step**, measuring its cost on the
> step's ledger before the next is admitted. Two gates never turn on in the same step. During
> all ladder measurement runs, `autoContinue` stays **off** — a refounding safety net masks
> colony death, and colony death is data. `wideEntranceShaft` stays **off** (1×1 is navigable
> since the locomotion fix; `FULL` retains 2×2 only to preserve Release 3 calibration, which
> the ladder does not touch).

> **Design Rule 14 (The fence).** For the duration of the ladder (§D.2): **no new fields,
> sensors, materials, or mechanisms.** The deliverables are rules on existing machinery, shape
> comparisons, and reports. An agent that believes something is missing from the world files a
> finding report naming it (App. C §C.5) — it does not build the thing. Chambers and branches
> are pursued with exactly two ingredients, both already shipped: the unlabeled pheromone
> channels and the crowding sensor. **Re-admitting an existing gated system per Rule 17 is not a
> fence violation; building a new one is.** The fence and the gates are complementary: gates
> keep the already-built future out of the present; the fence keeps an unbuilt future from being
> built early.

Rationale (one paragraph, so the fence reads as reasoned rather than arbitrary): real nest
morphogenesis is behavior × world feedback — no architect, no blueprint; local rules coupled to
fields produce chambers and galleries [[1]](#references), [[2]](#references). The full ingredient
list of the biology (humidity, CO₂, temperature templates) is *not yet warranted*: the carrier
audit of §D.4.1 shows the two cheapest known symmetry-breaking mechanisms — digging-site
recruitment marking and crowding-dependent lateral digging — are already implemented. The ladder
tests whether those two suffice **before** any richer world is contemplated.

---

## D.2 The Micro-Step Ladder

Each step: one deliverable, one pass condition, one config state, existing mechanisms only. A
failure points at the step that owns it. **Grain-size test:** *if a step's failure report could
name two different culprits, it is two steps* — apply this test when extending or reviewing the
ladder; the original compound steps 10–11 failed it and were decomposed into 10a–10e and
11a–11c below. The **Gates** column gives the delta from `PHASE2`
(everything off); per Rule 17, each step admits at most one new gate, and a gate once admitted
stays on for all later steps unless noted. Steps 1–9 reach the first RNN nest; steps 10a–12
extend to the next reasonable goal — a nest that *earns* something — still inside the fence.

### D.2.1 Shape vocabulary (measurement, not targets)

The word "widened" was doing two jobs — step 4's existence test and step 10's brood question —
and agents correctly read the weaker meaning into both. Fixed vocabulary, computed by **one
shared O-layer classifier** used by every step that references these terms. The definitions are
mechanical; where a choice existed, it is made here:

- **Corridor voxel:** an air voxel contained in **no** 2×2×1 all-air block **in any of the three
  axis-aligned orientations** (xy, xz, yz). Transit-only by construction.
- **Partition procedure (no overlaps by construction):** (1) classify every air voxel
  corridor/non-corridor; (2) take 6-adjacency connected components of the non-corridor voxels —
  these components are the **voids**, mutually disjoint; (3) each void is classified **chamber**
  or **bulge** by the tests below.
- **Chamber:** a void that (a) **contains at least one 2×2×2 all-air block** (this is the
  volume condition — it subsumes any separate $V_{\min}$, and it is what excludes fat hallways,
  which widen without vertical extent); (b) has **doorway count ≤ 2**, where a doorway is a
  corridor voxel 6-adjacent to at least one voxel of the void (a two-doorway pass-through room
  is still a room); (c) is **interior**: no voxel of the void is 6-adjacent to a surface voxel,
  per the sim's existing surface/depth classification.
- **Bulge:** any void that is not a chamber.
- **Branch point:** an air voxel with degree ≥ 3 in the 6-adjacency air graph.

Doorway threshold and the 2×2×2 block size are declared P-layer tunables with these defaults.
These are **descriptive** terms. The classifier also logs full distributions (void volumes,
doorway counts, depths, connectivity), so shapes the predicates don't name still appear in the
data instead of being eaten by the taxonomy.

> **Design Rule 18 (Shape predicates gate nothing; only ledgers gate).** Descriptive classifiers
> may measure; pass/fail authority belongs exclusively to function ledgers. No step may require
> that a specific **named shape** exist — a step may only require that the morphology the agents
> actually produced *earns* on a priced liability. "Chamber" is the name given to what won,
> never the spec for what must win. **Distinction, not exemption:** an *existence gate* — "any
> structure beyond the trivial baseline exists" (steps 4/9: ≥ 1 non-corridor voxel or branch
> point, i.e., *symmetry broke at all*) — is permitted, because it tests that a mechanism can
> produce structure, not which structure. A *shape gate* — "a chamber/vault/gallery exists" —
> is forbidden. Existence gates are scaffolding-phase instruments only (oracle and seed
> certification); no evolution-facing measure may gate on either kind. (Extends App. C
> doctrine: prescribing the geometry of the solution to an authored pressure is the
> actuator-side of the nest-compass error, one level up. Applies to every future emergence
> question — castes, trails, roles — not only nests.)

| # | Step | Gates (Δ from PHASE2) | Deliverable | Pass condition |
|---|---|---|---|---|
| 1 | **Fix the shaft** | + `spoilHauling` | Assertion suite on the existing oracle run | Dug voxels == intended column, exactly; spoil dumped == voxels dug (mass conservation, spec §5.4 — only assertable with hauling on; the `PHASE2` vanishing-spoil default is for navigation debugging only); materials dug ∈ {TOPSOIL, CLAY}, ROCK untouched. Any raggedness resolved and *locked by test*, not by eyeball. The known haul-choreography time cost is measured here as ticks-per-voxel-dug — the baseline number every later step is compared against |
| 2 | **Energy on (oracle)** | + `mortality` | Same scenario, mortal ant, dig costs + metabolism live | Shaft completes with energy to spare. If it starves, tune dig cost / tank via harness (P-layer, never flags) until it doesn't — R6: constants must *permit* digging before behavior can *choose* it. Spoil-haul round trips (dig×capacity → climb → dump → descend) are where dig cost compounds; `spoilCapacity` stays `null` (genome-derived) unless an experiment says otherwise, and any override is logged as an experiment, not committed as a constant |
| 3 | **Amplify rule (oracle)** | — | Rule 1 added: mark channel A while digging; prefer the highest-A face | One ant still completes the shaft (the rule must not break solo digging) |
| 4 | **Overflow rule + existence test (oracle)** | — | Rule 2 added: crowding > threshold → lateral preference. Run 5–10 ants, one config | **The existence gate: symmetry is broken — the air network contains at least one non-corridor voxel or branch point (§D.2.1 classifier).** This gate tests that the rules produce *any* structure beyond a line; it does **not** require a chamber or any named shape (Rule 18). Fail → tune the two rule constants within budget (Rule 12: 3 configs / 10×) → still a line ⇒ structural finding report, stop |
| 5 | **Name the seed spec** | — | The passing oracle reduced to its reflex list | Exactly **five** reflexes: dig-down bias, spoil haul/deposit, amplify, overflow, **reacquisition-by-casting**. *(Second amendment, from the step-8 finding: the prior claim that "amplify doubles as return-to-shaft" was falsified by measurement — stereo differential steering reads only the cross-axis gradient component, so a source directly behind the ant yields equal forward samples and zero turn. Pure stereo taxis is structurally blind to "behind"; return requires its own reflex.)* The set carries three gating terms, all linear-threshold: **casting** = total-signal-low → constant turn (the lost ant orbits until its nose crosses the gradient; klinokinesis needs memory and is not seed-legal — if casting fails, escalation is CMA-ES per step 9, never a hand-written workaround); **dig gated by local A** (amplify's dig-face half made load-bearing — kills surface divot spam by an emptied ant); **deposit anti-gated by A** (loaded ∧ low-A → deposit: "dump where the trail isn't," the linear form of the oracle's dump-clear — kills shaft refilling). Bootstrap: A-gated digging requires the step-8 fixture to **pre-mark the intended column mouth with channel A** (O-layer scenario setup); at colony scale this becomes "founding marks the dig site," legal by the same fiat that scripts the founding chamber |
| 6 | **Write the seed weights** | — | Hand-written weights per reflex against existing sensors; **zero hidden state, linear-threshold, hand-verifiable locus by locus** — the budget is readability, stated as 2–4 loci per relay and ~20 total, not a per-reflex cap | Weights exist and are readable: vertical bias + A-gated dig; load fraction → vertical-bias flip and loaded × low-A → deposit; channel-A stereo → turn (taxis); crowding → vertical-bias shift; low total-A → turn (casting) |
| 7 | **Assay each reflex (rung 3)** | assay arena (config-independent) | Isolated synthetic-stimulus tests for **all five reflexes**, plus the **loopback assertion**: raw input vector in a known world configuration == hand-computed expected values, every index, every normalization | A-gradient → correct face preference (taxis); crowding → lateral bias (overflow); uniform-low A → turning (casting) and strong ahead-A → taxis overrides casting; load high → vertical flip; loaded × low-A → deposit fires, loaded × high-A → deposit held (anti-gate). Marshalling proven independent of behavior |
| 8 | **One seeded ant, real pipeline** | same as step 2 | Single RNN ant, real controller + sensors, step-2 config | Digs **and hauls** a shaft comparable to the step-2 oracle *under the identical config* (per-world clone guarantees this is checkable) — the pass condition includes completed spoil round trips, since starving-at-two-voxels is the certified failure mode of a haul-less seed. Oracle could + seed can't ⇒ fault is provably in the sensor→network→output pipeline (everything else is shared and proven); steps 6–7 localize it |
| 9 | **Seeded colony, existence test** | same as step 4 | 5–10 seeded RNN ants, step-4 map and config | Same existence gate, now on the RNN: **symmetry-broken structure dug by the actual controller.** Morphology described, not prescribed (§D.2.1, Rule 18). Gap vs. the step-4 oracle distributions = measured shortfall; if hand-written reflexes cannot close it, then and only then CMA-ES on those same reflexes (App. B §B.9.3) — no new competences |
| 10a | **A queen exists** | — (step-9 gates) | Queen entity placed in the dug nest; nothing else | She persists; the sim is indifferent. Not trivial: queen-in-nest is exactly where the `nestDecay` misattribution lived |
| 10b | **Reproduction mechanics** | + `reproduction` | Queen lays, eggs hatch, wherever they land by default. No transport, no exposure, no ledger | Egg-count and hatch-count assertions. Isolates the reproduction machinery itself — gated off since `SimConfig` landed, therefore unproven under the current world |
| 10c | **Egg transport as oracle behavior** | + `broodTransport` | Builder gains the transport competence: pick up an egg, carry it, put it down. The oracle's *destination policy* is scripted (O-layer, legal) but the pass condition asserts **transport mechanics only** — pickup, carriage through a 1-wide shaft (a locomotion case with a bug history), putdown, death-while-carrying handled. Egg positions are *logged, not asserted* (Rule 18: no target voxel class). `eggCapacity` is a tunable following the `spoilCapacity` pattern: genome-adjacent, destined for the genome, overrides are experiments | Eggs demonstrably relocated from the lay site; mechanics assertions green; position distributions recorded. Exposure still off — transport is being *tested*, not rewarded |
| 10d′ | **Microclimate admitted alone** | + `microclimate` | The recorded dependency finding made structural: `eggExposure` consumes microclimate calculations even when adult effects are off, so the field is admitted **first, by itself**, and its adult-side cost is measured under the current scenario | Colony completes the 10c scenario under live microclimate; energy deltas measured and sane. Per Rule 17 this is its own step, not a rider on 10d |
| 10d | **Exposure live** | + `eggExposure` | Same scenario, exposure on, single config, inheriting 10d′ | Egg survival rate measured and sane |
| 10e | **First comparison: brood ledger** | same as 10d | **Dug-nest colony vs. founding-chamber-only colony**, identical config (inheriting 10d′ + 10d). Brood distributed by the transporting colony's own behavior — wherever it puts them (Rule 18). **Ledger defined:** a fixed, equal-sized egg cohort per arm, followed for a fixed window $T$ (with $T$ ≥ one incubation period); metric = fraction of the cohort alive at $T$, where hatching counts as survival. No open-ended laying — a queen-fecundity difference must not masquerade as an exposure difference | Dug nest > founding-chamber-only on cohort survival at $T$. The question as measured: *did the ants' digging create brood-viable space beyond what scripted founding gave them for free?* **First comparative step** — minimal App. B §B.8 instance, two configs + one ledger. The §D.2.1 classifier then *describes* the winning morphology as a result, not a requirement. If the dug nest loses: a structural finding on the exposure liability's magnitude or geometry, decided by human, never patched by prescribing shapes. (`larvalRearing` stays **off**) |
| 11a | **Hoard-down as oracle behavior** | — | Food carried into the dug nest; no weather. Positions logged, not asserted to a shape (Rule 18) | Food demonstrably relocated underground; mechanics assertions green |
| 11b | **Weather live** | + `weather` | One storm over a nest-storing colony, single config | Retained fraction measured; sanity assertion: underground food did not wash |
| 11c | **Second comparison: storage ledger** | same as 11b | Nest storage vs. surface storage across one storm, retention ledger | Nest > surface. Same comparative shape and same licensing as 10e |
| 12 | **Seeded RNN summit** | same as 10e + 11c | The step-9 colony extended with the transport competences (egg-carry, food-carry-down) and scored on both ledgers | RNN colony's egg-survival and store-retention within tolerance of the oracle's, identical config. Transport enters the seed as a **sixth-reflex decision at step 5** (explicit amendment per the haul/casting template). Pickup has a defined cue (`CONTACT_EGG`); **putdown does not, and that gap is declared here as the step's sufficiency experiment**: candidate cues from existing inputs only (e.g., putdown anti-gated by A like spoil-deposit, or gated by depth/darkness), tried within the Rule-12 budget, judged by the ledger. The legality line: destination *tendencies written into seed weights are legal S-layer authoring* (erasable ink — evolution owns them from tick one); what Rule 18 forbids is a world-side carry-to-target mechanism or a shape-class pass assertion. If no existing-input cue suffices, that is a finding (likely naming a missing carrier), not a license to build one. **This is the ladder's summit: a functional nest — structure that earns ledgers — produced by the real controller.** Everything beyond (evolution on, `nestDecay`, `seasons`, `larvalRearing`, `autoContinue`, templates, new carriers) is a separate authorization |

Gates deliberately **never admitted by the ladder**: `nestDecay` and `seasons` (Phase-4 regime
machinery — they answer questions the ladder doesn't ask, and `nestDecay` has already
demonstrated its power to corrupt Phase-2 conclusions), `larvalRearing` (owned by the
brood-capital recalibration), `autoContinue` (masks the data). Their re-admission is the *next*
ladder, written when this one's summit passes. One preview, because it answers "maintained to
some degree," which this ladder deliberately cannot prove: decay is traffic-keyed, so
maintenance is first *use* — the successor ladder admits `nestDecay` alone and its comparison is
persistence (an occupied nest retains its structure over N cycles while an abandoned control
collapses, with colony ledgers surviving the admission). Maintenance-as-behavior (re-digging
collapsed sections) comes after maintenance-as-traffic is measured, and only if the ledgers say
it is needed.

Standing instruction to the agent, verbatim: *No new fields, sensors, materials, or mechanisms
for these tasks. The deliverable at each step is the listed artifact and a report. If you believe
something is missing from the world, the output is a finding report naming it — not the thing
itself.*

---

## D.3 The Actuation Contract

### D.3.1 Oracle parity — the headline requirement

> **Design Rule 15 (Oracle parity).** Oracles and RNN ants emit the **identical output tuple**
> — (turn, thrust, vertical bias, dig, deposit A, deposit B, eat, lay) — and the world resolves
> it through the **identical resolution function**. No oracle may call privileged,
> coordinate-addressed mutations (`digVoxel(x,y,z)` and kin). An oracle's state machine decides
> *what to intend*; the shared resolution decides *what happens*.

Consequences, in order of importance: (i) every oracle-hour becomes a test of the exact actuation
path the RNN inherits — the substrate bug class that produced the historical dig-function
failures gets burned down by the agent whose intentions are readable; (ii) step 8's oracle-vs-seed
comparison isolates faults *only if* both agents exercise the same pipeline — without parity the
comparison proves nothing; (iii) any existing oracle code that bypasses the contract is
re-expressed through it **before** ladder step 2 — i.e., before `mortality` is admitted — so the
first economically real run already exercises the shared pipeline (the oracle's private movement
logic is a prime suspect for several historical bugs, including the original ragged shaft).

The RNN side has no procedural dig code to get wrong — the controller is a fixed forty lines of
arithmetic regardless of behavior — so the residual RNN risk class is **marshalling** (input
ordering, normalization, sign conventions, output thresholds), owned by the step-7 assays and the
loopback assertion.

### D.3.2 Body model: yaw only

An ant is a voxel occupant with a continuous heading θ (yaw). **There is no pitch axis.**
"Vertical bias" is not a rotation; it is a target-band selector. Digging down is excavating the
floor voxel while standing over it — no posture change (mandibles work the ground at the dig
face, as in the animal). The lattice-clinging model deleted orientation kinematics as a class;
adding pitch would purchase no expressible behavior at real cost (sensor-plane semantics, rate
composition, orientation state). *Body orientation is yaw-only; vertical selection is attention,
not posture.*

### D.3.3 The resolution function

**Contract status — v1 (implemented) vs. v2 (specified).** Implementation review found this
section partly aspirational: the build resolves movement/digging through **threshold bands**
rather than the continuous preference function, sensing is **not** coupled to the acting band,
and failed digs were free. Per the drift rule (a spec the code doesn't obey is worse than either
alone), the contract is split:

- **Contract v1 — governs the ladder.** Threshold-band resolution, uncoupled sensing. Legal
  *provided oracle parity holds under v1*: both agents resolve through the same implemented
  bands, so Rule 15 is satisfied by the implementation as built. Two items are **not**
  deferrable and are promoted to immediate requirements: (i) **failed digs cost a token amount**
  — a seed pins dig high, so every non-dig tick emits a dig intent, and free no-ops silently
  distort the step-2/step-8 energy calibration; (ii) the **load-bearing clause is hereby
  decided**: *the occupant drops one voxel on excavation* (falling exists; the undiggable
  alternative can deadlock overflow widening in crowded shafts). Both land before step 8 is
  certified.
- **Contract v2 — the target below.** The continuous preference function, sensing coupled to
  the acting band, and the ramp property. Migration is authorized either at the ladder's summit
  or earlier if the shape gate (step 4/9) stalls in a way the morphogenesis analysis attributes
  to band quantization — a finding, not a preference, triggers it. Seed weights are written
  against the contract *as implemented*; a v1→v2 migration re-runs steps 7–9's assays and
  comparisons, since weight semantics change with the resolution.

**One output the tuple was missing: spoil deposit — and the same convention extends to brood.**
The Rule 15 tuple has no drop action, yet the haul reflex requires one. Contract clause: **the
dig trigger, when the ant is loaded and the targeted voxel is air, deposits the carried load
there** — mandibles work both ways, one output, resolved by world preconditions exactly like the
dig/descend alternation. The **same mandible convention governs brood** (carried-material-type
distinguishes spoil/food/egg): dig trigger targeting an egg while unladen = pickup; dig trigger
targeting air while carrying = putdown. If the implemented `broodTransport` mechanism differs,
reconcile it to this clause or file a finding; what is not acceptable is a ninth output or an
oracle-only carry path (parity).

From two scalars — yaw θ and vertical bias $v \in [-1, 1]$ — the v2 preference score over the six
adjacent voxels:

$$\text{score}(\text{down}) = \max(0, -v), \qquad \text{score}(\text{up}) = \max(0, +v),$$
$$\text{score}(\text{horizontal dir}) = \text{align}(\theta, \text{dir}) \cdot \big(1 - |v|\big).$$

One function resolves all three couplings:

- **Move:** thrust steps to the highest-scoring **air** neighbor (subject to lattice clinging).
- **Dig:** the dig trigger excavates the highest-scoring **solid, diggable** neighbor, at
  material cost; targeting air or ROCK is a **no-op at token cost** (dig-spamming is not free).
- **Sense:** directional sampling (stereo pheromone/food antennae) follows the same preference —
  the sensing band coheres with the acting band. One attention system; an ant never aims by
  smells from a band it is not acting on.

**Properties the contract buys:**

- **Straight-down digging is a two-weight behavior.** Pin $v = -1$ (horizontal term multiplies
  to zero — the answer to "does horizontal have to be zero" is yes, *structurally, at
  saturation*), pin dig high, thrust on. The dig→descend alternation is sequenced by the world's
  own no-op semantics: dig no-ops the tick after the floor is air; movement no-ops while the
  floor is solid. **No modes, no state, no controller sequencing** — constant outputs produce
  the loop. Spoil capacity is what breaks it, correctly: the observed behavior of a mortal
  digger is dig → climb → dump → descend, the same machinery in reverse.
- **Intermediate $v$ is a ramp.** At $v \approx -0.5$, down and best-horizontal score
  comparably and the trace is a diagonal tunnel; sweeping $v \in [-1, 0]$ yields shaft → steep
  ramp → shallow incline → horizontal gallery from **one output scalar**. The overflow rule is
  therefore not a discrete switch: crowding pushing $v$ toward zero bends the tunnel
  progressively. Sloped galleries — the signature nest feature after chambers — are inside the
  contract as a side effect of vertical and horizontal competing rather than composing.
- **Yaw is free during descent** (it moves nothing at $|v| = 1$), so an ant re-aims mid-shaft
  when it acquires reasons to.

**Two clauses that prevent known bug classes:**

1. **Load-bearing voxel — decided above:** the occupant drops one voxel on excavation. (The
   undecided case debugs as "ants teleporting"; the undiggable alternative deadlocks crowded
   overflow.)
2. **Tiebreak.** At $v \approx 0$ with uniform horizontal scores: inherit last tick's choice;
   random only on true ties. Deterministic, one line; prevents band-boundary dithering from
   reading as a movement bug.

**The illegal third design, named so it is never built:** "dig fires and the world picks the
best face" (e.g., auto-targeting the highest-channel-A voxel) smuggles the *choice* out of the
controller — the actuator-side mirror of the nest-compass sensor, failing the
question-not-answer test (App. C §C.3.4 applied to outputs): **actuators apply local intents;
they never make the ant's decisions.** It would hollow out precisely the behavior (amplification)
the ladder exists to prove the controller can express.

---

## D.4 Staged Morphogenesis: The Deferred Program

Everything in this section is **back-pocket material**: recorded so it is not re-derived, staged
strictly behind the ladder, and gated. §D.4.1 is a desk task permitted now; §§D.4.2–D.4.4 are
authorized only by the conditions stated on them. Nothing here overrides Rule 14 — new carriers
enter one at a time, by finding report and human decision, never as a batch.

### D.4.1 Carrier audit (desk task; permitted now)

The known morphogenesis ingredients from the biology, against implementation status:

| Ingredient (biology) | Sim carrier | Status |
|---|---|---|
| Recruitment marking at dig sites | unlabeled pheromone channels A/B | **present** — the ladder uses it (amplify) |
| Crowding-dependent digging | crowding sensor | **present** — the ladder uses it (overflow) |
| Spoil deposition dynamics | conserved spoil / loose fill | **present** |
| Brood transport | `broodTransport` gate: pickup, carriage, putdown, death handling | **present** — ladder steps 10c–12 |
| Stop-condition templates (dig until local condition) | thermal field | present (climate-keyed exposure); *use as dig template deferred* |
| Humidity / CO₂ gradients | none | **absent** — candidate W-additions; each passes carrier/locality/cost/question tests in principle; **not authorized**; enter only via finding report if the shape gate fails structurally |

### D.4.2 Rule-set tournament (authorized only if the ladder's shape gate fails at finding level, or after step 12 to extend morphology)

The morphogenesis analog of App. B §B.8: candidate local rule sets as parameterized,
sensor-limited oracles — R-recruit (amplify), R-crowd (overflow), R-template (dig until local
temperature enters the brood band, then stop), and compositions — run as colonies and scored on
morphometrics (§D.4.3). Output: the **minimal rule set over the shipped interface** scoring
nonzero chambers and branches; if none does, the tournament names the missing carrier — fault
isolation for interface sufficiency at the morphogenesis level (rung 2, generalized).

### D.4.3 Morphometrics ("looks like a colony" as description)

Computed by the **§D.2.1 shared classifier** — no parallel vocabulary: chamber count, bulge and
void-volume distributions, branch points, chamber depth distribution, and **network efficiency**
(entrance→chamber/stockpile path lengths). Qualitative reference: the
shaft-with-lateral-chambers, branching-with-size shape of real nest casts [[3]](#references),
[[4]](#references) — a reference for *describing* results, never a target (Rule 18: these
metrics gate nothing; any tournament or comparison gates on function ledgers, with morphometrics
attached as the description of what won).

### D.4.4 Function coupling (the gate against decorative complexity)

> **Design Rule 16 (Morphology must earn ledger).** Across any tournament or ladder extension,
> morphometric scores must **correlate with colony ledgers** through existing liabilities —
> chambers as brood vaults (egg survival), chambers as larders (store retention), branches as
> congestion relief. Uncorrelated complexity is free-floating, will be stripped by selection
> regardless of seeding, and is not pursued. (Steps 10a–12 are this rule's minimal instance;
> 10e and 11c are its measurements.)

---

## D.5 Constraint Summary

| Quantity | Constraint | Source |
|---|---|---|
| Ladder discipline | one deliverable, one pass condition, one config state per step; failures point at the owning step; **grain-size test**: a step whose failure could name two culprits is two steps | §D.2 |
| Comparative steps | 10e and 11c are the ladder's only comparisons; each licenses exactly two configs + one ledger (minimal App. B §B.8 instances), never the full tournament | §D.2 |
| Seed spec | five reflexes (dig-down, haul/deposit, amplify, overflow, casting); stereo taxis is blind to "behind" — return is casting's job, never assumed; amendments are explicit step-5 decisions | §D.2 step 5 |
| Seed gating | dig gated by local A; deposit anti-gated by A; fixture pre-marks the column mouth (founding marks the dig site at colony scale) | §D.2 step 5 |
| Seed budget | readability is the constraint: zero hidden state, linear-threshold, locus-by-locus verifiable, 2–4 loci per relay, ~20 total | §D.2 step 6 |
| Seed-spec amendments | new oracle competences (egg placement, hoard-down) may force a sixth reflex — an explicit step-5 amendment decision at step 12, never absorbed silently | §D.2 |
| Contract versioning | v1 (bands, uncoupled sensing) governs the ladder under parity; v2 migration by finding or at summit, re-running steps 7–9 | §D.3.3 |
| Dig no-op | token cost, required before step-8 certification (spam not free; free no-ops distort energy calibration); ROCK undiggable | §D.3.3 |
| Load-bearing clause | **decided**: occupant drops one voxel on excavation | §D.3.3 |
| Spoil deposit | dig trigger + loaded + air target = deposit; no ninth output, no oracle-only drop path | §D.3.3 |
| Gate discipline | start at `PHASE2`; one gate re-admitted per step, cost measured; `autoContinue` off and `wideEntranceShaft` off throughout; `nestDecay`/`seasons`/`larvalRearing` never admitted by this ladder | Rule 17 |
| Flags vs. magnitudes | a flag is never a magnitude; constants tuned in the tunables layer via harness | §D.1.1 |
| Gene-adjacent overrides | `spoilCapacity: null` pattern: genome-derived by default; overrides are logged experiments, never committed constants | §D.1.1, Rule 9 |
| Config provenance | per-world config clone; checkpoints serialize config; cross-run ledger comparisons valid only under identical config | §D.1.1 |
| The fence | no new fields/sensors/materials/mechanisms during the ladder; findings instead of features | Rule 14 |
| Shape vocabulary | corridor/bulge/chamber/branch mechanically defined (§D.2.1 partition procedure); constants are P-layer tunables; full distributions logged | §D.2.1 |
| Shape predicates | shape gates forbidden; existence gates (symmetry-broke-at-all) permitted in scaffolding phases only; no evolution-facing gate on either; ledgers alone gate | Rule 18 |
| Existence gate | ≥ 1 non-corridor voxel or branch point (step 4 oracle; step 9 RNN); no named shape required | §D.2 |
| Egg transport | behind `broodTransport` (admitted at 10c); pickup/carriage/putdown asserted; destination logged, never asserted; `eggCapacity` follows the `spoilCapacity` genome-adjacent pattern | §D.2 step 10c |
| Microclimate dependency | `eggExposure` consumes microclimate → `microclimate` admitted alone at 10d′, measured, before 10d; 10e inherits both | §D.2 step 10d′ |
| Brood ledger | fixed equal cohorts, fixed window $T$ ≥ incubation, fraction alive at $T$ (hatching = survival); fecundity differences excluded by construction | §D.2 step 10e |
| Putdown cue | step-12 sufficiency experiment from existing inputs within Rule-12 budget; seed destination tendencies are legal S-layer ink; world-side carry-to-target and shape assertions are not; no cue sufficing ⇒ finding | §D.2 step 12 |
| Mandible convention | dig trigger overloaded by preconditions: excavate solid / deposit load into air / pick up contacted egg — spoil, food, and brood alike; no ninth output | §D.3.3 |
| Spec/status separation | certification status lives in `docs/certifications.md`, never in this document | §D.1 |
| Maintenance | out of this ladder's scope by design; successor ladder admits `nestDecay` alone and gates on persistence (occupied vs. abandoned) | §D.2 |
| Tuning inside the ladder | Rule 12 budget applies (3 configs / 10×) | App. C |
| Oracle parity | identical output tuple, identical resolution; no privileged mutations; refactor before step 2 | Rule 15 |
| Body model | yaw-only; vertical bias is attention, not posture; no pitch, ever | §D.3.2 |
| Resolution | one preference function couples move/dig/sense; no-op semantics sequence the dig loop | §D.3.3 |
| Dig no-op | token cost (spam not free); ROCK undiggable | §D.3.3 |
| Actuator legality | actuators apply local intents, never decisions; no world-side target selection | §D.3.3 |
| Marshalling | step-7 assays + loopback assertion mandatory before step 8 | §D.2 |
| Escalation to CMA-ES | only after hand-written reflexes fail step 9, on the same three reflexes | §D.2 |
| Morphogenesis staging | §D.4.2–D.4.4 gated as stated; carriers enter one at a time by finding + decision | §D.4 |
| Function coupling | morphometrics must correlate with ledgers; decorative complexity not pursued | Rule 16 |

---

## References

1. P.-P. Grassé, "La reconstruction du nid… La théorie de la stigmergie," *Insectes Sociaux* 6,
   41–80, 1959.
2. A. Khuong, J. Gautrais, A. Perna, C. Sbaï, M. Combe, P. Kuntz, C. Jost, and G. Theraulaz,
   "Stigmergic construction and topochemical information shape ant nest architecture," *PNAS*
   113(5), 1303–1308, 2016.
3. W. R. Tschinkel, "The nest architecture of the Florida harvester ant, *Pogonomyrmex badius*,"
   *J. Insect Science* 4:21, 2004. (Nest casts: shafts with lateral chambers; architecture
   scaling with colony size.)
4. A. Perna and G. Theraulaz, "When social behaviour is moulded in clay: on growth and form of
   social insect nests," *J. Experimental Biology* 220, 83–91, 2017. (Nest networks as graphs;
   morphology from local rules.)
