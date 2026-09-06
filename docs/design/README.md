# Normalized simulation design

These documents are the current design and work sequence for Antropy. They replace the appendices
as operating documents while preserving every supplied source in [the source archive](../sources/README.md).
The [principles](../principles.md) govern decisions; [certifications](../certifications.md) record
evidence; [the backlog](../backlog.md) lists only feature-level future work.

<a id="design-categories"></a>

## Work categories

| Category                                                          | Owns                                                                                                      |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [Controller, genome, and embodiment](controller.md)               | Sensor/action contract, controller substrates, genomes, initialization, seeded competences, and memory    |
| [Colony biology and survival](colony-biology.md)                  | Food, energy, queen, brood, reproduction, mortality, replacement, and viability floors                    |
| [Environment and nest morphogenesis](environment.md)              | Terrain, fields, resources, liabilities, configuration, authored nest, and later construction             |
| [Experimentation, harness, and certification](experimentation.md) | Oracles, tests, harnesses, calibration, training, ledgers, findings, and evidence                         |
| [Evolutionary and advanced systems](advanced.md)                  | Selection, population genetics, plasticity, castes, multiple colonies, threats, and alternate controllers |

The [source coverage map](source-coverage.md) routes every source section into these owners and
records where later evidence changed its status.

<a id="design-status"></a>

## Status vocabulary

- **Delivered:** the stated mechanism or evidence exists for exactly the scope named. “Mechanics
  delivered” does not imply a long-horizon colony outcome is certified.
- **In progress:** the current repair or implementation boundary; its finish condition is stated in
  the owning category and no completion claim is implied.
- **Backlog:** intended work with an explicit place in the linear sequence. Detailed requirements
  live in the owning category document.
- **OBE:** overtaken by evidence, a later design, or a changed goal. The idea remains recorded with
  its replacement or rejection reason.

There is no implicit “done because code exists.” Certification and admission into the current
world are separate claims.

<a id="design-current"></a>

## Current boundary

The authored nest, world carriers, and bounded body mechanics remain delivered. The Appendix H
programmed food-loop policy is invalid: despite passing its population-ratio panel, human review
found universal translated-circle motion inside and outside the nest and more than half the workers
congested at the mouth by tick 100. The old trained RNN cohort is also invalid because it learned an
earlier failed policy.

The web app now presents a matched pair of immortal single-ant controls in the authored nest. The
full-map ant reads all food coordinates and the legal 3D movement graph. The fresh programmed ant is
a stateless function of the shipped local sensors. It follows physical entrance traffic, food odor,
and nest odor rather than a planner-authored food or larder route. Both use the ordinary motor and
mandible actions, the same persistent food patch, and the same queen-core larder neighborhood. Runs
2460–2462 place the sensor arm 1.8–6.9% ahead of the full-map arm over five genuine external-food
returns with no immediate steering reversals. The sensor arm still awaits human trajectory review
before it becomes an RNN teacher.

Mortality, resource-funded replacement, fixed-genome continuity, and selection instruments remain
implemented. Their historical measurements are retained, but their admission evidence is suspended
until the food-loop controller is recertified and the downstream worlds are rerun from that base.
Standing genetic variation remains paused behind that boundary.

The untreated resilience curve preceded mortality as Appendix G required. Mortality, replacement,
and continuity did not activate standing crop, metabolic depression, or a deeper queen reserve;
those mechanisms remain conditional rather than silently joining the evolution world.

<a id="design-order"></a>

## Cross-category implementation order

| Order | Status                                       | Outcome                                                                                                                                                                                                                                 | Detailed owners                  |
| ----: | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
|     1 | Delivered                                    | Deterministic voxel world, energy economy, controller contract, physical cargo, lifecycle/config gates, persistence, rendering, and harness ledger                                                                                      | CTRL-01–05, ENV-01–02, EXP-01–04 |
|     2 | Delivered, isolated                          | Construction/cargo seed and full-world lifecycle/evolution mechanics exist as diagnostics but are not admitted into the current colony                                                                                                  | CTRL-07, ADV-01                  |
|     3 | Delivered; human accepted                    | One immortal omniscient pathfinding ant completes repeated external-food-to-underground-larder trips through ordinary body actions                                                                                                      | EXP-14                           |
|     4 | Implemented; human review pending            | Review the stateless sensor-limited programmed policy that passes matched five-return runs 2460–2462; the Appendix H policy and its ratio gate remain invalid                                                                           | CTRL-13, EXP-05                  |
|     5 | Backlog, blocked                             | Train one predetermined controller initialization procedure from the accepted policy, then repeat cohort and robustness evaluation                                                                                                      | CTRL-06, EXP-06–07, BIO-01–02    |
|     6 | Delivered mechanism; recertification pending | Rerun the untreated colony resilience curve from the repaired controller base                                                                                                                                                           | BIO-03, EXP-08                   |
|     7 | Conditional, not admitted                    | Add a standing crop, metabolic depression, or deeper queen reserve only for a measured viability failure                                                                                                                                | BIO-04–06, ENV-06                |
|     8 | Delivered mechanism; recertification pending | Recheck mortality and queen upkeep alone across varied worlds                                                                                                                                                                           | BIO-07, EXP-09                   |
|     9 | Backlog                                      | Demonstrate that physical caching extends survival through an imposed food gap                                                                                                                                                          | BIO-08, EXP-09                   |
|    10 | Delivered mechanism; recertification pending | Recheck worker reproduction; keep brood transport isolated unless replacement requires it                                                                                                                                               | BIO-09–11                        |
|    11 | Delivered mechanism; recertification pending | Recheck larval rearing and edible brood; keep microclimate and exposure isolated                                                                                                                                                        | BIO-12–13, ENV-07                |
|    12 | Delivered mechanism; recertification pending | Re-establish demographic continuity from physical gathering through matured-worker replacement                                                                                                                                          | BIO-14, EXP-09, ADV-02           |
|    13 | Backlog                                      | Make the certified colony loop independently reviewable in the web app                                                                                                                                                                  | BIO-15                           |
|    14 | Backlog                                      | Measure food and homing path efficiency without putting pathfinding inside the evolving controller                                                                                                                                      | EXP-10                           |
|    15 | Delivered / backlog                          | Evolutionary health, conservation-correct merit, global ancestry, founder-line outcomes, and durable harness series are delivered; event detection, deep lineage inspection, and checkpoint-linked replay remain later observation work | ADV-03, EXP-11–12                |
|    16 | Backlog                                      | Admit genetic variation alone, then the diverse-sire and mutation portfolio safeguards                                                                                                                                                  | ADV-04–06, CTRL-08–09, BIO-16    |
|    17 | Backlog                                      | Admit sustainable colony founding and repeated collapse/recovery on one shared map                                                                                                                                                      | ADV-07, BIO-16                   |
|    18 | Backlog                                      | Reintroduce optional excavation and spoil; compare dug colonies with the authored control on colony ledgers                                                                                                                             | ENV-08–11, ADV-08, EXP-13        |
|    19 | Backlog                                      | Admit decay, seasons, and stronger liabilities one at a time; preserve an ordinary viable region                                                                                                                                        | ADV-09, ENV-07                   |
|    20 | Backlog                                      | Add within-lifetime plasticity and developmental reaction norms; observe learning, assimilation, morphs, and roles                                                                                                                      | CTRL-10, ADV-10–11               |
|    21 | Backlog                                      | Add multiple-colony threats, invasion, raiding, activity-scaled pressure, and richer soil/water ecology                                                                                                                                 | ADV-12, ENV-12–13                |
|    22 | Backlog                                      | Implement linear GP and compare it with the RNN on viable-space width, evolutionary outcomes, cost, and legibility                                                                                                                      | CTRL-11–12, ADV-13               |
|    23 | Backlog                                      | Scale world computation only where target-scale profiles demonstrate need                                                                                                                                                               | ENV-14, ADV-14                   |

<a id="design-change"></a>

## Changing the design

A new supplied document is archived unchanged, entered in the coverage map, and reconciled into
the owning category sequence. It supersedes only the ideas it explicitly changes. A new mechanism,
sensor, field, or gate meaning requires a structural finding and human decision. Evidence may mark
an item OBE without deleting its provenance.
