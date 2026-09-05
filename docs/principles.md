# Simulation goals and operating principles

This is the governing decision lens for Antropy. The archived source documents explain how these
principles were derived; the [normalized design index](design/README.md) applies them to the work.

<a id="principles-goals"></a>

## Ordered goals

1. **Genuine evolution.** Build a persistent browser simulation where selection acting on
   heritable controllers produces behavior and colony organization. Do not author an interesting
   answer when the world can create pressure for evolution to earn it.
2. **A living colony.** First establish one colony in the authored nest that gathers and stores
   food, survives on it, raises brood, and replaces dead workers. Digging and genetic variation
   remain isolated until this loop is certified.
3. **Attributable work.** Every result has a named cause, every claim has measurement, and every
   structural change has human authorization.

A task that serves none of these goals is not current work.

<a id="principles-world"></a>

## Author the world, not the ant

World physics, costs, pressures, and physical carriers are legitimate design. Answers, chosen
destinations, and self-targeting actions are not. A sensor reports a fallible local fact such as
temperature, contact, or scent. An actuator applies a local intent. The controller decides what
those facts mean and what to do.

Reflexes may be seeded as erasable genome weights. Scripted oracles may express explicit policy
only inside quarantined instrumentation. Quantities assigned to the genome remain genome-derived;
an experimental override is per-world, persisted, and logged.

<a id="principles-function"></a>

## Function judges; form describes

Energy, survival, brood, replacement, and persistence ledgers decide whether a system works.
Chambers, caches, routes, trails, castes, and other forms describe what produced those results.
They are not targets. The authored nest is a control arm: evolved construction must outperform it
on colony ledgers, not reproduce its geometry.

An apparent behavior gap first asks whether the world charges for that behavior's absence. Adding
the desired outcome to a sensor, action, test fixture, or shape assertion does not answer that
question.

<a id="principles-attribution"></a>

## Change one thing, predict, then measure

One work step admits one mechanism or gate and has one finish. Before tuning, state the governing
inequality and confirm that the proposed knob appears in it. Behavioral claims use varied world
seeds, starts, headings, food placements, and deterministic jitter. A single seed can certify only
mechanics such as conservation, determinism, and persistence.

When prediction and measurement disagree twice under a material change, or a tuning budget is
exhausted, stop. Record the observed invariance, mechanism hypothesis, smallest structural fix,
recalibration cost, and requested human decision. Do not tune around a structural result.

<a id="principles-evidence"></a>

## Measurements outrank plans

Measurements outrank conversations, plans, source documents, and preferred mechanisms. Never
certify around a contradiction. Preserve negative results and superseded procedures as evidence;
replace their authority, not their history.

Readable scripted policies run before opaque controllers at a behavioral boundary. Comparable
oracles and controllers receive the same sensor tuple and drive the same action resolver. An
omniscient oracle may measure a world ceiling, but it cannot become a controller target.

<a id="principles-layers"></a>

## Classify changes by ownership

Every proposed change has one primary owner:

| Layer | Owns | Legality |
| --- | --- | --- |
| World | Physics, materials, fields, energy, lifecycle, and liabilities | May author pressures and carriers |
| Interface | Local sensors and actuators | Must expose a physical local fact or local intent, with cost |
| Seed | Founder weights and initialization distributions | May author erasable behavior |
| Parameter | Magnitudes inside an existing mechanism | May tune only against a governing inequality and harness evidence |
| Oracle | Policies, assays, ledgers, and analysis | May hard-code for diagnosis but never execute in the evolving population |

A new sensor or actuator must have a carrier, be local, have a cost, pose a question rather than
provide an answer, and leave the behavior of interest available to evolution. Prefer a world-side
mechanism when both a world fact and an ant-side answer could produce the result.

<a id="principles-stop"></a>

## Stop conditions for tuning

Stop parameter tuning and write a structural finding when any of these occurs:

- a tenfold movement or movement to the viable-region boundary does not change the ordering;
- one desired ledger improves only by an equal loss in another because of conservation;
- the target appears only outside a viability boundary;
- local metrics improve while the colony ledger does not; or
- three configurations for one knob and goal have been tried without resolving the question.

Suggestions about mechanisms rank below invariants and measurements. Specific parameter values
rank below both.

<a id="principles-invariants"></a>

## Architectural invariants

- The evolving population has no explicit fitness function or synchronized generation boundary.
- Scoring and optimization execute only in the harness, never in the living population.
- Oracles and controllers share the action tuple and world resolver; no oracle-only mutation path
  exists.
- The controller is replaceable behind `act`, `mutate`, `recombine`, and `seed`; other modules do
  not inspect genome internals.
- Genome-owned quantities are not overridden by committed global constants.
- Structural additions to the world or interface require a recorded human decision.
- Long-horizon outcomes live in the harness ledger. Bounded deterministic mechanics belong in
  Vitest.
