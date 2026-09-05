# Normalized simulation design

These documents are the current design and work sequence for Antropy. They replace the appendices
as operating documents while preserving every supplied source in [the source archive](../sources/README.md).
The [principles](../principles.md) govern decisions; [certifications](../certifications.md) record
evidence; [the backlog](../backlog.md) lists only feature-level future work.

<a id="design-categories"></a>

## Work categories

| Category | Owns |
| --- | --- |
| [Controller, genome, and embodiment](controller.md) | Sensor/action contract, controller substrates, genomes, initialization, seeded competences, and memory |
| [Colony biology and survival](colony-biology.md) | Food, energy, queen, brood, reproduction, mortality, replacement, and viability floors |
| [Environment and nest morphogenesis](environment.md) | Terrain, fields, resources, liabilities, configuration, authored nest, and later construction |
| [Experimentation, harness, and certification](experimentation.md) | Oracles, tests, harnesses, calibration, training, ledgers, findings, and evidence |
| [Evolutionary and advanced systems](advanced.md) | Selection, population genetics, plasticity, castes, multiple colonies, threats, and alternate controllers |

The [source coverage map](source-coverage.md) routes every source section into these owners and
records where later evidence changed its status.

<a id="design-status"></a>

## Status vocabulary

- **Delivered:** the stated mechanism or evidence exists for exactly the scope named. “Mechanics
  delivered” does not imply a long-horizon colony outcome is certified.
- **Backlog:** intended work with an explicit place in the linear sequence. Detailed requirements
  live in the owning category document.
- **OBE:** overtaken by evidence, a later design, or a changed goal. The idea remains recorded with
  its replacement or rejection reason.

There is no implicit “done because code exists.” Certification and admission into the current
world are separate claims.

<a id="design-current"></a>

## Current boundary

The authored nest, world carriers, programmed policy, trained RNN cohort, mortality, resource-funded
replacement, and fixed-genome demographic continuity are delivered. The next implementation
question is not better RNN optimization or another fixed-controller panel. It is whether
inheritance and selection can be measured honestly before genetic variation changes the colony.

The untreated resilience curve preceded mortality as Appendix G required. Mortality, replacement,
and continuity did not activate standing crop, metabolic depression, or a deeper queen reserve;
those mechanisms remain conditional rather than silently joining the evolution world.

<a id="design-order"></a>

## Cross-category implementation order

| Order | Status | Outcome | Detailed owners |
| ---: | --- | --- | --- |
| 1 | Delivered | Deterministic voxel world, energy economy, controller contract, physical cargo, lifecycle/config gates, persistence, rendering, and harness ledger | CTRL-01–05, ENV-01–02, EXP-01–04 |
| 2 | Delivered, isolated | Construction/cargo seed and full-world lifecycle/evolution mechanics exist as diagnostics but are not admitted into the current colony | CTRL-07, ADV-01 |
| 3 | Delivered | Organic authored-nest control with no hidden carve; deep and material odor carriers; readable zero-state food/cache policy | ENV-03–05, EXP-05 |
| 4 | Delivered | One fixed training procedure places a predetermined RNN cohort broadly inside the food-loop and energy-support region without terminal search | CTRL-06, EXP-06–07, BIO-01–02 |
| 5 | Delivered | Measure the untreated colony resilience curve | BIO-03, EXP-08 |
| 6 | Conditional, not admitted | Add a standing crop, metabolic depression, or deeper queen reserve only for a measured viability failure | BIO-04–06, ENV-06 |
| 7 | Delivered | Admit mortality and queen upkeep alone; certify fixed-genome survival across varied worlds | BIO-07, EXP-09 |
| 8 | Backlog | Demonstrate that physical caching extends survival through an imposed food gap | BIO-08, EXP-09 |
| 9 | Delivered / backlog | Worker reproduction is admitted; brood transport remains isolated because replacement did not require it | BIO-09–11 |
| 10 | Delivered / backlog | Larval rearing is admitted and edible brood is covered; microclimate and exposure remain isolated | BIO-12–13, ENV-07 |
| 11 | Delivered | Certify demographic continuity: gathered food funds matured workers that replace deaths without energy decay | BIO-14, EXP-09, ADV-02 |
| 12 | Backlog | Make the certified colony loop independently reviewable in the web app | BIO-15 |
| 13 | Backlog | Measure food and homing path efficiency without putting pathfinding inside the controller | EXP-10 |
| 14 | Delivered / backlog | Evolutionary health, conservation-correct merit, global ancestry, founder-line outcomes, and durable harness series are delivered; event detection, deep lineage inspection, and checkpoint-linked replay remain later observation work | ADV-03, EXP-11–12 |
| 15 | Backlog | Admit genetic variation alone, then the diverse-sire and mutation portfolio safeguards | ADV-04–06, CTRL-08–09, BIO-16 |
| 16 | Backlog | Admit sustainable colony founding and repeated collapse/recovery on one shared map | ADV-07, BIO-16 |
| 17 | Backlog | Reintroduce optional excavation and spoil; compare dug colonies with the authored control on colony ledgers | ENV-08–11, ADV-08, EXP-13 |
| 18 | Backlog | Admit decay, seasons, and stronger liabilities one at a time; preserve an ordinary viable region | ADV-09, ENV-07 |
| 19 | Backlog | Add within-lifetime plasticity and developmental reaction norms; observe learning, assimilation, morphs, and roles | CTRL-10, ADV-10–11 |
| 20 | Backlog | Add multiple-colony threats, invasion, raiding, activity-scaled pressure, and richer soil/water ecology | ADV-12, ENV-12–13 |
| 21 | Backlog | Implement linear GP and compare it with the RNN on viable-space width, evolutionary outcomes, cost, and legibility | CTRL-11–12, ADV-13 |
| 22 | Backlog | Scale world computation only where target-scale profiles demonstrate need | ENV-14, ADV-14 |

<a id="design-change"></a>

## Changing the design

A new supplied document is archived unchanged, entered in the coverage map, and reconciled into
the owning category sequence. It supersedes only the ideas it explicitly changes. A new mechanism,
sensor, field, or gate meaning requires a structural finding and human decision. Evidence may mark
an item OBE without deleting its provenance.
