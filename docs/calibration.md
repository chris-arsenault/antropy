# Calibration

The economy is tuned by measurement, not by knob-turning, under the
[calibration design](design/experimentation.md#experimentation-calibration).
Measurements run through the harness (ADR-0012): `pnpm harness
calibrate-colony-economy` for the current authored-nest distribution,
`pnpm harness calibrate` for the historical Release 3 axis sweep,
`pnpm harness tournament` for strategy ledgers, and `pnpm harness ladder`
for the certification rungs.
Every run lands in `frontend/harness/ledger.db` with its parameters and
git commit; the tables below are interpreted snapshots of specific runs
and are superseded by the ledger when the world changes.

## Current authored-nest energy calibration

The governing identity is exact:

`colony balance = surface-food energy gathered - all energy burned`.

Calibration evaluates a fixed controller population rather than optimizing one controller. A
controller counts as supported only when it gathers food and has positive balance in a majority of
shared worlds. The aggregate records the supported fraction, positive episode fraction, median and
worst controller balances, and correlation between gathering and balance. Programmed and recurrent
controllers use the same world and action costs.

The fixed population contains distinct trained snapshots plus deterministic Gaussian perturbations
of a named training result. Profile syntax is
`name:energy-scale:work-scale:signal-scale[:food-density-scale:food-scent-scale]`. Food and tank
energy scale together, preserving normalized hunger and the meal/tank ratio. Work scale covers
basal, sensing, thinking, movement, carrying, food pickup, and food deposit. Signal scale is an
additional multiplier on pheromone deposition.

### Search result

| Evidence                                      | Programmed median | Supported controllers | Controller median | Gathering/balance correlation |
| --------------------------------------------- | ----------------: | --------------------: | ----------------: | ----------------------------: |
| Run 908, former defaults                      |            +1.823 |                   0/9 |            -3.086 |                        -0.137 |
| Run 910, food and tank ×4                     |           +11.447 |                   1/9 |            -2.526 |                        -0.219 |
| Run 912, work cost ×1/4                       |            +3.156 |                   0/9 |            -0.604 |                        -0.206 |
| Run 914, signal cost ×1/16                    |            +1.823 |                   0/9 |            -1.458 |                        +0.566 |
| Run 920, combined candidate on mapping worlds |           +26.181 |                 19/19 |            +6.485 |                        +0.811 |
| Run 921, same candidate on untouched worlds   |           +62.161 |                 10/19 |            +1.102 |                        +0.834 |
| Run 922, food density ×2 on untouched worlds  |           +86.142 |                 18/19 |            +1.881 |                        +0.608 |
| Run 923, food scent ×2 instead                |           +76.569 |                 12/19 |            +1.611 |                        +0.320 |
| Run 929, rescaled absolute energy unit        |            +7.918 |                 12/19 |            +0.258 |                        +0.949 |
| Run 930, installed defaults, same worlds      |          +105.366 |                 18/19 |            +4.057 |                        +0.989 |

No one-axis change established a viable controller population. The combined candidate did, and the
untouched-world comparison isolated food encounter frequency as the remaining environmental term.
Doubling density widened support; doubling scent strength did not and was rejected.

### Installed defaults and certification

| Tunable                             |   Former |  Installed |
| ----------------------------------- | -------: | ---------: |
| `ENERGY.foodEnergy`                 |      0.3 |        2.4 |
| `ENERGY.max`                        |        1 |          8 |
| `ENERGY.basalPerTick`               | 0.000012 |  0.0000015 |
| `ENERGY.stepCost` / `carryStepCost` |  0.00003 | 0.00000375 |
| `ENERGY.sensorUpkeep`               |  0.00001 | 0.00000125 |
| `ENERGY.thinkCostScale`             |      0.1 |     0.0125 |
| `ENERGY.depositCostPerUnit`         |    0.002 |  0.0000625 |
| food pickup / deposit cost          |   0.0001 |  0.0000125 |
| `FOOD_GOVERNOR.targetCount`         |      800 |       1600 |
| `FOOD_GOVERNOR.maxSpawnPerPass`     |       20 |         40 |

Run 924 uses the installed defaults without effective changes on ten new worlds. It supports 19/19
fixed task-capable and perturbed recurrent controllers; every controller is positive in at least
6/10 worlds. Median controller balance is `+5.677`, the worst controller median is `+1.749`, the
positive-episode fraction is `0.853`, and gathering/balance correlation is `+0.600`. The programmed
reference is positive in 10/10 with median `+111.360`.

Run 930 repeats the complete 19-controller distribution on ten further unseen worlds. It supports
18/19 controllers, with median controller balance `+4.057`, positive-episode fraction `0.874`, and
gathering/balance correlation `+0.989`. The one unsupported controller is one of four perturbations
at sigma `0.06`; the other three at that radius pass. The programmed reference is positive in 10/10,
with median `+105.366` and worst-world balance `+4.582`.

Runs 925 and 931 extend a baked controller and the programmed reference to 2,500 ticks on separate
ten-world cohorts. In run 925 both are positive in 10/10, with medians `+8.966` and `+114.589`. In
run 931 the baked controller is positive in 8/10 with median `+6.480`; the programmed reference is
positive in 10/10 with median `+113.411` and worst-world balance `+23.503`.

Run 929 tested an apparently scale-equivalent representation: divide food, tank, and every ant work
cost by eight. It supported only 12/19 controllers on the same worlds used by run 930. The
representation was not equivalent because colony transfer thresholds, rates, stockpile quantities,
and queen costs use absolute energy units. It was rejected; the installed `2.4/8` food/tank scale is
part of the measured environment, while sensor fixtures express energy as a fraction of tank and
genome-derived storage.

The raw initial clone also became viable (`+5.745`, 6/10, run 926), but only 6/13 perturbations
around it passed (run 927). Doubling density again preserved the 6/13 result while increasing
runtime (run 928). Runs 924 and 930 therefore established a broad viable region in the former nest
geometry. After the authored-network surface-breach repair, runs 1045–1054 recheck the programmed
reference on ten new worlds: all are positive, median balance is `+119.445`, worst balance is
`+76.325`, and every world retains a physical cache. Recurrent distributional certification awaits
controllers trained in the repaired fixture.

### Initial-training width

The environmental result does not imply that supervised behavior cloning lands broadly inside the
viable region. Runs 932–939 trained eight full recurrent controllers from independent random
initializations against one shared oracle corpus. Their held-out sequence losses were similar, but
run 941 supported only 1/8 controllers on unseen colony worlds. The following controlled changes did
not establish a broad cohort:

| Training change                  | Training runs | Closed-loop result                                |
| -------------------------------- | ------------- | ------------------------------------------------- |
| More supervised epochs           | 942–946       | 1/4 supported (run 947)                           |
| Full-population demonstrations   | 948–952       | 0/4 supported (run 953)                           |
| Corpus-balanced rare actions     | 954–965       | At best 2/4; 2/20 complete loops (runs 966–967)   |
| Validation-loss selection        | 968–972       | 2/4 supported (run 973)                           |
| Successful teacher worlds only   | 974–978       | 0/4 supported (run 979)                           |
| Longer recurrent chunks/training | 980–984       | 0/4 supported (run 985)                           |
| Behavioral parameter noise       | 986–990       | 2/4 supported; 3/20 complete loops (runs 991–992) |

Teacher-trajectory loss is therefore a diagnostic, not the initial-training acceptance metric.
These controller runs predate the sealed authored-nest fixture and are now historical evidence for
the training-method decision.

### Appendix F initial-training result

Appendix F removed the oracle's persistent state by adding parallel vertical sensing, deep-source
homing, absorbed colony odor, contact marking on handled food, and phasic scent readings. The
resulting zero-state oracle completes the forage and forced cache-retrieval assays in 16/16 worlds
each (runs 1719–1750). Four independent 12-unit RNNs were then cloned with the same corpus,
training budget, and selection procedure. On one shared 16-world held-out panel they completed
14, 12, 7, and 8 loops respectively (runs 1754–1759). Two of four clear the 75% per-controller
floor; at that checkpoint Appendix E step 10 remained open.

Run 1760 measures whether the leading clone is an isolated peak using the production mutation
operator and eight fresh worlds per sample. All four mutants retain the gate at normalized sigma
`0.05` and `0.1`; two of four retain it at `0.25` and `0.5`; one of four retains it at `1.0`.
The curve declines rather than collapsing at the first perturbation. That supports retaining the
current RNN substrate, but it does not replace the cohort gate with selection of the best clone.

Run 1783 then showed that the inherited terminal search was itself the wrong continuation: 24
generations and up to 1,152 long episodes took 42.9 minutes and reduced completion from 13/16 to
10/16. Appendix E step 10 now uses one balanced same-frame distillation procedure for every
predetermined initialization. The initializer resets hidden state per frame and leaves recurrence
at zero; the recurrent loci remain available to later mutation. A separately fixed, previously
unused 16-world panel judges the cohort once. Teacher loss and one controller's peak score remain
diagnostics, not acceptance criteria.

The fixed execution passes without changing the environment. Four starts trained in 138.6 seconds
total (runs 1784–1788). They complete 14/16, 13/16, 12/16, and 14/16 loops on new worlds
22000–22015 (run 1789). A required robustness check found only 5/8 baseline completions for the
first controller on worlds 24000–24007, so run 1792 applied that panel to the whole unchanged cohort:
5/8, 5/8, 7/8, and 8/8. Combined 24-world totals are 19, 18, 19, and 22, leaving all four at or above
75% without retraining. On separate energy worlds 23000–23015, all four gather food and satisfy the
majority-positive rule; their median balances are `+52.875`, `+38.393`, `+26.614`, and `+117.701`,
with 63/64 positive controller-world episodes and gathering/balance correlation `0.999` (run 1790).
The programmed reference remains positive in 16/16 with median `+99.254` and worst `+70.427`.
Run 1790's 973.6-second wall time is full-population measurement cost across 80 episodes, not
training time.

## Historical Release 3 method

An economy point fixes the three sampled axes — food density
(`FOOD_GOVERNOR.targetCount`), meal size (`ENERGY.foodEnergy`), and energy
inflow (`FOOD_GOVERNOR.maxSpawnPerPass`) — which together drive ratios R1,
R2, R3, R5b, and R7. Each point runs one colony for 4000 ticks under the
certified rung-2 sensor-limited oracle (see [ADR-0009](adr/0009-oracles-outside-the-contract.md)),
producing a survival/delivery ledger. One-at-a-time excursions (×1/4, ×2)
around the defaults measure the viable-region margin on each axis
independently. Points that fail world-creation preconditions (R7 closure)
are recorded as inviable rather than run.

## Historical measured region (seed 9100, 4000 ticks, rung-2 oracle)

| Point           | Outcome  | Ants | Merit | Stockpile | R1   | R2   | R3  | R7  |
| --------------- | -------- | ---- | ----- | --------- | ---- | ---- | --- | --- |
| defaults        | survived | 32   | 542   | 6.9       | 45.8 | 0.20 | 1.3 | 157 |
| foodTarget ×1/4 | survived | 27   | 551   | 6.9       | 23.1 | 0.20 | 0.7 | 157 |
| foodTarget ×2   | survived | 33   | 549   | 7.1       | 67.9 | 0.20 | 2.0 | 157 |
| foodEnergy ×1/4 | survived | 24   | 523   | 6.4       | 11.7 | 0.05 | 1.4 | 39  |
| foodEnergy ×2   | survived | 31   | 554   | 7.2       | 92.7 | 0.40 | 1.4 | 314 |
| spawn ×1/4      | survived | 22   | 544   | 7.0       | 45.9 | 0.20 | 1.3 | 39  |
| spawn ×2        | survived | 29   | 546   | 7.0       | 46.3 | 0.20 | 1.3 | 314 |

Every excursion survived with continuous delivery under the Release 3 world. That historical
conclusion was superseded by the authored-nest controller-distribution calibration above.

## Historical oracle-vs-seeded gap (defaults, seed 9100, 4000 ticks)

| Driver            | Outcome  | Ants | Merit | Stockpile |
| ----------------- | -------- | ---- | ----- | --------- |
| rung-2 oracle     | survived | 32   | 542   | 6.9       |
| seeded controller | survived | 16   | 428   | 1.0       |

Both survive. The gap is provisioning surplus, not viability: the seeded
colony holds half the oracle's population and pins its stockpile at the
`queenReserve` floor (1.0), while the oracle banks a 6.9 surplus. Closing
that gap was the derived-seed portfolio's target (ADR-0010). This table predates both the
in-vivo-derived forager now baked into the controller and the Release 3 liability set; use the
tournament below and the harness ledger for current-economy evidence.

## Bootstrap tournament (§B.8, ADR-0011 — seed 4200, 28k ticks)

Strategies share one forager script and differ in asset placement; the
harness digs the architect's vault and the queen descends with it
(ADR-0009). Ledgers per §B.8.2:

| Strategy                                | Worker-days | Merit | Egg survival | Vault |
| --------------------------------------- | ----------- | ----- | ------------ | ----- |
| O-surface (queen and hoard in the open) | 284         | 2027  | 56%          | 0     |
| O-shelter (founding chamber)            | 633         | 1979  | 88%          | 0     |
| O-architect (vault target 10)           | 333         | 1657  | 100%         | 10    |

Measured after interface legalization (Appendix C: the nest-bearing
inputs removed; homing rides the nest-scent plume). Legalization fixed
the master ledger: under the compass, O-surface out-earned every
sheltering strategy on worker-days — the illegal sense was subsidizing
surface foraging.

Under the brood-as-capital economy (M4.75 — larvae reared on stockpile
feedings; ledger runs 5–10, 28k ticks, seed 4200): O-surface 208
worker-days / 42% brood and its colony collapses by season's end;
O-shelter 435 / 87% and survives; O-architect 278 / 58% with a
9-layer vault. Underground chamber life strictly dominates surface
living on the master ledger. Construction now competes with larval
rearing for the same stockpile, and at current prices the deep vault is
a net-negative purchase — an honest tradeoff surface, left for future
climate/raid pressure to reprice. The ladder re-certifies world and
interface with the brood pipeline in place (rung-2: 28 ants, 94% brood
at 8k ticks).
