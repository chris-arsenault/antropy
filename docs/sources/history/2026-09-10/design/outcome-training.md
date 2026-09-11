# Recurrent colony training from physical outcomes

The bounded outcome-training study failed fresh-world survival. No learned model is promoted.

The September 7 user decision replaces action imitation as the optimization objective. Previous
teacher agreement could reward copying an unhelpful turn and could not teach an alternative that
kept a colony alive. This experiment retains the local recurrent actor and frozen physical world,
but selects weight changes using colony outcomes. Gravity, new ecology and in-world inheritance
remain outside the experiment.

## Objective and acceptance

The evaluator observes actual worker and queen reserves, funded brood reserves and investment,
adult births, founder turnover, recipient feeding and conservation. Pickup counts, deposited
quantities, stockpile positions, movement, scent emission and teacher agreement earn no reward.
An arbitrary pile cannot masquerade as delivery: feeding counts only after the ordinary physical
resolver transfers food into a queen or larva. No private measurement enters actor inputs.

Conservation errors invalidate a run. Every queen-alive endpoint outranks every queen-dead endpoint.
Full viability outranks both. Viability requires at least three worker lifespans (48,000 ticks),
living descendants and queen survival throughout the final lifespan, no remaining founders, and
new adult births plus queen and larval feeding in each of its two 8,000-tick halves. There is no
eight-worker target. These are finite-horizon checks; they do not establish indefinite survival.

Before viability exists, a bounded shaping score uses queen lifetime and average reserve, average
worker/brood energy, actual recipient feeding, and adult recruitment. These terms can help exploration but are not substitutes
for viability. No amount of shaping rescues a dead queen or certifies a short run. Stored food
does not increase that score. Development measurements must expose when a score rises while
queen feeding and replacement remain absent.

The final protocol includes a matched programmed control, fresh-world evaluation and external-food
deprivation. Deprivation removes exterior food and renewal while preserving already carried and
interior food; removed energy is explicitly reconciled. A prospective survivor must depend on
continued physical food supply. Perturbation tests follow only if there is a viable center.

## Initial search protocol

The initial actor is the archived final directional RNN with four-command history. Its existing
weights are initialization, not a successful policy or a source of action targets. An explicit
initializer adds the carrying global input with zero weight and exports current artifact version 4.
A deterministic test verifies unchanged initial recurrent inference. All actor parameters,
including recurrent weights, remain mutable. Hidden and command states stay private to each worker.

The first outcome search uses training seeds 1–2 for 20,000 ticks, twelve mirrored perturbations
per generation, eight generations and three local simulation processes. Select the worst-world
score first, then mean score as a tie-breaker; retain the incumbent if no candidate improves it.
Perturbations are larger at readout weights and biases than at internal weights to explore action
choice without immediately destroying the inherited representation. These are optimization choices,
not physical changes or an in-world genetic system. All generation artifacts and candidate outcomes
are recorded, including unsuccessful candidates. The output directory cannot overwrite an existing
search.

Search A stopped after its first generation (runs 2576–2577). All twelve candidates on both
worlds had zero queen feeding, zero births, and extinction, producing identical scores of
20.9091. Earlier worker energy differed, but the original terminal-reserve term discarded those
differences. No further generations were justified by that objective.

Outcome version 2 uses average biological reserves and bounded real queen/larval transfers as
early learning signals. Queen-alive and viability tiers are unchanged. Search B starts with
8,000-tick training worlds, eight candidates per generation and four generations. Short-horizon
progress cannot pass the survival gate. A generation in which every candidate ties the incumbent
now stops automatically. These are changes to training credit, not to the simulated economy.

Search B (runs 2579, 2580, 2582, 2584 and 2586) raised the worst-world score from 136.1516 to
136.4400. No candidate fed a queen or larva or produced an adult. The last two generations did
not improve the incumbent. Development audit 2583 found 50,704 loaded commands but zero loaded
recipient contacts; the colony was extinct at tick 20,000. The change produced worker-reserve
credit without establishing the return and care loop.

The next curriculum starts from ordinary programmed worlds at tick 8,000 and hands every worker
to the same RNN for 4,000 ticks. Recurrent state starts empty; all physics and physical resources
are retained. There are no programmed actions after takeover and no action targets during fitting.
Search C uses seeds 1–2, six candidates and three generations. It must transfer to fresh worlds
before it can be considered useful beyond this assisted condition.

Assisted starts are always ineligible for viability, even at long horizons. Learning credit excludes
feeding and births before takeover. Subsequent hatches may still come from previously funded brood;
they do not establish independent replacement. Probe 2585 records actual RNN transfers of 7.8686
queen energy and 0.5535 larval energy during 2,000 ticks after an 8,000-tick programmed start.
It also records 51 loaded recipient contacts. This establishes access to care situations, not
fresh-world survival or learned foraging. The two hatches during the probe include inherited brood.

Curriculum generation 1 (2588) improves actual care on both worlds. Queen intake during neural
control changes from 13.8291/5.6648 to 13.8860/11.2500; larval intake changes from 8.0800/2.9245
to 13.6330/11.0250. The next transfer probe reduces programmed preparation from 8,000 to 2,000
ticks and increases neural control to 6,000 ticks. This tests dependence on established stores
before spending a final fresh-world evaluation.

Search C ends at that generation-1 incumbent (2590–2591 do not improve it). Fresh probe 2592
removes preparation and records zero queen feeding, larval feeding and births on both training
worlds at 8,000 ticks. Search D (2593–2595) then uses 2,000 programmed ticks followed by 6,000
neural ticks, six candidates, two generations and mutation seed 2701. Its final post-takeover
queen intake is 14.3800/19.5763 and larval intake is 1.3451/0.2205. The worst-world score improves
from 148.2262 to 151.1173, but the last selection sacrifices larval intake on seed 1 for a small
worst-world improvement. It is not a uniform improvement across care outcomes.

Across A–D, 74 mutated candidates were evaluated on two training worlds each, plus the four
incumbent baselines. Search A also incurred interrupted, unrecorded work in its second generation
before the flat first-generation result was diagnosed. No further fitting uses the reserved final
seeds. The frozen candidate is search D generation 2; fresh 48,000-tick evaluation has no programmed
preparation or fallback.

## Frozen fresh-world result

The final candidate fails all three reserved seeds at 48,000 ticks (2596–2598). Every queen and
worker is dead, with zero queen feeding, larval feeding and adult births. All three time series
first record complete extinction at tick 16,000. Conservation residual magnitudes stay below
6.5e-9 at the endpoint. Final model hash is
`36bc4a649f57256fd2cb7ac2f9850724e64f94dcb179a340531ffd1146c2b8bf`.

| Seed | Loaded commands | Loaded recipient contacts | Queen intake | Adult births | Viable |
| ---: | ---: | ---: | ---: | ---: | :--- |
| 31 | 64,854 | 0 | 0 | 0 | No |
| 32 | 33,205 | 0 | 0 | 0 | No |
| 33 | 36,660 | 0 | 0 | 0 | No |

Matched programmed controls on these exact seeds pass all three worlds (2599–2601), using the
same physics digest and 48,000-tick horizon. Final populations are 20/16/20, adult births are
57/38/52, and queen intake is 165.4975/151.4494/165.0947 energy units. All founders are gone;
queen and larval feeding and births continue in both late half-life windows. Final conservation
residual magnitudes are below 8e-9. These controls isolate controller failure on the final panel;
they still do not certify visual motion.

No loaded command in these runs had cargo below 1e-6 quantity; the failed returns cannot be
attributed solely to negligible residual loads. Mean cargo during loaded commands is about
1.8 quantity. Counts of pickup attempts and motion are diagnostics, not evidence of food reaching
a recipient. Stored food remains in two extinct worlds and does not rescue their score.

The structural finding is failure to transfer return behavior from established physical colonies
to fresh starts. The RNN can perform real care when reachable resources and recipients already
exist, but these searches do not establish a complete independent foraging and replacement loop.
The result does not show that local sensing is insufficient or that an RNN cannot represent the
programmed solution. It shows failure of this initializer and bounded outcome-search curriculum.
Additional random weight search against assisted scores is not justified by these results.

A subsequent learning experiment should expose progressively earlier physical return situations
while withholding established interior stockpiles, retain real recipient outcomes as credit, and
require fresh-start transfer before extending the budget. Snapshot selection belongs only to the
training harness; workers must still receive ordinary local frames. This is a proposed experiment,
not an implemented change or a guarantee of viability. Gravity and broader ecology remain separate.

Models, candidate reports and final evaluations are preserved under
`frontend/harness/artifacts/outcome-2026-09-07/`. No failed model replaces the programmed browser
default. Mutation-radius and visual certification of a learned colony remain unperformed because
there is no viable center to certify.

Final `make ci` passes 66 bounded tests in 20 files, lint, formatting, TypeScript, documentation
and Terraform formatting. The existing optional-property lint warning in `directionalModel.ts`
remains. No development server, deployment, gravity change or in-world genetics was added.

Programmed control run 2578 passes the 48,000-tick gate on development seeds 4–6. Final populations
are 22, 20 and 20, with 56, 57 and 57 adult births and no founders. Real queen intake is
165.58, 165.63 and 165.72 energy units; conservation residual magnitudes are below 1.6e-8.
Matched food-loss run 2581 removes exterior food and renewal at tick 16,000. All three colonies
are extinct at tick 48,000 despite 13.58–25.06 energy units remaining in interior food. Corrected
conservation residual magnitudes are below 6.5e-9. Inaccessible stockpiles do not count as survival.

Development seeds 4–6 are already known and may guide diagnosis. Seeds 31–33 are reserved for the
frozen final candidate at 48,000 ticks. Do not open them for tuning. Failure to improve actual care
calls for a named exploration or representation diagnosis, not relabeling imitation accuracy or
stockpiles as success. No artifact is automatically installed as the browser default.

## Commands

From `frontend/`:

```bash
pnpm harness colony-optimize --initial harness/artifacts/directional-2026-09-07/final-history.json --output /tmp/antropy-outcome-search --seeds 1,2 --ticks 20000 --pairs 6 --generations 8 --jobs 3
pnpm harness colony-outcomes --model harness/artifacts/outcome-2026-09-07/antropy-outcome-search-d/generation-2.json --seeds 31,32,33 --ticks 48000
pnpm harness colony-outcomes --seeds 4,5,6 --ticks 48000
```

`colony-outcomes --deprivation 16000` performs the external-food-loss control. The historical
`optimize-rnn` command remains an immortal single-forager diagnostic with pickup/movement proxies;
it is not used for this colony experiment.
