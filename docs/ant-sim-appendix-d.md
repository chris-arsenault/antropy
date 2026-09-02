# Appendix D: From Shaft to Nest — The Micro-Step Ladder, the Actuation Contract, and Staged Morphogenesis

*Supplement to the Ant Evolution Simulation Design Specification — September 2026, Rev. A.
Appendices A–C are frozen; this appendix does not amend them. Design Rules continue their
numbering.*

> **Abstract.** This appendix converts the open question — *"how do we get from a scripted oracle
> digging a shaft to an RNN ant digging a colony?"* — into an ordered ladder of micro-steps, each
> with one deliverable and one pass condition, using **only mechanisms that already exist**. It
> then freezes the actuation contract the ladder depends on, headlined by the oracle-parity
> requirement: oracles and RNN ants must drive the identical world resolution through the
> identical output tuple, so that every oracle-hour hardens the exact pipeline the RNN inherits.
> The full morphogenesis program (carrier audit, rule tournaments, morphometrics, function
> coupling) is recorded last, explicitly staged **behind** the ladder: none of it is authorized
> until the ladder's shape gate passes, and none of it authorizes new world features by default.

---

## D.1 Scope, Fence, and Current State

**Current state:** a scripted builder oracle digs a ragged straight shaft; immortal; economy off.
**Ladder target:** an RNN ant, through the real controller and shipped sensors, digging a
branched nest with widened spots, on a live energy economy.

> **Design Rule 14 (The fence).** For the duration of the ladder (§D.2): **no new fields,
> sensors, materials, or mechanisms.** The deliverables are rules on existing machinery, shape
> comparisons, and reports. An agent that believes something is missing from the world files a
> finding report naming it (App. C §C.5) — it does not build the thing. Chambers and branches
> are pursued with exactly two ingredients, both already shipped: the unlabeled pheromone
> channels and the crowding sensor.

Rationale (one paragraph, so the fence reads as reasoned rather than arbitrary): real nest
morphogenesis is behavior × world feedback — no architect, no blueprint; local rules coupled to
fields produce chambers and galleries [[1]](#references), [[2]](#references). The full ingredient
list of the biology (humidity, CO₂, temperature templates) is *not yet warranted*: the carrier
audit of §D.4.1 shows the two cheapest known symmetry-breaking mechanisms — digging-site
recruitment marking and crowding-dependent lateral digging — are already implemented. The ladder
tests whether those two suffice **before** any richer world is contemplated.

---

## D.2 The Micro-Step Ladder

Each step: one deliverable, one pass condition, existing mechanisms only. A failure points at the
step that owns it. Steps 1–9 reach the first RNN nest; steps 10–12 extend to the next reasonable
goal — a nest that *earns* something — still inside the fence.

| # | Step | Deliverable | Pass condition |
|---|---|---|---|
| 1 | **Fix the shaft** | Assertion suite on the existing oracle run | Dug voxels == intended column, exactly; spoil dumped == voxels dug (mass conservation, spec §5.4); materials dug ∈ {TOPSOIL, CLAY}, ROCK untouched. The 1-and-2-wide raggedness resolved and *locked by test*, not by eyeball |
| 2 | **Energy on (oracle)** | Same scenario, mortal ant, dig costs + metabolism live | Shaft completes with energy to spare. If it starves, tune dig cost / tank via harness until it doesn't (this is R6: constants must *permit* digging before behavior can *choose* it). Note: spoil-haul round trips are where dig cost compounds — the loop is dig×capacity → climb → dump → descend |
| 3 | **Amplify rule (oracle)** | Rule 1 added: mark channel A while digging; prefer the highest-A face | One ant still completes the shaft (the rule must not break solo digging) |
| 4 | **Overflow rule + shape test (oracle)** | Rule 2 added: crowding > threshold → lateral preference. Run 5–10 ants, one config | **The shape gate: the air network is no longer a line.** Any branch or widening passes. Fail → tune the two rule constants within budget (Rule 12: 3 configs / 10×) → still a line ⇒ structural finding report, stop |
| 5 | **Name the seed spec** | The passing oracle reduced to its reflex list | Exactly three reflexes: dig-down bias, amplify, overflow. No additions |
| 6 | **Write the seed weights** | Hand-written weights per reflex (2–4 weights each) against existing sensors; hidden layer zero | Weights exist and are readable: vertical bias + dig as pinned constants; channel-A stereo → turn (chemotaxis pattern reused on a different input pair); crowding → vertical-bias shift |
| 7 | **Assay each reflex (rung 3)** | Isolated synthetic-stimulus tests in the assay arena, plus the **loopback assertion**: raw input vector in a known world configuration == hand-computed expected values, every index, every normalization | Given an A-gradient, the seeded network prefers the correct face; given crowding, lateral bias fires; marshalling proven independent of behavior |
| 8 | **One seeded ant, real pipeline** | Single RNN ant, real controller + sensors, energy on, step-2 scenario | Digs a shaft comparable to the step-2 oracle. Oracle could + seed can't ⇒ fault is provably in the sensor→network→output pipeline (everything else is shared and proven); steps 6–7 localize it |
| 9 | **Seeded colony, shape test** | 5–10 seeded RNN ants, step-4 map | Same shape gate, now on the RNN: **a branched/widened nest dug by the actual controller.** Gap vs. the step-4 oracle shape = measured shortfall; if hand-written reflexes cannot close it, then and only then CMA-ES on those same three reflexes (App. B §B.9.3) — no new competences |
| 10 | **Brood in the wide spots (oracle)** | Queen/egg placement uses widened voxels (existing egg mechanics; existing climate-keyed exposure); no new fields | Egg-survival ledger of the widened nest > the straight-shaft baseline, same config. This is Rule 7's increment logic applied to morphology: the widening must *earn* something already priced |
| 11 | **Storage in the nest (oracle)** | Food stored in dug voids (existing hoarding/rain mechanics) | Store-retention ledger across one weather event > surface baseline |
| 12 | **Seeded RNN vs. steps 10–11** | The step-9 colony re-run with brood + storage scoring | RNN nest's egg-survival and store-retention within tolerance of the oracle's. **This is the ladder's summit: a functional nest — shape that earns ledger — produced by the real controller.** Everything beyond (evolution on, templates, new carriers) is a separate authorization |

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
re-expressed through it **before** ladder step 2 (its private movement logic is a prime suspect
for several historical bugs, including the ragged shaft).

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

From two scalars — yaw θ and vertical bias $v \in [-1, 1]$ — a preference score over the six
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

1. **Load-bearing voxel.** A voxel currently load-bearing for an occupant either cannot be dug,
   or its occupant drops one voxel on excavation (falling already exists). **Pick one, write it
   in this contract, before ladder step 4** — the multi-ant overflow run is where lateral digs
   first remove another ant's floor, and the undecided case debugs as "ants teleporting."
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
| Stop-condition templates (dig until local condition) | thermal field | present (climate-keyed exposure); *use as dig template deferred* |
| Humidity / CO₂ gradients | none | **absent** — candidate W-additions; each passes carrier/locality/cost/question tests in principle; **not authorized**; enter only via finding report if the shape gate fails structurally |

### D.4.2 Rule-set tournament (authorized only if the ladder's shape gate fails at finding level, or after step 12 to extend morphology)

The morphogenesis analog of App. B §B.8: candidate local rule sets as parameterized,
sensor-limited oracles — R-recruit (amplify), R-crowd (overflow), R-template (dig until local
temperature enters the brood band, then stop), and compositions — run as colonies and scored on
morphometrics (§D.4.3). Output: the **minimal rule set over the shipped interface** scoring
nonzero chambers and branches; if none does, the tournament names the missing carrier — fault
isolation for interface sufficiency at the morphogenesis level (rung 2, generalized).

### D.4.3 Morphometrics ("looks like a colony" as a ledger)

From voxel data: skeletonize the air network into a graph; count **chambers** (connected air
components wider than the 1-voxel bore), **branch points** (degree ≥ 3 nodes), chamber depth
distribution, and **network efficiency** (entrance→chamber/stockpile path lengths). Qualitative
target: the shaft-with-lateral-chambers, branching-with-size shape of real nest casts
[[3]](#references), [[4]](#references). These metrics gate nothing until a shape exists worth
measuring (post-step-4); thereafter they are the shape gate's quantitative form.

### D.4.4 Function coupling (the gate against decorative complexity)

> **Design Rule 16 (Morphology must earn ledger).** Across any tournament or ladder extension,
> morphometric scores must **correlate with colony ledgers** through existing liabilities —
> chambers as brood vaults (egg survival), chambers as larders (store retention), branches as
> congestion relief. Uncorrelated complexity is free-floating, will be stripped by selection
> regardless of seeding, and is not pursued. (Steps 10–12 are this rule's minimal instance.)

---

## D.5 Constraint Summary

| Quantity | Constraint | Source |
|---|---|---|
| Ladder discipline | one deliverable, one pass condition per step; failures point at the owning step | §D.2 |
| The fence | no new fields/sensors/materials/mechanisms during the ladder; findings instead of features | Rule 14 |
| Shape gate | air network no longer a line (step 4 oracle; step 9 RNN) | §D.2 |
| Tuning inside the ladder | Rule 12 budget applies (3 configs / 10×) | App. C |
| Oracle parity | identical output tuple, identical resolution; no privileged mutations; refactor before step 2 | Rule 15 |
| Body model | yaw-only; vertical bias is attention, not posture; no pitch, ever | §D.3.2 |
| Resolution | one preference function couples move/dig/sense; no-op semantics sequence the dig loop | §D.3.3 |
| Dig no-op | token cost (spam not free); ROCK undiggable | §D.3.3 |
| Load-bearing clause | decided and written before step 4 | §D.3.3 |
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
