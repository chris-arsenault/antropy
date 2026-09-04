# Appendix F: The Viable-Space Problem

*September 2026. Companion to Appendix E. Status lives in `docs/certifications.md`.*

**The question this appendix answers:** the set of RNN weights that can perform the current
behavioral target appears to be very small. If only near-optimal weight settings survive,
the population has no room to vary, and the core experiment — real-time evolution compared
against initial training — cannot run. What changes to architecture, memory, signals, or
representation fix this?

The candidates considered are the ones the question came with: external memory, more
pheromone streams, simplifying the programmed behavior into something learnable, attention
heads, and temporal or stateful designs. The main finding is that the first fix belongs in
the world, not in the controller.

---

## F.1 The problem, stated correctly

"The RNN is Turing-complete over these inputs" was used earlier in this project as
reassurance. It answers the wrong question. Turing-completeness means a solution exists
somewhere in weight space. Survival and evolution depend on two different properties:

- **Measure:** how much of weight space implements the behavior. A solution that exists
  only at isolated points will not be found by search and will not be held by a population
  under mutation.
- **Flatness:** how much perturbation the behavior tolerates. Sharp optima lose their
  occupants to ordinary mutation. Flat regions keep them.

The earlier capacity analysis distinguished these two properties and then failed to apply
the distinction: the behavioral target grew for months while the capacity argument stayed
the same. The objection in the opening question is correct.

Discrete procedural behavior — exact timers, remembered readings, compare-then-latch
sequences — is implemented in a plain recurrent network as finely balanced dynamics:
near-marginal eigenvalues for counters, precisely placed attractors for modes. These are
narrow, sharp regions of weight space.

**Standing measurement.** For any candidate controller: perturb the genome at increasing
mutation scales and plot ledger retention against perturbation size. This mutational-
robustness curve is the measurement of viable-space size. A flat curve means a broad region
and room to evolve; a cliff means a peak and no experiment. The curve is cheap to compute,
works for any substrate, and is required for every seed from now on.

## F.2 Where the narrowness came from

The programmed oracle carries roughly eighteen state fields. Nearly every one exists to
reconstruct a fact the world does not emit:

| Oracle state | Missing world affordance |
|---|---|
| Three stored vertical-band samples plus attention switching | Sensing reads one vertical band per tick, so comparing bands requires a multi-tick scan-and-remember routine |
| Remembered entrance signal and depth, 12-tick mouth-transition counter, descend-until-signal-halves protocol | The nest-scent source is at the mouth. An entering ant must walk down the same gradient it climbed, which requires memory and hysteresis |
| 16-tick cache-search floor, roominess test, deposit latch | Nothing in the world signals where stores are or belong; counters substitute for a carrier |
| Remembered previous signal plus cast counters | No channel carries derivative information, so rising-versus-falling must be computed from memory |
| Cached-vs-wild food discrimination | Handled food is chemically identical to wild food |

None of these were cheats. Each was a reasonable repair given the interface as shipped.
Together they changed the target from "compose several reflexes" into "rebuild a state
machine inside a small continuous dynamical system." This is the project's first principle —
author the world, not the ant — violated inside the oracle layer, where the interface tests
were not applied. The oracle was free to accumulate internal state, and that state quietly
became the standard the seed had to match.

The general lesson: when a target seems too hard for every controller, first audit what the
controllers are being forced to compute.

## F.3 The candidates

### F.3.1 External memory

Legitimate in two forms.

**World-side memory.** One tier of the project's memory hierarchy already lives in the
world: pheromone fields are shared, persistent, external state. The two unlabeled channels
are underused. A seed that lays a personal breadcrumb on channel B while walking, and avoids
its own recent trail while casting, gets "where have I been" without any internal state.
Several of the mechanisms in F.4 make the same move: state the oracle holds internally
becomes a field the world holds for everyone.

**Controller-side memory.** A plain tanh RNN that struggles with timers and latches is the
founding problem of gated recurrence (the LSTM/GRU line). A gate carries state through an
additive path with explicit write and keep controls, so a latch is a saturated gate.
Saturation is flat: broad in weight space and mutation-tolerant, unlike a tuned eigenvalue.
The concrete option is to keep the 12 tanh units and add four to six latch registers with
evolvable write and decay gates, readable as inputs. The cost is a few hundred weights. It
remains one substrate with an all-weights genome, so diploid averaging, convention-aligned
crossover, CMA derivation, and the plasticity program all continue to work. This change
widens the viable region, which is the criterion that matters.

**The illegal form:** a procedural program wrapped around the network as a second control
system. It reintroduces the initialization problem inside a more complicated controller, and
it makes behavior unattributable — no one can say which substrate produced what. External
memory means world fields or in-genome gates. It never means a second controller.

### F.3.2 More pheromone streams

The instinct is right, and biology supports it broadly, with one inversion: ants mostly do
not write meaningful labels. Things smell like what they are, and the meaning lives in the
responder. Colony odor impregnates nest fabric and familiar ground. Handling transfers
colony hydrocarbons onto food. Oleic acid on a body means "corpse — remove it," and dabbing
it on a live ant gets her carried to the midden. The signal can be fooled, and that is what
makes it a sense rather than an oracle.

Tests for any typed signal:

1. **It has a carrier.** A physical quantity in the world that diffuses, decays, washes
   out, or transfers by contact — and can therefore be wrong. A computed `IS_IN_NEST`
   boolean has no carrier and cannot be fooled. It is the nest-compass mistake again.
2. **Emission follows identity, not intent.** Food emits food scent; saturated nest fabric
   emits colony odor; brood emits brood scent. The world broadcasts facts about materials.
3. **Meaning stays conventional.** The world never enforces a response. The seed wires one,
   and evolution may strengthen, repurpose, or abandon it. Typed carriers, never typed
   instructions. The blank channels stay blank; they are for meanings evolution invents.
4. **Pre-designation is legal where scripted setup already is.** Pre-impregnating the
   authored nest with colony odor at scenario setup is the same fiat that carves the nest.

This principle is not about smell. Scent is one carrier family. The same tests admit
vibration (trapped ants stridulate; nestmates dig toward the substrate-borne signal),
airflow (a draft channel is an honest near-an-opening fact), light (depth/darkness already
is one), and contact. The rule is physical facts through physical carriers. The mechanisms
in F.4 are mostly chemical only because that is where the oracle's state traced.

### F.3.3 Simplify the programmed behavior

This candidate and the world-affordance finding are the same idea from opposite ends. The
eighteen-field program is not compressed by better training; it is shrunk by deleting its
reasons to exist — by making the world emit what the program was computing. Section F.4 is
the deletion list. The re-derivation audit in F.5 measures the result. The prediction,
written down before the measurement: eighteen fields fall to between three and five — one
or two phase latches, possibly one timer, a casting trace.

### F.3.4 Temporal input

Two cheap forms, both feedforward: **phasic channels** (a change-since-last-tick value
alongside each scent magnitude; sensory adaptation is universal in real receptors) and
**frame stacking** (the last two or three sensor frames as extra inputs). Both convert
short-horizon memory demands into ordinary weights on honest inputs. Phasic channels are in
the build list. Stacking is the fallback if remembered-comparison state survives the audit.

### F.3.5 Attention heads

No. Attention provides content-addressable routing across many tokens. An ant has about 23
scalar inputs and no token structure. Everything attention would solve here is solved by
gates or by honest inputs at a fraction of the machinery. Recorded to avoid revisiting.

## F.4 The world mechanisms

Build in this order. Each deletes named oracle state.

1. **Parallel vertical sensing.** Report all three vertical bands at once, or the current
   band plus a summed-vertical channel. Deletes the scan-and-remember routine. Done when
   vertical gradient response is a single-tick decision in the re-derived oracle and the
   loopback assertions cover the wider vector.
2. **Deep-source nest field.** Move the nest-scent source from the mouth to depth (queen,
   brood, cache level). Diffusion through the tunnels then produces one monotone gradient:
   outside it leads to the mouth, inside it leads deeper. Deletes the entire
   entrance-transition apparatus, because entering stops being a gradient inversion. Done
   when the field-navigability assertion passes from every reachable voxel, including
   surface-through-mouth-to-depth in one greedy climb, with no local maximum at the
   entrance.
3. **Colony odor as an absorbed material property.** Nest voxels adjacent to sustained
   colony-scented air slowly absorb and re-emit the odor. The authored nest is
   pre-impregnated at setup. Deletes all inside-the-nest inference; inside becomes a
   threshold read. Because absorption follows occupancy, the marking is traffic-keyed:
   abandoned nests fade in scent, which fits the deferred nest-decay mechanic. Done when a
   logged inside/outside diagnostic (never a sensor) matches ground truth across the seed
   distribution using the scent threshold alone.
4. **Contact-transfer marking.** Carried food picks up colony scent passively. Cached food
   then smells of food and colony; wild food smells of food only. Deletes the cache-search
   floor, the roominess test, the deposit latch, and the cached-vs-wild logic. Storage
   reduces to: loaded, deep, colony scent high — deposit. Retrieval during scarcity is
   taxis toward the two-channel coincidence. Both are reflex-grade. Done when the
   re-derived oracle stores and retrieves without counters and the famine comparison still
   passes.
5. **Phasic channels** (F.3.4). Deletes remembered-previous-signal fields; casting triggers
   from the change channel. Done when no stored readings remain for gradient tracking.
6. **Blank-channel breadcrumb** (F.3.1). Nothing new to build; explored at the seed level.
   No new channels beyond colony odor and its contact-transfer mechanic. Corpse scent
   waits for mortality; brood scent arrives with the brood steps as planned.

## F.5 The audit and the decision rule

After mechanisms 1–5 land, re-derive the sensor-limited oracle in the fixed world and
publish its residual state count as a finding. That number drives the substrate decision:

- **Low residual** (a few latches, no exact counters): the shrunken target fits broad
  regions of the current substrate, possibly with the latch registers from F.3.1. Proceed,
  and measure the robustness curve on the new seed.
- **High residual** (many fields or surviving timers): the task is genuinely
  program-shaped, and the substrate conversation opens with data. That conversation,
  including the project's standing intent to move to linear GP, is outside this appendix.
  This appendix's job is to make sure it happens against the smallest honest target.
- **Ties:** the robustness curve decides. The substrate that holds the behavior on the
  flatter curve is the one the experiment can live on.

The answer to the opening question is therefore a sequence, not a component: fix what the
world owes, re-derive, count, measure flatness, and only then argue about controllers.

## F.6 What this buys the experiment

Environment tuning already banked real margin: from +1 to roughly +180 energy per 1,000
ticks across sixteen worlds. Under the old interface, controllers spent that margin
reconstructing world facts every tick. Under this one, the margin does what it was created
for: it gives evolution room to be mediocre and still alive. The seed was never supposed to
match the oracle. The oracle is a capability benchmark whose ledger sits above the
population, and the climb toward it is what real-time evolution exists to demonstrate.
Immortality and the absence of threats will end, and margins will tighten. When they do,
the robustness curve says whether the population has anywhere to stand.

## F.7 Failure modes to avoid

- **Writing labels instead of emitting identities.** A `MARK_AS_NEST` output or an
  `IS_IN_NEST` bit is a declared meaning with no carrier. If a signal cannot be fooled —
  washed out, faked, absorbed by the wrong wall — it is an answer, not a sense.
- **A channel for every convenience.** Each typed carrier is a permanent commitment. The
  bar: it deletes named oracle state and passes all four tests. Colony odor clears it. A
  "storage room here" beacon does not, because storage location is a choice the responder
  makes, not an identity the world has.
- **Letting the oracle get clever again.** The oracle layer's freedom to hard-code is for
  policies, not for accumulating another eighteen-field standard. After the re-derivation,
  growth in oracle state means the world is hiding something again. Audit the world before
  extending the oracle.
- **A second control system as memory.** Latch registers in the genome are fine if the
  audit warrants them. A procedural wrapper around the network is not, because it makes
  behavior unattributable.
- **Skipping the robustness curve when the ledger looks good.** A seed that passes every
  test from a knife-edge dies in the first generation of real mutation.
