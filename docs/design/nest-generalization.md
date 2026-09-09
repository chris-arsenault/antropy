# Nest generalization

Status, September 8: this RNN study and its unfinished recovery branches are canceled at the
user's request. The protocol and results below are historical; they do not authorize continuation.
The next work is [the 2,000-worker milestone](colony-scale.md) with programmed/LGP ants.

Before cancellation, the September 8 correction superseded the initial PPO-only protocol with
task-labelled curriculum, retained learner-error replay and subsequent survival PPO from the
historical pre-task initializer. The frozen v5 model and its PPO descendants were comparison
artifacts only. The [training recovery audit](training-recovery.md) records that work; separate
specialist networks and weight recombination were not used in the earlier win.

The September 7 controlled transfer panel found the frozen RNN viable in 3/3 original nests,
2/3 narrow nests and 0/3 compact nests. Programmed controls passed 2/3, 3/3 and 3/3 respectively.
This study trains shared weights across nest geometry while holding original physical rules fixed.
It does not change gravity, light, energy costs, sensors, actions, task vocabulary or network shape.

## Initial protocol declared before fitting

`harness/nestGeneralization.ts` defines six training layouts, three validation layouts and six
reserved test layouts. Nest seeds and food/random seeds are independent. Seed zero preserves an
authored layout; other nest seeds vary horizontal scale, depth, room radii, reflection, lower room
positions and redundant graph edges. Queen and cache retain physical cells and local signals.
Graph connectivity is preserved during generation. The graph is never an actor input.

Training includes the original reference and compact layouts plus four generated layouts.
Validation and test contain entirely different generated layouts and food seeds. Test worlds stay
reserved until weights are frozen. This measures unseen layouts from the same generator families;
it does not establish transfer to arbitrary digging, tiers or different physics.

The initial, now superseded approach began with the previously successful 64-state RNN, eight private register values, four motor-history
slots and a 16-wide shared directional encoder. Run physical-outcome PPO for 24 updates of 2,048
ticks per world, temperature 0.25, learning rate 0.00005, entropy 0.0025, gamma 0.9995 and trace
0.9997. Inspect the resulting physical trajectories in training. Evaluate the frozen result on
validation, alongside the previous weights and programmed controls. One further 24-update run or
an alternative exploration temperature is allowed before selecting by validation viability count,
then minimum outcome score, then mean score. If exploration fails structurally, document the
failure before changing the training method; never weaken the outcome gates to claim success.

The PPO reward remains physical queen feeding, brood feeding, births and reserves, queen death
penalty and a terminal viability bonus. No movement, imitation, cargo, pickup or drop reward enters
PPO. All training requests carry complete immutable world configs. Rollout credit keys on a
Float32-exact world-case identity and worker identity, so repeated food seeds cannot merge memories
or returns from different nests.

Every selection and final evaluation starts at tick zero with no teacher warmup, task clamp or
programmed fallback. A pass requires 48,000 ticks (three founder lifetimes), living queen and
descendants, continuing queen/brood feeding and births in both late windows, and conserved energy.
Programmed controls run the same cases. Report every failure, including queens surviving after
worker extinction. Save full configs, seeds, weights, source hashes, time series and ledger rows.

After selection, evaluate reserved worlds once, prepare the frozen candidate at tick zero for human
review, and stop. Numerical viability does not certify motion. Genetics and further ecology wait.

## Development observations

The programmed controller passes all three declared validation layouts. The old RNN loses all
workers on the first two completed layouts. After five PPO updates the training policy still has
low mean action/register entropy (roughly 0.1 nats) and declining populations in several unfamiliar
nests. The planned alternative arm therefore starts from the same original weights with temperature
0.5 instead of 0.25. It uses the same six training worlds, optimizer settings and 24-update budget.
This tests exploration without changing the reward or physical interface. Both arms are selected
by independent full-horizon validation after training; test outcomes remain unopened.

The old RNN completes validation at 0/3, with worker extinction in every case. An intermediate
12-update transfer checkpoint is also evaluated to detect whether later updates erase a useful
policy. This adds a frozen validation candidate, not another training arm. The fixed browser-review
rule is the first compact test layout regardless of outcome, avoiding selection of a favorable map.

The transfer arm completed 24 updates (run 2661); the exploration arm was stopped after 18
completed updates at the user's correction. Their midpoint validation results are 1/3 (2658–2660)
and 2/3 (2662–2664), respectively. These improvements remain recorded, but neither arm restores
the requested training recipe. No reserved test outcomes have been collected. The new curriculum
is under `frontend/harness/artifacts/nest-generalization-2026-09-08/task-curriculum`.
