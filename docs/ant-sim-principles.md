# Ant Simulation — Goals and Operating Principles

*This document supersedes the numbered Design Rules (1–20) as the primary operating lens.
The appendices (A–E) remain in force as reference material, derivations, and ladders — but
they are evidence and plans, not statute. Where a numbered rule and a principle here seem to
conflict, reason from the principle and say so. You are expected to think, not to comply.*

---

<a id="principles-goals"></a>

## The goals, in order

You should always be able to say which of these your current task serves, and trade off
against them directly.

1. **Ultimate:** a browser simulation in which ant colonies genuinely evolve — behavior earned
   by selection acting on heritable controllers in a world with real pressures. Nothing
   interesting in the sim should be authored when it could have been earned.
2. **Current:** one colony that *lives* — gathers food, stores it, survives on it, raises
   brood, and replaces its dead — inside the authored nest, before anything digs.
   (The Appendix E ladder is this goal with pass conditions attached.)
3. **Standing, at all times:** every result attributable to a cause; every claim backed by a
   measurement; every structural change a human decision.

A task that serves none of these is the wrong task, whatever document it appears in.

---

<a id="principles-core"></a>

## The principles

Each carries its reasoning, because the reasoning is the part you'll need when the situation
doesn't match the pattern.

<a id="principle-author-world"></a>

### 1. Author the world, not the ant

Pressures, physics, costs, and carriers are ours to design freely. Answers, choices, and
destinations belong to the controller — seeded in erasable ink, evolved thereafter. The test
for a proposed sense or actuator: does it report a fact about the world (temperature, scent,
contact), or does it hand the ant a solution (which way home, where to dig, whether it's
safe)? A percept that cannot be fooled is an oracle, not a sense. A motor that picks its own
target is a decision, not an action. When torn between an ant-side answer and a world-side
mechanism, build the world-side version — it's always legal, usually what biology did, and it
leaves the interesting problem to the controller. Corollary: quantities the spec assigns to
the genome (gains, capacities, rates) are never pinned by global constants; tune them at the
seed and prior, or the run silently stops being an evolution experiment.

<a id="principle-function-judges"></a>

### 2. Function judges; shape describes

The only pass/fail authority is a ledger the colony actually lives or dies by — energy,
survival, brood, persistence. Named structures (chamber, cache, caste, trail) are vocabulary
for describing what won, never specifications for what must win. The reason: any shape target
imports the designer's picture of the solution into a system whose entire purpose is to let
the world pick the solution, and it makes success unfalsifiable — you can't distinguish "this
shape is optimal" from "we forced this shape." If a behavior you hoped for doesn't appear,
the honest moves are: check whether the world actually charges for its absence (behaviors are
motivated by liabilities, not rewards); or report the finding. Never patch by prescribing the
outcome. The authored nest exists as a *control arm* for exactly this: when digging returns,
dug structure must beat authored structure on ledgers, not resemble anything.

<a id="principle-change-measure"></a>

### 3. Change one thing, predict its effect, then measure

Attributability is the scarcest resource in this project — nearly every wasted week traces to
a run where two things changed at once or a conclusion was drawn from a picture instead of an
assertion. So: one gate, one deliverable, one pass condition at a time; if a failure report
could name two culprits, the step was too big. Before touching a knob, write down the
inequality that governs the goal and confirm the knob appears in it. If prediction and
measurement disagree twice at material knob movement, stop — the constraint is structural,
and the deliverable is a finding report (invariance observed, mechanism hypothesis, minimal
structural fix, cost, decision requested). Findings are promotions: the r-selection finding
was worth more than any tuning success in this project. An agent grinding a knob to avoid
filing a finding is failing at the actual job.

<a id="principle-measurements-outrank"></a>

### 4. Measurements outrank everyone

Including the design conversation, the appendices, this document's author, and the human's
suggestions. Suggestions arriving from design discussion are hypotheses — often good ones,
sometimes wrong ones (the "amplify doubles as return-to-shaft" claim was confidently stated
and falsified by your measurement; that correction was the process working). When reality
contradicts a document, the document is wrong: say so plainly, with the evidence, and propose
the amendment. Never certify around a contradiction, and never comply with an instruction the
data has already refuted.

<a id="principle-unseen-worlds"></a>

### 5. It has to work in worlds you haven't seen

A behavior certified on one seed is a memorized route. Behavioral claims are certified across
varied worlds, positions, and jitter; single-seed runs certify mechanics only (conservation,
determinism, persistence). Oracles come before seeds at every rung — not because scripted
agents matter, but because their intentions are readable, so they burn down world bugs and
define the target ledger before an opaque controller enters. And both kinds of agent drive
the world through the identical interface, so that when the seed fails where the oracle
succeeded, the fault is provably in the controller pipeline and nowhere else.

---

<a id="principles-invariants"></a>

## The invariants

The short list that is genuinely non-negotiable — not derivable judgment calls but
architecture:

- **The evolutionary run has no fitness function.** Scoring machinery exists only in
  quarantined instrumentation and never executes inside the evolving population.
- **One interface.** Every agent — scripted oracle or neural controller — emits the same
  output tuple through the same world resolution. No privileged mutations, ever.
- **Genome territory.** Evolvable quantities are never overridden by committed global
  constants; overrides are logged experiments.
- **Structural changes are human decisions.** New fields, sensors, mechanisms, or gate
  semantics arrive by finding-and-decision, not by implementation momentum.

---

<a id="principles-appendices"></a>

## How to hold the appendices now

- The **ladders** (D §D.2, E §E.3) are the current goals decomposed into steps with pass
  conditions. Follow them as plans; amend them by finding when they're wrong — both have been
  amended by your findings before, and that's their best feature.
- The **contracts** (actuation, classifier definitions, gate system) are shared vocabulary and
  mechanics; keep them because divergence between spec and code is worse than either alone.
- The **numbered rules** are historical citations into the five principles above. When one
  seems to bind strangely in a new situation, don't rules-lawyer it — go to the principle it
  instantiates, reason from the why, and flag the tension in your report.
- Status lives in `docs/certifications.md`. Findings use the five-part template. Everything
  else about *how to report* reduces to: claims scoped to evidence, predictions stated before
  measurements, contradictions surfaced instead of absorbed.

You have standing to reason. Use it.
