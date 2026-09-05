# Feature backlog

This is the high-level queue. Detailed implementation order, biological rationale, acceptance
conditions, and OBE work live in [the normalized design](design/README.md). Evidence belongs in
[certifications](certifications.md) and [calibration](calibration.md).

<a id="backlog-colony"></a>

## Living colony and resilience

- Measure the colony resilience baseline and add attributable ecological floors.
- Certify survival and the value of physical food storage under scarcity.
- Close the queen, brood-rearing, and worker-replacement loop in the authored nest.
- Make the resulting colony state independently reviewable in the web app.

Details: [colony biology BIO-03–BIO-15](design/colony-biology.md#colony-order) and
[experimentation EXP-08–EXP-10](design/experimentation.md#experimentation-order).

<a id="backlog-evolution"></a>

## Evolution readiness

- Add population-health instruments and conservation-correct germ-line accounting.
- Admit genetic variation to the certified colony and add diverse, mutation-tolerant founder
  portfolios.
- Establish sustainable multi-colony founding and collapse/recovery without measured-run rescue.

Details: [advanced systems ADV-03–ADV-07](design/advanced.md#advanced-order) and
[controller CTRL-08–CTRL-09](design/controller.md#controller-order).

<a id="backlog-morphogenesis"></a>

## Evolved environment and morphogenesis

- Return excavation as optional expansion and compare dug colonies with the authored control.
- Admit nest maintenance, seasons, weather, and stronger liabilities one mechanism at a time.
- Add activity-scaled threats, inter-colony pressure, and richer soil/water ecology after multiple
  colonies persist.

Details: [environment ENV-08–ENV-13](design/environment.md#environment-order) and
[advanced systems ADV-08–ADV-12](design/advanced.md#advanced-order).

<a id="backlog-learning"></a>

## Learning, development, and controller diversity

- Add metabolically priced within-lifetime plasticity with evolvable motivation.
- Add genomic developmental reaction norms and observe whether morphs and task allocation emerge.
- Implement linear genetic programming behind the controller contract and compare it with the RNN.

Details: [controller CTRL-10–CTRL-12](design/controller.md#controller-order) and
[advanced systems ADV-10–ADV-13](design/advanced.md#advanced-order).

<a id="backlog-observation"></a>

## Observation and scale

- Add event-driven observation, headless burst runs, checkpoint-linked replay, and deeper lineage
  inspection.
- Profile target-scale worlds and optimize scent, decay, storage layout, WASM, or GPU paths only
  where measurements identify a bottleneck.
- Add cloud-stored checkpoints only with an explicit platform/authentication design decision.

Details: [experimentation EXP-11–EXP-13](design/experimentation.md#experimentation-order) and
[environment ENV-14](design/environment.md#environment-order).
