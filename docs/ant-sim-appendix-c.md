# Appendix C: The Layer Model — Classifying Changes, Detecting Untunability, and the Agent Work Loop

*Supplement to the Ant Evolution Simulation Design Specification — September 2026, Rev. A.
Appendices A (evolutionary dynamics) and B (bootstrap viability) are frozen; this appendix does
not amend them. Design Rules continue their numbering.*

> **Abstract.** Implementation experience has produced two recurring failure modes: (i)
> hard-coding of behavioral answers into the simulation's sensory interface (e.g., a "nest
> compass direction sense"), and (ii) extended tuning effort against parameters that are
> structurally incapable of producing the target outcome (e.g., liability knobs against an
> r-selected economy). Both are symptoms of a missing classification system: without a layer
> model, an implementing agent cannot distinguish *adding a fact to the world* from *adding an
> answer to the ant*, and cannot distinguish *a knob that hasn't been turned far enough* from *a
> knob that isn't in the governing equation*. This appendix supplies that system: a five-layer
> taxonomy of changes with per-layer legality rules, five litmus tests for new capabilities, an
> operational definition of untunability with four stop signatures and a tuning budget, the
> structural-finding report as a first-class deliverable, and the classify–predict–measure work
> loop that binds them. It is written to be handed directly to the implementing agent as an
> operating doctrine.

---

## C.1 Diagnosis: One Disease, Two Symptoms

The observed behaviors — fixating on individually suggested mechanisms, and installing senses
that answer tasks — share a root cause: **every change looks the same to an agent without a layer
model.** Whatever most directly produces the behavior described in the last instruction gets
built, whether that means authoring world physics (legitimate), tuning a constant (legitimate),
or wiring the solution into a sensor (illegitimate, and invisible as such without this appendix).

The r-selection finding (Release 3 tournament report) demonstrates the same agent operating
correctly: bounded iteration, mechanism-level diagnosis, clean escalation with a decision
request. The capability for the right loop exists; what follows is the classification system
that tells the agent *which loop it is in*.

---

## C.2 The Five Layers

> **Design Rule 8 (Layer classification).** Every change belongs to exactly one layer, is
> declared as such before implementation, and obeys that layer's legality rule.

| Layer | Contains | Legality rule |
|---|---|---|
| **W — World** | Physics, materials, fields (thermal, scent), weather, liabilities, energy costs, lifecycle mechanics | **Unlimited authoring.** Design pressure legitimately lives here. |
| **I — Interface** | Sensors and actuators — the ant's entire perception/action contract | **Constrained authoring.** A sensor may expose a *world quantity*; an actuator may apply a *local world change*; both at an energy cost. All five litmus tests of §C.3 must pass. |
| **S — Seed / Init** | Founder weights, seed portfolios, probe-derived instincts | **The only layer where authored behavior is legal** — it is written in erasable ink, and evolution owns it from tick one. |
| **P — Parameters** | Constants inside existing mechanisms | **Tuning only, via the harness against the ratio gates. No new mechanisms.** Tuning that requires a new `if` statement is not tuning; it is W- or I-work misfiled. |
| **O — Oracles / Instrumentation** | Scripted agents, assays, ledgers, event triggers | **Unlimited hard-coding, because quarantined.** Nothing in O may ever execute inside the evolving population. |

### C.2.1 The observed failures, classified

- **"Nest compass direction sense"** — S-work smuggled into the I-layer: homing behavior was
  needed, so the *answer* was installed as a sensor. Fails the carrier test and the
  question-not-answer test (§C.3). The legal decomposition: strengthen the nest scent field
  (W), keep chemotaxis-to-nest-scent in the seed (S).
- **"Thermocoupling sensitivity" tuning** — P-work overwriting **genome territory**: sensor
  gain is a *gene* (spec §3.2). Hand-tuning a global sensitivity constant to produce pleasing
  behavior edits territory that belongs to evolution — and then requires perpetual re-tuning,
  because selection keeps moving underneath it.

> **Design Rule 9 (Genome-territory check).** Before tuning any constant, check whether the
> frozen spec assigns that quantity to the genome (sensor gain, body scale, σ, reward wiring
> $\mathbf{g}$, plasticity gains, reaction-norm coefficients…). Genomic quantities are tuned only
> at the **seed and prior** (S-layer: initial values, portfolio spread) — never as global
> constants.

### C.2.2 The world-side preference

> **Design Rule 10 (World-side resolution).** When a goal admits both an ant-side answer and a
> world-side mechanism, build the world-side version.

Homing weak? Not a bearing sense (I, illegal) — a stronger nest scent field (W) plus the existing
chemotaxis seed (S). Ants ignoring temperature? Not a sensitivity constant (P, genome territory)
— verify the thermal field has gradients worth sensing (W), verify the thermoreceptor reports
honestly (I), let gain evolve (genome). The world-side version is always legal, always
emergent-compatible, and usually what real biology did.

---

## C.3 The Five Litmus Tests (I-Layer Admission)

A proposed sensor or actuator must pass **all five**:

1. **Carrier test.** The percept has a physical carrier in the world obeying the world's own
   rules — diffusion, occlusion, decay, washout. Nest *scent* passes: a field, blocked by walls,
   washed by rain, losable. A nest *bearing* fails: no carrier, no mechanism, cannot be wrong.
   **A percept that cannot be fooled is an oracle, not a sense.** The sharp edge: a
   *sun-azimuth* sensor is legal (real quantity, real carrier, occluded underground — and real
   ants carry exactly this sense [[1]](#references)); a *home-direction* sensor is illegal even
   though an ant might use the former to compute the latter. **The computing is the ant's job.**
2. **Locality test.** Computable from the ant's voxel neighborhood plus its own internal state.
   Global-map knowledge is O-layer material leaking in.
3. **Cost test.** Every capability carries an energy price creating a tradeoff (spec principle 4:
   no free traits). A free sense is maxed by selection and distorts every downstream result.
4. **Question-not-answer test.** Sensors report *world quantities*, never *solutions to the
   ant's task*. "Local temperature" is a question about the world; "am I safe," "which way to
   food," "should I dig" are answers, and answers belong to the controller. Heuristic: **if the
   sensor's name contains the task, it is probably an answer.**
5. **Displacement test.** Would the capability delete a selection pressure the simulation exists
   to study? Where the capability *is* the interesting evolved behavior — navigation, trail use,
   task allocation — hard-coding it amputates the experiment rather than assisting it (the
   standard failure mode of over-assisted digital evolution [[2]](#references)). Ask: *after
   this is added, what remains for evolution to discover here?*

---

## C.4 Untunability: Operational Definition and Stop Signatures

**Definition.** A parameter $k$ is *tunable toward goal $G$* only if $k$ appears with material
weight in the inequality that governs $G$.

> **Design Rule 11 (Inequality first).** Write the governing inequality before touching the
> knob. Appendix B's ratios (R1–R7) and payback inequalities are the existing inventory; a goal
> with no written inequality gets one before its first tuning run.

The r-selection episode is the canonical absence of this discipline: liability knobs were moved
up to 15× across ~10 configurations while the governing inequality — replacement cost vs.
insurance cost — did not contain them on the binding side. The knobs were not in the equation.

### C.4.1 The four stop signatures

Any **one** of these means: stop tuning, file a finding (§C.5).

| # | Signature | What it means |
|---|---|---|
| 1 | **Order-of-magnitude insensitivity.** Knob moved 10× (or to the viability polytope wall) without flipping the target ordering | A binding parameter flips orderings well within one order of magnitude; insensitivity at this scale is structural |
| 2 | **Conserved seesaw.** Every setting improving metric A degrades metric B by a matching amount | Not a tuning surface — a conservation law. A and B are linked by an identity (usually an energy or time budget); no point on this axis satisfies both. Structural change or explicit tradeoff decision required |
| 3 | **Victory only outside the polytope.** $G$ is achieved only at values violating a viability gate | Goal and gate are in structural conflict; tuning relocates conflicts, it cannot resolve them |
| 4 | **Sub-ledger / master-ledger divergence.** Sub-metrics improve; the master ledger — the currency selection actually integrates (worker-days, lineage persistence) — does not move | Self-Goodharting (cf. App. B §B.7.2). The most dangerous signature because it *feels* like progress. A gate pinned on a metric selection cannot see is decorative compliance |

> **Design Rule 12 (Tuning budget).** Three configurations or one order of magnitude per knob
> per goal, whichever comes first. At budget exhaustion the mandatory next deliverable is a
> structural-finding report — not a fourth configuration.

---

## C.5 The Structural-Finding Report

Findings are **promotions, not failures.** The r-selection finding was worth more than any
tuning success in the project to date, and the agent is told so explicitly here: an agent that
believes findings are failures will grind knobs indefinitely to avoid filing one.

Template (canonized from the Release 3 report):

```text
FINDING: <one-line statement of the structural invariance>

1. INVARIANCE  — what stayed true, and the configurations that establish it
                 (knobs, ranges, orderings observed)
2. MECHANISM   — hypothesis for WHY the constraint is structural
                 (the governing inequality and the term the knobs cannot reach)
3. MINIMAL FIX — the smallest structural change that would make the goal tunable,
                 with its layer classification (W/I/S/P/O) and litmus/legality status
4. COST        — recalibration blast radius: which gates re-open, which ratios re-tune
5. DECISION    — the choice that belongs to the human, stated as options
```

---

## C.6 Instruction Ranking: Invariants ≻ Mechanisms ≻ Parameters

> **Design Rule 13 (Rank of instructions).** Everything received from the design conversation
> carries a rank. **Invariants** (no explicit fitness; the layer model; the litmus tests;
> master-ledger supremacy; genome territory) outrank **mechanisms** (any individually suggested
> device: hot eggs, nest scent, corpse-recovery fraction, claustral reserve) outrank
> **parameters** (any specific value or band). Design-conversation suggestions are *hypotheses
> at rank two*. When a suggestion conflicts with a rank-one invariant or with measured reality,
> **the suggestion loses** — and the correct response is a finding report, not compliance.

This rule is the direct fix for suggestion-fixation: the agent's obligation is to the
invariants and the measurements, never to the enumerated examples.

---

## C.7 The Work Loop

Every task runs the same cycle:

```text
CLASSIFY  — declare the layer (W/I/S/P/O) of the intended change
LEGALITY  — I-layer: run the five litmus tests (§C.3)
            P-layer: run the genome-territory check (Rule 9)
            any layer: prefer the world-side version (Rule 10)
PREDICT   — write the governing inequality (Rule 11); state the expected
            direction of the MASTER ledger, not only sub-metrics
MEASURE   — harness + oracle ladder + tournament as applicable (App. B)
COMPARE   — prediction wrong twice at material knob movement
            ⇒ check the four signatures (§C.4.1)
            ⇒ signature present or budget exhausted (Rule 12)
            ⇒ file the finding report (§C.5) and stop
```

---

## C.8 Adjudicated Edge Cases

The layer model has judgment calls at its edges. This table records rulings; the agent extends
by analogy instead of re-litigating.

| Case | Ruling | Rationale |
|---|---|---|
| Sun-azimuth sensor | **I, legal** | Real world quantity, physical carrier, occludable underground; biological precedent [[1]](#references). The *use* of it for navigation is the controller's problem |
| Nest-bearing / home-compass sensor | **I, illegal** | No carrier; cannot be fooled; answer-shaped (carries the task in its name); displaces navigation as an evolvable behavior |
| Path integration | **capacity is architecture (frozen spec), use is S** | The recurrent substrate can host integrators (App. B §B.2.2); whether a lineage uses them is seeded and/or evolved, never a sensor |
| Nest scent field | **W, legal and preferred** | World-side resolution of homing (Rule 10); losable, occludable, washable — a fact, not an answer |
| Thermoreceptor | **I, legal** | Reports local temperature (a question); gain is genome territory (Rule 9) |
| "Danger sense," "food direction," "should-dig" signals | **I, illegal** | Answer-shaped; fail carrier and question-not-answer tests |
| Claustral founding reserve | **W by fiat** | A scripted lifecycle bridge (like the founding chamber): world mechanics of colony founding, not ant behavior. Legal as W-authoring even though it touches an "ant" |
| Larval-hunger / stockpile / congestion scents | **W + I, legal** | Colony-state made perceptible through carriers (App. A §A.9.2); demand as a world quantity |
| Dig-site pheromone bias | **S, legal** | Stigmergic seeding on an unlabeled channel (App. B §B.9.2); erasable ink |
| Corpse-recovery fraction | **P (with W origin)** | A constant of an existing W mechanism; tune via harness against the capital ratio — but watch signature 2: it trades against famine ruinousness by construction |
| Merit-counter accounting | **O-adjacent W, constrained** | The one authored objective in the system (App. B §B.7.2); net-energy conservation accounting is mandatory, scope changes are a human decision, always |

---

## C.9 Constraint Summary

| Quantity | Constraint | Source |
|---|---|---|
| Change classification | exactly one layer, declared before implementation | Rule 8 |
| I-layer admission | all five litmus tests pass | §C.3 |
| Genomic quantities | tuned only at seed/prior; never global constants | Rule 9 |
| Ambivalent designs | world-side version preferred | Rule 10 |
| Tuning precondition | governing inequality written first | Rule 11 |
| Tuning budget | 3 configurations or 10×, whichever first | Rule 12 |
| Stop condition | any one of four signatures ⇒ finding report | §C.4.1 |
| Finding format | five-part template, canonized | §C.5 |
| Instruction ranking | invariants ≻ mechanisms ≻ parameters; suggestions are rank-two hypotheses | Rule 13 |
| Oracle quarantine | nothing from O executes in the evolving population | §C.2 |
| Master ledger | worker-days / lineage persistence; sub-ledger gates are provisional only | §C.4.1 sig. 4 |

---

## References

1. R. Wehner and M. Müller, "The significance of direct sunlight and polarized skylight in the
   ant's celestial system of navigation," *PNAS* 103(33), 12575–12579, 2006. (Sun-compass and
   polarized-light azimuth sensing in *Cataglyphis*; the biological precedent for a legal
   azimuth sense and for computed — not sensed — home vectors.)
2. J. Lehman, J. Clune, D. Misevic, et al., "The surprising creativity of digital evolution: A
   collection of anecdotes from the evolutionary computation and artificial life research
   communities," *Artificial Life* 26(2), 274–306, 2020. (Catalog of oracle-sense,
   reward-hacking, and over-assistance failures in evolved systems.)
