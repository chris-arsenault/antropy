# Documentation

## Start here

Current direction: [top-down bacteria with heritable RNN controllers](design/bacteria.md).
The [funded-body and inheritable-learning contract](design/funded-bodies.md) governs
the current evolutionary extension, including constructed machinery, acquired-weight transmission
and configurable reproduction. The [first extension](design/bacterial-evolution.md) preserves
the superseded allocation tuple and private-only learning interpretation.
The reviewed sensor/action contract is implemented. The browser starts bacteria paused at tick zero,
with live mutation enabled. [Initial measurements and limits](design/bacteria-results.md) record
reproduction, inherited variation, mixed adaptation results and capacity. Human visual review is pending.
The ant checkpoint is preserved at `780fa4e`, tagged `ant-colony-checkpoint-2026-09-09`.
The new [work order](design/README.md) supersedes ant construction and the 2,000-worker gate.
Ant-specific documents below retain historical designs and measurements. The architecture and
development guides describe the bacterial runtime.
Canceled ant-RNN campaigns remain historical; the new bacterium RNN is a separate contract.

| Need                                                | Document                                                 |
| --------------------------------------------------- | -------------------------------------------------------- |
| Governing goals and judgment                        | [Simulation principles](principles.md)                   |
| Current status and work order                       | [Normalized design](design/README.md)                    |
| Programmed colony and local physics                 | [Physical colony](design/programmed-colony.md)           |
| Learned-controller experiment and failure evidence  | [Colony training](design/colony-training.md)             |
| Shared directional network and recent-action memory | [Directional experiment](design/directional-training.md) |
| Matched float32 observations and conditional probes | [Sensory contract](design/colony-sensory-contract.md) |
| Food yield, worker activity and support limitations | [Nutritional-yield experiment](design/nutritional-yield.md) |
| Colony-outcome fitness and survival acceptance | [Outcome training](design/outcome-training.md) |
| Private task byte and registered RNN experiments | [Task memory](design/task-memory.md) |
| Material cells, compact nests, surface tiers and camera | [Cellular terrain](design/cellular-terrain.md) |
| Canonical runtime boundary                          | [2D migration contract](design/2d-migration.md)          |
| Measured evidence                                   | [Certification ledger](certifications.md)                |
| Current numeric choices                             | [Calibration record](calibration.md)                     |
| Feature-level future work                           | [Backlog](backlog.md)                                    |
| Supplied and historical material                    | [Source archive](sources/README.md)                      |

The normalized design records implementation guidance and current decisions. Source documents preserve provenance and
rejected or deferred ideas; they are not a parallel implementation plan.

## Simulation principles

- [Ordered goals](principles.md#principles-goals)
- [Author the world, not the ant](principles.md#principles-world)
- [Function judges; form describes](principles.md#principles-function)
- [Change one thing, predict, then measure](principles.md#principles-attribution)
- [Measurements outrank plans](principles.md#principles-evidence)
- [Classify changes by ownership](principles.md#principles-layers)
- [Stop conditions for tuning](principles.md#principles-stop)
- [Architectural invariants](principles.md#principles-invariants)

## Normalized design and roadmap

- [Preserved ant work order](design/README.md#design-ant-history)
- [Work categories](design/README.md#design-categories)
- [Status vocabulary](design/README.md#design-status)
- [Current boundary](design/README.md#design-current)
- [Cross-category implementation order](design/README.md#design-order)
- [Changing the design](design/README.md#design-change)

## Canonical 2D migration

- [Experimental purpose](design/2d-migration.md#migration-purpose)
- [Canonical world contract](design/2d-migration.md#migration-world)
- [Restored milestone](design/2d-migration.md#migration-milestone)
- [Verification boundary](design/2d-migration.md#migration-verification)
- [Deleted surface](design/2d-migration.md#migration-deleted)

## Controller, sensors, and embodiment

- [Goal and boundary](design/controller.md#controller-goal)
- [Controller and body contract](design/controller.md#controller-contract)
- [Sensory surface](design/controller.md#controller-senses)
- [Current policies](design/controller.md#controller-policies)
- [Initialization and future evolvable controllers](design/controller.md#controller-initialization)
- [Memory and navigation](design/controller.md#controller-memory)
- [Search and return logic](design/controller.md#controller-search)
- [Linear implementation order](design/controller.md#controller-order)
- [OBE and rejected directions](design/controller.md#controller-obe)
- [Source provenance](design/controller.md#controller-sources)

## Environment and future morphogenesis

- [World substrate](design/environment.md#environment-world)
- [Authored-nest control world](design/environment.md#environment-authored-nest)
- [Navigation and material carriers](design/environment.md#environment-carriers)
- [Configuration and action physics](design/environment.md#environment-config)
- [Resources and liabilities](design/environment.md#environment-liabilities)
- [Morphogenesis model](design/environment.md#environment-morphogenesis)
- [Linear implementation order](design/environment.md#environment-order)
- [OBE and rejected directions](design/environment.md#environment-obe)
- [Source provenance](design/environment.md#environment-sources)

## Colony biology and survival

- [Functional goal](design/colony-biology.md#colony-goal)
- [Energy and food economy](design/colony-biology.md#colony-energy)
- [Queen, brood, and replacement](design/colony-biology.md#colony-brood)
- [Homeostatic floors](design/colony-biology.md#colony-floors)
- [Reproduction and selection channels](design/colony-biology.md#colony-selection)
- [Linear implementation order](design/colony-biology.md#colony-order)
- [Historical implementations not carried forward](design/colony-biology.md#colony-delivered-later)
- [OBE and rejected directions](design/colony-biology.md#colony-obe)
- [Source provenance](design/colony-biology.md#colony-sources)

## Experimentation, harness, and certification

- [Evidence boundary](design/experimentation.md#experimentation-boundary)
- [Work loop](design/experimentation.md#experimentation-loop)
- [Oracle ladder and parity](design/experimentation.md#experimentation-oracles)
- [Calibration and comparative experiments](design/experimentation.md#experimentation-calibration)
- [Controller initialization experiments](design/experimentation.md#experimentation-training)
- [Mutational robustness and viable space](design/experimentation.md#experimentation-robustness)
- [Colony resilience curve](design/experimentation.md#experimentation-resilience)
- [Observation without prescription](design/experimentation.md#experimentation-observation)
- [Linear implementation order](design/experimentation.md#experimentation-order)
- [OBE and invalid evidence](design/experimentation.md#experimentation-obe)
- [Source provenance](design/experimentation.md#experimentation-sources)

## Evolutionary and advanced systems

- [Continuous evolution](design/advanced.md#advanced-evolution)
- [Selection signal and population health](design/advanced.md#advanced-signal)
- [Selection instrument contract](design/advanced.md#advanced-instrument-contract)
- [Genetic diversity and collapse resistance](design/advanced.md#advanced-genetic-floor)
- [Avoiding evolutionary pre-lock](design/advanced.md#advanced-prelock)
- [Within-lifetime learning](design/advanced.md#advanced-plasticity)
- [Development, roles, and castes](design/advanced.md#advanced-development)
- [Colonies, regimes, and ecological pressure](design/advanced.md#advanced-regimes)
- [Alternative controller substrate](design/advanced.md#advanced-controller)
- [Linear implementation order](design/advanced.md#advanced-order)
- [OBE and rejected directions](design/advanced.md#advanced-obe)
- [Source provenance](design/advanced.md#advanced-sources)

## Source coverage

- [Coverage method](design/source-coverage.md#coverage-method)
- [Foundational specification and principles](design/source-coverage.md#coverage-foundation)
- [Appendix A](design/source-coverage.md#coverage-a)
- [Appendix B](design/source-coverage.md#coverage-b)
- [Appendix C](design/source-coverage.md#coverage-c)
- [Appendix D and digging seed](design/source-coverage.md#coverage-d)
- [Appendix E and E2](design/source-coverage.md#coverage-e)
- [Appendix F](design/source-coverage.md#coverage-f)
- [Appendix G](design/source-coverage.md#coverage-g)
- [Appendix H](design/source-coverage.md#coverage-h)
- [Plans, notes, visual source, and ADR history](design/source-coverage.md#coverage-plans)
- [Navigate every supplied source subsection](sources/README.md#source-sections)

## Feature backlog

- [Current bacterial work](backlog.md#backlog-bacteria)
- [Living colony and resilience](backlog.md#backlog-colony)
- [Evolution readiness](backlog.md#backlog-evolution)
- [Evolved environment and morphogenesis](backlog.md#backlog-morphogenesis)
- [Learning, development, and controller diversity](backlog.md#backlog-learning)
- [Observation and scale](backlog.md#backlog-observation)

## Project records

| Topic                      | Document                               |
| -------------------------- | -------------------------------------- |
| Architecture               | [architecture.md](architecture.md)     |
| Architecture decisions     | [adr/README.md](adr/README.md)         |
| Development and commands   | [development.md](development.md)       |
| Calibration and parameters | [calibration.md](calibration.md)       |
| Certification and findings | [certifications.md](certifications.md) |
| Changelog                  | [../CHANGELOG.md](../CHANGELOG.md)     |
| Agent guide                | [../AGENTS.md](../AGENTS.md)           |

The [modular runtime design](design/modular-runtime.md) preserves the ant architecture audit.
Current boundaries follow [ADR 0018](adr/0018-bacterial-runtime.md) and the
[bacterial architecture](architecture.md).
