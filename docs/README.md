# Documentation

## Start here

| Need | Document |
| --- | --- |
| Governing goals and judgment | [Simulation principles](principles.md) |
| Current status and complete work order | [Normalized design](design/README.md) |
| Detailed evidence | [Certification ledger](certifications.md) |
| Current measurements and tuned values | [Calibration record](calibration.md) |
| Feature-level future work | [Backlog](backlog.md) |
| Preserved supplied material | [Source archive](sources/README.md) |

The normalized design owns current requirements. Source documents preserve original language and
provenance; they are not parallel plans.

## Simulation principles

[Open the governing principles](principles.md).

- [Ordered goals](principles.md#principles-goals)
- [Author the world, not the ant](principles.md#principles-world)
- [Function judges; form describes](principles.md#principles-function)
- [Change one thing, predict, then measure](principles.md#principles-attribution)
- [Measurements outrank plans](principles.md#principles-evidence)
- [Classify changes by ownership](principles.md#principles-layers)
- [Stop conditions for tuning](principles.md#principles-stop)
- [Architectural invariants](principles.md#principles-invariants)

## Normalized design and roadmap

[Open the cross-category design index](design/README.md).

- [Work categories](design/README.md#design-categories)
- [Status vocabulary](design/README.md#design-status)
- [Current boundary](design/README.md#design-current)
- [Cross-category implementation order](design/README.md#design-order)
- [Changing the design](design/README.md#design-change)

## Controller, genome, and embodiment

[Open the controller design](design/controller.md).

- [Goal and boundary](design/controller.md#controller-goal)
- [Controller and body contract](design/controller.md#controller-contract)
- [Sensory surface](design/controller.md#controller-senses)
- [Current RNN](design/controller.md#controller-rnn)
- [Initialization and seeded competences](design/controller.md#controller-initialization)
- [Memory and navigation](design/controller.md#controller-memory)
- [Search without a target signal](design/controller.md#controller-search)
- [Linear implementation order](design/controller.md#controller-order)
- [OBE and rejected directions](design/controller.md#controller-obe)
- [Source provenance](design/controller.md#controller-sources)

## Colony biology and survival

[Open the colony-biology design](design/colony-biology.md).

- [Functional goal](design/colony-biology.md#colony-goal)
- [Energy and food economy](design/colony-biology.md#colony-energy)
- [Queen, brood, and replacement](design/colony-biology.md#colony-brood)
- [Homeostatic floors](design/colony-biology.md#colony-floors)
- [Reproduction and selection channels](design/colony-biology.md#colony-selection)
- [Linear implementation order](design/colony-biology.md#colony-order)
- [Delivered but currently isolated systems](design/colony-biology.md#colony-delivered-later)
- [OBE and rejected directions](design/colony-biology.md#colony-obe)
- [Source provenance](design/colony-biology.md#colony-sources)

## Environment and nest morphogenesis

[Open the environment design](design/environment.md).

- [World substrate](design/environment.md#environment-world)
- [Authored-nest control world](design/environment.md#environment-authored-nest)
- [Navigation and material carriers](design/environment.md#environment-carriers)
- [Configuration and action physics](design/environment.md#environment-config)
- [Resources and liabilities](design/environment.md#environment-liabilities)
- [Morphogenesis model](design/environment.md#environment-morphogenesis)
- [Linear implementation order](design/environment.md#environment-order)
- [OBE and rejected directions](design/environment.md#environment-obe)
- [Source provenance](design/environment.md#environment-sources)

## Experimentation, harness, and certification

[Open the experimentation design](design/experimentation.md).

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

[Open the advanced-systems design](design/advanced.md).

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

[Open the source-to-design coverage map](design/source-coverage.md).

- [Navigate every supplied source subsection](sources/README.md#source-sections)

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
- [Plans, notes, and visual source](design/source-coverage.md#coverage-plans)

## Feature backlog

[Open the high-level backlog](backlog.md).

- [Living colony and resilience](backlog.md#backlog-colony)
- [Evolution readiness](backlog.md#backlog-evolution)
- [Evolved environment and morphogenesis](backlog.md#backlog-morphogenesis)
- [Learning, development, and controller diversity](backlog.md#backlog-learning)
- [Observation and scale](backlog.md#backlog-observation)

## Project records

| Topic | Document |
| --- | --- |
| Architecture | [architecture.md](architecture.md) |
| Architecture decisions | [adr/README.md](adr/README.md) |
| Development and commands | [development.md](development.md) |
| Calibration and measured parameter choices | [calibration.md](calibration.md) |
| Certification and historical findings | [certifications.md](certifications.md) |
| Changelog | [../CHANGELOG.md](../CHANGELOG.md) |
| Agent operating guide | [../AGENTS.md](../AGENTS.md) |
