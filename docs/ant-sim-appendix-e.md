# Appendix E: The Colony Loop — Getting a Colony That Lives

_September 2026. This is the current plan of work. It decomposes the present goal into small
steps with measurable finishes. It is meant to be reasoned about, not obeyed — when a step
turns out to be wrong, the measurement that shows it is more valuable than the step was.
Status lives in `docs/certifications.md`, not here._

---

<a id="e-goal"></a>

## What we're trying to do

**One observable colony that lives inside a pre-built nest**: its ants leave, find food by
smell, bring it home, store it underground, eat from the stores when times are lean; the queen
is fed from what the workers gather; she lays, the brood is reared from the stockpile, and
matured workers replace the ones that die. A colony that is demographically closed — running
on its own logistics — before a single voxel is ever dug by behavior.

**Why the inversion.** Appendix D climbed digging first and got structure with no life around
it. Digging turned out to be the decoration; the food-brood-replacement loop is the organism.
So we author the nest ourselves this time — a complete, pleasant nest carved at scenario
setup — and spend the entire ladder on the loop. This costs nothing we cared about: authored
terrain is the same kind of scripted world-setup as the founding chamber always was, and it
buys us something we could never have bought otherwise — **a control arm**. When digging
eventually returns, its worth gets measured as _dug nest vs. authored nest on survival,
storage, and brood_. Not "did they build the shape we imagined" — "did their digging beat our
architecture." That's the fairest test excavation could ever face, and it only exists because
we built the baseline by hand.

**What this ladder never touches:** digging, spoil, new-colony founding, genetic variation,
seasons, decay. Every ant runs the identical seed genome, so any difference in behavior
between two runs is caused by the world, not by genetics — that's what makes failures
attributable while we build.

<a id="e-work"></a>

## How we work (unchanged, briefly)

The habits that have repeatedly saved this project, stated once: change one gate at a time so
a failure names its cause; write the expected outcome before running the measurement; let
scripted oracles go first because their intentions are readable, then hold the seeded
controller to the oracle's ledger through the _same_ interface, so a seed failure is provably
a controller problem; certify behavior across many world seeds because a behavior that works
in one world is a memorized route; and when a knob refuses to produce the goal after honest
effort, stop and write the finding — that's a discovery, not a defeat. Ledgers decide
everything. Shapes, routes, and destinations are things we log and describe, never things we
assert, because the moment we require a particular arrangement we stop learning what the
system actually wants to do.

<a id="e-foundation"></a>

## What exists to build on

From Appendix D, all still good: the shared output tuple and world resolution every agent
drives (mandibles dig solid, deposit into air, pick up a touched egg — one trigger, resolved
by what's in front of the ant); the brood-transport machinery; the microclimate-before-
exposure dependency we learned the hard way; the void/corridor classifier for _describing_
what spaces get used; the config-gate system with its rules of hygiene (a flag is never a
magnitude; per-world config; checkpoints carry their config; gene-adjacent constants stay
genome-derived unless an experiment says otherwise, and then it's logged as an experiment).

**Two additions this ladder is allowed to make, both already owed:** the authored-nest fixture
itself, and — if the fixture lacks one — a nest-scent carrier, because homing has to ride
_something_ an ant can smell, and a home you can't smell is a home the reflex-grade seed can
never find. Nothing else gets built. If something else seems missing, that's a finding to
write, not a feature to add.

**New config boundaries this ladder needs** (the current gates couple things we must
separate): `workerReproduction`, `colonyFounding`, `geneticVariation`, and `terrainDigging`
as four independent switches. The baseline preset is **`NEST`**: authored nest, steady food,
everything else off. The web app should show the effective gates and cargo capacities of the
running world — misread gate state has burned us twice.

---

<a id="e-ladder"></a>

## The ladder

One deliverable and one measurable finish per step; gates column is the change from `NEST`;
an admitted gate stays on. If a step's failure could blame two different causes, split it
before running it. "Multi-seed" means the harness varies world seed, headings, starting
positions, food placement, and jitter — single-seed runs establish mechanics (conservation,
determinism, persistence), never behavior.

| #   | Step                                       | Gates (Δ from NEST)    | What to build / do                                                                                                                                                                                                                                                                                                                                                                           | What done looks like                                                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Kill the hidden carve**                  | —                      | Separate colony/genome creation from founding excavation. The scenario builds _only_ the authored nest, then places queen and workers inside. (This is first because the last fix missed it: `foundColony()` still carves the old shaft under the authored nest — a hidden world-mutation that poisons every structural conclusion above it)                                                 | World air voxels equal the authored blueprint exactly, by assertion; a reintroduced bore fails the suite. Classifier describes the authored nest once, for the record                                                                                                                                                                    |
| 2   | **Independent gates**                      | —                      | The four new switches, each controlling its system and nothing else; checkpoint format carries them; UI shows effective state                                                                                                                                                                                                                                                                | Gate-matrix test green: each switch toggles only its own system; config round-trips through save/load                                                                                                                                                                                                                                    |
| 3   | **Oracle forages**                         | —                      | A scripted forager driving the shared tuple does the surface loop in the authored nest: exit, find food by ordinary senses, pick up or eat, home on nest scent, enter. No coordinates, no waypoints — the oracle sees only the ant's sensor vector, so it _can't_ cheat, which is the point                                                                                                  | Round trips complete across the seed distribution                                                                                                                                                                                                                                                                                        |
| 4   | **Oracle caches and retrieves**            | —                      | Extend the oracle: deposit food underground (wherever its policy puts it — positions logged, not asserted), and retrieve/consume cached food when the fixture pauses surface spawning                                                                                                                                                                                                        | Cache grows in abundance and drains in imposed scarcity, across seeds; mass and energy conserved; step 3 still green                                                                                                                                                                                                                     |
| 5   | **The colony energy question**             | —                      | Measure energy gathered vs. energy burned at colony level over a fixed window, then calibrate world energy against a fixed population of trained and perturbed recurrent controllers—not one optimized controller                                                                                                                                                                            | The programmed reference is positive in every unseen world with substantial surplus; at least three quarters of the fixed recurrent-controller population gathers food and remains positive in a majority of unseen worlds; gathering remains positively associated with energy balance. A positive median from one policy is not a pass |
| 6   | **Name Seed E**                            | —                      | The unified reflex list for one controller: D's certified cargo reflexes plus foraging and homing. Homing is taxis on the nest-scent carrier — the same stereo pattern that already does food and trail, pointed at one more input pair. Write the list explicitly, with a count, the way the haul and casting amendments were made: out loud                                                | The list covers everything the oracle does in steps 3–4, and every entry is either reflex-grade or explicitly flagged as needing derivation                                                                                                                                                                                              |
| 7   | **Write / derive the weights**             | —                      | Hand-write the reflex-grade entries. For the _integration_ — foraging, homing, casting, and hauling coexisting without stepping on each other under changing load state — expect to derive weights with CMA-ES against randomized episodes rather than by hand. That's not a fallback; interference between individually-correct reflexes is exactly the thing hand-writing can't budget for | Weights exist; each locus tagged hand-written or derived; derived loci trained only on randomized worlds, because a controller tuned to one fixture has memorized furniture                                                                                                                                                              |
| 8   | **Assay everything**                       | assay arena            | Isolated synthetic-stimulus tests for every reflex including the new pair, precedence checks (loaded ant: homing beats food-attraction), and the input-loopback assertion re-run against the current sensor vector                                                                                                                                                                           | All assays green — so that any later in-world failure is provably not a wiring or marshalling problem                                                                                                                                                                                                                                    |
| 9   | **One seeded ant, full loop**              | —                      | Single Seed-E ant, real controller and sensors, in the steps-3/4 scenario                                                                                                                                                                                                                                                                                                                    | Forage → home → deposit round trips comparable to the oracle's, across seeds. If the oracle could and the seed can't, the fault is in the controller pipeline — steps 7–8 have already fenced off everything else                                                                                                                        |
| 10  | **Seeded colony closes the loop**          | —                      | Full worker population produced by one common initial-training procedure: recurrent behavior cloning followed by a fixed-budget, milestone-ordered closed-loop stage. Apply the same procedure to predetermined independent initializations; no oracle runs in the evaluated worlds and no controller receives individual intervention or acceptance                                         | At least three quarters of the independently trained controllers occupy step 5's viable region and complete the food loop on held-out worlds. The gap to the programmed reference is retained evolutionary headroom, not an optimization target                                                                                          |
| 11  | **Survival**                               | + `mortality`          | Mortality and queen upkeep on, population fixed (no reproduction yet): the colony lives on what it gathers                                                                                                                                                                                                                                                                                   | Median colony survives the certification window across seeds, via harness — never a hand-picked run                                                                                                                                                                                                                                      |
| 12  | **Famine: does storage earn its keep?**    | —                      | The one comparison in this ladder: caching colony vs. a no-cache control (caching ablated in the control's policy), identical config, through an imposed food gap                                                                                                                                                                                                                            | Caching colony outlives the control. With that, storage has _earned_ its place on a ledger the colony lives by — no storage room was ever named, no depth ever required                                                                                                                                                                  |
| 13  | **Worker eggs**                            | + `workerReproduction` | Queen lays worker eggs funded by the stockpile; eggs hatch straight to adult for now; verify founding stays off                                                                                                                                                                                                                                                                              | Egg and hatch counts asserted; energy conserved along the whole path — stockpile → queen reserve → egg endowment                                                                                                                                                                                                                         |
| 14  | **Brood transport, this terrain**          | + `broodTransport`     | D's certified transport machinery re-run in the authored nest — pickup, carriage, putdown, death-while-carrying. New terrain is its own possible culprit, so it gets its own step                                                                                                                                                                                                            | Mechanics green in the new fixture; egg positions logged, wherever the ants put them                                                                                                                                                                                                                                                     |
| 15  | **Microclimate first, alone**              | + `microclimate`       | The dependency D taught us: egg exposure consumes microclimate math, so the field comes on by itself first, and we measure what it costs the adults                                                                                                                                                                                                                                          | Colony still clears the step-11 survival bar with microclimate live; the deltas recorded                                                                                                                                                                                                                                                 |
| 16  | **Exposure**                               | + `eggExposure`        | Exposure on, single config                                                                                                                                                                                                                                                                                                                                                                   | Egg survival rate measured and sane                                                                                                                                                                                                                                                                                                      |
| 17  | **Larval rearing — brood becomes capital** | + `larvalRearing`      | Eggs become larvae reared from the stockpile; juvenile growth-per-meal live. This is the r-selection repair finally entering the sim: workers stop being free and start being investments                                                                                                                                                                                                    | Larvae consume stockpile and mature into workers; conservation holds through rearing; starved larvae die — the loss has to be real or nothing downstream means anything                                                                                                                                                                  |
| 18  | **The summit: continuity**                 | —                      | Run several complete brood cycles across the seed distribution, recording everything: food gathered/cached/consumed, queen reserve, worker-days, deaths, the egg→larva→worker pipeline, cargo trips, storage depths                                                                                                                                                                          | **Deaths are replaced by matured workers funded by gathered food; the population holds inside a stated band; colony energy doesn't decay.** A colony that runs on its own logistics — the thing this project has never once had                                                                                                          |
| 19  | **Make it watchable**                      | —                      | The scenario as default review surface: stores, brood stages, queen condition, births and deaths, effective config, checkpoint/replay in the web app                                                                                                                                                                                                                                         | An observer can verify the summit's claims from the UI alone. This comes _after_ the summit on purpose — the display is earned by there being something true to display                                                                                                                                                                  |

---

<a id="e-temptations"></a>

## Things that will tempt you, and why to resist

- **Giving the ants a shortcut home.** A position readout or a "toward nest" signal would make
  step 9 pass tomorrow — and would make homing something we installed instead of something the
  world affords. Homing rides scent. If scent genuinely can't carry it, that's a finding about
  the carrier, and a much more interesting one than a passing test.
- **Asserting where food or eggs should go.** The moment a test requires "food in the storage
  room," we've decided the answer and stopped measuring it. Log positions, describe them with
  the classifier, and let the famine and brood ledgers say whether the colony's choices
  worked.
- **Certifying on the seed where it works.** It will work somewhere. The claim is only real
  across the distribution.
- **Bundling gate admissions to save time.** Each gate is one step because when step 16 fails,
  we need to already know it isn't microclimate, isn't transport, isn't reproduction. The
  slow way is the fast way; we have the scars to prove it.
- **Building the missing thing.** If the loop seems to need a mechanism the world doesn't
  have, the deliverable is the finding that names it. Structural additions are decisions made
  with the human, with the evidence on the table.

<a id="e-after-summit"></a>

## After the summit

In order, one at a time, each judged by ledgers against a colony that demonstrably works:
**genetic variation** first — real selection acting on a living colony, with the heritability
and lineage instrumentation from Appendix A finally watching something worth watching; then
**colony founding**, once one colony can reproduce sustainably; then **digging**, returned as
optional expansion from the authored nest and judged by whether dug structure beats the
authored control arm on survival, storage, or brood — Appendix D's machinery is sitting ready
for exactly that comparison; then spoil, decay, seasons, and the rest of the pressures, one
at a time. `autoContinue` stays off in every measured run, always: a colony dying is data.
