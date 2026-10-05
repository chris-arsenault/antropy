# Four-exploration ablation

October 5, 2026. The native run can disable the installed mechanisms reconsidered by four
incomplete exploration groups: [local mortality feeding](design/local-mortality-feeding.md),
[chemical keys and broad processing](design/chemical-key-specialization.md),
[light, shade and emission usefulness](design/light-usefulness.md), and
[vocalization and strategic control](design/vocalization-and-strategy-usefulness.md).
This configuration does not complete those designs or assert that the mechanisms are useless.

## Run controls

[The all-off patch](../config/explorations-off.json) disables mortality recovery, starts radial
recognition, removes geographic light attenuation/ceilings, and disables photoreception,
cover building, light emission, vocalization and slow strategic control. Founders and
descendants have no body allocation to disabled organs. The corresponding actions and cues
are gated. Strategy contributes no context, learning modulation, inference, learning debit or
additional controller upkeep. Ordinary reflex learning remains enabled at its neutral rate.
External solar transformation work, ordinary death spill, chemistry, source supply, terrain
motion/conductance and seasons retain their governing laws.

The five `features` booleans default to true and can be switched independently. Existing
`mortalityRecovery`, `radialFounders` and `terrain` controls supply the other ablations.
Controls select a fresh world through the existing native operator restart; they do not
refit a living population. The existing state serialization carries the effective config.
The config shape advances physical format to v53; no save migration or browser settings
interface is added.

From the repository root, after CI/CD has deployed the controls:

```bash
with-cred -- python3 frontend/harness/native_run.py --config config/explorations-off.json --output frontend/harness/artifacts/explorations-off-NEW
```

The helper preserves the running world's seed and complete effective config before merging
the patch. To restart with one feature restored, use the same helper with an override, for
example `--set features.strategy=true`, and a new local output directory. It records the
requested and effective settings and never retries an uncertain operator command. Other
installations provide `BIOTROPY_TOKEN` through their ordinary environment.

## Bounded operating question

Question: what funded growth, turnover and colony behavior remain when all four groups are
absent? The competing explanations are that their costs currently dominate their benefits,
that they sustain opportunities not established by earlier reviews, or that their removal
leaves the observable world largely similar. A combined ablation cannot identify which group
causes a difference. Initial conditions are ordinary seed27/chemistry101 founders with the
live world's supply and other settings; only the declared controls change.

First calculate newborn resource budgets without advancing ticks and run one bounded native
startup check through source turnover. Then start the continuing server world and observe up
to two wall hours, with operating samples every ten minutes. Keep generated evidence local.
Use funded growth, divisions/deaths, actual chemical flows and temporally linked habitat
movement; population and visual appearance alone do not establish adaptive benefit.
Report exchange or founding as unmeasured when temporal coverage cannot establish them.

Stop bounded collection at its horizon, extinction, execution failure or resource cap; do not
expand seeds, sweep parameters or extend the observation to obtain a preferred ecosystem.
An extinct startup warrants a separately explained configuration decision, not idle sampling
of an empty world. The selected populated server world remains running after collection.
Long observation does not block implementation/deployment completion.

Execution is tracked by Sulion plan `80a67f96-23ed-4af7-86cd-cd252885bfff`.

## Initial implementation findings

Five focused Rust checks establish independent body-capacity removal, blocked authored optical
and speech actions, retained reflex learning without strategic context/costs, strategy working
without vocalization, and inactive organs/radial recognition through mutated births and ordinary
continuation. Existing mechanics and native management tests retain their normal gates.

The one registered ordinary native startup reached 12,000 ticks (2,400 model seconds) in about
85 wall seconds with 73 living cells, 203 divisions and 178 deaths. Population fell to nineteen
at ticks 7,000–8,000 before recovering through later births. This establishes surviving,
reproducing cells through the bounded renewal window; it does not establish indefinite viability
or attribute the recovery to an individual ablation. Feature work/event counters and mortality
recovery remained zero, with material/work accounts intact. Raw budgets, samples and the exact
effective configuration are local under `frontend/harness/artifacts/explorations-off-20261005/`.
