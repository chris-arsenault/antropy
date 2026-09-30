# Birth orientation and physiological aging

**Status:** Delivered plan (archived) — randomized birth orientation and core-linked,
age-dependent body maintenance shipped as physical v45 at `79ea580`. Body is the execution
record; its open-gate, "remaining", "uncommitted/undeployed" and human-review statements are
historical and retired by the September 30 delivery policy ([plans README](../README.md)).
Current laws live in [composed runtime](../../design/chemistry/composed-runtime.md).

Sulion plan: `404e9450-689d-4d1c-91b8-bb0a032e31c0`.

Outcome: daughters do not inherit spatial orientation, and older cells pay progressively
more to sustain their bodies. Inherited body allocation changes that burden. No lifespan
cutoff, new controller input, dedicated longevity gene or machinery-building system is added.

## Design and assumptions

Heading and division axis are spatial state, not chemical alleles. Draw one uniform division
axis and independent uniform headings for each newborn from the existing body random stream.
Place daughters locally along that axis. Preserve material, energy, injury and genetic
transmission; reset private controller state and initialize local receptors as before.
A budding parent retains its orientation, age and experience. There is no stored momentum.

Use chronological age from existing birth tick, with no redundant persistent age counter.
For body mass M, core fraction f, age a in model seconds and one wear timescale T, the
body-maintenance multiplier is `1+a/(T*f)`. Total basal work is
`(1+damage)*(maintenance*M*(1+a/(T*f))+controllerCost)`.
Core supports cellular upkeep; allocating more body to core slows age-related cost growth,
but reduces other capacities at fixed mass. Increasing absolute size alone does not change
the multiplier. This is an explicit artificial upkeep law, not a claim of biological fidelity.
The composed-runtime document owns the governing equation after implementation.

Default T is 6000 model seconds, independent of source renewal and climate periods. This one
new control sets the wear timescale; reusing an environmental clock would couple unrelated
mechanisms. A 50%-core body doubles its body upkeep after 3000 seconds; at age 6000 its
multiplier is three. Age-zero costs remain unchanged. Integrate the linear age term at the
interval midpoint, including growth/cover reserves and newborn division reserves. Finite
income can eventually fall below maintenance; well-fed cells do not die on a fixed birthday.
Fission produces two age-zero daughters; budding preserves the parent's age. Injury persists.

Evidence that could change the calibration: the September 29 v44 snapshot has median age
542 seconds, 90th percentile 3959 and maximum 36081. The initial scale places most pressure
on long-lived residents, without certifying an ecological outcome or a particular population.
Increasing core also increases energy capacity; the tradeoff must be tested at equal mass
and against the displaced functional capacity, rather than calling longevity a free benefit.

Physical v45 rejects older checkpoints under the existing no-migration policy. Local
implementation does not deploy, restart or reset the continuing live server.

## Phases and acceptance

1. Audit birth state, upkeep, repair, genes and consumers; settle a single equation and
   account for fission and budding. Complete when current consumers and assumptions are read.
2. Implement ordinary runtime, action reserves, numerical budget diagnostics, inspection,
   schema/config and current documentation. No benchmark-only or observer-only aging path.
3. Test independent birth orientations and local placement, genetic-stream separation,
   conservative resources/injury, exact integrated maintenance, age persistence, rejuvenation
   at fission, old budding-parent reserves and the genetic longevity/capacity tradeoff.
   Use bounded constructed checks; do not run an evolution campaign. Run `make ci`.

The bounded survival check holds income, damage and body mass fixed, derives the energy
balance before execution, then exercises ordinary payment/death operations. It distinguishes
an age-caused deficit from depleted food and checks that greater core delays it while reducing
motor capacity. It does not establish evolved dispersal, colony turnover or visible motion.

## Implementation and bounded evidence

Birth orientation/axis, core-protected upkeep, growth and cover reserves, fission/budding
reserves, current-age diagnostics and selected-cell age/upkeep display are implemented.
Physical v45 includes the config and binary header change. There is no new persistent age
counter, per-tick allocation, genetic locus or simulation branch.

Six new bounded mechanics tests check birth conservation and RNG separation, age integration
at dt 0.2/0.5/1, the capacity tradeoff, fission/budding age and save restoration, parameter
validation and finite survival on fixed income. The survival fixture supplies exactly newborn
upkeep, holds biomass fixed and starts with 0.1 usable energy; it intentionally bypasses
ecology to isolate the maintenance/death mechanism. For slope k, prediction is
`E(t)=0.1-k*t²/2`, hence `deathTime=sqrt(0.2/k)`.
The higher-core body dies at 281.4 model seconds (prediction 281.289), versus 259.2
(prediction 259.129) for the higher-motor body. Both are within one 0.2-second tick and the
energy ledger closes. These durations are consequences of this fixed-income fixture, not
predicted lifespans in the live world.

The first full check caught a version/header mismatch in server save/load; the v45 header and
version assertions were corrected. Full delivery validation is recorded in Sulion phase 3.
Human review of visible motion and ecological effects remains open. No deployment or live
world reset is part of this local implementation.
